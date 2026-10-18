import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_CONFIG = {
  activo: true,
  mensaje: "Pedidos online desactivados temporalmente. Para realizar su pedido, por favor contacte directamente por WhatsApp o por teléfono al 613 927 596.",
  whatsapp: "34613927596",
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

    return NextResponse.json({
      ok: true,
      activo,
      mensaje,
      whatsapp,
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, max-age=0",
      }
    });
  } catch (err: any) {
    console.error("[public tienda/estado GET]", err);
    return NextResponse.json({ ok: true, ...DEFAULT_CONFIG });
  }
}
