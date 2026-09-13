# nutria-frontend

Frontend de **NutrIA**, implementado en React + Vite. Provee la interfaz para que el nutricionista gestione pacientes, consultas, catálogos y la generación asistida de planes alimentarios.

## Estructura de carpetas raíz del proyecto

Este repositorio es uno de los tres repos que componen NutrIA (`nutria-frontend`, `nutria-backend`, `nutria-ia`) y debe clonarse como carpeta **hermana** de los otros dos, dentro de una misma carpeta raíz local:

```
NutrIA/
├── nutria-backend/
├── nutria-frontend/  (este repositorio)
└── nutria-ia/
```

Esta disposición es necesaria porque el `docker-compose.yml` de `nutria-backend` construye este servicio a partir de una ruta relativa (`../nutria-frontend`).

## Estructura interna del repositorio

- `src/layouts/` — layout general de la aplicación (`aside` de navegación + `header`).
- `src/pages/` — pantallas de la aplicación (Inicio, Pacientes, ...).
- `src/App.jsx` — definición de rutas con React Router.
- `public/` — archivos estáticos.
- `Dockerfile` — imagen de este servicio, usada por el `docker-compose.yml` de `nutria-backend`.

## Variables de entorno

Copiar `.env.example` a `.env` (no se versiona) antes de ejecutar:

```bash
cp .env.example .env
```

## Cómo ejecutar

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

Para levantar el stack completo con Docker (frontend + backend + ia + postgres + proxy) con un solo comando, ver la sección "Cómo ejecutar todo el stack con Docker Compose" en el README de `nutria-backend`. En ese modo la aplicación se accede como `http://local.nutria.com` (virtual host servido por Traefik), no por puerto ni por `localhost`.

## Tecnologías previstas

- React
- Vite
- React Router

## Repositorios relacionados

- `nutria-backend` — API principal (Node.js + Express).
- `nutria-ia` — servicio de generación asistida (Python + FastAPI).
