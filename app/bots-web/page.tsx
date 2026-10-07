"use client";

import { useEffect, useState } from "react";
import {
  Bot, MessageSquare, MessageCircle, Send, CheckCircle2, AlertCircle, RefreshCw,
  Sparkles, ShieldCheck, Eye, Palette, Settings2, Plus, Trash2
} from "lucide-react";
import { useSession } from "@/lib/session";

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 8,
  padding: "0.65rem 0.9rem",
  color: "#f3ede0",
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255, 255, 255, 0.5)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  display: "block",
  marginBottom: "0.35rem",
  fontWeight: 700,
};

export default function BotsWebPage() {
  useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Configuración del Bot Web
  const [activo, setActivo] = useState(true);
  const [nombreBot, setNombreBot] = useState("Obento Bot");
  const [saludoInicial, setSaludoInicial] = useState("¡Konnichiwa! 👋 Bienvenido a Obento Japanese Food. ¿Te apetece alguna recomendación de sushi para hoy?");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [colorTema, setColorTema] = useState("#c81e22");
  const [sugerencias, setSugerencias] = useState<string[]>([
    "🍣 ¿Cuáles son los rollos más pedidos?",
    "🌾 ¿Tenéis opciones sin gluten?",
    "🕒 ¿Cuál es el horario de recogida hoy?",
  ]);
  const [newSugerencia, setNewSugerencia] = useState("");

  // Simulador de chat web
  const [simMessages, setSimMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    {
      sender: "bot",
      text: "¡Konnichiwa! 👋 Bienvenido a Obento Japanese Food. ¿Te apetece alguna recomendación de sushi para hoy?",
    },
  ]);
  const [simInput, setSimInput] = useState("");

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bots-web");
      if (res.ok) {
        const data = await res.json();
        setActivo(data.activo !== undefined ? data.activo : true);
        if (data.nombreBot) setNombreBot(data.nombreBot);
        if (data.saludoInicial) setSaludoInicial(data.saludoInicial);
        if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
        if (data.colorTema) setColorTema(data.colorTema);
        if (Array.isArray(data.sugerencias)) setSugerencias(data.sugerencias);
      }
    } catch (e) {
      console.error("Error al cargar config bots web:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/bots-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activo,
          nombreBot,
          saludoInicial,
          systemPrompt,
          colorTema,
          sugerencias,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        const d = await res.json();
        setSaveError(d.error || "Error al guardar configuración.");
      }
    } catch (e: any) {
      setSaveError(e.message || "Error al conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const addSugerencia = () => {
    if (!newSugerencia.trim()) return;
    setSugerencias([...sugerencias, newSugerencia.trim()]);
    setNewSugerencia("");
  };

  const removeSugerencia = (index: number) => {
    setSugerencias(sugerencias.filter((_, i) => i !== index));
  };

  const handleSimSend = (text?: string) => {
    const val = text || simInput;
    if (!val.trim()) return;

    const lower = val.toLowerCase();
    let reply = "¡Excelente elección! Puedes añadir cualquiera de nuestros platos al carrito con un solo clic. ¿Deseas saber más sobre sus ingredientes?";
    if (lower.includes("mas pedido") || lower.includes("rollo")) {
      reply = "Nuestros platos estrella son el Uramaki Salmón Philadelphia, el Rollo Dragón con langostino crujiente y los Nigiris de Chutoro flameado. ¡Te van a encantar!";
    } else if (lower.includes("gluten") || lower.includes("celiaco")) {
      reply = "Disponemos de salsa de soja sin gluten y elaboramos la mayoría de nuestros Nigiris y Makis aptos para celíacos. Consulta los alérgenos marcados en cada plato.";
    } else if (lower.includes("horario")) {
      reply = "Abrimos de Martes a Domingo para recogida de 13:00 a 16:00 y de 20:00 a 23:30 (Lunes cerrado).";
    }

    setSimMessages((prev) => [...prev, { sender: "user", text: val }, { sender: "bot", text: reply }]);
    if (!text) setSimInput("");
  };

  return (
    <div style={{ padding: "1.75rem", maxWidth: 1400, margin: "0 auto", color: "#f3ede0" }}>
      {/* ── CABECERA ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #c81e22 0%, #851316 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 18px rgba(200, 30, 34, 0.35)",
            }}
          >
            <Bot size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#fff" }}>
                Bots Web · Asistente en Tienda
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: activo ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.08)",
                  border: `1px solid ${activo ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.15)"}`,
                  color: activo ? "#4ade80" : "rgba(255, 255, 255, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: activo ? "#10b981" : "#888" }} />
                {activo ? "Visible en obentojapanesefood.es" : "Pausado"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255, 255, 255, 0.45)" }}>
              Configura el widget de chat interactivo que guía a los clientes a añadir platos al carrito en la web.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setActivo(!activo)}
            style={{
              background: activo ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${activo ? "rgba(16, 185, 129, 0.35)" : "rgba(255, 255, 255, 0.1)"}`,
              borderRadius: 8,
              padding: "0.55rem 0.9rem",
              color: activo ? "#4ade80" : "rgba(255, 255, 255, 0.5)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ShieldCheck size={14} />
            {activo ? "Widget Activo" : "Widget Inactivo"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            style={{
              background: "linear-gradient(135deg, #c81e22 0%, #851316 100%)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 8,
              padding: "0.55rem 1.25rem",
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 7,
              boxShadow: "0 4px 15px rgba(200, 30, 34, 0.35)",
            }}
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.35)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", color: "#6ee7b7", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} /> Configuración de Bots Web guardada correctamente.
        </div>
      )}

      {saveError && (
        <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.35)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} /> {saveError}
        </div>
      )}

      {/* ── GRID PRINCIPAL ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr", gap: "1.75rem", alignItems: "start" }}>
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ background: "#0e0c0b", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>
              Personalización del Asistente en la Web
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={LABEL_STYLE}>Nombre del Bot</label>
                <input
                  type="text"
                  value={nombreBot}
                  onChange={(e) => setNombreBot(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Color Corporativo del Botón</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="color"
                    value={colorTema}
                    onChange={(e) => setColorTema(e.target.value)}
                    style={{ width: 36, height: 36, border: "none", borderRadius: 6, cursor: "pointer", background: "none" }}
                  />
                  <input
                    type="text"
                    value={colorTema}
                    onChange={(e) => setColorTema(e.target.value)}
                    style={{ ...INPUT_STYLE, flex: 1 }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={LABEL_STYLE}>Mensaje Emergente de Bienvenida</label>
              <textarea
                rows={2}
                value={saludoInicial}
                onChange={(e) => setSaludoInicial(e.target.value)}
                style={{ ...INPUT_STYLE, resize: "vertical" }}
              />
            </div>

            <div>
              <label style={LABEL_STYLE}>Botones de Preguntas Sugeridas (Chips Rápidos)</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                {sugerencias.map((sug, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="text"
                      value={sug}
                      onChange={(e) => {
                        const copy = [...sugerencias];
                        copy[idx] = e.target.value;
                        setSugerencias(copy);
                      }}
                      style={INPUT_STYLE}
                    />
                    <button
                      type="button"
                      onClick={() => removeSugerencia(idx)}
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, color: "#fca5a5", padding: "6px 8px", cursor: "pointer" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={newSugerencia}
                  onChange={(e) => setNewSugerencia(e.target.value)}
                  placeholder="Añadir nueva sugerencia rápida..."
                  style={INPUT_STYLE}
                />
                <button
                  type="button"
                  onClick={addSugerencia}
                  style={{ background: "rgba(200,30,34,0.2)", border: "1px solid rgba(200,30,34,0.4)", borderRadius: 8, padding: "0 12px", color: "#ff8e91", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Plus size={14} /> Añadir
                </button>
              </div>
            </div>

            <div>
              <label style={LABEL_STYLE}>System Prompt del Asistente Web</label>
              <textarea
                rows={8}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                style={{ ...INPUT_STYLE, fontFamily: "monospace", fontSize: 12, resize: "vertical" }}
              />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: PREVIEW DE TIENDA Y WIDGET FLOTANTE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "#0e0c0b", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "1.25rem", height: 680, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                Preview del Widget Flotante en la Tienda
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                obentojapanesefood.es
              </span>
            </div>

            {/* Contenedor Mockup de la Web */}
            <div
              style={{
                flex: 1,
                background: "#080808",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: 12,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "16px",
              }}
            >
              {/* Ventana de Chat Flotante abierta */}
              <div
                style={{
                  background: "#141110",
                  border: "1px solid rgba(200, 30, 34, 0.35)",
                  borderRadius: 14,
                  boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
                  display: "flex",
                  flexDirection: "column",
                  height: 480,
                  overflow: "hidden",
                }}
              >
                {/* Cabecera del Widget */}
                <div
                  style={{
                    background: colorTema,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    color: "#fff",
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MessageCircle size={16} color={colorTema} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{nombreBot}</div>
                    <div style={{ fontSize: 10, opacity: 0.85 }}>En línea · Asistente Obento</div>
                  </div>
                </div>

                {/* Mensajes */}
                <div style={{ flex: 1, padding: 12, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, background: "#100d0c" }}>
                  {simMessages.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: m.sender === "user" ? "flex-end" : "flex-start" }}>
                      <div
                        style={{
                          maxWidth: "85%",
                          padding: "8px 12px",
                          borderRadius: m.sender === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                          background: m.sender === "user" ? colorTema : "rgba(255,255,255,0.06)",
                          color: "#fff",
                          fontSize: 12.5,
                          lineHeight: 1.45,
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sugerencias Rápidas */}
                <div style={{ padding: "6px 10px", background: "#0c0a09", display: "flex", gap: 6, overflowX: "auto", whiteSpace: "nowrap" }}>
                  {sugerencias.slice(0, 2).map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSimSend(sug)}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        padding: "3px 8px",
                        fontSize: 10,
                        color: "#f3ede0",
                        cursor: "pointer",
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div style={{ padding: "8px 10px", background: "#141110", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    value={simInput}
                    onChange={(e) => setSimInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSimSend();
                    }}
                    placeholder="Pregunta algo sobre la carta..."
                    style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "#fff", outline: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSimSend()}
                    style={{ width: 32, height: 32, borderRadius: 6, background: colorTema, border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>

              {/* Botón Flotante en la esquina inferior */}
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: colorTema,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 20px rgba(200, 30, 34, 0.4)",
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                <MessageCircle size={26} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
