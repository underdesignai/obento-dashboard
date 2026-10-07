-- Seed de ingredientes e insumos base para Obento Japanese Food
INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Lomo de Salmón Noruego Fresco', 'Pescados y Mariscos', 'kg', 14.5, 5.0, 16.50, 16.50, 'Pescados del Puerto S.L.'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Lomo de Salmón Noruego Fresco');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Atún Rojo Balfegó (Lomo)', 'Pescados y Mariscos', 'kg', 8.2, 3.0, 32.00, 32.00, 'Balfegó Grup'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Atún Rojo Balfegó (Lomo)');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Langostino Tigre Vannamei', 'Pescados y Mariscos', 'kg', 12.0, 4.0, 14.20, 14.20, 'Mariscos del Sur'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Langostino Tigre Vannamei');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Pechuga de Pollo Fresca', 'Carnes y Aves', 'kg', 15.0, 5.0, 6.80, 6.80, 'Avícola Regional'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Pechuga de Pollo Fresca');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Ternera de Añojo para Yakisoba', 'Carnes y Aves', 'kg', 9.5, 4.0, 12.40, 12.40, 'Carnicería Murciana'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Ternera de Añojo para Yakisoba');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Arroz Koshihikari para Sushi (Saco 20kg)', 'Arroz y Granos', 'kg', 60.0, 20.0, 2.40, 2.40, 'Tokyo Trading'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Arroz Koshihikari para Sushi (Saco 20kg)');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Alga Nori Gold (Paquete 50 hojas)', 'Algas y Nori', 'unidad', 18.0, 5.0, 8.50, 8.50, 'Oriental Gourmet'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Alga Nori Gold (Paquete 50 hojas)');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Aguacate Hass Premium', 'Verduras y Frescos', 'kg', 10.0, 4.0, 4.90, 4.90, 'Frutas Levante'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Aguacate Hass Premium');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Pepino Japonés / Holandés', 'Verduras y Frescos', 'kg', 7.5, 3.0, 1.80, 1.80, 'Frutas Levante'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Pepino Japonés / Holandés');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Queso Crema Philadelphia Profesional (2kg)', 'Lácteos y Varios', 'kg', 14.0, 4.0, 6.20, 6.20, 'Makro Mayorista'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Queso Crema Philadelphia Profesional (2kg)');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Salsa de Soja Kikkoman (Garrafa 5L)', 'Salsas y Condimentos', 'l', 25.0, 10.0, 4.10, 4.10, 'Tokyo Trading'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Salsa de Soja Kikkoman (Garrafa 5L)');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Vinagre de Arroz Su para Sushi', 'Salsas y Condimentos', 'l', 18.0, 5.0, 3.60, 3.60, 'Tokyo Trading'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Vinagre de Arroz Su para Sushi');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Cajas Takeaway Obento Premium (Pack 100)', 'Packaging y Embalajes', 'unidad', 450.0, 100.0, 0.42, 0.42, 'Envases Ecológicos S.A.'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Cajas Takeaway Obento Premium (Pack 100)');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Bolsas Kraft Obento con Asa (Pack 250)', 'Packaging y Embalajes', 'unidad', 600.0, 150.0, 0.28, 0.28, 'Envases Ecológicos S.A.'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Bolsas Kraft Obento con Asa (Pack 250)');

INSERT INTO "StockItem" ("nombre", "categoria", "unidad", "cantidadActual", "stockMinimo", "costeUnitario", "ultimoCoste", "proveedorHabitual")
SELECT 'Palillos Japoneses de Bambú Enfundados', 'Packaging y Embalajes', 'unidad', 850.0, 200.0, 0.06, 0.06, 'Envases Ecológicos S.A.'
WHERE NOT EXISTS (SELECT 1 FROM "StockItem" WHERE "nombre" = 'Palillos Japoneses de Bambú Enfundados');
