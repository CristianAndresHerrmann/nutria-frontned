# Revisión responsive

Cambios orientados a conservar datos y acciones desde 360 px. Sin cambios en
API, reglas de negocio, rutas, dependencias ni archivos CSS. Los ajustes usan
los tokens existentes y los breakpoints estándar de Tailwind.

## Decisiones de implementación

- Desde `lg` se conserva el sidebar de 256 px. Debajo se usa un `dialog` nativo
  con la misma navegación por rol, identidad completa y logout. El navegador
  contiene el foco y vuelve inerte el fondo. Se cierra con Escape, overlay,
  botón de cierre o navegación; se restaura el foco y el scroll del body.
- `DataTable` genera tabla y tarjetas desde las mismas columnas. CSS selecciona
  tarjetas debajo de `md`; todos los datos llevan etiqueta y las acciones van
  al pie. La expansión también se renderiza en las tarjetas. No usa `matchMedia`.
  El restablecimiento de contraseña comparte borrador, errores y estado de envío
  entre ambas variantes para conservarlos al cambiar de ancho.
- Entre `md` y `xl` la tabla tiene distribución fija y el texto/acciones pueden
  hacer wrap. Desde `xl` recupera la distribución automática original.
- Los encabezados y acciones se apilan en móvil. Las grillas de formularios
  anidados pasan progresivamente de una a dos columnas y, donde corresponde,
  recuperan tres/cuatro en `xl`. Las categorías también comienzan en una columna.
- Los badges y textos largos pueden ocupar varias líneas. La identidad se muestra
  completa en el panel móvil. En escritorio se conserva la composición original
  y un `details` en nombre/email permite desplegar la identidad completa con
  teclado, mouse o tacto; la lectura no depende de `title`.
- `ScrollTabs` conserva las pestañas en una línea, deja el scroll dentro de la
  barra, indica el desplazamiento con ↔ cuando desborda y lleva la activa a la
  vista. Las tablas de mediciones tienen región con foco y señal de desplazamiento.
- El calendario se renderiza en un portal y se ajusta a los bordes del viewport,
  al espacio vertical, al scroll y al teclado virtual mediante `visualViewport`.
  El selector de alimentos queda en el flujo debajo de `xl`, con scroll vertical.
- Las acciones de recetas tienen texto visible debajo de `xl`, además de sus
  etiquetas accesibles. En escritorio conservan su presentación con íconos.

## Verificación automatizada

Desde la raíz `nutria/`, dentro de Docker:

```powershell
npm.cmd run test:frontend
docker compose -f nutria-backend/docker-compose.yml run --build --rm --no-deps frontend npm run lint
docker compose -f nutria-backend/docker-compose.yml run --build --rm --no-deps frontend npm run build
```

`npm.cmd` ejecuta el mismo script `test:frontend` sin depender de la política de
ejecución de scripts de PowerShell. En otras shells se puede usar `npm`.

Resultado de la verificación final en Docker: **218 tests aprobados en 23 archivos**,
**lint sin errores** y **build de producción aprobado**. Lint conserva una
advertencia preexistente de Fast Refresh en `src/context/AuthContext.jsx:101`,
archivo que no se modificó en esta tarea.

Las pruebas de `DataTable` verifican cada variante por separado: columnas,
contenido completo, acciones con su `aria-label` y expansión. Las del layout
cubren apertura/cierre, navegación por rol, foco, logout y restauración de scroll.
Las del calendario cubren posición junto a los bordes, límite vertical, selección
desde el portal y cierre. Los tests de paginación existentes siguen cubriendo DA-33.

Los tests de jsdom no comprueban geometría real, estilos calculados, teclado
virtual ni la contención nativa del foco. La revisión visual y funcional de la
matriz siguiente queda pendiente; no se afirma equivalencia visual de escritorio
sin compararla en navegador.

## Preparación del recorrido manual

Usar exclusivamente cuentas y pacientes ficticios. Preparar un paciente menor
con adulto responsable, uno con ficha incompleta y otro con datos clínicos
faltantes. Incluir nombres, emails, objetivos y notas largos, también palabras
sin espacios. Usar más de 25 filas en Pacientes, Alimentos, Recetas y Cuentas.
Incluir recetas comunes, propias, dadas de baja e ingredientes dados de baja.

Hacer el recorrido con rol nutricionista y luego con admin.

## Qué revisar en cada ancho

