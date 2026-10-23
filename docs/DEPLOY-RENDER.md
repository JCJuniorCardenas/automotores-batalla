# Demo en Render (plan gratis)

> Para **mostrar la demo al cliente con un link fijo** mientras Railway no está disponible. **No es para producción**: el plan gratis se duerme, la base dura 30 días y los archivos subidos no persisten (ver §5). La guía de producción es [DEPLOY.md](DEPLOY.md).

## 1. Qué se crea

Un **Blueprint** (`render.yaml` en la raíz del repo) con dos recursos:

| Recurso | Plan | Para qué |
|---|---|---|
| `batalla-demo` (servicio web, Docker) | free | Corre **web y API juntas** en un solo contenedor. La web escucha en el puerto público y reenvía `/api` y `/media` a la API, que queda interna (`127.0.0.1:3001`). |
| `batalla-db` (Postgres) | free | Base de datos. |

Un solo servicio = un solo arranque en frío y un solo consumo de las 750 horas gratis del mes.

## 2. Pasos (los hacés vos, ~5 minutos + espera del build)

1. Entrá a https://dashboard.render.com con tu cuenta (como te registraste: Google o GitHub).
2. **New +** → **Blueprint**.
3. Conectá el repo **JCJuniorCardenas/automotores-batalla** (es público: podés pegar su URL, o autorizar a Render en GitHub). Rama `main`.
4. Render lee `render.yaml` y te pide los valores marcados como secretos:
   - `ADMIN_EMAIL`: el email con el que vas a entrar al panel.
   - `ADMIN_PASSWORD`: una contraseña **nueva y fuerte** (10+ caracteres, letras y números). No uses la de desarrollo.
5. **Apply / Deploy Blueprint**. El primer build tarda un buen rato (instala todo, compila y baja las fotos de ejemplo). Podés ver el progreso en los *Logs*.
6. Cuando diga **Live**, abrí la URL del servicio (algo como `https://batalla-demo.onrender.com`).

### Si el nombre ya estaba tomado
Render puede asignar un nombre distinto (por ejemplo `batalla-demo-x1y2`). En ese caso, en el servicio → **Environment**, cambiá `NEXT_PUBLIC_SITE_URL` por la URL real y hacé **Manual Deploy → Clear build cache & deploy** (se fija al compilar). Sin esto la demo funciona igual, pero los links dentro del mensaje de WhatsApp y las etiquetas de SEO apuntarían a la URL equivocada.

## 3. Antes de mostrárselo al cliente
- El servicio **se duerme a los 15 minutos** sin visitas y despertarlo tarda **~1 minuto**. Abrí el link 1 o 2 minutos antes de mandárselo (o de que lo abra).
- Probá en tu celular: home, un auto, el simulador, el formulario de contacto.
- Entrá a `/admin/login` con el email y contraseña que pusiste en el paso 4. Si querés bloquear el panel para el público mientras la demo está online, avisame: hay una variable (`BLOCK_ADMIN_ON_PUBLIC_HOST`) pensada para eso, pero ojo, también te bloquearía a vos.

## 4. Cómo funciona por dentro
- **Dockerfile:** `deploy/render/Dockerfile`. Compila el paquete compartido, la API y la web.
- **Fotos de ejemplo:** no están en git. Al construir la imagen se bajan de Wikimedia Commons (según `seed/autos/credits.json`) y se **pre-generan las variantes WebP dentro de la imagen**. Si alguna no se puede bajar, ese auto usa las imágenes dibujadas de respaldo.
- **Arranque:** `deploy/render/start.mjs` aplica las migraciones, corre el seed (`RUN_SEED=1`: crea el admin y los 13 autos, es idempotente) y levanta API + web. Si uno de los dos se cae, se reinicia todo el servicio.
- **IP real y límite de intentos:** `TRUST_PROXY=2` hace que el límite de intentos (login, consultas) cuente por visitante y no por la IP interna del proxy.
- **Credenciales:** los secretos JWT los genera Render; el email y la contraseña del admin los escribís vos y no quedan en el repo.

## 5. Límites del plan gratis (verificados en la [documentación de Render](https://render.com/docs/free))
- **Se duerme** tras 15 min sin tráfico; el arranque en frío tarda ~1 min.
- **Disco efímero:** lo que se escribe mientras corre se pierde al reiniciar o dormirse. Por eso las fotos del seed viajan dentro de la imagen. **Las fotos que subas desde el panel no sobreviven** a un reinicio.
- **Base de datos:** 1 GB, **vence a los 30 días** de creada (14 días de gracia para pasarla a un plan pago), sin backups. Una sola base gratis por cuenta.
- **750 horas por mes** entre todos los servicios gratis; si se acaban, se suspenden hasta el mes siguiente.

## 6. Cuando quieran algo real
Pasar a producción con Railway (o Render pago) usando [DEPLOY.md](DEPLOY.md): almacenamiento persistente de imágenes (R2 o Volume), base con backups y dominio propio.

## 7. Problemas frecuentes
| Síntoma | Qué mirar |
|---|---|
| El build falla bajando las fotos | Los logs dirán qué foto falló; el build igual sigue y esos autos usan imágenes de respaldo. |
| "Application failed to respond" al abrir | El servicio recién despertó; esperá ~1 minuto y recargá. |
| No puedo entrar al panel | Usá el `ADMIN_EMAIL`/`ADMIN_PASSWORD` del paso 4. Si te equivocaste al cargarlos o la perdiste: en **Environment** corregí `ADMIN_PASSWORD`, agregá `SEED_RESET_ADMIN_PASSWORD=1`, redeployá, entrá, y después **sacá** esa variable. (El seed normalmente no pisa la contraseña de un admin existente.) |
| Los autos no aparecen | Mirá los logs del arranque: tiene que decir "Seed OK". |
