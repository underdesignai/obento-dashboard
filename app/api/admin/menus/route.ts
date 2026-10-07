import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

const CLAVE = "menus_cartas";
const VACIO = { sushi: [], calientes: [], entrantes: [], postres: [], bebidas: [] };

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  try {
    const row = await prisma.configuracion.findUnique({ where: { clave: CLAVE } });
    return Response.json(row ? JSON.parse(row.valor) : VACIO);
  } catch (e) {
    console.error("[menus GET]", e);
    return Response.json(VACIO);
  }
}

export async function PUT(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const body = await req.json();
    const valor = JSON.stringify(body);
    await prisma.configuracion.upsert({
      where: { clave: CLAVE },
      update: { valor },
      create: { clave: CLAVE, valor },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
