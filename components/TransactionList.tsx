"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { formatDateTime, inrShort } from "@/lib/format";

export type Txn = {
  id: string;
  type: string;
  amount: number;
  direction: number;
  status: string;
  note: string;
  balanceAfter: number;
  createdAt: string;
};

const TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit",
  withdraw: "Withdrawal",
  admin_credit: "Admin credit",
  admin_debit: "Admin debit",
  refund: "Refund",
};

export default function TransactionList({
  title,
  filter,
}: {
  title: string;
  filter?: "deposit" | "withdraw" | "admin_credit" | "admin_debit";
}) {
  const [rows, setRows] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = filter ? `?type=${filter}` : "";
    fetch(`/api/wallet/transactions${qs}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRows(d?.transactions ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <AppShell active="me" title={title} contentClass="mt-3">
      <div className="banyue mt-2">
        {loading ? (
          <div className="gsa-empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="gsa-empty">No records yet</div>
        ) : (
          <div className="gsa-scroll">
            <table className="gsa-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td>{TYPE_LABEL[t.type] ?? t.type}</td>
                    <td style={{ fontWeight: 600 }}>
                      {t.direction > 0 ? "+" : "−"}
                      {inrShort(t.amount)}
                    </td>
                    <td>
                      <span className={`gsa-pill gsa-pill--${t.status}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{formatDateTime(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}