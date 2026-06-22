import { NextRequest, NextResponse } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AdmZip = require("adm-zip");

export async function POST(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, message: "No se recibió archivo." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries() as { entryName: string; getData: () => Buffer; isDirectory: boolean }[];

  const restored: string[] = [];
  const errors: string[] = [];

  // --- Restaurar tablas de BD ---
  const dbEntries = entries.filter(e => !e.isDirectory && e.entryName.startsWith("db/") && e.entryName.endsWith(".json"));

  for (const entry of dbEntries) {
    const tableName = path.basename(entry.entryName, ".json");
    try {
      const data = JSON.parse(entry.getData().toString("utf-8"));
      if (!Array.isArray(data)) continue;

      switch (tableName) {
        case "reservas":
          await prisma.reserva.deleteMany();
          if (data.length) await prisma.reserva.createMany({ data, skipDuplicates: true });
          break;
        case "pedidos":
          await prisma.pedido.deleteMany();
          if (data.length) await prisma.pedido.createMany({ data, skipDuplicates: true });
          break;
        case "clientes":
          await prisma.cliente.deleteMany();
          if (data.length) await prisma.cliente.createMany({ data, skipDuplicates: true });
          break;
        case "reseñas":
          await (prisma as any).review?.deleteMany();
          if (data.length) await (prisma as any).review?.createMany({ data, skipDuplicates: true });
          break;
        case "cupones":
          await (prisma as any).cupon?.deleteMany();
          if (data.length) await (prisma as any).cupon?.createMany({ data, skipDuplicates: true });
          break;
        case "configuracion":
          await prisma.configuracion.deleteMany();
          if (data.length) await prisma.configuracion.createMany({ data, skipDuplicates: true });
          break;
        case "usuarios":
          await (prisma as any).usuario?.deleteMany();
          if (data.length) await (prisma as any).usuario?.createMany({ data, skipDuplicates: true });
          break;
        case "platos":
          await (prisma as any).plato?.deleteMany();
          if (data.length) await (prisma as any).plato?.createMany({ data, skipDuplicates: true });
          break;
        case "servicios":
          await (prisma as any).servicio?.deleteMany();
          if (data.length) await (prisma as any).servicio?.createMany({ data, skipDuplicates: true });
          break;
        case "galeria":
          await (prisma as any).galeria?.deleteMany();
          if (data.length) await (prisma as any).galeria?.createMany({ data, skipDuplicates: true });
          break;
        default:
          continue;
      }
      restored.push(`BD:${tableName}`);
    } catch (e) {
      errors.push(`BD:${tableName} — ${(e as Error).message}`);
    }
  }

  // --- Restaurar archivos ---
  const publicDir = path.join(process.cwd(), "public");
  const fileEntries = entries.filter(e => !e.isDirectory && e.entryName.startsWith("files/"));

  for (const entry of fileEntries) {
    try {
      const rel = entry.entryName.replace(/^files\//, "");
      const dest = path.join(publicDir, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, entry.getData());
      restored.push(`file:${rel}`);
    } catch (e) {
      errors.push(`file:${entry.entryName} — ${(e as Error).message}`);
    }
  }

  const ok = errors.length === 0;
  const message = ok
    ? `Restauración completada. ${restored.length} elementos restaurados.`
    : `Restaurado con errores: ${restored.length} OK, ${errors.length} fallos. ${errors.slice(0, 3).join("; ")}`;

  return NextResponse.json({ ok, message, restored, errors });
}
