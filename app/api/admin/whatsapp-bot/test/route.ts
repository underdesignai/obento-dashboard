import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();

  try {
    const { message, history } = await req.json();
    if (!message || !message.trim()) {
      return Response.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    const cleanMsg = message.trim();
    const lower = cleanMsg.toLowerCase();

    // Comprobar si pide realizar un pedido (Regla Estricta)
    const isOrderIntent =
      lower.includes("pedir") ||
      lower.includes("pedido") ||
      lower.includes("comprar") ||
      lower.includes("quiero 2") ||
      lower.includes("ponme") ||
      lower.includes("maki") ||
      lower.includes("uramaki") ||
      lower.includes("bandeja") ||
      lower.includes("para llevar") ||
      lower.includes("takeaway") ||
      lower.includes("a domicilio");

    let reply = "";

    if (isOrderIntent) {
      reply = `🍣 ¡Hola! Con mucho gusto. Para garantizar que tu sushi se prepare fresco al momento y puedas ver todas las fotos, ingredientes y alérgenos, todos los pedidos se realizan directamente a través de nuestra web oficial:

👉 https://obentojapanesefood.es/pedidos

Desde allí puedes elegir tus rollos, seleccionar tu hora de recogida y pagar de forma rápida y segura. ¡Si tienes alguna duda sobre algún plato de la carta, pregúntame sin problema! 🥢`;
    } else if (lower.includes("horario") || lower.includes("abierto") || lower.includes("abren") || lower.includes("hora")) {
      reply = `🕒 Nuestro horario de Takeaway y recogida en tienda es:
• Martes a Domingo: 13:00 a 16:00 y de 20:00 a 23:30.
• Lunes: Cerrado por descanso.

Estamos en Murcia centro. Recuerda que para pedir online puedes acceder a https://obentojapanesefood.es/pedidos 😊`;
    } else if (lower.includes("donde") || lower.includes("ubicacion") || lower.includes("direccion") || lower.includes("donde estan")) {
      reply = `📍 Estamos ubicados en el centro de Murcia (España). Puedes venir a recoger tus pedidos preparados al momento o consultarnos cualquier duda al teléfono +34 968 00 00 00. 

Para realizar tu pedido online: 👉 https://obentojapanesefood.es/pedidos`;
    } else if (lower.includes("gluten") || lower.includes("celiaco") || lower.includes("alergeno") || lower.includes("vegano")) {
      reply = `🌾 ¡Por supuesto! En Obento disponemos de opciones sin gluten (sushi con salsa de soja sin gluten bajo petición) y deliciosas opciones vegetarianas como nuestros Uramakis vegetales y ensalada Wakame.

En nuestra carta online tienes todos los alérgenos detallados plato por plato:
👉 https://obentojapanesefood.es/pedidos`;
    } else if (lower.includes("hola") || lower.includes("buenas") || lower.includes("que tal") || lower.includes("konnichiwa")) {
      reply = `¡Konnichiwa! 👋 Bienvenido a Obento Japanese Food en Murcia. Soy tu asistente virtual. ¿En qué puedo ayudarte hoy? Puedes consultarme sobre nuestra carta, horarios, alérgenos o promociones. 

*(Recuerda que para realizar pedidos para llevar, nuestro sistema oficial está disponible en https://obentojapanesefood.es/pedidos)*`;
    } else {
      reply = `¡Gracias por contactar con Obento Japanese Food! 🎌 Estaré encantado de ayudarte con cualquier duda sobre nuestra carta, alérgenos o información del restaurante en Murcia. 

Si deseas realizar tu pedido para recoger en local, accede a nuestra web oficial:
👉 https://obentojapanesefood.es/pedidos`;
    }

    return Response.json({
      reply,
      detectedIntent: isOrderIntent ? "order_redirect" : "general_query",
    });
  } catch (e: any) {
    console.error("[whatsapp-bot/test POST]", e);
    return Response.json({ error: "Error en el simulador de WhatsApp Bot" }, { status: 500 });
  }
}
