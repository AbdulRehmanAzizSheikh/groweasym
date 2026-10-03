import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    await connectToDatabase();

    const members = await User.find({ referredBy: user!._id })
      .select("fullName mobileNumber createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const commissionAgg = await Transaction.aggregate([
      {
        $match: {
          user: user!._id,
          type: { $in: ["deposit", "admin_credit"] },
          status: "success",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return NextResponse.json({
      members: members.map((m: any) => ({
        id: m._id.toString(),
        fullName: m.fullName,
        mobileNumber: m.mobileNumber,
        createdAt: m.createdAt,
      })),
      teamCommission: commissionAgg[0]?.total ?? 0,
    });
  } catch (err: any) {
    console.error("Team error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}