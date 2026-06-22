import { NextResponse } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  const row = await prisma.configuracion.findUnique({ where: { clave: "backup_schedule" } });
  return NextResponse.json({ enabled: row?.valor === "true", dayOfWeek: "sunday", time: "03:00" });
}

export async function POST(req: Request) {
  if (!(await getSessionRole())) return deny403();
  const { enabled } = await req.json();
  await prisma.configuracion.upsert({
    where: { clave: "backup_schedule" },
    update: { valor: String(enabled) },
    create: { clave: "backup_schedule", valor: String(enabled) },
  });
  return NextResponse.json({ ok: true });
}
