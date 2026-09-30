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
- `Dockerfile` — imagen de este servicio, usada por el `docker-compose.yml` de `nutria-backend`.

## Variables de entorno

Copiar `.env.example` a `.env` (no se versiona) antes de ejecutar:

```bash
cp .env.example .env
```

`VITE_API_URL` apunta al backend; el valor por defecto sirve para el stack de Docker Compose.

## Scripts disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `npm run dev` | `vite` | Servidor de desarrollo con HMR en `http://localhost:5173`. |
| `npm run build` | `vite build` | Build de producción en `dist/`. |
| `npm run preview` | `vite preview` | Sirve el build de `dist/` para revisarlo. |
| `npm run lint` | `oxlint` | Linter del repo. |
| `npm test` | `vitest run` | Corre los tests una vez. La verificación que cuenta es dentro del contenedor: `npm run test:frontend` desde la carpeta raíz `nutria/`. |

## Cómo ejecutar

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

Para levantar el stack completo con Docker (frontend + backend + ia + postgres + proxy) con un solo comando, ver la sección "Cómo ejecutar todo el stack con Docker Compose" en el README de `nutria-backend`. En ese modo la aplicación se accede como `http://local.nutria.com` (virtual host servido por Traefik), no por puerto ni por `localhost`.

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
