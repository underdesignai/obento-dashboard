"use client";

import { useEffect, useState } from "react";
import {
  MessageCircle, Send, Check, Copy, AlertTriangle, ShieldCheck,
  RefreshCw, Bot, ExternalLink, Settings2, Globe2, Key, Link2,
  CheckCircle2, AlertCircle, Info, Sparkles, MessageSquare, QrCode,
  Smartphone, Wifi, WifiOff, Power, Radio
} from "lucide-react";
import { useSession } from "@/lib/session";

interface WhatsAppConfig {
  proveedor: "meta" | "baileys";
  activo: boolean;
  systemPrompt: string;
  meta: {
    phoneNumberId: string;
    wabaId: string;
    accessToken: string;
    verifyToken: string;
  };
  baileys: {
    phoneNumber: string;
    estado: string;
    pairingMethod: "qr" | "code";
    autoReconectar: boolean;
    sessionName: string;
  };
}

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
  transition: "border-color 0.15s",
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

export default function WhatsAppBotPage() {
  useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [activeTab, setActiveTab] = useState<"meta" | "baileys">("baileys");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Estados de configuración
  const [proveedor, setProveedor] = useState<"meta" | "baileys">("baileys");
  const [activo, setActivo] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");

  // Meta Cloud API
  const [metaPhoneId, setMetaPhoneId] = useState("");
  const [metaWabaId, setMetaWabaId] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [metaVerifyToken, setMetaVerifyToken] = useState("obento_webhook_secret_verify_2026");
  const [webhookUrls, setWebhookUrls] = useState({
    meta: "https://obentojapanesefood.es/api/webhooks/whatsapp",
  });

  // Baileys
  const [baileysPhone, setBaileysPhone] = useState("+34 621 29 57 84");
  const [baileysEstado, setBaileysEstado] = useState("conectado");
  const [baileysMethod, setBaileysMethod] = useState<"qr" | "code">("qr");
  const [baileysAutoReconectar, setBaileysAutoReconectar] = useState(true);
  const [reconnectingSocket, setReconnectingSocket] = useState(false);

  // Estados del Simulador de Chat
  const [simMessages, setSimMessages] = useState<Array<{ sender: "user" | "bot"; text: string; time: string }>>([
    {
      sender: "bot",
      text: "¡Konnichiwa! 👋 Bienvenido a Obento Japanese Food (Murcia). Soy tu asistente virtual por WhatsApp. ¿En qué puedo ayudarte hoy?\n\n(Recuerda que para realizar pedidos online puedes acceder directamente a https://obentojapanesefood.es/pedidos)",
      time: "Ahora",
    },
  ]);
  const [simInput, setSimInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);

  // Cargar configuración
  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp-bot");
      if (res.ok) {
        const data = await res.json();
        const cfg: WhatsAppConfig = data.config;
        const prov = cfg.proveedor === "meta" ? "meta" : "baileys";
        setProveedor(prov);
        setActiveTab(prov);
        setActivo(cfg.activo !== undefined ? cfg.activo : true);
        setSystemPrompt(cfg.systemPrompt || "");
        setMetaPhoneId(cfg.meta?.phoneNumberId || "");
        setMetaWabaId(cfg.meta?.wabaId || "");
        setMetaToken(cfg.meta?.accessToken || "");
        setMetaVerifyToken(cfg.meta?.verifyToken || "obento_webhook_secret_verify_2026");
        setBaileysPhone(cfg.baileys?.phoneNumber || "+34 621 29 57 84");
        setBaileysEstado(cfg.baileys?.estado || "conectado");
        setBaileysMethod(cfg.baileys?.pairingMethod || "qr");
        setBaileysAutoReconectar(cfg.baileys?.autoReconectar !== undefined ? cfg.baileys.autoReconectar : true);
        if (data.webhookUrls) setWebhookUrls(data.webhookUrls);
      }
    } catch (e) {
      console.error("Error al cargar config de WhatsApp:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
      const res = await fetch("/api/admin/whatsapp-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedor,
          activo,
          systemPrompt,
          meta: {
            phoneNumberId: metaPhoneId,
            wabaId: metaWabaId,
            accessToken: metaToken,
            verifyToken: metaVerifyToken,
          },
          baileys: {
            phoneNumber: baileysPhone,
            estado: baileysEstado,
            pairingMethod: baileysMethod,
            autoReconectar: baileysAutoReconectar,
          },
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        const d = await res.json();
        setSaveError(d.error || "Error al guardar la configuración.");
      }
    } catch (e: any) {
      setSaveError(e.message || "Error al conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const handleReconnectBaileys = () => {
    setReconnectingSocket(true);
    setTimeout(() => {
      setReconnectingSocket(false);
      setBaileysEstado("conectado");
    }, 1800);
  };

  const handleSimSend = async (messageText?: string) => {
    const textToSend = messageText || simInput;
    if (!textToSend.trim() || simLoading) return;

    const timeStr = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const newHistory = [...simMessages, { sender: "user" as const, text: textToSend, time: timeStr }];
    setSimMessages(newHistory);
    if (!messageText) setSimInput("");
    setSimLoading(true);

    try {
      const res = await fetch("/api/admin/whatsapp-bot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: newHistory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.reply,
            time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (e) {
      console.error("Error en simulador:", e);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div style={{ padding: "1.75rem", maxWidth: 1400, margin: "0 auto", color: "#f3ede0" }}>
      {/* ── CABECERA PRINCIPAL ── */}
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
              background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 18px rgba(37, 211, 102, 0.35)",
            }}
          >
            <MessageCircle size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#fff" }}>
                WhatsApp Bot Oficial
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: activo ? "rgba(37, 211, 102, 0.15)" : "rgba(255, 255, 255, 0.08)",
                  border: `1px solid ${activo ? "rgba(37, 211, 102, 0.4)" : "rgba(255, 255, 255, 0.15)"}`,
                  color: activo ? "#4ade80" : "rgba(255, 255, 255, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: activo ? "#25D366" : "#888" }} />
                {activo ? (proveedor === "baileys" ? "Activo · Baileys Socket" : "Activo · Meta Cloud API") : "Pausado"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255, 255, 255, 0.45)" }}>
              Gestión del bot de WhatsApp para Obento con soporte dual oficial: <strong>Baileys</strong> (conexión directa por socket) y <strong>Meta Cloud API</strong>.
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera: Toggle Activo & Guardar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setActivo(!activo)}
            style={{
              background: activo ? "rgba(37, 211, 102, 0.12)" : "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${activo ? "rgba(37, 211, 102, 0.35)" : "rgba(255, 255, 255, 0.1)"}`,
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
            {activo ? "Bot Encendido" : "Bot Desactivado"}
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
        <div
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            color: "#6ee7b7",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          Configuración y System Prompt de WhatsApp guardados exitosamente.
        </div>
      )}

      {saveError && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            color: "#fca5a5",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertCircle size={16} />
          {saveError}
        </div>
      )}

      {/* ── BANNER REGLA ESTRICTA DE PEDIDOS ── */}
      <div
        style={{
          background: "linear-gradient(90deg, rgba(200, 30, 34, 0.15) 0%, rgba(35, 15, 17, 0.3) 100%)",
          border: "1px solid rgba(200, 30, 34, 0.4)",
          borderRadius: 12,
          padding: "1rem 1.25rem",
          marginBottom: "1.75rem",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(200, 30, 34, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "#ff7c80",
          }}
        >
          <AlertTriangle size={18} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#ff8e91", marginBottom: 2 }}>
            DIRECTRIZ ESTRICTA DE SEGURIDAD PARA PEDIDOS
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.5 }}>
            Con el WhatsApp Bot <strong>NO se pueden registrar ni cobrar pedidos</strong> directamente en el chat.
            Para que el cliente arme su pedido con fotos, opciones personalizadas y pague con seguridad, el bot
            <strong> siempre debe derivarlo a la web oficial</strong>:{" "}
            <a
              href="https://obentojapanesefood.es/pedidos"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#ffb4b6", textDecoration: "underline", fontWeight: 700 }}
            >
              https://obentojapanesefood.es/pedidos
            </a>
          </p>
        </div>
      </div>

      {/* ── GRID PRINCIPAL: CONFIGURACIÓN A LA IZQUIERDA Y SIMULADOR A LA DERECHA ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.9fr", gap: "1.75rem", alignItems: "start" }}>
        {/* COLUMNA IZQUIERDA: PROVEEDOR Y SYSTEM PROMPT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* 1. SELECCIÓN DE PROVEEDOR (BAILEYS VS META CLOUD API) */}
          <div
            style={{
              background: "#0e0c0b",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>
                  1. Opciones de Conexión: Baileys o Meta Cloud API
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255, 255, 255, 0.4)" }}>
                  Selecciona la opción con la que operará el bot (ambos comparten el mismo System Prompt)
                </p>
              </div>

              {/* Selector de Proveedor Activo */}
              <div
                style={{
                  display: "flex",
                  background: "rgba(255, 255, 255, 0.04)",
                  padding: 3,
                  borderRadius: 8,
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setProveedor("baileys");
                    setActiveTab("baileys");
                  }}
                  style={{
                    padding: "0.35rem 0.85rem",
                    borderRadius: 6,
                    border: "none",
                    background: proveedor === "baileys" ? "#25D366" : "transparent",
                    color: proveedor === "baileys" ? "#0a2612" : "rgba(255, 255, 255, 0.5)",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  Baileys {proveedor === "baileys" && "✓ Activo"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProveedor("meta");
                    setActiveTab("meta");
                  }}
                  style={{
                    padding: "0.35rem 0.85rem",
                    borderRadius: 6,
                    border: "none",
                    background: proveedor === "meta" ? "#25D366" : "transparent",
                    color: proveedor === "meta" ? "#0a2612" : "rgba(255, 255, 255, 0.5)",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  Meta Cloud API {proveedor === "meta" && "✓ Activo"}
                </button>
              </div>
            </div>

            {/* Pestañas de Credenciales */}
            <div style={{ display: "flex", gap: 8, borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "1.25rem" }}>
              <button
                type="button"
                onClick={() => setActiveTab("baileys")}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0.5rem 0.9rem",
                  fontSize: 12,
                  fontWeight: 700,
                  color: activeTab === "baileys" ? "#fff" : "rgba(255, 255, 255, 0.4)",
                  borderBottom: `2px solid ${activeTab === "baileys" ? "#25D366" : "transparent"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Smartphone size={14} /> Baileys (Socket & QR)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("meta")}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0.5rem 0.9rem",
                  fontSize: 12,
                  fontWeight: 700,
                  color: activeTab === "meta" ? "#fff" : "rgba(255, 255, 255, 0.4)",
                  borderBottom: `2px solid ${activeTab === "meta" ? "#25D366" : "transparent"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Globe2 size={14} /> Meta Cloud API Oficial
              </button>
            </div>

            {/* FORMULARIO BAILEYS */}
            {activeTab === "baileys" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Tarjeta de Estado de Conexión Baileys */}
                <div
                  style={{
                    background: "rgba(37, 211, 102, 0.06)",
                    border: "1px solid rgba(37, 211, 102, 0.3)",
                    borderRadius: 10,
                    padding: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: baileysEstado === "conectado" ? "rgba(37, 211, 102, 0.2)" : "rgba(255, 255, 255, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: baileysEstado === "conectado" ? "#25D366" : "#aaa",
                      }}
                    >
                      {baileysEstado === "conectado" ? <Wifi size={18} /> : <WifiOff size={18} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                        Sesión Baileys: {baileysEstado === "conectado" ? "Conectada Exitosamente" : "Desconectada"}
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#25D366" }} />
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)" }}>
                        Número activo: <strong style={{ color: "#4ade80" }}>{baileysPhone}</strong> · Socket WS
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReconnectBaileys}
                    disabled={reconnectingSocket}
                    style={{
                      background: "rgba(37, 211, 102, 0.15)",
                      border: "1px solid rgba(37, 211, 102, 0.4)",
                      borderRadius: 8,
                      padding: "0.45rem 0.85rem",
                      color: "#4ade80",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: reconnectingSocket ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <RefreshCw size={12} className={reconnectingSocket ? "animate-spin" : ""} />
                    {reconnectingSocket ? "Reconectando..." : "Reconectar Socket"}
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={LABEL_STYLE}>Número de WhatsApp Asociado</label>
                    <input
                      type="text"
                      value={baileysPhone}
                      onChange={(e) => setBaileysPhone(e.target.value)}
                      placeholder="+34 621 29 57 84"
                      style={INPUT_STYLE}
                    />
                  </div>

                  <div>
                    <label style={LABEL_STYLE}>Método de Vinculación</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setBaileysMethod("qr")}
                        style={{
                          flex: 1,
                          padding: "0.6rem 0.75rem",
                          borderRadius: 8,
                          border: `1px solid ${baileysMethod === "qr" ? "#25D366" : "rgba(255,255,255,0.1)"}`,
                          background: baileysMethod === "qr" ? "rgba(37, 211, 102, 0.15)" : "rgba(255,255,255,0.03)",
                          color: baileysMethod === "qr" ? "#4ade80" : "rgba(255,255,255,0.5)",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <QrCode size={14} /> Escáner QR
                      </button>
                      <button
                        type="button"
                        onClick={() => setBaileysMethod("code")}
                        style={{
                          flex: 1,
                          padding: "0.6rem 0.75rem",
                          borderRadius: 8,
                          border: `1px solid ${baileysMethod === "code" ? "#25D366" : "rgba(255,255,255,0.1)"}`,
                          background: baileysMethod === "code" ? "rgba(37, 211, 102, 0.15)" : "rgba(255,255,255,0.03)",
                          color: baileysMethod === "code" ? "#4ade80" : "rgba(255,255,255,0.5)",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <Key size={14} /> Pairing Code
                      </button>
                    </div>
                  </div>
                </div>

                {/* Caja Informativa Baileys */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px dashed rgba(255, 255, 255, 0.1)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 11.5,
                    color: "rgba(255, 255, 255, 0.45)",
                    lineHeight: 1.5,
                  }}
                >
                  💡 <strong>¿Cómo funciona Baileys?</strong> Se comunica directamente con los servidores de WhatsApp mediante web sockets imitando un dispositivo vinculado de WhatsApp Web. No requiere pagar tarifas de conversación a Meta ni verificación de empresa WABA.
                </div>
              </div>
            )}

            {/* FORMULARIO META CLOUD API */}
            {activeTab === "meta" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={LABEL_STYLE}>Phone Number ID</label>
                    <input
                      type="text"
                      value={metaPhoneId}
                      onChange={(e) => setMetaPhoneId(e.target.value)}
                      placeholder="Ej: 109384729103984"
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>WhatsApp Business Account ID (WABA)</label>
                    <input
                      type="text"
                      value={metaWabaId}
                      onChange={(e) => setMetaWabaId(e.target.value)}
                      placeholder="Ej: 984729104829104"
                      style={INPUT_STYLE}
                    />
                  </div>
                </div>

                <div>
                  <label style={LABEL_STYLE}>Token de Acceso Permanente (System User Token)</label>
                  <input
                    type="password"
                    value={metaToken}
                    onChange={(e) => setMetaToken(e.target.value)}
                    placeholder="EAABwz..."
                    style={INPUT_STYLE}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>Webhook URL para Meta Developers</label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(webhookUrls.meta, "meta_url")}
                        style={{ background: "none", border: "none", color: "#25D366", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
                      >
                        {copiedKey === "meta_url" ? <Check size={12} /> : <Copy size={12} />}
                        {copiedKey === "meta_url" ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={webhookUrls.meta}
                      style={{ ...INPUT_STYLE, background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.7)" }}
                    />
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                      <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>Verify Token</label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(metaVerifyToken, "meta_verify")}
                        style={{ background: "none", border: "none", color: "#25D366", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
                      >
                        {copiedKey === "meta_verify" ? <Check size={12} /> : <Copy size={12} />}
                        {copiedKey === "meta_verify" ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={metaVerifyToken}
                      onChange={(e) => setMetaVerifyToken(e.target.value)}
                      style={INPUT_STYLE}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. SYSTEM PROMPT MAESTRO (COMPARTIDO POR BAILEYS Y META) */}
          <div
            style={{
              background: "#0e0c0b",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 14,
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff" }}>
                  2. System Prompt Unificado (Baileys & Meta API)
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255, 255, 255, 0.4)" }}>
                  Este prompt maestro define la personalidad, reglas y conocimiento de Obento tanto para Baileys como para Meta API.
                </p>
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#ff7c80",
                  background: "rgba(200, 30, 34, 0.15)",
                  border: "1px solid rgba(200, 30, 34, 0.3)",
                  padding: "3px 8px",
                  borderRadius: 6,
                }}
              >
                Mismo prompt para ambos
              </span>
            </div>

            <textarea
              rows={14}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              style={{
                ...INPUT_STYLE,
                fontFamily: "monospace",
                fontSize: 12,
                lineHeight: 1.6,
                resize: "vertical",
                background: "rgba(0, 0, 0, 0.4)",
              }}
            />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.35)" }}>
                Contiene la regla obligatoria de no crear pedidos y derivar a https://obentojapanesefood.es/pedidos
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm("¿Restaurar el prompt oficial recomendado de Obento?")) {
                    loadConfig();
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#c9a84c",
                  fontSize: 11,
                  cursor: "pointer",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Restaurar prompt por defecto
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: SIMULADOR DE CHAT DE WHATSAPP (SANDBOX) */}
        <div
          style={{
            background: "#0c0a09",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            height: 720,
            boxShadow: "0 15px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Cabecera del Simulador (Estilo WhatsApp) */}
          <div
            style={{
              background: "#1f2c34",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#c81e22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 14,
                  color: "#fff",
                }}
              >
                OB
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                  Obento Japanese Food
                </div>
                <div style={{ fontSize: 11, color: "#25D366", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#25D366" }} />
                  {proveedor === "baileys" ? "Baileys Bot · En línea" : "Meta API Bot · En línea"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSimMessages([
                  {
                    sender: "bot",
                    text: "¡Konnichiwa! 👋 Bienvenido a Obento Japanese Food (Murcia). Soy tu asistente virtual por WhatsApp. ¿En qué puedo ayudarte hoy?\n\n(Recuerda que para realizar pedidos online puedes acceder directamente a https://obentojapanesefood.es/pedidos)",
                    time: "Ahora",
                  },
                ]);
              }}
              title="Reiniciar chat de prueba"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "none",
                borderRadius: 6,
                padding: "4px 8px",
                color: "rgba(255,255,255,0.6)",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Limpiar
            </button>
          </div>

          {/* Área de Mensajes con textura de fondo */}
          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              background: "#0b141a",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                textAlign: "center",
                background: "rgba(17, 27, 33, 0.7)",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 10,
                color: "rgba(255, 255, 255, 0.45)",
                margin: "0 auto 8px",
                maxWidth: "85%",
              }}
            >
              🔒 Los mensajes están cifrados de extremo a extremo. Simulador en vivo con reglas de Obento.
            </div>

            {simMessages.map((m, idx) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "82%",
                      padding: "8px 12px",
                      borderRadius: isUser ? "10px 0 10px 10px" : "0 10px 10px 10px",
                      background: isUser ? "#005c4b" : "#202c33",
                      color: "#e9edef",
                      fontSize: 13,
                      lineHeight: 1.5,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                      whiteSpace: "pre-line",
                    }}
                  >
                    <div>{m.text}</div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255, 255, 255, 0.4)",
                        textAlign: "right",
                        marginTop: 4,
                      }}
                    >
                      {m.time} {isUser && "✓✓"}
                    </div>
                  </div>
                </div>
              );
            })}

            {simLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    background: "#202c33",
                    padding: "8px 14px",
                    borderRadius: "0 10px 10px 10px",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <RefreshCw size={12} className="animate-spin" />
                  Obento Bot está escribiendo...
                </div>
              </div>
            )}
          </div>

          {/* Botones de Pruebas Rápidas de Cliente */}
          <div
            style={{
              padding: "8px 12px",
              background: "#111b21",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              gap: 6,
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            <button
              type="button"
              onClick={() => handleSimSend("Quiero pedir 2 bandejas de uramakis")}
              style={{
                background: "rgba(200, 30, 34, 0.2)",
                border: "1px solid rgba(200, 30, 34, 0.4)",
                borderRadius: 14,
                padding: "3px 9px",
                fontSize: 10.5,
                color: "#ff8e91",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              🚨 Probar: "Quiero pedir comida"
            </button>
            <button
              type="button"
              onClick={() => handleSimSend("¿Qué horario tenéis hoy?")}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: "3px 9px",
                fontSize: 10.5,
                color: "#e9edef",
                cursor: "pointer",
              }}
            >
              🕒 "¿Qué horario tenéis?"
            </button>
            <button
              type="button"
              onClick={() => handleSimSend("¿Tenéis opciones sin gluten?")}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: "3px 9px",
                fontSize: 10.5,
                color: "#e9edef",
                cursor: "pointer",
              }}
            >
              🌾 "¿Tenéis sin gluten?"
            </button>
          </div>

          {/* Input de Mensaje del Simulador */}
          <div
            style={{
              padding: "10px 12px",
              background: "#202c33",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              type="text"
              value={simInput}
              onChange={(e) => setSimInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSimSend();
              }}
              placeholder="Escribe un mensaje de WhatsApp..."
              style={{
                flex: 1,
                background: "#2a3942",
                border: "none",
                borderRadius: 8,
                padding: "9px 12px",
                color: "#e9edef",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              type="button"
              disabled={simLoading || !simInput.trim()}
              onClick={() => handleSimSend()}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#00a884",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: simLoading || !simInput.trim() ? "not-allowed" : "pointer",
                color: "#fff",
                opacity: simLoading || !simInput.trim() ? 0.5 : 1,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
