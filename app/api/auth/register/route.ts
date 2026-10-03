import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { setSessionCookie } from "@/lib/auth";

function makeReferralCode(mobile: string) {
  return `GSA${mobile.slice(-6)}`;
}

export async function POST(req: Request) {
  try {
    const { fullName, mobileNumber, password, referralCode } = await req.json();

    const name = (fullName || "").trim();
    const mobile = (mobileNumber || "").replace(/\D/g, "");
    const pass = password || "";

    if (!name || !mobile || !pass) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    if (mobile.length < 10 || mobile.length > 15) {
      return NextResponse.json(
        { error: "Enter a valid mobile number" },
        { status: 400 }
      );
    }
    if (pass.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    if (await User.findOne({ mobileNumber: mobile })) {
      return NextResponse.json(
        { error: "Mobile number already registered" },
        { status: 409 }
      );
    }

    let referredBy = null;
    const ref = (referralCode || "").trim();
    if (ref) {
      const referrer = await User.findOne({ referralCode: ref });
      if (referrer) referredBy = referrer._id;
    }

    const hashed = await bcrypt.hash(pass, 10);

    const user = await User.create({
      fullName: name,
      mobileNumber: mobile,
      password: hashed,
      referralCode: makeReferralCode(mobile),
      referredBy,
    });

    await setSessionCookie({
      userId: user._id.toString(),
      mobileNumber: user.mobileNumber,
    });

    return NextResponse.json(
      { success: true, user: user.toSafeJSON() },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Could not create the account" },
      { status: 500 }
    );
  }
}