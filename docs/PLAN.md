# Plan de proyecto — Automotores Batalla

> Estado: borrador v1 para validar con el cliente. Lo marcado con ⚠️ **VERIFICAR** no está confirmado y debe contrastarse con la documentación oficial de Meta antes de implementarse.

---

## 1. Resumen y supuestos

**Qué es:** sitio de catálogo de autos 0km y usados (con permutas y consignaciones) + panel de administración + analytics de Instagram para el dueño.

**Objetivo principal:** mostrar catálogo y generar consultas (WhatsApp y formulario). **Secundario:** dashboard simple de crecimiento de @automotoresbatalla.

**Supuestos**
- Tráfico mayoritariamente mobile, proveniente de Instagram → todo se diseña mobile-first y con presupuesto de peso estricto.
- Un solo desarrollador → monorepo, un solo lenguaje (TypeScript), pocas piezas móviles.
- Catálogo chico/mediano (decenas de autos, no miles) → no hace falta Elasticsearch ni colas externas; PostgreSQL alcanza.
- Un solo negocio (no multi-tenant) y 1–3 usuarios del panel.
- Cuenta de Instagram con ~5.900 seguidores (supera el umbral de 100 para `follower_count`).
- Datos confirmados: WhatsApp +54 3772 65-4605, horario L–V 8:30–12:30 y 16:30–20:30, servicios 0km/usados/permutas/consignaciones. Todo lo demás vive en configuración (ver §7).

### 1.1 Estrategia: demo primero (decisión vigente)
Todavía no se habló con el dueño. El primer objetivo es una **demo navegable** para mostrarle y ver si le interesa. Por eso:
- **Se construyen** catálogo, ficha, 360°, simulador, consultas y un panel básico, con **autos de ejemplo ficticios** (seed) y tokens de marca provisorios.
- **NO se implementa nada de Meta/Instagram API** (OAuth, permisos, tokens, insights, snapshots, App Review, app en Meta for Developers) hasta que el dueño apruebe. No se crea el módulo `instagram` ni las tablas `Ig*`.
- En la demo, Instagram aparece solo como **links a @automotoresbatalla** (header, footer, ficha) y, si se quiere mostrar la idea del feed, una sección "Últimas publicaciones" con **datos de maqueta claramente marcados** como demostrativos (sin copiar contenido del perfil real). El dashboard de analytics se puede mostrar como **mockup estático con datos ficticios** (opcional, para vender la idea).
- Lo diseñado en §2.4 (`Ig*`), §2.5 (endpoints `/instagram`) y §3.2 queda como **diseño de referencia para la Fase 3**, que arranca solo tras el visto bueno del cliente.
- Con la demo aprobada, se completan las preguntas pendientes (§7) y se decide si seguir con producción real.

---

## 2. Arquitectura

### 2.1 Diagrama

```
 Visitante (mobile) ──► Next.js (Railway svc "web") ──SSR/ISR──► NestJS (Railway svc "api") ──► PostgreSQL (Railway)
        │                      │                                    │   │
        │                      │ next/image                         │   ├─► Meta Graph API (OAuth, insights, media)  [solo backend]
        │                      ▼                                    │   └─► Cron: snapshots IG, refresco de token, caché feed
        └──────► CDN/Storage de imágenes (Cloudflare R2) ◄── sharp ──┘
 Dueño (admin) ──► /admin (Next.js, cookies httpOnly) ──► API /admin/*
```

### 2.2 Monorepo vs repos separados → **Monorepo (pnpm workspaces)**
Una persona, tipos y esquemas de validación compartidos (`packages/shared`), un solo PR por feature. Railway soporta desplegar servicios desde subcarpetas de un mismo repo.

