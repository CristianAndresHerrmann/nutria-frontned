// Datos clínicos y contextuales del paciente (T16; RF-04 a RF-14). El
// formulario y la ficha se arman desde esta lista, así comparten etiquetas y
// el mapeo de patientFormMapping no repite los campos a mano. Todos son
// opcionales: la ficha se guarda con lo que haya y se completa después.
//
// kind:
// - text: input de una línea.
// - textarea: texto largo; ocupa el ancho completo en el form y en la ficha.
// - yesNo: booleano opcional (Sin dato / Sí / No).

export const CLINICAL_TAB = 'Información clínica';
export const HABITS_TAB = 'Hábitos y alimentación';

export const CLINICAL_SECTIONS = [
  {
    title: 'Antecedentes',
    subtitle: 'Antecedentes, medicación y tratamientos en curso.',
    tab: CLINICAL_TAB,
    fields: [
      {
        name: 'medicalHistory',
        label: 'Antecedentes personales y familiares',
        kind: 'textarea',
        placeholder: 'Ej. Hipotiroidismo en la familia materna',
      },
      { name: 'medication', label: 'Medicación actual', kind: 'textarea', placeholder: 'Ej. Levotiroxina 50 mcg' },
      {
        name: 'externalTreatment',
        label: 'Tratamiento psicológico o psiquiátrico en curso',
        kind: 'textarea',
        placeholder: 'Ej. Terapia psicológica semanal',
      },
    ],
  },
  {
    title: 'Hábitos y alimentación',
    subtitle: 'Hábitos diarios y patrones de ingesta.',
    tab: HABITS_TAB,
    fields: [
      { name: 'physicalActivity', label: 'Actividad física', kind: 'text', placeholder: 'Ej. Camina 30 minutos, 3 veces por semana' },
      { name: 'smoking', label: 'Tabaco', kind: 'text', placeholder: 'Ej. No fuma' },
      { name: 'alcohol', label: 'Alcohol', kind: 'text', placeholder: 'Ej. Ocasional, fines de semana' },
      { name: 'mealSchedule', label: 'Horarios de comida', kind: 'text', placeholder: 'Ej. Desayuno 7 h, almuerzo 13 h' },
      { name: 'sleepSchedule', label: 'Horarios de sueño', kind: 'text', placeholder: 'Ej. De 23 h a 6:30 h' },
      {
        name: 'intakePatterns',
        label: 'Ingesta fuera de las comidas planificadas',
        kind: 'textarea',
        placeholder: 'Ej. Picoteo por la tarde, come más cuando está ansiosa/o',
      },
    ],
  },
  {
    title: 'Contexto de cocina',
    subtitle: 'Quién cocina, con qué tiempo y con qué recursos.',
    tab: HABITS_TAB,
    fields: [
      { name: 'cooks', label: '¿Cocina?', kind: 'yesNo' },
      { name: 'likesCooking', label: '¿Le gusta cocinar?', kind: 'yesNo' },
      { name: 'cookingTime', label: 'Tiempo disponible para cocinar', kind: 'text', placeholder: 'Ej. 30 minutos por día' },
      { name: 'homeEquipment', label: 'Equipamiento del hogar', kind: 'text', placeholder: 'Ej. Horno, anafe y microondas' },
      { name: 'usualShoppingPlace', label: 'Lugar de compra habitual', kind: 'text', placeholder: 'Ej. Supermercado y verdulería' },
    ],
  },
  {
    title: 'Comidas fuera del hogar',
    subtitle: 'Comidas que hace fuera de casa y con qué cuenta ahí.',
    tab: HABITS_TAB,
    fields: [
      { name: 'mealsOutsideHome', label: 'Comidas fuera del hogar', kind: 'text', placeholder: 'Ej. Almuerzo de lunes a viernes' },
      {
        name: 'outsideEquipment',
        label: 'Medios para conservar o calentar',
        kind: 'text',
        placeholder: 'Ej. Heladera y microondas en la oficina',
      },
    ],
  },
  {
    title: 'Ocupación y trabajo',
    subtitle: 'Ocupación, regularidad de horarios y disponibilidad para alimentarse.',
    tab: HABITS_TAB,
    fields: [
      { name: 'occupation', label: 'Ocupación', kind: 'text', placeholder: 'Ej. Docente' },
      {
        name: 'workContext',
        label: 'Contexto laboral',
        kind: 'textarea',
        placeholder: 'Ej. Turno mañana, horario regular, 20 minutos para almorzar',
      },
    ],
  },
];

export const CLINICAL_FIELDS = CLINICAL_SECTIONS.flatMap((section) => section.fields);

export function sectionsForTab(tab) {
  return CLINICAL_SECTIONS.filter((section) => section.tab === tab);
}

// null para "sin dato", así el fallback de la ficha no confunde false con vacío.
export function formatYesNo(value) {
  if (value === true) return 'Sí';
  if (value === false) return 'No';
  return null;
}

// Valor de un campo clínico tal como se muestra en la ficha.
export function displayClinicalValue(field, patient) {
  const value = patient[field.name];
  return field.kind === 'yesNo' ? formatYesNo(value) : value;
}
