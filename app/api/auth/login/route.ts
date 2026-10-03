import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { mobileNumber, password } = await req.json();
    const mobile = (mobileNumber || "").replace(/\D/g, "");
    const pass = password || "";

    if (!mobile || !pass) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ mobileNumber: mobile });
    // Same message for both branches so the form can't be used to discover
    // which mobile numbers are registered.
    if (!user) {
      return NextResponse.json(
        { error: "Invalid mobile number or password" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid mobile number or password" },
        { status: 401 }
      );
    }
    if (user.blocked) {
      return NextResponse.json(
        { error: "This account has been blocked. Contact support." },
        { status: 403 }
      );
    }

    await setSessionCookie({
      userId: user._id.toString(),
      mobileNumber: user.mobileNumber,
    });

    return NextResponse.json({ success: true, user: user.toSafeJSON() });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Could not sign you in" },
      { status: 500 }
    );
  }
}