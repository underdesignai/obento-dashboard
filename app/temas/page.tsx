"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Palette,
  Flame,
  Snowflake,
  Sun,
  Crown,
  CheckCircle2,
  Sliders,
  Calendar,
  Save,
  AlertTriangle,
  Layers,
  ShoppingBag,
  Info,
  Check,
  RefreshCw,
  Clock
} from "lucide-react";
import { useAdminLanguage } from "@/lib/LanguageContext";

export type FestiveTheme = "normal" | "halloween" | "navidad" | "ano_nuevo" | "reyes";
export type Intensity = "subtle" | "medium" | "festive";

export interface ThemeConfig {
  theme: FestiveTheme;
  intensity: Intensity;
  active: boolean;
  cartCelebration: boolean;
  floatingBadges: boolean;
  seasonalSpecials: boolean;
  schedule: {
    halloween: { start: string; end: string; enabled: boolean };
    navidad: { start: string; end: string; enabled: boolean };
    ano_nuevo: { start: string; end: string; enabled: boolean };
    reyes: { start: string; end: string; enabled: boolean };
  };
}

const THEME_CARDS: {
  id: FestiveTheme;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  glow: string;
  bgGradient: string;
  icon: any;
  particles: string;
  badgeLabel: string;
}[] = [
  {
    id: "normal",
    title: "Clásico Obento",
    subtitle: "Identidad Premium Habitual",
    description: "La elegancia sobria y limpia de Obento: negro obsidiana, rojo carmesí y toques dorados sin animaciones estacionales.",
    accent: "#c9a84c",
    glow: "rgba(201, 168, 76, 0.2)",
    bgGradient: "linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(18,16,14,0.95) 100%)",
    icon: Sparkles,
    particles: "Sin partículas adicionales",
    badgeLabel: "Por Defecto",
  },
  {
    id: "halloween",
    title: "Halloween / Yōkai",
    subtitle: "Noche Mística Japonesa",
    description: "Atmósfera nocturna refinada inspirada en los espíritus japoneses: niebla espectral, llamas Hitodama etéreas y detalles calabaza oscuros.",
    accent: "#ff7518",
    glow: "rgba(255, 117, 24, 0.25)",
    bgGradient: "linear-gradient(135deg, rgba(255,117,24,0.1) 0%, rgba(35,10,45,0.3) 50%, rgba(18,16,14,0.95) 100%)",
    icon: Flame,
    particles: "Hitodama (fuego fatuo) & murciélagos origami",
    badgeLabel: "Otoño / Octubre",
  },
  {
    id: "navidad",
    title: "Navidad Invernal",
    subtitle: "Nieve & Calidez Festiva",
    description: "Caída suave y elegante de copos de nieve de cristal sobre fondo oscuro, con luces doradas cálidas tipo campana Shinto.",
    accent: "#38ef7d",
    glow: "rgba(56, 239, 125, 0.25)",
    bgGradient: "linear-gradient(135deg, rgba(56,239,125,0.08) 0%, rgba(200,30,34,0.12) 50%, rgba(18,16,14,0.95) 100%)",
    icon: Snowflake,
    particles: "Copos de nieve suaves & destellos escarchados",
    badgeLabel: "Diciembre",
  },
  {
    id: "ano_nuevo",
    title: "Año Nuevo / Oshōgatsu",
    subtitle: "Kira-kira Dorado & Prosperidad",
    description: "Celebración de nuevo ciclo al estilo nipón: micro-destellos de oro líquido, soplos festivos y estética de máxima distinción.",
    accent: "#ffd700",
    glow: "rgba(255, 215, 0, 0.3)",
    bgGradient: "linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(200,30,34,0.12) 60%, rgba(18,16,14,0.95) 100%)",
    icon: Sun,
    particles: "Chispas doradas Kira-kira & confeti dorado",
    badgeLabel: "Fin de Año",
  },
  {
    id: "reyes",
    title: "Reyes Magos",
    subtitle: "Estrella de Oriente & Magia",
    description: "Elegancia mística de la epifanía: estrellas fugaces sutiles, polvo cósmico en tonos púrpura y zafiro real, y detalles de corona.",
    accent: "#9d4edd",
    glow: "rgba(157, 78, 221, 0.3)",
    bgGradient: "linear-gradient(135deg, rgba(157,78,221,0.12) 0%, rgba(30,144,255,0.1) 50%, rgba(18,16,14,0.95) 100%)",
    icon: Crown,
    particles: "Polvo de estrellas & cometas fugaces",
    badgeLabel: "Enero",
  },
];

