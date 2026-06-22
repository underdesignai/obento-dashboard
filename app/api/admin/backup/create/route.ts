import { NextRequest, NextResponse } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AdmZip = require("adm-zip");

const BACKUP_DIR = path.join(process.cwd(), "backups");

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function addDirToZip(zip: InstanceType<typeof AdmZip>, dirPath: string, zipFolder: string) {
  if (!fs.existsSync(dirPath)) return;
  const walk = (dir: string, base: string) => {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const rel  = path.join(base, entry);
      if (fs.statSync(full).isDirectory()) walk(full, rel);
      else zip.addFile(rel.replace(/\\/g, "/"), fs.readFileSync(full));
    }
  };
  walk(dirPath, zipFolder);
}

export async function POST(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  const { items } = await req.json() as { items: string[] };

  ensureBackupDir();

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `backup-${ts}.zip`;
  const filepath = path.join(BACKUP_DIR, filename);

  const zip = new AdmZip();

  const addJson = (name: string, data: unknown) => {
    zip.addFile(`db/${name}.json`, Buffer.from(JSON.stringify(data, null, 2), "utf-8"));
  };

  if (items.includes("reservas"))      addJson("reservas",      await prisma.reserva.findMany());
  if (items.includes("pedidos"))       addJson("pedidos",       await prisma.pedido.findMany());
  if (items.includes("clientes"))      addJson("clientes",      await prisma.cliente.findMany());
  if (items.includes("reseñas"))       addJson("reseñas",       await prisma.review.findMany().catch(() => []));
  if (items.includes("cupones"))       addJson("cupones",       await prisma.cupon.findMany().catch(() => []));
  if (items.includes("configuracion")) addJson("configuracion", await prisma.configuracion.findMany());
  if (items.includes("usuarios"))      addJson("usuarios",      await prisma.usuario.findMany().catch(() => []));
  if (items.includes("platos"))        addJson("platos",        await prisma.menuItem.findMany().catch(() => []));
  if (items.includes("servicios"))     addJson("servicios",     await prisma.reservaServicio.findMany().catch(() => []));
  if (items.includes("galeria"))       addJson("galeria",       await prisma.galeriaFoto.findMany().catch(() => []));

  const publicDir = path.join(process.cwd(), "public");
  if (items.includes("imagenes")) addDirToZip(zip, path.join(publicDir, "images"), "files/images");
  if (items.includes("videos")) {
    addDirToZip(zip, path.join(publicDir, "videos"), "files/videos");
    for (const v of ["video2.mp4", "video2-scrub.mp4", "oficial.mp4"]) {
      const vp = path.join(publicDir, v);
      if (fs.existsSync(vp)) zip.addFile(`files/${v}`, fs.readFileSync(vp));
    }
  }
  if (items.includes("frames")) addDirToZip(zip, path.join(publicDir, "frames"), "files/frames");

  zip.writeZip(filepath);

  const stat = fs.statSync(filepath);
  return NextResponse.json({ ok: true, filename, size: stat.size });
}
