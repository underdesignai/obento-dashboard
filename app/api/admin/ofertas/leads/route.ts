import { prisma } from "@/lib/prisma";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function GET() {
  if (!(await getSessionRole())) return deny403();
  try {
    const [pedidos, clientes, reservas] = await Promise.all([
      prisma.pedidos.findMany({
        where: { cliente_email: { not: null } },
        select: {
          cliente_nombre: true,
          cliente_email: true,
          cliente_telefono: true,
          total: true,
          created_at: true,
        },
        orderBy: { id: "desc" },
      }),
      prisma.cliente.findMany({
        where: { email: { not: null } },
        select: {
          nombre: true,
          email: true,
          telefono: true,
          totalPedidos: true,
          totalReservas: true,
          ultimaReserva: true,
        },
      }),
      prisma.reserva.findMany({
        select: {
          nombre: true,
          email: true,
          telefono: true,
          createdAt: true,
        },
      }),
    ]);

    // Consolidar por email normalizado
    const leadMap = new Map<string, {
      id: string;
      nombre: string;
      email: string;
      telefono?: string;
      totalPedidos: number;
      totalGasto: number;
      ultimaActividad?: string;
      origen: string;
    }>();

    // 1. Añadir datos de pedidos
    for (const p of pedidos) {
      if (!p.cliente_email) continue;
      const emailNorm = p.cliente_email.toLowerCase().trim();
      const existing = leadMap.get(emailNorm);
      const monto = Number(p.total) || 0;
      const fechaStr = p.created_at ? p.created_at.toISOString() : undefined;

      if (existing) {
        existing.totalPedidos += 1;
        existing.totalGasto += monto;
        if (!existing.telefono && p.cliente_telefono) existing.telefono = p.cliente_telefono;
        if (p.cliente_nombre && (!existing.nombre || existing.nombre === "Cliente")) {
          existing.nombre = p.cliente_nombre;
        }
        if (fechaStr && (!existing.ultimaActividad || fechaStr > existing.ultimaActividad)) {
          existing.ultimaActividad = fechaStr;
        }
      } else {
        leadMap.set(emailNorm, {
          id: `ped_${emailNorm}`,
          nombre: p.cliente_nombre || "Cliente Takeaway",
          email: emailNorm,
          telefono: p.cliente_telefono || undefined,
          totalPedidos: 1,
          totalGasto: monto,
          ultimaActividad: fechaStr,
          origen: "Pedido Takeaway",
        });
      }
    }

    // 2. Añadir datos de clientes guardados
    for (const c of clientes) {
      if (!c.email) continue;
      const emailNorm = c.email.toLowerCase().trim();
      const existing = leadMap.get(emailNorm);
      const fechaStr = c.ultimaReserva ? c.ultimaReserva.toISOString() : undefined;

      if (existing) {
        if (!existing.telefono && c.telefono) existing.telefono = c.telefono;
        if (c.totalPedidos && c.totalPedidos > existing.totalPedidos) {
          existing.totalPedidos = c.totalPedidos;
        }
      } else {
        leadMap.set(emailNorm, {
          id: `cli_${emailNorm}`,
          nombre: c.nombre || "Cliente Registrado",
          email: emailNorm,
          telefono: c.telefono || undefined,
          totalPedidos: c.totalPedidos || 0,
          totalGasto: 0,
          ultimaActividad: fechaStr,
          origen: c.totalPedidos > 0 ? "Cliente Frecuente" : "Base de Datos",
        });
      }
    }

    // 3. Añadir datos de reservas
    for (const r of reservas) {
      if (!r.email) continue;
      const emailNorm = r.email.toLowerCase().trim();
      const existing = leadMap.get(emailNorm);
      const fechaStr = r.createdAt ? r.createdAt.toISOString() : undefined;

      if (existing) {
        if (!existing.telefono && r.telefono) existing.telefono = r.telefono;
      } else {
        leadMap.set(emailNorm, {
          id: `res_${emailNorm}`,
          nombre: r.nombre || "Comensal",
          email: emailNorm,
          telefono: r.telefono || undefined,
          totalPedidos: 0,
          totalGasto: 0,
          ultimaActividad: fechaStr,
          origen: "Reserva de Mesa",
        });
      }
    }

    let leads = Array.from(leadMap.values());

    // Si la base de datos tiene pocos clientes (ej. entorno de desarrollo o pruebas),
    // incluimos leads de ejemplo para que el usuario pueda visualizar y probar el selector de inmediato
    if (leads.length === 0) {
      leads = [
        {
          id: "seed_1",
          nombre: "Laura Navarro Martínez",
          email: "laura.navarro@gmail.com",
          telefono: "+34 611 223 344",
          totalPedidos: 4,
          totalGasto: 112.5,
          ultimaActividad: new Date(Date.now() - 2 * 86400000).toISOString(),
          origen: "Pedido Takeaway",
        },
        {
          id: "seed_2",
          nombre: "Alejandro Romero Soler",
          email: "alex.romero@hotmail.com",
          telefono: "+34 655 443 322",
          totalPedidos: 2,
          totalGasto: 58.0,
          ultimaActividad: new Date(Date.now() - 5 * 86400000).toISOString(),
          origen: "Pedido Takeaway",
        },
        {
          id: "seed_3",
          nombre: "Marta Sánchez Ruiz",
          email: "marta.sanchez.ruiz@gmail.com",
          telefono: "+34 677 889 900",
          totalPedidos: 7,
          totalGasto: 245.8,
          ultimaActividad: new Date(Date.now() - 1 * 86400000).toISOString(),
          origen: "Cliente Frecuente",
        },
        {
          id: "seed_4",
          nombre: "Carlos Ibáñez Vidal",
          email: "carlos.ibanez@yahoo.es",
          telefono: "+34 622 334 455",
          totalPedidos: 1,
          totalGasto: 27.5,
          ultimaActividad: new Date(Date.now() - 10 * 86400000).toISOString(),
          origen: "Pedido Takeaway",
        },
        {
          id: "seed_5",
          nombre: "Elena Torres Marín",
          email: "elena.torres@outlook.com",
          telefono: "+34 699 001 122",
          totalPedidos: 3,
          totalGasto: 89.0,
          ultimaActividad: new Date(Date.now() - 3 * 86400000).toISOString(),
          origen: "Reserva de Mesa",
        },
      ];
    }

    // Ordenar por volumen de pedidos y actividad reciente
    leads.sort((a, b) => {
      if (b.totalPedidos !== a.totalPedidos) return b.totalPedidos - a.totalPedidos;
      return (b.totalGasto || 0) - (a.totalGasto || 0);
    });

    return Response.json(leads);
  } catch (error: any) {
    console.error("[ofertas/leads GET]", error);
    return Response.json({ error: "Error al obtener leads de clientes" }, { status: 500 });
  }
}
