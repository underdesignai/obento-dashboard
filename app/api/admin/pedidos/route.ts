import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";
import { upsertCliente } from "@/lib/clienteSync";

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  try {
    const pedidos = await prisma.pedido.findMany({ orderBy: { id: "desc" } });

    const menuItems = await prisma.menuItem.findMany({ select: { id: true, imagen: true } });
    const imgMap = Object.fromEntries(menuItems.map((m: {id:number,imagen:string|null}) => [String(m.id), m.imagen]));

    const enriched = pedidos.map(p => {
      const items = (p.items as any[]).map(item => ({
        ...item,
        image: item.image ?? imgMap[String(item.id)] ?? null,
      }));
      return { ...p, items };
    });

    return Response.json(enriched);
  } catch (e) {
    console.error("[pedidos GET]", e);
    return Response.json({ error: "Error al cargar pedidos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  try {
    const data = await req.json();
    if (!data.nombre || !data.items || typeof data.total !== "number") {
      return Response.json({ error: "nombre, items y total son requeridos" }, { status: 400 });
    }
    const p = await prisma.pedido.create({ data });
    upsertCliente({ nombre: p.nombre, email: p.email, telefono: p.telefono, fecha: p.createdAt, tipo: "pedido" }).catch(() => {});
    return Response.json(p, { status: 201 });
  } catch (e) {
    console.error("[pedidos POST]", e);
    return Response.json({ error: "Error al crear pedido" }, { status: 500 });
  }
}