| Ancho | Navegación | Tablas y paginación | Formularios | Pestañas y popovers |
| --- | --- | --- | --- | --- |
| 360 px | Abrir menú; leer nombre/email/rol; recorrer Tab y Shift+Tab; cerrar por overlay, Escape y enlace; comprobar foco y logout. Título del header completo. | Tarjetas: todos los campos, badges, acciones y expansión. Paginación apilada, 10/25 filas, anterior/siguiente y última página. | Una columna; guardar/cancelar alcanzables; categorías, radios, errores, adulto responsable, ingredientes y hábitos completos. | Deslizar ambas barras hasta el final; activa visible al entrar. Abrir calendario junto al borde y con teclado virtual; leer resultados completos del FoodPicker y alcanzar el último. |
| 390 px | Repetir cierres/foco; comprobar panel con nombre/email largos y altura reducida. | Tarjetas sin depender del ancho extra; probar acciones largas de cuentas y recetas. | Probar errores extensos y botones de recomendación; campos sin recorte. | Seleccionar mes/año/día, cerrar tocando fuera; agregar alimento y ver “Ya agregado”. |
| 768 px | Sigue el menú móvil; nombre/rol del header y título no se pisan. | Aparecen tablas: ninguna columna, badge o acción se pierde. Probar reset de contraseña expandido y paginación. | Comprobar grillas intermedias y formulario anidado de consulta con mediciones. | Pestañas completas o scroll local; calendario en campos derechos sin salir del viewport. |
| 1024 px | Aparece sidebar; navegación y logout completos. Abrir menú a 768 y ampliar: no debe quedar el body bloqueado. | Espacio reducido por sidebar: revisar especialmente Recetas y Cuentas, acciones y expansión. | Campos dentro de tarjetas ajustados; ninguna grilla presupone el ancho completo del viewport. | Scroll solo en la barra o mediciones; calendario junto al borde derecho y selector de alimentos legibles. |
| 1280 px | Comparar con escritorio previo: sidebar, header, avatar, nombre/rol, separaciones y paddings. Desplegar nombre/email del sidebar para leerlos completos. | Tabla automática original; mismas columnas y acciones. Probar paginación y expansión. | Recuperar distribución original, tamaños y alineación de botones; validar guardado/errores. | Comparar barras y calendario; FoodPicker recupera desplegable superpuesto y permite elegir. |
| 1440 px | Repetir comparación visual y navegación completa de ambos roles. | Verificar columnas, alineaciones, badges, acciones, totales y última página. | Comparar anchos máximos, grillas, espaciados y estados de envío. | Probar las seis pestañas y los cuatro catálogos; selección de fecha/alimentos con mouse y teclado. |

En todos los anchos revisar carga, vacío, error de carga, error por campo y error
de acción donde aplique. Ningún texto clínico, nombre o email debe depender de
hover o un tooltip para poder leerse completo. Comprobar que cambiar filtros
sigue restableciendo la paginación según DA-33.

## Matriz por ruta y estado

Cada casilla implica completar las comprobaciones del ancho correspondiente.
Las casillas quedan deliberadamente sin marcar hasta la revisión en navegador.

| Ruta / estado | Recorrido específico | 360 | 390 | 768 | 1024 | 1280 | 1440 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/login` | Credenciales inválidas, campos inválidos, sesión expirada, mostrar contraseña, login de ambos roles. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/` | Total, alta, ver todos, pacientes recientes con nombre/objetivo largos y fecha completa. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/pacientes` | Búsqueda, fichas incompletas, todas las columnas/celdas, abrir ficha y paginación. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/pacientes/nuevo` | Todos los campos, fecha, menor/adulto responsable, ficha incompleta, errores y guardar/cancelar. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/pacientes/:id/editar` | Datos precargados, todos los campos clínicos y de hábitos, fecha y guardar/cancelar. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/pacientes/:id` — Resumen | Ambos avisos, email largo, objetivo, adulto responsable, edición y fecha de actualización. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Ficha — Información clínica | Texto clínico completo; crear/editar/eliminar condición de patología, alimento y grupo; búsqueda y errores. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Ficha — Hábitos y alimentación | Todos los valores y textos extensos, manteniendo saltos de línea. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Ficha — Consultas | Historial y badges; nueva consulta; fecha/tipo; agregar/quitar hábitos y mediciones; unidades y errores. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Ficha — Mediciones | Antropometría y laboratorio: fecha, tipo/detalle, valor, unidad e IMC; scroll táctil y por teclado dentro de tabla. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Ficha — Planes | Generar propuesta, aviso en curso, badge “Generando” en la pestaña, error con Reintentar, aviso “Ver propuesta” y listado/tarjetas con Ver. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/pacientes/:id/planes/:planId` | Leyenda de propuesta editable, aviso RF-45, resumen de hallazgos, textos largos, opciones e ítems con hallazgos y no reconocidos destacados. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/catalogos` | Redirección a alimentos; barra completa y pestaña activa. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/catalogos/alimentos` | Buscar, filtrar por grupo, categorías completas, contador, alta y paginación. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/catalogos/alimentos/nuevo` | Nombre/grupo, todas las categorías, errores y guardar/cancelar. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/catalogos/grupos` | Jerarquía, contador, nombres y descripciones largos, sin recorte por sangría. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/catalogos/recetas` | Buscar receta/ingrediente, filtrar comida, no disponibles, todas las acciones, ingredientes y paginación. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/catalogos/recetas/nueva` | Tipos de comida, FoodPicker, cantidad, reordenar/quitar, preparación, nota y guardar/cancelar. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/catalogos/recetas/nueva?base=:id` | Texto de copia completo, ingredientes heredados y guardado como receta propia. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/catalogos/recetas/:id` | Datos, todos los ingredientes/cantidades/badges, preparación y nota; editar/duplicar según corresponda. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/catalogos/recetas/:id/editar` | Edición propia, disponibilidad, alimento dado de baja; común por URL muestra el aviso actual de solo lectura. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/catalogos/recomendaciones` | Filtro, dadas de baja, títulos/texto/patologías/badges completos y editar/alta. Entrada directa activa la última pestaña. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/catalogos/recomendaciones/nueva` | Patología/título/texto, errores y botones largos. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/catalogos/recomendaciones/:id/editar` | Datos precargados, vigencia, errores y guardar/cancelar; común muestra el aviso de solo lectura. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/admin` | Redirección a cuentas; menú exclusivo de admin, identidad y logout. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/admin/cuentas` | Alta, baja/reactivación, reset inline, nombres/emails/avisos largos, errores y paginación. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/*` y `/admin/*` inexistentes | 404, tarjeta completa y volver al inicio correcto por rol. | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

