import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    const body = await req.json();
    const { estado } = body;
    if (!estado) return Response.json({ error: "estado requerido" }, { status: 400 });

    const reserva = await prisma.reserva.update({
      where: { id: Number(id) },
      data: { estado },
    });
    return Response.json(reserva);
  } catch (e) {
    console.error("[reservas/id PATCH]", e);
    return Response.json({ error: "Error al actualizar reserva" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    await prisma.reserva.delete({ where: { id: Number(id) } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[reservas/id DELETE]", e);
    return Response.json({ error: "Error al eliminar reserva" }, { status: 500 });
  }
}
