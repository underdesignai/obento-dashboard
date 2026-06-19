"use client";

import { motion } from "motion/react";
import ProductCard from "@/components/ProductCard";
import CartasMenu from "@/components/CartasMenu";
import { menuItems } from "@/lib/menu";
import { useLanguage } from "@/lib/LanguageContext";

const starPlates = menuItems.filter(i =>
  ["laksetartar","truffle-akami","quesabirrias","brisket","nikkei-ceviche","churros"].includes(i.id)
);

export default function MenuSection() {
  const { tr } = useLanguage();
  const m = tr.menu;
  return (
    <section id="menu" style={{ background: "#0a0a0f", padding: "7rem 0" }}>
      <div className="px-6 md:px-16" style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div className="text-center mb-20">
          <div className="divider-gold mx-auto" />
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="uppercase tracking-[0.3em] text-[13px] mb-4 font-sans"
            style={{ color: "#c9a84c" }}
          >
            {m.chefLabel}
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
              {m.starTitle}
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="font-sans text-sm"
            style={{ color: "rgba(255,255,255,0.28)", lineHeight: 1.7, maxWidth: "36rem", margin: "1rem auto 3rem", textAlign: "center", display: "block" }}
          >
            {m.starDesc}
          </motion.p>
        </div>

        {/* Cards */}
        <motion.div
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
        >
          {starPlates.map((item) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] as [number,number,number,number] } },
              }}
            >
              <ProductCard item={item} />
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16"
          style={{ borderTop: "1px solid rgba(201,168,76,0.08)", paddingTop: "60px", paddingBottom: "0px" }}
        >
          <CartasMenu />
        </motion.div>
      </div>
    </section>
  );
}
