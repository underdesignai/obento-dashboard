"use client";

import { useEffect, useState } from "react";
import { Bot, Save, Check, Eye, EyeOff, Key, Clock, BookOpen, Settings2 } from "lucide-react";

type Hours = Record<string, { open: string; close: string; active: boolean }>;
type Config = {
  enabled: boolean;
  apiProvider: "anthropic" | "openai";
  apiKey: string;
  model: string;
  systemPrompt: string;
  businessHours: Hours;
  knowledgeBase: string;
  apiKeySet?: boolean;
};

const DAYS = [
  { key: "lunes",     label: "Lunes" },
  { key: "martes",    label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves",    label: "Jueves" },
  { key: "viernes",   label: "Viernes" },
  { key: "sabado",    label: "Sábado" },
  { key: "domingo",   label: "Domingo" },
];

const MODELS = {
  anthropic: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-8"],
  openai:    ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
};

const INPUT: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 4, padding: "0.625rem 0.875rem", color: "#fff", fontSize: 13, outline: "none",
  boxSizing: "border-box",
};

const TABS = [
  { key: "general",    label: "General",        icon: Settings2 },
  { key: "horarios",   label: "Horarios",        icon: Clock },
  { key: "conocimiento", label: "Base de conocimiento", icon: BookOpen },
];

