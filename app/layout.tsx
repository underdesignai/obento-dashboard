"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, CalendarCheck, ShoppingBag, UtensilsCrossed,
  Images, Star, BarChart2, Settings, LogOut, Menu, Users, UserRound, X, ConciergeBell, Tag,
} from "lucide-react";
import { SessionProvider, useSession } from "@/lib/session";
import { AdminLanguageProvider, useAdminLanguage } from "@/lib/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

const GOLD = "#c9a84c";
const BG   = "#0a0a0f";
const SIDE = "#0e0d0b";

function NavLink({ href, label, icon: Icon, onClick }: {
  href: string; label: string; icon: React.ElementType; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
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

function Sidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const { role } = useSession();
  const { lang, setLang, tr } = useAdminLanguage();
  const a = tr.admin;

  const NAV_MAIN = [
    { href: "/admin",           label: a.overview,   icon: LayoutDashboard },
    { href: "/admin/reservas",  label: a.reservas,   icon: CalendarCheck },
    { href: "/admin/pedidos",   label: a.pedidos,    icon: ShoppingBag },
    { href: "/admin/servicios", label: a.servicios,  icon: ConciergeBell },
    { href: "/admin/carta",     label: a.platos,     icon: UtensilsCrossed },
    { href: "/admin/galeria",   label: a.galeria,    icon: Images },
    { href: "/admin/reviews",   label: a.reviews,    icon: Star },
    { href: "/admin/analytics", label: a.analytics,  icon: BarChart2 },
    { href: "/admin/leads",     label: a.leads,      icon: UserRound },
    { href: "/admin/cupones",   label: a.cupones,    icon: Tag },
  ];

  const NAV_CONFIG = [
    { href: "/admin/configuracion", label: a.configuracion, icon: Settings },
  ];

  const NAV_ADMIN = [
    { href: "/admin/trabajadores", label: a.trabajadores, icon: Users },
  ];

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <aside style={{ width: 280, minWidth: 280, height: "100%", background: SIDE, borderRight: "1px solid rgba(201,168,76,0.08)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem 1.25rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <Image src="/images/COYO-logo-2026-White.png" alt="Coyo" width={60} height={37} style={{ opacity: 0.7 }} />
          <p style={{ marginTop: "0.4rem", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(201,168,76,0.4)" }}>Admin</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
          <LanguageSelector variant="admin" lang={lang} setLang={setLang} />
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;
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

        {isMobile && (
          <header style={{ height: 56, borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.25rem", flexShrink: 0, background: SIDE }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
                <Menu size={22} />
              </button>
              <Image src="/images/COYO-logo-2026-White.png" alt="Coyo" width={48} height={30} style={{ opacity: 0.7 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Sistema activo</span>
            </div>
          </header>
        )}

        <main style={{ flex: 1, overflowY: "auto", padding: isMobile ? "1.25rem 1rem" : "2rem 2rem", fontSize: 18 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminLanguageProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </AdminLanguageProvider>
    </SessionProvider>
  );
}
