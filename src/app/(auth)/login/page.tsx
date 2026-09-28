"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const demoUsers = [
    { label: "Sales Dealer", email: "sales@demo.com", pass: "password123" },
    { label: "Marketing", email: "marketing@demo.com", pass: "password123" },
    { label: "Atasan Marketing", email: "atasan@demo.com", pass: "password123" },
    { label: "Admin Backoffice", email: "admin@demo.com", pass: "password123" },
  ];

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-mark">🏍️</div>
          <h1>KreditMoto</h1>
          <p>Sistem Pengajuan Kredit Kendaraan Bermotor</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password <span className="required">*</span></label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPass ? "text" : "password"}
                className="form-control"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--gray-400)" }}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button id="login-submit" type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Memproses...</> : "🔐 Masuk"}
          </button>
        </form>

        <div style={{ marginTop: 28, padding: "16px", background: "var(--gray-50)", borderRadius: "var(--border-radius-sm)" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-500)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Demo Credentials</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {demoUsers.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => { setEmail(u.email); setPassword(u.pass); }}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px", background: "white", border: "1px solid var(--gray-200)",
                  borderRadius: 6, cursor: "pointer", fontSize: 12, transition: "all 0.15s",
                }}
                onMouseOver={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                onMouseOut={e => (e.currentTarget.style.borderColor = "var(--gray-200)")}
              >
                <span style={{ fontWeight: 600, color: "var(--gray-700)" }}>{u.label}</span>
                <span style={{ color: "var(--gray-400)" }}>{u.email}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 8 }}>Password semua akun: <strong>password123</strong></p>
        </div>

        <div className="login-footer">
          <p>© 2024 KreditMoto. Sistem Digitalisasi Kredit Kendaraan</p>
        </div>
      </div>
    </div>
  );
}
