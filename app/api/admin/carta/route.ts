import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";
import { syncCartaToWeb } from "@/lib/syncCarta";

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  try {
    const items = await prisma.menuItem.findMany({ orderBy: { categoria: "asc" } });
    return Response.json(items);
  } catch (e) {
    console.error("[carta GET]", e);
    return Response.json({ error: "Error al cargar carta" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const data = await req.json();
    if (!data.nombre || data.precio === undefined) {
      return Response.json({ error: "nombre y precio son requeridos" }, { status: 400 });
    }
    const item = await prisma.menuItem.create({ data: { ...data, precio: Number(data.precio) } });
    
    // Sincronizar automáticamente con la web pública y la carta de pedidos
    await syncCartaToWeb();

    return Response.json(item, { status: 201 });
  } catch (e) {
    console.error("[carta POST]", e);
    return Response.json({ error: "Error al crear plato" }, { status: 500 });
  }
}
