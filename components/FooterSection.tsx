"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

type PedidoStatus = {
  orderNumber: string;
  nombre: string;
  estado: string;
  estadoLabel: string;
  estadoEmoji: string;
  horaRecogida: string | null;
};

const ESTADO_COLOR: Record<string, string> = {
  pendiente_pago: "#a855f7",
  nuevo:          "#c9a84c",
  preparando:     "#f97316",
  listo:          "#4ade80",
  entregado:      "#6b7280",
};

function EstadoPedidoModal({ onClose }: { onClose: () => void }) {
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PedidoStatus | null>(null);
  const [error, setError] = useState("");
  const { tr } = useLanguage();
  const m = tr.footer.pedidoModal;

  async function buscar() {
    if (!numero.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/pedidos/estado?numero=${encodeURIComponent(numero.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? m.errorNotFound);
      } else {
        setResult(data);
      }
    } catch {
      setError(m.errorConnection);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(4px)", zIndex: 9999,
        }}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        background: "#0f0f16", border: "1px solid rgba(201,168,76,0.25)",
        borderRadius: 12, width: "min(440px, 94vw)",
        padding: "2rem", zIndex: 10000, boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontFamily: "Georgia,serif", fontSize: 20, color: "#c9a84c", margin: 0 }}>
              {m.title}
            </h2>
            <p style={{ fontFamily: "sans-serif", fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
              {m.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, color: "rgba(255,255,255,0.4)", cursor: "pointer",
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, lineHeight: 1,
            }}
          >×</button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <input
            type="text"
            value={numero}
            onChange={e => setNumero(e.target.value)}
            onKeyDown={e => e.key === "Enter" && buscar()}
            placeholder={m.placeholder}
            style={{
              flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: 8, color: "#fff", fontFamily: "Georgia,serif", fontSize: 15,
              padding: "0.6rem 0.875rem", outline: "none",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "#c9a84c")}
            onBlur={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
          />
          <button
            onClick={buscar}
            disabled={loading || !numero.trim()}
            style={{
              background: loading ? "rgba(201,168,76,0.2)" : "#c9a84c",
              border: "none", borderRadius: 8, color: "#0a0a0f",
              fontFamily: "sans-serif", fontSize: 13, fontWeight: 700,
              padding: "0 1.25rem", cursor: loading ? "default" : "pointer",
              letterSpacing: "0.05em", textTransform: "uppercase", transition: "background 150ms",
              opacity: !numero.trim() ? 0.4 : 1,
            }}
          >
            {loading ? "..." : m.btn}
          </button>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8, padding: "0.75rem 1rem", color: "#fca5a5",
            fontFamily: "sans-serif", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: `1px solid ${ESTADO_COLOR[result.estado] ?? "#c9a84c"}44`,
            borderRadius: 10, padding: "1.25rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <p style={{ fontFamily: "Georgia,serif", fontSize: 22, color: "#c9a84c", margin: 0, fontWeight: 700 }}>
                  {result.orderNumber}
                </p>
                <p style={{ fontFamily: "sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                  {result.nombre}
                </p>
              </div>
            </div>

            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: `${ESTADO_COLOR[result.estado] ?? "#c9a84c"}22`,
              border: `1px solid ${ESTADO_COLOR[result.estado] ?? "#c9a84c"}55`,
              borderRadius: 20, padding: "0.35rem 0.875rem",
            }}>
              <span style={{ fontSize: 16 }}>{result.estadoEmoji}</span>
              <span style={{
                fontFamily: "sans-serif", fontSize: 13, fontWeight: 600,
                color: ESTADO_COLOR[result.estado] ?? "#c9a84c",
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                {result.estadoLabel}
              </span>
            </div>

            {result.horaRecogida && (
              <p style={{ fontFamily: "sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: "0.75rem", marginBottom: 0 }}>
                🕐 {m.labelRecogida}: <strong style={{ color: "rgba(255,255,255,0.7)" }}>{result.horaRecogida}</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ——— Footer ——— */
export default function FooterSection() {
  const [showModal, setShowModal] = useState(false);
  const { tr } = useLanguage();
  const f = tr.footer;
  const n = tr.nav;

  const navLinks = [
    { text: n.inicio,    href: "/" },
    { text: n.concepto,  href: "/#concepto" },
    { text: n.menu,      href: "/#menu" },
    { text: n.galeria,   href: "/#galeria" },
    { text: n.reservar,  href: "/#reservas" },
  ];

  const pedirLinks = [
    { text: n.takeaway,          href: "/take-away" },
    { text: "Delivery Wolt",     href: "https://wolt.com" },
    { text: "Delivery Foodora",  href: "https://foodora.no" },
    { text: n.reservar,          href: "/#reservas" },
  ];

  return (
    <>
      {showModal && <EstadoPedidoModal onClose={() => setShowModal(false)} />}

      <footer style={{ background: "#0a0a0f", borderTop: "1px solid rgba(201,168,76,0.1)", padding: "2rem clamp(1.5rem,6vw,4rem) 1.25rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>

          {/* Top */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "2rem", paddingBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>

            {/* Brand */}
            <div>
              <Image src="/images/COYO-logo-2026-White.png" alt="Coyo Restaurant Oslo" width={80} height={49} style={{ opacity: 0.7, marginBottom: "0.75rem" }} />
              <p className="font-sans" style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", maxWidth: 300, lineHeight: 1.7, marginBottom: "1rem" }}>
                {f.tagline}
              </p>
              <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
                {[
                  {
                    label: "Instagram", href: "https://www.instagram.com/coyo_restaurant/", gold: true,
                    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>
                  },
                  {
                    label: "TikTok", href: "https://www.tiktok.com/@coyo_restaurant", gold: true,
                    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>
                  },
                  {
                    label: "Web", href: "https://coyorestaurant.no", gold: false,
                    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                  },
                  {
                    label: "Wolt", href: "https://wolt.com", gold: false,
                    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12l2.5 2.5L16 9"/></svg>
                  },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    title={s.label}
                    style={{ color: s.gold ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.25)", transition: "color 200ms", display: "flex", alignItems: "center" }}
                    onMouseEnter={e => (e.currentTarget.style.color = s.gold ? "#c9a84c" : "rgba(255,255,255,0.7)")}
                    onMouseLeave={e => (e.currentTarget.style.color = s.gold ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.25)")}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Navegación */}
            <div>
              <p className="font-sans" style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.16)", marginBottom: "0.75rem" }}>
                {f.links}
              </p>
              {navLinks.map(l => (
                <Link key={l.href} href={l.href}
                  className="block font-sans transition-colors"
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#c9a84c")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                >
                  {l.text}
                </Link>
              ))}
            </div>

            {/* Pedir */}
            <div>
              <p className="font-sans" style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.16)", marginBottom: "0.75rem" }}>
                {n.takeaway}
              </p>
              {pedirLinks.map(l => (
                <Link key={l.href + l.text} href={l.href}
                  className="block font-sans transition-colors"
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#c9a84c")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                >
                  {l.text}
                </Link>
              ))}

              <button
                onClick={() => setShowModal(true)}
                className="block font-sans transition-colors"
                style={{
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                  fontSize: 13, color: "rgba(201,168,76,0.55)", marginBottom: "0.5rem",
                  textAlign: "left",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#c9a84c")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(201,168,76,0.55)")}
              >
                {f.pedido} ↗
              </button>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between font-sans" style={{ gap: "0.75rem", paddingTop: "2rem", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(255,255,255,0.12)" }}>
            <span>© 2026 Coyo Restaurant AS — Sorengkaia 165, 0194 Oslo</span>
            <a href="https://underdesignai.com" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", gap: "0.75rem", alignItems: "center", textDecoration: "none", color: "rgba(255,255,255,0.12)", transition: "color 200ms" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(201,168,76,0.6)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.12)")}>
              <span style={{ width: 1, height: 10, background: "rgba(201,168,76,0.2)", display: "inline-block" }} />
              <span>Web App by Flowprintcorp</span>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