Probar además acceso sin sesión, retorno tras login y URL de otro rol. La
navegación responsive debe conservar los controles de acceso existentes.

## Detección de desborde

Ejecutar en cada ruta, ancho y estado desplegado:

```js
[...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth + 1)
```

Complementar con:

```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
```

El primer snippet también puede listar descendientes de una tabla o barra con
scroll local permitido. Revisar su contenedor: esos elementos deben ser
alcanzables desplazándolo, y el segundo resultado debe ser `false`. Comprobar
también el borde izquierdo y que no haya textos recortados dentro de un
`overflow-hidden`, aunque la página no desborde.

## Archivos del cambio

- Layouts: `src/layouts/MainLayout.jsx`, `CatalogLayout.jsx` y `MainLayout.test.jsx`.
- Componentes compartidos: `src/components/DataTable.jsx`, `DataTable.test.jsx`,
  `TablePagination.jsx`, `Button.jsx`, `Badge.jsx`, `FormField.jsx`, `SectionCard.jsx`,
  `ClinicalFieldInput.jsx`, `ScrollTabs.jsx`,
  `DateInput.jsx`, `DateInput.test.jsx` y `FoodPicker.jsx`.
- Componentes de ficha y administración: `PatientConditions.jsx`, `ConditionForm.jsx`,
  `PatientConsultations.jsx`, `ConsultationForm.jsx`, `ConsultationMeasurementsFields.jsx`,
  `PatientMeasurements.jsx`, `RecipeIngredientsFields.jsx`, `NutritionistAccountForm.jsx`
  y `PasswordResetForm.jsx`, dentro de `src/components/`.
  Su prueba de estado compartido está en `PasswordResetForm.test.jsx`.
- Pantallas: `src/pages/Home.jsx`, `Login.jsx`, `Patients.jsx`, `PatientForm.jsx`,
  `PatientDetail.jsx`, `Foods.jsx`, `FoodGroups.jsx`, `FoodForm.jsx`, `Recipes.jsx`,
  `RecipeDetail.jsx`, `RecipeForm.jsx`, `Recommendations.jsx`, `RecommendationForm.jsx`
  y `AdminAccounts.jsx`.
- Documentación: este archivo y la sección Responsive de
  `../../.agents/skills/frontend-react-nutria/SKILL.md`.

## Propuesta de DA-35 — no incorporada al registro

**Título:** Frontend responsive sin pérdida de contenido ni funcionalidad.

**Contexto:** la interfaz de escritorio dificulta el uso desde móviles y tablets;
el sidebar, las tablas, las pestañas y algunos formularios consumen más ancho del
disponible. Ocultar columnas, badges o acciones no resuelve el problema sin perder
información o capacidad de trabajo.

**Decisión propuesta:** construir mobile-first desde 360 px usando los breakpoints
estándar de Tailwind y conservar la composición de escritorio desde `xl`. Usar
navegación modal debajo de `lg`, tarjetas generadas por `DataTable` debajo de `md`
y paginación DA-33 en ambos formatos. Todo dato, aviso y acción debe seguir
visible o alcanzable; los textos largos hacen wrap. Solo se permite scroll
horizontal local, evidente y accesible en componentes que lo requieran.
Los popovers deben respetar el viewport y permitir alcanzar el contenido.

**Consecuencias:** reutilización de las columnas entre tabla y tarjetas, sin
dependencias nuevas ni detección de viewport para elegir la variante. Se debe
considerar el doble render en tests y formularios expandidos. Cada nueva pantalla,
incluido el editor de planes, debe verificarse en 360, 390, 768, 1024, 1280 y
1440 px, con convenciones documentadas en el skill del frontend.
