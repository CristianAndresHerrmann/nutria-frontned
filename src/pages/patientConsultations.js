import { todayInputValue } from '../utils/date';
import { formToMeasurementsPayload } from './patientMeasurements';

// Consultas del paciente (T19; RF-13, RF-18, RF-22 registro). Los valores de
// enum viajan en inglés y la ficha muestra la etiqueta en castellano.
export const CONSULTATION_TYPES = [
  { value: 'first', label: 'Primera' },
  { value: 'follow_up', label: 'Seguimiento' },
];

export function consultationTypeLabel(type) {
  return CONSULTATION_TYPES.find((option) => option.value === type)?.label ?? type;
}

// Los cuatro datos de RF-13, opcionales. Mismo orden en el formulario y en el
// historial.
export const CONSULTATION_TEXT_FIELDS = [
  { name: 'motivation', label: 'Motivación', placeholder: 'Ej. Sentirse con más energía' },
  { name: 'decisionOrigin', label: 'Origen de la decisión de cambio', placeholder: 'Ej. Propia, derivación médica' },
  { name: 'perceivedObstacle', label: 'Obstáculo percibido', placeholder: 'Ej. Falta de tiempo para cocinar' },
  { name: 'mainHabit', label: 'Hábito principal a modificar', placeholder: 'Ej. Picoteo por la tarde' },
];

// Estado del hábito. Al registrarlo es siempre pendiente; los demás los carga
// la evaluación del Incremento 5 (el seed ya trae algunos evaluados).
const COMPLIANCE_LABELS = {
  pending: { label: 'Pendiente', tone: 'neutral' },
  met: { label: 'Cumplido', tone: 'mint' },
  partial: { label: 'Parcial', tone: 'warning' },
  not_met: { label: 'No cumplido', tone: 'warning' },
};

export function complianceBadge(compliance) {
  return COMPLIANCE_LABELS[compliance] ?? { label: compliance, tone: 'neutral' };
}

// Cada fila de hábito lleva una key propia para que React no confunda los
// inputs al quitar una fila del medio.
let nextHabitKey = 0;

export function newHabitRow() {
  nextHabitKey += 1;
  return { key: nextHabitKey, description: '' };
}

// Fecha de hoy y, si el paciente ya tiene consultas, tipo seguimiento. Son solo
// valores iniciales: el profesional los cambia y el backend no impone reglas
// entre consultas.
export function emptyConsultationForm({ hasConsultations = false, today = todayInputValue() } = {}) {
  return {
    date: today,
    type: hasConsultations ? 'follow_up' : 'first',
    motivation: '',
    decisionOrigin: '',
    perceivedObstacle: '',
    mainHabit: '',
    observations: '',
    // Mediciones tomadas en la consulta (T20): peso y talla en su propio bloque
    // y las demás como filas que se agregan.
    weight: '',
    height: '',
    measurements: [],
    habits: [newHabitRow()],
  };
}

// Las filas de hábito en blanco no se mandan: el formulario arranca con una
// vacía y los hábitos son opcionales. Lo mismo las mediciones. El resto va tal
// cual (el backend recorta y toma el texto vacío como "sin dato").
export function formToConsultationPayload(form) {
  const { habits, weight: _weight, height: _height, measurements: _measurements, ...fields } = form;
  return {
    ...fields,
    habits: habits
      .map((habit) => habit.description.trim())
      .filter(Boolean)
      .map((description) => ({ description })),
    measurements: formToMeasurementsPayload(form),
  };
}
