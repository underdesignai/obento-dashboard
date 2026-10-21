const DEFAULT_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbzDf5pOfnSKAoRbskCJIpnbdStN9nnSbB2Jf9j3WuPhODNEWBxH_l3BpZanxGTdcT0O/exec";

// ID de la carpeta "03_Backups" dentro de "Obento - informes"
export const GOOGLE_DRIVE_BACKUPS_FOLDER_ID =
  process.env.GOOGLE_DRIVE_BACKUPS_FOLDER_ID || "1h-JOvARpVmdDj2yA4511ewxgi1jl9-Z3";

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  fileName: string;
  folderName: string;
}

/**
 * Sube un archivo ZIP de backup directamente a la carpeta "03_Backups" de Google Drive
 * a través del Google Apps Script webhook configurado.
 */
export async function uploadBackupToDrive({
  fileName,
  zipBuffer,
  folderName = "03_Backups",
  folderId = GOOGLE_DRIVE_BACKUPS_FOLDER_ID,
}: {
  fileName: string;
  zipBuffer: Buffer;
  folderName?: string;
  folderId?: string;
}): Promise<DriveUploadResult> {
  const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

  const payload = {
    folderId,
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
