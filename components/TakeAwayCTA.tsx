"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useLanguage } from "@/lib/LanguageContext";

export default function TakeAwayCTA() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const { tr } = useLanguage();
  const ta = tr.takeawayCta;

  return (
    <>
    <section ref={ref} className="relative overflow-hidden" style={{ height: 520 }}>
      {/* Parallax image */}
      <motion.div style={{ y: imgY }} className="absolute inset-[-15%] w-[130%] h-[130%]">
        <Image
          src="/images/Sushi-Bar-Coyo-Restaurant-Sorenga-edited.webp"
          alt="Take Away Coyo Restaurant Oslo"
          fill
          className="img-cover"
          quality={85}
        />
      </motion.div>

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, rgba(10,8,5,0.93) 0%, rgba(10,8,5,0.6) 100%)" }}
      />

      {/* Gold line */}
      <div
        className="absolute left-0 right-0"
        style={{ top: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)" }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center" style={{ padding: "0 clamp(1.5rem, 8vw, 6rem)" }}>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="uppercase tracking-[0.3em] text-[13px] mb-5 font-sans"
          style={{ color: "#c9a84c" }}
        >
          {ta.label}
        </motion.p>

        <div className="overflow-hidden mb-4">
          <motion.h2
            initial={{ y: "100%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif font-bold text-white"
            style={{ fontSize: "clamp(2.2rem,5vw,4rem)", lineHeight: 1.05 }}
          >
            {ta.title1}
          </motion.h2>
        </div>
        <div className="overflow-hidden mb-10">
          <motion.h2
            initial={{ y: "100%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif font-bold italic"
            style={{
              fontSize: "clamp(2.2rem,5vw,4rem)",
              lineHeight: 1.05,
              background: "linear-gradient(90deg,#c9a84c,#f0d080,#c9a84c)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {ta.title2}
          </motion.h2>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="font-sans text-sm max-w-md"
          style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: "0 auto 2.5rem" }}
        >
          {ta.desc}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.38 }}
          style={{ display: "flex", flexDirection: "row", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}
        >
          <Link href="/take-away" className="btn-primary" style={{ width: 220, justifyContent: "center", whiteSpace: "nowrap" }}>
            <span>{ta.btn}</span>
          </Link>
        </motion.div>
      </div>
    </section>
    </>
  );
}
