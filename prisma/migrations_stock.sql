CREATE TABLE IF NOT EXISTS "StockItem" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "categoria" VARCHAR(100) NOT NULL DEFAULT 'Pescados y Mariscos',
    "unidad" VARCHAR(20) NOT NULL DEFAULT 'kg',
    "cantidadActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "costeUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ultimoCoste" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proveedorHabitual" VARCHAR(150),
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Factura" (
    "id" SERIAL NOT NULL,
    "numeroFactura" VARCHAR(100) NOT NULL,
    "proveedor" VARCHAR(150) NOT NULL,
    "cifProveedor" VARCHAR(50),
    "fechaEmision" DATE NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalIva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFactura" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estadoPago" VARCHAR(50) NOT NULL DEFAULT 'pagado',
    "metodoPago" VARCHAR(50) DEFAULT 'transferencia',
    "archivoUrl" VARCHAR(255),
    "archivoNombre" VARCHAR(255),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FacturaItem" (
    "id" SERIAL NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "stockItemId" INTEGER,
    "descripcion" VARCHAR(200) NOT NULL,
    "categoria" VARCHAR(100),
    "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unidad" VARCHAR(20) NOT NULL DEFAULT 'kg',
    "precioUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ivaPct" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT "FacturaItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FacturaItem_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FacturaItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "MermaItem" (
    "id" SERIAL NOT NULL,
    "stockItemId" INTEGER NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidad" VARCHAR(20) NOT NULL,
    "motivo" VARCHAR(100) NOT NULL,
    "costePerdido" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notas" TEXT,
    "registradoPor" VARCHAR(100),
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MermaItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MermaItem_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "StockMovimiento" (
    "id" SERIAL NOT NULL,
    "stockItemId" INTEGER NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "stockPrevio" DOUBLE PRECISION NOT NULL,
    "stockPosterior" DOUBLE PRECISION NOT NULL,
    "costeUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referencia" VARCHAR(150),
    "notas" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovimiento_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StockMovimiento_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "EscandalloIngrediente" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER,
    "dishId" VARCHAR(100),
    "platoNombre" VARCHAR(150) NOT NULL,
    "stockItemId" INTEGER NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidad" VARCHAR(20) NOT NULL DEFAULT 'kg',
    "notas" TEXT,
    CONSTRAINT "EscandalloIngrediente_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EscandalloIngrediente_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_stock_categoria" ON "StockItem"("categoria");
CREATE INDEX IF NOT EXISTS "idx_stock_activo" ON "StockItem"("activo");
CREATE INDEX IF NOT EXISTS "idx_factura_fecha" ON "Factura"("fechaEmision" DESC);
CREATE INDEX IF NOT EXISTS "idx_factura_proveedor" ON "Factura"("proveedor");
CREATE INDEX IF NOT EXISTS "idx_factura_item_factura" ON "FacturaItem"("facturaId");
CREATE INDEX IF NOT EXISTS "idx_factura_item_stock" ON "FacturaItem"("stockItemId");
CREATE INDEX IF NOT EXISTS "idx_merma_fecha" ON "MermaItem"("fecha" DESC);
CREATE INDEX IF NOT EXISTS "idx_merma_stock" ON "MermaItem"("stockItemId");
CREATE INDEX IF NOT EXISTS "idx_movimiento_stock_date" ON "StockMovimiento"("stockItemId", "fecha" DESC);
CREATE INDEX IF NOT EXISTS "idx_escandallo_menu_item" ON "EscandalloIngrediente"("menuItemId");
CREATE INDEX IF NOT EXISTS "idx_escandallo_stock_item" ON "EscandalloIngrediente"("stockItemId");
