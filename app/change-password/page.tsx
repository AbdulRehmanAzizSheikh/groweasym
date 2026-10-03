"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { ASSETS } from "@/lib/assets";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDone(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update password");

      setDone(true);
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      active="me"
      contentClass="mt-3"
      title="Change Password"
      titleNode={
        <img
          src={ASSETS.logo}
          alt="GSA Farming"
          width={100}
          style={{ height: "auto", maxHeight: 34 }}
        />
      }
    >
      <div className="banyue">
        {error && <div className="gsa-error">{error}</div>}
        {done && (
          <div
            className="mb-3"
            style={{ background: "#d4edda", color: "#155724", borderRadius: 8, padding: 10 }}
          >
            Password updated successfully.
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="mb-0" htmlFor="current">
              Current Password
            </label>
            <input
              id="current"
              type="password"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="form-group">
            <label className="mb-0" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label className="mb-0" htmlFor="confirm">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="mt-3">
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}