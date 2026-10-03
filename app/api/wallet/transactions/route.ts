import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

const VALID_TYPES = [
  "deposit",
  "withdraw",
  "admin_credit",
  "admin_debit",
  "refund",
];

export async function GET(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const filter: Record<string, any> = { user: user!._id };
    if (type && VALID_TYPES.includes(type)) filter.type = type;

    await connectToDatabase();

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      transactions: transactions.map((t: any) => ({
        id: t._id.toString(),
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
    console.error("Transactions error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}