```
batalla/
├─ apps/
│  ├─ web/                 # Next.js App Router
│  │  ├─ app/(public)/     # home, autos, financiacion, contacto, nosotros
│  │  ├─ app/admin/        # panel (login, autos, consultas, config, instagram)
│  │  ├─ components/       # CarCard, FilterBar, Spin360Viewer, Gallery, ...
│  │  ├─ lib/              # api client, formatters (ARS/USD), seo helpers
│  │  └─ styles/tokens.css # tokens de diseño (placeholders)
│  └─ api/                 # NestJS
│     ├─ src/modules/      # ver 2.3
│     ├─ src/common/       # guards, filters, interceptors, crypto
│     └─ prisma/           # schema.prisma, migrations, seed.ts
├─ packages/shared/        # zod schemas, enums, tipos DTO
├─ seed/autos/<slug>/{fotos/,360/}   # assets de ejemplo (fuera de git si pesan; ver CLAUDE.md)
├─ docs/                   # BRIEF.md, PLAN.md
├─ CLAUDE.md
└─ pnpm-workspace.yaml
```

### 2.3 Módulos de NestJS
| Módulo | Responsabilidad |
|---|---|
| `auth` | Login, refresh, roles, guards |
| `users` | Usuarios del panel |
| `cars` | ABM autos, filtros, estados, destacados |
| `media` | Subida, procesado (sharp), orden y borrado de fotos y frames 360 |
| `spin` | Secuencias 360 (derivado de `media`, endpoints propios de orden) |
| `inquiries` | Consultas (formulario) + estados + notificación al panel |
| `settings` | Contacto, horarios, simulador (clave/valor tipado) |
| `finance` | Cálculo de cuotas (misma lógica que el front, validada en server) |
| `instagram` | OAuth, tokens cifrados, sync de media, insights, snapshots, feed público |
| `jobs` | Crons (`@nestjs/schedule`) |
| `seo` | Datos para sitemap y JSON-LD |
| `health` | `/health` para Railway |

### 2.4 Modelo de datos (Prisma, entidades y relaciones)

- **User**(id, email único, passwordHash [argon2], role `ADMIN|EDITOR`, active, createdAt)
- **Car**(id, slug único, brand, model, version?, year, condition `ZERO_KM|USED`, priceAmount, priceCurrency `ARS|USD`, mileageKm?, fuel, transmission, bodyType?, color?, doors?, engine?, description, status `AVAILABLE|RESERVED|SOLD`, featured, onOffer, offerPrice?, publishedAt, createdAt, updatedAt) — índices: (status, condition), brand, year, price.
- **CarPhoto**(id, carId→Car, storageKey, width, height, position, alt, isCover)
- **SpinSequence**(id, carId→Car **1:1**, frameCount, status `DRAFT|READY`, createdAt)
- **SpinFrame**(id, sequenceId→SpinSequence, position, storageKey, width, height) — único (sequenceId, position)
- **Inquiry**(id, carId?→Car, name, phone, email?, message, source `FORM|WHATSAPP`, status `NEW|CONTACTED|CLOSED`, readAt?, createdAt)
- **Setting**(key PK, value JSON, updatedAt) — `contact`, `hours`, `finance`
- **InstagramAccount**(id, igUserId, username, accountType, encAccessToken, tokenExpiresAt, scopes, connectedAt, lastSyncAt, status `ACTIVE|EXPIRED|ERROR`)
- **IgMedia**(id, igMediaId único, mediaType, permalink, caption, thumbnailKey [copia propia], timestamp, isStory, expiresAt?)
- **IgMediaSnapshot**(id, mediaId→IgMedia, capturedAt, reach?, views?, likes?, comments?, saves?, shares?, raw JSON) — **campos nullable: null ≠ 0**
- **IgAccountSnapshot**(id, accountId, date, followers?, reach?, views?, profileViews?, raw JSON) — único (accountId, date)

Notas: el precio se guarda con su moneda original (no se convierte). Los frames se ordenan por `position`, nunca por fecha de subida.

### 2.5 Endpoints principales

