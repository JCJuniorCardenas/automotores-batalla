# Guía de deploy en Railway

> Estado: **preparada, no ejecutada**. Railway estaba caído cuando se escribió. Las imágenes Docker de API y web se probaron localmente (ver §8). Lo marcado con ⚠️ **VERIFICAR** depende de la interfaz de Railway y no se pudo confirmar: revisarlo contra su documentación al hacerlo.

## 1. Arquitectura en Railway

```
Internet ──► web (Next.js, dominio público) ──/api/* y /media/* (proxy interno)──► api (NestJS, solo red privada)
                                                                                   │
                                                                      PostgreSQL ◄─┘   + Volume o R2 para imágenes
```

- **3 recursos:** PostgreSQL, servicio `api`, servicio `web`.
- Solo `web` necesita dominio público. La API no se expone: el navegador siempre habla con `web`, que reenvía `/api/*` y `/media/*` por la red privada. Así las cookies de sesión son del mismo origen y no hace falta CORS.
- Ambos servicios se construyen desde la **raíz del repo** (monorepo) con su Dockerfile.

## 2. Antes de empezar
- Repo en GitHub: https://github.com/JCJuniorCardenas/automotores-batalla
- Decidir el **dominio** (o usar el `*.up.railway.app` que da Railway para la demo).
- Decidir **dónde se guardan las imágenes** (§4).
- Generar secretos fuertes: `openssl rand -base64 48` (uno para cada JWT) y una contraseña de admin nueva.

## 3. Crear los servicios

1. **PostgreSQL:** agregar el plugin de Postgres al proyecto. Railway expone `DATABASE_URL`.
2. **api:** nuevo servicio desde el repo de GitHub.
   - Builder: Dockerfile. Ruta: `apps/api/Dockerfile`. El contexto debe ser la raíz del repo. ⚠️ **VERIFICAR** cómo se indica la ruta del Dockerfile (suele ser la variable `RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile`) y que no hay "Root Directory" configurado.
   - Variables (ver tabla §3.1).
   - Sin dominio público. Anotar el nombre interno (p. ej. `api.railway.internal`).
3. **web:** nuevo servicio desde el mismo repo.
   - Dockerfile: `apps/web/Dockerfile`.
   - Variables (ver §3.2). **`API_INTERNAL_URL` y `NEXT_PUBLIC_SITE_URL` se usan en el *build*** (los `rewrites` y las URLs absolutas del SEO se fijan al compilar), por eso los Dockerfiles las declaran como `ARG`. ⚠️ **VERIFICAR** que Railway pasa las variables del servicio como build args; si no, hay que declararlas en la sección de build del servicio.
   - Generar dominio público.

### 3.1 Variables de `api`

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Referencia a la del Postgres de Railway |
| `PORT` | `3001` (fijo, para armar `API_INTERNAL_URL`) |
| `NODE_ENV` | `production` (el Dockerfile ya lo fija; activa cookies `Secure`) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secretos distintos y largos |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin inicial (solo lo usa el seed) |
| `STORAGE_DRIVER` | `local` (con Volume) o `r2` (§4) |
| `UPLOAD_DIR` | `/data/uploads` (si `local`) |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Si `r2` |
| `MEDIA_BASE_URL` o `S3_PUBLIC_BASE_URL` | Con `r2`: dominio público del bucket. Con `local`: **dejar sin definir** (las imágenes salen como `/media/...` por el proxy de web) |
| `DEFAULT_WHATSAPP` | `543772654605` |
| `BUSINESS_ADDRESS`, `BUSINESS_CITY`, `BUSINESS_EMAIL`, `BUSINESS_PHONE` | Vacías hasta confirmar con el cliente (también se editan desde el panel) |
| `RUN_SEED` | `1` solo en el primer deploy (§5) |

`TOKEN_ENC_KEY`, `META_*`: no se usan todavía (Instagram es Fase 3).

### 3.2 Variables de `web`

| Variable | Valor |
|---|---|
| `API_INTERNAL_URL` | `http://<nombre-del-servicio-api>.railway.internal:3001` (**build**) |
| `NEXT_PUBLIC_SITE_URL` | URL pública final, con `https://` y sin barra final (**build**) |
| `INSTAGRAM_PROFILE_URL` | `https://www.instagram.com/automotoresbatalla/` (opcional) |
| `PORT` | Lo inyecta Railway; el `CMD` lo respeta |

> Si cambia el dominio, hay que **redeployar `web`** para que sitemap, canonicals e imágenes sociales usen la URL nueva.

## 4. Imágenes: dos opciones

| | A. Volume de Railway (`local`) | B. Cloudflare R2 (`r2`) |
|---|---|---|
| Costo/complejidad | Mínimos: 1 Volume montado en `/data` del servicio `api` | Cuenta de Cloudflare + bucket + claves |
| Pros | Todo en Railway; sirve para la demo | Persistencia independiente, sin egress, CDN, escalable |
| Contras | Atado a una instancia; backups propios | Un servicio más para configurar |
| Recomendado para | **Demo** | **Producción** |

