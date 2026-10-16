// birthDate llega del backend como ISO en medianoche UTC (ej.
// "1992-03-14T00:00:00.000Z"). Cortar el string evita instanciar un Date y
// que el motor lo reinterprete en la zona horaria local, que corre la fecha
// un día para el usuario en Argentina (UTC-3).
export function toDateInputValue(isoString) {
  if (!isoString) return '';
  return isoString.slice(0, 10);
}

export function formatDate(isoString) {
  if (!isoString) return 'Sin dato';
  return isoToDisplay(isoString.slice(0, 10));
}

const DISPLAY_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// AAAA-MM-DD (formato de la API) → DD/MM/AAAA (lo que ve el usuario).
export function isoToDisplay(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

// DD/MM/AAAA → AAAA-MM-DD, o null si está incompleta o la fecha no existe
// (30/02, 29/02 de un año no bisiesto). Misma verificación que el backend:
// Date desborda en vez de fallar, así que se compara contra lo recibido.
export function displayToIso(text) {
  const match = DISPLAY_DATE.exec(text ?? '');
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

// Máscara del input de fecha: solo dígitos (hasta 8) y las barras se agregan
// solas. La barra aparece recién con el dígito siguiente ("14" → "14", "143" →
// "14/3"), así borrar hacia atrás no queda trabado en una barra.
export function maskDateText(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Qué valor sube al formulario según lo tipeado. Una fecha inexistente o
// incompleta no se convierte en '' (se guardaría sin fecha sin avisar): sube tal
// cual y dateValueError la frena antes de guardar.
export function dateTextToValue(text) {
  if (text === '') return '';
  const iso = displayToIso(text);
  if (iso) return iso;
  const match = DISPLAY_DATE.exec(text);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : text;
}

// Inversa de dateTextToValue, para mostrar el valor que llega del formulario.
export function valueToDateText(value) {
  if (!value) return '';
  return ISO_DATE.test(value) ? isoToDisplay(value) : value;
}

// Error de un valor de DateInput, o null si se puede guardar. Vacío no es error
// acá: si la fecha es obligatoria lo decide cada formulario. El formulario no
// manda nada al backend mientras haya error, así una fecha como 30/02 se
// advierte en el campo y no se guarda.
export function dateValueError(value, { min, max } = {}) {
  if (!value) return null;
  if (!ISO_DATE.test(value)) return 'Completá la fecha con el formato DD/MM/AAAA';
  if (!displayToIso(isoToDisplay(value))) return 'Esa fecha no existe';
  if (max && value > max) {
    return max === todayInputValue() ? 'La fecha no puede ser futura' : `La fecha no puede ser posterior al ${isoToDisplay(max)}`;
  }
  if (min && value < min) return `La fecha no puede ser anterior al ${isoToDisplay(min)}`;
  return null;
}

// Para advertir mientras se tipea: una fecha a medio escribir todavía no es un
// error, recién lo es al intentar guardar.
export function completeDateValueError(value, range) {
  return ISO_DATE.test(value ?? '') ? dateValueError(value, range) : null;
}

// Puente con el calendario, que trabaja con Date en hora local: se construye y
// se lee con getters locales para que el día elegido sea el que se guarda.
export function isoToLocalDate(value) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function localDateToIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTime(isoString) {
  if (!isoString) return 'Sin dato';
  return new Date(isoString).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

// Fecha de hoy en hora local como AAAA-MM-DD, para el `max` de una fecha que no
// puede ser futura. Local y no UTC: entre las 21 y las 24 en Argentina, en UTC
// ya es mañana. Ayuda visual nomás: el backend es quien rechaza una fecha futura.
export function todayInputValue() {
  return localDateToIso(new Date());
}

// Solo para mostrar/ocultar la sección de responsable mientras se completa el
// formulario: es una ayuda visual, no la fuente de verdad. La validación real
// (y el corte exacto de "menor de 18") la hace el backend en cada submit.
export function isMinorFromDateInput(value) {
  if (!value) return false;
  const [year, month, day] = value.split('-').map(Number);
  const now = new Date();
  let age = now.getUTCFullYear() - year;
  const beforeBirthdayThisYear =
    now.getUTCMonth() + 1 < month || (now.getUTCMonth() + 1 === month && now.getUTCDate() < day);
  if (beforeBirthdayThisYear) age -= 1;
  return age < 18;
}
