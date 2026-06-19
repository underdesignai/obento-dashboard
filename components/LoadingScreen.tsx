"use client";

import { useEffect, useState } from "react";

const TacoSVG = () => (
  <svg viewBox="0 0 80 80" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 52 Q40 8 70 52" stroke="#c9a84c" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    <path d="M10 52 Q40 62 70 52" stroke="#c9a84c" strokeWidth="3" strokeLinecap="round" fill="rgba(201,168,76,0.08)"/>
    <path d="M18 50 Q25 38 32 46 Q36 36 44 44 Q50 34 58 48" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="30" cy="49" r="4" fill="rgba(252,100,100,0.8)"/>
    <circle cx="44" cy="47" r="3.5" fill="rgba(252,100,100,0.8)"/>
    <path d="M22 51 L35 44 L38 48 L52 43 L56 50" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const SushiSVG = () => (
  <svg viewBox="0 0 80 80" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="52" rx="26" ry="8" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
    <rect x="14" y="38" width="52" height="14" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
    <ellipse cx="40" cy="38" rx="26" ry="8" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    <rect x="14" y="43" width="52" height="6" fill="rgba(30,40,30,0.85)" stroke="rgba(60,80,60,0.5)" strokeWidth="1"/>
    <ellipse cx="40" cy="38" rx="18" ry="5.5" fill="rgba(251,146,60,0.85)" stroke="rgba(251,146,60,0.4)" strokeWidth="1"/>
    <ellipse cx="36" cy="36.5" rx="6" ry="2" fill="rgba(255,200,150,0.3)"/>
    <circle cx="34" cy="38" r="1.2" fill="rgba(255,255,255,0.5)"/>
    <circle cx="40" cy="37" r="1.2" fill="rgba(255,255,255,0.5)"/>
    <circle cx="46" cy="38.5" r="1.2" fill="rgba(255,255,255,0.5)"/>
  </svg>
);

export default function LoadingScreen() {
  const [icon, setIcon]       = useState<"taco" | "sushi">("taco");
  const [progress, setProgress] = useState(0);
  const [framesReady, setFramesReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [gone, setGone]       = useState(false);

  useEffect(() => {
    // Alterna icono cada 900ms mientras carga
    const interval = setInterval(() => {
      setIcon(prev => prev === "taco" ? "sushi" : "taco");
    }, 900);

    // Progreso real frame a frame
    const onProgress = (e: Event) => {
      const { loaded, total } = (e as CustomEvent).detail;
      setProgress(loaded / total);
    };
    window.addEventListener("coyo:frames-progress", onProgress);

    // Frames completamente listos
    const onReady = () => setFramesReady(true);
    window.addEventListener("coyo:frames-loaded", onReady);

    return () => {
      clearInterval(interval);
      window.removeEventListener("coyo:frames-progress", onProgress);
      window.removeEventListener("coyo:frames-loaded", onReady);
    };
  }, []);

  // Cuando frames listos: completa la barra y hace fade out
  useEffect(() => {
    if (!framesReady) return;
    const t1 = setTimeout(() => setProgress(1), 50);
    const t2 = setTimeout(() => setFadeOut(true), 400);
    const t3 = setTimeout(() => {
      setGone(true);
      window.dispatchEvent(new CustomEvent("coyo:ready"));
    }, 900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [framesReady]);

  if (gone) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0a0a0f",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "2rem",
      opacity: fadeOut ? 0 : 1,
      transition: fadeOut ? "opacity 0.5s ease" : "none",
      pointerEvents: fadeOut ? "none" : "all",
    }}>
      {/* Icono */}
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <div style={{
          position: "absolute", inset: 0,
          opacity: icon === "taco" ? 1 : 0,
          transform: icon === "taco" ? "scale(1) rotate(0deg)" : "scale(0.7) rotate(-15deg)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <TacoSVG />
        </div>
        <div style={{
          position: "absolute", inset: 0,
          opacity: icon === "sushi" ? 1 : 0,
          transform: icon === "sushi" ? "scale(1) rotate(0deg)" : "scale(0.7) rotate(15deg)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <SushiSVG />
        </div>
      </div>

      {/* Label dinámico */}
      <p style={{
        fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase",
        color: "rgba(201,168,76,0.6)", fontFamily: "var(--font-playfair, serif)",
        transition: "opacity 0.3s",
        margin: 0,
      }}>
        {icon === "sushi" ? "🍣 Sushi Bar" : "🌮 Mexican"}
      </p>

      {/* Barra de progreso */}
      <div style={{
        width: 120, height: 2,
        background: "rgba(201,168,76,0.12)",
        borderRadius: 2, overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${progress * 100}%`,
          background: "linear-gradient(90deg, #c9a84c, #f0d080)",
          borderRadius: 2,
          transition: framesReady ? "width 0.35s ease" : "width 0.1s linear",
          boxShadow: "0 0 8px rgba(201,168,76,0.5)",
        }} />
      </div>
    </div>
  );
}