**Públicos** (`/api/...`, cacheables)
- `GET /cars?brand&model&yearMin&yearMax&priceMin&priceMax&kmMax&fuel&transmission&condition&q&sort&page&pageSize`
- `GET /cars/filters` (marcas/modelos/rangos disponibles)
- `GET /cars/:slug` (incluye fotos y frames)
- `GET /cars/featured`
- `POST /inquiries` (rate limit + honeypot)
- `GET /settings/public` (contacto, horarios, simulador)
- `GET /instagram/feed` (cacheado; devuelve `[]` si falla)
- `GET /seo/sitemap`

**Admin** (`/api/admin/...`, JWT + rol)
- `POST /auth/login | /auth/refresh | /auth/logout`
- `CRUD /admin/cars`, `PATCH /admin/cars/:id/status`, `PATCH /admin/cars/:id/featured`
- `POST /admin/cars/:id/photos` (multipart, múltiple), `PATCH .../photos/reorder`, `DELETE .../photos/:photoId`
- `POST /admin/cars/:id/spin` (multipart múltiple; orden por nombre), `PATCH .../spin/reorder`, `DELETE .../spin`
- `GET/PATCH /admin/inquiries`, `PATCH /admin/inquiries/:id`
- `GET/PUT /admin/settings/:key`
- `GET /admin/instagram/connect` (inicia OAuth) · `GET /admin/instagram/callback` · `DELETE /admin/instagram` (desconectar)
- `GET /admin/instagram/overview?range=` · `/posts` · `/stories` · `/best`

---

## 3. Decisiones técnicas

| Tema | Decisión | Justificación (1 línea) |
|---|---|---|
| ORM | **Prisma** | Migraciones y tipos autogenerados, menos boilerplate que TypeORM para un dev solo; el modelo es relacional simple. |
| Monorepo | pnpm workspaces | Tipos/zod compartidos sin publicar paquetes. |
| Validación | zod en `shared` (+ `nestjs-zod` o pipe propio) | Mismo esquema en front y back. |
| Almacenamiento imágenes | **Cloudflare R2 (S3-compatible) + dominio/CDN propio** | El disco de un servicio Railway es efímero y los Volumes atan datos a una instancia; R2 tiene free tier generoso y sin costo de egreso. Alternativa: bucket S3-compatible de Railway ⚠️ **VERIFICAR** disponibilidad y precio. Se accede vía SDK S3 con adaptador, así que cambiar de proveedor es una variable de entorno. |
| Procesado de imágenes | `sharp` en el upload | Genera WebP en 3 anchos (480/960/1600; para 360: 480/800) y guarda original comprimido; evita depender de CDN de transformación. |
| AVIF | Opcional, fase 4 | WebP basta para el MVP; AVIF cuesta más CPU en el upload y poco beneficio inicial. |
| Auth admin | Email + contraseña (argon2), JWT de acceso corto (15 min) + refresh rotativo, ambos en **cookies httpOnly/Secure/SameSite=Lax**; roles `ADMIN`/`EDITOR` | Sin tokens en localStorage; middleware de Next protege `/admin`; guard de Nest autoritativo. |
| Rate limiting | `@nestjs/throttler` (global + estricto en login y `/inquiries`) | Mitiga fuerza bruta y spam. |
| Cron | `@nestjs/schedule` dentro de la API | Una sola instancia en Railway; si se escala, usar advisory lock de Postgres. |
| Cifrado de tokens IG | AES-256-GCM con clave en `TOKEN_ENC_KEY` | Tokens nunca en claro en DB ni en logs. |
| Cache feed | Tabla `IgMedia` + miniaturas copiadas a R2 | Las URLs de media de Meta expiran; copiar evita imágenes rotas. |

