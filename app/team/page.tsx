"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useSession } from "@/components/useSession";
import { formatDate, inrShort } from "@/lib/format";

type TeamMember = {
  id: string;
  fullName: string;
  mobileNumber: string;
  createdAt: string;
};

export default function Team() {
  const { user } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [commission, setCommission] = useState(0);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/team", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setMembers(d.members ?? []);
          setCommission(d.teamCommission ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://groweasy.co.in";
  const referralUrl = `${baseUrl}/register?ref=${user?.referralCode ?? ""}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setToast("Referral link copied");
    } catch {
      setToast("Could not copy — select the link manually");
    }
    setTimeout(() => setToast(""), 2200);
  };

  return (
    <AppShell active="team" title="My team" contentClass="mt-3">
      <div className="mt-2">
        {/* Referral link */}
        <div className="banyue banyue--tight">
          <div className="d-flex align-items-center flex-wrap">
            <input
              className="referInput mr-2"
              readOnly
              value={referralUrl}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ borderRadius: 4, width: "auto", padding: "0 20px" }}
              onClick={copy}
            >
              Copy
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="banyue banyue--tight">
          <div className="gsa-stats">
            <div>
              <strong>{members.length}</strong>
              <span>Invites</span>
            </div>
            <div>
              <strong>{inrShort(commission)}</strong>
              <span>Team Commission</span>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e0e0e0", margin: "4px 0 10px" }} />

          {members.length === 0 ? (
            <div className="gsa-empty">
              No invites yet. Share your referral link to build your team.
            </div>
          ) : (
            <div className="gsa-scroll">
              <table className="gsa-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Mobile</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>{m.fullName}</td>
                      <td>{m.mobileNumber}</td>
                      <td>{formatDate(m.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="gsaToast">{toast}</div>}
    </AppShell>
  );
}