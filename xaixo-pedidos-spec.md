# Especificación técnica — App de gestión de pedidos XAIXO

## 1. Objetivo

Sustituir el tablón físico de post-its por una web app interna donde el equipo de XAIXO
Materiales de Construcción da de alta, consulta y reorganiza los pedidos de transporte
(portes propios y tráilers directos de fábrica) de forma centralizada.

## 2. Stack recomendado

Mismo stack que Floi, por consistencia y porque ya se conoce el flujo de trabajo con Claude Code:

- **Frontend**: Next.js 14 (App Router)
- **Backend/DB**: Supabase (Postgres + Auth + Realtime)
- **Hosting**: Vercel
- **Drag & drop**: `@dnd-kit/core` (ligera, sin dependencias pesadas)
- **Auth**: Supabase Auth, email + contraseña, sin registro público (usuarios creados a mano
  por un admin desde el panel de Supabase o desde una pantalla interna simple)

## 3. Modelo de datos (ver `xaixo-pedidos-schema.sql` para el SQL completo)

### Tabla `camiones`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| nombre | text | ej. "Franjo", "David" |
| capacidad_toneladas | numeric | 9 o 13 |
| chofer_habitual | text | |
| tipo | text | `porte_propio` |

### Tabla `pedidos`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| cliente | text | obligatorio |
| direccion | text | dirección de entrega u obra |
| material | text | |
| cantidad | numeric | |
| unidad | text | default `toneladas` |
| tipo | text | `porte_propio` \| `trailer_fabrica` |
| camion_id | uuid | FK a `camiones`, **nullable** (se puede dejar sin asignar) |
| chofer | text | nullable |
| fabrica_origen | text | solo si tipo = trailer_fabrica |
| obra | text | solo si tipo = trailer_fabrica |
| fecha_entrega | date | obligatorio, es la que se arrastra entre días |
| franja_horaria | text | opcional, ej. "mañana", "tarde" |
| estado | text | `pendiente` \| `confirmado` \| `entregado` \| `cancelado` |
| notas | text | |
| creado_por | uuid | FK a auth.users |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Regla de bloqueo (clave del negocio)
Una vez `estado = 'entregado'` o `estado = 'cancelado'`, el registro **no se puede modificar**
(ni día, ni camión, ni cantidad, nada). Se implementa con un trigger `BEFORE UPDATE` en Postgres
que rechaza el update si el estado anterior ya era `entregado`/`cancelado` (ver SQL).

## 4. Pantallas

### 4.1 Login
Supabase Auth estándar, email + contraseña. Sin opción de registro público.

### 4.2 Vista calendario semanal (vista por defecto, intercambiable)
- Columnas: Lunes a Viernes (rango de semana navegable con flechas ← →).
- Cada pedido = tarjeta arrastrable (`@dnd-kit`) entre columnas de día.
- Al soltar en otra columna → update de `fecha_entrega` en Supabase.
- Tarjetas bloqueadas (`entregado`/`cancelado`) no son arrastrables (drag deshabilitado + opacidad reducida + icono de candado).

### 4.3 Vista tablero por camión/chofer (intercambiable con la anterior mediante un toggle)
- Columnas: Franjo, David, Tráilers fábrica (esta última agrupa todos los `trailer_fabrica` sin importar quién los lleva).
- Mismo comportamiento de arrastre, pero mover una tarjeta aquí cambia `camion_id`, no el día.
- Si la suma de toneladas de un camión en un día supera su capacidad → borde de aviso en rojo (`--border-danger`) en esa columna/día, sin bloquear la acción (solo aviso visual).

### 4.4 Formulario de alta / edición (modal)
Campos, en este orden:
1. Tipo de pedido: `porte_propio` / `trailer_fabrica` (toggle, cambia campos siguientes)
2. Cliente (input con autocompletado de clientes ya usados — buscar en pedidos anteriores)
3. Dirección / Obra
4. Material
5. Cantidad + unidad
6. Fecha de entrega (date picker)
7. Franja horaria (opcional)
8. Camión (select, opcional, incluye "Sin asignar")
9. Chofer (autocompletado según camión elegido)
10. Si `trailer_fabrica`: Fábrica origen
11. Notas (textarea libre)

Botón "Guardar" grande, sin campos raros — el objetivo es rellenar esto en menos de 30 segundos
durante una llamada de teléfono.

### 4.5 Código de color y estado visual (ya validado con mockup)
- Azul → Franjo (13t)
- Verde → David (9t)
- Naranja/coral → Tráiler fábrica
- Borde sólido → confirmado
- Borde punteado → pendiente
- Icono candado + opacidad reducida → entregado/cancelado (bloqueado)

## 5. Fuera de alcance (v1)
- Notificaciones (WhatsApp, email, push) — descartado por ahora.
- Acceso de clientes externos — solo empleados.
- Reparto de un pedido en varios camiones — siempre 1 pedido = 1 camión = 1 viaje.
- Lectura automática de WhatsApp — el pedido se transcribe manualmente al formulario.

## 6. Orden de construcción sugerido para Claude Code
1. Setup proyecto Next.js + Supabase (auth incluida).
2. Ejecutar `xaixo-pedidos-schema.sql` en el proyecto Supabase.
3. CRUD básico de pedidos (sin drag & drop todavía) — formulario + listado simple.
4. Vista calendario semanal con drag & drop (`@dnd-kit`).
5. Vista tablero por camión con drag & drop.
6. Toggle entre ambas vistas.
7. Lógica de bloqueo visual (candado, no-drag) para `entregado`/`cancelado`.
8. Aviso visual de sobrecarga de toneladas por camión/día.
9. Autocompletado de clientes en el formulario.
