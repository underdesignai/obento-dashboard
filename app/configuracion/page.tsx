"use client";

import { useEffect, useState } from "react";
import { Bot, Save, Check, Eye, EyeOff, Key, Clock, BookOpen, Settings2, Mail, ShoppingBag, CreditCard, Globe, HardDrive, Download, Trash2, RefreshCw, CheckSquare, Square, Upload } from "lucide-react";
import { useAdminLanguage } from "@/lib/LanguageContext";

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

const DAY_KEYS = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"] as const;

const MODELS = {
  anthropic: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-8"],
  openai:    ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
};

const INPUT: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 4, padding: "0.6rem 0.9rem", color: "#fff", fontSize: 14, outline: "none",
  boxSizing: "border-box",
};

const TIMEZONES = [
  { value: "Europe/Oslo",      label: "Oslo (UTC+1/+2)" },
  { value: "Europe/Madrid",    label: "Madrid (UTC+1/+2)" },
  { value: "Europe/London",    label: "Londres (UTC+0/+1)" },
  { value: "Europe/Paris",     label: "París (UTC+1/+2)" },
  { value: "Europe/Berlin",    label: "Berlín (UTC+1/+2)" },
  { value: "Europe/Rome",      label: "Roma (UTC+1/+2)" },
  { value: "Europe/Amsterdam", label: "Ámsterdam (UTC+1/+2)" },
  { value: "Europe/Stockholm", label: "Estocolmo (UTC+1/+2)" },
  { value: "Europe/Copenhagen",label: "Copenhague (UTC+1/+2)" },
  { value: "Europe/Helsinki",  label: "Helsinki (UTC+2/+3)" },
  { value: "Europe/Lisbon",    label: "Lisboa (UTC+0/+1)" },
  { value: "Europe/Warsaw",    label: "Varsovia (UTC+1/+2)" },
  { value: "America/New_York", label: "Nueva York (UTC-5/-4)" },
  { value: "America/Chicago",  label: "Chicago (UTC-6/-5)" },
  { value: "America/Denver",   label: "Denver (UTC-7/-6)" },
  { value: "America/Los_Angeles", label: "Los Ángeles (UTC-8/-7)" },
  { value: "America/Mexico_City", label: "Ciudad de México (UTC-6/-5)" },
  { value: "America/Bogota",   label: "Bogotá (UTC-5)" },
  { value: "America/Lima",     label: "Lima (UTC-5)" },
  { value: "America/Santiago", label: "Santiago (UTC-4/-3)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (UTC-3)" },
  { value: "America/Sao_Paulo",label: "São Paulo (UTC-3/-2)" },
  { value: "Asia/Dubai",       label: "Dubái (UTC+4)" },
  { value: "Asia/Tokyo",       label: "Tokio (UTC+9)" },
  { value: "Asia/Shanghai",    label: "Shanghái (UTC+8)" },
  { value: "Australia/Sydney", label: "Sídney (UTC+10/+11)" },
  { value: "UTC",              label: "UTC (UTC+0)" },
];

const TAB_ICONS: Record<string, React.ElementType> = {
  sitio: Globe, general: Settings2, horarios: Clock, email: Mail, takeaway: ShoppingBag, stripe: CreditCard, backup: HardDrive,
};
const TAB_KEYS = ["sitio","general","horarios","email","takeaway","stripe","backup"] as const;

const BACKUP_ITEMS = [
  { key: "reservas",      label: "Reservas",      desc: "Todas las reservas de la BD" },
  { key: "pedidos",       label: "Pedidos",        desc: "Todos los pedidos takeaway" },
  { key: "clientes",      label: "Clientes",       desc: "Base de datos de clientes" },
  { key: "reseñas",       label: "Reseñas",        desc: "Reseñas y reviews" },
  { key: "cupones",       label: "Cupones",        desc: "Cupones de descuento" },
  { key: "configuracion", label: "Configuración",  desc: "Ajustes del sistema" },
  { key: "usuarios",      label: "Usuarios",       desc: "Trabajadores con acceso" },
  { key: "platos",        label: "Carta / Platos", desc: "Menú y platos" },
  { key: "servicios",     label: "Servicios",      desc: "Servicios del restaurante" },
  { key: "galeria",       label: "Galería (BD)",   desc: "Entradas de galería en BD" },
  { key: "imagenes",      label: "Imágenes",       desc: "Todas las fotos JPG/PNG/WEBP" },
  { key: "videos",        label: "Vídeos",         desc: "Archivos MP4 de la web" },
  { key: "frames",        label: "Frames de vídeo",desc: "Fotogramas del hero animado" },
];

type TakeawayConfig = {
  takeaway_dias_minimos: string;
  takeaway_hoy_habilitado: string;
  takeaway_horas_minimas: string;
  takeaway_mensaje_recuerda: string;
  takeaway_iva: string;
};

