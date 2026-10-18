import PDFDocument from "pdfkit";

// ID de la carpeta principal de facturas de compras
export const GOOGLE_DRIVE_FACTURAS_FOLDER_ID = "1DKDRNOygxSnRhjiLs6C94ZlYvR9scpE2";

// Mapeo conocido de carpetas trimestrales (año 2026)
export const KNOWN_QUARTER_FOLDERS: Record<string, string> = {
  "2026_T1": "1-evgvp51AaGNm2kHH2c9hp8VMu-o-INC", // 2026_T1 (Ene - Mar)
  "2026_T2": "144OE1zV8C4drXr0Ia4gDO7XU8bwRq774", // 2026_T2 (Abr - Jun)
  "2026_T3": "1K8m1VtS52s3kOh8Ebkl4mhoF0ryJQ5ij", // 2026_T3 (Jul - Sep)
  "2026_T4": "1p20qCLqY3_w-rVUX025d0YGBTh9uwY0e", // 2026_T4 (Oct - Dic)
};

const DEFAULT_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbzDf5pOfnSKAoRbskCJIpnbdStN9nnSbB2Jf9j3WuPhODNEWBxH_l3BpZanxGTdcT0O/exec";

/**
 * Calcula el trimestre contable correspondiente a la fecha de emisión de la factura
 */
export function getQuarterInfo(fechaEmision: Date | string) {
  const d = typeof fechaEmision === "string" ? new Date(fechaEmision) : fechaEmision;
  const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const month = isNaN(d.getMonth()) ? new Date().getMonth() + 1 : d.getMonth() + 1; // 1-12

  let quarter = "T4";
  let quarterLabel = "Oct - Dic";
  if (month >= 1 && month <= 3) {
    quarter = "T1";
    quarterLabel = "Ene - Mar";
  } else if (month >= 4 && month <= 6) {
    quarter = "T2";
    quarterLabel = "Abr - Jun";
  } else if (month >= 7 && month <= 9) {
    quarter = "T3";
    quarterLabel = "Jul - Sep";
  }

  const quarterKey = `${year}_${quarter}`;
  const folderName = `${year}_${quarter} (${quarterLabel})`;
  return { year, quarter, quarterLabel, quarterKey, folderName };
}

/**
 * Genera el nombre de archivo estandarizado y ordenable por fecha de emisión real:
 * Formato: YYYY-MM-DD_[Proveedor]_[NumFactura]_[Importe]€.pdf
 */
export function formatFacturaFileName({
  fechaEmision,
  proveedor,
  numeroFactura,
  totalFactura,
}: {
  fechaEmision: Date | string;
  proveedor: string;
  numeroFactura: string;
  totalFactura: number;
}): string {
  const d = typeof fechaEmision === "string" ? new Date(fechaEmision) : fechaEmision;
  const yyyy = !isNaN(d.getFullYear()) ? d.getFullYear() : new Date().getFullYear();
  const mm = !isNaN(d.getMonth()) ? String(d.getMonth() + 1).padStart(2, "0") : "01";
  const dd = !isNaN(d.getDate()) ? String(d.getDate()).padStart(2, "0") : "01";
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Limpiar caracteres no válidos para nombres de archivo
  const cleanProveedor = (proveedor || "Proveedor")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // sin tildes raras en nombres de archivo
    .replace(/[/\\?%*:|"<>#]/g, "-")
    .replace(/\s+/g, "_")
    .substring(0, 30);

  const cleanNum = (numeroFactura || "S-N")
    .trim()
    .replace(/[/\\?%*:|"<>#]/g, "-")
    .replace(/\s+/g, "_")
    .substring(0, 25);

  const totalNum = Number(totalFactura || 0);
  const totalStr = totalNum.toFixed(2);

  return `${dateStr}_${cleanProveedor}_${cleanNum}_${totalStr}€.pdf`;
}

/**
 * Convierte un buffer de imagen (JPG/PNG) en un PDF homogéneo para Google Drive
 */
export async function convertImageBufferToPdf(imgBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ autoFirstPage: false });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const img = (doc as any).openImage(imgBuffer);
      doc.addPage({ size: [img.width, img.height], margin: 0 });
      doc.image(img as any, 0, 0);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Determina si un buffer es nativamente PDF inspeccionando su cabecera (%PDF-)
 */
function isPdfBuffer(buffer: Buffer): boolean {
  if (buffer.length < 5) return false;
  return buffer.toString("utf8", 0, 5).startsWith("%PDF");
}

/**
 * Sube una factura de compra a Google Drive clasificada por trimestre contable
 */
export async function uploadFacturaToDrive({
  fechaEmision,
  proveedor,
  numeroFactura,
  totalFactura,
  fileBuffer,
  customFileName,
}: {
  fechaEmision: Date | string;
  proveedor: string;
  numeroFactura: string;
  totalFactura: number;
  fileBuffer: Buffer;
  customFileName?: string;
}): Promise<{
  fileId: string;
  webViewLink: string;
  fileName: string;
  folderName: string;
}> {
  const { quarterKey, folderName } = getQuarterInfo(fechaEmision);

  // Resolver ID de la carpeta trimestral (o carpeta general si es un año no registrado)
  const targetFolderId = KNOWN_QUARTER_FOLDERS[quarterKey] || GOOGLE_DRIVE_FACTURAS_FOLDER_ID;

  // Generar nombre estandarizado basado en la FECHA REAL de la factura
  const fileName =
    customFileName ||
    formatFacturaFileName({
      fechaEmision,
      proveedor,
      numeroFactura,
      totalFactura,
    });

  // Asegurar que el buffer sea un PDF válido (si es foto/ticket de móvil, lo convertimos a PDF)
  let finalPdfBuffer = fileBuffer;
  if (!isPdfBuffer(fileBuffer)) {
    try {
      finalPdfBuffer = await convertImageBufferToPdf(fileBuffer);
    } catch (convErr) {
      console.warn("[uploadFacturaToDrive] No se pudo convertir a PDF, subiendo buffer original", convErr);
      finalPdfBuffer = fileBuffer;
    }
  }

  const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

  const payload = {
    folderId: targetFolderId,
    folderName,
    fileName,
    base64Pdf: finalPdfBuffer.toString("base64"),
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Error en el webhook de Google Drive (HTTP ${res.status})`);
  }

  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.error || "No se pudo subir la factura a Google Drive");
  }

  return {
    fileId: json.id,
    webViewLink: json.url,
    fileName,
    folderName,
  };
}
