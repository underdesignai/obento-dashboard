"use client";

import "./globals.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, CalendarCheck, ShoppingBag, UtensilsCrossed,
  Images, BarChart2, Settings, LogOut, Menu, Users, UserRound, X, ConciergeBell, Tag,
  Monitor, ExternalLink, Globe, MessageSquare, MessageCircle,
} from "lucide-react";
import { SessionProvider, useSession } from "@/lib/session";
import { AdminLanguageProvider, useAdminLanguage } from "@/lib/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

const GOLD    = "#c9a84c";
const CRIMSON = "#c81e22";
const BG      = "#080808";
const SIDE    = "#0c0b0a";

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const t = () => setTime(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }));
    t(); const id = setInterval(t, 1000); return () => clearInterval(id);
  }, []);
  return <>{time}</>;
}

function LiveDate({ lang }: { lang: string }) {
  const [date, setDate] = useState("");
  useEffect(() => {
    const locale = lang === "en" ? "en-GB" : "es-ES";
    const t = () => setDate(new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }));
    t(); const id = setInterval(t, 60000); return () => clearInterval(id);
  }, [lang]);
  return <>{date}</>;
}

function NavLink({ href, label, icon: Icon, onClick }: {
  href: string; label: string; icon: React.ElementType; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link href={href} onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "0.85rem 1.125rem", borderRadius: 8,
      background: active ? "rgba(200,30,34,0.12)" : "transparent",
      color: active ? "#f3ede0" : "rgba(255,255,255,0.5)",
      fontSize: 15, textDecoration: "none", transition: "all 150ms",
      borderLeft: `3px solid ${active ? CRIMSON : "transparent"}`,
      fontWeight: active ? 600 : 400,
    }}>
      <Icon size={20} style={{ color: active ? CRIMSON : "inherit" }} />
      <span>{label}</span>
    </Link>
  );
}

function ExternalNavLink({ href, label, icon: Icon }: {
  href: string; label: string; icon: React.ElementType;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "0.85rem 1.125rem", borderRadius: 8,
      background: "transparent", color: "rgba(255,255,255,0.5)",
      fontSize: 15, textDecoration: "none", transition: "all 150ms",
      borderLeft: "3px solid transparent",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.color = GOLD;
        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = "rgba(255,255,255,0.5)";
        e.currentTarget.style.background = "transparent";
      }}>
      <Icon size={20} />
      <span style={{ flex: 1 }}>{label}</span>
      <ExternalLink size={14} style={{ opacity: 0.5 }} />
    </a>
  );
}

