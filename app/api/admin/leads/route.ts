import { prisma } from "@/lib/prisma";
import { normEmail, normPhone, normNombre } from "@/lib/clienteSync";

export async function GET() {
  try {
    const [clientes, reservas] = await Promise.all([
      prisma.cliente.findMany({ orderBy: { ultimaReserva: "desc" } }),
      prisma.reserva.findMany({
        select: { nombre: true, email: true, telefono: true, fecha: true, personas: true, seccion: true, estado: true },
      }),
    ]);

    // Índices para cruzar reservas → cliente
    const byEmail  = new Map<string, string>(); // email norm → clientKey
    const byPhone  = new Map<string, string>(); // phone norm → clientKey
    const byNombre = new Map<string, string>(); // nombre norm → clientKey

    for (const c of clientes) {
      if (c.email)    byEmail.set(normEmail(c.email)!,   c.clientKey);
      if (c.telefono) byPhone.set(normPhone(c.telefono)!, c.clientKey);
      byNombre.set(normNombre(c.nombre), c.clientKey);
    }

    // Acumular stats por clientKey
    const stats = new Map<string, {
      totalReservas: number; canceladas: number; noShows: number;
      asistidas: number; secciones: Set<string>;
    }>();

    for (const r of reservas) {
      const ek = normEmail(r.email);
      const pk = normPhone(r.telefono);
      const nk = normNombre(r.nombre);

      const clientKey = (ek && byEmail.get(ek))
        || (pk && byPhone.get(pk))
        || byNombre.get(nk);

      if (!clientKey) continue;

      if (!stats.has(clientKey)) {
        stats.set(clientKey, { totalReservas: 0, canceladas: 0, noShows: 0, asistidas: 0, secciones: new Set() });
      }
      const s = stats.get(clientKey)!;
      s.totalReservas++;
      s.secciones.add(r.seccion);
      if (r.estado.startsWith("cancelada") || r.estado === "cancelada") s.canceladas++;
      else if (r.estado === "no-show")   s.noShows++;
      else if (r.estado === "llego" || r.estado === "confirmada") s.asistidas++;
    }

    const result = clientes.map(c => {
      const s = stats.get(c.clientKey) ?? { totalReservas: 0, canceladas: 0, noShows: 0, asistidas: 0, secciones: new Set() };
      const pct = s.totalReservas > 0 ? Math.round((s.asistidas / s.totalReservas) * 100) : 0;
      return {
        nombre: c.nombre, email: c.email ?? "", telefono: c.telefono,
        clientKey: c.clientKey,
        totalReservas: s.totalReservas, canceladas: s.canceladas,
        noShows: s.noShows, pctAsistencia: pct,
        ultimaReserva: c.ultimaReserva ?? null,
        secciones: [...s.secciones],
      };
    }).sort((a, b) => b.totalReservas - a.totalReservas);

    return Response.json(result);
  } catch (e) {
    console.error(e);
    return Response.json([], { status: 200 });
  }
}
