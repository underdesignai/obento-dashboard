#!/usr/bin/env node
// Script de backup semanal — ejecutado por cron en el VPS
// Crontab: 0 3 * * 0 node /var/www/coyo/scripts/backup-weekly.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const AdmZip = require("adm-zip");
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BACKUP_DIR = path.join(ROOT, "backups");
const MAX_BACKUPS = 8; // guardar máximo 8 semanas

const prisma = new PrismaClient();

async function run() {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `backup-auto-${ts}.zip`;
  const filepath = path.join(BACKUP_DIR, filename);

  console.log(`[backup] Creando ${filename}...`);

  const zip = new AdmZip();

  const addJson = (name, data) => {
    zip.addFile(`db/${name}.json`, Buffer.from(JSON.stringify(data, null, 2), "utf-8"));
  };

  const addDir = (dirPath, zipFolder) => {
    if (!fs.existsSync(dirPath)) return;
    const walk = (dir, base) => {
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const rel  = path.join(base, entry).replace(/\\/g, "/");
        if (fs.statSync(full).isDirectory()) walk(full, rel);
        else zip.addFile(rel, fs.readFileSync(full));
      }
    };
    walk(dirPath, zipFolder);
  };

  addJson("reservas",      await prisma.reserva.findMany());
  addJson("pedidos",       await prisma.pedido.findMany());
  addJson("clientes",      await prisma.cliente.findMany());
  addJson("reseñas",       await prisma.review.findMany().catch(() => []));
  addJson("cupones",       await prisma.cupon.findMany().catch(() => []));
  addJson("configuracion", await prisma.configuracion.findMany());
  addJson("usuarios",      await prisma.usuario.findMany().catch(() => []));
  addJson("platos",        await prisma.plato.findMany().catch(() => []));
  addJson("servicios",     await prisma.servicio.findMany().catch(() => []));

  const publicDir = path.join(ROOT, "public");
  addDir(path.join(publicDir, "images"), "files/images");
  addDir(path.join(publicDir, "videos"), "files/videos");

  zip.writeZip(filepath);

  const stat = fs.statSync(filepath);
  console.log(`[backup] Creado: ${filename} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);

  // Eliminar backups antiguos (mantener solo MAX_BACKUPS)
  const all = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith(".zip"))
    .map(f => ({ f, t: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
    .sort((a, b) => b.t - a.t);

  for (const { f } of all.slice(MAX_BACKUPS)) {
    fs.unlinkSync(path.join(BACKUP_DIR, f));
    console.log(`[backup] Eliminado backup antiguo: ${f}`);
  }

  await prisma.$disconnect();
  console.log("[backup] Completado.");
}

run().catch(e => { console.error("[backup] Error:", e); process.exit(1); });