function NavSeparator() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0.5rem 0.5rem" }} />;
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { role } = useSession();
  const { lang, setLang, tr } = useAdminLanguage();
  const a = tr.admin;

  const NAV_MAIN = [
    { href: "/",             label: a.overview,   icon: LayoutDashboard },
    { href: "/pedidos",      label: a.pedidos,    icon: ShoppingBag },
    { href: "/carta",        label: a.platos,     icon: UtensilsCrossed },
    { href: "/analytics",    label: a.analytics,  icon: BarChart2 },
    { href: "/leads",        label: a.leads,      icon: UserRound },
    { href: "/cupones",      label: a.cupones,    icon: Tag },
    { href: "/bots-web",     label: "Bots Web",   icon: MessageSquare },
    { href: "/whatsapp-bot", label: "WhatsApp Bot", icon: MessageCircle },
  ];

  const NAV_CONFIG: { href: string; label: string; icon: any }[] = [];

  const NAV_ADMIN = [
    { href: "/configuracion", label: a.configuracion, icon: Settings },
  ];

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside style={{ width: 280, minWidth: 280, height: "100%", background: SIDE, borderRight: "1px solid rgba(200,30,34,0.15)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <img src="/images/logo-obento.png" alt="Obento" style={{ height: 40, width: "auto", objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.12em", color: "#f3ede0", lineHeight: 1.1 }}>OBENTO</div>
            <p style={{ marginTop: "0.25rem", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.22em", color: CRIMSON, fontWeight: 700 }}>Admin Panel</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
          {onClose && <LanguageSelector variant="admin" lang={lang} setLang={setLang} />}
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4 }}>
              <X size={20} />
            </button>
          )}
        </div>
      </div>
      <nav style={{ flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {NAV_MAIN.map(item => <NavLink key={item.href} {...item} onClick={onClose} />)}
      </nav>
      <div style={{ padding: "0.5rem 0.75rem 0", flexShrink: 0 }}>
        {role === "admin" && (
          <>
            <NavSeparator />
            <ExternalNavLink href={process.env.NEXT_PUBLIC_TAKEAWAY_URL || "http://localhost:3630"} label="Take Away" icon={Monitor} />
            <ExternalNavLink href={process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000"} label="Web" icon={Globe} />
            <NavSeparator />
          </>
        )}
        {NAV_ADMIN.map(item => <NavLink key={item.href} {...item} onClick={onClose} />)}
        {role === "admin" && NAV_CONFIG.map(item => <NavLink key={item.href} {...item} onClick={onClose} />)}
      </div>
      <div style={{ padding: "0.5rem 0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "0.5rem", flexShrink: 0 }}>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.85rem 1.125rem", borderRadius: 8, border: "none", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 15, cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(252,165,165,0.8)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
          <LogOut size={18} />{a.cerrarSesion}
        </button>
      </div>
    </aside>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const { tr, lang, setLang } = useAdminLanguage();
  const a = tr.admin;
  const [monitorStatus, setMonitorStatus] = useState<{ takeaway: "online"|"offline"; postgres: "online"|"offline" }>({ takeaway: "offline", postgres: "offline" });

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/login");
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const poll = () => fetch("/api/admin/heartbeat").then(r => r.json()).then(d => setMonitorStatus(d)).catch(() => {});
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  if (pathname === "/login") return <>{children}</>;

  return (
    <div style={{ display: "flex", height: "100dvh", width: "100%", background: BG, color: "#fff", overflow: "hidden" }}>

      {!isMobile && <Sidebar />}

      {isMobile && drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 40, backdropFilter: "blur(4px)" }} />
          <div style={{ position: "fixed", top: 0, left: 0, height: "100dvh", zIndex: 50, display: "flex" }}>
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Header desktop */}
        {!isMobile && (
          <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 2.5rem", height: 74, flexShrink: 0, background: SIDE, gap: "1.25rem" }}>
            {/* Monitor Takeaway badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.4rem 0.85rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${monitorStatus.takeaway === "online" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: monitorStatus.takeaway === "online" ? "#4ade80" : "#ef4444", boxShadow: `0 0 8px ${monitorStatus.takeaway === "online" ? "#4ade80" : "#ef4444"}`, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: monitorStatus.takeaway === "online" ? "#4ade80" : "rgba(239,68,68,0.8)", letterSpacing: "0.05em" }}>Takeaway KDS</span>
            </div>

            {/* PostgreSQL badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.4rem 0.85rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${monitorStatus.postgres === "online" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: monitorStatus.postgres === "online" ? "#4ade80" : "#ef4444", boxShadow: `0 0 8px ${monitorStatus.postgres === "online" ? "#4ade80" : "#ef4444"}`, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: monitorStatus.postgres === "online" ? "#4ade80" : "rgba(239,68,68,0.8)", letterSpacing: "0.08em" }}>obento_db</span>
            </div>

            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", textTransform: "capitalize" }}><LiveDate lang={lang} /></span>
            <span style={{ fontSize: 15, fontWeight: 700, color: GOLD, fontFamily: "monospace" }}><LiveClock /></span>
            <LanguageSelector variant="admin" lang={lang} setLang={setLang} />
            <button onClick={handleLogout}
              title={a.cerrarSesion}
              style={{ display: "flex", alignItems: "center", padding: "8px 10px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", cursor: "pointer", transition: "all 150ms" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,30,34,0.15)"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}>
              <LogOut size={16} />
            </button>
          </header>
        )}

        {isMobile && (
          <header style={{ height: 56, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.25rem", flexShrink: 0, background: SIDE }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
                <Menu size={22} />
              </button>
              <img src="/images/logo-obento.png" alt="Obento" style={{ height: 28, width: "auto", objectFit: "contain" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "capitalize", lineHeight: 1 }}><LiveDate lang={lang} /></span>
                <span style={{ fontSize: 14, fontWeight: 700, color: GOLD, fontFamily: "monospace", lineHeight: 1.1 }}><LiveClock /></span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
              <button onClick={handleLogout}
                style={{ display: "flex", alignItems: "center", padding: "6px 8px", borderRadius: 7, border: "none", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(200,30,34,0.15)"; e.currentTarget.style.color = "#f87171"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}>
                <LogOut size={16} />
              </button>
            </div>
          </header>
        )}

        <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? "1.25rem 1rem" : "2rem 2.5rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <title>OBENTO · Panel de Administración</title>
        <link rel="icon" type="image/png" href="/images/logo-obento.png" />
        <link rel="apple-touch-icon" href="/images/logo-obento.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Zen+Kaku+Gothic+New:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
        <meta name="description" content="Panel de administración y gestión para el restaurante Obento Japanese Food." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="OBENTO · Panel de Administración" />
        <meta property="og:description" content="Panel de administración y gestión para el restaurante Obento Japanese Food." />
        <meta property="og:image" content="https://dashboardobento.flowprintcorp.com/images/logo-obento.png" />
        <meta property="og:url" content="https://dashboardobento.flowprintcorp.com/" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="OBENTO · Panel de Administración" />
        <meta name="twitter:description" content="Panel de administración y gestión para el restaurante Obento Japanese Food." />
        <meta name="twitter:image" content="https://dashboardobento.flowprintcorp.com/images/logo-obento.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Obento Admin" />
        <meta name="theme-color" content="#080808" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <SessionProvider>
          <AdminLanguageProvider>
            <AdminLayoutInner>{children}</AdminLayoutInner>
          </AdminLanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
