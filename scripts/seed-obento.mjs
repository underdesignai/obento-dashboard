import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/obento_db";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const MENU_ITEMS = [
  // Entrantes
  { nombre: "Ensalada wakame", descripcion: "Alga wakame marinada en salsa aojiso, salmón y toque de sésamo.", precio: 6.90, categoria: "entrantes", concepto: "obento", imagen: "/images/ensaladawakame.jpg" },
  { nombre: "Ebi Fry (3 und)", descripcion: "Langostinos empanados crujientes con salsa Sweetchili verde.", precio: 5.50, categoria: "entrantes", concepto: "obento", imagen: "/images/ebifry.jpg" },
  { nombre: "Edamame", descripcion: "Vainas de soja salteadas con aceite de humo y toque de shichimi y sal en escamas.", precio: 4.50, categoria: "entrantes", concepto: "obento", imagen: "/images/edamame.jpg" },
  { nombre: "Gyozas de pollo (4 und)", descripcion: "Empanadillas japonesas a la plancha, rellenas de pollo.", precio: 4.50, categoria: "entrantes", concepto: "obento", imagen: "/images/gyozaspollo.jpg" },
  { nombre: "Gyozas de verdura (4 und)", descripcion: "Empanadillas japonesas a la plancha, relleno vegetal.", precio: 4.50, categoria: "entrantes", concepto: "obento", imagen: "/images/gyozasverdura.jpg" },
  { nombre: "Gyozas de langostino (4 und)", descripcion: "Empanadillas japonesas a la plancha, relleno de langostino.", precio: 5.50, categoria: "entrantes", concepto: "obento", imagen: "/images/gyozaslangostino.jpg" },
  { nombre: "Samosas (3 und)", descripcion: "Deliciosos crujientes de hojaldre con relleno de pollo al curry y mayonesa buldak.", precio: 6.50, categoria: "entrantes", concepto: "obento", imagen: "/images/samosas.jpg" },
  { nombre: "Takoyaki (3 und)", descripcion: "Bolitas de pulpo rebozadas, salsa takoyaki y katsuobushi.", precio: 4.50, categoria: "entrantes", concepto: "obento", imagen: "/images/takoyaki.jpg" },

  // Sushi Nigiri
  { nombre: "Nigiri de atún", descripcion: "Atún Rojo Ricardo Fuentes (2und).", precio: 6.20, categoria: "sushi", concepto: "obento", imagen: "/images/nigiriatun.jpg" },
  { nombre: "Nigiri de atún con foie", descripcion: "Atún Rojo coronado con foie, sal marinada y teriyaki (2und).", precio: 7.80, categoria: "sushi", concepto: "obento", imagen: "/images/nigiriatunfoie.jpg" },
  { nombre: "Nigiri de salmón", descripcion: "Salmón fresco (2und).", precio: 5.50, categoria: "sushi", concepto: "obento", imagen: "/images/nigirisalmon.jpg" },
  { nombre: "Nigiri de salmón flambeado", descripcion: "Salmón sellado al soplete con kimchi y azúcar moreno (2und).", precio: 6.20, categoria: "sushi", concepto: "obento", imagen: "/images/nigirisalmonf.jpg" },
  { nombre: "Nigiri de chutoro", descripcion: "Atún sellado al soplete, sal en escamas y cebolleta (2und).", precio: 10.50, categoria: "sushi", concepto: "obento", imagen: "/images/nigirichutoro.jpg" },
  { nombre: "Nigiri de vieira", descripcion: "Vieira sellada con soplete, mayo kimchi y lima (2und).", precio: 9.90, categoria: "sushi", concepto: "obento", imagen: "/images/nigirivieira.jpg" },
  { nombre: "Nigiri de anguila", descripcion: "Anguila glaseada en salsa teriyaki y cebolleta (2und).", precio: 7.20, categoria: "sushi", concepto: "obento", imagen: "/images/nigirianguila.jpg" },
  { nombre: "Nigiri de hamachi", descripcion: "Pez limón (hamachi) (2und).", precio: 8.90, categoria: "sushi", concepto: "obento", imagen: "/images/nigirihamachi.jpg" },
  { nombre: "Nigiri de atún toro con trufa", descripcion: "Mayo trufada, cebolleta y atún toro rojo (2und).", precio: 10.90, categoria: "sushi", concepto: "obento", imagen: "/images/atuntoro.jpg" },

  // Sushi Uramaki
  { nombre: "Jōnetsu Tuna (8 uds)", descripcion: "Arroz con sésamo kimchi, atún, foie flambeado y teriyaki.", precio: 14.20, categoria: "sushi", concepto: "obento", imagen: "/images/rolloatun.jpg", destacado: true },
  { nombre: "Sakura Roll (8 uds)", descripcion: "Queso crema, salmón flambeado, mayo kimchi y teriyaki.", precio: 12.50, categoria: "sushi", concepto: "obento", imagen: "/images/uramakisalmon.jpg", destacado: true },
  { nombre: "Chicken roll (8 uds)", descripcion: "Pollo karaage, queso crema, cobertura de aguacate y salsa acebichada.", precio: 11.50, categoria: "sushi", concepto: "obento", imagen: "/images/uramakipollo.jpg" },
  { nombre: "Aurora Roll Vegetal (8 uds)", descripcion: "Micro mezclum, pepino, mango, guacamole trufado y salsa aojiso.", precio: 10.50, categoria: "sushi", concepto: "obento", imagen: "/images/rollovegetal.jpg" },
  { nombre: "Black Dragon (8 uds)", descripcion: "Gamba tempurizada, atún, mayo buldak y boniato crujiente.", precio: 15.20, categoria: "sushi", concepto: "obento", imagen: "/images/rolloblack.jpg", destacado: true },
  { nombre: "Shinigami crab (8 uds)", descripcion: "Arroz negro, cangrejo real, lubina y salsa spicy mango.", precio: 11.50, categoria: "sushi", concepto: "obento", imagen: "/images/uramakicangrejo.jpg" },
  { nombre: "Rollo Tartar de salmón (8 uds)", descripcion: "Aguacate, queso crema, tartar de salmón y salsa aojiso.", precio: 11.30, categoria: "sushi", concepto: "obento", imagen: "/images/rollosalmon1.jpg" },
  { nombre: "Rollo Tartar de atún (8 uds)", descripcion: "Aguacate, queso crema, tartar de atún y mayo kimchi.", precio: 13.80, categoria: "sushi", concepto: "obento", imagen: "/images/rolloatun1.jpg" },
  { nombre: "Rollo Tartar de lubina (8 uds)", descripcion: "Aguacate, queso crema, tartar de lubina y salsa acebichada.", precio: 11.90, categoria: "sushi", concepto: "obento", imagen: "/images/rollolubina.jpg" },

  // Futomaki & Maki
  { nombre: "Futomaki de salmón (8 uds)", descripcion: "Salmón, queso crema y salsa aojiso.", precio: 9.90, categoria: "sushi", concepto: "obento", imagen: "/images/futomaki.jpg" },
  { nombre: "Futomaki de gamba trufada (12 uds)", descripcion: "Gamba en tempura, ikura, cebollino y mayo trufada.", precio: 12.20, categoria: "sushi", concepto: "obento", imagen: "/images/rollogamba.jpg" },
  { nombre: "Futomaki karaage (12 uds)", descripcion: "Pollo karaage rebozado, mango y mayo buldak miel.", precio: 10.50, categoria: "sushi", concepto: "obento", imagen: "/images/futokara.jpg" },
  { nombre: "Maki de salmón (8 uds)", descripcion: "Salmón fresco.", precio: 6.20, categoria: "sushi", concepto: "obento", imagen: "/images/maki2.jpg" },
  { nombre: "Maki de chutoro (8 uds)", descripcion: "Ventresca de atún rojo Ricardo Fuentes.", precio: 10.50, categoria: "sushi", concepto: "obento", imagen: "/images/makichu.jpg" },
  { nombre: "Maki de atún (8 uds)", descripcion: "Atún fresco.", precio: 7.20, categoria: "sushi", concepto: "obento", imagen: "/images/makiatun.jpg" },
  { nombre: "Maki de aguacate (8 uds)", descripcion: "Aguacate fresco.", precio: 5.20, categoria: "sushi", concepto: "obento", imagen: "/images/maki4.jpg" },

  // Calientes
  { nombre: "Arroz con ternera", descripcion: "Arroz salteado con ternera, pimientos, cebolla y espárragos.", precio: 12.50, categoria: "calientes", concepto: "obento", imagen: "/images/arrozternera.jpg" },
  { nombre: "Arroz con pollo", descripcion: "Arroz salteado con pollo, verduras y toque de soja.", precio: 11.20, categoria: "calientes", concepto: "obento", imagen: "/images/arrozpollo.jpg" },
  { nombre: "Yakisoba de langostino", descripcion: "Fideos salteados con langostino, col y salsa yakisoba casera.", precio: 13.20, categoria: "calientes", concepto: "obento", imagen: "/images/yakisobalangostino.jpg" },
  { nombre: "Yakisoba de ternera", descripcion: "Fideos salteados con ternera, verduras y salsa yakisoba.", precio: 12.90, categoria: "calientes", concepto: "obento", imagen: "/images/yakisobaternera.jpg" },
  { nombre: "Yakisoba de pollo", descripcion: "Fideos salteados con pollo, verduras y aceite de sésamo.", precio: 11.90, categoria: "calientes", concepto: "obento", imagen: "/images/yakisobapollo.jpg" },

  // Postres
  { nombre: "Mochi de tarta de queso", descripcion: "Masa artesanal de arroz rellena de helado de cheesecake.", precio: 4.50, categoria: "postres", concepto: "obento", imagen: "/images/mochifresa.jpg" },
  { nombre: "Mochi de mango", descripcion: "Masa de arroz de fruta de la pasión rellena de helado de mango.", precio: 4.50, categoria: "postres", concepto: "obento", imagen: "/images/mochimango.jpg" },
  { nombre: "Mochi de chocolate", descripcion: "Masa de arroz rellena de intenso helado de chocolate.", precio: 4.50, categoria: "postres", concepto: "obento", imagen: "/images/mochichocolate.jpg" },

  // Bebidas
  { nombre: "Cerveza Asahi", descripcion: "Cerveza japonesa premium lager 330ml.", precio: 3.50, categoria: "bebidas", concepto: "obento" },
  { nombre: "Cerveza Kirin Ichiban", descripcion: "Cerveza japonesa de malta pura 330ml.", precio: 3.50, categoria: "bebidas", concepto: "obento" },
  { nombre: "Coca-Cola Original", descripcion: "330ml lata.", precio: 2.20, categoria: "bebidas", concepto: "obento" },
  { nombre: "Coca-Cola Zero", descripcion: "330ml lata.", precio: 2.20, categoria: "bebidas", concepto: "obento" },
  { nombre: "Nestea Limón", descripcion: "330ml lata.", precio: 2.20, categoria: "bebidas", concepto: "obento" },
  { nombre: "Agua mineral", descripcion: "Botella 500ml.", precio: 1.20, categoria: "bebidas", concepto: "obento" },
];