### 3.1 Visor 360°
- **Implementación propia** (sin librería): `<canvas>` o `<img>` intercambiado según frame, con Pointer Events (mouse y touch con `touch-action: pan-y` para no bloquear el scroll vertical), inercia opcional, autoplay opcional que se pausa al interactuar, respeta `prefers-reduced-motion`. Teclado: flechas izq/der.
- **Datos:** `SpinSequence` 1:1 con `Car` y `SpinFrame(position)`. Subida múltiple: se ordena por nombre natural (`frame-01`, `frame-02`, …, `frame-10`) y se asigna `position`; el admin puede reordenar después.
- **Formato:** WebP calidad ~75, 24–36 frames. Anchos: 480 (mobile 3G/4G lento), 800 (mobile normal/tablet), 1280 (desktop). Se elige con `srcset`/lógica por `devicePixelRatio` y `navigator.connection` si está disponible.
- **Carga progresiva (mobile):** 1) frame 0 como poster inmediato (ya viene en la galería); 2) el visor se activa solo al entrar en viewport (IntersectionObserver) o al tocar "Ver en 360°"; 3) carga frames con paso 4 (0,4,8…) → ya es rotable con baja resolución; 4) completa los intermedios en idle; 5) indicador de progreso. Con `saveData` o conexión 2g se pide tap explícito.
- **Fallback:** sin secuencia (o con menos de N frames cargados) se muestra solo la galería; el botón 360 no aparece.
- **3D real (GLB + three.js): fase posterior, no MVP.** Requiere modelado/escaneo por unidad (costoso y no escalable para autos usados), ~MBs por modelo, más complejidad de rendering y fidelidad inferior a fotos reales. Las fotos 360 ya dan el 90% del valor.

### 3.2 Instagram

**Embeds oficiales vs. grilla propia → grilla propia con imágenes cacheadas.** Los embeds cargan scripts de terceros pesados (mal para Core Web Vitals), dependen de oEmbed que exige permisos/aprobación adicionales ⚠️ **VERIFICAR**, y no son estilizables. La grilla propia es gratis, rápida y bajo nuestro control. El sitio nunca depende de Instagram en tiempo de render: si no hay token o falla, `GET /instagram/feed` devuelve `[]` y el front muestra solo el CTA al perfil.

**Instagram Login vs. Facebook Login**
| | API with Instagram Login | API with Facebook Login |
|---|---|---|
| Requiere Página de Facebook vinculada | No | Sí |
| Complejidad de onboarding del dueño | Baja | Media/alta |
| Métricas | Insights de cuenta y media disponibles; **paridad exacta con la otra opción sin confirmar** | Históricamente más completa ⚠️ **VERIFICAR** |
| Permisos típicos | `instagram_business_basic`, `instagram_business_manage_insights` ⚠️ **VERIFICAR nombres vigentes** | `instagram_basic`, `instagram_manage_insights`, `pages_show_list` ⚠️ **VERIFICAR** |

**Recomendación:** empezar con **Instagram Login** (el dueño no necesita Página ni Business Manager; menos fricción). Antes de la Fase 3 se hace un **spike de 1 día**: crear la app, conectar la cuenta real y listar qué métricas devuelve realmente. Si faltara alguna esencial (alcance, seguidores, stories), se evalúa Facebook Login. El módulo `instagram` abstrae el proveedor detrás de una interfaz para poder cambiar.

**Configuración en Meta for Developers** (⚠️ todo a verificar contra la documentación oficial vigente)
1. Crear app en developers.facebook.com con el producto de Instagram correspondiente.
2. Agregar la cuenta del dueño como rol de la app (Instagram Tester/Developer) → permite usar la app con **modo desarrollo** sin App Review, solo para cuentas con rol. Dado que es una única cuenta propia del cliente, es probable que no haga falta App Review; confirmar si requiere "Business Verification" para acceso estándar.
3. Configurar redirect URI OAuth (`https://<api>/api/admin/instagram/callback`), política de privacidad pública y URL de eliminación de datos (páginas simples en el sitio).
4. Pasar a modo Live solo si Meta lo exige.

**Tokens:** token de corta duración → canje por long-lived (~60 días) → job diario que renueva cuando faltan <15 días (endpoint de refresh) ⚠️ **VERIFICAR condiciones de refresh**. Si falla, estado `EXPIRED` y aviso en el panel con botón "Reconectar".

**Requisito de cuenta:** Business o Creator. El panel incluye una guía paso a paso (Perfil → Configuración y actividad → Tipo de cuenta y herramientas → Cambiar a cuenta profesional) ⚠️ los nombres de menú pueden variar; revisar capturas reales con el cliente.