export default function AgentePage() {
  const { tr } = useAdminLanguage();
  const a = tr.admin;
  const [config, setConfig]   = useState<Config | null>(null);
  const [tab, setTab]         = useState("general");

  // Take Away config
  const [tConfig, setTConfig]   = useState<TakeawayConfig>({
    takeaway_dias_minimos: "2",
    takeaway_hoy_habilitado: "false",
    takeaway_horas_minimas: "2",
    takeaway_mensaje_recuerda: "los pedidos realizados hoy se preparan y entregan a partir de pasado mañana. Selecciona el día y hora que mejor te convenga.",
    takeaway_iva: "25",
  });
  const [tSaving, setTSaving] = useState(false);
  const [tSaved,  setTSaved]  = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // General / sitio config
  const [timezone,      setTimezone]      = useState("Europe/Oslo");
  const [sitioSaving,   setSitioSaving]   = useState(false);
  const [sitioSaved,    setSitioSaved]    = useState(false);

  // Stripe config
  const [stripePk,       setStripePk]       = useState("");
  const [stripeSk,       setStripeSk]       = useState("");
  const [stripeHasSk,    setStripeHasSk]    = useState(false);
  const [stripeTestMode, setStripeTestMode] = useState(true);
  const [showSk,         setShowSk]         = useState(false);
  const [stripeSaving,   setStripeSaving]   = useState(false);
  const [stripeSaved,    setStripeSaved]    = useState(false);

  // Email config
  const [emailFrom, setEmailFrom]       = useState("");
  const [emailPass, setEmailPass]       = useState("");
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [emailSaving, setEmailSaving]   = useState(false);
  const [emailSaved, setEmailSaved]     = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Backup
  type BackupFile = { filename: string; size: number; createdAt: string };
  const [backupSelected, setBackupSelected] = useState<string[]>(BACKUP_ITEMS.map(i => i.key));
  const [backupCreating, setBackupCreating] = useState(false);
  const [backupList, setBackupList]         = useState<BackupFile[]>([]);
  const [backupListLoading, setBackupListLoading] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [dbBackupCreating, setDbBackupCreating] = useState(false);
  const [restoreFile, setRestoreFile]         = useState<File | null>(null);
  const [restoring, setRestoring]             = useState(false);
  const [restoreResult, setRestoreResult]     = useState<{ ok: boolean; msg: string } | null>(null);
  const [restoreDbFile, setRestoreDbFile]     = useState<File | null>(null);
  const [restoringDb, setRestoringDb]         = useState(false);
  const [restoreDbResult, setRestoreDbResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/configuracion/general")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.sitio_zona_horaria) setTimezone(d.sitio_zona_horaria); })
      .catch(() => {});
  }, []);

  const saveSitio = async () => {
    setSitioSaving(true);
    await fetch("/api/admin/configuracion/general", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sitio_zona_horaria: timezone }),
    });
    setSitioSaving(false);
    setSitioSaved(true);
    setTimeout(() => setSitioSaved(false), 2500);
  };

  useEffect(() => {
    fetch("/api/admin/configuracion/stripe")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setStripePk(d.publishableKey ?? ""); setStripeHasSk(d.hasSecretKey); setStripeTestMode(d.isTestMode); } })
      .catch(() => {});
  }, []);

  const saveStripe = async () => {
    setStripeSaving(true);
    await fetch("/api/admin/configuracion/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishableKey: stripePk, secretKey: stripeSk || undefined }),
    });
    setStripeSaving(false);
    setStripeSaved(true);
    setStripeSk("");
    if (stripePk) setStripeTestMode(stripePk.startsWith("pk_test_"));
    setStripeHasSk(prev => prev || !!stripeSk);
    setTimeout(() => setStripeSaved(false), 2500);
  };

  useEffect(() => {
    fetch("/api/admin/configuracion/takeaway")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setTConfig(d); })
      .catch(() => {});
  }, []);

  const saveTakeaway = async () => {
    setTSaving(true);
    await fetch("/api/admin/configuracion/takeaway", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tConfig),
    });
    setTSaving(false);
    setTSaved(true);
    setTimeout(() => setTSaved(false), 2500);
  };

  useEffect(() => {
    fetch("/api/admin/configuracion/email")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setEmailFrom(d.from ?? ""); } })
      .catch(() => {});
  }, []);

  const saveEmail = async () => {
    setEmailSaving(true);
    await fetch("/api/admin/configuracion/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: emailFrom, password: emailPass || undefined }),
    });
    setEmailSaving(false);
    setEmailSaved(true);
    setEmailPass("");
    setTimeout(() => setEmailSaved(false), 2500);
  };

  const testEmail = async () => {
    setEmailTesting(true);
    setEmailTestResult(null);
    const res = await fetch("/api/admin/configuracion/email/test", { method: "POST" });
    const data = await res.json();
    setEmailTestResult(data);
    setEmailTesting(false);
  };

  useEffect(() => {
    const cached = sessionStorage.getItem("coyo_agente_config");
    if (cached) setConfig({ ...JSON.parse(cached), apiKey: "" });
    fetch("/api/admin/agente")
      .then(r => r.json())
      .then(d => {
        sessionStorage.setItem("coyo_agente_config", JSON.stringify(d));
        setConfig(prev => ({ ...d, apiKey: prev?.apiKey ?? "" }));
      });
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

  const loadBackupList = async () => {
    setBackupListLoading(true);
    const r = await fetch("/api/admin/backup/list");
    setBackupList(await r.json());
    setBackupListLoading(false);
  };

  const loadSchedule = async () => {
    const r = await fetch("/api/admin/backup/schedule");
    const d = await r.json();
    setScheduleEnabled(d.enabled);
  };

  const createBackup = async () => {
    setBackupCreating(true);
    await fetch("/api/admin/backup/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: backupSelected }),
    });
    setBackupCreating(false);
    loadBackupList();
  };

  const downloadBackup = (filename: string) => {
    window.open(`/api/admin/backup/download/${filename}`, "_blank");
  };

  const deleteBackup = async (filename: string) => {
    await fetch("/api/admin/backup/list", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    loadBackupList();
  };

  const saveSchedule = async (val: boolean) => {
    setScheduleSaving(true);
    setScheduleEnabled(val);
    await fetch("/api/admin/backup/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: val }),
    });
    setScheduleSaving(false);
  };

  const toggleBackupItem = (key: string) => {
    setBackupSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const doRestore = async (file: File, setR: (v: boolean) => void, setRes: (v: { ok: boolean; msg: string } | null) => void, clearFile: () => void) => {
    if (!confirm("¿Restaurar este backup? Se sobreescribirán los datos actuales.")) return;
    setR(true); setRes(null);
    try {
      const fd = new FormData(); fd.append("file", file);
      const d = await (await fetch("/api/admin/backup/restore", { method: "POST", body: fd })).json();
      setRes({ ok: d.ok, msg: d.message || (d.ok ? "Restauración completada." : "Error al restaurar.") });
      if (d.ok) clearFile();
    } catch { setRes({ ok: false, msg: "Error de red al restaurar." }); }
    finally { setR(false); }
  };
  const restoreBackup   = () => restoreFile   && doRestore(restoreFile,   setRestoring,   setRestoreResult,   () => setRestoreFile(null));
  const restoreDbBackup = () => restoreDbFile && doRestore(restoreDbFile, setRestoringDb, setRestoreDbResult, () => setRestoreDbFile(null));

  const DB_ONLY_KEYS = ["reservas","pedidos","clientes","reseñas","cupones","configuracion","usuarios","platos","servicios","galeria"];
  const createDbBackup = async () => {
    setDbBackupCreating(true);
    try {
      const r = await fetch("/api/admin/backup/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: DB_ONLY_KEYS }) });
      const d = await r.json();
      if (d.ok) { downloadBackup(d.filename); loadBackupList(); }
    } finally { setDbBackupCreating(false); }
  };

  if (!config) return (
    <div style={{ opacity: 0.4, pointerEvents: "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", marginBottom: "0.25rem" }}>{a.sistema}</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff" }}>{a.configuracion}</h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ width: 120, height: 36, borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
          <div style={{ width: 100, height: 36, borderRadius: 4, background: "rgba(201,168,76,0.15)" }} />
        </div>
      </div>
      <div style={{ height: 62, borderRadius: 6, background: "rgba(255,255,255,0.02)", marginBottom: "1.5rem" }} />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TAB_KEYS.map(k => <div key={k} style={{ width: 100, height: 34, borderRadius: 4, background: "rgba(255,255,255,0.03)" }} />)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 52, borderRadius: 4, background: "rgba(255,255,255,0.02)" }} />)}
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.5)", marginBottom: "0.25rem" }}>{a.sistema}</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-playfair, serif)", color: "#fff", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Bot size={24} style={{ color: "#c9a84c" }} /> {a.configuracion}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={testAgent} disabled={testing}
            style={{ padding: "0.625rem 1.25rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
            {testing ? a.probando : a.probarAgente}
          </button>
          <button onClick={save} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.5rem", background: saved ? "rgba(74,222,128,0.15)" : "linear-gradient(135deg, #c9a84c, #8b6914)", color: saved ? "#4ade80" : "#0a0a0f", border: saved ? "1px solid rgba(74,222,128,0.3)" : "none", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            {saved ? <><Check size={14} /> {a.guardado}</> : <><Save size={14} /> {saving ? a.guardando : a.guardar}</>}
          </button>
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 6, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(96,165,250,0.7)", marginBottom: "0.4rem" }}>{a.respuestaAgente}</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{testResult}</p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "1rem" }}>
        {TAB_KEYS.map(k => {
          const Icon = TAB_ICONS[k];
          const active = tab === k;
          const labelMap: Record<string, string> = {
            sitio: "General", general: a.tabAgenteIA, horarios: a.tabHorarios,
            email: "Email", takeaway: "Take Away", stripe: "Stripe", backup: "Backup",
          };
          return (
            <button key={k} onClick={() => setTab(k)}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.9rem", borderRadius: 4, border: "1px solid", fontSize: 14, cursor: "pointer",
                background: active ? "rgba(201,168,76,0.1)" : "transparent",
                borderColor: active ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)",
                color: active ? "#c9a84c" : "rgba(255,255,255,0.35)" }}>
              <Icon size={13} /> {labelMap[k]}
            </button>
          );
        })}
      </div>

      {/* ── TAB: GENERAL ── */}
      {tab === "general" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Enable toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "1rem 1.25rem" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{a.agenteActivo}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{a.chatFlotante}</p>
            </div>
            <button onClick={() => set("enabled", !config.enabled)}
              style={{ width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer", position: "relative", transition: "background 200ms", background: config.enabled ? "#c9a84c" : "rgba(255,255,255,0.1)" }}>
              <span style={{ position: "absolute", top: 3, left: config.enabled ? 25 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 200ms", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
            </button>
          </div>

          {/* Provider */}
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>{a.proveedorIA}</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["anthropic", "openai"] as const).map(p => (
                <button key={p} onClick={() => { set("apiProvider", p); set("model", MODELS[p][0]); }}
                  style={{ padding: "0.6rem 0.9rem", borderRadius: 4, border: "1px solid", fontSize: 14, cursor: "pointer",
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
              API Key {config.apiKeySet && <span style={{ color: "#4ade80", marginLeft: 6 }}>{a.apiKeyConfigurada}</span>}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showKey ? "text" : "password"}
                style={{ ...INPUT, paddingRight: "2.5rem" }}
                value={config.apiKey}
                onChange={e => set("apiKey", e.target.value)}
                placeholder={config.apiKeySet ? a.dejaVacioMantenerActual : "sk-ant-... o sk-..."}
              />
              <button onClick={() => setShowKey(s => !s)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Model */}
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>{a.modelo}</label>
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
              {a.systemPromptDesc}
            </p>
          </div>

          {/* Base de conocimiento */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 6, marginBottom: "0.5rem" }}>
              <BookOpen size={11} /> {a.baseConocimiento}
            </label>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: "0.75rem", lineHeight: 1.6 }}>
              {a.baseConocimientoDesc}
            </p>
            <textarea
              style={{ ...INPUT, resize: "vertical", minHeight: 280, lineHeight: 1.7, fontFamily: "monospace", fontSize: 12 }}
              value={config.knowledgeBase}
              onChange={e => set("knowledgeBase", e.target.value)}
            />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: "0.4rem" }}>
              {config.knowledgeBase.length} {a.caracteres} · ~{Math.ceil(config.knowledgeBase.length / 4)} tokens
            </p>
          </div>
        </div>
      )}

      {/* ── TAB: HORARIOS ── */}
      {tab === "horarios" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: "0.5rem" }}>
            {a.horariosDesc}
          </p>
          {DAY_KEYS.map(key => {
            const dayLabelKey = ("day" + key.charAt(0).toUpperCase() + key.slice(1)) as keyof typeof a;
            const label = (a as any)[dayLabelKey] ?? key;
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
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>{a.cerrado}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: CONOCIMIENTO ── */}
      {/* ── TAB: GENERAL / SITIO ── */}
      {tab === "sitio" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "1.25rem" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>{a.zonaHorariaTitle}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
              {a.zonaHorariaDesc}
            </p>

            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>
              <Globe size={11} style={{ display: "inline", marginRight: 4 }} /> {a.zonaHorariaLabel}
            </label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              style={{ ...INPUT, width: "100%", maxWidth: 380, cursor: "pointer" }}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value} style={{ background: "#0a0a0f" }}>
                  {tz.label}
                </option>
              ))}
            </select>

            {/* Hora actual en la zona seleccionada */}
            <div style={{ marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.875rem", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 6 }}>
              <Clock size={12} style={{ color: "rgba(201,168,76,0.6)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                {a.ahoraEn} <strong style={{ color: "rgba(255,255,255,0.75)" }}>{timezone}</strong>:{" "}
                <strong style={{ color: "#c9a84c" }}>
                  {new Intl.DateTimeFormat("es-ES", { timeZone: timezone, hour: "2-digit", minute: "2-digit", weekday: "long", day: "numeric", month: "long" }).format(new Date())}
                </strong>
              </span>
            </div>
          </div>

          <div>
            <button onClick={saveSitio} disabled={sitioSaving}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 2rem", background: sitioSaved ? "rgba(74,222,128,0.15)" : "linear-gradient(135deg, #c9a84c, #8b6914)", color: sitioSaved ? "#4ade80" : "#0a0a0f", border: sitioSaved ? "1px solid rgba(74,222,128,0.3)" : "none", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {sitioSaved ? <><Check size={14} /> {a.guardado}</> : <><Save size={14} /> {sitioSaving ? a.guardando : a.guardarConfigGeneral}</>}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: STRIPE ── */}
      {tab === "stripe" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Badge modo test/live */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", background: stripeTestMode ? "rgba(96,165,250,0.06)" : "rgba(74,222,128,0.06)", border: `1px solid ${stripeTestMode ? "rgba(96,165,250,0.2)" : "rgba(74,222,128,0.2)"}`, borderRadius: 8 }}>
            <span style={{ fontSize: 20 }}>{stripeTestMode ? "🧪" : "✅"}</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: stripeTestMode ? "rgb(147,197,253)" : "#4ade80", margin: 0 }}>
                {stripeTestMode ? a.stripeModoTest : a.stripeModoProd}
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>
                {stripeTestMode ? a.stripeModoTestDesc : a.stripeModoProdDesc}
              </p>
            </div>
          </div>

          {/* Info */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "1.25rem" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 0.75rem" }}>
              <strong style={{ color: "rgba(255,255,255,0.7)" }}>{a.stripeComoObtener}</strong><br />
              1. <strong style={{ color: "#c9a84c" }}>dashboard.stripe.com</strong><br />
              2. <strong style={{ color: "#c9a84c" }}>Developers → API keys</strong><br />
              3. <em>Publishable key</em> + <em>Secret key</em><br />
              4. <code style={{ color: "#c9a84c" }}>pk_test_</code> / <code style={{ color: "#c9a84c" }}>sk_test_</code>
            </p>
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#c9a84c", textDecoration: "none", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", padding: "6px 14px", borderRadius: 4, fontWeight: 600 }}>
              🔗 {a.stripeAbrirDashboard}
            </a>
          </div>

          {/* Publishable Key */}
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>
              <Key size={11} style={{ display: "inline", marginRight: 4 }} /> {a.stripePublishableLabel}
              {stripePk && <span style={{ color: "#4ade80", marginLeft: 8 }}>{a.apiKeyConfigurada}</span>}
            </label>
            <input
              type="text"
              value={stripePk}
              onChange={e => setStripePk(e.target.value)}
              placeholder="pk_test_... o pk_live_..."
              style={INPUT}
            />
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: "0.4rem" }}>
              {a.stripePublishableDesc}
            </p>
          </div>

          {/* Secret Key */}
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>
              <Key size={11} style={{ display: "inline", marginRight: 4 }} /> {a.stripeSecretLabel}
              {stripeHasSk && <span style={{ color: "#4ade80", marginLeft: 8 }}>{a.apiKeyConfigurada}</span>}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showSk ? "text" : "password"}
                value={stripeSk}
                onChange={e => setStripeSk(e.target.value)}
                placeholder={stripeHasSk ? a.dejaVacioMantenerActual : "sk_test_... o sk_live_..."}
                style={{ ...INPUT, paddingRight: "2.5rem" }}
              />
              <button onClick={() => setShowSk(s => !s)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                {showSk ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: "0.4rem" }}>
              {a.stripeSecretDesc}
            </p>
          </div>

          {/* Guardar */}
          <div>
            <button onClick={saveStripe} disabled={stripeSaving || !stripePk}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 2rem", background: stripeSaved ? "rgba(74,222,128,0.15)" : "linear-gradient(135deg, #c9a84c, #8b6914)", color: stripeSaved ? "#4ade80" : "#0a0a0f", border: stripeSaved ? "1px solid rgba(74,222,128,0.3)" : "none", borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {stripeSaved ? <><Check size={14} /> {a.guardado}</> : <><Save size={14} /> {stripeSaving ? a.guardando : a.guardarStripe}</>}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: TAKE AWAY ── */}
      {tab === "takeaway" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Días de antelación */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "1.25rem" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>{a.takeawayDiasTitle}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: "1rem", lineHeight: 1.6 }}>
              {a.takeawayDiasDesc}
            </p>

            {/* Checkbox Hoy */}
            <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", marginBottom: "1rem" }}>
              <div
                onClick={() => setTConfig(p => ({ ...p, takeaway_hoy_habilitado: p.takeaway_hoy_habilitado === "true" ? "false" : "true" }))}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                  position: "relative", transition: "background 200ms", flexShrink: 0,
                  background: tConfig.takeaway_hoy_habilitado === "true" ? "#c9a84c" : "rgba(255,255,255,0.1)",
                }}>
                <span style={{
                  position: "absolute", top: 3,
                  left: tConfig.takeaway_hoy_habilitado === "true" ? 22 : 3,
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  transition: "left 200ms", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }} />
              </div>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: tConfig.takeaway_hoy_habilitado === "true" ? "#c9a84c" : "rgba(255,255,255,0.5)" }}>
                  {a.takeawayPermitirHoy}
                </span>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>
                  {a.takeawayPermitirHoyDesc}
                </p>
              </div>
            </label>

            {/* Dropdown días */}
            <div style={{ opacity: tConfig.takeaway_hoy_habilitado === "true" ? 0.35 : 1, pointerEvents: tConfig.takeaway_hoy_habilitado === "true" ? "none" : "auto", transition: "opacity 200ms" }}>
              <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>
                {a.takeawayDiasLabel}
              </label>
              <select
                value={tConfig.takeaway_dias_minimos}
                onChange={e => setTConfig(p => ({ ...p, takeaway_dias_minimos: e.target.value }))}
                style={{ ...INPUT, width: 200, cursor: "pointer" }}
              >
                {Array.from({ length: 14 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={String(d)} style={{ background: "#0a0a0f" }}>
                    {d} {d === 1 ? a.takeawayDia : a.takeawayDias}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Horas mínimas */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "1.25rem" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>{a.takeawayHorasTitle}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: "1rem", lineHeight: 1.6 }}>
              {a.takeawayHorasDesc}
            </p>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>
              {a.takeawayHorasLabel}
            </label>
            <select
              value={tConfig.takeaway_horas_minimas}
              onChange={e => setTConfig(p => ({ ...p, takeaway_horas_minimas: e.target.value }))}
              style={{ ...INPUT, width: 200, cursor: "pointer" }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                <option key={h} value={String(h)} style={{ background: "#0a0a0f" }}>
                  {h} {h === 1 ? a.takeawayHora : a.takeawayHoras}
                </option>
              ))}
            </select>
          </div>

          {/* Mensaje Recuerda */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "1.25rem" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>{a.takeawayMensajeTitle}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: "1rem", lineHeight: 1.6 }}>
              {a.takeawayMensajeDesc}
            </p>
            <textarea
              value={tConfig.takeaway_mensaje_recuerda}
              onChange={e => setTConfig(p => ({ ...p, takeaway_mensaje_recuerda: e.target.value }))}
              style={{ ...INPUT, resize: "vertical", minHeight: 80, lineHeight: 1.6 }}
            />
            {/* Preview */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", padding: "0.875rem 1rem", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.18)", borderRadius: 8, marginTop: "0.75rem" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>📅</span>
              <p style={{ fontSize: 13, color: "rgba(201,168,76,0.8)", lineHeight: 1.55, margin: 0 }}>
                <strong style={{ color: "#c9a84c" }}>{a.takeawayRecuerda}</strong> — {tConfig.takeaway_mensaje_recuerda}
              </p>
            </div>
          </div>

          {/* IVA */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: "0.5rem" }}>
              IVA (%)
            </label>
            <input
              type="number" min="0" max="100" step="1"
              value={tConfig.takeaway_iva}
              onChange={e => setTConfig(p => ({ ...p, takeaway_iva: e.target.value }))}
              style={{ ...INPUT, width: 100 }}
            />
          </div>

          {/* Guardar */}
          <div>
            <button onClick={saveTakeaway} disabled={tSaving} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 2rem",
              background: tSaved ? "rgba(74,222,128,0.15)" : "linear-gradient(135deg, #c9a84c, #8b6914)",
              color: tSaved ? "#4ade80" : "#0a0a0f",
              border: tSaved ? "1px solid rgba(74,222,128,0.3)" : "none",
              borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              {tSaved ? <><Check size={14} /> {a.guardado}</> : <><Save size={14} /> {tSaving ? a.guardando : a.guardarTakeAway}</>}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: EMAIL ── */}
      {tab === "email" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 6, padding: "1.25rem" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: "0 0 1rem" }}>
              {a.emailConfigDesc}
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.8, margin: "0 0 0.75rem" }}>
              <strong style={{ color: "rgba(255,255,255,0.6)" }}>{a.emailComoObtenerPass}</strong><br />
              1. <strong style={{ color: "#c9a84c" }}>Google → 2-Step Verification</strong><br />
              2. <strong style={{ color: "#c9a84c" }}>Security → App passwords</strong><br />
              3. <em>"App"</em> → 16-char key<br />
              4. Copy &amp; paste below
            </p>
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#c9a84c", textDecoration: "none", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", padding: "6px 14px", borderRadius: 4, fontWeight: 600 }}
            >
              🔗 {a.emailAbrirGoogle}
            </a>
          </div>

          {/* Email remitente */}
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>
              <Mail size={11} style={{ display: "inline", marginRight: 4 }} /> {a.emailRemitenteLabel}
            </label>
            <input
              type="email"
              value={emailFrom}
              onChange={e => setEmailFrom(e.target.value)}
              placeholder="correo@gmail.com"
              style={INPUT}
            />
          </div>

          {/* App Password */}
          <div>
            <label style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", display: "block", marginBottom: "0.5rem" }}>
              <Key size={11} style={{ display: "inline", marginRight: 4 }} /> {a.emailAppPasswordLabel}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showEmailPass ? "text" : "password"}
                value={emailPass}
                onChange={e => setEmailPass(e.target.value)}
                placeholder={a.dejaVacioMantenerActual}
                style={{ ...INPUT, paddingRight: "2.5rem" }}
              />
              <button onClick={() => setShowEmailPass(s => !s)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                {showEmailPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: "0.4rem" }}>
              {a.emailPassDesc}
            </p>
          </div>

          {/* Test result */}
          {emailTestResult && (
            <div style={{ background: emailTestResult.ok ? "rgba(74,222,128,0.08)" : "rgba(252,165,165,0.08)", border: `1px solid ${emailTestResult.ok ? "rgba(74,222,128,0.2)" : "rgba(252,165,165,0.2)"}`, borderRadius: 6, padding: "0.875rem 1.25rem" }}>
              <p style={{ fontSize: 13, color: emailTestResult.ok ? "#4ade80" : "#fca5a5", margin: 0 }}>
                {emailTestResult.ok ? "✓ " : "✗ "}{emailTestResult.msg}
              </p>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={testEmail} disabled={emailTesting || !emailFrom}
              style={{ padding: "0.625rem 1.25rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
              {emailTesting ? a.enviando : a.enviarPrueba}
            </button>
            <button onClick={saveEmail} disabled={emailSaving || !emailFrom}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.5rem", background: emailSaved ? "rgba(74,222,128,0.15)" : "linear-gradient(135deg, #c9a84c, #8b6914)", color: emailSaved ? "#4ade80" : "#0a0a0f", border: emailSaved ? "1px solid rgba(74,222,128,0.3)" : "none", borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {emailSaved ? <><Check size={14} /> {a.guardado}</> : <><Save size={14} /> {emailSaving ? a.guardando : a.guardar}</>}
            </button>
          </div>
        </div>
      )}
      {tab === "backup" && (() => {
        // Cargar lista al montar
        if (backupList.length === 0 && !backupListLoading) { loadBackupList(); loadSchedule(); }
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Backup automático semanal */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>Backup automático semanal</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Se ejecuta cada domingo a las 03:00 (hora del servidor). Guarda los últimos 8 backups.</p>
                </div>
                <button onClick={() => saveSchedule(!scheduleEnabled)} disabled={scheduleSaving}
                  style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", transition: "background 200ms", background: scheduleEnabled ? "#c9a84c" : "rgba(255,255,255,0.1)", position: "relative", flexShrink: 0 }}>
                  <span style={{ position: "absolute", top: 3, left: scheduleEnabled ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 200ms" }} />
                </button>
              </div>
            </div>

            {/* Checklist + Respaldo único BD — 50/50 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "stretch" }}>

              {/* Columna izquierda: checklist personalizado */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>Seleccionar contenido</p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => setBackupSelected(BACKUP_ITEMS.map(i => i.key))}
                      style={{ fontSize: 12, padding: "4px 10px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                      Todo
                    </button>
                    <button onClick={() => setBackupSelected([])}
                      style={{ fontSize: 12, padding: "4px 10px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                      Ninguno
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", flex: 1 }}>
                  {BACKUP_ITEMS.map(item => {
                    const checked = backupSelected.includes(item.key);
                    return (
                      <button key={item.key} onClick={() => toggleBackupItem(item.key)}
                        style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.25rem", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                        {checked
                          ? <CheckSquare size={16} style={{ color: "#c9a84c", flexShrink: 0 }} />
                          : <Square size={16} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />}
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: checked ? "#c9a84c" : "rgba(255,255,255,0.6)", margin: 0 }}>{item.label}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                  <button onClick={createBackup} disabled={backupCreating || backupSelected.length === 0}
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", borderRadius: 10, border: "1px solid rgba(201,168,76,0.35)", background: "linear-gradient(135deg,rgba(201,168,76,0.15),rgba(139,105,20,0.2))", color: "#c9a84c", cursor: backupCreating ? "wait" : "pointer", opacity: backupSelected.length === 0 ? 0.35 : 1 }}>
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:34, height:34, borderRadius:7, background:"rgba(201,168,76,0.12)", flexShrink:0 }}>
                      {backupCreating ? <RefreshCw size={16} style={{ animation:"spin 1s linear infinite" }} /> : <Download size={16} />}
                    </span>
                    <span style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
                      <span style={{ fontSize:13, fontWeight:700, lineHeight:1.2 }}>{backupCreating ? "Creando..." : "Crear backup"}</span>
                      <span style={{ fontSize:10, color:"rgba(201,168,76,0.45)", marginTop:2 }}>{backupSelected.length} elementos</span>
                    </span>
                  </button>
                  <label style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.875rem 1rem", borderRadius:10, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.45)", cursor:"pointer" }}>
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:34, height:34, borderRadius:7, background:"rgba(255,255,255,0.05)", flexShrink:0 }}>
                      {restoring ? <RefreshCw size={16} style={{ animation:"spin 1s linear infinite" }} /> : <Upload size={16} />}
                    </span>
                    <span style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
                      <span style={{ fontSize:13, fontWeight:700, lineHeight:1.2, color:"rgba(255,255,255,0.6)" }}>{restoring ? "Restaurando..." : "Restaurar"}</span>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:2 }}>{restoreFile ? restoreFile.name : "Seleccionar .zip"}</span>
                    </span>
                    <input type="file" accept=".zip" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { setRestoreFile(f); setRestoreResult(null); doRestore(f, setRestoring, setRestoreResult, () => setRestoreFile(null)); } e.target.value = ""; }} />
                  </label>
                  {restoreResult && <p style={{ gridColumn:"1/-1", margin:0, fontSize:12, color: restoreResult.ok ? "#4ade80" : "#f87171", fontWeight:600 }}>{restoreResult.msg}</p>}
                </div>
              </div>

              {/* Columna derecha: respaldo único de BD */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>Base de datos</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Respaldo único de todas las tablas en un solo archivo.</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", flex: 1 }}>
                  {DB_ONLY_KEYS.map(k => {
                    const item = BACKUP_ITEMS.find(i => i.key === k);
                    return item ? (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.25rem" }}>
                        <CheckSquare size={16} style={{ color: "#c9a84c", flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#c9a84c", margin: 0 }}>{item.label}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>{item.desc}</p>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                  <button onClick={createDbBackup} disabled={dbBackupCreating}
                    style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.875rem 1rem", borderRadius:10, border:"1px solid rgba(201,168,76,0.35)", background:"linear-gradient(135deg,rgba(201,168,76,0.15),rgba(139,105,20,0.2))", color:"#c9a84c", cursor: dbBackupCreating ? "wait" : "pointer" }}>
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:34, height:34, borderRadius:7, background:"rgba(201,168,76,0.12)", flexShrink:0 }}>
                      {dbBackupCreating ? <RefreshCw size={16} style={{ animation:"spin 1s linear infinite" }} /> : <Download size={16} />}
                    </span>
                    <span style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
                      <span style={{ fontSize:13, fontWeight:700, lineHeight:1.2 }}>{dbBackupCreating ? "Creando..." : "Crear backup"}</span>
                      <span style={{ fontSize:10, color:"rgba(201,168,76,0.45)", marginTop:2 }}>Todas las tablas</span>
                    </span>
                  </button>
                  <label style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.875rem 1rem", borderRadius:10, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.45)", cursor:"pointer" }}>
                    <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:34, height:34, borderRadius:7, background:"rgba(255,255,255,0.05)", flexShrink:0 }}>
                      {restoringDb ? <RefreshCw size={16} style={{ animation:"spin 1s linear infinite" }} /> : <Upload size={16} />}
                    </span>
                    <span style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
                      <span style={{ fontSize:13, fontWeight:700, lineHeight:1.2, color:"rgba(255,255,255,0.6)" }}>{restoringDb ? "Restaurando..." : "Restaurar"}</span>
                      <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:2 }}>{restoreDbFile ? restoreDbFile.name : "Seleccionar .zip"}</span>
                    </span>
                    <input type="file" accept=".zip" style={{ display:"none" }} onChange={e => { const f = e.target.files?.[0]; if (f) { setRestoreDbFile(f); setRestoreDbResult(null); doRestore(f, setRestoringDb, setRestoreDbResult, () => setRestoreDbFile(null)); } e.target.value = ""; }} />
                  </label>
                  {restoreDbResult && <p style={{ gridColumn:"1/-1", margin:0, fontSize:12, color: restoreDbResult.ok ? "#4ade80" : "#f87171", fontWeight:600 }}>{restoreDbResult.msg}</p>}
                </div>
              </div>

            </div>

            {/* Lista de backups */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>Backups guardados</p>
                <button onClick={loadBackupList} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: 12 }}>
                  <RefreshCw size={13} /> Actualizar
                </button>
              </div>
              {backupListLoading && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Cargando...</p>}
              {!backupListLoading && backupList.length === 0 && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>No hay backups todavía.</p>
              )}
              {backupList.map(b => (
                <div key={b.filename} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", marginBottom: "0.5rem" }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: 0 }}>{b.filename}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>
                      {new Date(b.createdAt).toLocaleString("es-ES")} · {(b.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => downloadBackup(b.filename)}
                      style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.08)", color: "#c9a84c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      <Download size={13} /> Descargar
                    </button>
                    <button onClick={() => deleteBackup(b.filename)}
                      style={{ display: "flex", alignItems: "center", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(252,165,165,0.15)", background: "transparent", color: "rgba(252,165,165,0.4)", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        );
      })()}

    </div>
  );
}
