"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { X } from "lucide-react";

const COOKIE_KEY = "coyo_cookie_consent";

export default function CookieBanner() {
  const { tr } = useLanguage();
  const c = tr.cookies;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(COOKIE_KEY)) return;

    // Aparece cuando la animación del hero termina
    const show = () => setVisible(true);
    window.addEventListener("coyo:hero-ready", show, { once: true });

    // Fallback por si el evento no llega
    const fallback = setTimeout(show, 7000);
    return () => {
      window.removeEventListener("coyo:hero-ready", show);
      clearTimeout(fallback);
    };
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "all");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, "essential");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={c.title}
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10000,
        width: "min(620px, calc(100vw - 32px))",
        background: "rgba(14,13,11,0.97)",
        border: "1px solid rgba(201,168,76,0.22)",
        borderRadius: 12,
        padding: "1.25rem 1.5rem",
        boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        animation: "cookieSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      {/* Close button */}
      <button
        onClick={reject}
        aria-label="Cerrar"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.3)",
          cursor: "pointer",
          padding: 4,
          lineHeight: 1,
        }}
      >
        <X size={16} />
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: 18 }}>🍪</span>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff" }}>
          {c.title}
        </p>
      </div>

      {/* Text */}
      <p style={{
        margin: 0,
        fontSize: 12,
        lineHeight: 1.65,
        color: "rgba(255,255,255,0.5)",
      }}>
        {c.text}{" "}
        <a
          href="/cookies"
          style={{ color: "rgba(201,168,76,0.8)", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          {c.policy}
        </a>
        .
      </p>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
        <button
          onClick={accept}
          style={{
            flex: 1,
            minWidth: 120,
            padding: "9px 20px",
            border: "none",
            borderRadius: 6,
            background: "linear-gradient(135deg,#c9a84c,#8b6914)",
            color: "#0a0a0f",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          {c.accept}
        </button>
        <button
          onClick={reject}
          style={{
            flex: 1,
            minWidth: 120,
            padding: "9px 20px",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            background: "transparent",
            color: "rgba(255,255,255,0.45)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.06em",
          }}
        >
          {c.reject}
        </button>
      </div>

      <style>{`
        @keyframes cookieSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