export default function TemasPage() {
  const { tr } = useAdminLanguage();
  const [config, setConfig] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar configuración
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/admin/temas");
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        } else {
          setErrorMsg("No se pudo cargar la configuración de temas.");
        }
      } catch (e) {
        setErrorMsg("Error de conexión al obtener temas.");
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (customConfig?: ThemeConfig) => {
    const toSave = customConfig || config;
    if (!toSave) return;
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/temas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMsg("Error al guardar la configuración.");
      }
    } catch {
      setErrorMsg("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div style={{ display: "flex", height: "50vh", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <RefreshCw size={20} className="animate-spin" style={{ color: "#c9a84c" }} />
          <span style={{ fontSize: 14 }}>Cargando gestor de temas festivos...</span>
        </div>
      </div>
    );
  }

  const activeThemeMeta = THEME_CARDS.find((c) => c.id === config.theme) || THEME_CARDS[0];

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", paddingBottom: "4rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* ─── CABECERA PRINCIPAL ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(200,30,34,0.25) 0%, rgba(133,19,22,0.35) 100%)",
              border: "1px solid rgba(200,30,34,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 18px rgba(200, 30, 34, 0.25)",
              color: "#c81e22",
            }}
          >
            <Palette size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "#fff", fontFamily: "var(--font-playfair, serif)" }}>
                Temas y Animaciones de Temporada
              </h1>
              {config.active && config.theme !== "normal" && (
                <span
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    padding: "3px 9px",
                    borderRadius: 999,
                    fontWeight: 700,
                    background: activeThemeMeta.glow,
                    color: activeThemeMeta.accent,
                    border: `1px solid ${activeThemeMeta.accent}50`,
                  }}
                >
                  {activeThemeMeta.title} Activo
                </span>
              )}
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255, 255, 255, 0.45)" }}>
              Personaliza la estética festiva y animaciones de la web y el módulo de pedidos online en tiempo real.
            </p>
          </div>
        </div>

        {/* Botón Guardar Cambios */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0.6rem 1.35rem",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              border: "1px solid rgba(255,255,255,0.15)",
              background: saveSuccess
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : "linear-gradient(135deg, #c81e22 0%, #851316 100%)",
              color: "#fff",
              boxShadow: saveSuccess
                ? "0 4px 14px rgba(16, 185, 129, 0.35)"
                : "0 4px 14px rgba(200, 30, 34, 0.35)",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 size={16} />
            ) : (
              <Save size={16} />
            )}
            <span>{saveSuccess ? "¡Guardado con éxito!" : saving ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div
          style={{
            padding: "0.85rem 1rem",
            borderRadius: 8,
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#fca5a5",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertTriangle size={17} style={{ flexShrink: 0, color: "#f87171" }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ─── SWITCH MAESTRO DE ACTIVACIÓN (Banner de Control) ─── */}
      <div
        style={{
          background: config.active
            ? "linear-gradient(135deg, rgba(200,30,34,0.12) 0%, rgba(20,18,17,0.95) 100%)"
            : "#0e0c0b",
          border: `1px solid ${config.active ? "rgba(200,30,34,0.35)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 12,
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: config.active ? "#4ade80" : "rgba(255,255,255,0.2)",
              boxShadow: config.active ? "0 0 10px #4ade80" : "none",
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                Modo Festivo en Vivo (Web & Pedidos)
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: config.active ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.08)",
                  color: config.active ? "#4ade80" : "rgba(255,255,255,0.4)",
                  border: `1px solid ${config.active ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {config.active ? "Activo" : "Desactivado (Normal)"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
              Cuando está encendido, el tema seleccionado a continuación se mostrará en todos los dominios de Obento.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = { ...config, active: !config.active };
            setConfig(next);
            handleSave(next);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "0.55rem 1.15rem",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s",
            background: config.active ? "rgba(200,30,34,0.2)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${config.active ? "#c81e22" : "rgba(255,255,255,0.12)"}`,
            color: config.active ? "#ff7c80" : "rgba(255,255,255,0.6)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: config.active ? "#c81e22" : "rgba(255,255,255,0.3)",
            }}
          />
          {config.active ? "Desactivar Modo Festivo" : "Activar Modo Festivo"}
        </button>
      </div>

      {/* ─── SECCIÓN: LISTA ESTRUCTURADA DE TEMAS ESTACIONALES ─── */}
      <div
        style={{
          background: "#0e0c0b",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Cabecera de la Lista */}
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Layers size={18} style={{ color: "#c9a84c" }} />
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>
                Colección de Temas Estacionales
              </h2>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                Selecciona la ambientación visual activa para el diseño web y cartas
              </p>
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 999,
              background: "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.25)",
              color: "#c9a84c",
              fontWeight: 600,
            }}
          >
            {THEME_CARDS.length} Temas Disponibles
          </span>
        </div>

        {/* Filas de la Lista de Temas */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {THEME_CARDS.map((theme, index) => {
            const isSelected = config.theme === theme.id;
            const Icon = theme.icon;
            const isLast = index === THEME_CARDS.length - 1;

            return (
              <div
                key={theme.id}
                onClick={() => {
                  const next = { ...config, theme: theme.id };
                  setConfig(next);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.1rem 1.5rem",
                  borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
                  background: isSelected
                    ? `linear-gradient(90deg, ${theme.glow} 0%, rgba(18,16,14,0.6) 100%)`
                    : "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                  borderLeft: isSelected ? `4px solid ${theme.accent}` : "4px solid transparent",
                  gap: "1.25rem",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Lado izquierdo: Icono y Textos */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: `rgba(255,255,255,0.04)`,
                      border: `1px solid ${isSelected ? theme.accent : "rgba(255,255,255,0.1)"}`,
                      color: theme.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: isSelected ? `0 0 16px ${theme.glow}` : "none",
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>
                        {theme.title}
                      </h3>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.5)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {theme.subtitle}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.3)",
                          marginLeft: 4,
                        }}
                      >
                        · {theme.badgeLabel}
                      </span>
                    </div>

                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                      {theme.description}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                      <span style={{ color: "rgba(255,255,255,0.25)" }}>Efecto partículas:</span>
                      <span style={{ color: isSelected ? theme.accent : "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                        {theme.particles}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado derecho: Botón o Estado de Selección */}
                <div style={{ flexShrink: 0 }}>
                  {isSelected ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "0.45rem 0.95rem",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                        background: theme.accent,
                        color: "#080808",
                        boxShadow: `0 4px 12px ${theme.glow}`,
                      }}
                    >
                      <Check size={14} strokeWidth={3} />
                      <span>Seleccionado</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      style={{
                        padding: "0.45rem 0.95rem",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.6)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#fff";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      }}
                    >
                      Elegir tema
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── DOS COLUMNAS: INTENSIDAD Y MICRO-INTERACCIONES ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Intensidad de Animaciones */}
        <div
          style={{
            background: "#0e0c0b",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c9a84c",
              }}
            >
              <Sliders size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>
                Intensidad de Animaciones
              </h3>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                Controla la densidad y frecuencia de las partículas en pantalla
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
            {(
              [
                { id: "subtle", label: "Sutil", desc: "Mínima carga, elegante" },
                { id: "medium", label: "Moderada", desc: "Equilibrada y visual" },
                { id: "festive", label: "Festiva", desc: "Máxima inmersión" },
              ] as const
            ).map((lvl) => {
              const active = config.intensity === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setConfig({ ...config, intensity: lvl.id })}
                  style={{
                    padding: "0.75rem 0.6rem",
                    borderRadius: 8,
                    border: `1px solid ${active ? "#c9a84c" : "rgba(255,255,255,0.08)"}`,
                    background: active ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.02)",
                    color: active ? "#fff" : "rgba(255,255,255,0.6)",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: active ? "#c9a84c" : "#fff" }}>
                    {lvl.label}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                    {lvl.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <div
            style={{
              padding: "0.75rem 0.9rem",
              borderRadius: 8,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              lineHeight: 1.4,
            }}
          >
            <Info size={15} style={{ color: "#c9a84c", flexShrink: 0, marginTop: 1 }} />
            <span>
              Todas las animaciones usan un canvas ultra-optimizado. Si el dispositivo tiene activado &quot;Reducir movimiento&quot;, se suspenderán automáticamente.
            </span>
          </div>
        </div>

        {/* Micro-Interacciones Específicas */}
        <div
          style={{
            background: "#0e0c0b",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(200,30,34,0.12)",
                border: "1px solid rgba(200,30,34,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c81e22",
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>
                Micro-Interacciones & Extras
              </h3>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                Detalles interactivos al navegar o comprar en la web
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                borderRadius: 8,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ShoppingBag size={16} style={{ color: "#c9a84c", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                    Celebración al Añadir al Carrito
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    Explosión temática de confeti (fantasmitas en Halloween, estrellas en Navidad)
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.cartCelebration}
                onChange={(e) => setConfig({ ...config, cartCelebration: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: "#c81e22", cursor: "pointer" }}
              />
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                borderRadius: 8,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Sparkles size={16} style={{ color: "#c81e22", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                    Badges Flotantes Estacionales
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    Insignias de fiesta sutiles en la esquina superior o en platos destacados
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.floatingBadges}
                onChange={(e) => setConfig({ ...config, floatingBadges: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: "#c81e22", cursor: "pointer" }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* ─── SECCIÓN: PROGRAMACIÓN AUTOMÁTICA POR CALENDARIO ─── */}
      <div
        style={{
          background: "#0e0c0b",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "1.25rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(96,165,250,0.1)",
              border: "1px solid rgba(96,165,250,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#60a5fa",
            }}
          >
            <Calendar size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>
              Programación Automática (Calendario Anual)
            </h3>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
              Activa los temas automáticamente en las fechas establecidas sin necesidad de encenderlos a mano.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {[
            { key: "halloween", title: "Halloween", range: "24 Oct - 02 Nov", color: "#ff7518" },
            { key: "navidad", title: "Navidad", range: "15 Dic - 28 Dic", color: "#38ef7d" },
            { key: "ano_nuevo", title: "Año Nuevo", range: "29 Dic - 02 Ene", color: "#ffd700" },
            { key: "reyes", title: "Reyes Magos", range: "03 Ene - 07 Ene", color: "#9d4edd" },
          ].map((item) => {
            const sched = config.schedule?.[item.key as keyof typeof config.schedule] || {
              enabled: false,
              start: "",
              end: "",
            };
            return (
              <div
                key={item.key}
                style={{
                  padding: "1rem",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${sched.enabled ? `${item.color}40` : "rgba(255,255,255,0.06)"}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{item.title}</div>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: sched.enabled ? item.color : "rgba(255,255,255,0.2)",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                    <Clock size={12} />
                    <span>{item.range}</span>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: "0.65rem",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Auto-activar:</span>
                  <input
                    type="checkbox"
                    checked={sched.enabled}
                    onChange={(e) => {
                      const next = {
                        ...config,
                        schedule: {
                          ...config.schedule,
                          [item.key]: {
                            ...sched,
                            enabled: e.target.checked,
                          },
                        },
                      };
                      setConfig(next);
                    }}
                    style={{ width: 16, height: 16, accentColor: "#c81e22", cursor: "pointer" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
