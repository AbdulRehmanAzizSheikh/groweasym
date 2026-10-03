import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

/**
 * Manual balance adjustment from the admin panel.
 *   type=credit -> add money      type=debit -> take money
 *   type=set    -> set an exact balance
 */
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { userId, amount, type, note } = await req.json();
    const value = Number(amount);

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json(
        { error: "Enter an amount greater than 0" },
        { status: 400 }
      );
    }
    if (!["credit", "debit", "set"].includes(type)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let direction = 1;
    let noteText = (note || "").trim();

    if (type === "debit") {
      direction = -1;
      if (user.balance < value) {
        return NextResponse.json(
          { error: "User does not have enough balance to deduct" },
          { status: 400 }
        );
      }
      user.balance -= value;
      noteText = noteText || "Admin deduction";
    } else if (type === "set") {
      direction = value >= user.balance ? 1 : -1;
      user.balance = value;
      noteText = noteText || "Balance set by admin";
    } else {
      user.balance += value;
      noteText = noteText || "Admin credit";
    }

    await user.save();

    await Transaction.create({
      user: user._id,
      type: direction > 0 ? "admin_credit" : "admin_debit",
      amount: Math.abs(value),
      direction,
      status: "success",
      note: noteText,
      balanceAfter: user.balance,
    });

    return NextResponse.json({
      success: true,
      balance: user.balance,
      heldBalance: user.heldBalance,
    });
  } catch (err: any) {
    console.error("Admin balance error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}