import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

const CLAVE = "agent_config";

async function readConfig(): Promise<Record<string, unknown>> {
  const row = await prisma.configuracion.findUnique({ where: { clave: CLAVE } });
  return row ? JSON.parse(row.valor) : {};
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
