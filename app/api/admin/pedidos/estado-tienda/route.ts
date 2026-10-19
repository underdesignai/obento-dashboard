import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEFAULT_CONFIG = {
  activo: true,
  mensaje: "Pedidos online desactivados temporalmente. Para realizar su pedido, por favor contacte directamente por WhatsApp o por teléfono al 613 927 596.",
  whatsapp: "34613927596",
};

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET() {
  try {
    const rows = await prisma.configuracion.findMany({
      where: {
        clave: {
          in: ["pedidos_online_activo", "pedidos_desactivados_mensaje", "pedidos_desactivados_whatsapp"],
        },
      },
    });

    const map = new Map<string, string>(rows.map((r) => [r.clave, r.valor]));
    const activoVal = map.get("pedidos_online_activo");
    const activo = activoVal !== undefined ? activoVal === "true" : DEFAULT_CONFIG.activo;
    const mensaje = map.get("pedidos_desactivados_mensaje") || DEFAULT_CONFIG.mensaje;
    const whatsapp = map.get("pedidos_desactivados_whatsapp") || DEFAULT_CONFIG.whatsapp;

    return NextResponse.json(
      {
        ok: true,
        activo,
        mensaje,
        whatsapp,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    console.error("[estado-tienda GET]", err);
    return NextResponse.json({ error: "Error al obtener estado de la tienda" }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  try {
    const body = await req.json();
    const activo = body.activo === true || body.activo === "true";
    const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim() : DEFAULT_CONFIG.mensaje;
    const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp.replace(/\D/g, "") : DEFAULT_CONFIG.whatsapp;

    await prisma.$transaction([
      prisma.configuracion.upsert({
        where: { clave: "pedidos_online_activo" },
        update: { valor: String(activo) },
        create: { clave: "pedidos_online_activo", valor: String(activo) },
      }),
      prisma.configuracion.upsert({
        where: { clave: "pedidos_desactivados_mensaje" },
        update: { valor: mensaje },
        create: { clave: "pedidos_desactivados_mensaje", valor: mensaje },
      }),
      prisma.configuracion.upsert({
        where: { clave: "pedidos_desactivados_whatsapp" },
        update: { valor: whatsapp },
        create: { clave: "pedidos_desactivados_whatsapp", valor: whatsapp },
      }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        activo,
        mensaje,
        whatsapp,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    console.error("[estado-tienda POST]", err);
    return NextResponse.json({ error: "Error al actualizar estado de pedidos" }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
