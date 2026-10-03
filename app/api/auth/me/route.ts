import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ user: user.toSafeJSON() });
  } catch (err: any) {
    console.error("Session error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}