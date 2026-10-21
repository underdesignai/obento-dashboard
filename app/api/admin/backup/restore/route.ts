import { NextRequest, NextResponse } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AdmZip = require("adm-zip");

function parseDateOrNull(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parseDate(val: any): Date {
  return parseDateOrNull(val) || new Date();
}

export async function POST(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  let zipBuffer: Buffer | null = null;

  // Se puede enviar un archivo en multipart/form-data o un JSON con { filename } para restaurar de los backups locales
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, message: "No se recibió archivo de copia de seguridad." }, { status: 400 });
    }
    zipBuffer = Buffer.from(await file.arrayBuffer());
  } else if (contentType.includes("application/json")) {
    const { filename } = await req.json();
    if (!filename) {
      return NextResponse.json({ ok: false, message: "Nombre de archivo requerido." }, { status: 400 });
    }
    const safeName = path.basename(filename);
    const filepath = path.join(process.cwd(), "backups", safeName);
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ ok: false, message: "El archivo de backup no existe en el servidor." }, { status: 404 });
    }
    zipBuffer = fs.readFileSync(filepath);
  } else {
    return NextResponse.json({ ok: false, message: "Formato de solicitud no soportado." }, { status: 400 });
  }

  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries() as { entryName: string; getData: () => Buffer; isDirectory: boolean }[];

  const restored: string[] = [];
  const errors: string[] = [];

  // Mapear entradas de BD
  const dbEntries = entries.filter((e) => !e.isDirectory && e.entryName.startsWith("db/") && e.entryName.endsWith(".json"));
  const dataMap: Record<string, any[]> = {};

  for (const entry of dbEntries) {
    const key = path.basename(entry.entryName, ".json");
    try {
      const parsed = JSON.parse(entry.getData().toString("utf-8"));
      if (Array.isArray(parsed)) {
        dataMap[key] = parsed;
      }
    } catch (err: any) {
      errors.push(`JSON corrupto en ${entry.entryName}: ${err.message}`);
    }
  }

  // --- ORDEN ESTRICTO DE RESTAURACIÓN RESPETANDO FOREIGN KEYS ---

  // 1. USUARIOS
  if (dataMap["usuarios"]) {
    try {
      const items = dataMap["usuarios"];
      await prisma.usuario.deleteMany();
      if (items.length > 0) {
        const clean = items.map((u) => ({
          ...u,
          createdAt: parseDate(u.createdAt),
        }));
        await prisma.usuario.createMany({ data: clean, skipDuplicates: true });
      }
      restored.push(`Usuarios (${items.length})`);
    } catch (e: any) {
      errors.push(`Usuarios: ${e.message}`);
    }
  }

  // 2. CONFIGURACIÓN Y TEMAS
  if (dataMap["configuracion"]) {
    try {
      const items = dataMap["configuracion"];
      for (const c of items) {
        if (!c.clave) continue;
        await prisma.configuracion.upsert({
          where: { clave: c.clave },
          update: { valor: String(c.valor ?? "") },
          create: { clave: c.clave, valor: String(c.valor ?? "") },
        });
      }
      restored.push(`Configuración & Temas (${items.length})`);
    } catch (e: any) {
      errors.push(`Configuración: ${e.message}`);
    }
  }

  // 3. PLATOS / CARTA
  if (dataMap["platos"]) {
    try {
      const items = dataMap["platos"];
      // Borrar escandallos previos que puedan depender de MenuItem
      await prisma.escandalloIngrediente.deleteMany().catch(() => {});
      await prisma.menuItem.deleteMany();
      if (items.length > 0) {
        const clean = items.map((p) => ({
          ...p,
          createdAt: parseDate(p.createdAt),
          updatedAt: parseDate(p.updatedAt),
        }));
        await prisma.menuItem.createMany({ data: clean, skipDuplicates: true });
      }
      restored.push(`Carta / Platos (${items.length})`);
    } catch (e: any) {
      errors.push(`Carta / Platos: ${e.message}`);
    }
  }

  // 4. STOCK / ALMACÉN (StockItem, StockMovimiento, MermaItem)
  if (dataMap["stock_items"]) {
    try {
      const stockItems = dataMap["stock_items"];
      // Borrar tablas hijas primero
      await prisma.stockMovimiento.deleteMany().catch(() => {});
      await prisma.mermaItem.deleteMany().catch(() => {});
      await prisma.facturaItem.deleteMany().catch(() => {});
      await prisma.escandalloIngrediente.deleteMany().catch(() => {});
      await prisma.stockItem.deleteMany();

      if (stockItems.length > 0) {
        const cleanStock = stockItems.map((s) => ({
          ...s,
          createdAt: parseDate(s.createdAt),
          updatedAt: parseDate(s.updatedAt),
        }));
        await prisma.stockItem.createMany({ data: cleanStock, skipDuplicates: true });
      }
      restored.push(`Stock Almacén (${stockItems.length})`);

      // Restaurar Movimientos de Stock
      if (dataMap["stock_movimientos"]) {
        const movs = dataMap["stock_movimientos"];
        const cleanMovs = movs.map((m) => ({
          ...m,
          fecha: parseDate(m.fecha),
        }));
        if (cleanMovs.length > 0) {
          await prisma.stockMovimiento.createMany({ data: cleanMovs, skipDuplicates: true });
        }
        restored.push(`Movimientos de Stock (${cleanMovs.length})`);
      }

      // Restaurar Mermas
      if (dataMap["merma_items"]) {
        const mermas = dataMap["merma_items"];
        const cleanMermas = mermas.map((m) => ({
          ...m,
          fecha: parseDate(m.fecha),
        }));
        if (cleanMermas.length > 0) {
          await prisma.mermaItem.createMany({ data: cleanMermas, skipDuplicates: true });
        }
        restored.push(`Mermas (${cleanMermas.length})`);
      }
    } catch (e: any) {
      errors.push(`Stock / Almacén: ${e.message}`);
    }
  }

  // 5. ESCANDALLOS
  if (dataMap["escandallos"]) {
    try {
      const escandallos = dataMap["escandallos"];
      await prisma.escandalloIngrediente.deleteMany();
      if (escandallos.length > 0) {
        await prisma.escandalloIngrediente.createMany({ data: escandallos, skipDuplicates: true });
      }
      restored.push(`Escandallos (${escandallos.length})`);
    } catch (e: any) {
      errors.push(`Escandallos: ${e.message}`);
    }
  }

  // 6. FACTURAS DE COMPRAS
  if (dataMap["facturas"]) {
    try {
      const facturas = dataMap["facturas"];
      await prisma.facturaItem.deleteMany().catch(() => {});
      await prisma.factura.deleteMany();

      let facturasInsertadas = 0;
      let itemsInsertados = 0;

      for (const f of facturas) {
        const { items: fItems, ...facturaData } = f;
        const createdFactura = await prisma.factura.create({
          data: {
            ...facturaData,
            fechaEmision: parseDate(facturaData.fechaEmision),
            fechaRegistro: parseDate(facturaData.fechaRegistro),
            createdAt: parseDate(facturaData.createdAt),
            updatedAt: parseDate(facturaData.updatedAt),
          },
        });
        facturasInsertadas++;

        if (Array.isArray(fItems) && fItems.length > 0) {
          const cleanItems = fItems.map((fi: any) => ({
            ...fi,
            facturaId: createdFactura.id,
          }));
          await prisma.facturaItem.createMany({ data: cleanItems, skipDuplicates: true });
          itemsInsertados += cleanItems.length;
        }
      }
      restored.push(`Facturas (${facturasInsertadas} facturas, ${itemsInsertados} líneas)`);
    } catch (e: any) {
      errors.push(`Facturas: ${e.message}`);
    }
  }

  // 7. PEDIDOS Y LÍNEAS DE PEDIDO
  if (dataMap["pedidos"]) {
    try {
      const pedidos = dataMap["pedidos"];
      await prisma.pedido_items.deleteMany().catch(() => {});
      await prisma.pedidos.deleteMany();

      let pedidosInsertados = 0;
      let lineasInsertadas = 0;

      for (const p of pedidos) {
        const { pedido_items: pItems, ...pedidoData } = p;
        const createdPedido = await prisma.pedidos.create({
          data: {
            ...pedidoData,
            fecha_salida_reparto: parseDateOrNull(pedidoData.fecha_salida_reparto),
            fecha_entregado: parseDateOrNull(pedidoData.fecha_entregado),
            created_at: parseDateOrNull(pedidoData.created_at) || new Date(),
            updated_at: parseDateOrNull(pedidoData.updated_at) || new Date(),
          },
        });
        pedidosInsertados++;

        if (Array.isArray(pItems) && pItems.length > 0) {
          const cleanPItems = pItems.map((it: any) => {
            const { id, ...itemWithoutId } = it;
            return {
              ...itemWithoutId,
              pedido_id: createdPedido.id,
            };
          });
          await prisma.pedido_items.createMany({ data: cleanPItems, skipDuplicates: true });
          lineasInsertadas += cleanPItems.length;
        }
      }
      restored.push(`Pedidos (${pedidosInsertados} pedidos, ${lineasInsertadas} líneas)`);
    } catch (e: any) {
      errors.push(`Pedidos: ${e.message}`);
    }
  }

  // 8. CLIENTES Y CLIENTE_TAGS
  if (dataMap["clientes"]) {
    try {
      const clientes = dataMap["clientes"];
      await prisma.clienteTag.deleteMany().catch(() => {});
      await prisma.cliente.deleteMany();

      if (clientes.length > 0) {
        const cleanClientes = clientes.map((c) => ({
          ...c,
          primeraReserva: parseDateOrNull(c.primeraReserva),
          ultimaReserva: parseDateOrNull(c.ultimaReserva),
          createdAt: parseDate(c.createdAt),
          updatedAt: parseDate(c.updatedAt),
        }));
        await prisma.cliente.createMany({ data: cleanClientes, skipDuplicates: true });
      }
      restored.push(`Clientes (${clientes.length})`);

      if (dataMap["cliente_tags"]) {
        const tags = dataMap["cliente_tags"];
        const cleanTags = tags.map((t) => ({
          ...t,
          createdAt: parseDate(t.createdAt),
        }));
        if (cleanTags.length > 0) {
          await prisma.clienteTag.createMany({ data: cleanTags, skipDuplicates: true });
        }
        restored.push(`Etiquetas de Clientes (${cleanTags.length})`);
      }
    } catch (e: any) {
      errors.push(`Clientes: ${e.message}`);
    }
  }

  // 9. CUPONES Y OFERTAS
  if (dataMap["cupones"]) {
    try {
      const cupones = dataMap["cupones"];
      await prisma.cupon.deleteMany();
      if (cupones.length > 0) {
        const cleanCupones = cupones.map((c) => ({
          ...c,
          createdAt: parseDate(c.createdAt),
        }));
        await prisma.cupon.createMany({ data: cleanCupones, skipDuplicates: true });
      }
      restored.push(`Cupones (${cupones.length})`);
    } catch (e: any) {
      errors.push(`Cupones: ${e.message}`);
    }
  }
  if (dataMap["ofertas"]) {
    try {
      const ofertas = dataMap["ofertas"];
      await prisma.oferta.deleteMany();
      if (ofertas.length > 0) {
        const cleanOfertas = ofertas.map((o) => ({
          ...o,
          createdAt: parseDate(o.createdAt),
        }));
        await prisma.oferta.createMany({ data: cleanOfertas, skipDuplicates: true });
      }
      restored.push(`Ofertas (${ofertas.length})`);
    } catch (e: any) {
      errors.push(`Ofertas: ${e.message}`);
    }
  }

  // 10. ANALYTICS & VISITAS
  if (dataMap["analytics_events"]) {
    try {
      const evs = dataMap["analytics_events"];
      await prisma.analyticsEvent.deleteMany();
      if (evs.length > 0) {
        const cleanEvs = evs.map((e) => ({
          ...e,
          createdAt: parseDate(e.createdAt),
        }));
        await prisma.analyticsEvent.createMany({ data: cleanEvs, skipDuplicates: true });
      }
      restored.push(`Eventos Analítica (${evs.length})`);
    } catch (e: any) {
      errors.push(`Analítica: ${e.message}`);
    }
  }
  if (dataMap["visitas"]) {
    try {
      const visitas = dataMap["visitas"];
      await prisma.visita.deleteMany();
      if (visitas.length > 0) {
        const cleanVisitas = visitas.map((v) => ({
          ...v,
          createdAt: parseDate(v.createdAt),
        }));
        await prisma.visita.createMany({ data: cleanVisitas, skipDuplicates: true });
      }
      restored.push(`Visitas (${visitas.length})`);
    } catch (e: any) {
      errors.push(`Visitas: ${e.message}`);
    }
  }

  // 11. RESERVAS Y SERVICIOS
  if (dataMap["reservas"]) {
    try {
      const reservas = dataMap["reservas"];
      await prisma.reserva.deleteMany();
      if (reservas.length > 0) {
        const cleanReservas = reservas.map((r) => ({
          ...r,
          fecha: parseDate(r.fecha),
          createdAt: parseDate(r.createdAt),
        }));
        await prisma.reserva.createMany({ data: cleanReservas, skipDuplicates: true });
      }
      restored.push(`Reservas (${reservas.length})`);
    } catch (e: any) {
      errors.push(`Reservas: ${e.message}`);
    }
  }
  if (dataMap["reserva_servicios"]) {
    try {
      const servs = dataMap["reserva_servicios"];
      await prisma.reservaServicio.deleteMany();
      if (servs.length > 0) {
        const cleanServs = servs.map((s) => ({
          ...s,
          fecha: parseDate(s.fecha),
          createdAt: parseDate(s.createdAt),
        }));
        await prisma.reservaServicio.createMany({ data: cleanServs, skipDuplicates: true });
      }
      restored.push(`Servicios / Catering (${servs.length})`);
    } catch (e: any) {
      errors.push(`Servicios: ${e.message}`);
    }
  }

  // 12. REVIEWS / RESEÑAS
  const reviewsData = dataMap["reviews"] || dataMap["reseñas"];
  if (reviewsData) {
    try {
      await prisma.review.deleteMany();
      if (reviewsData.length > 0) {
        const cleanReviews = reviewsData.map((r) => ({
          ...r,
          createdAt: parseDate(r.createdAt),
        }));
        await prisma.review.createMany({ data: cleanReviews, skipDuplicates: true });
      }
      restored.push(`Reseñas (${reviewsData.length})`);
    } catch (e: any) {
      errors.push(`Reseñas: ${e.message}`);
    }
  }

  // 13. GALERÍA DE FOTOS
  if (dataMap["galeria_fotos"] || dataMap["galeria"]) {
    try {
      const gFotos = dataMap["galeria_fotos"] || dataMap["galeria"];
      await prisma.galeriaFoto.deleteMany();
      if (gFotos.length > 0) {
        const cleanFotos = gFotos.map((f) => ({
          ...f,
          createdAt: parseDate(f.createdAt),
        }));
        await prisma.galeriaFoto.createMany({ data: cleanFotos, skipDuplicates: true });
      }
      restored.push(`Galería Fotos (${gFotos.length})`);
    } catch (e: any) {
      errors.push(`Galería: ${e.message}`);
    }
  }

  // --- RESTAURAR ARCHIVOS PÚBLICOS ---
  const publicDir = path.join(process.cwd(), "public");
  const fileEntries = entries.filter((e) => !e.isDirectory && e.entryName.startsWith("files/"));

  let filesRestaurados = 0;
  for (const entry of fileEntries) {
    try {
      const rel = entry.entryName.replace(/^files\//, "");
      const dest = path.join(publicDir, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, entry.getData());
      filesRestaurados++;
    } catch (e: any) {
      errors.push(`Archivo ${entry.entryName}: ${e.message}`);
    }
  }
  if (filesRestaurados > 0) {
    restored.push(`Archivos públicos multimedia (${filesRestaurados})`);
  }

  const ok = errors.length === 0;
  const message = ok
    ? `Copia restaurada con éxito total: ${restored.join(", ")}.`
    : `Restauración completada con observaciones (${restored.length} módulos OK, ${errors.length} fallos): ${errors.slice(0, 3).join("; ")}`;

  return NextResponse.json({
    ok,
    message,
    restored,
    errors,
  });
}
