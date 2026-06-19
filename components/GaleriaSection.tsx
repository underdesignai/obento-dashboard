"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

type Foto = { id: number; url: string; alt?: string; label?: string; activo: boolean; orden: number };

const FALLBACK: Foto[] = [
  { id: 1, url: "/images/Sushi-Bar-Coyo-Restaurant-Sorenga-edited.webp", alt: "Sushi Bar Coyo",  label: "Sushi Bar",  activo: true, orden: 0 },
  { id: 2, url: "/images/Coyo-Restaurant-menu.webp",                      alt: "Menú Coyo",      label: "Menú",       activo: true, orden: 1 },
  { id: 3, url: "/images/Happenings.webp",                                 alt: "Happenings",     label: "Events",     activo: true, orden: 2 },
  { id: 4, url: "/images/Fruktbolle.jpg",                                  alt: "Postres",        label: "Postres",    activo: true, orden: 3 },
  { id: 5, url: "/images/unnamed-737x1024.jpeg",                           alt: "Coctelería",     label: "Cócteles",   activo: true, orden: 4 },
  { id: 6, url: "/images/Sushi-Bar-Coyo-Restaurant-Sorenga.webp",         alt: "Restaurante",    label: "Espacio",    activo: true, orden: 5 },
];

// Grid layout: alternates cols for visual rhythm
const GRID_COLS = [
  "md:col-span-7", "md:col-span-5", "md:col-span-5",
  "md:col-span-4", "md:col-span-4", "md:col-span-4",
  "md:col-span-6", "md:col-span-6", "md:col-span-12",
];
const GRID_ROWS = [
  "md:row-span-2", "md:row-span-1", "md:row-span-1",
  "md:row-span-1", "md:row-span-1", "md:row-span-1",
  "md:row-span-1", "md:row-span-1", "md:row-span-1",
];

export default function GaleriaSection() {
  const { tr } = useLanguage();
  const g = tr.galeria;
  const [fotos, setFotos]     = useState<Foto[]>(FALLBACK);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/galeria")
      .then(r => r.ok ? r.json() : null)
      .then((data: Foto[] | null) => {
        if (data && data.length > 0) {
          setFotos(data.filter(f => f.activo).sort((a, b) => a.orden - b.orden));
        }
      })
      .catch(() => {}); // fallback silencioso
  }, []);

  const prev = () => { setDirection(-1); setLightbox(i => i !== null ? (i - 1 + fotos.length) % fotos.length : null); };
  const next = () => { setDirection(1);  setLightbox(i => i !== null ? (i + 1) % fotos.length : null); };

  return (
    <>
    <section id="galeria" className="section-pad" style={{ background: "#060608" }}>
      <div className="section-inner">

        {/* Header */}
        <div className="text-center mb-20">
          <div className="divider-gold mx-auto" style={{ background: "linear-gradient(90deg, transparent, #c9a84c, transparent)" }} />
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="uppercase tracking-[0.3em] text-[13px] mb-4 font-sans"
            style={{ color: "#c9a84c" }}
          >
            {g.espacioLabel}
          </motion.p>
          <div className="overflow-hidden">
            <motion.h2
              initial={{ y: "100%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
              className="font-serif font-bold text-white"
              style={{ fontSize: "clamp(2.2rem,4vw,3.5rem)" }}
            >
              {g.atmosTitle}
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="font-sans text-sm mt-4"
            style={{ color: "rgba(255,255,255,0.28)", lineHeight: 1.7, maxWidth: "36rem", margin: "1rem auto 3rem", textAlign: "center", display: "block" }}
          >
            {g.atmosDesc}
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-12 gap-3" style={{ gridAutoRows: "200px" }}>
          {fotos.map((foto, i) => (
            <motion.div
              key={foto.id}
              onClick={() => setLightbox(i)}
              className={`${GRID_COLS[i % GRID_COLS.length]} ${GRID_ROWS[i % GRID_ROWS.length]} relative overflow-hidden group cursor-pointer`}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.07, ease: [0.25, 1, 0.5, 1] as [number,number,number,number] }}
              style={{ border: "1px solid rgba(201,168,76,0.07)" }}
            >
              <Image
                src={foto.url}
                alt={foto.alt ?? foto.label ?? "Coyo Restaurant"}
                fill
                sizes="(max-width:768px) 100vw, 50vw"
                className="img-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized={foto.url.startsWith("http")}
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(to top, rgba(10,8,5,0.88) 0%, transparent 50%)" }}
              />
              {/* Label */}
              {(foto.label || foto.alt) && (
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400">
                  <p className="text-white font-serif text-lg leading-tight">{foto.label || foto.alt}</p>
                </div>
              )}
              {/* Corner gold */}
              <div className="absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div style={{ width: 32, height: 1, background: "#c9a84c" }} />
                <div style={{ width: 1, height: 32, background: "#c9a84c" }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Lightbox */}
    {lightbox !== null && (
      <div className="fixed inset-0 z-[90] flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.95)", backdropFilter: "blur(8px)" }}
        onClick={() => setLightbox(null)}
        onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
          touchStartX.current = null;
        }}>

        <div className="relative w-full h-full max-w-5xl max-h-[85vh] mx-6 overflow-hidden"
          onClick={e => e.stopPropagation()}>
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={lightbox}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit:  (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              style={{ position: "absolute", inset: 0 }}
            >
              <Image
                src={fotos[lightbox].url}
                alt={fotos[lightbox].alt ?? fotos[lightbox].label ?? "Coyo"}
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized={fotos[lightbox].url.startsWith("http")}
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-0 left-0 right-0 text-center pb-4 z-10">
            {fotos[lightbox].label && (
              <p className="font-serif text-white text-xl">{fotos[lightbox].label}</p>
            )}
          </div>
        </div>

        <button onClick={() => setLightbox(null)}
          className="absolute top-6 right-6 cursor-pointer transition-colors duration-200 flex items-center justify-center"
          style={{ width: 40, height: 40, border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", borderRadius: "2px" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
          <X size={16} />
        </button>

        <button onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 flex items-center justify-center"
          style={{ width: 44, height: 44, border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", borderRadius: "2px" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#c9a84c"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}>
          <ChevronLeft size={20} />
        </button>

        <button onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 flex items-center justify-center"
          style={{ width: 44, height: 44, border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", borderRadius: "2px" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#c9a84c"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}>
          <ChevronRight size={20} />
        </button>

        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-sans text-[11px] uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.25)" }}>
          {lightbox + 1} / {fotos.length}
        </p>
      </div>
    )}
    </>
  );
}
