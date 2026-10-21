const DEFAULT_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbzDf5pOfnSKAoRbskCJIpnbdStN9nnSbB2Jf9j3WuPhODNEWBxH_l3BpZanxGTdcT0O/exec";

// Carpeta raíz principal de Google Drive de Obento
export const GOOGLE_DRIVE_BACKUPS_PARENT_FOLDER_ID =
  process.env.GOOGLE_DRIVE_FOLDER_ID || "1D7Js-cGvqfdCPnTtdXm_m-VwmDC5-FaG";

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  fileName: string;
  folderName: string;
}

/**
 * Sube un archivo ZIP de backup a Google Drive dentro de la carpeta "Backups"
 * a través del Google Apps Script webhook configurado.
 */
export async function uploadBackupToDrive({
  fileName,
  zipBuffer,
  folderName = "Backups",
  parentFolderId = GOOGLE_DRIVE_BACKUPS_PARENT_FOLDER_ID,
}: {
  fileName: string;
  zipBuffer: Buffer;
  folderName?: string;
  parentFolderId?: string;
}): Promise<DriveUploadResult> {
  const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

  const payload = {
    folderId: parentFolderId,
    folderName,
    fileName,
    base64Pdf: zipBuffer.toString("base64"),
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
    throw new Error(json.error || "No se pudo subir la copia de seguridad a Google Drive");
  }

  return {
    fileId: json.id,
    webViewLink: json.url,
    fileName,
    folderName,
  };
}
