# Estructura Completa — Coyo Admin

> Inventario detallado de todas las páginas, secciones, componentes, interacciones, API routes y flujos del panel de administración.

---

## LAYOUT GLOBAL

Archivo: `app/layout.tsx`

### Sidebar (Desktop) / Drawer (Mobile)
- Logo + label "Admin"
- **Navegación principal** (todos los roles):
  - Overview · Reservas · Pedidos · Servicios · Carta · Galería · Reviews · Analytics · Leads · Cupones
- **Navegación admin** (solo rol admin):
  - Links externos: Monitor Reservas · Monitor Takeaway
  - Trabajadores · Configuración
- Botón de Logout

### Header (Desktop)
- Badges de estado de monitores (Reservas / Takeaway: online / offline)
- Estado de PostgreSQL
- Fecha + hora en vivo
- Selector de idioma (ES/EN)
- Indicador de estado activo
- Botón Logout

### Header (Mobile)
- Toggle menú · Logo · Fecha/Hora
- Selector de idioma
- Botón Logout

### Comportamiento global
- Zoom: 1.2× aplicado al contenido principal
- Tema: fondo oscuro (#0a0a0f), acento dorado (#c9a84c), texto gris/plata
- Responsive: sidebar fijo en desktop, drawer deslizante en mobile

---

## LOGIN (`/login`) — `app/login/page.tsx`

- Tarjeta centrada con logo Coyo
- Campo: Nombre de usuario
- Campo: Contraseña (con toggle de visibilidad)
- Botón Submit (deshabilitado en carga, texto cambia a "Cargando…")
- Mensaje de error si las credenciales fallan
- `POST /api/admin/auth/login` → cookie de sesión → redirección a `/`

---

## 1. DASHBOARD / OVERVIEW (`/`) — `app/page.tsx`

### KPI Cards (8)
| Card | Dato |
|---|---|
| Reservas hoy | Reservas con fecha = hoy |
| Pedidos pendientes | Pedidos en estado nuevo/preparando |
| Ingresos mes | Suma de totales del mes actual |
| Visitas hoy | Visitas registradas hoy |
| Reviews sin aprobar | Reviews pendientes de moderación |
| Platos activos | MenuItem con activo=true |
| Leads únicos | Total de clientes únicos |
| Reservas semana | Reservas en los últimos 7 días |

### Quick Links (6 tarjetas)
Reservas · Pedidos · Platos · Leads · Reviews · Analytics

### Tablas de datos
- **Últimas 6 reservas:** Nombre · Email · Sección · Fecha · Hora · Personas · Estado
- **Últimos 6 pedidos:** Nombre · # Pedido · Total · Estado

### Comportamiento
- Auto-refresh cada 30 segundos (`GET /api/admin/overview`)
- Polling del sistema cada 5 segundos (`GET /api/admin/heartbeat`)
- Saludo dinámico según la hora: Buenos días / Buenas tardes / Buenas noches

---

## 2. RESERVAS (`/reservas`) — `app/reservas/page.tsx`

### Stat Cards (4)
Total · Confirmadas · Canceladas · Comensales

### Filtros
- Búsqueda por nombre, email, teléfono o mensaje
- Dropdown de estado (todas / confirmada / cancelada / pendiente / llegó)
- Dropdown de sección (todas / Mexican / Sushi)
- Selector de rango de fechas
- Botón limpiar filtros

### Tabla (25 filas por página, paginación)
Checkbox | Nombre | Email | Sección | Teléfono | Fecha | Hora | Personas | Estado

- Columnas ordenables: nombre, email, sección, teléfono, fecha, personas, estado, createdAt
- Contador: "X resultados de Y · Página Z de N"

### Acciones
- **Click en fila** → abre **DetailModal** con todos los campos + botones de cambio de estado + botón eliminar (con confirmación)
- **Selección múltiple** → barra de acciones bulk: Cancelar · Eliminar · Deseleccionar
- **Exportar CSV** con todos los resultados filtrados
- **Actualizar** manual
- Actualizaciones en tiempo real vía EventSource (`/api/admin/reservas/stream`)

### API calls
- `GET /api/admin/reservas`
- `GET /api/admin/reservas/stream` (EventSource)
- `PATCH /api/admin/reservas/{id}` (cambio de estado)
- `DELETE /api/admin/reservas/{id}` (eliminar)

---

## 3. PEDIDOS (`/pedidos`) — `app/pedidos/page.tsx`

### Stat Cards
Desktop (5): Total · Nuevos · Preparando · Listos · Ingresos  
Mobile (3): versión compacta

### Toggle de vista
- **Hoy** — filtra solo pedidos del día
- **Todos** — muestra todos con rango de fechas

### Modos de visualización
- **Lista** (tabla con paginación de 25)
- **Kanban** (5 columnas: pendiente_pago · nuevo · preparando · listo · entregado) con contadores

### Tabla
Checkbox | Nombre | # Pedido | Email | Teléfono | Hora recogida | Total | Estado | Acción (botón avanzar estado)

**Flujo de avance de estado:**
`Confirmar pago` → `En preparación` → `Listo para recoger` → `Entregado`

### Filtros
- Búsqueda por nombre, teléfono o email
- Dropdown de estado
- Rango de fechas (modo "Todos")

### Acciones
- Click fila → editar pedido
- Botón acción en cada fila → avanza estado
- Selección múltiple → bulk delete
- Exportar CSV
- Auto-refresh silencioso cada 5 segundos

### API calls
- `GET /api/admin/pedidos`
- `PATCH /api/admin/pedidos/{id}` (cambio de estado)
- `DELETE /api/admin/pedidos/{id}` (eliminar)

---

## 4. SERVICIOS (`/servicios`) — `app/servicios/page.tsx`

### Stat Cards (5)
Total · Pendientes · Confirmadas · Sushi Experience · Catering

### Filtros rápidos (pills)
Catering · Cocina y Aprende (filtro por tipo de servicio)

### Filtros avanzados
- Búsqueda por nombre, email, empresa o teléfono
- Dropdown de estado
- Dropdown de tipo de servicio
- Rango de fechas
- Limpiar filtros

### Tabla (25 filas por página)
Checkbox | Nombre (+ empresa) | Email | Servicio | Fecha | Personas | Estado

### Acciones
- **Click fila** → **DetailModal**: ID, nombre, email, teléfono, fecha, personas, empresa, menú, mensaje, badge de servicio + cambio de estado + eliminar
- **Botón Nuevo** → **ModalNueva**: formulario con nombre, email, teléfono, servicio, fecha, personas, empresa, menú, mensaje
- **Selección bulk**: Confirmar · Cancelar · Eliminar
- Exportar CSV

### API calls
- `GET /api/admin/servicios?limit=500`
- `POST /api/admin/servicios` (nuevo)
- `PATCH /api/admin/servicios/{id}` (estado)
- `DELETE /api/admin/servicios/{id}` (eliminar)

---

## 5. CARTA (`/carta`) — `app/carta/page.tsx`

### Pestañas principales
**Menús JSON** (Mexicana · Sushi · Bebidas) + **Take Away**

---

### Pestaña: Menús JSON

- Cada pestaña muestra secciones expandibles con grid de tarjetas de platos
- **Cada tarjeta de plato:**
  - Imagen · Nombre · Precio (serif dorado) · Descripción · Alérgenos · Badge · Icono Halal
  - Botones: Editar · Eliminar · Toggle visibilidad
- **Modal Editar/Añadir plato:**
  - Campos: Nombre ES, Descripción, Precio, Alérgenos, Badge, Imagen (URL o subir), Toggle Halal
- Botón "Añadir Sección"
- Auto-guardado en BD tras 1 segundo de inactividad (indicador: Guardado ✓ / Guardando… / Autoguardado)
- Drag & drop para mover platos entre secciones

### Pestaña: Take Away

- Selector de concepto: Mexicano / Sushi
- Pills de categoría con drag & drop
- Grid de tarjetas de producto
- **Cada tarjeta:**
  - Imagen · Nombre ES/EN · Precio · Badge de categoría · Estado (Activo/Oculto) · Destacado en home (estrella)
  - Botones: Editar · Toggle visibilidad · Toggle destacado · Eliminar
- **Modal Editar/Añadir producto:**
  - Campos: Concepto, Categoría, Nombre ES, Nombre EN, Descripción, Precio, Imagen, Estado

### API calls
- `GET /api/admin/menus` (menús JSON)
- `PUT /api/admin/menus` (auto-guardar estructura JSON)
- `GET /api/admin/carta` (productos Take Away)
- `POST /api/admin/carta` (nuevo producto)
- `PATCH /api/admin/carta/{id}` (actualizar)
- `DELETE /api/admin/carta/{id}` (eliminar)
- `POST /api/admin/upload` (subida de imagen)

---

## 6. GALERÍA (`/galeria`) — `app/galeria/page.tsx`

### Stat Cards (3)
Total fotos · Visibles · Ocultas

### Grid de fotos
- Auto-fill con minmax 240px
- Hover: overlay con botones Editar · Toggle visibilidad · Eliminar

### Modal Añadir/Editar
- URL de imagen o subir archivo
- Preview antes de guardar
- Campos: Label · Texto alternativo (alt)

### API calls
- `GET /api/admin/galeria`
- `POST /api/admin/galeria`
- `PATCH /api/admin/galeria/{id}` (editar label/alt o toggle activo)
- `DELETE /api/admin/galeria/{id}`
- `POST /api/admin/upload`

---

## 7. REVIEWS (`/reviews`) — `app/reviews/page.tsx`

### Pestañas (con contadores)
- **Pendientes** — reviews sin aprobar
- **Aprobadas** — reviews visibles en la web

### Tarjetas de review
- Nombre · Rating (5 estrellas) · Texto de la reseña · Fuente (vía…)
- Botones en pendientes: **Aprobar** (verde) · **Eliminar** (rojo, con confirmación)

### API calls
- `GET /api/admin/reviews`
- `PATCH /api/admin/reviews/{id}` (aprobado=true)
- `DELETE /api/admin/reviews/{id}`

---

## 8. ANALYTICS (`/analytics`) — `app/analytics/page.tsx`

### KPI Cards (2)
Total visitas · Nº de páginas únicas

### Gráfico de barras horizontal
- Páginas ordenadas de mayor a menor visitas
- Barras con degradado dorado
- Datos desde `GET /api/admin/analytics`

### Comportamiento
- Auto-refresh al cargar
- Caché en sessionStorage
- Botón Actualizar manual

---

## 9. LEADS (`/leads`) — `app/leads/page.tsx`

### Cabecera
- Título · Contador de clientes · Botones: Exportar CSV · Sincronizar · Actualizar

### Búsqueda
- Campo de texto: filtra por nombre, email o teléfono en tiempo real

### Tabla de leads (25 por página, ordenable)
| Columna | Descripción |
|---|---|
| Cliente | Nombre + email/teléfono + tags automáticos (badges de colores) |
| Sección | Emojis de secciones visitadas (🍣 Sushi / 🌮 Mexican) |
| Reservas | Nº total (dorado, ordenable) |
| Pedidos | Nº total (azul, ordenable) |
| Canceladas | Nº (rojo si >0, ordenable) |
| No Show | Nº (rojo si >0, ordenable) |
| % Asistencia | Barra de progreso coloreada: verde >80%, amarillo 50-80%, rojo <50% (ordenable) |
| › | Chevron para expandir |

### Fila expandida (LeadExpanded)
- **Tags:** badges de tags automáticos + botones toggle para tags manuales
- **Historial de reservas:** Fecha · Personas · Sección · Mensaje · Estado (emoji + label)

### Sistema de tags
- **Auto-tags** (calculados): VIP, Frecuente, Nuevo, En riesgo, etc.
- **Manual tags** (toggle): añadir/quitar con un click
- Definidos en `lib/tags.ts`

### API calls
- `GET /api/admin/leads`
- `GET /api/admin/leads/historial?email=X`
- `GET /api/admin/tags?email=X`
- `POST /api/admin/tags` (add/remove: `{email, nombre, tag, action}`)
- `POST /api/admin/leads/sync` (recalcula leads desde reservas y pedidos)

---

## 10. CUPONES (`/cupones`) — `app/cupones/page.tsx`

### Formulario de creación (grid 4 columnas)
- Código (se convierte a mayúsculas automáticamente)
- Descuento (número)
- Tipo: Porcentaje / Fijo
- Máximo de usos
- Botón Crear

### Lista de cupones
| Columna | Descripción |
|---|---|
| Código | Monospace + botón copiar al portapapeles (cambia a ✓ 1.5s) |
| Descuento | Valor + tipo |
| Usos | Usos actuales / máximos |
| Estado | Toggle Activo / Inactivo (PATCH) |
| Eliminar | Botón con confirmación |

### API calls
- `GET /api/admin/cupones`
- `POST /api/admin/cupones`
- `PATCH /api/admin/cupones/{id}` (toggle activo)
- `DELETE /api/admin/cupones/{id}`

---

## 11. TRABAJADORES (`/trabajadores`) — `app/trabajadores/page.tsx`

> Página exclusiva para rol **admin**

### Info de roles
- **Admin:** acceso completo
- **Editor:** gestión de contenido
- **General:** solo lectura/básico

### Lista de usuarios
- Fila de "admin" (sistema, solo lectura)
- Por cada trabajador: nombre de usuario · email · badge de rol (colores) · toggle activo/inactivo · botón editar · botón eliminar

### Modales
- **Añadir trabajador:** usuario, email, contraseña, rol
- **Editar trabajador:** mismos campos (contraseña vacía = mantener la actual)
- **Confirmar eliminar**

### API calls
- `GET /api/admin/trabajadores`
- `POST /api/admin/trabajadores`
- `PATCH /api/admin/trabajadores/{id}`
- `DELETE /api/admin/trabajadores/{id}`

---

## 12. CONFIGURACIÓN (`/configuracion`) — `app/configuracion/page.tsx`

> Hub central de configuración con 7 sub-pestañas

---

### A. General (Sitio)
- Selector de zona horaria (40+ opciones)
- Botón Guardar con indicador de estado

---

### B. Agente IA
- Toggle activar/desactivar chat flotante
- Selector de proveedor: **Anthropic (Claude)** | **OpenAI (GPT)**
- Campo API Key (contraseña, toggle visibilidad)
- Dropdown de modelo (según proveedor seleccionado)
- Textarea de System Prompt
- Botón **Probar Agente** → devuelve respuesta de prueba
- Botón Guardar

---

### C. Horarios
- 7 días (Lun–Dom): Toggle activo + inputs de hora apertura/cierre, o "Cerrado"
- Usado para respuestas automáticas del agente IA

---

### D. Email
- Campo email remitente
- Campo contraseña (opcional)
- Botón **Enviar email de prueba** → muestra resultado `{ok, msg}`
- Botón Guardar

---

### E. Take Away
- `takeaway_dias_minimos` — días mínimos de antelación (default: "2")
- `takeaway_hoy_habilitado` — permitir pedidos para hoy (boolean)
- `takeaway_horas_minimas` — horas mínimas desde ahora (default: "2")
- `takeaway_mensaje_recuerda` — mensaje de recordatorio al confirmar pedido
- `takeaway_iva` — IVA aplicable (%)
- Botón Guardar

---

### F. Stripe
- Campo Publishable Key
- Campo Secret Key (solo se muestra si está configurado, se puede sobreescribir)
- Indicador automático de modo test/live (detectado del formato de la clave)
- Botón Guardar

---

### G. Backup
- **Selector de items** (checkboxes): Reservas · Pedidos · Clientes · Reseñas · Cupones · Configuración · Usuarios · Platos · Servicios · Galería · Imágenes · Vídeos · Frames
- Botón **Crear Backup** con items seleccionados
- Botón **Backup DB** (rápido, solo base de datos)
- **Lista de backups:** Nombre de archivo · Tamaño · Fecha · Botón Descargar · Botón Eliminar
- Toggle **Backup programado** (automático)
- **Restaurar:** selector de archivo + botón Restaurar (con confirmación)
- **Restaurar DB:** selector de archivo .sql + botón Restaurar DB (con confirmación)

### API calls (Configuración)
- `GET/POST /api/admin/configuracion/general`
- `GET/PUT /api/admin/agente`
- `GET/POST /api/admin/configuracion/email`
- `POST /api/admin/configuracion/email/test`
- `GET/POST /api/admin/configuracion/takeaway`
- `GET/POST /api/admin/configuracion/stripe`
- `POST /api/admin/backup/create`
- `GET /api/admin/backup/list`
- `GET /api/admin/backup/download/{filename}`
- `DELETE /api/admin/backup/list` (con filename en body)
- `GET/POST /api/admin/backup/schedule`
- `POST /api/admin/backup/restore`

---

## API ROUTES (resumen completo)

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/admin/auth/login` | POST | Autenticación → cookie de sesión |
| `/api/admin/auth/logout` | POST | Cerrar sesión |
| `/api/admin/auth/me` | GET | Info del usuario actual |
| `/api/admin/overview` | GET | Datos del dashboard (KPIs + tablas) |
| `/api/admin/heartbeat` | GET | Estado del sistema |
| `/api/admin/reservas` | GET | Listado de reservas |
| `/api/admin/reservas/{id}` | PATCH/DELETE | Actualizar / eliminar reserva |
| `/api/admin/reservas/stream` | GET | EventSource de actualizaciones en tiempo real |
| `/api/admin/pedidos` | GET | Listado de pedidos |
| `/api/admin/pedidos/{id}` | PATCH/DELETE | Actualizar estado / eliminar pedido |
| `/api/admin/servicios` | GET/POST | Listado / crear servicio |
| `/api/admin/servicios/{id}` | PATCH/DELETE | Actualizar / eliminar servicio |
| `/api/admin/menus` | GET/PUT | Menús JSON (estructura completa) |
| `/api/admin/carta` | GET/POST | Productos Take Away |
| `/api/admin/carta/{id}` | PATCH/DELETE | Actualizar / eliminar producto |
| `/api/admin/galeria` | GET/POST | Galería de fotos |
| `/api/admin/galeria/{id}` | PATCH/DELETE | Actualizar / eliminar foto |
| `/api/admin/reviews` | GET | Listado de reviews |
| `/api/admin/reviews/{id}` | PATCH/DELETE | Aprobar / eliminar review |
| `/api/admin/analytics` | GET | Datos de visitas por página |
| `/api/admin/leads` | GET | Listado de leads |
| `/api/admin/leads/historial` | GET | Historial de reservas de un lead |
| `/api/admin/leads/sync` | POST | Recalcular leads desde reservas y pedidos |
| `/api/admin/tags` | GET/POST | Tags manuales de leads |
| `/api/admin/cupones` | GET/POST | Listado / crear cupón |
| `/api/admin/cupones/{id}` | PATCH/DELETE | Toggle activo / eliminar cupón |
| `/api/admin/trabajadores` | GET/POST | Listado / crear usuario |
| `/api/admin/trabajadores/{id}` | PATCH/DELETE | Actualizar / eliminar usuario |
| `/api/admin/configuracion/general` | GET/POST | Config general (timezone) |
| `/api/admin/configuracion/email` | GET/POST | Config email |
| `/api/admin/configuracion/email/test` | POST | Email de prueba |
| `/api/admin/configuracion/takeaway` | GET/POST | Config Take Away |
| `/api/admin/configuracion/stripe` | GET/POST | Config Stripe |
| `/api/admin/agente` | GET/PUT | Config agente IA |
| `/api/admin/upload` | POST | Subida de imágenes |
| `/api/admin/backup/create` | POST | Crear backup |
| `/api/admin/backup/list` | GET/DELETE | Listar / eliminar backups |
| `/api/admin/backup/download/{f}` | GET | Descargar backup |
| `/api/admin/backup/schedule` | GET/POST | Config backup programado |
| `/api/admin/backup/restore` | POST | Restaurar backup |

---

## GESTIÓN DE ESTADO & SESIÓN

### Autenticación
- Cookie de sesión tras login
- Hook `useSession()` → `{role, loaded}`
- Roles: `admin` | `editor` | `general`
- Páginas protegidas según rol (Trabajadores y Configuración solo para admin)

### Caché
- `sessionStorage` en la mayoría de páginas para evitar re-fetching innecesario
- Auto-refresh periódico en Overview (30s) y Pedidos (5s)
- EventSource en Reservas para actualizaciones en tiempo real

---

## IDIOMA / I18N

- Hook `useAdminLanguage()` → `{lang, setLang, tr}`
- Idiomas: `es` | `en`
- Más de 200 claves en `lib/i18n.ts` bajo `tr.admin`
- Componente `LanguageSelector` en el header
- Persiste en localStorage

---

## ENTIDADES DE BASE DE DATOS

| Entidad | Usado en |
|---|---|
| `Reserva` | Reservas, Leads, Dashboard |
| `Pedido` | Pedidos, Dashboard, Analytics |
| `Servicio` | Servicios |
| `MenuItem` | Carta (Take Away) |
| `MenuItemJSON` | Carta (Menús JSON) |
| `Foto` | Galería |
| `Review` | Reviews |
| `Cupon` | Cupones |
| `Usuario` | Trabajadores, Auth |
| `Visita` | Analytics |
| `Lead` / `Cliente` | Leads |
| `Configuracion` | Config, Heartbeat |
| `ClienteTag` | Tags de Leads |

---

## INTEGRACIONES EXTERNAS

| Integración | Uso |
|---|---|
| **Stripe** | Procesamiento de pagos (configuración desde admin) |
| **Email SMTP** | Notificaciones (reservas, servicios, pedidos) |
| **Anthropic / OpenAI** | Agente IA del chat flotante del web |
| **Subida de imágenes** | `/api/admin/upload` |
| **Backup de archivos** | Descarga directa de archivos .tar/.sql |

---

## FLUJOS PRINCIPALES DE ADMINISTRACIÓN

### 1. Gestionar una reserva
Reservas → Filtrar → Click fila → Modal → Cambiar estado (confirmada/cancelada) o Eliminar

### 2. Avanzar estado de un pedido
Pedidos → Fila con botón de acción → Click → Estado avanza automáticamente

### 3. Gestionar carta
Carta → Pestaña (Mexicana/Sushi/Bebidas/Take Away) → Editar plato en modal → Auto-guardado

### 4. Aprobar reseña
Reviews → Pestaña Pendientes → Botón Aprobar → Pasa a Aprobadas y aparece en la web

### 5. Ver perfil de un cliente
Leads → Buscar → Expandir fila → Ver historial de reservas + tags

### 6. Crear cupón de descuento
Cupones → Rellenar formulario → Crear → Compartir código con cliente

### 7. Configurar pagos
Configuración → Pestaña Stripe → Introducir claves → Guardar

### 8. Crear backup
Configuración → Pestaña Backup → Seleccionar items → Crear Backup → Descargar

### 9. Añadir trabajador
Trabajadores → Añadir → Rellenar datos + rol → Guardar

---

## TEMA VISUAL

| Elemento | Valor |
|---|---|
| Color principal | Dorado `#c9a84c` |
| Fondo general | `#0a0a0f` |
| Texto | Blanco con variaciones de opacidad |
| Tipografía headings | Georgia / serif |
| Tipografía body | system-ui / sans-serif |
| Bordes | 1px dorado semitransparente |
| Iconos | lucide-react |
| Zoom | 1.2× en el contenido principal |

---

*Generado el 2026-06-23*
