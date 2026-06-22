import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await getSessionRole()) !== "admin") return deny403();
  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = { ...body };
    if (typeof data.password === "string" && data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      delete data.password;
    }
    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data,
      select: { id: true, username: true, email: true, rol: true, activo: true, createdAt: true },
    });
    return Response.json(usuario);
  } catch (e) {
    console.error("[trabajadores/id PATCH]", e);
    return Response.json({ error: "Error al actualizar trabajador" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await getSessionRole()) !== "admin") return deny403();
  const { id } = await params;
  try {
    await prisma.usuario.delete({ where: { id: Number(id) } });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[trabajadores/id DELETE]", e);
    return Response.json({ error: "Error al eliminar trabajador" }, { status: 500 });
  }
}