- **A:** crear un Volume, montarlo en `/data`, `STORAGE_DRIVER=local`, `UPLOAD_DIR=/data/uploads`. ⚠️ **VERIFICAR** el procedimiento de Volumes y que el proceso tenga permisos de escritura (la imagen corre como root).
- **B:** `STORAGE_DRIVER=r2` con las variables `S3_*` y `S3_PUBLIC_BASE_URL` (dominio público del bucket). El camino S3 está implementado pero **no se probó contra un bucket real**: probarlo subiendo una foto desde el panel antes de confiar en él.

## 5. Primer deploy y seed

El arranque de la API (`apps/api/start.sh`) hace, en orden: `prisma migrate deploy` → (si `RUN_SEED=1`) seed → servidor.

1. Con `RUN_SEED=1`, deployar `api`. El seed crea el admin y los 13 autos de ejemplo (idempotente).
2. Verificar `https://<dominio>/api/cars` y entrar a `/admin/login`.
3. **Quitar `RUN_SEED`** (o ponerla en `0`) para que no corra en cada reinicio.

> ⚠️ **Fotos del seed:** las fotos reales de ejemplo (`seed/autos/*/fotos`, ~28 MB) están en `.gitignore`, así que **no están en GitHub** y el build de Railway no las ve: el seed online usaría las imágenes dibujadas de respaldo. Opciones: (1) dejar de ignorarlas y commitearlas (las licencias CC permiten redistribuir con atribución; ya están en `seed/autos/CREDITS.md`), o (2) subir las fotos reales desde el panel. **Decisión pendiente.** Sin la carpeta, `/creditos` queda vacía.

## 6. Dominio y HTTPS
- Dominio propio: agregarlo al servicio `web`, apuntar el DNS como indique Railway ⚠️ **VERIFICAR**, y recién entonces fijar `NEXT_PUBLIC_SITE_URL` y redeployar `web`.
- Las cookies de sesión llevan `Secure`: el panel solo funciona sobre HTTPS (Railway lo provee en su dominio y en los propios).

## 7. Checklist después del deploy
- [ ] Cambiar la contraseña del admin (`ADMIN_PASSWORD` solo se usa al crear el usuario; para cambiarla ahora hay que hacerlo en la base o recrear el usuario: **pendiente de implementar** pantalla de cambio de contraseña).
- [ ] Cargar en Configuración: dirección, ciudad, email, teléfono, link de Maps, horarios (sábados a confirmar) y las condiciones reales del simulador (la TNA y plazos actuales son de ejemplo).
- [ ] Probar una consulta desde la ficha y verla en el panel.
- [ ] Rich Results Test sobre una ficha y sobre la home (datos estructurados).
- [ ] Subir `https://<dominio>/sitemap.xml` a Google Search Console.
- [ ] Backups de Postgres: activar los de Railway si el plan los incluye ⚠️ **VERIFICAR**, y agregar un `pg_dump` periódico a R2/S3. **Probar una restauración** antes del lanzamiento real.
- [ ] Revisar logs de ambos servicios (la API loguea en consola).
- [ ] Reemplazar fotos de ejemplo por las reales; quitar el pie "versión de demostración" y la página `/creditos` si ya no aplican.

## 8. Lo que ya se probó localmente (Docker)

```bash
docker build -f apps/api/Dockerfile -t batalla-api .
docker build -f apps/web/Dockerfile -t batalla-web \
  --build-arg API_INTERNAL_URL=http://host.docker.internal:3101 \
  --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3102 .
```

Con una base vacía y `RUN_SEED=1`:
- API: aplicó las migraciones, sembró y respondió `/health` y `/api/cars`.
- Web: `/`, `/autos`, ficha, `/contacto`, `/nosotros`, `/financiacion`, `/creditos`, `/sitemap.xml` (17 URLs), `/robots.txt` y `/admin/login` respondieron 200; una imagen pasó por el proxy `/media/...`; el login a través de `web` devolvió las cookies `HttpOnly; Secure; SameSite=Lax`.
- Consumo en reposo: API ~120 MB, web ~95 MB de RAM. Las imágenes pesan ~2 GB cada una (se puede adelgazar con una etapa de build separada; no es urgente).

**No probado:** el deploy en sí en Railway, Volumes, R2 real, dominios y backups.

## 9. Problemas frecuentes
| Síntoma | Causa probable |
|---|---|
| El catálogo carga vacío o la home sin autos | `API_INTERNAL_URL` mal en el *build* de `web` (queda fija al compilar): corregirla y redeployar `web` |
| Login "no pasa" / vuelve al login | Sin HTTPS (cookies `Secure`) o `web` no reenvía `/api` |
| Imágenes rotas con `local` | `MEDIA_BASE_URL` definida apuntando a otro lado, o el Volume sin montar en `/data` |
| Sitemap/canonicals con `localhost` | `NEXT_PUBLIC_SITE_URL` sin definir al compilar |
| La API no arranca | `DATABASE_URL` o secretos JWT faltantes; ver logs del `start.sh` |
