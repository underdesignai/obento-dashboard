import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { JWT_SECRET_BYTES } from "@/lib/auth";
import { cookies } from "next/headers";

async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return false;
    const { payload } = await jwtVerify(token, JWT_SECRET_BYTES);
    return payload.role === "admin";
  } catch { return false; }
}

const DEFAULTS: Record<string, string> = {
  sitio_zona_horaria: "Europe/Oslo",
};

export async function GET() {
  if (!await isAdmin()) return Response.json({ error: "No autorizado" }, { status: 403 });
  const rows = await prisma.configuracion.findMany({
    where: { clave: { in: Object.keys(DEFAULTS) } },
  });
  const result: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) result[r.clave] = r.valor;
  return Response.json(result);
}

export async function POST(req: Request) {
  if (!await isAdmin()) return Response.json({ error: "No autorizado" }, { status: 403 });
  const data: Record<string, string> = await req.json();
  for (const [clave, valor] of Object.entries(data)) {
    if (!(clave in DEFAULTS)) continue;
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor: String(valor) },
      create: { clave, valor: String(valor) },
    });
  }
  return Response.json({ ok: true });
}
