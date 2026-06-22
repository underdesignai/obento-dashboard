import { NextResponse } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";
import fs from "fs";
import path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backups");

export async function GET() {
  if (!(await getSessionRole())) return deny403();

  if (!fs.existsSync(BACKUP_DIR)) return NextResponse.json([]);

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith(".zip"))
    .map(f => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      return { filename: f, size: stat.size, createdAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(files);
}

export async function DELETE(req: Request) {
  if (!(await getSessionRole())) return deny403();
  const { filename } = await req.json();
  const filepath = path.join(BACKUP_DIR, path.basename(filename));
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  return NextResponse.json({ ok: true });
}
