// Seed demo: borra reservas/pedidos existentes e inserta datos realistas
// Meses: mayo, junio, julio 2026 — todas confirmadas
import pg from "pg";
const { Client } = pg;

const DB = process.env.DATABASE_URL || "postgresql://postgres:719503847b004afa6626026d7800b915@13.140.161.167:5435/coyo_admin";

const NOMBRES = [
  "Claudia Paredes","Ignacio Ramos","Valentina Reyes","Bjorn Larsen",
  "Hanne Sørensen","Gabriela Ibáñez","Sergio Mendoza","Laura Jiménez",
  "Carlos Fuentes","María González","Erik Larsson","Sofía Martínez",
  "Lucas Fernández","Astrid Nilsen","Pablo Herrera","Ana Ruiz",
  "Miguel Torres","Carmen López","David Sánchez","Elena Moreno",
  "Javier Navarro","Isabel Castro","Andrés Molina","Patricia Vega",
  "Roberto Díaz","Lucía Vargas","Fernando Reyes","Natalia Guerrero",
  "Alejandro Peña","Cristina Ortiz","Manuel Flores","Pilar Romero",
  "Tomás Mendez","Sonia Alvarado","Guillermo Ríos","Marta Suárez",
  "Nicolas Blanco","Silvia Campos","Ricardo Aguilar","Beatriz Serrano",
];

const SECCIONES = ["sushi","sushi","sushi","mexican","mexican"];

const HORAS = ["13:00","13:30","14:00","14:30","15:00","20:00","20:30","21:00","21:30","22:00"];

const MENSAJES = [
  "Cumpleaños de mi mujer","Primera vez en el restaurante","Celebración familiar",
  "Aniversario","Somos celíacos, por favor avisar a cocina","Mesa junto a la ventana si es posible",
  "Alérgicos a los frutos secos","Reunión de empresa","Sin gluten para uno de los comensales",
  null,null,null,null,null,
];

const NOTAS = [
  "Sin cebolla por favor",
  "Alérgico al gluten, confirmar cocina",
  "Extra picante",
  "Sin gluten",
  "Sin soja en la salsa",
  "Muy poca sal",
  "Salsa aparte",
  "Doble de arroz",
  "Sin aguacate",
  "Sin cilantro",
  "Alérgico a los frutos secos",
  "Sin jalapeños",
  "Extra wasabi",
  "Sin sésamo",
  "Con extra de guacamole",
  null, null, null, null, null, null, null,
];

const PLATOS = [
  { id:148, name:"Nigiri de Salmón",      nameEn:"Salmon Nigiri",        price:145, concepto:"sushi",   image:"https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80" },
  { id:167, name:"Sashimi de Salmón",     nameEn:"Salmon Sashimi",       price:165, concepto:"sushi",   image:"https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80" },
  { id:138, name:"Coyo Sashimi",          nameEn:"Coyo Sashimi",         price:195, concepto:"sushi",   image:"https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80" },
  { id:139, name:"Chef's Mix 16 piezas",  nameEn:"Chef's Mix 16 pcs",    price:285, concepto:"sushi",   image:"https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80" },
  { id:164, name:"Spicy Maguro",          nameEn:"Spicy Maguro",         price:155, concepto:"sushi",   image:"https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80" },
  { id:157, name:"Maki de Salmón",        nameEn:"Salmon Maki",          price:135, concepto:"sushi",   image:"https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80" },
  { id:160, name:"California Maki",       nameEn:"California Maki",      price:125, concepto:"sushi",   image:"https://images.unsplash.com/photo-1562802378-063ec186a863?w=800&q=80" },
  { id:121, name:"Guacamole Clásico",     nameEn:"Classic Guacamole",    price:89,  concepto:"mexican", image:"https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80" },
  { id:127, name:"Taco de Pastor",        nameEn:"Pastor Taco",          price:135, concepto:"mexican", image:"https://images.unsplash.com/photo-1570461226513-e08b58a52c53?w=800&q=80" },
  { id:128, name:"Taco de Gambas",        nameEn:"Prawn Taco",           price:145, concepto:"mexican", image:"https://images.unsplash.com/photo-1604467794349-0b74285de7e7?w=800&q=80" },
  { id:130, name:"Tacos de Cerdo",        nameEn:"Pork Tacos",           price:135, concepto:"mexican", image:"https://images.unsplash.com/photo-1611250188496-e966043a0629?w=800&q=80" },
  { id:133, name:"Flautas de Res",        nameEn:"Beef Flautas",         price:165, concepto:"mexican", image:"https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&q=80" },
  { id:123, name:"Cheddar Nachos",        nameEn:"Cheddar Nachos",       price:95,  concepto:"mexican", image:"https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=800&q=80" },
  { id:131, name:"Quesabirrias",          nameEn:"Quesabirrias",         price:155, concepto:"mexican", image:"https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=800&q=80" },
];

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generarReservas() {
  const reservas = [];
  // Mayo 2026: días 2-30
  for (let dia = 2; dia <= 30; dia++) {
    const n = rndInt(6, 14);
    for (let i = 0; i < n; i++) {
      const hora = rnd(HORAS);
      const fecha = new Date(`2026-05-${String(dia).padStart(2,"0")}T${hora}:00`);
      reservas.push({
        nombre: rnd(NOMBRES),
        email: `demo${rndInt(1,999)}@email.com`,
        telefono: `+47 ${rndInt(400,999)} ${rndInt(10,99)} ${rndInt(100,999)}`,
        fecha,
        personas: rndInt(1,6),
        mensaje: rnd(MENSAJES),
        seccion: rnd(SECCIONES),
        estado: "confirmada",
        lang: "en",
      });
    }
  }
  // Junio 2026: días 1-30
  for (let dia = 1; dia <= 30; dia++) {
    const n = rndInt(8, 16);
    for (let i = 0; i < n; i++) {
      const hora = rnd(HORAS);
      const fecha = new Date(`2026-06-${String(dia).padStart(2,"0")}T${hora}:00`);
      reservas.push({
        nombre: rnd(NOMBRES),
        email: `demo${rndInt(1,999)}@email.com`,
        telefono: `+47 ${rndInt(400,999)} ${rndInt(10,99)} ${rndInt(100,999)}`,
        fecha,
        personas: rndInt(1,6),
        mensaje: rnd(MENSAJES),
        seccion: rnd(SECCIONES),
        estado: "confirmada",
        lang: "en",
      });
    }
  }
  // Julio 2026: días 1-31 (próximo mes)
  for (let dia = 1; dia <= 31; dia++) {
    const n = rndInt(6, 14);
    for (let i = 0; i < n; i++) {
      const hora = rnd(HORAS);
      const fecha = new Date(`2026-07-${String(dia).padStart(2,"0")}T${hora}:00`);
      reservas.push({
        nombre: rnd(NOMBRES),
        email: `demo${rndInt(1,999)}@email.com`,
        telefono: `+47 ${rndInt(400,999)} ${rndInt(10,99)} ${rndInt(100,999)}`,
        fecha,
        personas: rndInt(1,6),
        mensaje: rnd(MENSAJES),
        seccion: rnd(SECCIONES),
        estado: "confirmada",
        lang: "en",
      });
    }
  }
  return reservas;
}

