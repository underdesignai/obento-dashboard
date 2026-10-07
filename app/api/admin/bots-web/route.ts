import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

const DEFAULT_WEB_BOT_PROMPT = `Eres el Asistente Virtual Inteligente de la tienda online de "Obento Japanese Food" (Murcia, España).
Estás integrado directamente en la web obentojapanesefood.es para ayudar a los clientes mientras navegan por la carta.

Tu misión es:
1. Recomendar platos populares (Uramakis de salmón y atún, Gyozas crujientes, Yakisoba).
2. Guiar a los clientes para que añadan platos al carrito de pedidos.
3. Informar sobre horarios de recogida (Martes a Domingo 13:00-16:00 y 20:00-23:30).
4. Resolver dudas de alérgenos y opciones sin gluten.

Tono: Amigable, cordial, experto en gastronomía japonesa y orientado a incentivar que el cliente complete su pedido.`;

const DEFAULT_WEB_CONFIG = {
  activo: true,
  nombreBot: "Obento Bot",
  saludoInicial: "¡Hola! 👋 Bienvenido a Obento Japanese Food. ¿Te apetece alguna recomendación de sushi para hoy?",
  systemPrompt: DEFAULT_WEB_BOT_PROMPT,
  posicion: "bottom-right",
  colorTema: "#c81e22",
  sugerencias: [
    "🍣 ¿Cuáles son los rollos más pedidos?",
    "🌾 ¿Tenéis opciones sin gluten?",
    "🕒 ¿Cuál es el horario de recogida hoy?",
  ],
};

export async function GET() {
  if (!(await getSessionRole())) return deny403();

  try {
    const row = await prisma.configuracion.findUnique({
      where: { clave: "bots_web_config" },
    });

    let config = DEFAULT_WEB_CONFIG;
    if (row && row.valor) {
      try {
        const parsed = JSON.parse(row.valor);
        config = { ...DEFAULT_WEB_CONFIG, ...parsed };
      } catch {
        config = DEFAULT_WEB_CONFIG;
      }
    }

    return Response.json(config);
  } catch (e: any) {
    console.error("[bots-web GET]", e);
    return Response.json({ error: "Error al cargar configuración de Bots Web" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();

  try {
    const body = await req.json();
    const configToSave = {
      activo: body.activo !== undefined ? Boolean(body.activo) : true,
      nombreBot: body.nombreBot?.trim() || "Obento Bot",
      saludoInicial: body.saludoInicial?.trim() || DEFAULT_WEB_CONFIG.saludoInicial,
      systemPrompt: body.systemPrompt?.trim() || DEFAULT_WEB_BOT_PROMPT,
      posicion: body.posicion || "bottom-right",
      colorTema: body.colorTema || "#c81e22",
      sugerencias: Array.isArray(body.sugerencias) ? body.sugerencias : DEFAULT_WEB_CONFIG.sugerencias,
    };

    await prisma.configuracion.upsert({
      where: { clave: "bots_web_config" },
      update: { valor: JSON.stringify(configToSave) },
      create: { clave: "bots_web_config", valor: JSON.stringify(configToSave) },
    });

    return Response.json({ ok: true, config: configToSave });
  } catch (e: any) {
    console.error("[bots-web POST]", e);
    return Response.json({ error: "Error al guardar configuración de Bots Web" }, { status: 500 });
  }
}
