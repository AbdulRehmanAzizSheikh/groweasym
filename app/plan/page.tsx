"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { PLANS } from "@/lib/plans";
import { ASSETS } from "@/lib/assets";

export default function Plans() {
  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2400);
  };

  return (
    <AppShell
      active="plan"
      back={false}
      contentClass="mt-3"
      titleNode={
        <img
          src={ASSETS.logo}
          alt="GSA Farming"
          width={100}
          style={{ height: "auto", maxHeight: 34 }}
        />
      }
    >
      <div className="mt-2">
        {PLANS.map((plan) => (
          <div className="gsa-plan" key={plan.id}>
            {plan.tag && <span className="gsa-plan__tag">{plan.tag}</span>}
            <span className="gsa-plan__tag">GSA Farming</span>

            <button
              type="button"
              className="gsa-plan__cta"
              onClick={() => showToast("Plan purchasing is not enabled yet.")}
            >
              Plan Active Now
            </button>

            <div className="gsa-plan__price">
              <span>₹ {plan.price.toLocaleString("en-IN")}</span>
              <img
                src={ASSETS.planBadge}
                alt=""
                width={50}
                height={50}
                style={{ borderRadius: 6 }}
              />
            </div>

            <div className="gsa-plan__grid">
              <div>
                <span>VALIDITY</span>
                <strong>{plan.validityDays} Day</strong>
              </div>
              <div>
                <span>TOTAL INCOME</span>
                <strong>{plan.totalIncome.toLocaleString("en-IN")} INR</strong>
              </div>
              <div>
                <span>DAILY INCOME</span>
                <strong>₹{plan.dailyIncome.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && <div className="gsaToast">{toast}</div>}
    </AppShell>
  );
}