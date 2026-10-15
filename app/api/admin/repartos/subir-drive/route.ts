import { NextRequest } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";
import { generarReporteRepartosPdf } from "@/lib/repartosReportePdf";
import { uploadPdfToDrive } from "@/lib/googleDrive";

export async function POST(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  try {
    const body = await req.json().catch(() => ({}));
    const tipo = (body.tipo || "semanal") as "diario" | "semanal";
    const fechaParam = body.fecha || undefined;

    const { pdfBuffer, filename, periodoTexto, totalRepartos } = await generarReporteRepartosPdf({
      tipo,
      fechaParam,
    });

    const { fileId, webViewLink } = await uploadPdfToDrive({
      folderName: "01_Repartos",
      fileName: filename,
      pdfBuffer,
    });

    return Response.json({
      ok: true,
      mensaje: `Reporte semanal subido a Google Drive con éxito`,
      fileName: filename,
      periodoTexto,
      totalRepartos,
      fileId,
      webViewLink,
    });
  } catch (error: any) {
    console.error("[subir-drive]", error);
    return Response.json({ error: error.message || "Error al subir reporte a Google Drive" }, { status: 500 });
  }
}
