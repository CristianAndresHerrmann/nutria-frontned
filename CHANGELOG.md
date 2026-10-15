# Changelog — nutria-frontend

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y [Semantic Versioning](https://semver.org/lang/es/). Nunca se documentan credenciales (usuarios, contraseñas, tokens, secrets) aquí, ni siquiera de datos de prueba locales.

## Unreleased

### Added

- Sección **Catálogos** en el menú principal (T15). El Figma no tiene estas pantallas, así que se armaron con los componentes y tokens existentes. Tiene dos pestañas, Alimentos y Grupos:
  - **Alimentos** (`/catalogos/alimentos`):
    - Buscador por nombre, que consulta al backend cuando se deja de tipear.
    - Filtro por grupo, con las opciones indentadas según la jerarquía. Elegir un grupo incluye sus subgrupos.
    - Opción para mostrar los dados de baja.
    - Tabla con el grupo completo ("Carnes, pescados y huevos › Pescados"), las categorías y el estado. Solo los alimentos propios tienen el botón Editar.
  - **Alta y edición de alimentos** (`/catalogos/alimentos/nuevo` y `/catalogos/alimentos/:id/editar`):
    - Nombre, grupo y una o más categorías nutricionales con casillas.
    - En la edición, la casilla "Vigente": desmarcarla da de baja el alimento sin borrarlo.
    - Los errores del backend se muestran en su campo, con el borde en rojo (`aria-invalid`). Por ejemplo, un nombre repetido sin distinguir mayúsculas.
    - Solo se pueden editar los alimentos propios. Los de otro nutricionista o de la base inicial no tienen el botón Editar, y si se entra por URL se muestra el aviso en lugar del formulario.
  - **Grupos** (`/catalogos/grupos`): listado indentado de la jerarquía, de solo lectura.
- Fuera del alcance de la interfaz en T15: pantallas de patologías y alta o edición de grupos. Existen solo en la API.
- `src/api/catalogs.js`, `src/utils/foodGroupTree.js` (orden indentado y ruta de un grupo), `src/utils/foodCategories.js` (etiquetas en castellano) y `src/pages/foodFormMapping.js`, con sus tests.

## [0.0.1] - 2026-09-30

Incremento 1: tareas T1 a T8 y las de soporte (ver `docs/cierre-incremento-1.md` en el repo raíz).

### Added

- Página "no encontrada" (`src/pages/NotFound.jsx`) para cualquier ruta que no matchea, dentro del layout con sesión (ruta comodín `*` en `App.jsx`); sin sesión, redirige al login como el resto de las rutas protegidas.
- `max` (fecha de hoy en UTC, `todayInputValue()` en `src/utils/date.js`) en el selector de fecha de nacimiento del formulario de paciente: ayuda visual para no tipear una fecha futura, la validación real la hace el backend.
- Cliente HTTP único (`apiRequest` en `src/api/client.js`, T7): todas las llamadas al backend pasan por él y devuelven los datos o tiran un `ApiError` con `status`, `code`, `message`, `details` y `fields` (el mapa campo → mensaje de `details.fields`). Ningún fallo sale como error crudo de `fetch`: sin conexión da `NETWORK_ERROR` y una request que no responde en 15 s da `TIMEOUT`, ambos con un mensaje en castellano para mostrar. Una respuesta de error sin el formato de la API (por ejemplo, un 502 del proxy con HTML) da un mensaje genérico según el status. `src/api/auth.js` y `src/api/patients.js` quedan como una línea por endpoint.
- Aviso de sesión expirada en el login: si la sesión se cerró sola (token vencido o `401` del backend), el login muestra "Tu sesión expiró. Volvé a iniciar sesión." y, al volver a entrar, redirige a la pantalla donde estaba (`sessionExpired` en `AuthContext`).
- Errores de validación por campo en el login, debajo del input de email o contraseña, con el texto que devuelve el backend.
- Vitest (`npm test`) con tests del cliente HTTP (`src/api/client.test.js`): respuesta exitosa, sin conexión, timeout, `400` con campos, `401` con sesión (cierra sesión) y del login (no la cierra), y error no JSON.
- Estructura base con React + Vite (`src/App.jsx`, `src/layouts/MainLayout`).
- Páginas placeholder de Inicio y Pacientes.
- Pantalla de login (`src/pages/Login.jsx`) y su estilo asociado.
- Contexto de autenticación (`src/context/`) y cliente de API (`src/api/`) para llamar a `POST /auth/login` del backend y persistir la sesión.

### Changed

- Estilos migrados a Tailwind CSS v4 (T13), con el plugin `@tailwindcss/vite`. Los tokens del Figma (colores, tamaños de texto y sombra de card) están en el `@theme` de `src/index.css`. Layout, login, inicio, pacientes, ficha, formulario y 404 usan utilidades en el JSX y mantienen la misma funcionalidad. Componentes nuevos para lo que se repetía: `Button`, `Avatar`, `BackButton`, e `inputClass` exportado desde `FormField`. Decisión en `docs/decisiones/framework-de-estilos-tailwind.md` (repo de tooling).
- `color-scheme` fijo en `light`: la app no tiene diseño oscuro, y con `light dark` los inputs nativos salían oscuros si el sistema estaba en modo oscuro.
- `index.html`: `lang="es"` y título "NutrIA".
- Adaptado al formato de error del backend `{ error: { code, message, details? } }` (T7). Un `401` del login (credenciales inválidas) ya no se trata como sesión expirada.
- `MainLayout` y `App.jsx` ajustados para reflejar el estado de sesión y proteger las rutas internas.

### Fixed

- Datos del adulto responsable que quedaban tipeados en el formulario de paciente y se guardaban aunque la fecha de nacimiento hubiera pasado a ser de un adulto y la sección estuviera oculta. `formToPayload` (extraído a `src/pages/patientFormMapping.js`) ahora los manda vacíos en ese caso.
- Si la ficha de un paciente no cargaba en el formulario de edición (por ejemplo, un id inválido en la URL), el formulario se mostraba vacío y "Guardar paciente" seguía habilitado, permitiendo guardar sobre datos vacíos. Ahora se muestra el error y un botón para volver, sin formulario.

## Versiones

Cada incremento cerrado es una versión. Al cerrar el incremento en curso, el contenido de "Unreleased" pasa a una entrada `## [X.Y.Z] - AAAA-MM-DD` nueva, arriba de la anterior, y "Unreleased" queda vacío para lo que siga. Las versiones siguen el versionado semántico.
