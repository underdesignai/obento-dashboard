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
  Eye,
  AlertTriangle,
  Layers,
  ShoppingBag,
  Info
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
  previewClass: string;
}[] = [
  {
    id: "normal",
    title: "Clásico Obento",
    subtitle: "Identidad Premium Habitual",
    description: "La elegancia sobria y limpia de Obento: negro obsidiana, rojo carmesí y toques dorados sin animaciones estacionales.",
    accent: "#c9a84c",
    glow: "rgba(201, 168, 76, 0.2)",
    bgGradient: "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(12,11,10,0.95) 100%)",
    icon: Sparkles,
    particles: "Sin partículas adicionales",
    previewClass: "border-[#c9a84c]/30",
  },
  {
    id: "halloween",
    title: "Halloween / Yōkai",
    subtitle: "Noche Mística Japonesa",
    description: "Atmósfera nocturna refinada inspirada en los espíritus japoneses: niebla espectral, llamas Hitodama etéreas y detalles calabaza oscuros.",
    accent: "#ff7518",
    glow: "rgba(255, 117, 24, 0.25)",
    bgGradient: "linear-gradient(135deg, rgba(255,117,24,0.12) 0%, rgba(35,10,45,0.4) 50%, rgba(12,11,10,0.98) 100%)",
    icon: Flame,
    particles: "Hitodama (fuego fatuo) & murciélagos origami",
    previewClass: "border-[#ff7518]/40",
  },
  {
    id: "navidad",
    title: "Navidad Invernal",
    subtitle: "Nieve & Calidez Festiva",
    description: "Caída suave y elegante de copos de nieve de cristal sobre fondo oscuro, con luces doradas cálidas tipo campana Shinto.",
    accent: "#38ef7d",
    glow: "rgba(56, 239, 125, 0.25)",
    bgGradient: "linear-gradient(135deg, rgba(56,239,125,0.1) 0%, rgba(200,30,34,0.15) 50%, rgba(12,11,10,0.98) 100%)",
    icon: Snowflake,
    particles: "Copos de nieve suaves & destellos escarchados",
    previewClass: "border-[#38ef7d]/40",
  },
  {
    id: "ano_nuevo",
    title: "Año Nuevo / Oshōgatsu",
    subtitle: "Kira-kira Dorado & Prosperidad",
    description: "Celebración de nuevo ciclo al estilo nipón: micro-destellos de oro líquido, soplos festivos y estética de máxima distinción.",
    accent: "#ffd700",
    glow: "rgba(255, 215, 0, 0.3)",
    bgGradient: "linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(200,30,34,0.15) 60%, rgba(12,11,10,0.98) 100%)",
    icon: Sun,
    particles: "Chispas doradas Kira-kira & confeti dorado",
    previewClass: "border-[#ffd700]/40",
  },
  {
    id: "reyes",
    title: "Reyes Magos",
    subtitle: "Estrella de Oriente & Magia",
    description: "Elegancia mística de la epifanía: estrellas fugaces sutiles, polvo cósmico en tonos púrpura y zafiro real, y detalles de corona.",
    accent: "#9d4edd",
    glow: "rgba(157, 78, 221, 0.3)",
    bgGradient: "linear-gradient(135deg, rgba(157,78,221,0.15) 0%, rgba(30,144,255,0.12) 50%, rgba(12,11,10,0.98) 100%)",
    icon: Crown,
    particles: "Polvo de estrellas & cometas fugaces",
    previewClass: "border-[#9d4edd]/40",
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
      <div className="flex h-96 items-center justify-center text-white/40">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
          <span>Cargando gestor de temas festivos...</span>
        </div>
      </div>
    );
  }

  const activeThemeMeta = THEME_CARDS.find((c) => c.id === config.theme) || THEME_CARDS[0];

  return (
    <div className="min-h-full pb-16 px-4 md:px-8 pt-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20">
              <Palette size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Temas y Animaciones de Temporada
                {config.active && config.theme !== "normal" && (
                  <span
                    className="text-xs uppercase tracking-widest px-2.5 py-1 rounded-full font-bold"
                    style={{
                      background: activeThemeMeta.glow,
                      color: activeThemeMeta.accent,
                      border: `1px solid ${activeThemeMeta.accent}40`,
                    }}
                  >
                    {activeThemeMeta.title} Activo
                  </span>
                )}
              </h1>
              <p className="text-sm text-white/50 mt-1">
                Personaliza la estética festiva y animaciones de la web y el módulo de pedidos online en tiempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50"
            style={{
              background: saveSuccess ? "#10b981" : "linear-gradient(135deg, #c81e22 0%, #a11417 100%)",
              color: "#fff",
              boxShadow: "0 4px 14px rgba(200, 30, 34, 0.35)",
            }}
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : saveSuccess ? (
              <CheckCircle2 size={18} />
            ) : (
              <Save size={18} />
            )}
            {saveSuccess ? "¡Guardado con éxito!" : "Guardar Cambios"}
          </button>
        </div>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Switch Maestro de Activación */}
      <div
        className="p-6 rounded-2xl border transition-all"
        style={{
          background: config.active
            ? "linear-gradient(135deg, rgba(200,30,34,0.12) 0%, rgba(20,20,22,0.95) 100%)"
            : "rgba(255,255,255,0.02)",
          borderColor: config.active ? "rgba(200,30,34,0.3)" : "rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-white">
                Modo Festivo en Vivo (Web & Pedidos)
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                  config.active ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                }`}
              >
                {config.active ? "ACTIVO" : "DESACTIVADO (NORMAL)"}
              </span>
            </div>
            <p className="text-sm text-white/50">
              Cuando está encendido, el tema seleccionado a continuación se mostrará en todos los dominios de Obento.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.active}
              onChange={(e) => {
                const next = { ...config, active: e.target.checked };
                setConfig(next);
                handleSave(next);
              }}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#c81e22]" />
          </label>
        </div>
      </div>

      {/* Selector de Temas Visuales */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers size={18} className="text-[#c9a84c]" />
            Colección de Temas Estacionales
          </h2>
          <span className="text-xs text-white/40">Haz clic en un tema para seleccionarlo</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {THEME_CARDS.map((theme) => {
            const isSelected = config.theme === theme.id;
            const Icon = theme.icon;

            return (
              <div
                key={theme.id}
                onClick={() => {
                  const next = { ...config, theme: theme.id };
                  setConfig(next);
                }}
                className={`group relative p-6 rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? "ring-2 ring-offset-2 ring-offset-[#080808]"
                    : "hover:border-white/20 hover:bg-white/[0.02]"
                }`}
                style={{
                  background: theme.bgGradient,
                  borderColor: isSelected ? theme.accent : "rgba(255,255,255,0.08)",
                  boxShadow: isSelected ? `0 8px 32px ${theme.glow}` : "none",
                }}
              >
                {/* Indicador de selección */}
                {isSelected && (
                  <div
                    className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: theme.accent,
                      color: "#080808",
                    }}
                  >
                    <CheckCircle2 size={13} />
                    Seleccionado
                  </div>
                )}

                <div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{
                      background: `rgba(255, 255, 255, 0.05)`,
                      color: theme.accent,
                      border: `1px solid ${theme.accent}30`,
                    }}
                  >
                    <Icon size={24} />
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-wide">{theme.title}</h3>
                  <p className="text-xs font-medium text-white/60 mb-3">{theme.subtitle}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{theme.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/40">Efecto visual:</span>
                  <span className="font-medium text-white/80">{theme.particles}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ajustes de Animación y Efectos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Intensidad de Animaciones */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#c9a84c]/10 text-[#c9a84c]">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Intensidad de Animaciones</h3>
              <p className="text-xs text-white/40">Controla la densidad y frecuencia de las partículas</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
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
                  className={`p-3 rounded-xl border text-left transition-all ${
                    active
                      ? "bg-[#c9a84c]/10 border-[#c9a84c] text-white"
                      : "bg-white/[0.02] border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-bold">{lvl.label}</div>
                  <div className="text-[10px] text-white/40 mt-1">{lvl.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5 text-xs text-white/50">
            <Info size={16} className="text-[#c9a84c] shrink-0 mt-0.5" />
            <span>
              Todas las animaciones usan un canvas nativo ultra-optimizado. Si el dispositivo del usuario tiene activado &quot;Reducir movimiento&quot;, se suspenderán automáticamente para máxima accesibilidad.
            </span>
          </div>
        </div>

        {/* Micro-Interacciones Específicas */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#c81e22]/10 text-[#c81e22]">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Micro-Interacciones & Extras</h3>
              <p className="text-xs text-white/40">Detalles interactivos al navegar o comprar</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} className="text-[#c9a84c]" />
                <div>
                  <div className="text-sm font-medium text-white">Celebración al Añadir al Carrito</div>
                  <div className="text-xs text-white/40">
                    Explosión temática de confeti (fantasmitas en Halloween, estrellas en Navidad)
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.cartCelebration}
                onChange={(e) => setConfig({ ...config, cartCelebration: e.target.checked })}
                className="w-4 h-4 rounded text-[#c81e22] focus:ring-[#c81e22]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-[#c81e22]" />
                <div>
                  <div className="text-sm font-medium text-white">Badges Flotantes Estacionales</div>
                  <div className="text-xs text-white/40">
                    Insignias de fiesta sutiles en la esquina superior o en platos destacados
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.floatingBadges}
                onChange={(e) => setConfig({ ...config, floatingBadges: e.target.checked })}
                className="w-4 h-4 rounded text-[#c81e22] focus:ring-[#c81e22]"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Programación Automática por Calendario */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Programación Automática (Calendario Anual)</h3>
            <p className="text-xs text-white/40">
              Activa los temas automáticamente en las fechas establecidas sin necesidad de encenderlos a mano.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            { key: "halloween", title: "Halloween", range: "24 Oct - 02 Nov" },
            { key: "navidad", title: "Navidad", range: "15 Dic - 28 Dic" },
            { key: "ano_nuevo", title: "Año Nuevo", range: "29 Dic - 02 Ene" },
            { key: "reyes", title: "Reyes Magos", range: "03 Ene - 07 Ene" },
          ].map((item) => {
            const sched = config.schedule?.[item.key as keyof typeof config.schedule] || {
              enabled: false,
              start: "",
              end: "",
            };
            return (
              <div
                key={item.key}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-white">{item.title}</div>
                  <div className="text-xs text-white/40 mt-1">{item.range}</div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-white/50">Auto-activar:</span>
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
                    className="w-4 h-4 rounded text-[#c81e22]"
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
