"use client";

import { useEffect, useState } from "react";
import {
  Settings, Globe, ShoppingBag, Clock, Bot, CreditCard, Mail,
  HardDrive, Save, Check, Eye, EyeOff, Key, BookOpen, AlertCircle,
  RefreshCw, CheckSquare, Square, Download, Trash2, ArrowRight
} from "lucide-react";
import { useAdminLanguage } from "@/lib/LanguageContext";

// ─── TIPOS ───────────────────────────────────────────────────────────────────

type Hours = Record<string, { open: string; close: string; active: boolean }>;

type AgentConfig = {
  enabled: boolean;
  apiProvider: "anthropic" | "openai";
  apiKey: string;
  model: string;
  systemPrompt: string;
  businessHours: Hours;
  knowledgeBase: string;
  apiKeySet?: boolean;
};

type TakeawayConfig = {
  takeaway_dias_minimos: string;
  takeaway_hoy_habilitado: string;
  takeaway_horas_minimas: string;
  takeaway_mensaje_recuerda: string;
  takeaway_iva: string;
};

type GeneralConfig = {
  sitio_nombre: string;
  sitio_telefono: string;
  sitio_direccion: string;
  sitio_email: string;
  sitio_zona_horaria: string;
};

const DAY_KEYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;

const DEFAULT_HOURS: Hours = {
  lunes: { open: "13:00", close: "23:30", active: true },
  martes: { open: "13:00", close: "23:30", active: true },
  miercoles: { open: "13:00", close: "23:30", active: true },
  jueves: { open: "13:00", close: "23:30", active: true },
  viernes: { open: "13:00", close: "23:59", active: true },
  sabado: { open: "13:00", close: "23:59", active: true },
  domingo: { open: "13:00", close: "23:30", active: true },
};

const MODELS = {
  anthropic: ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-8"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
};

const TIMEZONES = [
  { value: "Europe/Madrid", label: "Murcia / Madrid (Península UTC+1/+2)" },
  { value: "Atlantic/Canary", label: "Canarias (UTC+0/+1)" },
  { value: "Europe/London", label: "Londres (UTC+0/+1)" },
  { value: "Europe/Paris", label: "París (UTC+1/+2)" },
  { value: "Europe/Berlin", label: "Berlín (UTC+1/+2)" },
  { value: "Europe/Rome", label: "Roma (UTC+1/+2)" },
  { value: "UTC", label: "UTC Universal" },
];

const BACKUP_ITEMS = [
  { key: "pedidos", label: "Pedidos Takeaway", desc: "Histórico completo de pedidos online" },
  { key: "platos", label: "Carta & Platos", desc: "Catálogo completo de platos, precios y alérgenos" },
  { key: "clientes", label: "Clientes", desc: "Base de datos de compradores y teléfonos" },
  { key: "cupones", label: "Cupones y Ofertas", desc: "Códigos promocionales y descuentos" },
  { key: "reseñas", label: "Reseñas & Reviews", desc: "Opiniones y valoraciones" },
  { key: "configuracion", label: "Configuración", desc: "Ajustes del restaurante y sistema" },
  { key: "usuarios", label: "Usuarios & Permisos", desc: "Cuentas de administradores" },
];

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  padding: "0.65rem 0.95rem",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

