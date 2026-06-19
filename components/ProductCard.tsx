"use client";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { showCartToast } from "@/components/CartToast";
import type { MenuItem } from "@/lib/menu";
import { useLanguage } from "@/lib/LanguageContext";
import { badgeTranslations } from "@/lib/menu";

const badgeStyles: Record<string, { bg: string; color: string; border: string }> = {
  gold:   { bg: "rgba(201,168,76,0.12)",  color: "#c9a84c",      border: "rgba(201,168,76,0.25)" },
  wasabi: { bg: "rgba(74,222,128,0.08)",  color: "rgb(134,239,172)", border: "rgba(74,222,128,0.2)" },
  chile:  { bg: "rgba(248,113,113,0.08)", color: "rgb(252,165,165)", border: "rgba(248,113,113,0.2)" },
};

export default function ProductCard({ item }: { item: MenuItem }) {
  const { addItem } = useCartStore();
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { tr, lang } = useLanguage();
  const pc = tr.productCard;
  const desc = lang === "en" ? (item.descriptionEn ?? item.description) : item.description;
  const badgeText = item.badge ? (lang === "en" ? (badgeTranslations[item.badge] ?? item.badge) : item.badge) : undefined;

  const handleAdd = () => {
    addItem({ id: item.id, name: item.name, nameEn: item.nameEn, price: item.price, category: item.category, concepto: item.concepto });
    showCartToast(item.name);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const badge = badgeStyles[item.badgeColor || "gold"];

  return (
    <div
      className="flex flex-col cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: "2px",
        transition: "all 250ms ease",
      }}
    >
      {/* Imagen */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            style={{ transform: hovered ? "scale(1.06)" : "scale(1)", transition: "transform 600ms ease" }}
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl select-none"
            style={{ background: "rgba(201,168,76,0.05)" }}>
            {item.emoji}
          </div>
        )}

        {/* Overlay degradado */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.1) 50%, transparent 100%)" }} />

        {/* Badge */}
        {badgeText && (
          <span className="absolute top-3 left-3 text-[9px] font-sans font-semibold px-2.5 py-1 uppercase tracking-[0.12em]"
            style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, borderRadius: "2px" }}>
            {badgeText}
          </span>
        )}

        {/* Tags Halal / Vegetal */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {item.halal && (
            <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 uppercase tracking-wider"
              style={{ background: "rgba(20,83,45,0.85)", color: "rgb(134,239,172)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: "2px" }}>
              {pc.halal}
            </span>
          )}
          {item.vegetarian && (
            <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 uppercase tracking-wider"
              style={{ background: "rgba(6,78,59,0.85)", color: "rgb(110,231,183)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "2px" }}>
              {pc.vegetarian}
            </span>
          )}
        </div>

        {/* Línea dorada inferior al hover */}
        <div className="absolute bottom-0 left-0 right-0 h-px transition-opacity duration-300"
          style={{ background: "linear-gradient(90deg, transparent, #c9a84c, transparent)", opacity: hovered ? 0.6 : 0 }} />
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1" style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
        <h3 className="font-serif text-[17px] font-bold leading-snug mb-2"
          style={{ color: hovered ? "#ffffff" : "rgba(255,255,255,0.9)", transition: "color 200ms" }}>
          {item.name}
        </h3>

        <p className="font-sans text-[13px] leading-relaxed flex-1 line-clamp-3"
          style={{ color: "rgba(255,255,255,0.38)" }}>
          {desc}
        </p>

        {item.allergens && (
          <p className="font-sans text-[11px] mt-3 italic"
            style={{ color: "rgba(255,255,255,0.18)" }}>
            {pc.allergens}: {item.allergens}
          </p>
        )}

        {/* Footer: precio + botón */}
        <div className="flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "1.5rem", paddingTop: "1rem" }}>
          <div>
            <span className="font-sans text-xl font-semibold" style={{ color: "#c9a84c" }}>
              {item.price}
            </span>
            <span className="font-sans text-sm" style={{ color: "rgba(201,168,76,0.5)" }}>,-</span>
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 text-[10px] font-sans font-semibold uppercase tracking-[0.15em] cursor-pointer transition-all duration-250"
            style={added ? {
              background: "rgba(52,211,153,0.12)",
              color: "rgb(110,231,183)",
              border: "1px solid rgba(52,211,153,0.25)",
              borderRadius: "2px",
            } : {
              background: hovered ? "#c9a84c" : "rgba(201,168,76,0.08)",
              color: hovered ? "#0a0a0f" : "#c9a84c",
              border: `1px solid ${hovered ? "#c9a84c" : "rgba(201,168,76,0.2)"}`,
              borderRadius: "2px",
            }}
          >
            {added ? (
              <><Check size={11} /> {pc.added}</>
            ) : (
              <><Plus size={11} /> {pc.add}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
