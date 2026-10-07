import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    const body = await req.json();
    const data: any = { ...body };
    if (data.descuento !== undefined) {
      data.descuento = data.descuento !== null && data.descuento !== "" ? Number(data.descuento) : null;
    }
    const oferta = await prisma.oferta.update({ where: { id: Number(id) }, data });
    return Response.json(oferta);
  } catch (e) {
    console.error("[ofertas/id PATCH]", e);
    return Response.json({ error: "Error al actualizar oferta" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionRole())) return deny403();
  const { id } = await params;
  try {
    await prisma.oferta.delete({ where: { id: Number(id) } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[ofertas/id DELETE]", e);
    return Response.json({ error: "Error al eliminar oferta" }, { status: 500 });
  }
}
