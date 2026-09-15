"use client";

import "@/lib/fetchBasePathPatch";
import "./globals.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, CalendarCheck, ShoppingBag, UtensilsCrossed,
  Images, Star, BarChart2, Settings, LogOut, Menu, Users, UserRound, X, ConciergeBell, Tag,
  Monitor, ExternalLink,
} from "lucide-react";
import { SessionProvider, useSession } from "@/lib/session";
import { AdminLanguageProvider, useAdminLanguage } from "@/lib/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

const GOLD = "#c9a84c";
const BG   = "#0a0a0f";
const SIDE = "#0e0d0b";

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
      padding: "1rem 1.125rem", borderRadius: 6,
      background: active ? "rgba(201,168,76,0.1)" : "transparent",
      color: active ? GOLD : "rgba(255,255,255,0.45)",
      fontSize: 18, textDecoration: "none", transition: "all 150ms",
      borderLeft: `3px solid ${active ? GOLD : "transparent"}`,
    }}>
      <Icon size={22} />{label}
    </Link>
  );
}

function ExternalNavLink({ href, label, icon: Icon }: {
  href: string; label: string; icon: React.ElementType;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      padding: "1rem 1.125rem", borderRadius: 6,
      background: "transparent", color: "rgba(255,255,255,0.45)",
      fontSize: 18, textDecoration: "none", transition: "all 150ms",
      borderLeft: "3px solid transparent",
    }}
      onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>
      <Icon size={22} />
      <span style={{ flex: 1 }}>{label}</span>
      <ExternalLink size={15} style={{ opacity: 0.5 }} />
    </a>
  );
}

function NavSeparator() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0.5rem 0.5rem" }} />;
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { role } = useSession();
  const { lang, setLang, tr } = useAdminLanguage();
  const a = tr.admin;

  const NAV_MAIN = [
    { href: "/",             label: a.overview,   icon: LayoutDashboard },
    { href: "/reservas",     label: a.reservas,   icon: CalendarCheck },
    { href: "/pedidos",      label: a.pedidos,    icon: ShoppingBag },
    { href: "/servicios",    label: a.servicios,  icon: ConciergeBell },
    { href: "/carta",        label: a.platos,     icon: UtensilsCrossed },
    { href: "/galeria",      label: a.galeria,    icon: Images },
    { href: "/reviews",      label: a.reviews,    icon: Star },
    { href: "/analytics",    label: a.analytics,  icon: BarChart2 },
    { href: "/leads",        label: a.leads,      icon: UserRound },
    { href: "/cupones",      label: a.cupones,    icon: Tag },
  ];

  const NAV_CONFIG = [
    { href: "/configuracion", label: a.configuracion, icon: Settings },
  ];

  const NAV_ADMIN = [
    { href: "/trabajadores", label: a.trabajadores, icon: Users },
  ];

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside style={{ width: 280, minWidth: 280, height: "100%", background: SIDE, borderRight: "1px solid rgba(201,168,76,0.08)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <Image src="/images/COYO-logo-2026-White.png" alt="Coyo" width={60} height={37} style={{ opacity: 0.7 }} />
          <p style={{ marginTop: "0.4rem", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.4)" }}>Admin</p>
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
            <ExternalNavLink href="https://coyoreservas.flowprintcorp.com" label={a.monitorReservas} icon={Monitor} />
            <ExternalNavLink href="https://coyotakeaway.flowprintcorp.com" label={a.monitorTakeaway} icon={Monitor} />
            <NavSeparator />
          </>
        )}
        {role === "admin" && NAV_ADMIN.map(item => <NavLink key={item.href} {...item} onClick={onClose} />)}
        {role === "admin" && NAV_CONFIG.map(item => <NavLink key={item.href} {...item} onClick={onClose} />)}
      </div>
      <div style={{ padding: "0.5rem 0.75rem 1rem", borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: "0.5rem", flexShrink: 0 }}>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "1rem 1.125rem", borderRadius: 6, border: "none", background: "transparent", color: "rgba(255,255,255,0.25)", fontSize: 18, cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(252,165,165,0.7)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
          <LogOut size={16} />{a.cerrarSesion}
        </button>
      </div>
    </aside>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const { tr, lang, setLang } = useAdminLanguage();
  const a = tr.admin;
  const [monitorStatus, setMonitorStatus] = useState<{ reservas: "online"|"offline"; takeaway: "online"|"offline" }>({ reservas: "offline", takeaway: "offline" });

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
  if (isMobile === null) return null;

  return (
    <div style={{ display: "flex", height: "100dvh", width: "100%", background: BG, color: "#fff", overflow: "hidden" }}>

      {!isMobile && <Sidebar />}

      {isMobile && drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40, backdropFilter: "blur(2px)" }} />
          <div style={{ position: "fixed", top: 0, left: 0, height: "100dvh", zIndex: 50, display: "flex" }}>
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Header desktop */}
        {!isMobile && (
          <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 2.5rem", height: 94, flexShrink: 0, background: SIDE, gap: "1.25rem" }}>
            {(["reservas", "takeaway"] as const).map(key => {
              const online = monitorStatus[key] === "online";
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.85rem", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${online ? "rgba(74,222,128,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: online ? "#4ade80" : "#ef4444", boxShadow: `0 0 6px ${online ? "#4ade80" : "#ef4444"}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: online ? "rgba(74,222,128,0.7)" : "rgba(239,68,68,0.6)", textTransform: "capitalize", letterSpacing: "0.08em" }}>{key}</span>
                </div>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.85rem", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 5px #4ade80", flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}>PostgreSQL</span>
              <code style={{ fontSize: 11, color: "rgba(74,222,128,0.5)", background: "rgba(255,255,255,0.04)", padding: "1px 4px", borderRadius: 3 }}>127.0.0.1:5435</code>
            </div>
            <span style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }}><LiveDate lang={lang} /></span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}><LiveClock /></span>
            <LanguageSelector variant="admin" lang={lang} setLang={setLang} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.85rem", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{a.sistemaActivo}</span>
            </div>
            <button onClick={handleLogout}
              title={a.cerrarSesion}
              style={{ display: "flex", alignItems: "center", padding: "6px 9px", borderRadius: 7, border: "none", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 150ms" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(252,165,165,0.1)"; e.currentTarget.style.color = "rgba(252,165,165,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}>
              <LogOut size={14} />
            </button>
          </header>
        )}

        {isMobile && (
          <header style={{ height: 56, borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.25rem", flexShrink: 0, background: SIDE }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
                <Menu size={22} />
              </button>
              <Image src="/images/COYO-logo-2026-White.png" alt="Coyo" width={48} height={30} style={{ opacity: 0.7 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "capitalize", lineHeight: 1 }}><LiveDate lang={lang} /></span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: "monospace", lineHeight: 1 }}><LiveClock /></span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
              <button onClick={handleLogout}
                style={{ display: "flex", alignItems: "center", padding: "6px 8px", borderRadius: 7, border: "none", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(252,165,165,0.1)"; e.currentTarget.style.color = "rgba(252,165,165,0.7)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}>
                <LogOut size={15} />
              </button>
            </div>
          </header>
        )}

        <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? "1.25rem 1rem" : "2rem 2rem", fontSize: 18, zoom: 1.2 } as React.CSSProperties}>
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
        <title>Coyo Admin</title>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Coyo Admin" />
        <meta name="theme-color" content="#0a0a0f" />
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
