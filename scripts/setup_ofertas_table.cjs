const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/obento_db' });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS "Oferta" (
      "id" SERIAL PRIMARY KEY,
      "titulo" TEXT NOT NULL,
      "descripcion" TEXT,
      "descuento" DOUBLE PRECISION,
      "tipo" TEXT NOT NULL DEFAULT 'porcentaje',
      "badge" TEXT DEFAULT 'PROMO',
      "validoHasta" TEXT,
      "activo" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log('Table "Oferta" created or verified successfully!');

  // Check Cupon table columns
  const cuponCols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Cupon';
  `);
  console.log('Cupon columns:', cuponCols.rows.map(r => r.column_name));

  // Add minimo or descripcion to Cupon if needed
  await client.query(`
    ALTER TABLE "Cupon" 
    ADD COLUMN IF NOT EXISTS "minimo" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "descripcion" TEXT;
  `);
  console.log('Cupon extra columns verified.');

  await client.end();
}

main().catch(console.error);
