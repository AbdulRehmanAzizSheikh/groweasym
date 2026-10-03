import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Withdrawal from "@/models/Withdrawal";
import Transaction from "@/models/Transaction";
import { sendWithdrawalDecisionMail } from "@/lib/mailer";

/**
 * Marks a pending withdrawal as paid or rejected.
 *
 * paid     -> the held amount is consumed (money has left the platform)
 * rejected -> the held amount is released back to the user's balance
 */
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id, action, note } = await req.json();
    const adminNote = (note || "").trim();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (!["paid", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await connectToDatabase();

    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }
    if (withdrawal.status !== "pending") {
      return NextResponse.json(
        { error: `This request is already ${withdrawal.status}` },
        { status: 409 }
      );
    }

    const user = await User.findById(withdrawal.user);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();

    if (action === "rejected") {
      // Give the held money back.
      user.balance += withdrawal.amount;
      user.heldBalance = Math.max(0, user.heldBalance - withdrawal.amount);
      withdrawal.status = "rejected";
    } else {
      // The held money is spent — just release the hold marker.
      user.heldBalance = Math.max(0, user.heldBalance - withdrawal.amount);
      withdrawal.status = "paid";
      withdrawal.paidAt = now;
    }

    withdrawal.adminNote = adminNote;
    withdrawal.resolvedAt = now;

    await Transaction.updateOne(
      { withdrawal: withdrawal._id },
      {
        $set: {
          status: action === "paid" ? "success" : "failed",
          note: adminNote
            ? `${withdrawal.note} — ${adminNote}`
            : withdrawal.note,
          balanceAfter: user.balance,
        },
      }
    );

    await Promise.all([user.save(), withdrawal.save()]);

    // Let the user know.
    try {
      await sendWithdrawalDecisionMail({
        to: process.env.EMAIL_USER || "",
        fullName: user.fullName,
        amount: withdrawal.amount,
        status: action,
        note: adminNote,
      });
    } catch (err) {
      console.error("Decision mail failed:", err);
    }

    return NextResponse.json({
      success: true,
      status: withdrawal.status,
      balance: user.balance,
      heldBalance: user.heldBalance,
    });
  } catch (err: any) {
    console.error("Admin withdrawal update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}