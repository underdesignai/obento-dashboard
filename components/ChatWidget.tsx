"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

type Msg = { role: "user" | "assistant"; content: string };

const GOLD = "#c9a84c";

export default function ChatWidget() {
  const { lang }              = useLanguage();
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<Msg[]>([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady]     = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let delay: ReturnType<typeof setTimeout>;
    const show = () => { delay = setTimeout(() => setReady(true), 2000); };
    window.addEventListener("coyo:ready", show);
    const fallback = setTimeout(() => setReady(true), 12000);
    return () => { window.removeEventListener("coyo:ready", show); clearTimeout(delay); clearTimeout(fallback); };
  }, []);

  useEffect(() => {
    if (open && msgs.length === 0) {
      const greeting = lang === "en"
        ? "Hi! I'm the Coyo Restaurant assistant 🌮🍣 How can I help you?"
        : "¡Hola! Soy el asistente de Coyo Restaurant 🌮🍣 ¿En qué puedo ayudarte?";
      setMsgs([{ role: "assistant", content: greeting }]);
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMsgs: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs.filter(m => m.role !== "assistant" || newMsgs.indexOf(m) > 0), lang }),
      });
      const { reply } = await res.json();
      setMsgs(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMsgs(prev => [...prev, { role: "assistant", content: lang === "en" ? "Sorry, an error occurred. Please try again." : "Lo siento, ha habido un error. Inténtalo de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 90, right: 24, zIndex: 9999,
          width: "min(380px, calc(100vw - 48px))",
          height: "min(560px, calc(100vh - 140px))",
          background: "#0e0d0b",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: 12,
          display: "flex", flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "1rem 1.25rem",
            background: "linear-gradient(135deg, #1a1608 0%, #0e0d0b 100%)",
            borderBottom: "1px solid rgba(201,168,76,0.15)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD}, #8b6914)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                🌮
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Coyo Assistant</p>
                <p style={{ fontSize: 10, color: "rgba(201,168,76,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>IA · Siempre disponible</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", padding: 4 }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "0.625rem 0.875rem",
                  borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: m.role === "user"
                    ? `linear-gradient(135deg, ${GOLD}, #8b6914)`
                    : "rgba(255,255,255,0.05)",
                  border: m.role === "assistant" ? "1px solid rgba(255,255,255,0.07)" : "none",
                  color: m.role === "user" ? "#0a0a0f" : "rgba(255,255,255,0.85)",
                  fontSize: 13,
                  lineHeight: 1.55,
                  fontWeight: m.role === "user" ? 500 : 400,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "0.625rem 0.875rem", borderRadius: "12px 12px 12px 2px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Loader2 size={14} style={{ color: GOLD, animation: "spin 1s linear infinite" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: "0.5rem", alignItems: "flex-end",
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Escribe tu mensaje..."
              rows={1}
              style={{
                flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "0.625rem 0.875rem", color: "#fff", fontSize: 13,
                outline: "none", resize: "none", lineHeight: 1.5, maxHeight: 100, overflowY: "auto",
                fontFamily: "inherit",
              }}
            />
            <button onClick={send} disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: 8, border: "none", cursor: "pointer",
                background: input.trim() ? `linear-gradient(135deg, ${GOLD}, #8b6914)` : "rgba(255,255,255,0.05)",
                color: input.trim() ? "#0a0a0f" : "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 200ms", flexShrink: 0,
              }}>
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%",
          background: open ? "rgba(30,28,20,0.95)" : `linear-gradient(135deg, ${GOLD}, #8b6914)`,
          border: open ? `2px solid ${GOLD}` : "none",
          color: open ? GOLD : "#0a0a0f",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(201,168,76,0.35)",
          transition: "all 300ms cubic-bezier(0.34,1.56,0.64,1)",
          transform: open ? "scale(1)" : "scale(1)",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