async function main() {
  console.log("🌱 Inicializando datos base de Obento Japanese Food...");

  // 1. Usuario admin
  const hashedPassword = await bcrypt.hash("admin", 10);
  await prisma.usuario.upsert({
    where: { username: "admin" },
    update: { password: hashedPassword, rol: "admin", activo: true },
    create: {
      username: "admin",
      email: "admin@obentojapanesefood.es",
      password: hashedPassword,
      rol: "admin",
      activo: true,
    },
  });
  console.log("✓ Usuario admin verificado");

  // 2. Menu Items
  await prisma.menuItem.deleteMany({});
  for (const item of MENU_ITEMS) {
    await prisma.menuItem.create({
      data: item,
    });
  }
  console.log(`✓ ${MENU_ITEMS.length} platos de la carta de Obento creados en la base de datos.`);

  // 3. Configuración del restaurante
  const configDefaults = [
    { clave: "restaurante_nombre", valor: "OBENTO Japanese Food" },
    { clave: "restaurante_direccion", valor: "C. Amargura, 3, 30830 La Ñora, Murcia" },
    { clave: "restaurante_telefono", valor: "613 927 596" },
    { clave: "restaurante_email", valor: "pedidos@obentojapanesefood.es" },
    { clave: "takeaway_iva", valor: "10" },
    { clave: "takeaway_activo", valor: "true" },
    { clave: "takeaway_tiempo_espera", valor: "30" },
  ];

  for (const c of configDefaults) {
    await prisma.configuracion.upsert({
      where: { clave: c.clave },
      update: { valor: c.valor },
      create: c,
    });
  }
  console.log("✓ Configuración de Obento guardada.");

  // 4. Clientes únicos desde pedidos existentes
  const orders = await prisma.pedidos.findMany({
    select: { cliente_nombre: true, cliente_email: true, cliente_telefono: true, created_at: true, total: true },
  });

  const clientMap = new Map();
  for (const o of orders) {
    const key = (o.cliente_telefono || o.cliente_email || o.cliente_nombre).trim().toLowerCase();
    if (!key) continue;
    if (!clientMap.has(key)) {
      clientMap.set(key, {
        clientKey: key,
        nombre: o.cliente_nombre,
        email: o.cliente_email || null,
        telefono: o.cliente_telefono || null,
        totalPedidos: 1,
        primeraReserva: null,
        ultimaReserva: null,
        createdAt: o.created_at || new Date(),
        updatedAt: o.created_at || new Date(),
      });
    } else {
      const existing = clientMap.get(key);
      existing.totalPedidos += 1;
    }
  }

  let createdClients = 0;
  for (const c of clientMap.values()) {
    try {
      await prisma.cliente.upsert({
        where: { clientKey: c.clientKey },
        update: { totalPedidos: c.totalPedidos },
        create: c,
      });
      createdClients++;
    } catch { }
  }
  console.log(`✓ ${createdClients} clientes sincronizados en la base de datos a partir de los 3.600 pedidos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
