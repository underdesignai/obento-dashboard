import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return false;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "secret");
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function GET() {
  if (!await isAdmin()) return Response.json({ error: "No autorizado" }, { status: 403 });
  const usuarios = await prisma.usuario.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, username: true, email: true, rol: true, activo: true, createdAt: true },
  });
  return Response.json(usuarios);
}

export async function POST(req: Request) {
  try {
    if (!await isAdmin()) return Response.json({ error: "No autorizado" }, { status: 403 });
    const { username, email, password, rol } = await req.json();
    if (!username || !password || !rol) {
      return Response.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }
    const exists = await prisma.usuario.findUnique({ where: { username } });
    if (exists) {
      return Response.json({ error: "El nombre de usuario ya existe" }, { status: 409 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: { username, email: email || null, password: hashed, rol },
      select: { id: true, username: true, email: true, rol: true, activo: true, createdAt: true },
    });
    return Response.json(usuario, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