export default function ConfiguracionPage() {
  const { tr } = useAdminLanguage();
  const [tab, setTab] = useState<"general" | "takeaway" | "horarios" | "agente" | "stripe" | "email" | "backup">("general");

  // 1. General Config
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>({
    sitio_nombre: "Obento Japanese Food",
    sitio_telefono: "968 00 00 00",
    sitio_direccion: "Calle Mayor 45, 30830 La Ñora (Murcia)",
    sitio_email: "pedidos@obentojapanesefood.es",
    sitio_zona_horaria: "Europe/Madrid",
  });
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalSaved, setGeneralSaved] = useState(false);

  // 2. Takeaway Config
  const [tConfig, setTConfig] = useState<TakeawayConfig>({
    takeaway_dias_minimos: "0",
    takeaway_hoy_habilitado: "true",
    takeaway_horas_minimas: "0",
    takeaway_mensaje_recuerda: "Tu pedido se elabora al momento con pescado fresco e ingredientes de máxima calidad. Recogida en Calle Mayor 45 en aproximadamente 25-35 minutos.",
    takeaway_iva: "10",
  });
  const [tSaving, setTSaving] = useState(false);
  const [tSaved, setTSaved] = useState(false);

  // 3. Agent Config (Chatbot IA)
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    enabled: true,
    apiProvider: "openai",
    apiKey: "",
    model: "gpt-4o-mini",
    systemPrompt: `Eres el Asistente Virtual Oficial de Obento Japanese Food, ubicado en Calle Mayor 45, La Ñora (Murcia).
Tu misión es atender con cortesía y rapidez a los clientes sobre la carta de sushi artesanal, entrantes, platos calientes, precios, alérgenos, recogida en local (takeaway) y pedidos online.
Eres amable, profesional y conciso. Destacas la frescura de los ingredientes y el cuidado en cada elaboración.`,
    knowledgeBase: `# OBENTO JAPANESE FOOD - CARTA Y SERVICIOS
Ubicación: Calle Mayor 45, 30830 La Ñora, Murcia
Teléfono: 968 00 00 00
Especialidades: Sushi artesanal, Nigiris de autor, Uramakis premium, Gyozas caseras, Platos Wok y Mochis tradicionales.
Takeaway & Pedidos Online: Los clientes pueden pedir directamente por la web y recoger en el restaurante. Tiempo medio de preparación: 25-35 minutos.
Métodos de pago: Tarjeta online (Stripe) y pago en local (tarjeta o efectivo).
Alérgenos: Disponemos de opciones sin gluten, sin lactosa y carta con marcado completo de alérgenos.`,
    businessHours: DEFAULT_HOURS,
    apiKeySet: false,
  });
  const [agentSaving, setAgentSaving] = useState(false);
  const [agentSaved, setAgentSaved] = useState(false);
  const [showAgentKey, setShowAgentKey] = useState(false);
  const [testingAgent, setTestingAgent] = useState(false);
  const [agentTestResult, setAgentTestResult] = useState<string | null>(null);

  // 4. Stripe Config
  const [stripePk, setStripePk] = useState("");
  const [stripeSk, setStripeSk] = useState("");
  const [stripeHasSk, setStripeHasSk] = useState(false);
  const [stripeTestMode, setStripeTestMode] = useState(true);
  const [showSk, setShowSk] = useState(false);
  const [stripeSaving, setStripeSaving] = useState(false);
  const [stripeSaved, setStripeSaved] = useState(false);

  // 5. Email Config
  const [emailFrom, setEmailFrom] = useState("");
  const [emailPass, setEmailPass] = useState("");
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // 6. Backup Config
  type BackupFile = { filename: string; size: number; createdAt: string };
  const [backupSelected, setBackupSelected] = useState<string[]>(BACKUP_ITEMS.map((i) => i.key));
  const [backupCreating, setBackupCreating] = useState(false);
  const [backupList, setBackupList] = useState<BackupFile[]>([]);
  const [backupListLoading, setBackupListLoading] = useState(false);

  // ─── CARGAR CONFIGURACIONES INICIALES ────────────────────────────────────────

  useEffect(() => {
    // General
    fetch("/api/admin/configuracion/general")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setGeneralConfig((prev) => ({ ...prev, ...d }));
      })
      .catch(() => {});

    // Takeaway
    fetch("/api/admin/configuracion/takeaway")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setTConfig((prev) => ({ ...prev, ...d }));
      })
      .catch(() => {});

    // Stripe
    fetch("/api/admin/configuracion/stripe")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setStripePk(d.publishableKey ?? "");
          setStripeHasSk(Boolean(d.hasSecretKey));
          setStripeTestMode(Boolean(d.isTestMode));
        }
      })
      .catch(() => {});

    // Email
    fetch("/api/admin/configuracion/email")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setEmailFrom(d.from ?? "");
      })
      .catch(() => {});

    // Agente
    fetch("/api/admin/agente")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setAgentConfig((prev) => ({
            ...prev,
            ...d,
            businessHours: d.businessHours ? { ...DEFAULT_HOURS, ...d.businessHours } : DEFAULT_HOURS,
            apiProvider: d.apiProvider === "anthropic" ? "anthropic" : "openai",
            model: d.model || "gpt-4o-mini",
            apiKey: "",
          }));
        }
      })
      .catch(() => {});
  }, []);

  // ─── FUNCIONES DE GUARDADO ───────────────────────────────────────────────────

  const saveGeneral = async () => {
    setGeneralSaving(true);
    await fetch("/api/admin/configuracion/general", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(generalConfig),
    });
    setGeneralSaving(false);
    setGeneralSaved(true);
    setTimeout(() => setGeneralSaved(false), 2500);
  };

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

  const saveAgent = async () => {
    setAgentSaving(true);
    await fetch("/api/admin/agente", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agentConfig),
    });
    setAgentSaving(false);
    setAgentSaved(true);
    setTimeout(() => setAgentSaved(false), 2500);
  };

  const saveStripe = async () => {
    setStripeSaving(true);
    await fetch("/api/admin/configuracion/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publishableKey: stripePk,
        secretKey: stripeSk || undefined,
      }),
    });
    setStripeSaving(false);
    setStripeSaved(true);
    setStripeSk("");
    if (stripePk) setStripeTestMode(stripePk.startsWith("pk_test_"));
    setStripeHasSk((prev) => prev || Boolean(stripeSk));
    setTimeout(() => setStripeSaved(false), 2500);
  };

  const saveEmail = async () => {
    setEmailSaving(true);
    await fetch("/api/admin/configuracion/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: emailFrom,
        password: emailPass || undefined,
      }),
    });
    setEmailSaving(false);
    setEmailSaved(true);
    setEmailPass("");
    setTimeout(() => setEmailSaved(false), 2500);
  };

  const testEmail = async () => {
    setEmailTesting(true);
    setEmailTestResult(null);
    try {
      const res = await fetch("/api/admin/configuracion/email/test", { method: "POST" });
      const data = await res.json();
      setEmailTestResult(data);
    } catch {
      setEmailTestResult({ ok: false, msg: "Error al conectar con el servidor de correo" });
    } finally {
      setEmailTesting(false);
    }
  };

  const testAgentChat = async () => {
    setTestingAgent(true);
    setAgentTestResult(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "¿Cuáles son las especialidades de sushi de Obento y qué horario tenéis?" }],
        }),
      });
      const data = await res.json();
      setAgentTestResult(data.reply || "El asistente respondió correctamente.");
    } catch {
      setAgentTestResult("No se pudo conectar con el servicio de IA. Verifica la API Key.");
    } finally {
      setTestingAgent(false);
    }
  };

  const setHourField = (day: string, field: "open" | "close" | "active", value: string | boolean) => {
    setAgentConfig((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...(prev.businessHours[day] ?? { open: "13:00", close: "23:30", active: true }),
          [field]: value,
        },
      },
    }));
  };

  const loadBackupList = async () => {
    setBackupListLoading(true);
    try {
      const r = await fetch("/api/admin/backup/list");
      if (r.ok) {
        setBackupList(await r.json());
      }
    } catch {
      // Ignorar error de lista
    } finally {
      setBackupListLoading(false);
    }
  };

  const createBackup = async () => {
    setBackupCreating(true);
    try {
      const r = await fetch("/api/admin/backup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: backupSelected }),
      });
      const d = await r.json();
      if (d.ok && d.filename) {
        window.open(`/api/admin/backup/download/${d.filename}`, "_blank");
        await loadBackupList();
      }
    } catch {
      alert("Error al generar copia de seguridad");
    } finally {
      setBackupCreating(false);
    }
  };

  const toggleBackupItem = (key: string) => {
    setBackupSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // ─── TABS DEFINITION ─────────────────────────────────────────────────────────

  const TABS = [
    { id: "general", label: "General & Local", icon: Globe },
    { id: "takeaway", label: "Take Away & Pedidos", icon: ShoppingBag },
    { id: "horarios", label: "Horarios de Cocina", icon: Clock },
    { id: "agente", label: "Asistente IA", icon: Bot },
    { id: "stripe", label: "Pagos Online (Stripe)", icon: CreditCard },
    { id: "email", label: "Correo (SMTP)", icon: Mail },
    { id: "backup", label: "Copias de Seguridad", icon: HardDrive },
  ] as const;

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Cabecera Principal */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "2rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "1.25rem",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#c81e22", display: "inline-block" }} />
            <p style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              color: "#c9a84c",
              fontWeight: 700,
              margin: 0,
            }}>
              Configuración y Parámetros del Sistema
            </p>
          </div>
          <h1 style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#fff",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            letterSpacing: "-0.02em",
          }}>
            <Settings size={24} style={{ color: "#c81e22" }} /> Configuración Obento
          </h1>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.4rem",
        marginBottom: "1.75rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "0.85rem",
      }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.55rem 0.95rem",
                borderRadius: 8,
                border: active ? "1px solid rgba(200,30,34,0.4)" : "1px solid rgba(255,255,255,0.06)",
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                background: active ? "rgba(200,30,34,0.15)" : "rgba(255,255,255,0.02)",
                color: active ? "#ff6b6e" : "rgba(255,255,255,0.55)",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} style={{ color: active ? "#ff6b6e" : "rgba(255,255,255,0.4)" }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: GENERAL & LOCAL ────────────────────────────────────────── */}
      {tab === "general" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardSectionStyle}>
            <h2 style={sectionTitleStyle}>
              <Globe size={18} style={{ color: "#c9a84c" }} /> Datos del Restaurante & Ubicación
            </h2>
            <p style={sectionDescStyle}>
              Información de contacto oficial mostrada a los clientes en la web y tickets de pedido.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginTop: "1.25rem" }}>
              <div>
                <label style={labelStyle}>Nombre Comercial</label>
                <input
                  type="text"
                  value={generalConfig.sitio_nombre}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, sitio_nombre: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label style={labelStyle}>Teléfono de Atención / Pedidos</label>
                <input
                  type="text"
                  value={generalConfig.sitio_telefono}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, sitio_telefono: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label style={labelStyle}>Dirección del Local (Recogida Takeaway)</label>
                <input
                  type="text"
                  value={generalConfig.sitio_direccion}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, sitio_direccion: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label style={labelStyle}>Email Oficial de Notificaciones</label>
                <input
                  type="email"
                  value={generalConfig.sitio_email}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, sitio_email: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Zona Horaria del Restaurante</label>
                <select
                  value={generalConfig.sitio_zona_horaria}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, sitio_zona_horaria: e.target.value })}
                  style={{ ...INPUT_STYLE, maxWidth: 360, cursor: "pointer" }}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value} style={{ background: "#111" }}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: "0.4rem" }}>
                  Hora actual en el sistema:{" "}
                  <strong style={{ color: "#c9a84c" }}>
                    {new Intl.DateTimeFormat("es-ES", {
                      timeZone: generalConfig.sitio_zona_horaria || "Europe/Madrid",
                      hour: "2-digit",
                      minute: "2-digit",
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }).format(new Date())}
                  </strong>
                </p>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={saveGeneral}
                disabled={generalSaving}
                style={primaryButtonStyle(generalSaved)}
              >
                {generalSaved ? (
                  <><Check size={15} /> Cambios Guardados</>
                ) : (
                  <><Save size={15} /> {generalSaving ? "Guardando..." : "Guardar Datos del Local"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: TAKE AWAY & PEDIDOS ────────────────────────────────────── */}
      {tab === "takeaway" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardSectionStyle}>
            <h2 style={sectionTitleStyle}>
              <ShoppingBag size={18} style={{ color: "#c9a84c" }} /> Configuración del Servicio Takeaway
            </h2>
            <p style={sectionDescStyle}>
              Ajusta los plazos de preparación, pedidos en el mismo día y mensajes informativos de la carta online.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1.25rem" }}>
              {/* Permitir pedidos para hoy */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>
                    Permitir Pedidos para Recoger Hoy
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0.2rem 0 0 0" }}>
                    Los clientes pueden pedir sushi elaborado al momento para recoger hoy mismo (~25-35 min).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTConfig((p) => ({
                      ...p,
                      takeaway_hoy_habilitado: p.takeaway_hoy_habilitado === "true" ? "false" : "true",
                    }))
                  }
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 13,
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    background: tConfig.takeaway_hoy_habilitado === "true" ? "#c81e22" : "rgba(255,255,255,0.15)",
                    transition: "background 0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 3,
                      left: tConfig.takeaway_hoy_habilitado === "true" ? 25 : 3,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.2s",
                    }}
                  />
                </button>
              </div>

              {/* Mensaje Informativo para el Cliente */}
              <div>
                <label style={labelStyle}>Mensaje Informativo de Recogida (Mostrado en Checkout)</label>
                <textarea
                  value={tConfig.takeaway_mensaje_recuerda}
                  onChange={(e) => setTConfig({ ...tConfig, takeaway_mensaje_recuerda: e.target.value })}
                  style={{ ...INPUT_STYLE, minHeight: 70, resize: "vertical", lineHeight: 1.5 }}
                />
              </div>

              {/* IVA Aplicable */}
              <div style={{ maxWidth: 220 }}>
                <label style={labelStyle}>IVA Aplicable en Comida (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tConfig.takeaway_iva}
                  onChange={(e) => setTConfig({ ...tConfig, takeaway_iva: e.target.value })}
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={saveTakeaway}
                disabled={tSaving}
                style={primaryButtonStyle(tSaved)}
              >
                {tSaved ? (
                  <><Check size={15} /> Ajustes Guardados</>
                ) : (
                  <><Save size={15} /> {tSaving ? "Guardando..." : "Guardar Parámetros Takeaway"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: HORARIOS DE COCINA ────────────────────────────────────── */}
      {tab === "horarios" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardSectionStyle}>
            <h2 style={sectionTitleStyle}>
              <Clock size={18} style={{ color: "#c9a84c" }} /> Horario Semanal de Cocina y Takeaway
            </h2>
            <p style={sectionDescStyle}>
              Define los días de apertura y el rango horario disponible para pedidos online.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "1.25rem" }}>
              {DAY_KEYS.map((key) => {
                const day = agentConfig.businessHours[key] ?? { open: "13:00", close: "23:30", active: true };
                const dayLabels: Record<string, string> = {
                  lunes: "Lunes",
                  martes: "Martes",
                  miercoles: "Miércoles",
                  jueves: "Jueves",
                  viernes: "Viernes",
                  sabado: "Sábado",
                  domingo: "Domingo",
                };

                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      padding: "0.75rem 1rem",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", width: 140 }}>
                      <button
                        type="button"
                        onClick={() => setHourField(key, "active", !day.active)}
                        style={{
                          width: 36,
                          height: 20,
                          borderRadius: 10,
                          border: "none",
                          cursor: "pointer",
                          position: "relative",
                          background: day.active ? "#c81e22" : "rgba(255,255,255,0.15)",
                          transition: "background 0.2s",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 2,
                            left: day.active ? 18 : 2,
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            background: "#fff",
                            transition: "left 0.2s",
                          }}
                        />
                      </button>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: day.active ? "#fff" : "rgba(255,255,255,0.3)" }}>
                        {dayLabels[key] || key}
                      </span>
                    </div>

                    {day.active ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Apertura:</span>
                        <input
                          type="time"
                          value={day.open}
                          onChange={(e) => setHourField(key, "open", e.target.value)}
                          style={{ ...INPUT_STYLE, width: 110, padding: "0.35rem 0.6rem" }}
                        />
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Cierre:</span>
                        <input
                          type="time"
                          value={day.close}
                          onChange={(e) => setHourField(key, "close", e.target.value)}
                          style={{ ...INPUT_STYLE, width: 110, padding: "0.35rem 0.6rem" }}
                        />
                      </div>
                    ) : (
                      <span style={{ fontSize: 12.5, color: "#f87171", fontWeight: 600 }}>Cerrado</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={saveAgent}
                disabled={agentSaving}
                style={primaryButtonStyle(agentSaved)}
              >
                {agentSaved ? (
                  <><Check size={15} /> Horarios Guardados</>
                ) : (
                  <><Save size={15} /> {agentSaving ? "Guardando..." : "Guardar Horarios de Cocina"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: ASISTENTE IA (CHATBOT) ─────────────────────────────────── */}
      {tab === "agente" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardSectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h2 style={sectionTitleStyle}>
                  <Bot size={18} style={{ color: "#c9a84c" }} /> Asistente Virtual Inteligente (Chatbot Web)
                </h2>
                <p style={sectionDescStyle}>
                  Configura el modelo y las instrucciones del asistente que responde dudas a tus clientes en la web.
                </p>
              </div>

              {/* Botón de prueba interactiva */}
              <button
                type="button"
                onClick={testAgentChat}
                disabled={testingAgent}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "0.45rem 0.85rem",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {testingAgent ? "Probando..." : "Probar Asistente"}
              </button>
            </div>

            {agentTestResult && (
              <div style={{
                padding: "0.85rem 1rem",
                background: "rgba(56,189,248,0.08)",
                border: "1px solid rgba(56,189,248,0.25)",
                borderRadius: 8,
                marginBottom: "1.25rem",
                fontSize: 13,
                color: "#e0f2fe",
                lineHeight: 1.5,
              }}>
                <strong style={{ color: "#38bdf8", display: "block", marginBottom: 4 }}>Respuesta de prueba:</strong>
                {agentTestResult}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Toggle Habilitado */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.85rem 1.15rem",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
              }}>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", margin: 0 }}>
                    Asistente Virtual Activo en la Web
                  </p>
                  <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", margin: "0.15rem 0 0 0" }}>
                    Muestra el botón flotante de chat en la esquina de la página web oficial.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAgentConfig({ ...agentConfig, enabled: !agentConfig.enabled })}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    background: agentConfig.enabled ? "#c81e22" : "rgba(255,255,255,0.15)",
                    transition: "background 0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      left: agentConfig.enabled ? 22 : 2,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.2s",
                    }}
                  />
                </button>
              </div>

              {/* Proveedor y Modelo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Proveedor de Inteligencia Artificial</label>
                  <select
                    value={agentConfig.apiProvider}
                    onChange={(e) => {
                      const prov = e.target.value as "openai" | "anthropic";
                      setAgentConfig({
                        ...agentConfig,
                        apiProvider: prov,
                        model: MODELS[prov][0],
                      });
                    }}
                    style={{ ...INPUT_STYLE, cursor: "pointer" }}
                  >
                    <option value="openai" style={{ background: "#111" }}>OpenAI (ChatGPT)</option>
                    <option value="anthropic" style={{ background: "#111" }}>Anthropic (Claude)</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Modelo</label>
                  <select
                    value={agentConfig.model}
                    onChange={(e) => setAgentConfig({ ...agentConfig, model: e.target.value })}
                    style={{ ...INPUT_STYLE, cursor: "pointer" }}
                  >
                    {(MODELS[agentConfig.apiProvider] || MODELS.openai).map((m) => (
                      <option key={m} value={m} style={{ background: "#111" }}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* API Key */}
              <div>
                <label style={labelStyle}>
                  Clave API ({agentConfig.apiProvider === "anthropic" ? "Anthropic" : "OpenAI"})
                  {agentConfig.apiKeySet && (
                    <span style={{ color: "#4ade80", marginLeft: 8, fontWeight: 700 }}>✓ Clave configurada</span>
                  )}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showAgentKey ? "text" : "password"}
                    value={agentConfig.apiKey}
                    onChange={(e) => setAgentConfig({ ...agentConfig, apiKey: e.target.value })}
                    placeholder={agentConfig.apiKeySet ? "Dejar vacío para mantener la actual" : "sk-..."}
                    style={{ ...INPUT_STYLE, paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAgentKey(!showAgentKey)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                    }}
                  >
                    {showAgentKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <label style={labelStyle}>Instrucciones del Sistema (System Prompt)</label>
                <textarea
                  value={agentConfig.systemPrompt}
                  onChange={(e) => setAgentConfig({ ...agentConfig, systemPrompt: e.target.value })}
                  style={{ ...INPUT_STYLE, minHeight: 110, resize: "vertical", lineHeight: 1.5 }}
                />
              </div>

              {/* Base de Conocimiento */}
              <div>
                <label style={labelStyle}>Base de Conocimiento de Obento (Carta, Alérgenos, Local)</label>
                <textarea
                  value={agentConfig.knowledgeBase}
                  onChange={(e) => setAgentConfig({ ...agentConfig, knowledgeBase: e.target.value })}
                  style={{ ...INPUT_STYLE, minHeight: 150, resize: "vertical", fontFamily: "monospace", fontSize: 12.5 }}
                />
              </div>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={saveAgent}
                disabled={agentSaving}
                style={primaryButtonStyle(agentSaved)}
              >
                {agentSaved ? (
                  <><Check size={15} /> Asistente Actualizado</>
                ) : (
                  <><Save size={15} /> {agentSaving ? "Guardando..." : "Guardar Configuración IA"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: STRIPE ─────────────────────────────────────────────────── */}
      {tab === "stripe" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardSectionStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h2 style={sectionTitleStyle}>
                  <CreditCard size={18} style={{ color: "#c9a84c" }} /> Pasarela de Pagos Stripe (Tarjetas Online)
                </h2>
                <p style={sectionDescStyle}>
                  Permite a tus clientes pagar online sus pedidos con tarjeta bancaria de forma segura.
                </p>
              </div>

              <span style={{
                padding: "0.3rem 0.65rem",
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 700,
                background: stripeTestMode ? "rgba(56,189,248,0.12)" : "rgba(74,222,128,0.12)",
                color: stripeTestMode ? "#38bdf8" : "#4ade80",
                border: `1px solid ${stripeTestMode ? "rgba(56,189,248,0.3)" : "rgba(74,222,128,0.3)"}`,
              }}>
                {stripeTestMode ? "Modo Pruebas (Test)" : "Modo Real (Producción)"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1.25rem" }}>
              <div>
                <label style={labelStyle}>
                  Stripe Publishable Key (Clave Pública)
                  {stripePk && <span style={{ color: "#4ade80", marginLeft: 8 }}>✓ Configurada</span>}
                </label>
                <input
                  type="text"
                  value={stripePk}
                  onChange={(e) => setStripePk(e.target.value)}
                  placeholder="pk_test_... o pk_live_..."
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Stripe Secret Key (Clave Secreta)
                  {stripeHasSk && <span style={{ color: "#4ade80", marginLeft: 8 }}>✓ Clave secreta activa</span>}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showSk ? "text" : "password"}
                    value={stripeSk}
                    onChange={(e) => setStripeSk(e.target.value)}
                    placeholder={stripeHasSk ? "Dejar vacío para mantener la actual" : "sk_test_... o sk_live_..."}
                    style={{ ...INPUT_STYLE, paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSk(!showSk)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                    }}
                  >
                    {showSk ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={saveStripe}
                disabled={stripeSaving}
                style={primaryButtonStyle(stripeSaved)}
              >
                {stripeSaved ? (
                  <><Check size={15} /> Claves Stripe Guardadas</>
                ) : (
                  <><Save size={15} /> {stripeSaving ? "Guardando..." : "Guardar Claves Stripe"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 6: EMAIL (SMTP) ───────────────────────────────────────────── */}
      {tab === "email" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardSectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h2 style={sectionTitleStyle}>
                  <Mail size={18} style={{ color: "#c9a84c" }} /> Configuración de Envío de Correos (SMTP)
                </h2>
                <p style={sectionDescStyle}>
                  Configura la cuenta para enviar confirmaciones automáticas de pedidos a clientes y avisos al restaurante.
                </p>
              </div>

              <button
                type="button"
                onClick={testEmail}
                disabled={emailTesting || !emailFrom}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "0.45rem 0.85rem",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {emailTesting ? "Enviando prueba..." : "Enviar Correo de Prueba"}
              </button>
            </div>

            {emailTestResult && (
              <div style={{
                padding: "0.85rem 1rem",
                background: emailTestResult.ok ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${emailTestResult.ok ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)"}`,
                borderRadius: 8,
                marginBottom: "1.25rem",
                fontSize: 13,
                color: emailTestResult.ok ? "#4ade80" : "#f87171",
              }}>
                {emailTestResult.ok ? "✓ " : "✕ "} {emailTestResult.msg}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={labelStyle}>Email Remitente (ej. Gmail / Servidor SMTP)</label>
                <input
                  type="email"
                  value={emailFrom}
                  onChange={(e) => setEmailFrom(e.target.value)}
                  placeholder="pedidos@obentojapanesefood.es"
                  style={INPUT_STYLE}
                />
              </div>

              <div>
                <label style={labelStyle}>Contraseña de Aplicación (App Password)</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showEmailPass ? "text" : "password"}
                    value={emailPass}
                    onChange={(e) => setEmailPass(e.target.value)}
                    placeholder="Dejar vacío para mantener la actual"
                    style={{ ...INPUT_STYLE, paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPass(!showEmailPass)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                    }}
                  >
                    {showEmailPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={saveEmail}
                disabled={emailSaving}
                style={primaryButtonStyle(emailSaved)}
              >
                {emailSaved ? (
                  <><Check size={15} /> Correo Guardado</>
                ) : (
                  <><Save size={15} /> {emailSaving ? "Guardando..." : "Guardar Configuración de Correo"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 7: BACKUP ─────────────────────────────────────────────────── */}
      {tab === "backup" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardSectionStyle}>
            <h2 style={sectionTitleStyle}>
              <HardDrive size={18} style={{ color: "#c9a84c" }} /> Copias de Seguridad (Backup de Base de Datos)
            </h2>
            <p style={sectionDescStyle}>
              Genera y descarga copias de seguridad de la base de datos de Obento en formato seguro JSON/SQL.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem", margin: "1.25rem 0" }}>
              {BACKUP_ITEMS.map((item) => {
                const checked = backupSelected.includes(item.key);
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleBackupItem(item.key)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.85rem 1rem",
                      background: checked ? "rgba(200,30,34,0.08)" : "rgba(255,255,255,0.02)",
                      border: checked ? "1px solid rgba(200,30,34,0.3)" : "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ color: checked ? "#ff6b6e" : "rgba(255,255,255,0.3)", marginTop: 2 }}>
                      {checked ? <CheckSquare size={17} /> : <Square size={17} />}
                    </span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", margin: "0.15rem 0 0 0" }}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "1rem" }}>
              <button
                type="button"
                onClick={createBackup}
                disabled={backupCreating || backupSelected.length === 0}
                style={primaryButtonStyle(false)}
              >
                <Download size={15} />
                {backupCreating ? "Generando y descargando backup..." : "Descargar Copia de Seguridad"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ESTILOS REUTILIZABLES ───────────────────────────────────────────────────

const cardSectionStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12,
  padding: "1.75rem",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: "#fff",
  margin: "0 0 0.35rem 0",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const sectionDescStyle: React.CSSProperties = {
  fontSize: 12.5,
  color: "rgba(255,255,255,0.45)",
  margin: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11.5,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "rgba(255,255,255,0.4)",
  display: "block",
  marginBottom: "0.45rem",
  fontWeight: 600,
};

function primaryButtonStyle(isSaved: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.75rem",
    borderRadius: 8,
    border: isSaved ? "1px solid rgba(74,222,128,0.3)" : "none",
    background: isSaved ? "rgba(74,222,128,0.15)" : "linear-gradient(135deg, #c81e22, #991316)",
    color: isSaved ? "#4ade80" : "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: isSaved ? "none" : "0 4px 14px rgba(200,30,34,0.35)",
    transition: "all 0.2s ease",
  };
}
