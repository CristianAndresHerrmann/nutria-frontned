# Changelog — nutria-frontend

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y [Semantic Versioning](https://semver.org/lang/es/). Nunca se documentan credenciales (usuarios, contraseñas, tokens, secrets) aquí, ni siquiera de datos de prueba locales.

## Unreleased

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

- Adaptado al formato de error del backend `{ error: { code, message, details? } }` (T7). Un `401` del login (credenciales inválidas) ya no se trata como sesión expirada.
- `MainLayout` y `App.jsx` ajustados para reflejar el estado de sesión y proteger las rutas internas.

### Fixed

- Datos del adulto responsable que quedaban tipeados en el formulario de paciente y se guardaban aunque la fecha de nacimiento hubiera pasado a ser de un adulto y la sección estuviera oculta. `formToPayload` (extraído a `src/pages/patientFormMapping.js`) ahora los manda vacíos en ese caso.
- Si la ficha de un paciente no cargaba en el formulario de edición (por ejemplo, un id inválido en la URL), el formulario se mostraba vacío y "Guardar paciente" seguía habilitado, permitiendo guardar sobre datos vacíos. Ahora se muestra el error y un botón para volver, sin formulario.

## Tags

Sin versiones publicadas todavía. Cuando cierre la iteración actual, sus cambios pasarán de "Unreleased" a una entrada `## [0.1] - AAAA-MM-DD` (siguiendo versionado semántico) en esta sección.
