import { NextRequest, NextResponse } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";
import fs from "fs";
import path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backups");

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  if (!(await getSessionRole())) return deny403();

  const { filename } = await params;
  const safe = path.basename(filename);
  const filepath = path.join(BACKUP_DIR, safe);

  if (!fs.existsSync(filepath)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = fs.readFileSync(filepath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safe}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
