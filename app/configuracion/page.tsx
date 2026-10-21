"use client";

import { useEffect, useState } from "react";
import {
  Settings, Globe, ShoppingBag, Clock, Bot, CreditCard, Mail,
  HardDrive, Save, Check, Eye, EyeOff, Key, BookOpen, AlertCircle,
  RefreshCw, CheckSquare, Square, Download, Trash2, ArrowRight,
  Sparkles, Receipt, MessageSquare, MessageCircle, Cloud, Upload,
  ExternalLink, FileArchive, CheckCircle2, FolderUp
} from "lucide-react";
import { useAdminLanguage } from "@/lib/LanguageContext";
import { BotsWebContent } from "@/app/bots-web/page";
import { WhatsAppBotContent } from "@/app/whatsapp-bot/page";

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
  { key: "pedidos", label: "Pedidos Take Away & Domicilio", desc: "Histórico completo de pedidos, tickets y líneas" },
  { key: "platos", label: "Carta & Platos", desc: "Catálogo completo de platos, precios, alérgenos y fotos" },
  { key: "escandallos", label: "Escandallos de Platos", desc: "Fichas técnicas, recetas y consumo por ración" },
  { key: "stock", label: "Almacén, Stock & Mermas", desc: "Ingredientes, existencias, movimientos y pérdidas" },
  { key: "facturas", label: "Facturas de Compras", desc: "Facturas de proveedores con desglose e IVA" },
  { key: "clientes", label: "Clientes & Fidelización", desc: "Base de datos de compradores, teléfonos y etiquetas" },
  { key: "cupones", label: "Cupones y Ofertas", desc: "Códigos promocionales y ofertas especiales" },
  { key: "analytics", label: "Analítica Web & Visitas", desc: "Eventos de carrito, visitas y conversiones" },
  { key: "configuracion", label: "Configuración & Temas Festivos", desc: "Temas de temporada, colores, bots, horarios y Stripe" },
  { key: "usuarios", label: "Usuarios & Permisos", desc: "Cuentas de acceso y roles del dashboard" },
  { key: "reservas", label: "Reservas & Catering", desc: "Reservas de mesa y servicios para eventos" },
  { key: "reseñas", label: "Reseñas & Reviews", desc: "Opiniones y valoraciones de comensales" },
  { key: "galeria", label: "Galería & Fotos", desc: "Fotografías del restaurante y carruseles" },
  { key: "archivos", label: "Archivos Multimedia", desc: "Vídeos, imágenes y assets públicos de la web" },
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
  const [tab, setTab] = useState<
    "general" | "takeaway" | "horarios" | "agente" | "bots_web" | "whatsapp_bot" | "stripe" | "email" | "backup"
  >("general");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      if (
        urlTab &&
        ["general", "takeaway", "horarios", "agente", "bots_web", "whatsapp_bot", "stripe", "email", "backup"].includes(urlTab)
      ) {
        setTab(urlTab as any);
      }
    }
  }, []);

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

  // 5. Resend Email Config
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendHasKey, setResendHasKey] = useState(false);
  const [resendKeyMasked, setResendKeyMasked] = useState("");
  const [resendFrom, setResendFrom] = useState("pedidos@obentojapanesefood.es");
  const [resendFromName, setResendFromName] = useState("Obento Japanese Food");
  const [showResendKey, setShowResendKey] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // 6. Backup Config
  type BackupFile = {
    filename: string;
    size: number;
    createdAt: string;
    driveUrl?: string | null;
    driveId?: string | null;
    driveError?: string | null;
    counts?: Record<string, number>;
    items?: string[];
  };
  const [backupSelected, setBackupSelected] = useState<string[]>(BACKUP_ITEMS.map((i) => i.key));
  const [backupCreating, setBackupCreating] = useState(false);
  const [backupList, setBackupList] = useState<BackupFile[]>([]);
  const [backupListLoading, setBackupListLoading] = useState(false);
  const [backupRestoring, setBackupRestoring] = useState(false);
  const [driveSyncing, setDriveSyncing] = useState<string | null>(null);
  const [backupStatusMsg, setBackupStatusMsg] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

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

    // Email (Resend)
    fetch("/api/admin/configuracion/email")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          if (d.from) setResendFrom(d.from);
          if (d.fromName) setResendFromName(d.fromName);
          setResendHasKey(Boolean(d.hasApiKey));
          setResendKeyMasked(d.apiKeyMasked || "");
        }
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
    try {
      await fetch("/api/admin/configuracion/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generalConfig),
      });
      // Si el usuario introdujo una API key de IA en la sección general, guardarla también
      if (agentConfig.apiKey.trim()) {
        await saveAgent();
      }
      setGeneralSaved(true);
      setTimeout(() => setGeneralSaved(false), 2500);
    } finally {
      setGeneralSaving(false);
    }
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
    try {
      const res = await fetch("/api/admin/agente", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentConfig),
      });
      if (res.ok) {
        const d = await fetch("/api/admin/agente").then((r) => r.json());
        if (d) {
          setAgentConfig((prev) => ({ ...prev, ...d, apiKey: "" }));
        }
      }
    } finally {
      setAgentSaving(false);
      setAgentSaved(true);
      setTimeout(() => setAgentSaved(false), 2500);
    }
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
    try {
      const res = await fetch("/api/admin/configuracion/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: resendApiKey || undefined,
          from: resendFrom,
          fromName: resendFromName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEmailSaved(true);
        if (resendApiKey) {
          setResendHasKey(true);
          setResendKeyMasked(`${resendApiKey.slice(0, 6)}...${resendApiKey.slice(-4)}`);
          setResendApiKey("");
        }
        setTimeout(() => setEmailSaved(false), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEmailSaving(false);
    }
  };

  const testEmail = async () => {
    setEmailTesting(true);
    setEmailTestResult(null);
    try {
      const res = await fetch("/api/admin/configuracion/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testRecipient || undefined }),
      });
      const data = await res.json();
      setEmailTestResult(data);
    } catch {
      setEmailTestResult({ ok: false, msg: "Error al conectar con el servicio de correo de Resend" });
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

  useEffect(() => {
    if (tab === "backup") {
      loadBackupList();
    }
  }, [tab]);

  const createBackup = async () => {
    setBackupCreating(true);
    setBackupStatusMsg({ type: "info", text: "Generando paquete seguro y subiendo a Google Drive..." });
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
        if (d.driveUrl) {
          setBackupStatusMsg({
            type: "success",
            text: `✅ Backup completado y respaldado en Google Drive. Archivo: ${d.filename}`,
          });
        } else {
          setBackupStatusMsg({
            type: "info",
            text: `Backup guardado localmente: ${d.filename} (${(d.size / 1024 / 1024).toFixed(2)} MB)`,
          });
        }
      } else {
        setBackupStatusMsg({
          type: "error",
          text: d.message || "Error al generar la copia de seguridad",
        });
      }
    } catch {
      setBackupStatusMsg({
        type: "error",
        text: "Error de red al generar copia de seguridad",
      });
    } finally {
      setBackupCreating(false);
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm(`¿Estás seguro de eliminar el archivo "${filename}" del servidor?`)) return;
    try {
      const r = await fetch("/api/admin/backup/list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (r.ok) {
        await loadBackupList();
        setBackupStatusMsg({ type: "info", text: `Archivo ${filename} eliminado.` });
      }
    } catch {
      alert("Error al eliminar la copia");
    }
  };

  const restoreBackup = async (filename: string) => {
    const ok = confirm(
      `⚠️ ATENCIÓN: Vas a restaurar el backup:\n\n${filename}\n\nEsto sobreescribirá las tablas de la base de datos con los registros contenidos en la copia. ¿Deseas continuar?`
    );
    if (!ok) return;

    setBackupRestoring(true);
    setBackupStatusMsg({ type: "info", text: `Restaurando copia ${filename}...` });
    try {
      const r = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const d = await r.json();
      if (d.ok) {
        setBackupStatusMsg({
          type: "success",
          text: `🎉 ${d.message || "Base de datos restaurada correctamente."}`,
        });
      } else {
        setBackupStatusMsg({
          type: "error",
          text: `⚠️ ${d.message || "Ocurrieron errores en la restauración."}`,
        });
      }
    } catch {
      setBackupStatusMsg({
        type: "error",
        text: "Error de red al intentar restaurar la copia de seguridad.",
      });
    } finally {
      setBackupRestoring(false);
    }
  };

  const handleUploadZipRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ok = confirm(
      `⚠️ ATENCIÓN: Vas a restaurar desde el archivo local:\n\n"${file.name}"\n\nEsto reemplazará los datos actuales por los del archivo. ¿Confirmar restauración?`
    );
    if (!ok) {
      e.target.value = "";
      return;
    }

    setBackupRestoring(true);
    setBackupStatusMsg({ type: "info", text: `Subiendo y procesando ${file.name}...` });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/backup/restore", {
        method: "POST",
        body: fd,
      });
      const d = await r.json();
      if (d.ok) {
        setBackupStatusMsg({
          type: "success",
          text: `🎉 ${d.message || "Copia restaurada con éxito total."}`,
        });
        await loadBackupList();
      } else {
        setBackupStatusMsg({
          type: "error",
          text: `⚠️ ${d.message || "Ocurrieron problemas durante la restauración."}`,
        });
      }
    } catch {
      setBackupStatusMsg({
        type: "error",
        text: "Error de red al procesar el archivo ZIP.",
      });
    } finally {
      setBackupRestoring(false);
      e.target.value = "";
    }
  };

  const syncToDrive = async (filename: string) => {
    setDriveSyncing(filename);
    try {
      const r = await fetch("/api/admin/backup/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const d = await r.json();
      if (d.ok && d.driveUrl) {
        await loadBackupList();
        setBackupStatusMsg({
          type: "success",
          text: `✅ ${filename} sincronizado con Google Drive correctamente.`,
        });
      } else {
        alert(d.message || "No se pudo sincronizar con Google Drive");
      }
    } catch {
      alert("Error de conexión al sincronizar con Google Drive");
    } finally {
      setDriveSyncing(null);
    }
  };

  const toggleBackupItem = (key: string) => {
    setBackupSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAllBackupItems = () => {
    setBackupSelected(BACKUP_ITEMS.map((i) => i.key));
  };

  const deselectAllBackupItems = () => {
    setBackupSelected([]);
  };

  // ─── TABS DEFINITION ─────────────────────────────────────────────────────────

  const TABS = [
    { id: "general", label: "General & Local", icon: Globe },
    { id: "takeaway", label: "Take Away & Pedidos", icon: ShoppingBag },
    { id: "horarios", label: "Horarios de Cocina", icon: Clock },
    { id: "agente", label: "Asistente IA", icon: Bot },
    { id: "bots_web", label: "Bots Web", icon: MessageSquare },
    { id: "whatsapp_bot", label: "WhatsApp Bot", icon: MessageCircle },
    { id: "stripe", label: "Pagos Online (Stripe)", icon: CreditCard },
    { id: "email", label: "Correo (Resend)", icon: Mail },
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

          {/* SECCIÓN 2: API KEY GENERAL DE INTELIGENCIA ARTIFICIAL */}
          <div style={cardSectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h2 style={sectionTitleStyle}>
                  <Sparkles size={18} style={{ color: "#c9a84c" }} /> Inteligencia Artificial Central (API Key Global del Sistema)
                </h2>
                <p style={sectionDescStyle}>
                  Esta clave API única alimenta automáticamente todos los servicios de Inteligencia Artificial de Obento: Asistente Web de clientes, extracción de facturas (OCR Visión) y el bot de WhatsApp.
                </p>
              </div>

              {agentConfig.apiKeySet ? (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  background: "rgba(74,222,128,0.12)",
                  color: "#4ade80",
                  border: "1px solid rgba(74,222,128,0.3)"
                }}>
                  <Check size={13} /> Clave Operativa en el Sistema
                </span>
              ) : (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: "rgba(234,179,8,0.1)",
                  color: "#facc15",
                  border: "1px solid rgba(234,179,8,0.25)"
                }}>
                  <AlertCircle size={13} /> Sin Clave Configurada
                </span>
              )}
            </div>

            {/* Servicios Conectados a esta API Key */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1.25rem",
              padding: "0.85rem 1rem",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Bot size={16} style={{ color: "#38bdf8" }} />
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff" }}>Asistente Web</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Chatbot clientes en vivo</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <Receipt size={16} style={{ color: "#c9a84c" }} />
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff" }}>Escaneo de Facturas</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Extracción OCR con Visión</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <MessageSquare size={16} style={{ color: "#4ade80" }} />
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff" }}>WhatsApp Bot</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Atención y respuestas a dudas</p>
                </div>
              </div>
            </div>

            {/* Selector de Proveedor y Modelo */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
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
                  <option value="openai" style={{ background: "#111" }}>OpenAI (ChatGPT & GPT-4o Vision)</option>
                  <option value="anthropic" style={{ background: "#111" }}>Anthropic (Claude 3.5 Sonnet)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Modelo Predeterminado</label>
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

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>
                  Clave API General ({agentConfig.apiProvider === "anthropic" ? "Anthropic" : "OpenAI"})
                  {agentConfig.apiKeySet && (
                    <span style={{ color: "#4ade80", marginLeft: 8, fontWeight: 700 }}>
                      ✓ Clave guardada (encriptada en servidor)
                    </span>
                  )}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showAgentKey ? "text" : "password"}
                    value={agentConfig.apiKey}
                    onChange={(e) => setAgentConfig({ ...agentConfig, apiKey: e.target.value })}
                    placeholder={agentConfig.apiKeySet ? "•••••••••••••••••••••••••••••••• (Dejar vacío para mantener la actual)" : "sk-..."}
                    style={{ ...INPUT_STYLE, paddingRight: "2.75rem" }}
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
                      color: "rgba(255,255,255,0.45)",
                      cursor: "pointer",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showAgentKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: "0.4rem" }}>
                  Introduce tu clave de API de {agentConfig.apiProvider === "anthropic" ? "console.anthropic.com" : "platform.openai.com"}. Se compartirá de forma centralizada con todos los módulos de IA.
                </p>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={saveAgent}
                disabled={agentSaving}
                style={primaryButtonStyle(agentSaved)}
              >
                {agentSaved ? (
                  <><Check size={15} /> Clave de IA Guardada</>
                ) : (
                  <><Sparkles size={15} /> {agentSaving ? "Guardando..." : "Guardar API Key de IA"}</>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTab("agente")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.7)",
                  padding: "0.6rem 1rem",
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Ajustar Prompts y Base de Conocimiento del Chatbot →
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
                  Configura las instrucciones y la base de conocimiento del asistente que responde dudas a tus clientes en la web. El asistente está conectado directamente a la API Key Central configurada en el sistema.
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

              {/* Conexión con la API Key Central */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.95rem 1.15rem",
                  background: agentConfig.apiKeySet ? "rgba(74,222,128,0.06)" : "rgba(234,179,8,0.06)",
                  border: `1px solid ${agentConfig.apiKeySet ? "rgba(74,222,128,0.25)" : "rgba(234,179,8,0.25)"}`,
                  borderRadius: 8,
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Sparkles size={18} style={{ color: agentConfig.apiKeySet ? "#4ade80" : "#facc15" }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>
                        {agentConfig.apiKeySet
                          ? `Conectado a la API Key Central (${agentConfig.apiProvider === "anthropic" ? "Anthropic" : "OpenAI"})`
                          : "Sin Clave de IA Configurada"}
                      </p>
                      {agentConfig.apiKeySet && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: "rgba(201,168,76,0.15)",
                            color: "#c9a84c",
                            fontWeight: 600,
                          }}
                        >
                          Modelo: {agentConfig.model}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", margin: "0.2rem 0 0 0" }}>
                      {agentConfig.apiKeySet
                        ? "El asistente utiliza la clave central guardada en el sistema (compartida con Facturas y WhatsApp). No necesitas meter ninguna clave aquí."
                        : "Introduce tu API Key en la pestaña General para activar el Asistente, Facturas y WhatsApp."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTab("general")}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 6,
                    padding: "6px 12px",
                    color: "#c9a84c",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Gestionar Clave Central en General →
                </button>
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

      {/* ─── TAB: BOTS WEB ─────────────────────────────────────────────────── */}
      {tab === "bots_web" && (
        <div>
          <BotsWebContent />
        </div>
      )}

      {/* ─── TAB: WHATSAPP BOT ─────────────────────────────────────────────── */}
      {tab === "whatsapp_bot" && (
        <div>
          <WhatsAppBotContent />
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

      {/* ─── TAB 6: EMAIL (RESEND) ────────────────────────────────────────── */}
      {tab === "email" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={cardSectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
                  <h2 style={sectionTitleStyle}>
                    <Mail size={18} style={{ color: "#c9a84c" }} /> Configuración de Envíos con Resend (API)
                  </h2>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: resendHasKey ? "rgba(74,222,128,0.12)" : "rgba(234,179,8,0.12)",
                      color: resendHasKey ? "#4ade80" : "#facc15",
                      border: `1px solid ${resendHasKey ? "rgba(74,222,128,0.25)" : "rgba(234,179,8,0.25)"}`,
                    }}
                  >
                    {resendHasKey ? "● Conectado a Resend" : "○ Clave Pendiente"}
                  </span>
                </div>
                <p style={sectionDescStyle}>
                  Resend gestiona los correos transaccionales (confirmaciones de pedidos, tickets de cocina y avisos) con alta entregabilidad y sin bloqueos SMTP.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* API Key */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <label style={labelStyle}>API Key de Resend (re_...)</label>
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11.5, color: "#c9a84c", textDecoration: "none" }}
                  >
                    Obtener API Key en resend.com ↗
                  </a>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showResendKey ? "text" : "password"}
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    placeholder={resendHasKey ? `Clave guardada (${resendKeyMasked}) — escribe para sustituirla` : "re_1234567890abcdef..."}
                    style={{ ...INPUT_STYLE, paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResendKey(!showResendKey)}
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
                    {showResendKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  Clave privada generada en tu cuenta de Resend con permisos de envío (Sending access).
                </p>
              </div>

              {/* Fila: Email Remitente y Nombre Remitente */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Email Remitente (From)</label>
                  <input
                    type="email"
                    value={resendFrom}
                    onChange={(e) => setResendFrom(e.target.value)}
                    placeholder="pedidos@obentojapanesefood.es"
                    style={INPUT_STYLE}
                  />
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    Usa tu dominio verificado en Resend (o <code>onboarding@resend.dev</code> en modo test).
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>Nombre del Remitente</label>
                  <input
                    type="text"
                    value={resendFromName}
                    onChange={(e) => setResendFromName(e.target.value)}
                    placeholder="Obento Japanese Food"
                    style={INPUT_STYLE}
                  />
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    Nombre visible para los clientes en su bandeja de entrada.
                  </p>
                </div>
              </div>
            </div>

            {/* Botón Guardar */}
            <div style={{ marginTop: "1.5rem" }}>
              <button
                type="button"
                onClick={saveEmail}
                disabled={emailSaving}
                style={primaryButtonStyle(emailSaved)}
              >
                {emailSaved ? (
                  <><Check size={15} /> Configuración de Resend Guardada</>
                ) : (
                  <><Save size={15} /> {emailSaving ? "Guardando..." : "Guardar Configuración de Resend"}</>
                )}
              </button>
            </div>

            {/* Caja de Prueba de Envío */}
            <div
              style={{
                marginTop: "1.75rem",
                padding: "1.25rem",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
              }}
            >
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 0.4rem" }}>
                Probar Conexión y Envío de Correo con Resend
              </h3>
              <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", margin: "0 0 1rem" }}>
                Envía un correo de comprobación para validar que tu API Key y dominio funcionan perfectamente:
              </p>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder={`Destinatario de prueba (por defecto: ${resendFrom || "tu email"})`}
                  style={{ ...INPUT_STYLE, flex: 1, minWidth: 240 }}
                />
                <button
                  type="button"
                  onClick={testEmail}
                  disabled={emailTesting || (!resendHasKey && !resendApiKey)}
                  style={{
                    background: "rgba(201,168,76,0.15)",
                    border: "1px solid rgba(201,168,76,0.35)",
                    padding: "0.65rem 1.1rem",
                    borderRadius: 7,
                    color: "#f5c542",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: (!resendHasKey && !resendApiKey) ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    opacity: (!resendHasKey && !resendApiKey) ? 0.5 : 1,
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
                  marginTop: "1rem",
                  fontSize: 12.5,
                  color: emailTestResult.ok ? "#4ade80" : "#f87171",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  {emailTestResult.ok ? "✓ " : "✕ "} {emailTestResult.msg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 7: BACKUP ─────────────────────────────────────────────────── */}
      {tab === "backup" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Mensaje de estado / notificación */}
          {backupStatusMsg && (
            <div
              style={{
                padding: "1rem 1.25rem",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                background:
                  backupStatusMsg.type === "success"
                    ? "rgba(34, 197, 94, 0.12)"
                    : backupStatusMsg.type === "error"
                    ? "rgba(239, 68, 68, 0.12)"
                    : "rgba(59, 130, 246, 0.12)",
                border: `1px solid ${
                  backupStatusMsg.type === "success"
                    ? "rgba(34, 197, 94, 0.3)"
                    : backupStatusMsg.type === "error"
                    ? "rgba(239, 68, 68, 0.3)"
                    : "rgba(59, 130, 246, 0.3)"
                }`,
                color:
                  backupStatusMsg.type === "success"
                    ? "#4ade80"
                    : backupStatusMsg.type === "error"
                    ? "#f87171"
                    : "#60a5fa",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                {backupStatusMsg.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : backupStatusMsg.type === "error" ? (
                  <AlertCircle size={18} />
                ) : (
                  <RefreshCw size={18} className="animate-spin" />
                )}
                <span>{backupStatusMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setBackupStatusMsg(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: 14,
                  opacity: 0.7,
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Tarjeta Google Drive */}
          <div
            style={{
              ...cardSectionStyle,
              background: "linear-gradient(135deg, rgba(30,58,138,0.15) 0%, rgba(15,23,42,0.4) 100%)",
              borderColor: "rgba(59,130,246,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "rgba(59,130,246,0.15)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#60a5fa",
                  }}
                >
                  <Cloud size={24} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
                      Google Drive Cloud Backup
                    </h3>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "0.2rem 0.55rem",
                        borderRadius: 20,
                        background: "rgba(34,197,94,0.15)",
                        color: "#4ade80",
                        border: "1px solid rgba(34,197,94,0.3)",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#4ade80",
                          display: "inline-block",
                        }}
                      />
                      Conectado
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", margin: "0.25rem 0 0 0" }}>
                    Subida y custodia automática en la carpeta <strong>Backups</strong> de Google Drive.
                  </p>
                </div>
              </div>

              <a
                href="https://drive.google.com/drive/folders/1D7Js-cGvqfdCPnTtdXm_m-VwmDC5-FaG"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.55rem 1rem",
                  borderRadius: 8,
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.35)",
                  color: "#93c5fd",
                  fontSize: 12.5,
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
              >
                <ExternalLink size={14} /> Abrir Carpeta en Google Drive ↗
              </a>
            </div>
          </div>

          {/* Selector de Módulos para Crear Backup */}
          <div style={cardSectionStyle}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "0.75rem",
              }}
            >
              <div>
                <h2 style={sectionTitleStyle}>
                  <HardDrive size={18} style={{ color: "#c9a84c" }} /> Copia de Seguridad Completa de la Web y Base de Datos
                </h2>
                <p style={sectionDescStyle}>
                  Selecciona los módulos a incluir en la copia. El archivo comprimido .ZIP contendrá las tablas relacionales y sus archivos.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={selectAllBackupItems}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 6,
                    padding: "0.35rem 0.75rem",
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Seleccionar Todos
                </button>
                <button
                  type="button"
                  onClick={deselectAllBackupItems}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 6,
                    padding: "0.35rem 0.75rem",
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Deseleccionar
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "0.75rem",
                margin: "1.25rem 0",
              }}
            >
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
                      background: checked ? "rgba(200,30,34,0.1)" : "rgba(255,255,255,0.02)",
                      border: checked ? "1px solid rgba(200,30,34,0.35)" : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ color: checked ? "#ff6b6e" : "rgba(255,255,255,0.3)", marginTop: 2 }}>
                      {checked ? <CheckSquare size={17} /> : <Square size={17} />}
                    </span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{item.label}</p>
                      <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", margin: "0.15rem 0 0 0" }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={createBackup}
                disabled={backupCreating || backupRestoring || backupSelected.length === 0}
                style={{
                  ...primaryButtonStyle(false),
                  opacity: backupCreating || backupSelected.length === 0 ? 0.6 : 1,
                  cursor: backupCreating || backupSelected.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {backupCreating ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" /> Generando y Subiendo a Drive...
                  </>
                ) : (
                  <>
                    <Cloud size={15} /> Generar Backup y Subir a Google Drive
                  </>
                )}
              </button>

              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                {backupSelected.length} de {BACKUP_ITEMS.length} módulos seleccionados
              </span>
            </div>
          </div>

          {/* Historial de Copias de Seguridad */}
          <div style={cardSectionStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <h3 style={sectionTitleStyle}>
                  <FileArchive size={17} style={{ color: "#c9a84c" }} /> Copias Disponibles en Servidor y Google Drive
                </h3>
                <p style={sectionDescStyle}>
                  Descarga tus backups locales o abre directamente el archivo respaldado en Google Drive.
                </p>
              </div>

              <button
                type="button"
                onClick={loadBackupList}
                disabled={backupListLoading}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding: "0.4rem 0.8rem",
                  color: "#fff",
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={13} className={backupListLoading ? "animate-spin" : ""} />
                Actualizar
              </button>
            </div>

            {backupListLoading && backupList.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                Cargando copias de seguridad...
              </div>
            ) : backupList.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "rgba(255,255,255,0.4)",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 8,
                  border: "1px dashed rgba(255,255,255,0.1)",
                }}
              >
                Aún no has generado ninguna copia de seguridad. Pulsa el botón superior para crear la primera.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {backupList.map((item) => {
                  const sizeMb = (item.size / 1024 / 1024).toFixed(2);
                  const dateFormatted = new Date(item.createdAt).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={item.filename}
                      style={{
                        padding: "1rem 1.15rem",
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 8,
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ minWidth: 260, flex: "1 1 auto" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                          <FileArchive size={16} style={{ color: "#c9a84c" }} />
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>
                            {item.filename}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "0.15rem 0.5rem",
                              borderRadius: 4,
                              background: "rgba(255,255,255,0.08)",
                              color: "rgba(255,255,255,0.7)",
                            }}
                          >
                            {sizeMb} MB
                          </span>

                          {item.driveUrl ? (
                            <a
                              href={item.driveUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "0.2rem 0.55rem",
                                borderRadius: 12,
                                background: "rgba(34,197,94,0.15)",
                                color: "#4ade80",
                                border: "1px solid rgba(34,197,94,0.3)",
                                textDecoration: "none",
                              }}
                            >
                              <ExternalLink size={11} /> En Google Drive ↗
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => syncToDrive(item.filename)}
                              disabled={driveSyncing === item.filename}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "0.2rem 0.55rem",
                                borderRadius: 12,
                                background: "rgba(59,130,246,0.15)",
                                color: "#60a5fa",
                                border: "1px solid rgba(59,130,246,0.3)",
                                cursor: "pointer",
                              }}
                            >
                              {driveSyncing === item.filename ? (
                                <RefreshCw size={11} className="animate-spin" />
                              ) : (
                                <Cloud size={11} />
                              )}
                              Subir a Drive
                            </button>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.35rem" }}>
                          <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)" }}>
                            Generado: {dateFormatted}
                          </span>
                        </div>

                        {/* Píldoras de resumen de entidades respaldadas */}
                        {item.counts && Object.keys(item.counts).length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
                            {Object.entries(item.counts)
                              .filter(([_, count]) => count > 0)
                              .map(([k, count]) => (
                                <span
                                  key={k}
                                  style={{
                                    fontSize: 10.5,
                                    padding: "0.15rem 0.45rem",
                                    borderRadius: 4,
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: "rgba(255,255,255,0.7)",
                                  }}
                                >
                                  {count} {k}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Botones de acción */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <a
                          href={`/api/admin/backup/download/${item.filename}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "0.45rem 0.85rem",
                            borderRadius: 6,
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <Download size={13} /> Descargar
                        </a>

                        <button
                          type="button"
                          onClick={() => restoreBackup(item.filename)}
                          disabled={backupRestoring}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "0.45rem 0.85rem",
                            borderRadius: 6,
                            background: "rgba(201,168,76,0.12)",
                            border: "1px solid rgba(201,168,76,0.3)",
                            color: "#f5c542",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: backupRestoring ? "not-allowed" : "pointer",
                          }}
                        >
                          <RefreshCw size={13} className={backupRestoring ? "animate-spin" : ""} />
                          Restaurar
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteBackup(item.filename)}
                          disabled={backupRestoring}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "0.45rem",
                            borderRadius: 6,
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.25)",
                            color: "#f87171",
                            cursor: "pointer",
                          }}
                          title="Eliminar del servidor"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Restauración Externa desde Archivo ZIP */}
          <div
            style={{
              ...cardSectionStyle,
              borderStyle: "dashed",
              borderColor: "rgba(201,168,76,0.35)",
              background: "rgba(201,168,76,0.02)",
            }}
          >
            <h3 style={sectionTitleStyle}>
              <Upload size={17} style={{ color: "#c9a84c" }} /> Restaurar desde Archivo ZIP Externo
            </h3>
            <p style={sectionDescStyle}>
              Si dispones de un archivo .zip generado en otra fecha o descargado de Google Drive, puedes subirlo aquí para restaurar la base de datos completa.
            </p>

            <div style={{ marginTop: "1rem" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.7rem 1.4rem",
                  borderRadius: 8,
                  background: "rgba(201,168,76,0.15)",
                  border: "1px solid rgba(201,168,76,0.4)",
                  color: "#f5c542",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: backupRestoring ? "not-allowed" : "pointer",
                  opacity: backupRestoring ? 0.6 : 1,
                }}
              >
                <FolderUp size={16} />
                {backupRestoring ? "Restaurando copia..." : "Seleccionar Archivo .ZIP para Restaurar"}
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleUploadZipRestore}
                  disabled={backupRestoring}
                  style={{ display: "none" }}
                />
              </label>
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
