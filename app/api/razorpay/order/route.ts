import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { requireUser } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

const MIN_RECHARGE = 1;

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { amount, method } = await req.json();
    const value = Math.round(Number(amount));

    if (!Number.isFinite(value) || value < MIN_RECHARGE) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (value > 1_000_000) {
      return NextResponse.json(
        { error: "Amount exceeds the single-recharge limit" },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Payments are not configured yet" },
        { status: 503 }
      );
    }

    await connectToDatabase();

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: value * 100, // paise
      currency: "INR",
      receipt: `recharge_${user!._id}_${Date.now()}`,
      notes: { userId: user!._id.toString(), mobile: user!.mobileNumber },
    });

    // Persist first so /verify can look the amount up authoritatively instead
    // of trusting whatever the browser sends back.
    await Transaction.create({
      user: user!._id,
      type: "deposit",
      amount: value,
      direction: 1,
      status: "pending",
      razorpayOrderId: order.id,
      note: method ? `Recharge via ${method}` : "Recharge",
    });

    return NextResponse.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency },
      key: keyId,
    });
  } catch (err: any) {
    console.error("Create order error:", err);
    return NextResponse.json(
      { error: "Could not start the payment" },
      { status: 500 }
    );
  }
}