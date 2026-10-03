"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useSession } from "@/components/useSession";
import { inrShort } from "@/lib/format";

const MIN_WITHDRAW = Number(process.env.NEXT_PUBLIC_MIN_WITHDRAW || 100);

export default function Withdraw() {
  const { user, refresh } = useSession();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"bank" | "upi">("bank");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user?.bank) {
      setAccountHolder(user.bank.accountHolder || user.fullName);
      setAccountNumber(user.bank.accountNumber || "");
      setIfsc(user.bank.ifsc || "");
      setBankName(user.bank.bankName || "");
      setUpiId(user.bank.upiId || "");
    }
  }, [user]);

  const numeric = Number(amount);
  const available = user?.balance ?? 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDone(false);

    if (!Number.isFinite(numeric) || numeric < MIN_WITHDRAW) {
      setError(`Minimum withdrawal is ${inrShort(MIN_WITHDRAW)}`);
      return;
    }
    if (numeric > available) {
      setError("Insufficient balance");
      return;
    }
    if (method === "upi" && !upiId.trim()) {
      setError("Please enter your UPI ID");
      return;
    }
    if (
      method === "bank" &&
      (!accountHolder.trim() || !accountNumber.trim() || !ifsc.trim())
    ) {
      setError("Please fill in all bank details");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/withdraw/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numeric,
          method,
          bank: { accountHolder, accountNumber, ifsc, bankName, upiId },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setDone(true);
      setAmount("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      active="me"
      contentClass="pb-0 mt-3"
      title="Withdraw"
      rightNode={<span className="link">Information</span>}
    >
      <div className="banyue">
        {error && <div className="gsa-error">{error}</div>}
        {done && (
          <div
            className="mb-3"
            style={{ background: "#d4edda", color: "#155724", borderRadius: 8, padding: 10 }}
          >
            Withdrawal request received. Our team has been notified and will
            contact you once the payment is sent.
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="mb-0" htmlFor="amount">
              Withdraw Amount
            </label>
            <input
              type="number"
              id="amount"
              className="form-control"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <p style={{ fontSize: 14, color: "#333" }}>
            Available: <strong>{inrShort(available)}</strong> · Minimum{" "}
            {inrShort(MIN_WITHDRAW)}
          </p>

          <div className="form-group">
            <label className="mb-0" htmlFor="method">
              Withdraw Method
            </label>
            <select
              id="method"
              className="form-control"
              value={method}
              onChange={(e) => setMethod(e.target.value as "bank" | "upi")}
            >
              <option value="bank">Bank Account</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          {method === "bank" ? (
            <>
              <div className="form-group">
                <label className="mb-0" htmlFor="holder">
                  Account Holder Name
                </label>
                <input
                  id="holder"
                  className="form-control"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="mb-0" htmlFor="account">
                  Account Number
                </label>
                <input
                  id="account"
                  className="form-control"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="mb-0" htmlFor="ifsc">
                  IFSC Code
                </label>
                <input
                  id="ifsc"
                  className="form-control"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                />
              </div>

              <div className="form-group">
                <label className="mb-0" htmlFor="bankname">
                  Bank Name
                </label>
                <input
                  id="bankname"
                  className="form-control"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="mb-0" htmlFor="upi">
                UPI ID
              </label>
              <input
                id="upi"
                className="form-control"
                placeholder="name@bank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>
          )}

          <p style={{ fontSize: 15, color: "#333" }}>
            Note:{" "}
            <span className="gsa-note">Withdraw Time 11:00 am to 6:30 pm</span>
          </p>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Withdraw"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}