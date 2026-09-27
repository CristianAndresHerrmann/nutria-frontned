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
  const [year, month, day] = isoString.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateTime(isoString) {
  if (!isoString) return 'Sin dato';
  return new Date(isoString).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

// Fecha de hoy en UTC como AAAA-MM-DD, para el `max` del input de fecha de
// nacimiento. Ayuda visual nomás: el backend es quien rechaza una fecha futura.
export function todayInputValue() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
