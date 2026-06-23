import pg from "pg";
const { Client } = pg;
const client = new Client({ connectionString: "postgresql://postgres:719503847b004afa6626026d7800b915@13.140.161.167:5435/coyo_admin" });
await client.connect();
const r = await client.query('SELECT id, nombre, "nombreEn", imagen, concepto FROM "MenuItem" WHERE activo = true ORDER BY id');
console.log(JSON.stringify(r.rows, null, 2));
await client.end();
