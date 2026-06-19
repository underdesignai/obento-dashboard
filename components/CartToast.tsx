"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";

let _show: ((name: string) => void) | null = null;

export function showCartToast(name: string) {
  _show?.(name);
}

export default function CartToast() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [name, setName]       = useState("");
  const [timer, setTimer]     = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    _show = (productName: string) => {
      setName(productName);
      setVisible(true);
      if (timer) clearTimeout(timer);
      const t = setTimeout(() => setVisible(false), 2500);
      setTimer(t);
    };
    return () => { _show = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pathname.startsWith("/checkout")) return null;

  return (
    <div style={{
      position: "fixed", bottom: "2rem", left: "50%",
      transform: `translateX(-50%) translateY(${visible ? "0" : "120%"})`,
      transition: "transform 300ms cubic-bezier(0.4,0,0.2,1), visibility 0s linear 300ms",
      visibility: visible ? "visible" : "hidden",
      zIndex: 200,
      display: "flex", alignItems: "center", gap: "0.625rem",
      padding: "0.75rem 1.25rem",
      background: "rgba(15,14,11,0.95)",
      border: "1px solid rgba(201,168,76,0.35)",
      borderRadius: 40,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.08)",
      backdropFilter: "blur(12px)",
      pointerEvents: "none",
      whiteSpace: "nowrap",
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "rgba(201,168,76,0.15)",
        border: "1px solid rgba(201,168,76,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Check size={12} style={{ color: "#c9a84c" }} strokeWidth={3} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
        {name}
      </span>
      <span style={{ fontSize: 13, color: "rgba(201,168,76,0.7)", fontWeight: 400 }}>
        añadido al carrito
      </span>
    </div>
  );
}
