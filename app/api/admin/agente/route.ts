import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

const CLAVE = "agent_config";

const DEFAULT_CONFIG: Record<string, unknown> = {
  enabled: true,
  apiProvider: "openai",
  apiKey: "",
  model: "gpt-4o-mini",
  systemPrompt: `Eres el Asistente Virtual Oficial de Obento Japanese Food, ubicado en Calle Mayor 45, La Ñora (Murcia).
Tu misión es atender con cortesía y rapidez a los clientes sobre la carta de sushi artesanal, entrantes, platos calientes, precios, alérgenos, recogida en local (takeaway) y pedidos online.
Eres amable, profesional y conciso. Destacas la frescura de los ingredientes y el cuidado en cada elaboración.`,
  knowledgeBase: `# OBENTO JAPANESE FOOD - CARTA Y SERVICIOS
Ubicación: Calle Mayor 45, 30830 La Ñora, Murcia
Teléfono: 968 00 00 00
Especialidades: Sushi artesanal, Nigiris de autor, Uramakis premium, Gyozas caseras, Platos Wok y Mochis tradicionales.
Takeaway & Pedidos Online: Los clientes pueden pedir directamente por la web y recoger en el restaurante. Tiempo medio de preparación: 25-35 minutos.
Métodos de pago: Tarjeta online (Stripe) y pago en local (tarjeta o efectivo).
Alérgenos: Disponemos de opciones sin gluten, sin lactosa y carta con marcado completo de alérgenos.`,
  businessHours: {
    lunes: { open: "13:00", close: "23:30", active: true },
    martes: { open: "13:00", close: "23:30", active: true },
    miercoles: { open: "13:00", close: "23:30", active: true },
    jueves: { open: "13:00", close: "23:30", active: true },
    viernes: { open: "13:00", close: "23:59", active: true },
    sabado: { open: "13:00", close: "23:59", active: true },
    domingo: { open: "13:00", close: "23:30", active: true },
  },
};

async function readConfig(): Promise<Record<string, unknown>> {
  const row = await prisma.configuracion.findUnique({ where: { clave: CLAVE } });
  if (!row) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(row.valor);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

async function writeConfig(cfg: Record<string, unknown>) {
  const valor = JSON.stringify(cfg);
  await prisma.configuracion.upsert({
    where: { clave: CLAVE },
    update: { valor },
    create: { clave: CLAVE, valor },
  });
}

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  try {
    const config = await readConfig();
    // Nunca exponer la API key al cliente
    const { apiKey, ...safe } = config;
    return Response.json({ ...safe, apiKeySet: !!apiKey });
  } catch (e) {
    console.error("[agente GET]", e);
    return Response.json({}, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const body = await req.json();
    const current = await readConfig();
    // Solo actualizar apiKey si llega una nueva
    const merged = {
      ...current,
      ...body,
      apiKey: typeof body.apiKey === "string" && body.apiKey.trim()
        ? body.apiKey.trim()
        : current.apiKey,
    };
    await writeConfig(merged);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[agente PUT]", e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
