import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { requireUser } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Incomplete payment response" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keySecret || !keyId) {
      return NextResponse.json(
        { error: "Payments are not configured yet" },
        { status: 503 }
      );
    }

    // 1. Signature check.
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(String(razorpay_signature))
      )
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    await connectToDatabase();

    // 2. Find our pending transaction for this order.
    const txn = await Transaction.findOne({
      razorpayOrderId: razorpay_order_id,
      user: user!._id,
    });

    if (!txn) {
      return NextResponse.json(
        { error: "No matching order found" },
        { status: 404 }
      );
    }

    // Idempotent — if we already credited, just return success.
    if (txn.status === "success") {
      return NextResponse.json({ success: true, amount: txn.amount });
    }

    // 3. Ask Razorpay what actually happened to the payment. The client is
    //    never trusted about the amount or the outcome.
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const order = await razorpay.orders.fetch(razorpay_order_id);

    if (payment.status !== "captured") {
      txn.status = "failed";
      await txn.save();
      return NextResponse.json(
        { error: "Payment was not completed" },
        { status: 400 }
      );
    }

    // 4. Credit the amount recorded on the server-side transaction, and make
    //    sure it matches what Razorpay says it collected.
    const paidInRupees = Number(order.amount) / 100;
    if (Math.round(paidInRupees) !== Math.round(txn.amount)) {
      txn.status = "failed";
      await txn.save();
      return NextResponse.json(
        { error: "Amount mismatch — contact support" },
        { status: 400 }
      );
    }

    const fresh = await User.findById(user!._id);
    if (!fresh) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    fresh.balance += txn.amount;
    txn.balanceAfter = fresh.balance;
    txn.razorpayPaymentId = razorpay_payment_id;
    txn.status = "success";

    await Promise.all([fresh.save(), txn.save()]);

    return NextResponse.json({
      success: true,
      amount: txn.amount,
      balance: fresh.balance,
    });
  } catch (err: any) {
    console.error("Verify error:", err);
    return NextResponse.json(
      { error: "Could not verify the payment" },
      { status: 500 }
    );
  }
}