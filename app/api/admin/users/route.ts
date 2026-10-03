import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Withdrawal from "@/models/Withdrawal";

export async function GET(req: Request) {
  const { admin, error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const filter = q
      ? {
          $or: [
            { fullName: new RegExp(q, "i") },
            { mobileNumber: new RegExp(q, "i") },
          ],
        }
      : {};

    await connectToDatabase();

    const [users, pending, totals] = await Promise.all([
      User.find(filter)
        .select("fullName mobileNumber balance heldBalance blocked createdAt referralCode")
        .sort({ createdAt: -1 })
        .limit(500)
        .lean(),
      Withdrawal.countDocuments({ status: "pending" }),
      User.aggregate([
        {
          $group: {
            _id: null,
            users: { $sum: 1 },
            balance: { $sum: "$balance" },
            held: { $sum: "$heldBalance" },
          },
        },
      ]),
    ]);

    const t = totals[0] ?? { users: 0, balance: 0, held: 0 };

    return NextResponse.json({
      users: users.map((u: any) => ({
        id: u._id.toString(),
        fullName: u.fullName,
        mobileNumber: u.mobileNumber,
        balance: u.balance,
        heldBalance: u.heldBalance,
        blocked: u.blocked,
        referralCode: u.referralCode,
        createdAt: u.createdAt,
      })),
      stats: {
        users: t.users,
        totalBalance: t.balance,
        totalHeld: t.held,
        pendingWithdrawals: pending,
      },
    });
  } catch (err: any) {
    console.error("Admin users error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}