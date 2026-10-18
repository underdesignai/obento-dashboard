import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";
import { uploadFacturaToDrive } from "@/lib/googleDriveFacturas";

export async function POST(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  try {
    const { facturaId } = await req.json();

    if (!facturaId) {
      return NextResponse.json({ error: "facturaId es obligatorio" }, { status: 400 });
    }

    const factura = await prisma.factura.findUnique({
      where: { id: Number(facturaId) },
    });

    if (!factura) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    if (!factura.archivoUrl) {
      return NextResponse.json({ error: "Esta factura no tiene archivo adjunto para subir" }, { status: 400 });
    }

    let fileBuffer: Buffer | null = null;

    // Si está guardada en la tabla Imagen interna
    if (factura.archivoUrl.startsWith("/api/imagenes/")) {
      const match = factura.archivoUrl.match(/\/api\/imagenes\/(\d+)/);
      if (match) {
        const imgDoc = await prisma.imagen.findUnique({ where: { id: Number(match[1]) } });
        if (imgDoc?.data) {
          fileBuffer = Buffer.from(imgDoc.data);
        }
      }
    } else if (factura.archivoUrl.startsWith("http")) {
      // Descargar buffer si viene de una URL remota
      const res = await fetch(factura.archivoUrl);
      if (res.ok) {
        fileBuffer = Buffer.from(await res.arrayBuffer());
      }
    }

    if (!fileBuffer) {
      return NextResponse.json(
        { error: "No se pudo recuperar el archivo original de la factura" },
        { status: 404 }
      );
    }

    // Subir a Google Drive organizado por fecha de emisión real y trimestre
    const driveRes = await uploadFacturaToDrive({
      fechaEmision: factura.fechaEmision,
      proveedor: factura.proveedor,
      numeroFactura: factura.numeroFactura,
      totalFactura: factura.totalFactura,
      fileBuffer,
    });

    // Actualizar la factura con el enlace permanente de Google Drive y el nombre normalizado
    const updated = await prisma.factura.update({
      where: { id: factura.id },
      data: {
        archivoUrl: driveRes.webViewLink,
        archivoNombre: driveRes.fileName,
      },
    });

    return NextResponse.json({
      ok: true,
      mensaje: "Factura sincronizada en Google Drive con éxito",
      factura: updated,
      driveRes,
    });
  } catch (err: any) {
    console.error("[facturas/subir-drive error]", err);
    return NextResponse.json(
      { error: err?.message || "Error al subir factura a Google Drive" },
      { status: 500 }
    );
  }
}
