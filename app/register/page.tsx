"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Picks up ?ref=CODE from the referral link.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code) setReferralCode(code);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobileNumber: mobileNumber.trim(),
          password,
          referralCode: referralCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="appHeader">
        <div className="left">
          <a
            href="javascript:;"
            className="icon"
            onClick={(e) => {
              e.preventDefault();
              router.back();
            }}
          >
            <i className="icon ion-ios-arrow-back"></i>
          </a>
        </div>
        <div className="pageTitle" style={{ color: "#fff", fontWeight: 700 }}>
          Sign up
        </div>
      </div>

      <div id="appCapsule" className="pb-2">
        <div className="appContent mt-5">
          <div className="sectionTitle">
            <div className="title">
              <h1>Create Account</h1>
            </div>
            <div className="lead mb-2">Register to get started</div>
          </div>

          <div className="banyue pt-2">
            {error && <div className="gsa-error">{error}</div>}

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <input
                  type="text"
                  id="fullName"
                  className="form-control"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  placeholder="Mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="text"
                  id="referral"
                  className="form-control"
                  placeholder="Referral code (optional)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="password"
                  id="confirmPassword"
                  className="form-control"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-block"
                  disabled={loading}
                >
                  {loading ? "Signing up..." : "Sign up"}
                </button>
              </div>
            </form>

            <div className="mt-2 mb-3 text-dark">
              Already have an account, log in?{" "}
              <Link href="/login">Log in</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}