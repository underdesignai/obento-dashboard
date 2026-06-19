import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const role = await getSessionRole();
  if (!role) return deny403();

  const { searchParams } = new URL(req.url);
  const estado   = searchParams.get("estado") || "";
  const servicio = searchParams.get("servicio") || "";
  const search   = searchParams.get("search") || "";
  const page     = parseInt(searchParams.get("page") || "1");
  const limit    = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {};
  if (estado)   where.estado   = estado;
  if (servicio) where.servicio = servicio;
  if (search)   where.OR = [
    { nombre:  { contains: search, mode: "insensitive" } },
    { email:   { contains: search, mode: "insensitive" } },
    { empresa: { contains: search, mode: "insensitive" } },
  ];

  const [total, items] = await Promise.all([
    prisma.reservaServicio.count({ where }),
    prisma.reservaServicio.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const role = await getSessionRole();
  if (!role) return deny403();
  const body = await req.json();
  const item = await prisma.reservaServicio.create({ data: body });
  return NextResponse.json(item, { status: 201 });
}
