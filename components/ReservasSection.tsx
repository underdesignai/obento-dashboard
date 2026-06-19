"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import ReservaModal from "@/components/ReservaModal";
import { useLanguage } from "@/lib/LanguageContext";

export default function ReservasSection() {
  const [reservaOpen, setReservaOpen] = useState(false);
  const { tr } = useLanguage();
  const r = tr.reservas;

  useEffect(() => {
    const open = () => setReservaOpen(true);
    window.addEventListener("coyo:open-reserva", open);
    return () => window.removeEventListener("coyo:open-reserva", open);
  }, []);

  return (
    <>
    <section id="reservas" className="section-pad" style={{ background: "#060608" }}>
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
            {r.label}
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
              {r.title1} {r.title2}
            </motion.h2>
          </div>
        </div>

        {/* Two panels */}
        <div className="grid md:grid-cols-2 gap-px" style={{ background: "rgba(201,168,76,0.08)", borderRadius: 2 }}>

          {/* Horarios */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ background: "#060608", padding: "clamp(2rem, 5vw, 4rem)" }}
          >
            <p className="uppercase tracking-[0.25em] text-[13px] mb-10 font-sans flex items-center gap-3" style={{ color: "rgba(201,168,76,0.5)" }}>
              <span style={{ display: "inline-block", width: 20, height: 1, background: "rgba(201,168,76,0.4)" }} />
              {r.horario}
            </p>
            {r.horarios.map(({ day, time }: { day: string; time: string }, i: number) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex justify-between items-center py-5"
                style={{ borderBottom: "1px solid rgba(201,168,76,0.07)" }}
              >
                <span className="font-sans text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>{day}</span>
                <span className="font-serif font-medium" style={{ color: "#c9a84c" }}>{time}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Contacto */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="flex flex-col justify-between gap-10"
            style={{ background: "#060608", padding: "clamp(2rem, 5vw, 4rem)" }}
          >
            <div>
              <p className="uppercase tracking-[0.25em] text-[13px] mb-10 font-sans flex items-center gap-3" style={{ color: "rgba(201,168,76,0.5)" }}>
                <span style={{ display: "inline-block", width: 20, height: 1, background: "rgba(201,168,76,0.4)" }} />
                {tr.footer.contacto}
              </p>
              <div className="space-y-6">
                {r.info.map((text: string) => (
                  <p key={text} className="flex items-center gap-4 text-sm font-sans" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {text}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setReservaOpen(true)} className="btn-primary"><span>{r.btn}</span></button>
              <Link href="/take-away" className="btn-outline text-center">{tr.nav.takeaway}</Link>
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10 font-sans text-[13px] uppercase tracking-[0.18em]"
          style={{ color: "rgba(255,255,255,0.12)" }}
        >
          Halal · Vegetarian options on request · Delivery via Foodora &amp; Wolt
        </motion.p>
      </div>
    </section>
    <ReservaModal open={reservaOpen} onClose={() => setReservaOpen(false)} />
    </>
  );
}
