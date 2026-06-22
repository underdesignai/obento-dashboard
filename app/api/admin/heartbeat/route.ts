import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TIMEOUT_MS = 15000;

async function getStatus(clave: string): Promise<"online" | "offline"> {
  try {
    const row = await prisma.configuracion.findUnique({ where: { clave } });
    if (!row) return "offline";
    const diff = Date.now() - new Date(row.valor).getTime();
    return diff < TIMEOUT_MS ? "online" : "offline";
  } catch {
    return "offline";
  }
}

export async function GET() {
  const [reservas, takeaway] = await Promise.all([
    getStatus("monitor_reservas_last_seen"),
    getStatus("monitor_takeaway_last_seen"),
  ]);
  return NextResponse.json({ reservas, takeaway });
}