function generarPedidos() {
  const pedidos = [];
  for (let mes = 5; mes <= 7; mes++) {
    const diasMes = mes === 7 ? 31 : mes === 6 ? 30 : 30;
    for (let dia = 1; dia <= diasMes; dia++) {
      const n = rndInt(6, 18);
      for (let i = 0; i < n; i++) {
        const hora = rndInt(12, 21);
        const min = rnd(["00","15","30","45"]);
        const createdAt = new Date(`2026-${String(mes).padStart(2,"0")}-${String(dia).padStart(2,"0")}T${String(hora).padStart(2,"0")}:${min}:00`);
        const numItems = rndInt(1, 4);
        const items = [];
        let total = 0;
        for (let j = 0; j < numItems; j++) {
          const plato = rnd(PLATOS);
          const qty = rndInt(1, 3);
          items.push({ id: String(plato.id), name: plato.name, nameEn: plato.nameEn, qty, price: plato.price, concepto: plato.concepto, image: plato.image });
          total += plato.price * qty;
        }
        pedidos.push({
          nombre: rnd(NOMBRES),
          email: `demo${rndInt(1,999)}@email.com`,
          horaRecogida: `${String(hora+1 > 22 ? 22 : hora+1).padStart(2,"0")}:${min}`,
          items: JSON.stringify(items),
          total,
          estado: rnd(["entregado","entregado","listo","listo","preparando","nuevo"]),
          createdAt,
          metodoPago: rnd(["stripe","efectivo","tarjeta"]),
          notas: rnd(NOTAS),
        });
      }
    }
  }
  return pedidos;
}

async function main() {
  const client = new Client({ connectionString: DB });
  await client.connect();
  console.log("Conectado a BD");

  // Borrar datos existentes
  await client.query(`DELETE FROM "Pedido"`);
  await client.query(`DELETE FROM "Reserva"`);
  await client.query(`DELETE FROM "Cliente"`);
  await client.query(`DELETE FROM "ClienteTag"`);
  console.log("Datos anteriores eliminados");

  // Insertar reservas
  const reservas = generarReservas();
  for (const r of reservas) {
    await client.query(
      `INSERT INTO "Reserva" (nombre, email, telefono, fecha, personas, mensaje, seccion, estado, lang, "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$4)`,
      [r.nombre, r.email, r.telefono, r.fecha, r.personas, r.mensaje, r.seccion, r.estado, r.lang]
    );
  }
  console.log(`${reservas.length} reservas insertadas`);

  // Insertar pedidos
  const pedidos = generarPedidos();
  for (const p of pedidos) {
    await client.query(
      `INSERT INTO "Pedido" (nombre, email, "horaRecogida", items, total, estado, "createdAt", "metodoPago", notas)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9)`,
      [p.nombre, p.email, p.horaRecogida, p.items, p.total, p.estado, p.createdAt, p.metodoPago, p.notas]
    );
  }
  console.log(`${pedidos.length} pedidos insertados`);

  await client.end();
  console.log("Seed completado ✓");
}

main().catch(e => { console.error(e); process.exit(1); });
