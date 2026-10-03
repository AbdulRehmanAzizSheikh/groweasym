import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

export const SESSION_COOKIE = "gsa_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionPayload = {
  userId: string;
  mobileNumber: string;
  admin?: boolean;
};

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/** Returns the logged-in user, or null. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;

  await connectToDatabase();
  const user = await User.findById(session.userId);
  if (!user || user.blocked) return null;
  return user;
}

/**
 * Guards a normal user route. Returns the user or a ready-to-return
 * error Response.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, error: null };
}

/**
 * Guards an admin route. The admin session is a *separate* cookie from the
 * user session, so an ordinary user token can never reach admin endpoints.
 */
export async function requireAdmin() {
  const store = await cookies();
  const token = store.get("gsa_admin")?.value;
  if (!token) {
    return {
      admin: false,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string };
    if (decoded.role !== "admin") {
      return {
        admin: false,
        error: Response.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    return { admin: true, error: null };
  } catch {
    return {
      admin: false,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}

/** Constant-time compare so the admin password can't be timed-attacked. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}