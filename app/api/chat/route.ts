import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMsg = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1]?.content : "";

    // Obtener configuración del agente
    const row = await prisma.configuracion.findUnique({ where: { clave: "agent_config" } });
    let config: any = {};
    if (row?.valor) {
      try { config = JSON.parse(row.valor); } catch {}
    }

    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    const model = config.model || "gpt-4o-mini";
    const systemPrompt = config.systemPrompt || "Eres el Asistente Virtual Oficial de Obento Japanese Food en La Ñora (Murcia).";
    const knowledgeBase = config.knowledgeBase || "";

    if (apiKey && config.apiProvider !== "anthropic") {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: `${systemPrompt}\n\nBase de conocimiento del restaurante:\n${knowledgeBase}` },
              ...(Array.isArray(messages) ? messages : []),
            ],
            temperature: 0.7,
            max_tokens: 400,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return NextResponse.json({ reply });
        }
      } catch (err) {
        console.error("[chat api openai error]", err);
      }
    }

    // Fallback inteligente si no hay API key configurada o en modo demostración
    const query = (lastMsg || "").toLowerCase();
    let reply = "¡Hola! Bienvenido a Obento Japanese Food en Calle Mayor 45, La Ñora (Murcia). ";

    if (query.includes("horario") || query.includes("abierto") || query.includes("hora")) {
      reply += "Nuestro horario habitual de cocina y takeaway es de lunes a domingo de 13:00 a 23:30 (viernes y sábados hasta medianoche). ¡Puedes pedir online en cualquier momento!";
    } else if (query.includes("donde") || query.includes("direccion") || query.includes("ubicacion") || query.includes("llegar")) {
      reply += "Nos encontramos en Calle Mayor 45, 30830 La Ñora (Murcia). ¡Te esperamos para recoger tu pedido recién elaborado!";
    } else if (query.includes("carta") || query.includes("plato") || query.includes("sushi") || query.includes("recomiend")) {
      reply += "Nuestras especialidades más demandadas son el Dragón Uramaki Especial, Salmón Roll, Nigiris flameados de autor, Gyozas caseras de pollo y Yakisoba crujiente.";
    } else if (query.includes("recog") || query.includes("pedido") || query.includes("tiempo") || query.includes("tarda")) {
      reply += "El tiempo medio de preparación de nuestros pedidos de sushi artesanal para llevar es de aproximadamente 25 a 35 minutos.";
    } else {
      reply += "Preparamos sushi artesanal y cocina japonesa de máxima frescura. Puedes explorar la carta completa y hacer tu pedido para llevar directamente desde nuestra web.";
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[chat api error]", error);
    return NextResponse.json({ error: "Error procesando consulta" }, { status: 500 });
  }
}
