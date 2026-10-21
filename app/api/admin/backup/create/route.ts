import { NextRequest, NextResponse } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    console.error("[backup/create] Error guardando registro de metadatos:", err);
  }
}

function addDirToZip(zip: InstanceType<typeof AdmZip>, dirPath: string, zipFolder: string) {
  if (!fs.existsSync(dirPath)) return;
  const walk = (dir: string, base: string) => {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const rel = path.join(base, entry);
      if (fs.statSync(full).isDirectory()) walk(full, rel);
      else zip.addFile(rel.replace(/\\/g, "/"), fs.readFileSync(full));
    }
  };
  walk(dirPath, zipFolder);
}

export async function POST(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  let body: { items?: string[]; uploadDrive?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const items = Array.isArray(body.items) && body.items.length > 0 ? body.items : [
    "pedidos",
    "platos",
    "escandallos",
    "stock",
    "facturas",
    "clientes",
    "cupones",
    "analytics",
    "configuracion",
    "usuarios",
    "reservas",
    "reseñas",
    "galeria",
  ];

  ensureBackupDir();

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const filename = `backup-obento-${ts}.zip`;
  const filepath = path.join(BACKUP_DIR, filename);

  const zip = new AdmZip();

  const addJson = (name: string, data: unknown) => {
    zip.addFile(`db/${name}.json`, Buffer.from(JSON.stringify(data, null, 2), "utf-8"));
  };

  const counts: Record<string, number> = {};

  // 1. Pedidos Take Away y a Domicilio con ítems desglosados
  if (items.includes("pedidos")) {
    const pedidos = await prisma.pedidos.findMany({
      include: { pedido_items: true },
      orderBy: { id: "desc" },
    }).catch(() => []);
    addJson("pedidos", pedidos);
    counts.pedidos = pedidos.length;
    let totalItems = 0;
    for (const p of pedidos) {
      if (Array.isArray(p.pedido_items)) totalItems += p.pedido_items.length;
    }
    counts.pedido_items = totalItems;
  }

  // 2. Carta & Platos
  if (items.includes("platos")) {
    const platos = await prisma.menuItem.findMany({ orderBy: { id: "asc" } }).catch(() => []);
    addJson("platos", platos);
    counts.platos = platos.length;
  }

  // 3. Escandallos e Ingredientes de Recetas
  if (items.includes("escandallos")) {
    const escandallos = await prisma.escandalloIngrediente.findMany({ orderBy: { id: "asc" } }).catch(() => []);
    addJson("escandallos", escandallos);
    counts.escandallos = escandallos.length;
  }

  // 4. Stock, Almacén, Movimientos y Mermas
  if (items.includes("stock")) {
    const stockItems = await prisma.stockItem.findMany({ orderBy: { id: "asc" } }).catch(() => []);
    const stockMovimientos = await prisma.stockMovimiento.findMany({ orderBy: { id: "desc" } }).catch(() => []);
    const mermaItems = await prisma.mermaItem.findMany({ orderBy: { id: "desc" } }).catch(() => []);
    addJson("stock_items", stockItems);
    addJson("stock_movimientos", stockMovimientos);
    addJson("merma_items", mermaItems);
    counts.stock_items = stockItems.length;
    counts.stock_movimientos = stockMovimientos.length;
    counts.mermas = mermaItems.length;
  }

  // 5. Facturas de Compras y Proveedores
  if (items.includes("facturas")) {
    const facturas = await prisma.factura.findMany({
      include: { items: true },
      orderBy: { id: "desc" },
    }).catch(() => []);
    addJson("facturas", facturas);
    counts.facturas = facturas.length;
  }

  // 6. Clientes y Etiquetas
  if (items.includes("clientes")) {
    const clientes = await prisma.cliente.findMany({ orderBy: { id: "asc" } }).catch(() => []);
    const clienteTags = await prisma.clienteTag.findMany().catch(() => []);
    addJson("clientes", clientes);
    addJson("cliente_tags", clienteTags);
    counts.clientes = clientes.length;
    counts.cliente_tags = clienteTags.length;
  }

  // 7. Cupones y Ofertas promocionales
  if (items.includes("cupones")) {
    const cupones = await prisma.cupon.findMany().catch(() => []);
    const ofertas = await prisma.oferta.findMany().catch(() => []);
    addJson("cupones", cupones);
    addJson("ofertas", ofertas);
    counts.cupones = cupones.length;
    counts.ofertas = ofertas.length;
  }

  // 8. Analítica web y visitas
  if (items.includes("analytics")) {
    const analytics = await prisma.analyticsEvent.findMany({ orderBy: { id: "desc" } }).catch(() => []);
    const visitas = await prisma.visita.findMany({ orderBy: { id: "desc" } }).catch(() => []);
    addJson("analytics_events", analytics);
    addJson("visitas", visitas);
    counts.analytics_events = analytics.length;
    counts.visitas = visitas.length;
  }

  // 9. Configuración del sistema, temas festivos, horarios, bots y pagos
  if (items.includes("configuracion")) {
    const config = await prisma.configuracion.findMany({ orderBy: { clave: "asc" } }).catch(() => []);
    addJson("configuracion", config);
    counts.configuracion = config.length;
  }

  // 10. Usuarios del dashboard
  if (items.includes("usuarios")) {
    const usuarios = await prisma.usuario.findMany({ orderBy: { id: "asc" } }).catch(() => []);
    addJson("usuarios", usuarios);
    counts.usuarios = usuarios.length;
  }

  // 11. Reservas de mesa y servicios especiales/catering
  if (items.includes("reservas")) {
    const reservas = await prisma.reserva.findMany({ orderBy: { id: "desc" } }).catch(() => []);
    const servicios = await prisma.reservaServicio.findMany({ orderBy: { id: "desc" } }).catch(() => []);
    addJson("reservas", reservas);
    addJson("reserva_servicios", servicios);
    counts.reservas = reservas.length;
    counts.reserva_servicios = servicios.length;
  }

  // 12. Reseñas y testimonios
  if (items.includes("reseñas")) {
    const reviews = await prisma.review.findMany({ orderBy: { id: "desc" } }).catch(() => []);
    addJson("reviews", reviews);
    counts.reviews = reviews.length;
  }

  // 13. Galería de fotos e imágenes
  if (items.includes("galeria")) {
    const galeria = await prisma.galeriaFoto.findMany({ orderBy: { orden: "asc" } }).catch(() => []);
    addJson("galeria_fotos", galeria);
    counts.galeria_fotos = galeria.length;
  }

  // 14. Archivos públicos multimedia (imágenes, vídeos y frames)
  const publicDir = path.join(process.cwd(), "public");
  if (items.includes("archivos") || items.includes("imagenes")) {
    addDirToZip(zip, path.join(publicDir, "images"), "files/images");
  }
  if (items.includes("archivos") || items.includes("videos")) {
    addDirToZip(zip, path.join(publicDir, "videos"), "files/videos");
    for (const v of ["video2.mp4", "video2-scrub.mp4", "oficial.mp4"]) {
      const vp = path.join(publicDir, v);
      if (fs.existsSync(vp)) zip.addFile(`files/${v}`, fs.readFileSync(vp));
    }
  }
  if (items.includes("archivos") || items.includes("frames")) {
    addDirToZip(zip, path.join(publicDir, "frames"), "files/frames");
  }

  // Metadata descriptiva del backup
  const metadata = {
    version: "2.0",
    appName: "Obento Japanese Food Dashboard",
    createdAt: now.toISOString(),
    filename,
    itemsIncluded: items,
    counts,
  };
  zip.addFile("metadata.json", Buffer.from(JSON.stringify(metadata, null, 2), "utf-8"));

  // Generar buffer y escribir a disco
  const zipBuffer = zip.toBuffer();
  fs.writeFileSync(filepath, zipBuffer);

  const stat = fs.statSync(filepath);

  // Subir automáticamente a Google Drive en la carpeta "Backups"
  let driveResult: { fileId?: string; webViewLink?: string; error?: string } = {};
  try {
    const driveUpload = await uploadBackupToDrive({
      fileName: filename,
      zipBuffer,
      folderName: "03_Backups",
    });
    driveResult = {
      fileId: driveUpload.fileId,
      webViewLink: driveUpload.webViewLink,
    };
  } catch (driveErr: any) {
    console.error("[backup/create] Error al subir a Google Drive:", driveErr);
    driveResult = {
      error: driveErr?.message || "No se pudo subir a Google Drive",
    };
  }

  // Guardar en el registro de metadatos persistente
  const registry = readMetadataRegistry();
  registry[filename] = {
    filename,
    size: stat.size,
    createdAt: now.toISOString(),
    items,
    counts,
    driveId: driveResult.fileId || null,
    driveUrl: driveResult.webViewLink || null,
    driveError: driveResult.error || null,
  };
  saveMetadataRegistry(registry);

  return NextResponse.json({
    ok: true,
    filename,
    size: stat.size,
    createdAt: now.toISOString(),
    counts,
    driveId: driveResult.fileId,
    driveUrl: driveResult.webViewLink,
    driveError: driveResult.error,
  });
}
