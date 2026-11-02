# nutria-frontend

Interfaz web de **NutrIA**, implementada en React + Vite. Es la aplicación que usa
el nutricionista; consume la API de `nutria-backend` y no habla con ningún otro
servicio.

Qué pantallas existen y qué cambió en cada iteración se documenta en
[`CHANGELOG.md`](CHANGELOG.md), no acá.

## Estructura de carpetas raíz del proyecto

Este repositorio es uno de los tres repos que componen NutrIA (`nutria-frontend`, `nutria-backend`, `nutria-ia`) y debe clonarse como carpeta **hermana** de los otros dos, dentro de una misma carpeta raíz local:

```
nutria/
├── nutria-backend/
├── nutria-frontend/  (este repositorio)
└── nutria-ia/
```

Esta disposición es necesaria porque el `docker-compose.yml` de `nutria-backend` construye este servicio a partir de una ruta relativa (`../nutria-frontend`).

## Estructura interna del repositorio

- `src/pages/` — una carpeta o archivo por pantalla.
- `src/layouts/` — layouts compartidos entre pantallas.
- `src/components/` — componentes reutilizables.
- `src/api/` — cliente HTTP único contra el backend (no se usa `fetch` suelto en los componentes).
- `src/context/` — estado global (sesión).
- `src/utils/`, `src/assets/` — helpers y estáticos importados por el bundler.
- `src/App.jsx` — definición de rutas con React Router; `src/main.jsx` — punto de entrada.
- `public/` — archivos estáticos servidos tal cual.
- `Dockerfile` — imagen de este servicio, en etapas: `dev` (la última, el servidor de desarrollo de Vite que usa el `docker-compose.yml` de `nutria-backend`) y `prod` (build estático servido por nginx, para staging).
- `nginx.conf` — config de nginx de la etapa `prod`: cualquier ruta devuelve `index.html` para que React Router resuelva al recargar.
- `.github/workflows/ci.yml` — integración continua (ver "Integración continua"); `cd-staging.yml` — despliegue a staging (ver "Despliegue en staging").

## Variables de entorno

Copiar `.env.example` a `.env` (no se versiona) antes de ejecutar:

```bash
cp .env.example .env
```

`VITE_API_URL` apunta al backend; el valor por defecto sirve para el stack de Docker Compose. `VITE_ENV_LABEL` es el texto del aviso de entorno de prueba: vacío en local (no se muestra) y, en staging, lo fija `docker-compose.staging.yml` de `nutria-backend`.

## Scripts disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `npm run dev` | `vite` | Servidor de desarrollo con HMR en `http://localhost:5173`. |
| `npm run build` | `vite build` | Build de producción en `dist/`. |
| `npm run preview` | `vite preview` | Sirve el build de `dist/` para revisarlo. |
| `npm run lint` | `oxlint` | Linter del repo. |
| `npm test` | `vitest run` | Corre los tests una vez. La verificación que cuenta es dentro del contenedor: `npm run test:frontend` desde la carpeta raíz `nutria/`. |

Las pruebas de componentes con efectos usan `// @vitest-environment jsdom` y
montan React con `createRoot` y `act`. La ficha del paciente cubre respuestas fuera
de orden, cambios de paciente y recargas tras guardar, con API simulada y datos
ficticios. Los demás tests mantienen el entorno Node por defecto; no son pruebas
E2E contra el backend.

## Cómo ejecutar

Desde la carpeta raíz `nutria/`:

```bash
npm run up
```

La aplicación queda disponible en `http://local.nutria.com`. Vite y las dependencias
corren dentro de Docker. Una vez creados los contenedores, podés iniciar/detener
el stack desde Docker Desktop: el frontend sigue detectando cambios y actualizando
el navegador sin una terminal abierta ni builds manuales para los archivos fuente.

El compose monta `src/`, `public/`, `index.html` y `vite.config.js` en solo lectura;
Vite usa polling cada 500 ms para detectar las ediciones desde Windows/OneDrive.
`node_modules` permanece en la imagen. Cambiar dependencias requiere reconstruir
la imagen; `npm run dev` desde la raíz agrega Compose Watch para hacerlo
automáticamente mientras esa terminal permanezca abierta.

Si el contenedor se creó antes de incorporar estos mounts, hay que recrearlo una
vez; el comando y el detalle están en el README raíz, "Ver cambios sin rebuildear".
Staging elimina los mounts y usa el build estático servido por nginx.

Para levantar el stack completo con Docker (frontend + backend + ia + postgres + proxy) con un solo comando, ver la sección "Cómo ejecutar todo el stack con Docker Compose" en el README de `nutria-backend`. En ese modo la aplicación se accede como `http://local.nutria.com` (virtual host servido por Traefik), no por puerto ni por `localhost`.

## Integración continua

`.github/workflows/ci.yml` corre en cada PR hacia `development`, `staging` o `master`, en cada
push a `development` y a mano desde la pestaña Actions (`workflow_dispatch`). El job
se llama `ci` y es el check obligatorio del ruleset de `development`, `staging` y `master`: un
PR no se puede mergear con ese check en rojo.

No usa secrets ni variables de GitHub: el build no necesita `VITE_API_URL`.

Cada paso, y cómo reproducirlo en local desde la carpeta raíz `nutria/` (dentro del
contenedor; `C` abrevia `docker compose -f nutria-backend/docker-compose.yml`):

| Paso de la CI | En local |
|---|---|
| `npm ci` | Lo hace el build de la imagen (`npm run build -- frontend`). |
| `npm run lint` | `C run --build --rm --no-deps frontend npm run lint` |
| `npm test` | `npm run test:frontend` |
| `npm run build` | `C run --build --rm --no-deps frontend npm run build` |
| `npm audit --audit-level=high` | `C run --build --rm --no-deps frontend npm audit --audit-level=high` |
| `docker build` (sin push) | `npm run build -- frontend` |
| `docker build --target prod` | `docker build --target prod -t nutria-frontend:prod nutria-frontend` |

## Despliegue en staging

Un push a `staging` dispara `.github/workflows/cd-staging.yml`: corre el CI y, si
pasa, despliega el servicio `frontend` en la VM de staging (imagen `prod`, con
`VITE_API_URL` y `VITE_ENV_LABEL` fijadas en el build) y verifica que la página
responde por HTTPS. Cómo funciona, la configuración del Environment `staging` y la
operación de la VM: README de `nutria-backend`, sección "Staging".

## Stack

- React
- Vite
- React Router
- Tailwind CSS v4
- Vitest
- oxlint

## Repositorios relacionados

- `nutria-backend` — API principal (Node.js + Express).
- `nutria-ia` — servicio de generación asistida (Python + FastAPI).
