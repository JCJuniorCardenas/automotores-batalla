# Automotores Batalla — contexto permanente para Claude Code

> El brief original está en `docs/BRIEF.md`; el plan completo en `docs/PLAN.md`. Ante contradicción, manda este archivo.

## Proyecto
Sitio web de **Automotores Batalla** (@automotoresbatalla), concesionaria de autos 0km y usados, con permutas y consignaciones.
- **Objetivo principal:** catálogo + generación de consultas (WhatsApp y formulario).
- **Secundario:** panel con analytics de Instagram para el dueño.
- Idioma de UI: **español (Argentina)**. Monedas: **ARS y USD** (cada auto guarda su moneda original; no convertir).
- Tráfico mayormente mobile desde Instagram → **mobile-first**.
- Desarrollador único, foco backend → soluciones simples y de bajo costo. **Nada de sobreingeniería.**

## Stack
- Frontend: Next.js (App Router) + TypeScript + Tailwind (tokens por CSS variables)
- Backend: NestJS + TypeScript
- DB: PostgreSQL + **Prisma 7** (driver adapter `@prisma/adapter-pg`; fijado en 7.x, no usar el tag latest/rc)
- Storage de imágenes: Cloudflare R2 (S3-compatible) vía adaptador; `sharp` para procesar
- Infra: Railway (web, api, Postgres). Gestor de paquetes: **pnpm**

## Estructura
```
apps/web        Next.js (app/(public), app/admin, components, lib, styles/tokens.css)
apps/api        NestJS (src/modules/*, src/common, prisma/)
packages/shared zod schemas, enums, tipos compartidos
seed/autos/<slug>/{fotos,360}
docs/           BRIEF.md, PLAN.md
```
Módulos de la API: auth, users, cars, media, spin, inquiries, settings, finance, instagram, jobs, seo, health.

## Convenciones de código
- TypeScript `strict`. Prohibido `any` sin comentario que lo justifique.
- Validación de entrada **siempre** con zod desde `packages/shared` (front y back comparten esquema).
- Nombres de código, rutas de API y tablas en **inglés**; textos de UI, errores al usuario y slugs en **español**.
- Un módulo Nest = controller (fino) + service (lógica) + DTOs. Nada de lógica en controllers.
- Errores: excepciones de Nest con filtro global; respuesta `{ statusCode, message, code }`. Nunca exponer stack al cliente.
- Logs estructurados (JSON). **Nunca** loguear tokens, contraseñas ni datos personales de consultas.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`…). Migraciones Prisma versionadas, nunca editar una ya aplicada.
- Componentes: Server Components por defecto; `"use client"` solo donde haga falta (visor 360, filtros, simulador, admin).
- Imágenes: `next/image` con `sizes`; `priority` solo en la imagen LCP. Todo `alt` significativo.
- Formato de moneda con `Intl.NumberFormat("es-AR")`. Fechas con zona `America/Argentina/Buenos_Aires`.
- Estilos: nunca colores hardcodeados; usar tokens (`--color-*`, `--radius-*`, `--shadow-*`).

## Comandos útiles
```bash
pnpm install
docker compose up -d db                 # Postgres local (puerto host 5436, para no chocar con otros Postgres)
pnpm --filter api exec prisma migrate dev    # migraciones (Prisma 7: config en apps/api/prisma.config.ts)
pnpm --filter api exec prisma generate   # cliente en src/generated (no se commitea)
pnpm dev                                # web + api en paralelo
pnpm lint && pnpm typecheck && pnpm test
pnpm build
pnpm --filter api seed                  # carga seed desde /seed/autos
```

## Seed
Convención de carpetas:
```
seed/autos/<slug>/
  data.json              # marca, modelo, año, precio, moneda, km, combustible, transmisión, condición, estado
  fotos/01.webp 02.webp  # galería; orden por nombre natural
  360/frame-01.webp frame-02.webp ... frame-36.webp   # 24–36 frames, ordenados por nombre natural (frame-02 antes de frame-10)
