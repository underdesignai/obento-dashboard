import { NextRequest } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";
import { generarReporteRepartosPdf } from "@/lib/repartosReportePdf";

export async function GET(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  try {
    const { searchParams } = new URL(req.url);
    const tipo = (searchParams.get("tipo") || "diario") as "diario" | "semanal";
    const fechaParam = searchParams.get("fecha") || undefined;

    const { pdfBuffer, filename } = await generarReporteRepartosPdf({
      tipo,
      fechaParam,
    });

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[repartos reporte PDF]", error);
    return Response.json({ error: "Error al generar reporte PDF" }, { status: 500 });
  }
}
