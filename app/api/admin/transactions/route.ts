import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);

    await connectToDatabase();

    const transactions = await Transaction.find()
      .populate("user", "fullName mobileNumber")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      transactions: transactions.map((t: any) => ({
        id: t._id.toString(),
        user: t.user
          ? {
              id: t.user._id.toString(),
              fullName: t.user.fullName,
              mobileNumber: t.user.mobileNumber,
            }
          : null,
        type: t.type,
        amount: t.amount,
        direction: t.direction,
        status: t.status,
        note: t.note,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("Admin transactions error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}