```
- `<slug>` en minúsculas con guiones (`peugeot-208-2024`). Extensiones `.webp`, `.jpg` o `.png`.
- El seed es **idempotente** (upsert por slug) y usa el mismo pipeline de `media` (sharp + storage), no inserta URLs a mano.
- Local: `pnpm --filter api seed` (usa storage local o un bucket de desarrollo según `STORAGE_DRIVER`).
- Railway: `railway run pnpm --filter api seed` (o un deploy command one-off). Los assets pesados no van en git: se bajan de una carpeta/bucket indicado en `SEED_ASSETS_URL` o se suben manualmente a `seed/`. ⚠️ Definir con el dueño; los datos de ejemplo deben ser **ficticios y marcados como tales**.
- El seed también crea el usuario admin inicial desde `ADMIN_EMAIL` / `ADMIN_PASSWORD` (forzar cambio en el primer login).

## Variables de entorno
| Variable | Servicio | Descripción |
|---|---|---|
| `DATABASE_URL` | api | Postgres (Railway la provee) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | api | Secretos distintos, largos |
| `COOKIE_DOMAIN`, `CORS_ORIGIN` | api | Dominio del front |
| `TOKEN_ENC_KEY` | api | 32 bytes base64 para AES-256-GCM (tokens IG) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | api (seed) | Admin inicial |
| `STORAGE_DRIVER` | api | `r2` \| `local` |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` | api | R2/S3 |
| `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` | api | **Fase 3, no usar en la demo** |
| `NEXT_PUBLIC_SITE_URL` | web | URL pública (SEO, links WhatsApp) |
| `API_INTERNAL_URL`, `NEXT_PUBLIC_API_URL` | web | URL de la API |
| `DEFAULT_WHATSAPP` | api | `543772654605` (editable luego desde el panel) |
| `DEFAULT_HOURS` | api | L–V 8:30–12:30 y 16:30–20:30 (sábados a confirmar) |
| `BUSINESS_ADDRESS`, `BUSINESS_CITY`, `BUSINESS_EMAIL`, `BUSINESS_PHONE` | api | **Sin valor hasta que el cliente los confirme; no inventar** |
| `INSTAGRAM_PROFILE_URL` | web | `https://www.instagram.com/automotoresbatalla/` |

Nunca commitear `.env`; mantener `.env.example` actualizado.

## Reglas de trabajo para Claude Code
1. **No inventar datos del negocio** (dirección, ciudad, marcas, email, teléfono fijo, paleta exacta). Si falta, usar config/env con placeholder visible y agregarlo a "Preguntas pendientes" en `docs/PLAN.md`.
2. **No inventar capacidades de la API de Meta.** Todo lo marcado ⚠️ en `docs/PLAN.md` se verifica en la documentación oficial antes de implementarlo; si no se puede confirmar, dejarlo como pregunta pendiente.
3. **Estado actual: fase de DEMO. No implementar nada de la API de Meta** (OAuth, permisos, tokens, insights, crons de Instagram, módulo `instagram`, tablas `Ig*`, variables `META_*`) hasta que el dueño apruebe el proyecto. En la demo, Instagram son solo links al perfil y, como máximo, maquetas con datos ficticios marcados como demostrativos. Los datos de la demo (autos, precios, fotos) son ficticios.
   **Instagram nunca rompe el sitio (aplica cuando se implemente):** solo el backend habla con Meta; el front consume la caché; fallos → sección oculta o link al perfil.
4. **Jamás** pedir ni almacenar usuario/contraseña de Instagram. Solo OAuth oficial; tokens cifrados.
5. Métrica de Instagram vacía/no disponible = `null`, **nunca 0**. Mostrar "Sin datos suficientes".
6. Colores/tipografías de marca: solo vía tokens. Hasta recibir el logo son placeholders; no presentarlos como definitivos.
7. Seguir el roadmap por fases (`docs/PLAN.md` §6). No adelantar funcionalidades de fases posteriores (p. ej. 3D GLB, AVIF) sin pedido explícito.
8. Antes de agregar una dependencia, justificar en una línea; preferir lo que ya está en el stack.
9. Cambios de esquema de DB = migración Prisma + actualización de seed + tipos compartidos.
10. Ante ambigüedad de producto, preguntar; ante ambigüedad técnica menor, elegir la opción más simple y dejarlo anotado.
11. Seguridad: validar toda entrada, rate limiting en login e `/inquiries`, helmet, cookies httpOnly, CORS restringido, uploads con límite de tamaño/tipo MIME real.
12. Backups: Postgres con backup programado de Railway + `pg_dump` periódico a R2; probar restauración antes del lanzamiento.

