import { NextRequest, NextResponse } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";
import { uploadBackupToDrive } from "@/lib/googleDriveBackups";
import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AdmZip = require("adm-zip");

const BACKUP_DIR = path.join(process.cwd(), "backups");
const META_FILE = path.join(BACKUP_DIR, "backups-meta.json");

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function readMetadataRegistry(): Record<string, any> {
  ensureBackupDir();
  if (!fs.existsSync(META_FILE)) return {};
  try {
    const raw = fs.readFileSync(META_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveMetadataRegistry(meta: Record<string, any>) {
  ensureBackupDir();
  try {
    fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), "utf-8");
  } catch (err) {
    console.error("[backup/list] Error guardando metadatos:", err);
  }
}

export async function GET() {
  if (!(await getSessionRole())) return deny403();

  ensureBackupDir();

  const registry = readMetadataRegistry();
  const filesOnDisk = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".zip"));

  const list = filesOnDisk.map((filename) => {
    const filepath = path.join(BACKUP_DIR, filename);
    const stat = fs.statSync(filepath);
    const reg = registry[filename] || {};

    let counts = reg.counts;
    let items = reg.items;

    // Si no está registrado en el JSON, intentar leer metadata.json del ZIP
    if (!counts) {
      try {
        const zip = new AdmZip(filepath);
        const metaEntry = zip.getEntry("metadata.json");
        if (metaEntry) {
          const parsed = JSON.parse(metaEntry.getData().toString("utf-8"));
          counts = parsed.counts;
          items = parsed.itemsIncluded;
        }
      } catch {
        // archivo zip no legible
      }
    }

    return {
      filename,
      size: stat.size,
      createdAt: reg.createdAt || stat.mtime.toISOString(),
      driveUrl: reg.driveUrl || null,
      driveId: reg.driveId || null,
      driveError: reg.driveError || null,
      counts: counts || {},
      items: items || [],
    };
  });

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(list);
}

export async function DELETE(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  try {
    const { filename } = await req.json();
    if (!filename) {
      return NextResponse.json({ ok: false, message: "Nombre de archivo requerido" }, { status: 400 });
    }

    const safeName = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeName);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    const registry = readMetadataRegistry();
    if (registry[safeName]) {
      delete registry[safeName];
      saveMetadataRegistry(registry);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

// Endpoint para reintentar subir un backup a Google Drive
export async function POST(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  try {
    const { filename } = await req.json();
    if (!filename) {
      return NextResponse.json({ ok: false, message: "Nombre de archivo requerido" }, { status: 400 });
    }

    const safeName = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeName);
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ ok: false, message: "Archivo no encontrado" }, { status: 404 });
    }

    const zipBuffer = fs.readFileSync(filepath);
    const driveUpload = await uploadBackupToDrive({
      fileName: safeName,
      zipBuffer,
      folderName: "Backups",
    });

    const registry = readMetadataRegistry();
    if (!registry[safeName]) {
      const stat = fs.statSync(filepath);
      registry[safeName] = {
        filename: safeName,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
      };
    }

    registry[safeName].driveId = driveUpload.fileId;
    registry[safeName].driveUrl = driveUpload.webViewLink;
    registry[safeName].driveError = null;
    saveMetadataRegistry(registry);

    return NextResponse.json({
      ok: true,
      driveId: driveUpload.fileId,
      driveUrl: driveUpload.webViewLink,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
