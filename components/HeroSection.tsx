"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import ReservaModal from "@/components/ReservaModal";

const ease = [0.25, 0.1, 0.25, 1] as const;

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay, ease },
  },
});

const revealLine = (delay = 0) => ({
  hidden: { opacity: 0, y: "100%" },
  show: {
    opacity: 1,
    y: "0%",
    transition: { duration: 1.0, delay, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] },
  },
});

export default function HeroSection() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [reservaOpen, setReservaOpen] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <>
    <section ref={ref} className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">

      {/* Background — Ken Burns zoom por scroll */}
      <motion.div
        className="absolute inset-0"
        style={{ scale: useTransform(scrollYProgress, [0, 1], [1, 1.08]) }}
      >
        <Image
          src="/images/Sushi-Bar-Coyo-Restaurant-Sorenga.webp"
          alt="Coyo Restaurant Sushi Bar Oslo"
          fill
          className="img-cover"
          priority
          quality={90}
          onLoad={() => window.dispatchEvent(new CustomEvent("coyo:frames-loaded"))}
        />
      </motion.div>

      {/* Overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,15,0.5) 0%, rgba(10,10,15,0.3) 40%, rgba(10,10,15,0.75) 80%, rgba(10,10,15,0.97) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(10,10,15,0.35) 100%)",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        style={{ y: contentY, opacity: contentOpacity }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      >
        {/* Logo */}
        <motion.div
          className="flex justify-center mb-10"
          variants={fadeUp(0)}
        >
          <Image
            src="/images/COYO-logo-2026-White.png"
            alt="Coyo"
            width={110}
            height={67}
            className="opacity-90"
          />
        </motion.div>

        {/* Headline — line by line clip reveal */}
        <h1 className="font-serif text-6xl md:text-8xl lg:text-[100px] font-bold text-white leading-[1.0] mb-6">
          <div className="overflow-hidden">
            <motion.span className="block" variants={revealLine(0.15)}>
              Donde México
            </motion.span>
          </div>
          <div className="overflow-hidden">
            <motion.em
              className="text-gold-gradient not-italic block"
              variants={revealLine(0.3)}
            >
              abraza al Japón
            </motion.em>
          </div>
        </h1>

        {/* Subtitle */}
        <motion.p
          className="text-white/60 text-lg md:text-xl max-w-xl mx-auto mb-10 font-light leading-relaxed"
          variants={fadeUp(0.55)}
        >
          Cocina mexicana auténtica y sushi bar de autor a orillas del Oslofjord, Sørenga Oslo.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          variants={fadeUp(0.7)}
        >
          <button onClick={() => setReservaOpen(true)} className="btn-primary w-full sm:w-64 justify-center">
            <span>Reservar Mesa</span>
          </button>
          <Link href="/take-away" className="btn-outline w-full sm:w-64 text-center justify-center">
            Pedir Take Away
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        <motion.div
          className="w-px h-14"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.6), transparent)" }}
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
    <ReservaModal open={reservaOpen} onClose={() => setReservaOpen(false)} />
    </>
  );
}
