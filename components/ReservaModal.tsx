"use client";

import { useState, useEffect, useRef } from "react";
import { X, CalendarCheck, Loader2, Check } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const HORARIOS: Record<string, { open: string; close: string }> = {
  0: { open: "13:00", close: "21:00" },
  1: { open: "16:00", close: "22:00" },
  2: { open: "16:00", close: "22:00" },
  3: { open: "16:00", close: "22:00" },
  4: { open: "16:00", close: "22:00" },
  5: { open: "16:00", close: "22:00" },
  6: { open: "13:00", close: "22:00" },
};

function getSlots(date: string): string[] {
  if (!date) return [];
  const day = new Date(date).getDay();
  const h = HORARIOS[day];
  if (!h) return [];
  const slots: string[] = [];
  const [oh, om] = h.open.split(":").map(Number);
  const [ch, cm] = h.close.split(":").map(Number);
  let cur = oh * 60 + om;
  const end = ch * 60 + cm - 30;
  while (cur <= end) {
    const hh = String(Math.floor(cur / 60)).padStart(2, "0");
    const mm = String(cur % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
    cur += 30;
  }
  return slots;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

const INPUT: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6, padding: "0.75rem 1rem", color: "#fff", fontSize: 14,
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

type Props = { open: boolean; onClose: () => void };

export default function ReservaModal({ open, onClose }: Props) {
  const { tr, lang } = useLanguage();
  const m = tr.reservaModal;
  const rs = tr.reservas;

  const [seccion,  setSeccion]  = useState<"mexican" | "sushi">("mexican");
  const [nombre,   setNombre]   = useState("");
  const [email,    setEmail]    = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha,    setFecha]    = useState("");
  const [hora,     setHora]     = useState("");
  const [personas, setPersonas] = useState("2");
  const [mensaje,  setMensaje]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const slots = getSlots(fecha);

  useEffect(() => {
    if (open) {
      setDone(false); setError("");
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (hora && !slots.includes(hora)) setHora("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !fecha || !hora) {
      setError(m.errorRequired); return;
    }
    const fechaHora = new Date(`${fecha}T${hora}:00`);
    const ahora = new Date();
    const manana = new Date(ahora);
    manana.setDate(manana.getDate() + 1);
    manana.setHours(0, 0, 0, 0);
    const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000);
    if (fechaHora < manana || fechaHora < unaHoraDespues) {
      setError(m.errorDate); return;
    }
    setLoading(true); setError("");
    const res = await fetch("/api/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, telefono, fecha, hora, personas, mensaje, seccion, lang }),
    });
    setLoading(false);
    if (res.ok) { setDone(true); }
    else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || m.errorGeneric);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}
    >
      <div
        style={{ width: "100%", maxWidth: 480, background: "#0e0d0b", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #c9a84c, transparent)" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem 1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <CalendarCheck size={18} style={{ color: "#c9a84c" }} />
            <div>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(201,168,76,0.6)", marginBottom: 2 }}>Coyo Restaurant · Oslo</p>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif" }}>{m.title}</h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.35rem", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "0 1.5rem 1.5rem" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                <Check size={24} style={{ color: "#4ade80" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif", marginBottom: "0.5rem" }}>{m.successTitle}</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                {m.successDesc}
              </p>
              <button onClick={onClose} style={{ padding: "0.75rem 2rem", background: "linear-gradient(135deg, #c9a84c, #8b6914)", color: "#0a0a0f", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {m.close}
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              {/* Sección */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "flex-start" }}>
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", marginRight: "0.25rem", lineHeight: "32px" }}>{m.seccion}:</p>
                {(["mexican", "sushi"] as const).map(s => (
                  <button key={s} type="button" onClick={() => setSeccion(s)} style={{
                    padding: "0.4rem 0.875rem",
                    borderRadius: 6,
                    border: `1.5px solid ${seccion === s ? "#c9a84c" : "rgba(255,255,255,0.1)"}`,
                    background: seccion === s ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)",
                    color: seccion === s ? "#c9a84c" : "rgba(255,255,255,0.35)",
                    fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em",
                    cursor: "pointer", transition: "all 200ms", whiteSpace: "nowrap",
                  }}>
                    {s === "mexican" ? rs.secciones.mexican : rs.secciones.sushi}
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "0.875rem" }}>

                {/* Nombre */}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.4rem" }}>
                    {m.nombre}
                  </label>
                  <input ref={nameRef} type="text" value={nombre} onChange={e => setNombre(e.target.value)} required style={INPUT} />
                </div>

                {/* Email */}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.4rem" }}>
                    {m.email}
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={INPUT} />
                </div>

                {/* Teléfono */}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.4rem" }}>
                    {m.telefono}
                  </label>
                  <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+47 000 00 000" style={INPUT} />
                </div>

                {/* Fecha */}
                <div>
                  <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.4rem" }}>
                    {m.fecha}
                  </label>
                  <input type="date" value={fecha} min={today()} onChange={e => setFecha(e.target.value)} required style={{ ...INPUT, colorScheme: "dark" }} />
                </div>

                {/* Hora */}
                <div>
                  <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.4rem" }}>
                    {m.hora}
                  </label>
                  <select value={hora} onChange={e => setHora(e.target.value)} required disabled={!fecha}
                    style={{ ...INPUT, cursor: fecha ? "pointer" : "not-allowed", opacity: fecha ? 1 : 0.4, colorScheme: "dark" }}>
                    <option value="">{m.horaPlaceholder}</option>
                    {slots.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Personas */}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.4rem" }}>
                    {m.personas}
                  </label>
                  <select value={personas} onChange={e => setPersonas(e.target.value)} style={{ ...INPUT, cursor: "pointer", colorScheme: "dark" }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                    <option value="11">+10</option>
                  </select>
                </div>

                {/* Mensaje */}
                <div style={{ gridColumn: "1/-1" }}>
                  <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.4rem" }}>
                    {m.mensaje}
                  </label>
                  <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder={m.mensajePlaceholder} rows={2}
                    style={{ ...INPUT, resize: "none" }} />
                </div>
              </div>

              {error && <p style={{ fontSize: 13, color: "rgba(252,165,165,0.8)", marginBottom: "0.875rem" }}>{error}</p>}

              <button type="submit" disabled={loading}
                style={{ width: "100%", padding: "0.875rem", background: "linear-gradient(135deg, #c9a84c, #8b6914)", color: "#0a0a0f", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> {m.btnLoading}</> : m.btn}
              </button>

              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: "0.75rem", lineHeight: 1.5 }}>
                23 68 75 57 · booking@coyorestaurant.no
              </p>
            </form>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