**Historias y snapshots**
- Cron cada ~hora: lista stories activas (viven 24 h), guarda `IgMedia(isStory)` y, **antes de que expiren**, un `IgMediaSnapshot` con insights. Si la API devuelve error o falta de datos (p. ej. menos de 5 espectadores), se guarda `null`, no 0, y la UI muestra "Sin datos suficientes".
- Cron diario: `IgAccountSnapshot` (seguidores, alcance, vistas). Con ≥100 seguidores `follower_count` está disponible; igualmente se guarda null si no llega.
- Posts/reels: snapshot a las 24 h, 7 d y 30 d desde su publicación (y diario las primeras semanas si el límite de rate lo permite).
- Datos con demora de hasta 48 h: la UI marca los últimos 2 días como "provisorios".
- La evolución de seguidores propia empieza el día de conexión (la API no da histórico completo) → se aclara en la UI.

---

## 4. Plan de frontend

### 4.1 Sistema de diseño (tokens configurables)
Archivo `styles/tokens.css` con variables CSS + mapeo en Tailwind (`theme.extend.colors` apuntando a `var(--...)`). **Valores placeholder hasta recibir el logo**; se extraen del archivo real.

```css
:root {
  /* candidatos a validar con el logo */
  --color-brand-black:  #111111;   /* PLACEHOLDER */
  --color-brand-red:    #D32F2F;   /* PLACEHOLDER */
  --color-brand-cream:  #F6F0E4;   /* PLACEHOLDER */
  --color-brand-gold:   #C9A227;   /* PLACEHOLDER */
  --color-brand-sky:    #75AADB;   /* PLACEHOLDER (celeste) */
  --color-surface: var(--color-brand-cream);
  --color-text: var(--color-brand-black);
  --color-accent: var(--color-brand-red);
  --font-display: "TBD", system-ui, sans-serif;  /* pedir/definir tipografía */
  --font-body: system-ui, sans-serif;
  --radius-sm: 6px; --radius-md: 12px; --radius-lg: 20px;
  --shadow-card: 0 2px 8px rgb(0 0 0 / .08);
}
```
Reglas: contraste AA mínimo (el rojo sobre crema y el dorado sobre blanco se validan; el dorado se usa como detalle, no como color de texto), `font-display: swap`, 1–2 fuentes máximo.

### 4.2 Páginas y rutas
| Ruta | Contenido | Render |
|---|---|---|
| `/` | Hero + CTA WhatsApp, destacados, ofertas, servicios (0km/usados/permutas/consignaciones), Últimas publicaciones IG, ubicación/horarios | ISR (revalidate corto) |
| `/autos` | Catálogo con FilterBar, orden, paginación; filtros en query string | SSR con caché |
| `/autos/[slug]` | Galería + 360, datos técnicos, WhatsApp, simulador, consulta, IG, JSON-LD | ISR + revalidación on-demand al editar |
| `/financiacion` | Simulador general | Estático + client |
| `/contacto` | Formulario, mapa, horarios, WhatsApp | Estático |
| `/nosotros` | Historia, servicios (contenido a confirmar) | Estático |
| `/sitemap.xml`, `/robots.txt` | Generados desde la API | — |
| `/admin/login`, `/admin`, `/admin/autos[/nuevo|/:id]`, `/admin/consultas`, `/admin/configuracion`, `/admin/instagram` | Panel | CSR protegido |

