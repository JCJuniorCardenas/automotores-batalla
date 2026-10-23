# ROL
Actuá como arquitecto de software senior y tech lead full stack, especializado en Next.js, NestJS y PostgreSQL, con experiencia en sitios de catálogo, paneles de administración, integraciones con la API de Meta/Instagram y despliegue en Railway. También asumí el rol de diseñador frontend: priorizá una interfaz profesional, rápida y mobile-first.

# OBJETIVO
Planificar de punta a punta el sitio web de la concesionaria **Automotores Batalla** (Instagram: @automotoresbatalla, https://www.instagram.com/automotoresbatalla/), que vende autos 0km y usados. Objetivo principal del sitio: mostrar el catálogo y generar consultas. Objetivo secundario: dar al dueño un panel con analytics de su cuenta de Instagram.

Entregables:
1. Plan de arquitectura y decisiones técnicas justificadas.
2. Un archivo `CLAUDE.md` completo, listo para usar como contexto permanente en Claude Code.
3. Un roadmap por fases con tareas concretas, criterios de aceptación y orden de implementación.
4. Plan de frontend (sistema de diseño, páginas, componentes, estados).

# CONTEXTO
- Negocio: concesionaria de autos 0km y usados. El dueño sube muchos videos/reels e historias a Instagram y esa cuenta es su principal canal de captación.
- Identidad visual: el cliente ya tiene logo y colores. NO los inventes: definí tokens de diseño (colores, tipografías, radios, sombras) como variables configurables con placeholders y pedí los assets reales. Si se entrega el logo, derivá la paleta de él.
- Datos del negocio que NO conozco y no debés inventar: ciudad, dirección, teléfono, WhatsApp, horarios, marcas que comercializa. Dejalos como variables de entorno/configuración y listalos en "Preguntas pendientes".
- Desarrollador: una sola persona, full stack con foco en backend. Priorizá soluciones simples, mantenibles y de bajo costo.
- Despliegue: Railway (frontend, backend y PostgreSQL).
- Idioma de la interfaz: español (Argentina). Moneda: ARS y USD.

# STACK OBLIGATORIO
- Frontend: Next.js (App Router) + TypeScript
- Backend: NestJS + TypeScript
- Base de datos: PostgreSQL (ORM a elegir y justificar: Prisma o TypeORM)
- Infra: Railway

# FUNCIONALIDADES

## Sitio público
- Home con autos destacados y ofertas, y sección de Instagram (ver más abajo).
- Catálogo con filtros y búsqueda: marca, modelo, año, precio, km, combustible, transmisión, tipo (0km/usado). Filtros reflejados en la URL, paginación y orden.
- Ficha de cada auto: datos técnicos, galería de múltiples fotos y visor 360°.
- Botón de contacto por WhatsApp con mensaje prellenado que incluya el auto consultado (marca, modelo, año y link).
- Simulador de financiación/cuotas con parámetros configurables desde el panel (anticipo, plazos, tasa). Aclarar en la UI que es una simulación orientativa.
- Formulario de consulta que se guarda en base de datos y notifica al panel.
- SEO optimizado: metadatos dinámicos, sitemap, datos estructurados schema.org (Vehicle/Car y AutoDealer), URLs amigables, Open Graph.

## Visor 360° de autos
- Cada auto tiene una secuencia de 24 a 36 imágenes tomadas en giro de 360°; el visitante gira el auto arrastrando (mouse y touch), con autoplay opcional y precarga progresiva.
- Mantener además una galería de fotos normales por auto.
- Definir: modelo de datos para secuencias (orden de frames), formato/compresión (WebP/AVIF), tamaños responsive y estrategia de carga para mobile.
- Fallback: si un auto no tiene secuencia 360°, mostrar solo la galería.
- Evaluá una opción de modelo 3D real (GLB + three.js) solo como fase posterior y justificá por qué no va en el MVP.

## Integración con Instagram en el frontend público
- Botón/links visibles a @automotoresbatalla (header, footer y ficha de auto).
- Sección "Últimas publicaciones" en el home con los últimos posts/reels de la cuenta, obtenidos desde el backend (que consulta la API de Meta con el token del dueño) y cacheados, nunca desde el navegador. Si la API falla o no hay token, la sección se oculta o muestra solo el link al perfil: el sitio nunca debe romperse por Instagram.
- Evaluá embeds oficiales vs. grilla propia con imágenes cacheadas, y recomendá la opción más estable y sin costo.

## Analytics de Instagram (panel admin)
- Objetivo: que el dueño vea cómo crece su cuenta, de forma muy simple.
- Autenticación: OAuth oficial de Meta mediante botón "Conectar Instagram". Prohibido pedir o almacenar usuario/contraseña de Instagram.
- Requisito de cuenta: Business o Creator (las personales no tienen acceso a la API). Incluir en el panel una guía paso a paso para convertir la cuenta.
- Evaluá y recomendá entre "Instagram API with Instagram Login" (sin Página de Facebook, métricas más acotadas) e "Instagram API with Facebook Login" (más métricas, exige Página vinculada), comparando métricas vs. complejidad.
- Dashboard: seguidores (evolución), alcance, visualizaciones, interacciones, rendimiento por reel/post y por historia, mejores publicaciones, comparativa semanal/mensual. Gráficos claros y lenguaje no técnico.
- Historias: las métricas solo están disponibles 24 h y fallan con menos de 5 espectadores. Diseñá un job programado (cron) que guarde snapshots periódicos en PostgreSQL.
- Tokens: almacenarlos cifrados, con renovación automática antes del vencimiento.
- Límites conocidos a manejar: follower_count no disponible con menos de 100 seguidores; datos con demora de hasta 48 h; una métrica vacía no equivale a 0.
- Indicá qué configuración se necesita en Meta for Developers (app, permisos, modo desarrollo vs. App Review). Lo que no puedas confirmar, marcalo como pregunta pendiente. No inventes requisitos.

## Panel de administración (autenticado)
- Login seguro con roles.
- ABM de autos: datos, estado (disponible/reservado/vendido), destacado.
- Subida, orden y eliminación de múltiples fotos y de secuencias 360° (subida múltiple con orden automático por nombre de archivo).
- Gestión de consultas recibidas.
- Configuración del simulador de cuotas y datos de contacto (WhatsApp, horarios, dirección).
- Sección de analytics de Instagram.

## Seed inicial
- Script de seed que cargue autos de ejemplo (0km y usados) con fotos y secuencias 360° desde una carpeta local estructurada: /seed/autos/<slug>/fotos/ y /seed/autos/<slug>/360/frame-01.webp, frame-02.webp, etc.
- Documentar en el CLAUDE.md la convención de nombres y cómo correr el seed en local y en Railway.

# FRONTEND (plan específico)
- Sistema de diseño basado en tokens (Tailwind o CSS variables) a partir del logo y colores del cliente.
- Mobile-first: la mayoría del tráfico vendrá desde Instagram en celulares.
- Páginas: Home, Catálogo, Ficha de auto, Financiación, Contacto, Nosotros (con datos a confirmar), y rutas del panel admin.
- Componentes clave: CarCard, FilterBar, Spin360Viewer, Gallery, WhatsAppButton, InstallmentSimulator, InstagramFeed, DashboardCharts.
- Estados de carga, vacío y error para cada vista. Imágenes optimizadas con next/image y lazy loading.
- Accesibilidad básica (contraste, foco, alt, navegación por teclado).

# REQUISITOS NO FUNCIONALES
Rendimiento (Core Web Vitals), responsive, seguridad (validación, rate limiting, protección del panel, cifrado de tokens), almacenamiento de imágenes (recomendá una solución compatible con Railway y justificala), variables de entorno, backups, logs y manejo de errores.

# RESTRICCIONES
- No inventes datos del cliente ni del negocio: si falta información, listala en "Preguntas pendientes".
- No inventes capacidades de la API de Meta: si dudás, indicalo y proponé verificarlo en la documentación oficial.
- Evitá sobreingeniería: priorizá un MVP funcional.
- Justificá cada decisión técnica en una línea.

# FORMATO DE SALIDA
Entregá en este orden, con secciones separadas:
1. Resumen del proyecto y supuestos.
2. Arquitectura: diagrama en texto, estructura de carpetas (monorepo o repos separados, con recomendación), módulos de NestJS, modelo de datos (entidades y relaciones), endpoints principales.
3. Decisiones técnicas (ORM, almacenamiento de imágenes, visor 360°, autenticación, API de Instagram).
4. Plan de frontend.
5. CLAUDE.md completo en un bloque de código markdown: descripción del proyecto, stack, estructura, convenciones de código, comandos útiles, variables de entorno, reglas de trabajo para Claude Code y definición de "terminado".
6. Roadmap por fases (Fase 0 setup, Fase 1 MVP catálogo + consultas + panel, Fase 2 360° y simulador, Fase 3 analytics de Instagram y feed, Fase 4 mejoras) con tareas, criterios de aceptación y esfuerzo relativo.
7. Preguntas pendientes para el cliente.

# CONTEXTO
- Negocio: Automotores Batalla (@automotoresbatalla), concesionaria de autos 0km y usados, con permutas y consignaciones. Cuenta de Instagram con ~5.900 seguidores y mucho contenido en video (reels estilo "Pov:" y entrevistas en el local). Instagram es su principal canal de captación.
- Datos confirmados desde su perfil público:
  - WhatsApp: +54 3772 65-4605 (link wa.me/543772654605). Usarlo como valor por defecto del botón de contacto, editable desde el panel.
  - Horario: lunes a viernes 8:30–12:30 y 16:30–20:30 (la bio está cortada; confirmar sábados).
  - Servicios a reflejar en el sitio: 0km, usados, permutas, consignaciones.
  - Secciones sugeridas por sus historias destacadas: 0 KM, Entregas, Ubicación, Horarios, Contacto.
- Identidad visual: el logo es una "B" negra con flechas circulares rojas, estrellas doradas y detalles celeste y blanco, sobre fondo crema. NO inventes la paleta exacta: pedí el archivo del logo, extraé los colores de ahí y definí tokens de diseño (rojo, negro, crema, dorado, celeste como candidatos a validar).
- Datos que NO conozco y no debés inventar: dirección y ciudad exactas, marcas que comercializa, teléfono fijo, email. Dejalos como variables de configuración y listalos en "Preguntas pendientes".
- Desarrollador: una sola persona, full stack con foco en backend. Priorizá soluciones simples, mantenibles y de bajo costo.
- Despliegue: Railway (frontend, backend y PostgreSQL).
- Idioma de la interfaz: español (Argentina). Moneda: ARS y USD.