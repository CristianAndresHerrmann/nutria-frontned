# Changelog — nutria-frontend

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y [Semantic Versioning](https://semver.org/lang/es/). Nunca se documentan credenciales (usuarios, contraseñas, tokens, secrets) aquí, ni siquiera de datos de prueba locales.

## Unreleased

### Fixed

- La barra lateral de escritorio (desde `lg`) queda fija al alto de la ventana y ya no se desplaza con el contenido en pantallas largas, como la vista de un plan.

- AUD-010: todas las etapas derivadas de `deps` instalan con `npm ci`, para construir las imágenes de desarrollo y producción con las versiones del lockfile.

- AUD-017: las cargas de condiciones, consultas, mediciones y ficha usan `usePatientData`, limitado a ese flujo. Solo la última request vigente puede publicar datos o errores; cambiar de paciente oculta los datos anteriores y reinicia formularios y pestaña. Los guardados o eliminaciones pendientes no recargan ni notifican una ficha abandonada. Se conserva la recarga posterior al guardado y la ficha existente si falla su actualización. Pruebas de ciclo de vida con React montado y `jsdom` como dependencia de desarrollo, incluidas respuestas demoradas y `StrictMode`. Los buscadores y sus debounces no cambian.

- AUD-008: dar de baja o reactivar una receta desde el listado usa `PATCH /recipes/:id` con solo `availableInCatalog`. Conserva las ediciones hechas desde otra pestaña y usa la receta actual devuelta por el servidor. Se elimina la reconstrucción del PUT desde la fila; el formulario sigue usando la edición completa.

### Added

- Edición y revalidación del borrador del plan (T40; RF-28, RF-29, RF-40, RF-46, RNF-10). La propuesta (`/pacientes/:id/planes/:planId`) se sigue abriendo en lectura, como en T39, y se edita en la misma pantalla con **Editar propuesta**, sin ruta aparte. La leyenda avisa en los dos modos que es un borrador que requiere revisión. No había Figma.
  - **Cancelar** descarta lo editado y vuelve a la lectura; si hay cambios, pide confirmación. **Guardar cambios** también vuelve a la lectura, con los hallazgos recalculados.
  - **Textos** (RF-40): diagnóstico situacional, introducción, objetivos y recomendaciones generales, contextuales y temáticas, en campos editables. Las clínicas aparecen solo si el plan ya las tiene, porque elegirlas del catálogo no es parte de esta tarea. Por comida se editan la indicación y la descripción de cada opción.
  - **Ítems y opciones**: cada ítem se puede **reemplazar** o **quitar**. Cada opción puede **agregar ítems** (hasta 15) y quitarse; si tiene ítems, pide confirmación. Cada comida puede **agregar opciones** (hasta 10).
  - **Elegir un ítem** del catálogo, nunca texto libre:
    - Alimento: con el buscador de alimentos, que ahora acepta su texto e `aria-label` por props.
    - Grupo: con el selector jerárquico.
    - Receta (RF-29): solo las del tipo de comida y sin ingredientes restringidos por las alergias, intolerancias o rechazos del paciente (`GET /recipes?patientId=`, RF-28), con búsqueda por nombre o ingrediente.
    - Así se resuelve un ítem no reconocido.
  - **Guardar cambios** manda el borrador completo (`PUT /patients/:id/plans/:planId`). El backend lo revalida y la pantalla muestra los hallazgos nuevos junto a cada ítem u opción (RF-46).
    - Mientras haya cambios sin guardar, un aviso indica que los hallazgos son de la última versión guardada. Un bloqueo solo desaparece al guardar la corrección de lo que lo produce.
    - Volver a la ficha o cerrar la pestaña con cambios pide confirmación.
    - Reabrir el borrador muestra los hallazgos con las condiciones actuales del paciente.
  - **Errores** con el criterio de T29 (`useFormErrors`, `FormError`): el de un texto va junto a su campo. El de un ítem llega en `meals` con la opción y el ítem en el mensaje, y se muestra arriba de las comidas.
  - Nuevos `updatePlan` y el filtro `patientId` en `recipesPath`. Mapeo puro en `src/pages/planForm.js` y componentes `PlanMealFields`, `PlanItemPicker` y `FindingList`. Ya no se usa `optionDescription`: la descripción de la opción se edita tal cual.
  - Pruebas del mapeo, del cliente y de la pantalla: guardar, reemplazar un no reconocido, asignar una receta con bloqueo, quitar y agregar, errores por campo y confirmación al salir.
  - El registro detallado de modificaciones para la trazabilidad (RF-41) queda para el Incremento 4.

- Generación y vista de la propuesta de plan alimentario (T39; RF-34, RF-45, RNF-02, RNF-10). No había Figma para estas pantallas, así que se armaron con los componentes y tokens existentes.
  - **Pestaña Planes** de la ficha (reemplaza el "Pronto"):
    - Listado de planes del paciente (creado, última modificación, estado "Borrador") con acceso a cada uno.
    - **Generar propuesta** pide a la IA las cuatro comidas. Mientras genera, el botón queda deshabilitado con un aviso de proceso en curso, y la ficha se puede seguir usando: al cambiar de pestaña, "Planes" muestra "Generando" y al volver el estado sigue ahí.
    - Si la IA falla (503 `IA_UNAVAILABLE`), se muestra el motivo, se aclara que no se creó ningún plan y se ofrece **Reintentar**. Si el cliente deja de esperar, se avisa que la propuesta pudo haberse generado y se recarga el listado.
    - Al terminar se ofrece **Ver propuesta**; no se navega solo, para no interrumpir lo que se esté haciendo.
  - **Vista de la propuesta** (`/pacientes/:id/planes/:planId`), de solo lectura:
    - Leyenda fija: es un borrador editable generado con IA que el profesional debe revisar y validar.
    - Aviso de datos clínicos faltantes (RF-45), el mismo de la ficha.
    - Resumen de hallazgos bloqueantes y advertencias; diagnóstico situacional, introducción, objetivos y recomendaciones cargadas; y cada comida con sus opciones e ítems (alimento, grupo o receta).
    - Cada hallazgo se muestra junto a su ítem, o al pie de la opción si es de composición, con badge **Bloqueante** o **Advertencia**. Los ítems no reconocidos quedan destacados en rojo.
    - "Volver a la ficha" abre la pestaña Planes.
  - La edición del plan no está en esta tarea.
  - Nuevo tono `danger` de `Badge` y token `danger-bg`.
- Recetas básicas comunes (T30; DA-34). El listado de Recetas muestra las comunes junto con las propias, marcadas como **Común** o **Propia**. Una común no se edita ni se da de baja: no tiene la acción Editar, y si se llega a su edición por URL se muestra "Las recetas comunes son de solo lectura." sin formulario.
- Detalle de una receta (`/catalogos/recetas/:id`, T30), de solo lectura: datos, ingredientes con sus cantidades, preparación y nota final. Se llega tocando el nombre en el listado, y desde ahí se edita (solo las propias) o se duplica. Guardar una edición o una copia lleva al detalle de la receta guardada, y Volver o Cancelar, a la receta de la que se partió.
- El encabezado muestra el título de las pantallas de recetas (Recetas, Nueva receta, Editar receta, Receta), que antes decía "Página no encontrada".
- Buscador en la tabla de Recetas: filtra en el cliente por nombre de receta o de ingrediente ("pollo" encuentra el arroz con pollo), sin distinguir mayúsculas ni tildes, y se combina con el tipo de comida y "Mostrar no disponibles". Cambiar la búsqueda vuelve a la primera página.
- Acciones de la tabla de Recetas como íconos, con tooltip: ver (ojo), editar (lápiz sobre hoja, solo las propias), duplicar (copiar) y dar de baja (tacho) o reactivar (flecha circular), solo las propias. La baja es lógica y pide confirmación; con "Mostrar no disponibles", la receta dada de baja aparece con el ícono para reactivarla. Nueva variante `ghost` del botón para los íconos de una fila.
- **Duplicar** una receta, común o propia (T30, fuera del alcance original de la card): abre el alta de receta (`/catalogos/recetas/nueva?base=<id>`) con todos sus datos copiados y el nombre marcado como "(copia)". El nutricionista la adapta (ingredientes, pasos, tipos de comida) y al guardar queda como receta propia nueva; la original no cambia.
- Paginación de las tablas (T28; DA-33): Alimentos, Pacientes, Recetas y Cuentas muestran 10 o 25 filas por página, a elección (10 por defecto), con el rango ("11–20 de 232") y botones de página anterior y siguiente. Cambiar la búsqueda o un filtro vuelve a la primera página. El pie no aparece si las filas entran en una página. La paginación es en el cliente: la API no cambia.
- Categoría **Complementario** en el alta de alimentos y en los listados (T28; DA-32), para los alimentos sin aporte a la composición (azúcar, sal, condimentos, manteca, agua).
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
- Integración continua con GitHub Actions (T12; RNF-06, RNF-13), en `.github/workflows/ci.yml`. Corre en cada PR hacia `development` o `master`, en cada push a `development` y a mano (`workflow_dispatch`): `npm ci`, lint (oxlint), tests, `npm run build`, `npm audit --audit-level=high` y `docker build` sin push. Sin secrets ni variables. El job `ci` es el check obligatorio del ruleset de `development` y `master`.
- Despliegue en staging (T-; RNF-06, RNF-13). Cómo se opera: README de `nutria-backend`, sección "Staging".
  - `Dockerfile` en etapas: `prod` sirve el build estático con nginx (`nginx.conf`: cualquier ruta devuelve `index.html` para React Router; caché larga para `assets/`, ninguna para `index.html`) y `dev`, la última, sigue siendo el `vite dev` del compose local.
  - Aviso de entorno de prueba (`src/components/EnvironmentBanner.jsx`), fijo abajo en todas las pantallas, incluido el login. El texto sale de `VITE_ENV_LABEL` en el build; en local no está y no se muestra.
  - `.github/workflows/cd-staging.yml`: en cada push a `staging` (o a mano) corre el CI y, si pasa, despliega el servicio en la VM y verifica que la página responde por HTTPS.
  - El CI también corre en los PR hacia `staging`, se puede reutilizar desde otro workflow (`workflow_call`) y construye además la imagen `prod`.
- Rol administrador y pantalla de **Cuentas** (T31). No había Figma, así que se armó con `Badge`, `Button`, `FormField` y los tokens existentes.
  - **Mismo login para los dos roles:**
    - El administrador entra a `/admin` y el nutricionista, a su inicio.
    - Después de un login, se vuelve a la pantalla que se quería abrir solo si es del rol que entró.
  - **Rutas protegidas por rol:** una cuenta que abre una ruta del otro rol vuelve a su propio inicio. "Página no encontrada" lleva al inicio del rol.
  - **Cuentas** (`/admin/cuentas`):
    - Listado de las cuentas de nutricionista con nombre, email, estado ("Activa" o "Desactivada") y fecha de alta.
    - **Nueva cuenta:** nombre, email y contraseña inicial, en un formulario en la misma pantalla.
    - **Desactivar** y **Reactivar**, con confirmación.
    - **Restablecer contraseña**, en un formulario en la fila de la cuenta.
    - Los errores del backend se muestran junto a su campo, con el borde en rojo; por ejemplo, un email repetido.
  - **Menú y encabezado según el rol:** el administrador ve solo "Cuentas" y se identifica como "Administrador", sin el "Lic.".
  - **Sesión:**
    - Una cuenta que se desactiva con la sesión abierta pasa a "Tu sesión expiró" en la siguiente request.
    - Un token guardado de antes de este cambio, que no trae rol, se descarta y hay que volver a iniciar sesión.
  - **Archivos y tests:**
    - `src/api/adminNutritionists.js`, `src/pages/AdminAccounts.jsx`, `src/components/NutritionistAccountForm.jsx` y `src/components/PasswordResetForm.jsx`.
    - `src/utils/roleRoutes.js`, con tests: inicio por rol, rutas permitidas y destino después del login.
    - `getTokenRole` en `src/api/client.js`, con tests de lectura del rol y la expiración del token.

### Changed

- Los formularios de paciente, receta, alimento, condición, consulta y recomendación muestran los errores de la misma forma (T29; RNF-04). El error de cada campo sigue junto al campo, y arriba del botón de guardar aparece "Revisá los campos marcados antes de guardar." (también en la validación local de fechas y mediciones), en lugar de repetir el primer error de campo. Un error sin campos (conflicto, servidor caído, sin conexión) se sigue mostrando arriba del botón con su mensaje. Lo resuelven el hook `useFormErrors` y el componente `FormError`, con pruebas unitarias.
- Las cuatro tablas usan los componentes nuevos `DataTable` y `TablePagination`, y el hook `usePagination` (T28), en lugar de repetir el marcado y las constantes `TH`/`TD` en cada pantalla. En Cuentas, la fila para restablecer la contraseña pasa a `renderExpanded` de `DataTable`. `Button` suma la variante `icon`.
- Dependencias actualizadas con `npm audit fix` para que `npm audit --audit-level=high` de la CI pase (T12): `vite` 8.3.5, `vitest` 5.0.5 y `source-map-js` 1.2.2, dentro de los rangos de `package.json`.
- `indent` (sangría de las opciones de grupo) pasa de `Foods.jsx` y `FoodForm.jsx` a `src/utils/foodGroupTree.js`, para reusarla en el formulario de condiciones (T18).
- La fecha de nacimiento del formulario de paciente usa `DateInput` en lugar del `<input type="date">` del navegador (T17).
- `ProtectedRoute` recibe el rol de las rutas que protege (T31). `useAuth()` suma `role` e `isAdmin`, y `MainLayout` arma el menú, los títulos y la etiqueta del encabezado según el rol.

### Fixed

- `npm run lint` dentro del contenedor revisaba también `node_modules` (miles de avisos ajenos): oxlint se guía por `.gitignore`, que `.dockerignore` dejaba fuera de la imagen. Ahora entra.
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
