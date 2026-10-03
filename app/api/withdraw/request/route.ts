import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Withdrawal from "@/models/Withdrawal";
import Transaction from "@/models/Transaction";
import { sendWithdrawalRequestMail, isMailConfigured } from "@/lib/mailer";

const MIN_WITHDRAW = Number(process.env.MIN_WITHDRAW || 100);

function payoutSnapshot(
  method: string,
  bank: Record<string, string>
): string {
  if (method === "upi") {
    return `UPI ID: ${bank.upiId || "-"}`;
  }
  return [
    `Account Holder: ${bank.accountHolder || "-"}`,
    `Account Number: ${bank.accountNumber || "-"}`,
    `IFSC: ${bank.ifsc || "-"}`,
    `Bank: ${bank.bankName || "-"}`,
  ].join("\n");
}

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { amount, method, bank } = await req.json();
    const value = Math.round(Number(amount));
    const payoutMethod = method === "upi" ? "upi" : "bank";
    const details = bank ?? {};

    if (!Number.isFinite(value) || value < MIN_WITHDRAW) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ₹${MIN_WITHDRAW}` },
        { status: 400 }
      );
    }
    if (value > 1_000_000) {
      return NextResponse.json(
        { error: "Amount exceeds the payout limit" },
        { status: 400 }
      );
    }

    if (payoutMethod === "upi") {
      if (!details.upiId) {
        return NextResponse.json({ error: "UPI ID is required" }, { status: 400 });
      }
    } else if (!details.accountHolder || !details.accountNumber || !details.ifsc) {
      return NextResponse.json(
        { error: "Account holder, account number and IFSC are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const fresh = await User.findById(user!._id);
    if (!fresh) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (fresh.blocked) {
      return NextResponse.json(
        { error: "This account has been blocked" },
        { status: 403 }
      );
    }

    if (fresh.balance < value) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Hold the amount immediately so the same balance can't be requested
    // again while this request is still waiting for payout.
    const payoutDetails = payoutSnapshot(payoutMethod, details);
    const result = await User.findOneAndUpdate(
      { _id: fresh._id, balance: { $gte: value } },
      { $inc: { balance: -value, heldBalance: value } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const withdrawal = await Withdrawal.create({
      user: fresh._id,
      amount: value,
      method: payoutMethod,
      payoutDetails,
      status: "pending",
    });

    await Transaction.create({
      user: fresh._id,
      type: "withdraw",
      amount: value,
      direction: -1,
      status: "pending",
      note: `Withdrawal request ${withdrawal._id.toString().slice(-8)}`,
      balanceAfter: result.balance,
      withdrawal: withdrawal._id,
    });

    // Save payout details for next time.
    fresh.bank = {
      accountHolder: details.accountHolder ?? "",
      accountNumber: details.accountNumber ?? "",
      ifsc: details.ifsc ?? "",
      bankName: details.bankName ?? "",
      upiId: details.upiId ?? "",
    };
    await fresh.save();

    let mailed = false;
    if (isMailConfigured()) {
      try {
        await sendWithdrawalRequestMail({
          requestId: withdrawal._id.toString(),
          fullName: fresh.fullName,
          mobileNumber: fresh.mobileNumber,
          amount: value,
          method: payoutMethod === "upi" ? "UPI" : "Bank Transfer",
          payoutDetails,
          balanceAfter: result.balance,
          createdAt: withdrawal.createdAt,
        });
        mailed = true;
      } catch (err) {
        // The request is already saved, so don't fail it — the admin panel
        // still lists it. Log loudly so the admin knows mail is broken.
        console.error("Withdrawal mail failed:", err);
      }
    }

    return NextResponse.json({
      success: true,
      withdrawalId: withdrawal._id.toString(),
      emailed: mailed,
      balance: result.balance,
    });
  } catch (err: any) {
    console.error("Withdraw error:", err);
    return NextResponse.json(
      { error: "Could not submit the request" },
      { status: 500 }
    );
  }
}