## Definición de "terminado"
Una tarea está terminada cuando:
- [ ] Cumple los criterios de aceptación de su fase en `docs/PLAN.md`.
- [ ] `pnpm lint`, `pnpm typecheck` y `pnpm test` pasan; hay tests para lógica no trivial (filtros, cuotas, orden de frames, cifrado de tokens).
- [ ] Tiene estados de **carga, vacío y error** (si hay UI).
- [ ] Probada en viewport mobile (375 px) y desktop; accesible por teclado; contraste AA.
- [ ] Core Web Vitals razonables en la página afectada (Lighthouse mobile ≥ 90 donde aplique).
- [ ] Migraciones, seed, `.env.example` y esta documentación actualizados.
- [ ] Sin secretos en el repo ni en logs; sin `console.log` de depuración.
- [ ] Desplegable en Railway sin pasos manuales no documentados.

## Notas de implementación (Fase 1)
- `packages/shared` se compila a `dist` (ESM): correr `pnpm --filter @batalla/shared build` antes de `typecheck`/`build` de las apps (`pnpm dev` ya lo hace).
- Auth: cookies httpOnly `ab_access` (15 min) y `ab_refresh` (7 d, path `/api/auth`), SameSite=Lax. Para que funcionen en producción, el front debe proxear `/api/*` a la API (rewrites de Next) y así quedar same-origin.
- Seed: `pnpm --filter api seed` crea el admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) y 13 autos ficticios (Fiat, VW, Toyota, Audi, Mercedes-Benz, etc.). Todavía sin fotos ni 360 (siguiente paso: módulo `media`).
- Actualizaciones de autos: `PUT /admin/cars/:id` es parcial; los defaults solo aplican al crear.
- Fotos (`apps/api/src/media`): `POST /admin/cars/:id/photos` (multipart `files`, hasta 20 de 12 MB, orden por nombre natural), `PATCH .../photos/reorder` (`{ids}` completo), `PATCH .../photos/:photoId` (`alt`, `isCover`), `DELETE .../photos/:photoId`. Cada foto se guarda en 3 variantes WebP (480/960/1600) y la API devuelve `urls.w480|w960|w1600`. La validación mira el contenido real (no el MIME).
- Storage: `STORAGE_DRIVER=local` (carpeta `UPLOAD_DIR`, servida en `/media`; solo desarrollo/demo) o `r2` (S3-compatible; requiere `S3_*` y `MEDIA_BASE_URL`/`S3_PUBLIC_BASE_URL`). En Railway el disco es efímero: usar `r2` o un volumen.
- Seed: usa fotos reales de `seed/autos/<slug>/fotos/` si existen; si no, genera imágenes de ejemplo con el rótulo "IMAGEN DE EJEMPLO · DEMO" (`prisma/placeholder-images.ts`). No repite fotos si el auto ya tiene.
- Web (Fase 1): rutas públicas en `app/(public)` (home, `/autos` con filtros en la URL, `/autos/[slug]`) y panel en `app/admin` (login, listado, alta/edición de autos con fotos). `proxy.ts` (Next 16, antes "middleware") solo redirige si faltan las cookies de sesión; la autorización real es de la API.
- `next.config.ts` hace rewrites de `/api/*` y `/media/*` hacia la API (`API_INTERNAL_URL`), así todo es same-origin. Sin `MEDIA_BASE_URL` las imágenes salen como `/media/...`.
- `CarImage` es client component porque el `loader` de `next/image` (elige la variante 480/960/1600) no puede pasar de server a client.
- Sin `cacheComponents` en `next.config.ts` (se sacó el flag que traía el scaffold): el modelo de caché es el clásico (`revalidate` en los fetch).
- Pendiente del plan: Financiación, Contacto, Nosotros, consultas, settings, 360°.
- Consultas: `POST /inquiries` (público; throttle 5/min por IP; honeypot `website`; teléfono y mensaje validados con zod). Panel: `/admin/consultas` (filtro por estado, responder por WhatsApp, badge de nuevas en el menú, se refresca cada 60 s). Aún no hay aviso por email/WhatsApp (Fase 4).
- Settings: tabla `Setting` (clave/valor JSON) con claves `contact` y `hours`, validadas por `SETTING_SCHEMAS` en `packages/shared`. `GET /settings/public` (con defaults si no hay nada guardado) y `GET|PUT /admin/settings/:key` (solo ADMIN). El sitio usa `getSettings()` (revalidate 60 s) para WhatsApp, horarios, dirección y email; si la API falla usa `DEFAULT_SETTINGS` de `apps/web/lib/site.ts`.
- Página pública `/contacto` con datos + formulario. El simulador de cuotas agregará la clave `finance` en Fase 2.
- 360° (Fase 2): `POST /admin/cars/:id/spin` (multipart `files`, 12 a 72 imágenes, ideal 24 a 36; reemplaza la secuencia; orden por nombre natural), `PATCH .../spin/reorder`, `DELETE .../spin`. Cada frame se guarda en WebP 480/800/1280 (calidad 72); la API devuelve `spin.frames[].urls.w480|w800|w1280`. Sin secuencia, la ficha muestra solo la galería.
- Visor (`apps/web/components/Spin360Viewer.tsx`): canvas con Pointer Events (`touch-action: pan-y`), flechas de teclado, autoplay que se detiene al interactuar y respeta `prefers-reduced-motion`. Elige el tamaño por ancho/DPR/conexión; precarga cada 4º frame (ya gira) y completa el resto en tandas. En desktop con buena conexión se activa al verlo; en celular o con ahorro de datos, con un toque.
- Seed: frames 360° de ejemplo (auto visto desde arriba rotando) para los autos destacados; si existe `seed/autos/<slug>/360/` se usa eso.
- Simulador: clave de settings `finance` (`enabled`, `annualRatePct` TNA, `defaultDownPaymentPct`, `minDownPaymentPct`, `terms`). Cálculo en `packages/shared/src/finance.ts` (sistema francés; import `@batalla/shared/finance` en el cliente para no cargar zod). **Los valores por defecto son de ejemplo (TNA 50 %, etc.): el cliente debe definir los reales.** Se muestra en la ficha y en `/financiacion`, siempre con el aviso de simulación orientativa.
- SEO: `metadataBase` y plantilla de título en `app/layout.tsx` (usa `NEXT_PUBLIC_SITE_URL`: **debe ser la URL pública real en producción**, si no sitemap, canonicals y OG salen con localhost). `app/sitemap.ts` (páginas fijas + autos desde `GET /cars/slugs`, revalidate 1 h, tolera API caída), `app/robots.ts` (bloquea `/admin` y `/api/`), `app/opengraph-image.tsx` (imagen social por defecto, provisoria hasta tener el logo). JSON-LD: `AutoDealer` en el layout público (solo con datos cargados en el panel; sin horarios estructurados porque son texto libre), `Car`+`Offer` y `BreadcrumbList` en la ficha. El catálogo con filtros u orden va `noindex,follow` con canonical a `/autos`; la paginación sin filtros se indexa. Páginas del panel: `noindex`.
- Pendiente de SEO: validar los datos estructurados con el Rich Results Test sobre la URL desplegada, subir el sitemap a Search Console y cargar logo/OG real.
- Nosotros (`/nosotros`): contenido **provisorio**, marcado en pantalla con avisos "⚠ Contenido provisorio" (quién somos armado con datos del perfil; historia y equipo/local son recuadros vacíos). No se inventó ningún dato (años, fundadores, etc.). Al recibir los textos y fotos reales, reemplazar y quitar los avisos (componente `Provisional` en la página). Horarios y dirección salen del panel.
- Encabezado en celular: se oculta "Automotores" y queda "Batalla" para que entren Autos, Contacto, Instagram y WhatsApp sin desbordar a 375 px.
- **Actualización de seed (fotos reales):** los autos de ejemplo usan **fotos reales de licencia libre** (Wikimedia Commons) en `seed/autos/<slug>/fotos/01.jpg…04.jpg`, con atribución en `seed/autos/CREDITS.md` / `credits.json` (se muestra en `/creditos`, `noindex`). Son solo para la demo y se reemplazan por fotos reales de Batalla. Ya **no hay 360° de ejemplo**: el 360° solo se carga si existe `seed/autos/<slug>/360/frame-01…` (o desde el panel). Para recargar fotos de autos ya sembrados: `SEED_REPLACE_MEDIA=1 pnpm --filter api seed`. Las imágenes del seed están en `.gitignore` (pesan ~28 MB); los créditos sí se versionan. Si algún día esas fotos llegaran a producción, hay que respetar CC BY / CC BY-SA.
- Deploy: ver `docs/DEPLOY.md` (guía para Railway, **aún no ejecutada**). Dockerfiles en `apps/api/Dockerfile` y `apps/web/Dockerfile` (contexto = raíz del repo), arranque de la API en `apps/api/start.sh` (migraciones + seed opcional con `RUN_SEED=1`). Ambas imágenes se probaron localmente con Docker. En `web`, `API_INTERNAL_URL` y `NEXT_PUBLIC_SITE_URL` se fijan en el BUILD.
- Pendientes conocidos: pantalla para cambiar la contraseña del admin; decidir si las fotos del seed se commitean (hoy ignoradas en git).
