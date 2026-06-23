import pg from "pg";
const { Client } = pg;
const DB = "postgresql://postgres:719503847b004afa6626026d7800b915@13.140.161.167:5435/coyo_admin";

const NOMBRES_R = ["Claudia Paredes","Ignacio Ramos","Valentina Reyes","Bjorn Larsen","Hanne Sorensen","Gabriela Ibanez","Sergio Mendoza","Laura Jimenez","Carlos Fuentes","Maria Gonzalez","Erik Larsson","Sofia Martinez","Lucas Fernandez","Ana Ruiz","Miguel Torres"];
const NOMBRES = ["Claudia Paredes","Ignacio Ramos","Valentina Reyes","Bjorn Larsen","Hanne Sorensen","Gabriela Ibanez","Sergio Mendoza","Laura Jimenez","Carlos Fuentes","Maria Gonzalez","Erik Larsson"];
const IMG_SUSHI   = "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=80";
const IMG_SUSHI2  = "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80";
const IMG_MEX     = "https://images.unsplash.com/photo-1570461226513-e08b58a52c53?w=800&q=80";
const IMG_MEX2    = "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80";

const PLATOS = [
  [{id:"164",name:"Spicy Maguro",nameEn:"Spicy Maguro",qty:2,price:155,concepto:"sushi",image:IMG_SUSHI2},{id:"148",name:"Nigiri de Salmón",nameEn:"Salmon Nigiri",qty:1,price:145,concepto:"sushi",image:IMG_SUSHI}],
  [{id:"130",name:"Tacos de Cerdo",nameEn:"Pork Tacos",qty:2,price:135,concepto:"mexican",image:IMG_MEX}],
  [{id:"148",name:"Nigiri de Salmón",nameEn:"Salmon Nigiri",qty:1,price:145,concepto:"sushi",image:IMG_SUSHI},{id:"121",name:"Guacamole Clásico",nameEn:"Classic Guacamole",qty:1,price:89,concepto:"mexican",image:IMG_MEX2}],
  [{id:"139",name:"Chef's Mix 16 piezas",nameEn:"Chef's Mix 16 pcs",qty:1,price:285,concepto:"sushi",image:IMG_SUSHI2}],
  [{id:"128",name:"Taco de Gambas",nameEn:"Prawn Taco",qty:2,price:145,concepto:"mexican",image:IMG_MEX},{id:"131",name:"Quesabirrias",nameEn:"Quesabirrias",qty:1,price:155,concepto:"mexican",image:IMG_MEX}],
  [{id:"167",name:"Sashimi de Salmón",nameEn:"Salmon Sashimi",qty:1,price:165,concepto:"sushi",image:IMG_SUSHI}],
  [{id:"133",name:"Flautas de Res",nameEn:"Beef Flautas",qty:2,price:165,concepto:"mexican",image:IMG_MEX}],
  [{id:"138",name:"Coyo Sashimi",nameEn:"Coyo Sashimi",qty:1,price:195,concepto:"sushi",image:IMG_SUSHI},{id:"148",name:"Nigiri de Salmón",nameEn:"Salmon Nigiri",qty:2,price:145,concepto:"sushi",image:IMG_SUSHI}],
  [{id:"121",name:"Guacamole Clásico",nameEn:"Classic Guacamole",qty:2,price:89,concepto:"mexican",image:IMG_MEX2},{id:"127",name:"Taco de Pastor",nameEn:"Pastor Taco",qty:1,price:135,concepto:"mexican",image:IMG_MEX}],
  [{id:"160",name:"California Maki",nameEn:"California Maki",qty:2,price:125,concepto:"sushi",image:IMG_SUSHI2}],
  [{id:"157",name:"Maki de Salmón",nameEn:"Salmon Maki",qty:2,price:135,concepto:"sushi",image:IMG_SUSHI2},{id:"167",name:"Sashimi de Salmón",nameEn:"Salmon Sashimi",qty:1,price:165,concepto:"sushi",image:IMG_SUSHI}],
];
const ESTADOS = ["nuevo","nuevo","nuevo","nuevo","nuevo","preparando","preparando","preparando","preparando","listo","listo"];
const METODOS = ["stripe","efectivo","tarjeta"];
const NOTAS = [
  "Sin cebolla por favor",
  "Alérgico al gluten, confirmar cocina",
  "Extra picante",
  null,
  "Sin soja en la salsa",
  "Salsa aparte",
  "Doble de arroz",
  null,
  "Sin cilantro",
  "Extra wasabi",
  "Con extra de guacamole",
];
const rnd = arr => arr[Math.floor(Math.random()*arr.length)];

async function main() {
  const client = new Client({ connectionString: DB });
  await client.connect();
  const now = new Date();
  for (let i = 0; i < 11; i++) {
    const items = PLATOS[i];
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    const t = new Date(now.getTime() - i * 8 * 60000);
    const horaRecogida = `${String(t.getHours() + 1 > 22 ? 22 : t.getHours() + 1).padStart(2,"0")}:00`;
    await client.query(
      `INSERT INTO "Pedido" (nombre, email, "horaRecogida", items, total, estado, "createdAt", "metodoPago", notas) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9)`,
      [NOMBRES[i], `demo${i+1}@email.com`, horaRecogida, JSON.stringify(items), total, ESTADOS[i], t, rnd(METODOS), NOTAS[i]]
    );
  }
  console.log("11 pedidos de hoy insertados ✓");

  // Reservas de hoy
  const SECCIONES = ["sushi","sushi","sushi","mexican","mexican"];
  const HORAS_R = ["13:00","13:30","14:00","14:30","15:00","20:00","20:30","21:00","21:30","22:00"];
  const MENSAJES_R = ["Cumpleaños","Aniversario","Reunión de empresa",null,null,null,null];
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  for (let i = 0; i < 12; i++) {
    const fecha = new Date(`2026-06-23T${HORAS_R[i % HORAS_R.length]}:00`);
    const createdAt = new Date(hoy.getTime() + i * 15 * 60000);
    await client.query(
      `INSERT INTO "Reserva" (nombre, email, telefono, fecha, personas, mensaje, seccion, estado, lang, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [NOMBRES_R[i], `demo${i+100}@email.com`, `+47 ${Math.floor(Math.random()*500+400)} ${Math.floor(Math.random()*90+10)} ${Math.floor(Math.random()*900+100)}`, fecha, Math.floor(Math.random()*5+1), MENSAJES_R[i % MENSAJES_R.length], SECCIONES[i % SECCIONES.length], "confirmada", "en", createdAt]
    );
  }
  console.log("12 reservas de hoy insertadas ✓");
  await client.end();
}
main().catch(e => { console.error(e); process.exit(1); });