export default function AgentePage() {
  const [config, setConfig]   = useState<Config | null>(null);
  const [tab, setTab]         = useState("general");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/agente")
      .then(r => r.json())
      .then(d => setConfig({ ...d, apiKey: "" }));
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    await fetch("/api/admin/agente", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const testAgent = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "¿Cuáles son vuestros horarios?" }] }),
    });
    const { reply } = await res.json();
    setTestResult(reply);
    setTesting(false);
  };

  const set = (k: keyof Config, v: unknown) => setConfig(prev => prev ? { ...prev, [k]: v } : prev);

  const setHour = (day: string, field: "open" | "close" | "active", value: string | boolean) => {
    if (!config) return;
    setConfig({ ...config, businessHours: { ...config.businessHours, [day]: { ...config.businessHours[day], [field]: value } } });
  };

  if (!config) return <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Cargando...</p>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", marginBottom: "0.25rem" }}>Configuración</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Bot size={22} style={{ color: "#c9a84c" }} /> Agente IA
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Toggle agente activo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingRight: "1rem", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>Agente activo</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>El chat flotante aparecerá en la web</p>
            </div>
            <button onClick={() => set("enabled", !config.enabled)}
              style={{ width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer", position: "relative", transition: "background 200ms", background: config.enabled ? "#c9a84c" : "rgba(255,255,255,0.1)", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 3, left: config.enabled ? 25 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 200ms", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
            </button>
          </div>
          {/* Botones */}
          <button onClick={testAgent} disabled={testing}
            style={{ padding: "0.625rem 1.25rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
            {testing ? "Probando..." : "Probar agente"}
          </button>
          <button onClick={save} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.5rem", background: saved ? "rgba(74,222,128,0.15)" : "linear-gradient(135deg, #c9a84c, #8b6914)", color: saved ? "#4ade80" : "#0a0a0f", border: saved ? "1px solid rgba(74,222,128,0.3)" : "none", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {saved ? <><Check size={14} /> Guardado</> : <><Save size={14} /> {saving ? "Guardando..." : "Guardar"}</>}
          </button>
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 6, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(96,165,250,0.7)", marginBottom: "0.4rem" }}>Respuesta del agente</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{testResult}</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "1rem" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: 4, border: "1px solid", fontSize: 13, cursor: "pointer",
                background: active ? "rgba(201,168,76,0.1)" : "transparent",
                borderColor: active ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)",
                color: active ? "#c9a84c" : "rgba(255,255,255,0.35)" }}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: GENERAL ── */}
      {tab === "general" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Provider */}
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>Proveedor de IA</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["anthropic", "openai"] as const).map(p => (
                <button key={p} onClick={() => { set("apiProvider", p); set("model", MODELS[p][0]); }}
                  style={{ padding: "0.5rem 1.25rem", borderRadius: 4, border: "1px solid", fontSize: 13, cursor: "pointer",
                    background: config.apiProvider === p ? "rgba(201,168,76,0.1)" : "transparent",
                    borderColor: config.apiProvider === p ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)",
                    color: config.apiProvider === p ? "#c9a84c" : "rgba(255,255,255,0.35)" }}>
                  {p === "anthropic" ? "Anthropic (Claude)" : "OpenAI (GPT)"}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>
              <Key size={11} style={{ display: "inline", marginRight: 4 }} />
              API Key {config.apiKeySet && <span style={{ color: "#4ade80", marginLeft: 6 }}>✓ Configurada</span>}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showKey ? "text" : "password"}
                style={{ ...INPUT, paddingRight: "2.5rem" }}
                value={config.apiKey}
                onChange={e => set("apiKey", e.target.value)}
                placeholder={config.apiKeySet ? "Deja vacío para mantener la actual" : "sk-ant-... o sk-..."}
              />
              <button onClick={() => setShowKey(s => !s)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Model */}
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>Modelo</label>
            <select value={config.model} onChange={e => set("model", e.target.value)}
              style={{ ...INPUT, cursor: "pointer" }}>
              {MODELS[config.apiProvider].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* System prompt */}
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>System Prompt</label>
            <textarea
              style={{ ...INPUT, resize: "vertical", minHeight: 160, lineHeight: 1.6 }}
              value={config.systemPrompt}
              onChange={e => set("systemPrompt", e.target.value)}
            />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: "0.4rem" }}>
              Define la personalidad y comportamiento del agente. La base de conocimiento se añade automáticamente.
            </p>
          </div>
        </div>
      )}

      {/* ── TAB: HORARIOS ── */}
      {tab === "horarios" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem" }}>
            El agente indica automáticamente si el restaurante está abierto o cerrado según estos horarios.
          </p>
          {DAYS.map(({ key, label }) => {
            const day = config.businessHours[key] ?? { open: "12:00", close: "22:00", active: false };
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "0.875rem 1.25rem" }}>
                {/* Toggle */}
                <button onClick={() => setHour(key, "active", !day.active)}
                  style={{ width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", position: "relative", transition: "background 200ms", background: day.active ? "#c9a84c" : "rgba(255,255,255,0.1)", flexShrink: 0 }}>
                  <span style={{ position: "absolute", top: 2, left: day.active ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 200ms" }} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: day.active ? "#fff" : "rgba(255,255,255,0.3)", width: 90, flexShrink: 0 }}>{label}</span>
                {day.active ? (
                  <>
                    <input type="time" value={day.open} onChange={e => setHour(key, "open", e.target.value)}
                      style={{ ...INPUT, width: 110 }} />
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>—</span>
                    <input type="time" value={day.close} onChange={e => setHour(key, "close", e.target.value)}
                      style={{ ...INPUT, width: 110 }} />
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>Cerrado</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: CONOCIMIENTO ── */}
      {tab === "conocimiento" && (
        <div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: "1rem", lineHeight: 1.6 }}>
            El agente usa este texto como contexto. Incluye menú, precios, políticas, información especial, etc. Soporta Markdown.
          </p>
          <textarea
            style={{ ...INPUT, resize: "vertical", minHeight: 420, lineHeight: 1.7, fontFamily: "monospace", fontSize: 12 }}
            value={config.knowledgeBase}
            onChange={e => set("knowledgeBase", e.target.value)}
          />
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: "0.5rem" }}>
            {config.knowledgeBase.length} caracteres · ~{Math.ceil(config.knowledgeBase.length / 4)} tokens
          </p>
        </div>
      )}
    </div>
  );
}
