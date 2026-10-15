const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzDf5pOfnSKAoRbskCJIpnbdStN9nnSbB2Jf9j3WuPhODNEWBxH_l3BpZanxGTdcT0O/exec";
const DEFAULT_REPARTOS_FOLDER_ID = "1HuYV-Mvs4h-aOIvUJKCTaUjYNxxWG7zM";

export async function uploadPdfToDrive({
  folderName = "01_Repartos",
  fileName,
  pdfBuffer,
}: {
  folderName?: string;
  fileName: string;
  pdfBuffer: Buffer;
}): Promise<{ fileId: string; webViewLink: string }> {
  const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
  const folderId = process.env.GOOGLE_DRIVE_REPARTOS_FOLDER_ID || DEFAULT_REPARTOS_FOLDER_ID;

  const payload = {
    folderId,
    folderName,
    fileName,
    base64Pdf: pdfBuffer.toString("base64"),
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Error en el servidor de Google Drive (HTTP ${res.status})`);
  }

  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.error || "No se pudo subir el archivo a Google Drive");
  }

  return {
    fileId: json.id,
    webViewLink: json.url,
  };
}
