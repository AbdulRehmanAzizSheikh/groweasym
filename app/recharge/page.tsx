"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useSession } from "@/components/useSession";
import { inrShort } from "@/lib/format";

const QUICK_AMOUNTS = [300, 1000, 2000, 5000, 10000, 20000];

const METHODS = [
  { value: "razorpay", label: "Razorpay (UPI / Card / Netbanking)" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Debit / Credit Card" },
  { value: "netbanking", label: "Netbanking" },
];

export default function Recharge() {
  const router = useRouter();
  const { user, refresh } = useSession();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const numeric = Number(amount);
  const valid = Number.isFinite(numeric) && numeric >= 1;

  const startPayment = async () => {
    setError("");
    setNotice("");

    if (!valid) {
      setError("Please enter a valid amount");
      return;
    }
    if (!method) {
      setError("Please select a recharge method");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numeric, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment");

      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) throw new Error("Payment library failed to load");

      const rzp = new Razorpay({
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "GSA Farming",
        description: "Recharge Account",
        order_id: data.order.id,
        prefill: { contact: user?.mobileNumber || "" },
        theme: { color: "#2da5ff" },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              setError(verifyData.error || "Payment verification failed");
              return;
            }
            await refresh();
            router.push("/me/wallet");
          } catch {
            setError(
              "Payment received but could not be confirmed. Contact support."
            );
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setNotice("Payment cancelled");
          },
        },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      active="recharge"
      contentClass="pb-0 mt-3"
      title="Recharge"
      rightNode={<span className="link">Information</span>}
    >
      <div className="banyue">
        {error && <div className="gsa-error">{error}</div>}
        {notice && (
          <div className="form-note" style={{ color: "#856404", fontSize: 14 }}>
            {notice}
          </div>
        )}

        <div className="form-group">
          <label className="mb-0" htmlFor="amount">
            Recharge Amount
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

        <div className="form-group">
          <label className="mb-0">Choose Amount</label>
          <div className="d-flex flex-wrap mt-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                className={`amountBtn ${numeric === value ? "is-active" : ""}`}
                onClick={() => setAmount(String(value))}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="mb-0" htmlFor="method">
            Recharge Method
          </label>
          <select
            id="method"
            className="form-control"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="">Select one</option>
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3">
          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            onClick={startPayment}
            disabled={loading}
          >
            {loading ? "Opening payment..." : "Recharge Now"}
          </button>
        </div>

        <p className="mt-3 mb-0" style={{ fontSize: 14, color: "#333" }}>
          Available balance: <strong>{inrShort(user?.balance ?? 0)}</strong>
        </p>
      </div>
    </AppShell>
  );
}