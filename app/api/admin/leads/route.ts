import { prisma } from "@/lib/prisma";
import { normEmail, normPhone, normNombre, upsertCliente } from "@/lib/clienteSync";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  try {
    const [clientes, reservas, pedidos] = await Promise.all([
      prisma.cliente.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.reserva.findMany({
        select: { nombre: true, email: true, telefono: true, fecha: true, personas: true, seccion: true, estado: true },
      }),
      prisma.pedidos.findMany({
        select: { cliente_nombre: true, cliente_email: true, cliente_telefono: true, created_at: true },
      }),
    ]);

    // Índices para cruzar reservas y pedidos → cliente
    const byEmail  = new Map<string, string>();
    const byPhone  = new Map<string, string>();
    const byNombre = new Map<string, string>();
    const clientMap = new Map<string, typeof clientes[0]>();

    for (const c of clientes) {
      clientMap.set(c.clientKey, c);
      if (c.email)    byEmail.set(normEmail(c.email)!,   c.clientKey);
      if (c.telefono) byPhone.set(normPhone(c.telefono)!, c.clientKey);
      byNombre.set(normNombre(c.nombre), c.clientKey);
    }

    // Auto-detectar clientes de pedidos que no estén aún en la tabla Cliente
    for (const p of pedidos) {
      const ek = normEmail(p.cliente_email);
      const pk = normPhone(p.cliente_telefono);
      const nk = normNombre(p.cliente_nombre);
      const key = (ek && byEmail.get(ek)) || (pk && byPhone.get(pk)) || byNombre.get(nk);

      if (!key) {
        const newKey = ek || pk || nk;
        if (newKey) {
          upsertCliente({
            nombre: p.cliente_nombre,
            email: p.cliente_email,
            telefono: p.cliente_telefono,
            fecha: p.created_at,
            tipo: "pedido",
          }).catch(console.error);

          if (ek) byEmail.set(ek, newKey);
          if (pk) byPhone.set(pk, newKey);
          byNombre.set(nk, newKey);
          clientMap.set(newKey, {
            id: -1,
            clientKey: newKey,
            nombre: p.cliente_nombre,
            email: p.cliente_email,
            telefono: p.cliente_telefono,
            primeraReserva: null,
            ultimaReserva: null,
            totalReservas: 0,
            totalPedidos: 1,
            createdAt: p.created_at || new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    // Acumular stats de reservas por clientKey
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
      if (r.seccion) s.secciones.add(r.seccion);
      if (r.estado.startsWith("cancelada") || r.estado === "cancelada") s.canceladas++;
      else if (r.estado === "no-show")   s.noShows++;
      else if (r.estado === "llego" || r.estado === "confirmada") s.asistidas++;
    }

    // Contar pedidos reales por clientKey
    const pedidosStats = new Map<string, number>();
    for (const p of pedidos) {
      const ek = normEmail(p.cliente_email);
      const pk = normPhone(p.cliente_telefono);
      const nk = normNombre(p.cliente_nombre);
      const clientKey = (ek && byEmail.get(ek)) || (pk && byPhone.get(pk)) || byNombre.get(nk);
      if (clientKey) {
        pedidosStats.set(clientKey, (pedidosStats.get(clientKey) || 0) + 1);
      }
    }

    const result = Array.from(clientMap.values()).map(c => {
      const s = stats.get(c.clientKey) ?? { totalReservas: 0, canceladas: 0, noShows: 0, asistidas: 0, secciones: new Set<string>() };
      const totalPedidosReal = Math.max(c.totalPedidos ?? 0, pedidosStats.get(c.clientKey) ?? 0);
      if (totalPedidosReal > 0) {
        s.secciones.add("sushi");
      }
      const pct = s.totalReservas > 0 ? Math.round((s.asistidas / s.totalReservas) * 100) : 0;
      return {
        nombre: c.nombre, email: c.email ?? "", telefono: c.telefono,
        clientKey: c.clientKey,
        totalReservas: s.totalReservas, canceladas: s.canceladas,
        totalPedidos: totalPedidosReal,
        noShows: s.noShows, pctAsistencia: pct,
        ultimaReserva: c.ultimaReserva ?? null,
        secciones: [...s.secciones],
      };
    }).sort((a, b) => (b.totalReservas + b.totalPedidos) - (a.totalReservas + a.totalPedidos));

    return Response.json(result);
  } catch (e) {
    console.error("[leads]", e);
    return Response.json({ error: "Error al cargar leads" }, { status: 500 });
  }
}

