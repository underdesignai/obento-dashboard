import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getSessionRole, deny403 } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  try {
    const { searchParams } = new URL(req.url);
    const tipo = (searchParams.get("tipo") || searchParams.get("modo") || "semanal") as "diario" | "semanal" | "mensual";
    const fechaParam = searchParams.get("fecha");
    const repartidorFiltro = searchParams.get("repartidor") || "";
    const cpFiltro = searchParams.get("cp") || "";

    const refDate = fechaParam ? new Date(fechaParam) : new Date();
    if (isNaN(refDate.getTime())) {
      return Response.json({ error: "Fecha inválida" }, { status: 400 });
    }

    let startDate: Date;
    let endDate: Date;

    if (tipo === "diario") {
      startDate = new Date(refDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(refDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (tipo === "mensual") {
      startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      // Semanal: Lunes a Domingo
      const d = new Date(refDate);
      const day = d.getDay(); // 0 is Sun, 1 is Mon...
      const diffToMonday = day === 0 ? -6 : 1 - day;
      startDate = new Date(d);
      startDate.setDate(d.getDate() + diffToMonday);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    // Consulta de pedidos (incluyendo domicilio o todos si no hay domicilio para testing)
    const whereClause: any = {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (repartidorFiltro) {
      whereClause.repartidor_nombre = { contains: repartidorFiltro, mode: "insensitive" };
    }

    if (cpFiltro) {
      whereClause.codigo_postal = { contains: cpFiltro };
    }

    const [todosPedidos, usuariosRepartidores] = await Promise.all([
      prisma.pedidos.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        include: {
          pedido_items: true,
        },
      }),
      prisma.usuario.findMany({
        where: { activo: true },
        select: { id: true, username: true, rol: true },
      }),
    ]);

    // Filtrar solo los de delivery/domicilio si existen, o si no hay ninguno marcado como delivery, mostrar todos para no dejar la vista vacía
    const tieneDomicilio = todosPedidos.some(p => p.tipo_entrega === "domicilio" || p.tipo_entrega === "delivery");
    const pedidos = tieneDomicilio
      ? todosPedidos.filter(p => p.tipo_entrega === "domicilio" || p.tipo_entrega === "delivery")
      : todosPedidos;

    // Métricas principales
    const totalRepartos = pedidos.length;
    const entregados = pedidos.filter(p => p.estado_pedido === "entregado").length;
    const enReparto = pedidos.filter(p => p.estado_pedido === "en_reparto").length;
    const pendientes = pedidos.filter(p => p.estado_pedido === "recibido" || p.estado_pedido === "preparando" || p.estado_pedido === "nuevo").length;
    const cancelados = pedidos.filter(p => p.estado_pedido === "cancelado").length;

    const facturacionTotal = pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);
    const ticketMedio = totalRepartos > 0 ? facturacionTotal / totalRepartos : 0;

    // Liquidación efectivo vs tarjeta
    const efectivoALiquidar = pedidos
      .filter(p => p.metodo_pago === "local" || p.metodo_pago === "restaurante")
      .reduce((acc, p) => acc + Number(p.total || 0), 0);

    const tarjetaOnline = pedidos
      .filter(p => p.metodo_pago === "stripe" || p.metodo_pago === "online" || p.metodo_pago === "tarjeta")
      .reduce((acc, p) => acc + Number(p.total || 0), 0);

    // Tiempos de entrega
    const pedidosConTiempo = pedidos.filter(p => p.tiempo_entrega_minutos && p.tiempo_entrega_minutos > 0);
    const tiempoMedio = pedidosConTiempo.length > 0
      ? Math.round(pedidosConTiempo.reduce((acc, p) => acc + (p.tiempo_entrega_minutos || 0), 0) / pedidosConTiempo.length)
      : 25; // default 25m

    // Desglose por días de la semana (Lunes a Domingo)
    const diasNombres = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const semanaInicio = new Date(startDate);
    const diasSemana = diasNombres.map((nombre, idx) => {
      const curDate = new Date(semanaInicio);
      curDate.setDate(semanaInicio.getDate() + idx);
      const y = curDate.getFullYear();
      const m = String(curDate.getMonth() + 1).padStart(2, "0");
      const d = String(curDate.getDate()).padStart(2, "0");
      const isoDate = `${y}-${m}-${d}`;

      const pedidosDelDia = pedidos.filter(p => {
        if (!p.created_at) return false;
        const pDate = new Date(p.created_at);
        return (
          pDate.getFullYear() === curDate.getFullYear() &&
          pDate.getMonth() === curDate.getMonth() &&
          pDate.getDate() === curDate.getDate()
        );
      });

      const mediodia = pedidosDelDia.filter(p => {
        const hour = p.created_at ? new Date(p.created_at).getHours() : 0;
        return hour >= 12 && hour < 17;
      }).length;

      const noche = pedidosDelDia.filter(p => {
        const hour = p.created_at ? new Date(p.created_at).getHours() : 0;
        return hour >= 19 || hour < 4;
      }).length;

      return {
        dia: nombre,
        fecha: isoDate,
        total: pedidosDelDia.length,
        facturacion: pedidosDelDia.reduce((s, p) => s + Number(p.total || 0), 0),
        mediodia,
        noche,
      };
    });

    // Desglose por códigos postales / zonas
    const cpMap = new Map<string, { cp: string; total: number; facturacion: number }>();
    for (const p of pedidos) {
      const cp = p.codigo_postal || "Sin C.P.";
      if (!cpMap.has(cp)) {
        cpMap.set(cp, { cp, total: 0, facturacion: 0 });
      }
      const item = cpMap.get(cp)!;
      item.total++;
      item.facturacion += Number(p.total || 0);
    }
    const zonasCP = Array.from(cpMap.values()).sort((a, b) => b.total - a.total);

    // Rendimiento por repartidor
    const repMap = new Map<string, {
      nombre: string;
      total: number;
      entregados: number;
      enReparto: number;
      efectivo: number;
      tiempoPromedio: number;
      tiempos: number[];
    }>();

    for (const p of pedidos) {
      const rep = p.repartidor_nombre || "Sin Asignar";
      if (!repMap.has(rep)) {
        repMap.set(rep, {
          nombre: rep,
          total: 0,
          entregados: 0,
          enReparto: 0,
          efectivo: 0,
          tiempoPromedio: 0,
          tiempos: [],
        });
      }
      const r = repMap.get(rep)!;
      r.total++;
      if (p.estado_pedido === "entregado") r.entregados++;
      if (p.estado_pedido === "en_reparto") r.enReparto++;
      if (p.metodo_pago === "local" || p.metodo_pago === "restaurante") {
        r.efectivo += Number(p.total || 0);
      }
      if (p.tiempo_entrega_minutos && p.tiempo_entrega_minutos > 0) {
        r.tiempos.push(p.tiempo_entrega_minutos);
      }
    }

    const rendimientoRepartidores = Array.from(repMap.values()).map(r => ({
      nombre: r.nombre,
      total: r.total,
      entregados: r.entregados,
      enReparto: r.enReparto,
      efectivo: r.efectivo,
      tiempoPromedio: r.tiempos.length > 0
        ? Math.round(r.tiempos.reduce((a, b) => a + b, 0) / r.tiempos.length)
        : 22,
    })).sort((a, b) => b.total - a.total);

    // Lista de repartidores únicos para selector
    const repartidoresDisponibles = Array.from(new Set([
      ...usuariosRepartidores.map(u => u.username),
      ...pedidos.map(p => p.repartidor_nombre).filter(Boolean) as string[],
    ]));

    return Response.json({
      tipo,
      periodo: {
        inicio: startDate.toISOString(),
        fin: endDate.toISOString(),
      },
      kpis: {
        totalRepartos,
        entregados,
        enReparto,
        pendientes,
        cancelados,
        facturacionTotal,
        ticketMedio,
        tiempoMedio,
        efectivoALiquidar,
        tarjetaOnline,
      },
      diasSemana,
      zonasCP,
      rendimientoRepartidores,
      repartidoresDisponibles,
      pedidos: pedidos.map(p => ({
        id: p.id,
        numero_pedido: p.numero_pedido,
        cliente_nombre: p.cliente_nombre,
        cliente_telefono: p.cliente_telefono,
        cliente_email: p.cliente_email,
        direccion_entrega: p.direccion_entrega,
        direccion_detalles: p.direccion_detalles,
        codigo_postal: p.codigo_postal,
        repartidor_id: p.repartidor_id,
        repartidor_nombre: p.repartidor_nombre,
        fecha_salida_reparto: p.fecha_salida_reparto,
        fecha_entregado: p.fecha_entregado,
        tiempo_entrega_minutos: p.tiempo_entrega_minutos,
        total: Number(p.total),
        metodo_pago: p.metodo_pago,
        estado_pago: p.estado_pago,
        estado_pedido: p.estado_pedido,
        created_at: p.created_at,
        itemsCount: p.pedido_items.length,
        itemsSummary: p.pedido_items.map(i => `${i.cantidad}× ${i.nombre}`).join(", "),
      })),
    });
  } catch (error) {
    console.error("[repartos GET]", error);
    return Response.json({ error: "Error al cargar datos de repartos" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await getSessionRole())) return deny403();

  try {
    const body = await req.json();
    const pedidoId = body.pedidoId || body.id;
    const repartidor_nombre = body.repartidor_nombre !== undefined ? body.repartidor_nombre : body.repartidor;
    const estado_pedido = body.estado_pedido !== undefined ? body.estado_pedido : body.estado;

    if (!pedidoId) {
      return Response.json({ error: "pedidoId es requerido" }, { status: 400 });
    }

    const current = await prisma.pedidos.findUnique({
      where: { id: Number(pedidoId) },
    });

    if (!current) {
      return Response.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const updateData: any = {};

    if (repartidor_nombre !== undefined) {
      updateData.repartidor_nombre = repartidor_nombre || null;
      updateData.repartidor_id = repartidor_nombre ? `rep_${repartidor_nombre.toLowerCase().replace(/\s+/g, "_")}` : null;
    }

    if (estado_pedido !== undefined) {
      updateData.estado_pedido = estado_pedido;

      if (estado_pedido === "en_reparto" && !current.fecha_salida_reparto) {
        updateData.fecha_salida_reparto = new Date();
      }

      if (estado_pedido === "entregado") {
        const fechaEntrega = new Date();
        updateData.fecha_entregado = fechaEntrega;
        const salida = current.fecha_salida_reparto || current.created_at || new Date();
        const diffMin = Math.max(1, Math.round((fechaEntrega.getTime() - new Date(salida).getTime()) / 60000));
        updateData.tiempo_entrega_minutos = diffMin;
      }
    }

    const updated = await prisma.pedidos.update({
      where: { id: Number(pedidoId) },
      data: updateData,
    });

    return Response.json({ ok: true, pedido: updated });
  } catch (error) {
    console.error("[repartos PATCH]", error);
    return Response.json({ error: "Error al actualizar pedido" }, { status: 500 });
  }
}
