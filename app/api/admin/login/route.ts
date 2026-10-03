import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { safeEqual } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json(
        { error: "ADMIN_PASSWORD is not set in .env" },
        { status: 503 }
      );
    }

    const { password } = await req.json();
    if (typeof password !== "string" || !password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (!safeEqual(password, expected)) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET!, {
      expiresIn: "8h",
    });

    const store = await cookies();
    store.set("gsa_admin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8,
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}