"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => {
        if (r.ok) router.replace("/dashboard");
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: mobileNumber.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
          Log in
        </div>
      </div>

      <div id="appCapsule" className="pb-2">
        <div className="appContent mt-5">
          <div className="sectionTitle">
            <div className="title">
              <h1>Welcome Back</h1>
            </div>
            <div className="lead mb-2">Sign in to continue</div>
          </div>

          <div className="banyue pt-2">
            {error && <div className="gsa-error">{error}</div>}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  type="text"
                  name="username"
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
                  type="password"
                  name="password"
                  id="password"
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg btn-block"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
            </form>

            <div className="mt-2 mb-3 text-dark text-right">
              <Link href="/register" className="float-left">
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}