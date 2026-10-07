const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const menuDataPath = path.resolve('C:/Users/UnderDesignAI/Desktop/Webs/Obentojapanesefood.es/src/data/menuData.js');

async function syncMenu() {
  console.log('Reading menuData.js from:', menuDataPath);
  const fileContent = fs.readFileSync(menuDataPath, 'utf8');

  // Extract MENU array using regex or eval
  const menuMatch = fileContent.match(/export const MENU = (\[[\s\S]*?\n\];)/);
  if (!menuMatch) {
    throw new Error('Could not find export const MENU in menuData.js');
  }

  // Evaluate the MENU array safely by replacing ES module syntax
  const menuCode = `(function() { return ${menuMatch[1].replace(/;$/, '')}; })()`;
  const items = eval(menuCode);
  console.log(`Found ${items.length} items in menuData.js`);

  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/obento_db' });
  await client.connect();

  // 1. Add columns if missing
  await client.query(`
    ALTER TABLE "MenuItem" 
    ADD COLUMN IF NOT EXISTS "sub" text,
    ADD COLUMN IF NOT EXISTS "alergenos" text;
  `);
  console.log('Verified columns "sub" and "alergenos" in "MenuItem"');

  // 2. Clear old items or upsert
  // To ensure pristine 1:1 match with menuData.js, let's delete existing MenuItem and re-insert in order
  await client.query('DELETE FROM "MenuItem"');
  console.log('Cleared old MenuItem records');

  // Reset auto-increment id sequence if present
  try {
    await client.query('ALTER SEQUENCE "MenuItem_id_seq" RESTART WITH 1');
  } catch (e) {
    // sequence name might differ
  }

  // 3. Insert each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const allergensStr = Array.isArray(item.alergenos) ? item.alergenos.join(',') : (item.alergenos || '');
    const subVal = item.sub || null;
    const descVal = item.descripcion || '';
    const imgVal = item.imagen || null;
    const precioVal = item.precio !== undefined ? Number(item.precio) : Number(item.porciones?.[0]?.precio) || 0;

    await client.query(
      `INSERT INTO "MenuItem" ("nombre", "descripcion", "precio", "categoria", "sub", "alergenos", "imagen", "activo", "concepto", "destacado", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'obento', false, NOW(), NOW())`,
      [item.nombre, descVal, precioVal, item.cat, subVal, allergensStr, imgVal]
    );
  }
  console.log(`Successfully inserted ${items.length} dishes into "MenuItem"`);

  // 4. Update configuracion table: menus_cartas
  const subLabels = {
    nigiri: 'Nigiri',
    uramaki: 'Uramaki',
    futomaki: 'Futomaki',
    maki: 'Maki',
  };

  const getPrice = (x) => (x.precio !== undefined ? Number(x.precio) : Number(x.porciones?.[0]?.precio) || 0);

  const configuracionMenus = {
    entrantes: [
      {
        title: 'Entrantes',
        items: items.filter(x => x.cat === 'entrantes').map(x => ({
          name: x.nombre,
          desc: x.descripcion || '',
          price: `${getPrice(x).toFixed(2)} €`,
          allergens: Array.isArray(x.alergenos) ? x.alergenos.join(', ') : '',
          image: x.imagen || '',
          activo: true,
        })),
      },
    ],
    sushi: ['nigiri', 'uramaki', 'futomaki', 'maki'].map(sub => ({
      title: subLabels[sub] || sub,
      items: items.filter(x => x.cat === 'sushi' && x.sub === sub).map(x => ({
        name: x.nombre,
        desc: x.descripcion || '',
        price: `${getPrice(x).toFixed(2)} €`,
        allergens: Array.isArray(x.alergenos) ? x.alergenos.join(', ') : '',
        image: x.imagen || '',
        activo: true,
      })),
    })),
    calientes: [
      {
        title: 'Platos Calientes & Wok',
        items: items.filter(x => x.cat === 'calientes').map(x => ({
          name: x.nombre,
          desc: x.descripcion || '',
          price: `${getPrice(x).toFixed(2)} €`,
          allergens: Array.isArray(x.alergenos) ? x.alergenos.join(', ') : '',
          image: x.imagen || '',
          activo: true,
        })),
      },
    ],
    postres: [
      {
        title: 'Postres Japoneses',
        items: items.filter(x => x.cat === 'postres').map(x => ({
          name: x.nombre,
          desc: x.descripcion || '',
          price: `${getPrice(x).toFixed(2)} €`,
          allergens: Array.isArray(x.alergenos) ? x.alergenos.join(', ') : '',
          image: x.imagen || '',
          activo: true,
        })),
      },
    ],
    bebidas: [
      {
        title: 'Bebidas & Cervezas',
        items: items.filter(x => x.cat === 'bebidas').map(x => ({
          name: x.nombre,
          desc: x.descripcion || '',
          price: `${getPrice(x).toFixed(2)} €`,
          allergens: Array.isArray(x.alergenos) ? x.alergenos.join(', ') : '',
          image: x.imagen || '',
          activo: true,
        })),
      },
    ],
  };

  const valorStr = JSON.stringify(configuracionMenus);
  await client.query(`
    INSERT INTO configuracion (clave, valor)
    VALUES ('menus_cartas', $1)
    ON CONFLICT (clave) DO UPDATE SET valor = $1;
  `, [valorStr]);
  console.log('Successfully updated configuracion.menus_cartas with official Obento categories');

  const countRes = await client.query('SELECT count(*) FROM "MenuItem"');
  console.log('Total items in DB now:', countRes.rows[0].count);

  await client.end();
}

syncMenu().catch(err => {
  console.error('Error syncing menu:', err);
  process.exit(1);
});
