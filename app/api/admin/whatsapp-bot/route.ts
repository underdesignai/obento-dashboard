import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

const DEFAULT_SYSTEM_PROMPT = `Eres el Asistente Oficial de WhatsApp de "Obento Japanese Food", un prestigioso restaurante y takeaway de sushi y cocina japonesa en Murcia (España).

Tu objetivo es atender a los clientes con amabilidad, rapidez y profesionalismo, resolviendo sus dudas sobre la carta, alérgenos, reservas de mesa y horarios.

==============================================================
⚠️ REGLA CRÍTICA Y ESTRICTA SOBRE PEDIDOS (OBLIGATORIO):
==============================================================
- Con este bot de WhatsApp NO se pueden crear, registrar ni cobrar pedidos directamente en la conversación de chat.
- Si el cliente menciona que quiere pedir comida (ej: "quiero pedir", "ponme 2 bandejas de uramakis", "hacer un pedido para recoger", "¿puedo pedir por aquí?"):
  DEBES responderle de manera muy cordial y atenta explicándole que todos los pedidos se gestionan con fotos, personalizaciones y pago seguro a través de nuestra web oficial:
  👉 https://obentojapanesefood.es/pedidos
- Puedes ayudarle con cualquier duda sobre ingredientes o platos recomendados antes de que haga su pedido en la web.
==============================================================

INFORMACIÓN GENERAL DE OBENTO:
- Ubicación: Murcia centro, España.
- Especialidades: Sushi fresco al momento, Uramakis creativos, Nigiris gourmet, Gyozas artesanas, Yakisoba y Mochis caseros.
- Horario Takeaway (Recogida): Martes a Domingo de 13:00 a 16:00 y de 20:00 a 23:30 (Lunes cerrado por descanso).
- Opciones especiales: Disponemos de opciones sin gluten y platos vegetarianos.

TONO:
Cálido, respetuoso y ágil, adaptado a WhatsApp. Sé claro, directo y agradable.`;

const DEFAULT_CONFIG = {
  proveedor: "meta", // "meta" | "baileys"
  activo: true,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  meta: {
    phoneNumberId: "",
    wabaId: "",
    accessToken: "",
    verifyToken: "obento_webhook_secret_verify_2026",
  },
  baileys: {
    phoneNumber: "+34 621 29 57 84",
    estado: "conectado",
    pairingMethod: "qr", // "qr" | "code"
    autoReconectar: true,
    sessionName: "obento_whatsapp_session",
  },
};

export async function GET() {
  if (!(await getSessionRole())) return deny403();

  try {
    const row = await prisma.configuracion.findUnique({
      where: { clave: "whatsapp_config" },
    });

    let config = DEFAULT_CONFIG;
    if (row && row.valor) {
      try {
        const parsed = JSON.parse(row.valor);
        config = {
          ...DEFAULT_CONFIG,
          ...parsed,
          meta: { ...DEFAULT_CONFIG.meta, ...(parsed.meta || {}) },
          baileys: { ...DEFAULT_CONFIG.baileys, ...(parsed.baileys || {}) },
        };
      } catch {
        config = DEFAULT_CONFIG;
      }
    }

    const host = process.env.NEXT_PUBLIC_WEB_URL || "https://obentojapanesefood.es";
    const webhookUrls = {
      meta: `${host}/api/webhooks/whatsapp`,
    };

    return Response.json({
      config,
      webhookUrls,
    });
  } catch (e: any) {
    console.error("[whatsapp-bot GET]", e);
    return Response.json({ error: "Error al cargar la configuración de WhatsApp Bot" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();

  try {
    const body = await req.json();
    const { proveedor, activo, systemPrompt, meta, baileys } = body || {};

    const cleanConfig = {
      proveedor: proveedor === "baileys" ? "baileys" : "meta",
      activo: activo !== undefined ? Boolean(activo) : true,
      systemPrompt: systemPrompt && systemPrompt.trim() ? systemPrompt.trim() : DEFAULT_SYSTEM_PROMPT,
      meta: {
        phoneNumberId: meta?.phoneNumberId?.trim() || "",
        wabaId: meta?.wabaId?.trim() || "",
        accessToken: meta?.accessToken?.trim() || "",
        verifyToken: meta?.verifyToken?.trim() || "obento_webhook_secret_verify_2026",
      },
      baileys: {
        phoneNumber: baileys?.phoneNumber?.trim() || "+34 621 29 57 84",
        estado: baileys?.estado || "conectado",
        pairingMethod: baileys?.pairingMethod || "qr",
        autoReconectar: baileys?.autoReconectar !== undefined ? Boolean(baileys.autoReconectar) : true,
        sessionName: "obento_whatsapp_session",
      },
    };

    const saved = await prisma.configuracion.upsert({
      where: { clave: "whatsapp_config" },
      update: { valor: JSON.stringify(cleanConfig) },
      create: { clave: "whatsapp_config", valor: JSON.stringify(cleanConfig) },
    });

    return Response.json({ ok: true, config: cleanConfig });
  } catch (e: any) {
    console.error("[whatsapp-bot POST]", e);
    return Response.json({ error: "Error al guardar la configuración de WhatsApp Bot" }, { status: 500 });
  }
}
