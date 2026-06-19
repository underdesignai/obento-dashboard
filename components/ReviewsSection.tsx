"use client";

import { motion } from "motion/react";
import { useLanguage } from "@/lib/LanguageContext";

export default function ReviewsSection() {
  const { tr } = useLanguage();
  const rv = tr.reviews;

  return (
    <section className="section-pad" style={{ background: "#0a0a0f" }}>
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
            {rv.label}
          </motion.p>
          <div className="overflow-hidden">
            <motion.h2
              initial={{ y: "100%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
              className="font-serif font-bold text-white"
              style={{ fontSize: "clamp(2rem,3.5vw,3rem)" }}
            >
              {rv.title1} {rv.title2}
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3"
            style={{ marginTop: "1.25rem" }}
          >
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => <span key={i} style={{ color: "#c9a84c" }}>★</span>)}
            </div>
            <span className="font-sans text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
              4.8 · 338+ reviews Google &amp; TripAdvisor
            </span>
          </motion.div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rv.reviews.map((r: { text: string; author: string; role: string }, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(201,168,76,0.1)",
                padding: "2.5rem",
                position: "relative",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: "40%", height: 1, background: "linear-gradient(90deg, #c9a84c, transparent)" }} />

              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, s) => <span key={s} style={{ color: "#c9a84c", fontSize: "0.85rem" }}>★</span>)}
              </div>

              <p className="font-serif italic leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.62)", fontSize: "1.05rem", lineHeight: 1.8 }}>
                &ldquo;{r.text}&rdquo;
              </p>

              <div className="flex items-center gap-4 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center justify-center font-serif font-bold text-sm flex-shrink-0"
                  style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)", color: "#c9a84c" }}>
                  {r.author[0]}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{r.author}</p>
                  <p className="text-[13px] uppercase tracking-wider mt-0.5 font-sans" style={{ color: "rgba(255,255,255,0.22)" }}>{r.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