### 4.3 Componentes clave
- **CarCard**: foto de portada, marca/modelo/año, km, precio (ARS/USD), badge 0km/Usado/Reservado/Vendido.
- **FilterBar**: drawer en mobile, sidebar en desktop; sincroniza con `searchParams`; chips de filtros activos.
- **Gallery**: carrusel con swipe, miniaturas, lightbox accesible.
- **Spin360Viewer**: ver §3.1.
- **WhatsAppButton**: `https://wa.me/<WA>?text=` + `encodeURIComponent("Hola! Me interesa el {marca} {modelo} {año}: {url}")`. Flotante en mobile.
- **InstallmentSimulator**: precio − anticipo → cuotas por plazo con tasa del panel (fórmula francesa; aclarar que es **orientativa**). Muestra moneda del auto.
- **InstagramFeed**: grilla de 6 posts con miniatura cacheada; oculta/degrada si no hay datos.
- **DashboardCharts**: tarjetas KPI + líneas (seguidores, alcance), barras (por publicación), tabla "mejores publicaciones"; textos del tipo "Alcanzaste 1.200 personas más que la semana pasada".
- Admin: `CarForm`, `PhotoUploader` (drag & drop + reordenar), `SpinUploader`, `InquiryTable`, `SettingsForm`.

### 4.4 Estados
Cada vista define: **carga** (skeletons con la forma final, sin layout shift), **vacío** ("No encontramos autos con esos filtros" + botón limpiar), **error** (mensaje claro + reintentar + WhatsApp como alternativa). Error boundaries por ruta (`error.tsx`, `loading.tsx`, `not-found.tsx`).

### 4.5 Rendimiento y accesibilidad
- `next/image` con `sizes` correctos, `priority` solo en LCP; lazy en el resto. 360 no usa `next/image` (frames precargados manualmente).
- Presupuesto: LCP < 2.5 s en 4G, CLS < 0.1, JS inicial mínimo (visor y simulador con `dynamic()`).
- A11y: foco visible, `alt` por foto (autogenerado "Marca Modelo Año – foto N", editable), navegación por teclado, labels en formularios, `aria-live` para resultados del simulador.
- SEO: `generateMetadata`, Open Graph por auto, JSON-LD `Car`/`Vehicle` (+ `Offer`) y `AutoDealer` en el layout, URLs `/autos/marca-modelo-ano-id`.

---

## 6. Roadmap (esfuerzo: S ≈ 1–2 días, M ≈ 3–5, L ≈ 1–2 semanas)

### Fase 0 — Setup (S–M)
- Monorepo pnpm, TS estricto, ESLint/Prettier, Husky opcional.
- Next + Nest + Prisma + Postgres local (docker compose).
- Proyecto Railway: 3 servicios, variables, deploy automático desde `main`, `/health`.
- Tokens de diseño placeholder + layout base.
- **Aceptación:** `pnpm dev` levanta todo; deploy en Railway muestra home vacía y `/health` OK; migración inicial aplicada.

### Fase 1 — MVP catálogo + consultas + panel (L)
1. Auth + roles + seed del admin (M). *Aceptación:* login/logout/refresh; `EDITOR` no accede a settings/usuarios; rate limit en login.
2. ABM autos + estados + destacado (M). *Aceptación:* crear/editar/archivar; slug único; validación zod.
3. Upload y orden de fotos con sharp + R2 (M). *Aceptación:* múltiples fotos, reordenables, 3 tamaños WebP, borrado limpia storage.
4. Catálogo público con filtros en URL, orden y paginación (M). *Aceptación:* URL compartible reproduce el filtro; estados carga/vacío/error.
5. Ficha del auto + WhatsApp + SEO básico (M). *Aceptación:* mensaje prellenado correcto; metadatos y JSON-LD válidos (Rich Results Test).
6. Home, Contacto, Nosotros (S–M). 
7. Formulario de consulta + panel de consultas con contador de nuevas (M). *Aceptación:* se guarda, rate limit + honeypot, cambio de estado.
8. Settings (contacto/horarios) + sitemap/robots (S).
9. Seed (S–M) — ver CLAUDE.md.
- **Aceptación de fase:** el dueño carga un auto con fotos desde el celular y aparece en el sitio; Lighthouse mobile ≥ 90 en performance y SEO en ficha y catálogo.

### Fase 2 — 360° y simulador (M–L)
- Subida múltiple de frames con orden por nombre y reordenamiento (M).
- `Spin360Viewer` con touch, autoplay, precarga progresiva, fallback (M–L).
- Simulador + configuración desde panel + leyenda de simulación orientativa (M).
- **Aceptación:** 30 frames giran fluido en un celular de gama media; sin secuencia no aparece el botón; cuotas coinciden con una planilla de control.

