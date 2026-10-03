"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type SessionUser = {
  id: string;
  fullName: string;
  mobileNumber: string;
  balance: number;
  heldBalance: number;
  referralCode?: string;
  bank?: Record<string, string>;
};

/**
 * Loads the logged-in user once on mount. Redirects to /login when there is
 * no valid session, and exposes a refresh() for after balance changes.
 */
export function useSession() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        router.replace("/login");
        return null;
      }
      const data = await res.json();
      setUser(data.user);
      return data.user as SessionUser;
    } catch {
      setUser(null);
      router.replace("/login");
      return null;
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, loading, refresh };
}