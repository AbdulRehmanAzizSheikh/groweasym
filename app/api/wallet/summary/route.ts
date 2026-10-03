import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Withdrawal from "@/models/Withdrawal";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    await connectToDatabase();

    const sumOf = async (filter: Record<string, any>) => {
      const rows = await Transaction.aggregate([
        { $match: { user: user!._id, status: "success", ...filter } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      return rows[0]?.total ?? 0;
    };

    const [totalRecharge, totalWithdraw, teamMembers, pendingWithdrawals] =
      await Promise.all([
        sumOf({ type: "deposit" }),
        sumOf({ type: "withdraw" }),
        User.countDocuments({ referredBy: user!._id }),
        Withdrawal.countDocuments({ user: user!._id, status: "pending" }),
      ]);

    return NextResponse.json({
      totalIncome: totalRecharge,
      totalRecharge,
      totalAssets: user!.balance + user!.heldBalance,
      totalWithdraw,
      teamMembers,
      teamIncome: totalRecharge,
      pendingWithdrawals,
    });
  } catch (err: any) {
    console.error("Summary error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}