# Changelog — nutria-frontend

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y [Semantic Versioning](https://semver.org/lang/es/). Nunca se documentan credenciales (usuarios, contraseñas, tokens, secrets) aquí, ni siquiera de datos de prueba locales.

## Unreleased

### Added

- Sección **Catálogos** en el menú principal (T15). El Figma no tiene estas pantallas, así que se armaron con los componentes y tokens existentes. Tiene dos pestañas, Alimentos y Grupos:
  - **Alimentos** (`/catalogos/alimentos`):
    - Muestra los alimentos de la base común y los que cargó el nutricionista, que solo ve él.
    - Buscador por nombre, que consulta al backend cuando se deja de tipear.
    - Filtro por grupo, con las opciones indentadas según la jerarquía. Elegir un grupo incluye sus subgrupos.
    - Tabla con el grupo completo ("Carnes, pescados y huevos › Pescados") y las categorías.
  - **Nuevo alimento** (`/catalogos/alimentos/nuevo`):
    - Nombre, grupo y una o más categorías nutricionales con casillas.
    - El alimento queda privado del nutricionista. La pantalla aclara que después no se puede modificar, y que una corrección se le pide al administrador del catálogo.
    - Los errores del backend se muestran en su campo, con el borde en rojo (`aria-invalid`). Por ejemplo, un nombre repetido sin distinguir mayúsculas.
  - **Grupos** (`/catalogos/grupos`): listado indentado de la jerarquía, de solo lectura.
- No hay edición ni baja de alimentos, ni pantallas de patologías o de alta de grupos: son del rol administrador, que se implementa en una tarea aparte.
- Datos clínicos y contextuales del paciente (T16). No había Figma para estas secciones, así que se armaron con `SectionCard`, `FormField` y los tokens existentes.
  - **Formulario** (alta y edición), con cinco secciones nuevas, todas opcionales:
    - Antecedentes: antecedentes, medicación y tratamiento psicológico o psiquiátrico.
    - Hábitos y alimentación: actividad física, tabaco, alcohol, horarios de comida y de sueño, e ingesta fuera de las comidas.
    - Contexto de cocina.
    - Comidas fuera del hogar.
    - Ocupación y trabajo.
    - "¿Cocina?" y "¿Le gusta cocinar?" se eligen como Sin dato, Sí o No, para no confundir "no" con "no se sabe".
    - Los errores del backend se muestran en su campo, con el borde en rojo.
  - **Ficha:**
    - Se habilitan las pestañas **Información clínica** (Antecedentes) y **Hábitos y alimentación** (las otras cuatro secciones). Los campos vacíos muestran "Sin dato". **Planes** sigue en "Pronto".
    - Aviso visible arriba de las pestañas cuando el paciente no tiene patologías, alergias, intolerancias ni medicación registradas (RF-45, parte de la ficha). Lo calcula el backend (`missingClinicalData`) y no bloquea nada.
  - **Archivos y tests:**
    - `src/pages/patientClinicalFields.js` define campos, etiquetas y pestañas, y lo usan el formulario, la ficha y el mapeo.
    - Componente nuevo `src/components/ClinicalFieldInput.jsx`; `FormField` exporta `textareaClass`.
    - Tests del mapeo (ida y vuelta, Sí/No, se mandan todos los campos porque el `PUT` reemplaza el objeto completo) y de la configuración, que tiene que coincidir con los campos del backend.
- `src/api/catalogs.js`, `src/utils/foodGroupTree.js` (orden indentado y ruta de un grupo), `src/utils/foodCategories.js` (etiquetas en castellano) y `src/pages/foodFormMapping.js`, con sus tests.
- Componente de fecha único `src/components/DateInput.jsx`, con selector de calendario (T17; RNF-04). Es el que van a usar todas las fechas: nacimiento desde ahora, consulta y medición cuando lleguen sus pantallas (T19/T20).
  - Se tipea DD/MM/AAAA, con las barras agregadas solas, o se elige el día en un calendario (`react-day-picker`, en castellano, con listas de mes y año para saltar décadas). El calendario se estila con los tokens, sin el CSS de la librería.
  - Hacia el formulario el valor siempre es `AAAA-MM-DD`, el formato de la API. El calendario trabaja en hora local, así que el día elegido es el que se guarda, sin corrimiento por zona horaria.
  - Una fecha inexistente (30/02) o fuera de rango no se puede elegir en el calendario. Si se tipea, el campo avisa apenas se completa ("Esa fecha no existe", "La fecha no puede ser futura") y el formulario no guarda: frena el envío sin llamar a la API y marca el campo. Una fecha a medio escribir se avisa recién al intentar guardar. Nunca se convierte en "sin fecha". La regla es `dateValueError` en `src/utils/date.js`, para que cada formulario con fechas la reuse; el backend la sigue validando igual.
  - `min`/`max` en `AAAA-MM-DD` deshabilitan los días fuera de rango.
  - Helpers nuevos en `src/utils/date.js` (conversión DD/MM/AAAA ↔ AAAA-MM-DD, máscara, puente con el calendario), con tests en `src/utils/date.test.js` que corren en hora de Argentina.
- Condiciones alimentarias del paciente en la pestaña **Información clínica** (T18; RF-04 patologías, RF-07). No había Figma para este bloque, así que se armó con `SectionCard`, `FormField`, `Badge` y los tokens existentes.
  - Bloque "Condiciones alimentarias", debajo de Antecedentes, con cinco grupos: Patologías, Alergias, Intolerancias, Rechazos y Preferencias. Un grupo vacío muestra "Sin registros".
  - Cada condición muestra el alimento, grupo o patología (un grupo lleva la etiqueta "Grupo"), sus observaciones y la fecha de registro.
  - **Alta y edición** con un formulario dentro de la misma ficha:
    - Tipo de condición. Una patología se elige de un selector con el catálogo.
    - Para los demás tipos se elige si se refiere a un alimento o a un grupo. El alimento se busca por nombre (comunes y propios, solo vigentes), y la búsqueda sale cuando se deja de tipear. El grupo se elige de un selector indentado según la jerarquía.
    - Observaciones opcionales.
    - Los errores del backend se muestran en su campo. Por ejemplo, una condición repetida o un rechazo sin alimento ni grupo.
    - El botón se deshabilita mientras guarda.
  - **Baja** con confirmación.
  - Al agregar, editar o borrar una condición, la ficha vuelve a pedir el paciente, así el aviso de datos clínicos faltantes (RF-45) se actualiza solo.
  - `src/api/patientConditions.js` (las cuatro rutas) y `listPathologies` en `src/api/catalogs.js`.
  - `src/pages/patientConditions.js` (tipos, agrupado y mapeo del formulario), con tests: el payload manda solo el destino que corresponde al tipo y a lo elegido, y la edición vuelve al mismo payload.
- Pestaña **Consultas** en la ficha del paciente (T19; RF-13, RF-18, RF-22 registro). No había Figma, así que se armó con `SectionCard`, `FormField`, `DateInput`, `Badge` y los tokens existentes.
  - **Historial**, de la más reciente a la más antigua. Cada consulta muestra:
    - La fecha y el tipo (Primera o Seguimiento).
    - Los datos de RF-13 y las observaciones, solo los que se cargaron.
    - Los hábitos pautados con su estado. Al registrarlos es siempre "Pendiente"; los del seed ya evaluados muestran Cumplido o Parcial.
  - Sin consultas, muestra "Sin consultas registradas".
  - **Nueva consulta** con un formulario dentro de la misma pestaña:
    - Fecha con `DateInput`, obligatoria, no futura; arranca en el día de hoy.
    - Tipo con dos opciones. Propone Seguimiento si el paciente ya tiene consultas; es solo el valor inicial.
    - Motivación, origen de la decisión de cambio, obstáculo percibido, hábito principal a modificar y observaciones, todos opcionales.
    - Al final, la lista de hábitos pautados: una fila por hábito, "+ Agregar hábito" y "Quitar". Las filas en blanco no se mandan.
    - Los errores del backend se muestran en su campo; el de cualquier hábito, una sola vez debajo de la lista.
    - El botón se deshabilita mientras guarda.
  - No se puede editar una consulta desde la pantalla: la tarea pide historial y alta. El `PUT` existe en la API.
  - El encabezado de la ficha muestra la **última actualización** del paciente. Al guardar una consulta, la ficha vuelve a pedir el paciente y la fecha se actualiza.
  - `src/api/patientConsultations.js` (listado y alta).
  - `src/pages/patientConsultations.js` (tipos, campos, estados y mapeo del formulario), con tests: el payload descarta las filas de hábito en blanco y recorta las demás, y una consulta sin hábitos manda `habits: []`.
- Mediciones antropométricas y valores de laboratorio (T20; RF-11, RF-12). No había Figma, así que se armó con `SectionCard`, `FormField` y los tokens existentes.
  - **En el formulario de consulta**, un bloque opcional "Mediciones" antes de los hábitos pautados:
    - Peso (kg) y talla (cm). Aceptan coma decimal.
    - "+ Agregar medición o laboratorio": una fila por medición, con tipo (pliegue, circunferencia, colesterol, triglicéridos, glucemia u otro), detalle, valor y unidad, y un botón "Quitar".
    - La unidad se elige de un desplegable según el tipo:
      - Si el tipo tiene unidad fija, el desplegable muestra esa sola opción y no se puede cambiar: pliegue en mm, circunferencia en cm, y colesterol, triglicéridos y glucemia en mg/dL.
      - En "Otro" se elige de una lista de unidades de laboratorio, o "Sin unidad".
      - Al cambiar el tipo, la unidad vuelve a la del tipo nuevo.
      - Las listas son espejo de las del backend.
    - El detalle es obligatorio para pliegue, circunferencia y otro.
    - Todas toman la fecha de la consulta y se guardan junto con ella.
    - Antes de llamar a la API se validan valor y detalle, y el error se muestra en el campo y la fila que fallaron, con los mismos mensajes que el backend. El backend solo indica que falló alguna medición, sin decir cuál.
    - Peso y talla vacíos y las filas en blanco no se mandan.
  - **En la ficha**, la pestaña nueva **Mediciones**, entre Consultas y Planes, con el histórico de solo lectura en dos tablas:
    - Antropometría: fecha, tipo (con el detalle, ej. "Circunferencia · Cintura"), valor, unidad e IMC.
    - Laboratorio: fecha, tipo, valor y unidad. "Otro" va acá.
    - El IMC lo calcula el backend y se muestra con un decimal, sin clasificarlo. Si un peso no tiene talla anterior o del mismo día, se muestra "—".
    - Vacíos: "Sin mediciones registradas" y "Sin valores de laboratorio registrados".
  - No hay edición ni baja de mediciones, ni alta fuera de una consulta: la tarea pide la carga en la consulta y el histórico. Esas rutas existen en la API.
  - Los gráficos de evolución y la variación entre consultas son del Incremento 5.
  - `src/api/patientMeasurements.js` (listado).
  - `src/pages/patientMeasurements.js` (tipos, etiquetas, agrupado, validación y mapeo), con tests. Cubren:
    - El payload de peso, talla y filas.
    - Las unidades que ofrece cada tipo, y que la unidad cambie con el tipo.
    - Que no se manden las filas en blanco.
    - El detalle obligatorio.
    - Antropometría y laboratorio por separado.
    - El formato con coma decimal.
  - Componente nuevo `src/components/ConsultationMeasurementsFields.jsx`. `formToConsultationPayload` ahora manda `measurements`.
- Pestaña **Recetas** en Catálogos (T21; RF-27). No había Figma, así que se armó con `SectionCard`, `FormField`, `Badge` y los tokens existentes.
  - **Listado** (`/catalogos/recetas`):
    - Muestra solo las recetas del nutricionista.
    - Filtro por tipo de comida (desayuno, almuerzo, merienda, cena).
    - Casilla "Mostrar no disponibles" para ver también las dadas de baja, que se marcan "No disponible".
    - Tabla con nombre, tipos de comida, ingredientes, tiempo y un acceso a "Editar".
  - **Nueva receta** (`/catalogos/recetas/nueva`) y **Editar receta** (`/catalogos/recetas/:id/editar`):
    - Nombre, método de cocción, tiempo, lugar de compra, tipos de comida (casillas), ingredientes, preparación y nota final.
    - **Ingredientes:** se agregan con un buscador sobre el catálogo de alimentos (comunes y propios, vigentes), que consulta al backend cuando se deja de tipear.
      - Cada ingrediente tiene una cantidad descriptiva y se puede subir, bajar o quitar. El orden de la lista es el de la receta.
      - Un alimento ya agregado aparece deshabilitado en el buscador. Si se incorpora en tandas, se indica en la preparación.
      - Un alimento que se dio de baja después de cargarlo se marca "Dado de baja".
    - En la edición, la casilla "Disponible en el catálogo" da de baja o reactiva la receta. No hay borrado.
    - Los errores del backend se muestran en su campo, con el borde en rojo.
  - El filtro por condiciones del paciente (RF-28) existe en la API y no tiene pantalla en esta tarea: lo van a usar los planes del Incremento 3.
  - `src/api/recipes.js`, `src/utils/recipeLabels.js` (tipos de comida y métodos de cocción en castellano) y `src/pages/recipeFormMapping.js`, con tests: ida y vuelta del formulario, tipos en orden canónico, vacíos sin inventar datos, agregar sin repetir, mover filas y armado de la URL del listado.
  - Componentes nuevos `src/components/FoodPicker.jsx` y `src/components/RecipeIngredientsFields.jsx`.
- Pestaña **Recomendaciones** en Catálogos (T22; RF-30). No había Figma, así que se armó con `SectionCard`, `FormField`, `Badge` y los tokens existentes.
  - **Listado** (`/catalogos/recomendaciones`):
    - Agrupado por patología, con las comunes y las propias del nutricionista.
    - Filtro por patología.
    - Casilla "Mostrar dadas de baja" para ver también las dadas de baja, que se marcan "Dada de baja".
    - Cada recomendación muestra título, texto y si es "Común" o "Propia". "Editar" aparece solo en las propias: las comunes son de solo lectura.
  - **Nueva recomendación** (`/catalogos/recomendaciones/nueva`) y **Editar recomendación** (`/catalogos/recomendaciones/:id/editar`):
    - Patología, título y texto, todos obligatorios.
    - En la edición, la casilla "Vigente" da de baja o reactiva la recomendación. No hay borrado.
    - Abrir por URL la edición de una común muestra que es de solo lectura, sin formulario.
    - Los errores del backend se muestran en su campo, con el borde en rojo.
  - Títulos del encabezado para las tres pantallas.
  - `src/api/recommendations.js` y `src/pages/recommendationFormMapping.js`, con tests: ida y vuelta del formulario, alta sin `active`, vacíos sin inventar datos, agrupado por patología y armado de la URL del listado.

### Changed

- `indent` (sangría de las opciones de grupo) pasa de `Foods.jsx` y `FoodForm.jsx` a `src/utils/foodGroupTree.js`, para reusarla en el formulario de condiciones (T18).
- La fecha de nacimiento del formulario de paciente usa `DateInput` en lugar del `<input type="date">` del navegador (T17).

### Fixed

- `todayInputValue()` (el tope de la fecha de nacimiento) usaba la fecha UTC, así que entre las 21 y las 24 en Argentina ya permitía elegir el día siguiente. Ahora usa la fecha local (T17).

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
