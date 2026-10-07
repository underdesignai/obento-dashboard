import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TIMEOUT_MS = 30000;

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

async function checkTakeawayOnline(): Promise<"online" | "offline"> {
  try {
    const takeawayUrl = process.env.NEXT_PUBLIC_TAKEAWAY_URL || "http://localhost:3630";
    const res = await fetch(`${takeawayUrl}/api/heartbeat`, { signal: AbortSignal.timeout(1200) });
    if (res.ok) return "online";
  } catch {}
  return getStatus("monitor_takeaway_last_seen");
}

async function getPostgresStatus(): Promise<"online" | "offline"> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "online";
  } catch {
    return "offline";
  }
}

export async function GET() {
  const [takeaway, postgres] = await Promise.all([
    checkTakeawayOnline(),
    getPostgresStatus(),
  ]);
  return NextResponse.json({ takeaway, postgres });
}
