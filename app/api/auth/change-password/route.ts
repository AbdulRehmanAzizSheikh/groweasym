import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const { currentPassword, password } = await req.json();

    if (!currentPassword || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(currentPassword, user!.password);
    if (!ok) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    user!.password = await bcrypt.hash(password, 10);
    await user!.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { error: "Could not update password" },
      { status: 500 }
    );
  }
}