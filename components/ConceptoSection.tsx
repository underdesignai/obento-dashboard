"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useLanguage } from "@/lib/LanguageContext";

const ease: [number,number,number,number] = [0.22, 1, 0.36, 1];

export default function ConceptoSection() {
  const ref = useRef<HTMLElement>(null);
  const { tr } = useLanguage();
  const c = tr.concepto;

  const stats = [
    { value: "10+",  label: c.stat0 },
    { value: "2",    label: c.stat1 },
    { value: "4.8★", label: c.stat2 },
  ];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.dispatchEvent(new CustomEvent("coyo:hero-ready"));
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const imgY       = useTransform(scrollYProgress, [0, 1],    ["8%",  "-8%"]);
  const imgOpacity = useTransform(scrollYProgress, [0, 0.18], [0,      1]);
  const imgX       = useTransform(scrollYProgress, [0, 0.18], [-40,    0]);
  const lineScale  = useTransform(scrollYProgress, [0.05, 0.3], [0, 1]);
  const badgeOpacity = useTransform(scrollYProgress, [0.15, 0.35], [0, 1]);
  const badgeY       = useTransform(scrollYProgress, [0.15, 0.35], [20, 0]);
  const dividerScale = useTransform(scrollYProgress, [0.1, 0.28], [0, 1]);
  const labelOpacity = useTransform(scrollYProgress, [0.12, 0.28], [0, 1]);
  const labelX       = useTransform(scrollYProgress, [0.12, 0.28], [-12, 0]);
  const title1Y      = useTransform(scrollYProgress, [0.16, 0.32], ["110%", "0%"]);
  const title2Y      = useTransform(scrollYProgress, [0.20, 0.36], ["110%", "0%"]);
  const quoteOpacity = useTransform(scrollYProgress, [0.28, 0.44], [0, 1]);
  const quoteX       = useTransform(scrollYProgress, [0.28, 0.44], [-16, 0]);
  const paraOpacity  = useTransform(scrollYProgress, [0.36, 0.50], [0, 1]);
  const stat0Opacity = useTransform(scrollYProgress, [0.44, 0.58], [0, 1]);
  const stat0Y       = useTransform(scrollYProgress, [0.44, 0.58], [16, 0]);
  const stat1Opacity = useTransform(scrollYProgress, [0.48, 0.62], [0, 1]);
  const stat1Y       = useTransform(scrollYProgress, [0.48, 0.62], [16, 0]);
  const stat2Opacity = useTransform(scrollYProgress, [0.52, 0.66], [0, 1]);
  const stat2Y       = useTransform(scrollYProgress, [0.52, 0.66], [16, 0]);
  const statOpacities = [stat0Opacity, stat1Opacity, stat2Opacity];
  const statYs        = [stat0Y, stat1Y, stat2Y];

  return (
    <section
      ref={ref}
      id="concepto"
      style={{ background: "#0a0a0f", overflow: "hidden", padding: "7rem 1.5rem" }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2,1fr)",
          gap: "5rem",
          alignItems: "center",
        }} className="grid-concepto">

          {/* ── Video ── */}
          <motion.div style={{ opacity: imgOpacity, x: imgX, position: "relative", height: 580, overflow: "hidden" }}>
            <video
              src="/videos/concepto.mp4"
              autoPlay muted loop playsInline
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />

            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,10,15,0.1), rgba(10,10,15,0.55))" }} />

            <motion.div
              style={{
                position: "absolute", left: 0, top: 0, bottom: 0, width: 2,
                background: "linear-gradient(to bottom, transparent, #c9a84c, transparent)",
                scaleY: lineScale, transformOrigin: "top",
              }}
            />

            <div style={{ position: "absolute", top: 0, right: 0 }}>
              <div style={{ width: 44, height: 1, background: "#c9a84c" }} />
              <div style={{ width: 1, height: 44, background: "#c9a84c", marginLeft: "auto" }} />
            </div>

            <motion.div
              style={{
                opacity: badgeOpacity, y: badgeY,
                position: "absolute", bottom: 32, left: 32,
                background: "rgba(10,10,15,0.88)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(201,168,76,0.25)",
                padding: "1.2rem 1.6rem",
              }}
            >
              <p className="font-serif" style={{ fontSize: "1.8rem", fontWeight: 700, color: "#c9a84c" }}>4.8 ★</p>
              <p className="font-sans" style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: "0.25rem" }}>
                {c.reviews}
              </p>
            </motion.div>
          </motion.div>

          {/* ── Texto ── */}
          <div>
            <motion.div style={{ scaleX: dividerScale, transformOrigin: "left", marginBottom: "1.5rem" }}>
              <div style={{ width: 40, height: 1, background: "linear-gradient(90deg,#c9a84c,transparent)" }} />
            </motion.div>

            <motion.p
              className="font-sans"
              style={{ opacity: labelOpacity, x: labelX, fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a84c", marginBottom: "2rem" }}
            >
              {c.label}
            </motion.p>

            <div style={{ marginBottom: "2.5rem" }}>
              <div style={{ overflow: "hidden", marginBottom: "0.2rem" }}>
                <motion.h2
                  className="font-serif"
                  style={{ y: title1Y, fontSize: "clamp(2.6rem,4.5vw,4rem)", fontWeight: 700, lineHeight: 1.0, color: "#fff", display: "block" }}
                >
                  {c.title1}
                </motion.h2>
              </div>
              <div style={{ overflow: "hidden" }}>
                <motion.h2
                  className="font-serif"
                  style={{
                    y: title2Y, display: "block", fontStyle: "italic",
                    fontSize: "clamp(2.6rem,4.5vw,4rem)", fontWeight: 700, lineHeight: 1.0,
                    background: "linear-gradient(90deg,#c9a84c,#f0d080,#c9a84c)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}
                >
                  {c.title2}
                </motion.h2>
              </div>
            </div>

            <motion.blockquote
              className="font-serif"
              style={{
                opacity: quoteOpacity, x: quoteX,
                fontSize: "1rem", fontStyle: "italic", lineHeight: 1.85,
                color: "rgba(255,255,255,0.5)",
                borderLeft: "2px solid rgba(201,168,76,0.35)",
                paddingLeft: "1.25rem",
                marginBottom: "1.5rem",
              }}
            >
              &ldquo;{c.quote}&rdquo;
            </motion.blockquote>

            <motion.p
              className="font-sans"
              style={{
                opacity: paraOpacity,
                fontSize: "0.85rem", lineHeight: 1.9, color: "rgba(255,255,255,0.3)", marginBottom: "3.5rem",
              }}
            >
              {c.para}
            </motion.p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.5rem", paddingTop: "2.5rem", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
              {stats.map(({ value, label }, i) => (
                <motion.div key={label} style={{ opacity: statOpacities[i], y: statYs[i] }}>
                  <p className="font-serif" style={{ fontSize: "clamp(1.6rem,2.5vw,2.2rem)", fontWeight: 700, color: "#c9a84c", marginBottom: "0.25rem" }}>
                    {value}
                  </p>
                  <p className="font-sans" style={{ fontSize: "0.75rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                    {label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
