import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const email  = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  const nombre = req.nextUrl.searchParams.get("nombre")?.toLowerCase().trim();
  const key = email || nombre || "";
  if (!key) return Response.json([]);
  try {
    const rows = await prisma.clienteTag.findMany({ where: { clientKey: key } });
    return Response.json(rows.map(r => r.tag));
  } catch {
    return Response.json([]);
  }
}

export async function POST(req: NextRequest) {
  const { email, nombre, tag, action } = await req.json();
  const key = (email?.toLowerCase().trim()) || (nombre?.toLowerCase().trim()) || "";
  if (!key || !tag) return Response.json({ ok: false }, { status: 400 });
  try {
    if (action === "remove") {
      await prisma.clienteTag.deleteMany({ where: { clientKey: key, tag } });
    } else {
      await prisma.clienteTag.upsert({
        where: { clientKey_tag: { clientKey: key, tag } },
        update: {},
        create: { clientKey: key, tag },
      });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
