import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";
import { syncCartaToWeb } from "@/lib/syncCarta";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    const body = await req.json();
    const data = { ...body };
    if (data.precio !== undefined) data.precio = Number(data.precio);
    const item = await prisma.menuItem.update({ where: { id: Number(id) }, data });
    
    // Sincronizar automáticamente con la web pública y la carta de pedidos
    await syncCartaToWeb();

    return Response.json(item);
  } catch (e) {
    console.error("[carta/id PATCH]", e);
    return Response.json({ error: "Error al actualizar plato" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    await prisma.menuItem.delete({ where: { id: Number(id) } });

    // Sincronizar automáticamente con la web pública y la carta de pedidos
    await syncCartaToWeb();

    return Response.json({ ok: true });
  } catch (e) {
    console.error("[carta/id DELETE]", e);
    return Response.json({ error: "Error al eliminar plato" }, { status: 500 });
  }
}
