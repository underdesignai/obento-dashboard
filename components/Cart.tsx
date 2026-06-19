"use client";
import { useCartStore } from "@/lib/store";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

const CATEGORY_EMOJI: Record<string, string> = {
  tacos: "🌮", ceviches: "🍋", snacks: "🍟", flautas: "🫔", principales: "🍽️",
  postres: "🍮", sushi: "🍣", "klassisk-nigiri": "🍣", "spesial-nigiri": "🍣",
  "klassisk-maki": "🌊", "spesial-maki": "🌊", "futo-maki": "🌊",
  "klassisk-sashimi": "🐟", "spesial-sashimi": "🐟", tartar: "🐟", combos: "🎁",
};

export default function Cart() {
  const { items, isOpen, closeCart, removeItem, updateQty, total } = useCartStore();
  const router = useRouter();
  const pathname = usePathname();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const { tr } = useLanguage();
  const ct = tr.cart;

  useEffect(() => {
    if (pathname === "/checkout") closeCart();
  }, [pathname]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)", zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 300ms ease",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100%",
        width: "100%", maxWidth: 400,
        background: "linear-gradient(180deg, #0e0d0b 0%, #0a0a0f 100%)",
        borderLeft: "1px solid rgba(201,168,76,0.12)",
        zIndex: 50, display: "flex", flexDirection: "column",
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 350ms cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
      }}>

        {/* Header */}
        <div style={{
          padding: "1.5rem 1.75rem 1.25rem",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(201,168,76,0.03)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(201,168,76,0.08)",
            }}>
              <ShoppingBag size={15} style={{ color: "#c9a84c" }} />
            </div>
            <div>
              <h2 style={{ fontFamily: "var(--font-playfair, serif)", fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
                {ct.title}
              </h2>
              {count > 0 && (
                <p style={{ fontSize: 11, color: "rgba(201,168,76,0.6)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  {count} {count !== 1 ? ct.articulos : ct.articulo}
                </p>
              )}
            </div>
          </div>
          <button onClick={closeCart} style={{
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4,
            background: "transparent", color: "rgba(255,255,255,0.35)", cursor: "pointer",
            transition: "all 150ms",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.75rem" }}>
          {items.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: "1.25rem", textAlign: "center",
              padding: "2rem 1rem",
            }}>
              {/* Ilustración vacío */}
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)",
                  border: "1px solid rgba(201,168,76,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ShoppingBag size={28} style={{ color: "rgba(201,168,76,0.3)" }} />
                </div>
                <div style={{
                  position: "absolute", top: -4, right: -4, width: 20, height: 20,
                  borderRadius: "50%", background: "rgba(201,168,76,0.15)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10,
                }}>✦</div>
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-playfair, serif)", fontSize: 20, color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem", fontWeight: 600 }}>
                  {ct.emptyTitle}
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 1.6, maxWidth: 220 }}>
                  {ct.emptyDesc}
                </p>
              </div>
              <button onClick={closeCart} style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.65rem 1.5rem",
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.25)",
                borderRadius: 4, color: "#c9a84c",
                fontSize: 12, fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.12em", cursor: "pointer",
                transition: "all 200ms",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.18)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,0.1)"; }}
              >
                {ct.exploreMenu} <ArrowRight size={12} />
              </button>

            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {items.map((item) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "0.875rem 1rem",
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8,
                  transition: "border-color 150ms",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.2)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  {/* Emoji categoría */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 8, flexShrink: 0,
                    background: "rgba(201,168,76,0.07)",
                    border: "1px solid rgba(201,168,76,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20,
                  }}>
                    {CATEGORY_EMOJI[item.category] ?? "🍽️"}
                  </div>

                  {/* Nombre + precio */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: 13, color: "#c9a84c", margin: "3px 0 0", fontFamily: "Georgia, serif", fontWeight: 700 }}>
                      {(item.price * item.qty).toLocaleString("es-ES")},-
                    </p>
                  </div>

                  {/* Controles cantidad */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                    <button onClick={() => updateQty(item.id, -1)} style={{
                      width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4,
                      background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer",
                      transition: "all 150ms",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; e.currentTarget.style.color = "#c9a84c"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
                    >
                      <Minus size={10} />
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", minWidth: 18, textAlign: "center" }}>
                      {item.qty}
                    </span>
                    <button onClick={() => updateQty(item.id, 1)} style={{
                      width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4,
                      background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer",
                      transition: "all 150ms",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; e.currentTarget.style.color = "#c9a84c"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
                    >
                      <Plus size={10} />
                    </button>
                    <button onClick={() => removeItem(item.id)} style={{
                      width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                      border: "none", background: "transparent",
                      color: "rgba(252,165,165,0.3)", cursor: "pointer",
                      transition: "color 150ms", marginLeft: 2,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.color = "rgba(252,165,165,0.8)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "rgba(252,165,165,0.3)"; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con total y checkout */}
        {items.length > 0 && (
          <div style={{
            padding: "1.25rem 1.75rem 1.75rem",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(201,168,76,0.02)",
          }}>
            {/* Desglose */}
            <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  {ct.subtotal} ({count} {count !== 1 ? ct.articulos : ct.articulo})
                </span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{total().toLocaleString("es-ES")},-</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{ct.recogida}</span>
                <span style={{ fontSize: 12, color: "rgba(74,222,128,0.7)", fontWeight: 600 }}>{ct.gratis}</span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0.25rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.12em" }}>{ct.total}</span>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#c9a84c" }}>
                  {total().toLocaleString("es-ES")},-
                </span>
              </div>
            </div>

            {/* Botón checkout */}
            <button onClick={() => router.push("/checkout")} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.625rem", width: "100%", padding: "0.875rem",
              background: "linear-gradient(135deg, #c9a84c 0%, #8b6914 100%)",
              color: "#0a0a0f", fontSize: 13, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.12em",
              borderRadius: 4, transition: "opacity 200ms", border: "none", cursor: "pointer",
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {ct.confirmar} <ArrowRight size={14} />
            </button>

            {/* Info recogida */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", marginTop: "0.875rem" }}>
              <MapPin size={11} style={{ color: "rgba(255,255,255,0.2)" }} />
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
                {ct.recogidaInfo}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
