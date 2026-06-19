"use client";
import { useEffect, useState } from "react";
import { ShoppingBag, Menu, X, BookOpen, Images, UtensilsCrossed, PhoneCall, Sparkles } from "lucide-react";
import { useCartStore } from "@/lib/store";
import Link from "next/link";
import Image from "next/image";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/LanguageContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items, openCart } = useCartStore();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const { tr } = useLanguage();
  const n = tr.nav;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const links = [
    { href: "/#concepto",      label: n.concepto },
    { href: "/#menu",          label: n.menu },
    { href: "/#galeria",       label: n.galeria },
    { href: "/#reservas",      label: n.reservar },
    { href: "/cocinayaprende", label: n.cocinayaprende },
    { href: "/catering",       label: n.catering },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? "bg-night/90 backdrop-blur-xl border-b border-white/5 shadow-2xl"
        : "bg-transparent"
    }`}>
      <div className="px-6 lg:px-10 flex items-center h-20 relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0 z-10" style={{ paddingLeft: "40px" }}>
          <Image
            src="/images/COYO-logo-2026-White.png"
            alt="Coyo Restaurant"
            width={72}
            height={44}
            className="opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            priority
          />
          <span className="hidden lg:block text-[9px] uppercase tracking-[0.2em] font-sans leading-tight"
            style={{ color: "rgba(255,255,255,0.25)" }}>
            Mexican Food<br />&amp; Sushi Bar
          </span>
        </Link>

        {/* Menú desktop — centrado */}
        <div className="hidden md:flex absolute inset-x-0 justify-center pointer-events-none z-10">
          <nav className="pointer-events-auto flex items-center gap-8">
            {[{ href: "/#inicio", label: n.inicio }, ...links].map((l) => (
              <Link key={l.href} href={l.href}
                className="group relative text-[11px] uppercase tracking-[0.18em] font-sans text-white/50 hover:text-white transition-colors duration-200 cursor-pointer pb-1">
                {l.label}
                <span className="absolute bottom-0 left-0 right-0 h-px bg-[#c9a84c] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 absolute right-6 lg:right-10 z-10">
          {/* Language selector — left of Take Away */}
          <LanguageSelector variant="navbar" />

          <Link href="/take-away" className="btn-outline btn-outline--nav text-xs py-2.5 px-5">
            <span>{n.takeaway}</span>
          </Link>

          <button onClick={openCart}
            className="relative flex items-center justify-center w-10 h-10 text-white/70 hover:text-white transition-colors duration-200 group">
            <ShoppingBag size={20} className="group-hover:scale-110 transition-transform duration-200" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gold text-night text-[10px] font-bold w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center leading-none px-1">
                {count}
              </span>
            )}
          </button>

          <button onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden text-white/70 hover:text-white transition-all duration-300 w-10 h-10 flex items-center justify-center ${mobileOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-[60] transition-opacity duration-500 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile sidebar */}
      <div className={`md:hidden fixed z-[70] flex flex-col overflow-y-auto transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100dvh", background: "linear-gradient(170deg, #111009 0%, #1c1a12 50%, #0a0905 100%)" }}>

        <div className="absolute inset-y-0 right-0 w-px"
          style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(201,168,76,0.25) 30%, rgba(201,168,76,0.1) 70%, transparent 100%)" }} />

        {/* Cabecera mobile */}
        <div className="flex items-start justify-between px-8 pt-12 pb-8">
          <div>
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Image
                src="/images/COYO-logo-2026-White.png"
                alt="Coyo Restaurant"
                width={68}
                height={42}
                className="opacity-95"
              />
            </Link>
            <p className="mt-3 text-[9px] uppercase tracking-[0.3em] font-sans"
              style={{ color: "rgba(201,168,76,0.45)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Mexican Food &amp; Sushi Bar
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.25em] font-sans"
              style={{ color: "rgba(255,255,255,0.15)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Sørenga · Oslo
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector variant="navbar" />
            <button onClick={() => setMobileOpen(false)}
              className="cursor-pointer transition-all duration-200 flex items-center justify-center"
              style={{ width: 36, height: 36, border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)", borderRadius: "2px" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="mx-8 mb-8" style={{ height: 1, background: "linear-gradient(to right, rgba(201,168,76,0.5), rgba(201,168,76,0.05), transparent)" }} />

        {/* Links mobile */}
        <nav className="flex flex-col flex-1 px-6">
          {[
            { href: "/#inicio",          label: n.inicio,          sub: n.sub_inicio,   icon: <BookOpen size={14} /> },
            { href: "/#concepto",      label: n.concepto,        sub: n.sub_concepto, icon: <Sparkles size={14} /> },
            { href: "/#menu",          label: n.menu,            sub: n.sub_menu,     icon: <BookOpen size={14} /> },
            { href: "/#galeria",       label: n.galeria,         sub: n.sub_galeria,  icon: <Images size={14} /> },
            { href: "/#reservas",      label: n.reservar,        sub: n.sub_reservar, icon: <PhoneCall size={14} /> },
            { href: "/take-away",      label: n.takeaway,        sub: n.sub_takeaway, icon: <UtensilsCrossed size={14} /> },
            { href: "/cocinayaprende", label: n.cocinayaprende,  sub: n.sub_cocina,   icon: <Sparkles size={14} /> },
            { href: "/catering",       label: n.catering,        sub: n.sub_catering, icon: <UtensilsCrossed size={14} /> },
          ].map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="group flex items-center gap-5 cursor-pointer relative"
              style={{ padding: "16px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="shrink-0 transition-all duration-300" style={{ color: "rgba(201,168,76,0.4)" }}>
                {l.icon}
              </span>
              <div className="flex-1">
                <p className="text-base leading-none mb-1 transition-colors duration-300"
                  style={{ color: "rgba(255,255,255,0.75)", fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {l.label}
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] transition-colors duration-300"
                  style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  {l.sub}
                </p>
              </div>
              <span className="text-[10px] font-sans opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-4px] group-hover:translate-x-0"
                style={{ color: "#c9a84c" }}>
                →
              </span>
            </Link>
          ))}
        </nav>

        <div className="px-8 pt-8 pb-10">
          <div className="mb-6 h-px" style={{ background: "linear-gradient(to right, rgba(201,168,76,0.5), rgba(201,168,76,0.05), transparent)" }} />
          <Link href="/take-away" onClick={() => setMobileOpen(false)}
            className="btn-primary w-full justify-center">
            <span>{n.takeaway}</span>
          </Link>
        </div>
      </div>

    </nav>
  );
}
