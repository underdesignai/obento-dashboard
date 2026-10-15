import { NextRequest } from "next/server";
import { generarReporteRepartosPdf } from "@/lib/repartosReportePdf";
import { uploadPdfToDrive } from "@/lib/googleDrive";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const authHeader = req.headers.get("authorization");

    const expectedSecret = process.env.CRON_SECRET || "obento-cron-secret-2026";
    const isAuthorized = key === expectedSecret || authHeader === `Bearer ${expectedSecret}`;

    if (!isAuthorized && process.env.NODE_ENV === "production") {
      return Response.json({ error: "No autorizado" }, { status: 401 });
    }

    // Genera el reporte semanal consolidado con los 7 días
    const { pdfBuffer, filename, periodoTexto, totalRepartos } = await generarReporteRepartosPdf({
      tipo: "semanal",
    });

    const { fileId, webViewLink } = await uploadPdfToDrive({
      folderName: "01_Repartos",
      fileName: filename,
      pdfBuffer,
    });

    return Response.json({
      ok: true,
      mensaje: `Reporte semanal sincronizado en Google Drive con éxito`,
      fileName: filename,
      periodoTexto,
      totalRepartos,
      fileId,
      webViewLink,
    });
  } catch (error: any) {
    console.error("[cron/reporte-semanal]", error);
    return Response.json({ error: error.message || "Error al sincronizar reporte semanal" }, { status: 500 });
  }
}
