import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Withdrawal from "@/models/Withdrawal";

export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const filter =
      status && ["pending", "paid", "rejected"].includes(status)
        ? { status }
        : {};

    await connectToDatabase();

    const withdrawals = await Withdrawal.find(filter)
      .populate("user", "fullName mobileNumber")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    return NextResponse.json({
      withdrawals: withdrawals.map((w: any) => ({
        id: w._id.toString(),
        amount: w.amount,
        method: w.method,
        payoutDetails: w.payoutDetails,
        status: w.status,
        adminNote: w.adminNote,
        createdAt: w.createdAt,
        paidAt: w.paidAt,
        user: w.user
          ? {
              id: w.user._id.toString(),
              fullName: w.user.fullName,
              mobileNumber: w.user.mobileNumber,
            }
          : null,
      })),
    });
  } catch (err: any) {
    console.error("Admin withdrawals error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}