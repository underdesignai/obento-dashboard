"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useScroll, useTransform, useMotionValueEvent, motion } from "motion/react";

const TOTAL_FRAMES = 154;
const FRAME_END    = 0.6; // 0→60% frames
const TEXT_END     = 0.85; // 60→85% texto, 85→100% estático
const FRAME_PATH   = (n: number) =>
  `/frames/frame_${String(n).padStart(4, "0")}.jpg`;

interface ScrollVideoHeroProps {
  subtitle?: string;
  heroLine1?: string;
  heroLine2?: string;
  cta?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
  scrollHeight?: string;
  children?: React.ReactNode;
  overlayContent?: React.ReactNode;
}

export default function ScrollVideoHero({
  subtitle,
  heroLine1 = "Donde México",
  heroLine2 = "abraza al Japón",
  cta,
  ctaSecondary,
  scrollHeight = "300vh",
  children,
  overlayContent,
}: ScrollVideoHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const frames       = useRef<HTMLImageElement[]>([]);
  const currentFrame = useRef(0);
  const [loaded, setLoaded] = useState(false);

  // Precarga todos los frames
  useEffect(() => {
    let loadedCount = 0;
    const imgs: HTMLImageElement[] = [];
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new window.Image();
      img.src = FRAME_PATH(i);
      const onDone = () => {
        loadedCount++;
        window.dispatchEvent(new CustomEvent("coyo:frames-progress", { detail: { loaded: loadedCount, total: TOTAL_FRAMES } }));
        if (loadedCount === TOTAL_FRAMES) {
          frames.current = imgs;
          renderFrame(0);
          setLoaded(true);
          window.dispatchEvent(new CustomEvent("coyo:frames-loaded"));
        }
      };
      img.onload = onDone;
      img.onerror = onDone;
      imgs[i - 1] = img;
    }
  }, []);

  function renderFrame(index: number) {
    const canvas = canvasRef.current;
    const img    = frames.current[index];
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    const cw = canvas.width  = parent ? parent.clientWidth  : window.innerWidth;
    const ch = canvas.height = parent ? parent.clientHeight : window.innerHeight;
    const iw = img.naturalWidth  || 1920;
    const ih = img.naturalHeight || 1080;
    const scale = Math.max(cw / iw, ch / ih);
    ctx.drawImage(img, (cw - iw * scale) / 2, (ch - ih * scale) / 2, iw * scale, ih * scale);
  }

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Fase 1: avanza frames 0→80% del scroll
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const frameProgress = Math.min(1, progress / FRAME_END);
    const idx = Math.min(TOTAL_FRAMES - 1, Math.floor(frameProgress * TOTAL_FRAMES));
    if (idx !== currentFrame.current) {
      currentFrame.current = idx;
      renderFrame(idx);
    }
  });

  // Fase 2 (60→85%): texto con scroll. Fase 3 (85→100%): estático.
  const textProgress = useTransform(scrollYProgress, [FRAME_END, TEXT_END], [0, 1]);

  const overlayOpacity = useTransform(textProgress, [0, 0.2], [0, 1]);
  const logoOpacity    = useTransform(textProgress, [0,   0.3], [0, 1]);
  const logoY          = useTransform(textProgress, [0,   0.3], [20, 0]);
  const line1Y         = useTransform(textProgress, [0.1, 0.5], ["100%", "0%"]);
  const line2Y         = useTransform(textProgress, [0.2, 0.6], ["100%", "0%"]);
  const subOpacity     = useTransform(textProgress, [0.4, 0.8], [0, 1]);
  const subY           = useTransform(textProgress, [0.4, 0.8], [20, 0]);
  const ctaOpacity     = useTransform(textProgress, [0.6, 1.0], [0, 1]);
  const ctaY           = useTransform(textProgress, [0.6, 1.0], [16, 0]);

  return (
    <div id="inicio" ref={containerRef} style={{ height: scrollHeight, position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>

        {/* Canvas */}
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

        {/* Overlay — fade con scroll */}
        <motion.div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg,rgba(10,8,5,0.35) 0%,rgba(10,8,5,0.10) 35%,rgba(10,8,5,0.65) 78%,rgba(10,8,5,0.97) 100%)",
          opacity: overlayOpacity,
          display: "flex", alignItems: "center", justifyContent: "flex-start",
          pointerEvents: "none",
        }}>
          <div style={{ textAlign: "left", maxWidth: 620, padding: "2rem", color: "#fff", marginLeft: "6vw" }}>

            {overlayContent ? (
              /* Contenido personalizado con fade-in */
              <motion.div style={{ opacity: subOpacity, y: subY }}>
                {overlayContent}
              </motion.div>
            ) : (
              <>
                {/* Logo */}
                <motion.div style={{ display: "flex", marginBottom: "2rem", opacity: logoOpacity, y: logoY }}>
                  <Image src="/images/COYO-logo-2026-White.png" alt="Coyo" width={100} height={61} style={{ opacity: 0.9 }} />
                </motion.div>

                {/* Título línea a línea */}
                <h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(2.8rem,7.5vw,6.5rem)", fontWeight: 700, lineHeight: 1.02, marginBottom: "1.2rem" }}>
                  <div style={{ overflow: "hidden" }}>
                    <motion.span style={{ display: "block", y: line1Y }}>{heroLine1}</motion.span>
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <motion.em style={{
                      display: "block", fontStyle: "italic",
                      background: "linear-gradient(90deg,#c9a84c,#f0d080,#c9a84c)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                      y: line2Y,
                    }}>{heroLine2}</motion.em>
                  </div>
                </h1>

                {/* Subtítulo */}
                {subtitle && (
                  <motion.p style={{
                    fontSize: "clamp(0.95rem,1.8vw,1.25rem)", color: "rgba(255,255,255,0.65)",
                    marginBottom: "2.2rem", fontWeight: 300, lineHeight: 1.6, fontFamily: "system-ui,sans-serif",
                    opacity: subOpacity, y: subY,
                  }}>{subtitle}</motion.p>
                )}

                {/* CTAs */}
                <motion.div style={{ display: "flex", flexDirection: "column", gap: "1rem", opacity: ctaOpacity, y: ctaY, pointerEvents: "auto", width: "fit-content" }}>
                  {cta && (
                    cta.href === "#reservar"
                      ? <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => window.dispatchEvent(new CustomEvent("coyo:open-reserva"))}><span>{cta.label}</span></button>
                      : <a href={cta.href} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}><span>{cta.label}</span></a>
                  )}
                  {ctaSecondary && <Link href={ctaSecondary.href} className="btn-outline" style={{ textAlign: "center", justifyContent: "center" }}>{ctaSecondary.label}</Link>}
                </motion.div>
              </>
            )}
          </div>
        </motion.div>

        {/* Scroll indicator — desaparece al entrar en fase 2 */}
        <motion.div
          style={{ position: "absolute", bottom: "2.5rem", left: "50%", translateX: "-50%", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontFamily: "system-ui,sans-serif",
            opacity: useTransform(scrollYProgress, [0, FRAME_END * 0.8], [1, 0]),
          }}>
          Scroll
          <motion.div
            animate={{ scaleY: [0.5, 1, 0.5], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: 1, height: 36, background: "linear-gradient(to bottom,rgba(201,168,76,0.6),transparent)", transformOrigin: "top" }} />
        </motion.div>
      </div>

      {children}
    </div>
  );
}
