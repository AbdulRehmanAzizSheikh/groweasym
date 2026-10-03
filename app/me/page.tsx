"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle2,
  ChevronRight,
  Wallet,
  ClipboardList,
  TrendingUp,
  Landmark,
  Gift,
  HelpCircle,
  MessageCircle,
  KeyRound,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { useSession } from "@/components/useSession";
import { inrShort } from "@/lib/format";

type Summary = {
  totalIncome: number;
  totalRecharge: number;
  totalAssets: number;
  totalWithdraw: number;
  teamMembers: number;
  teamIncome: number;
};

export default function Account() {
  const router = useRouter();
  const { user } = useSession();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/wallet/summary", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSummary(d))
      .catch(() => {});
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  };

  const stats = [
    { label: "Total income", value: summary?.totalIncome ?? 0 },
    { label: "Total recharge", value: summary?.totalRecharge ?? 0 },
    { label: "Total assets", value: summary?.totalAssets ?? 0 },
    { label: "Total withdraw", value: summary?.totalWithdraw ?? 0 },
    { label: "Team Member", value: summary?.teamMembers ?? 0, raw: true },
    { label: "Team income", value: summary?.teamIncome ?? 0 },
  ];

  const rows = [
    { icon: Wallet, label: "My Wallet", to: "/me/wallet" },
    { icon: ClipboardList, label: "Recharge Record", to: "/me/recharges" },
    { icon: TrendingUp, label: "My Investment", to: "/me/investments" },
    { icon: Landmark, label: "My bank", to: "/withdraw" },
    { icon: Gift, label: "invite", to: "/team" },
    { icon: HelpCircle, label: "Support", to: "/team" },
    { icon: MessageCircle, label: "Discussion group", to: "/team" },
    { icon: KeyRound, label: "Change Password", to: "/change-password" },
  ];

  return (
    <AppShell active="me" title="Account" contentClass="mt-3">
      <div className="mt-2">
        {/* Profile summary */}
        <div className="banyue banyue--flush">
          <div className="text-center">
            <div className="gsa-avatar">
              <UserCircle2 size={34} />
            </div>
            <div style={{ fontSize: 17, marginBottom: 14 }}>
              +91{user?.mobileNumber ?? ""}
            </div>

            <div className="gsa-statGrid">
              {stats.map((s) => (
                <div key={s.label}>
                  <strong>
                    {s.raw ? s.value : inrShort(s.value)}
                  </strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            <p className="mt-3 mb-0" style={{ fontSize: 13, color: "#666" }}>
              Balance: <strong>{inrShort(user?.balance ?? 0)}</strong>
              {(user?.heldBalance ?? 0) > 0 && (
                <> · On hold: {inrShort(user?.heldBalance ?? 0)}</>
              )}
            </p>
          </div>
        </div>

        {/* Menu */}
        <div className="listView">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <a
                key={row.label}
                href="javascript:;"
                className="listItem"
                onClick={(e) => {
                  e.preventDefault();
                  router.push(row.to);
                }}
              >
                <Icon size={20} color="#e8ae00" style={{ flex: "0 0 auto" }} />
                <span>{row.label}</span>
                <ChevronRight
                  size={18}
                  color="#bbb"
                  style={{ marginLeft: "auto" }}
                />
              </a>
            );
          })}
        </div>

        <button
          type="button"
          className="btn btn-primary btn-lg btn-block"
          onClick={logout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Log Out"}
        </button>
      </div>
    </AppShell>
  );
}