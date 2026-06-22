import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { JWT_SECRET_BYTES } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { user, password } = await req.json();
  const secret = JWT_SECRET_BYTES;

  // 1. Comprobar admin del .env
  if (user === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
    const token = await new SignJWT({ sub: user, role: "admin", username: user })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("8h")
      .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
    return Response.json({ ok: true, role: "admin" });
  }

  // 2. Comprobar tabla Usuario
  try {
    const usuario = await prisma.usuario.findUnique({ where: { username: user } });
    if (usuario && usuario.activo && await bcrypt.compare(password, usuario.password)) {
      const token = await new SignJWT({ sub: String(usuario.id), role: usuario.rol, username: usuario.username })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("8h")
        .sign(secret);

      const cookieStore = await cookies();
      cookieStore.set("admin_token", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
      return Response.json({ ok: true, role: usuario.rol });
    }
  } catch { /* DB error, continúa */ }

  return Response.json({ error: "Credenciales incorrectas" }, { status: 401 });
}
