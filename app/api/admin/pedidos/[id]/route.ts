import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    const body = await req.json();
    const { estado } = body;
    if (!estado) return Response.json({ error: "estado requerido" }, { status: 400 });

    const estado_pedido = estado === "nuevo" ? "recibido" : estado;
    const pedido = await prisma.pedidos.update({
      where: { id: Number(id) },
      data: {
        estado_pedido,
        ...(estado === "nuevo" || estado === "preparando" || estado === "listo" || estado === "entregado"
          ? { estado_pago: "pagado" }
          : {}),
      },
    });
    return Response.json(pedido);
  } catch (e) {
    console.error("[pedidos/id PATCH]", e);
    return Response.json({ error: "Error al actualizar pedido" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    await prisma.pedidos.delete({ where: { id: Number(id) } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[pedidos/id DELETE]", e);
    return Response.json({ error: "Error al eliminar pedido" }, { status: 500 });
  }
}