### Hito Demo (tras Fases 0, 1 y 2, o una versión recortada)
- Desplegada en Railway con seed ficticio, mobile impecable, links a Instagram y WhatsApp funcionando.
- Opcional: sección de feed y dashboard como maqueta con datos ficticios.
- **Aceptación:** se puede mostrar al dueño desde su celular en 5 minutos: ver catálogo, filtrar, abrir un auto en 360°, simular cuotas, enviar consulta.

### Fase 3 — Instagram: feed y analytics (L) — ⏸ NO INICIAR hasta que el dueño apruebe el proyecto
0. **Spike de Meta** (S): app en modo desarrollo, conectar cuenta real, listar métricas disponibles (resuelve los ⚠️).
1. OAuth + tokens cifrados + refresco automático + guía Business/Creator (M).
2. Sync de media + feed público con miniaturas cacheadas y degradación elegante (M).
3. Snapshots (cuenta diaria, stories horarias, posts 24 h/7 d/30 d) (M).
4. Dashboard: seguidores, alcance, vistas, interacciones, por post/reel/historia, mejores publicaciones, comparativa semanal/mensual (L).
- **Aceptación:** conectar con un clic; token se renueva solo (probado con expiración simulada); con Meta caído el sitio sigue funcionando; "sin datos" ≠ 0; stories guardadas tras 24 h.

### Fase 4 — Mejoras (según prioridad)
AVIF, notificación por email/WhatsApp de nuevas consultas, favoritos/comparador, tasación de permuta (formulario), consignaciones (landing), analytics del sitio (Plausible/GA), 3D GLB (evaluar), backups verificados con restauración de prueba, importación masiva CSV.

---

## 7. Preguntas pendientes para el cliente

**Identidad y contenido**
1. Archivo del logo en alta (SVG/PNG con transparencia) y, si existe, manual de marca/tipografías.
2. ¿Dominio propio? ¿Ya lo tienen registrado?
3. Textos para "Nosotros" (historia, equipo, años de trayectoria) y fotos del local.

**Datos del negocio**
4. Dirección exacta, ciudad y link de Google Maps.
5. Horario de sábados (la bio está cortada) y feriados.
6. Marcas que comercializan (y si venden 0km de alguna concesión oficial o como multimarca).
7. Email de contacto y teléfono fijo (si existen).
8. ¿Un solo WhatsApp o varios vendedores?
9. ¿Cómo operan permutas y consignaciones? ¿Querés formulario específico de tasación?

**Catálogo y operación**
10. ¿Cuántos autos hay en stock y con qué frecuencia cambian?
11. ¿Quién va a cargar los autos (dueño, empleado)? ¿Cuántos usuarios del panel?
12. ¿Cuentan con sesión de fotos 360 ya hecha o hay que definir cómo fotografiarlos (cantidad de frames, equipo)?
13. ¿Mostrar precio siempre o permitir "consultar precio"? ¿En qué moneda publican (ARS, USD, ambas)?
14. Condiciones de financiación reales: entidades, tasas, plazos, anticipos mínimos.

**Instagram**
15. ¿La cuenta es Business/Creator hoy o personal? ¿Tiene Página de Facebook vinculada?
16. ¿Quién es el administrador de la cuenta y puede autorizar la conexión de la app (rol de tester)?
17. ¿Aceptan una política de privacidad/eliminación de datos publicada en el sitio (requerida por Meta)? ⚠️ **VERIFICAR**
18. ¿Les interesa mostrar reels/historias en el sitio o solo posts?

**Técnicas / presupuesto**
19. Presupuesto mensual tolerable para infraestructura (Railway + storage + dominio).
20. ¿Políticas legales (términos, privacidad, defensa del consumidor/ley de precios)? Argentina exige ciertos datos visibles; validar con contador/abogado.
