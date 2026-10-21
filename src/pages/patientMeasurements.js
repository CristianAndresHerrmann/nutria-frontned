// Mediciones antropométricas y de laboratorio (T20; RF-11, RF-12). Los tipos
// viajan en inglés y la ficha muestra la etiqueta en castellano.
export const MEASUREMENT_TYPE_LABELS = {
  weight: 'Peso',
  height: 'Talla',
  skinfold: 'Pliegue',
  circumference: 'Circunferencia',
  cholesterol: 'Colesterol',
  triglycerides: 'Triglicéridos',
  glucose: 'Glucemia',
  other: 'Otro',
};

// `other` va con laboratorio: lo que suele faltar entre los tipos fijos son
// otros análisis (HbA1c, hemoglobina, TSH). Antropometría ya tiene pliegues y
// circunferencias con su detalle.
export const ANTHROPOMETRY_TYPES = ['weight', 'height', 'skinfold', 'circumference'];
export const LAB_TYPES = ['cholesterol', 'triglycerides', 'glucose', 'other'];

// Espejo de measurement.schema del backend. Cada tipo tiene unidad fija salvo
// `other`, que la elige de una lista o va sin unidad. Si se agrega una unidad,
// va en los dos lados. Detalle obligatorio para estos tres tipos.
export const FIXED_UNITS = {
  weight: 'kg',
  height: 'cm',
  skinfold: 'mm',
  circumference: 'cm',
  cholesterol: 'mg/dL',
  triglycerides: 'mg/dL',
  glucose: 'mg/dL',
};
export const OTHER_UNITS = ['%', 'g/dL', 'mg/dL', 'mg/L', 'µg/dL', 'ng/mL', 'pg/mL', 'mmol/L', 'mEq/L', 'UI/L', 'µUI/mL'];
export const TYPES_REQUIRING_DETAIL = ['skinfold', 'circumference', 'other'];

const NO_UNIT_OPTION = { value: '', label: 'Sin unidad' };

// Opciones del desplegable de unidad según el tipo: una sola si es fija.
export function unitOptionsFor(type) {
  if (FIXED_UNITS[type]) return [{ value: FIXED_UNITS[type], label: FIXED_UNITS[type] }];
  return [NO_UNIT_OPTION, ...OTHER_UNITS.map((unit) => ({ value: unit, label: unit }))];
}

function defaultUnitFor(type) {
  return FIXED_UNITS[type] ?? '';
}

// Peso y talla tienen su propio bloque en el formulario de consulta; las filas
// que se agregan son de los demás tipos.
export const EXTRA_MEASUREMENT_TYPES = Object.keys(MEASUREMENT_TYPE_LABELS)
  .filter((type) => type !== 'weight' && type !== 'height')
  .map((type) => ({ value: type, label: MEASUREMENT_TYPE_LABELS[type] }));

// Mismos mensajes que el backend, para que el error se lea igual venga de
// donde venga.
const VALUE_NOT_A_NUMBER = 'El valor debe ser un número';
const VALUE_NOT_POSITIVE = 'El valor debe ser mayor a cero';
const VALUE_TOO_LARGE = 'El valor es demasiado grande';
const DETAIL_REQUIRED = 'Indicá qué se midió (por ejemplo, qué pliegue o qué circunferencia)';

const MAX_VALUE = 999999.99;

// Acepta coma decimal ("68,5"), que es como se escribe acá.
export function parseMeasurementValue(text) {
  const normalized = String(text).trim().replace(',', '.');
  if (normalized === '' || !/^-?\d*\.?\d+$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}

function valueError(text) {
  const value = parseMeasurementValue(text);
  if (Number.isNaN(value)) return VALUE_NOT_A_NUMBER;
  if (value <= 0) return VALUE_NOT_POSITIVE;
  if (value > MAX_VALUE) return VALUE_TOO_LARGE;
  return undefined;
}

let nextMeasurementKey = 0;

// Cada fila lleva una key propia para que React no confunda los inputs al
// quitar una fila del medio.
export function newMeasurementRow() {
  nextMeasurementKey += 1;
  const type = EXTRA_MEASUREMENT_TYPES[0].value;
  return { key: nextMeasurementKey, type, detail: '', value: '', unit: defaultUnitFor(type) };
}

// Cambiar el tipo vuelve la unidad a la que corresponde al tipo nuevo: la
// anterior podría no estar entre sus opciones.
export function changeMeasurementRow(row, field, value) {
  if (field === 'type') return { ...row, type: value, unit: defaultUnitFor(value) };
  return { ...row, [field]: value };
}

// La unidad viene siempre elegida, así que no cuenta para saber si la fila
// quedó en blanco.
function isBlankRow(row) {
  return [row.detail, row.value].every((text) => text.trim() === '');
}

// Errores por campo antes de mandar la consulta: el backend señala cualquier
// medición inválida en un único `measurements`, sin decir cuál. Peso y talla
// vacíos y filas en blanco no son error: las mediciones son opcionales.
export function measurementFormErrors(form) {
  const errors = { rows: {} };
  for (const field of ['weight', 'height']) {
    if (form[field].trim() !== '') {
      const error = valueError(form[field]);
      if (error) errors[field] = error;
    }
  }
  for (const row of form.measurements) {
    if (isBlankRow(row)) continue;
    const rowErrors = {};
    const error = valueError(row.value);
    if (error) rowErrors.value = error;
    if (TYPES_REQUIRING_DETAIL.includes(row.type) && row.detail.trim() === '') rowErrors.detail = DETAIL_REQUIRED;
    if (Object.keys(rowErrors).length > 0) errors.rows[row.key] = rowErrors;
  }
  return errors;
}

export function hasMeasurementErrors(errors) {
  return Boolean(errors.weight || errors.height || Object.keys(errors.rows).length > 0);
}

// Peso y talla solo si se cargaron; las filas en blanco no se mandan. La unidad
// de peso y talla la completa el backend; la de las filas es la elegida ("" es
// sin unidad). La fecha es la de la consulta.
export function formToMeasurementsPayload(form) {
  const fixed = ['weight', 'height']
    .filter((type) => form[type].trim() !== '')
    .map((type) => ({ type, value: parseMeasurementValue(form[type]) }));
  const extra = form.measurements
    .filter((row) => !isBlankRow(row))
    .map((row) => ({ type: row.type, detail: row.detail, value: parseMeasurementValue(row.value), unit: row.unit }));
  return [...fixed, ...extra];
}

export function splitMeasurements(measurements) {
  return {
    anthropometry: measurements.filter((measurement) => ANTHROPOMETRY_TYPES.includes(measurement.type)),
    laboratory: measurements.filter((measurement) => LAB_TYPES.includes(measurement.type)),
  };
}

export function measurementLabel({ type, detail }) {
  const label = MEASUREMENT_TYPE_LABELS[type] ?? type;
  return detail ? `${label} · ${detail}` : label;
}

const VALUE_FORMAT = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
const BMI_FORMAT = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatMeasurementValue(value) {
  return VALUE_FORMAT.format(value);
}

// El IMC lo calcula el backend; acá solo se muestra, sin clasificarlo.
export function formatBmi(bmi) {
  return bmi === null || bmi === undefined ? '—' : BMI_FORMAT.format(bmi);
}
