"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAdminLanguage } from "@/lib/LanguageContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { tr } = useAdminLanguage();
  const a = tr.admin;
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      const data = await res.json();
      setError(data.error ?? a.loginError);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Image src="/images/COYO-logo-2026-White.png" alt="Coyo" width={80} height={49} style={{ opacity: 0.8, margin: "0 auto" }} />
          <p style={{ marginTop: "0.75rem", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", fontFamily: "var(--font-dm-sans, sans-serif)" }}>
            {a.loginTitle}
          </p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 4, padding: "2.5rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>
              {a.loginUser}
            </label>
            <input
              type="text"
              value={user}
              onChange={e => setUser(e.target.value)}
              required
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, padding: "0.75rem 1rem", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>
              {a.loginPassword}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, padding: "0.75rem 1rem", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <p style={{ marginBottom: "1rem", fontSize: 13, color: "rgb(252,165,165)", textAlign: "center" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "0.875rem", background: "linear-gradient(135deg, #c9a84c, #8b6914)", color: "#0a0a0f", fontFamily: "var(--font-dm-sans, sans-serif)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 600, border: "none", borderRadius: 2, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? a.loginLoading : a.loginBtn}
          </button>
        </form>
      </div>
    </div>
  );
}
