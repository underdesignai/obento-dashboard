import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    const body = await req.json();
    const { estado, metodo_pago, estado_pago } = body;
    if (!estado && !metodo_pago && !estado_pago) return Response.json({ error: "datos requeridos" }, { status: 400 });

    const updateData: any = {};
    if (estado) {
      updateData.estado_pedido = estado === "nuevo" ? "recibido" : estado;
      if (estado === "nuevo" || estado === "preparando" || estado === "listo" || estado === "entregado") {
        updateData.estado_pago = "pagado";
      }
    }
    if (estado_pago) {
      updateData.estado_pago = estado_pago;
    }
    if (metodo_pago) {
      updateData.metodo_pago = metodo_pago;
    }

    const pedido = await prisma.pedidos.update({
      where: { id: Number(id) },
      data: updateData,
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
