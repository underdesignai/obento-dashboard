"use client";
import { useRef } from "react";
import { useInView } from "motion/react";
import { useLanguage } from "@/lib/LanguageContext";

export default function MarqueeSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "0px 0px -10% 0px" });
  const { tr } = useLanguage();
  const items = tr.marquee;

  return (
    <div
      ref={ref}
      className="overflow-hidden py-5 select-none"
      style={{
        background: "rgba(201,168,76,0.03)",
        borderTop: "1px solid rgba(201,168,76,0.12)",
        borderBottom: "1px solid rgba(201,168,76,0.12)",
      }}
    >
      <div className="flex whitespace-nowrap marquee-track" style={{ animationPlayState: inView ? "running" : "paused" }}>
        {[...Array(3)].map((_, r) => (
          <div key={r} className="flex gap-12 pr-12 items-center">
            {items.map((t: string) => (
              <span
                key={t + r}
                className="flex items-center gap-4 text-[13px] uppercase tracking-[0.28em] font-sans"
                style={{ color: "rgba(201,168,76,0.45)" }}
              >
                <span
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: "rgba(201,168,76,0.5)",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
