"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { formatDate, formatDateTime, inrShort } from "@/lib/format";

type AdminUser = {
  id: string;
  fullName: string;
  mobileNumber: string;
  balance: number;
  heldBalance: number;
  blocked: boolean;
  referralCode?: string;
  createdAt: string;
};

type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  payoutDetails: string;
  status: string;
  adminNote: string;
  createdAt: string;
  user: { id: string; fullName: string; mobileNumber: string } | null;
};

type Tab = "users" | "withdrawals" | "transactions";

export default function Admin() {
  const router = useRouter();

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");

  const flash = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2400);
  }, []);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  const loadUsers = useCallback(async () => {
    const res = await fetch(
      `/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`
    );
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data.users);
    setStats(data.stats);
  }, [query]);

  const loadWithdrawals = useCallback(async () => {
    const res = await fetch("/api/admin/withdrawals");
    if (!res.ok) return;
    setWithdrawals((await res.json()).withdrawals);
  }, []);

  const loadTransactions = useCallback(async () => {
    const res = await fetch("/api/admin/transactions");
    if (!res.ok) return;
    setTransactions((await res.json()).transactions);
  }, []);

  useEffect(() => {
    if (authed !== true) return;
    if (tab === "users") loadUsers();
    if (tab === "withdrawals") loadWithdrawals();
    if (tab === "transactions") loadTransactions();
  }, [authed, tab, loadUsers, loadWithdrawals, loadTransactions]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setPassword("");
      setAuthed(true);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    router.replace("/login");
  };

  const adjustBalance = async (
    userId: string,
    type: "credit" | "debit" | "set",
    rawAmount: string
  ) => {
    const value = Number(rawAmount);
    if (!Number.isFinite(value) || value <= 0) {
      flash("Enter an amount greater than 0");
      return;
    }
    const res = await fetch("/api/admin/balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: value, type }),
    });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error || "Update failed");
      return;
    }
    flash(`Updated. New balance ${inrShort(data.balance)}`);
    loadUsers();
  };

  const resolve = async (id: string, action: "paid" | "rejected") => {
    const note =
      action === "rejected"
        ? window.prompt("Reason for rejection (optional):") ?? ""
        : window.prompt("Payout reference / note (optional):") ?? "";

    const res = await fetch("/api/admin/withdrawal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      flash(data.error || "Update failed");
      return;
    }
    flash(action === "paid" ? "Marked as paid" : "Rejected and refunded");
    loadWithdrawals();
    loadUsers();
  };

  /* ------------------------------------------------------------ login gate */
  if (authed === null) {
    return (
      <div id="appCapsule">
        <div className="appContent mt-5">
          <div className="banyue">
            <div className="gsa-empty">Checking session…</div>
          </div>
        </div>
      </div>
    );
  }

  if (authed === false) {
    return (
      <>
        <div className="appHeader">
          <div className="pageTitle" style={{ color: "#fff", fontWeight: 700 }}>
            Admin Panel
          </div>
        </div>

        <div id="appCapsule">
          <div className="appContent mt-5">
            <div className="sectionTitle">
              <div className="title">
                <h1>Admin Panel</h1>
              </div>
            </div>

            <div className="banyue">
              {loginError && <div className="gsa-error">{loginError}</div>}
              <form onSubmit={login}>
                <div className="form-group">
                  <label className="mb-0" htmlFor="pass">
                    Password
                  </label>
                  <input
                    id="pass"
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-block"
                  disabled={busy}
                >
                  {busy ? "Checking..." : "Login"}
                </button>
              </form>
              <p className="mt-3 mb-0" style={{ fontSize: 12, color: "#888" }}>
                Password is read from <code>ADMIN_PASSWORD</code> in .env
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* -------------------------------------------------------------- admin UI */
  const pending = withdrawals.filter((w) => w.status === "pending").length;

  return (
    <AppShell active="me" title="Admin Panel" contentClass="mt-3" hideBottomNav>
      <div className="gsa-admin-page">
        {stats && (
          <div className="gsa-stats">
            <div>
              <strong>{stats.users}</strong>
              <span>Users</span>
            </div>
            <div>
              <strong>{inrShort(stats.totalBalance)}</strong>
              <span>Total balance</span>
            </div>
            <div>
              <strong>{inrShort(stats.totalHeld)}</strong>
              <span>On hold</span>
            </div>
            <div>
              <strong>{stats.pendingWithdrawals}</strong>
              <span>Pending payouts</span>
            </div>
          </div>
        )}

        <div className="gsa-admin-tabs">
          {(
            [
              ["users", "Users"],
              ["withdrawals", `Withdrawals${pending ? ` (${pending})` : ""}`],
              ["transactions", "Transactions"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={tab === key ? "is-active" : ""}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}

          <button
            type="button"
            className="gsa-btn-sm gsa-btn-sm--grey"
            style={{ marginLeft: "auto" }}
            onClick={logout}
          >
            Log out
          </button>
        </div>

        {/* ---------------------------------------------------------- users */}
        {tab === "users" && (
          <>
            <input
              className="form-control mb-3"
              placeholder="Search name or mobile"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {users.length === 0 ? (
              <div className="gsa-admin-card">
                <div className="gsa-empty">No users found</div>
              </div>
            ) : (
              users.map((u) => (
                <UserRow key={u.id} user={u} onAdjust={adjustBalance} />
              ))
            )}
          </>
        )}

        {/* --------------------------------------------------- withdrawals */}
        {tab === "withdrawals" && (
          <>
            {withdrawals.length === 0 ? (
              <div className="gsa-admin-card">
                <div className="gsa-empty">No withdrawal requests</div>
              </div>
            ) : (
              withdrawals.map((w) => (
                <div className="gsa-admin-card" key={w.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <strong style={{ fontSize: 16, color: "#e8ae00" }}>
                      {inrShort(w.amount)}
                    </strong>
                    <span className={`gsa-pill gsa-pill--${w.status}`}>
                      {w.status}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    <strong>{w.user?.fullName ?? "Unknown"}</strong> ·{" "}
                    {w.user?.mobileNumber ?? "-"}
                  </div>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    {formatDateTime(w.createdAt)}
                  </div>

                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      background: "#f7f7f7",
                      borderRadius: 6,
                      padding: 8,
                      margin: "10px 0 0",
                      fontSize: 12,
                      fontFamily: "inherit",
                    }}
                  >
                    {w.payoutDetails}
                  </pre>

                  {w.adminNote && (
                    <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                      Note: {w.adminNote}
                    </div>
                  )}

                  {w.status === "pending" && (
                    <div className="gsa-admin-row">
                      <button
                        type="button"
                        className="gsa-btn-sm gsa-btn-sm--green"
                        onClick={() => resolve(w.id, "paid")}
                      >
                        Mark paid
                      </button>
                      <button
                        type="button"
                        className="gsa-btn-sm gsa-btn-sm--red"
                        onClick={() => resolve(w.id, "rejected")}
                      >
                        Reject &amp; refund
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* -------------------------------------------------- transactions */}
        {tab === "transactions" && (
          <div className="gsa-admin-card">
            {transactions.length === 0 ? (
              <div className="gsa-empty">No transactions yet</div>
            ) : (
              <div className="gsa-scroll">
                <table className="gsa-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td>
                          {t.user?.fullName ?? "-"}
                          <br />
                          <span style={{ color: "#888", fontSize: 11 }}>
                            {t.user?.mobileNumber ?? ""}
                          </span>
                        </td>
                        <td>{t.type}</td>
                        <td
                          style={{
                            fontWeight: 600,
                            color: t.direction > 0 ? "#28a745" : "#dc3545",
                          }}
                        >
                          {t.direction > 0 ? "+" : "−"}
                          {inrShort(t.amount)}
                        </td>
                        <td>{t.status}</td>
                        <td>{formatDate(t.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <div className="gsaToast">{toast}</div>}
    </AppShell>
  );
}

function UserRow({
  user,
  onAdjust,
}: {
  user: AdminUser;
  onAdjust: (
    id: string,
    type: "credit" | "debit" | "set",
    amount: string
  ) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="gsa-admin-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div>
          <strong>{user.fullName}</strong>
          <div style={{ fontSize: 12, color: "#888" }}>
            {user.mobileNumber}
          </div>
          <div style={{ fontSize: 11, color: "#aaa" }}>
            Joined {formatDate(user.createdAt)}
            {user.blocked && (
              <span className="gsa-pill gsa-pill--rejected" style={{ marginLeft: 6 }}>
                blocked
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e8ae00" }}>
            {inrShort(user.balance)}
          </div>
          {user.heldBalance > 0 && (
            <div style={{ fontSize: 11, color: "#856404" }}>
              {inrShort(user.heldBalance)} on hold
            </div>
          )}
        </div>
      </div>

      <div className="gsa-admin-row">
        <button
          type="button"
          className="gsa-btn-sm"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Adjust balance"}
        </button>
      </div>

      {open && (
        <div className="gsa-admin-row">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            type="button"
            className="gsa-btn-sm gsa-btn-sm--green"
            onClick={async () => {
              await onAdjust(user.id, "credit", amount);
              setAmount("");
            }}
          >
            Add
          </button>
          <button
            type="button"
            className="gsa-btn-sm gsa-btn-sm--red"
            onClick={async () => {
              await onAdjust(user.id, "debit", amount);
              setAmount("");
            }}
          >
            Remove
          </button>
          <button
            type="button"
            className="gsa-btn-sm gsa-btn-sm--grey"
            onClick={async () => {
              await onAdjust(user.id, "set", amount);
              setAmount("");
            }}
          >
            Set
          </button>
        </div>
      )}
    </div>
  );
}