import { describe, expect, it } from 'vitest';
import {
  CLINICAL_FIELDS,
  CLINICAL_SECTIONS,
  CLINICAL_TAB,
  HABITS_TAB,
  displayClinicalValue,
  formatYesNo,
  sectionsForTab,
} from './patientClinicalFields';

// Los campos clínicos que acepta POST/PUT /patients: los 18 de T16 y los 4 de T62.
const BACKEND_CLINICAL_FIELDS = [
  'medicalHistory',
  'medication',
  'externalTreatment',
  'physicalActivity',
  'smoking',
  'alcohol',
  'mealSchedule',
  'sleepSchedule',
  'intakePatterns',
  'cookingTime',
  'homeEquipment',
  'usualShoppingPlace',
  'mealsOutsideHome',
  'outsideEquipment',
  'occupation',
  'workContext',
  'cooks',
  'likesCooking',
  'hasOven',
  'hasStovetop',
  'hasMicrowave',
  'cookingMinutesPerDay',
];

describe('patientClinicalFields', () => {
  it('cubre exactamente los campos clínicos del backend, sin repetir', () => {
    const names = CLINICAL_FIELDS.map((field) => field.name);

    expect(new Set(names).size).toBe(names.length);
    expect([...names].sort()).toEqual([...BACKEND_CLINICAL_FIELDS].sort());
  });

  it('son sí/no si cocina, si le gusta y cada equipo; los minutos por día son un número', () => {
    const yesNo = CLINICAL_FIELDS.filter((field) => field.kind === 'yesNo').map((field) => field.name);

    expect(yesNo).toEqual(['cooks', 'likesCooking', 'hasOven', 'hasStovetop', 'hasMicrowave']);
    expect(CLINICAL_FIELDS.filter((field) => field.kind === 'minutes').map((field) => field.name)).toEqual(['cookingMinutesPerDay']);
  });

  it('muestra los minutos por día con la unidad, y nada si no hay dato', () => {
    const field = CLINICAL_FIELDS.find(({ name }) => name === 'cookingMinutesPerDay');

    expect(displayClinicalValue(field, { cookingMinutesPerDay: 20 })).toBe('20 minutos');
    expect(displayClinicalValue(field, { cookingMinutesPerDay: null })).toBeNull();
  });

  it('reparte las secciones entre las pestañas Información clínica y Hábitos y alimentación', () => {
    expect(sectionsForTab(CLINICAL_TAB).map((section) => section.title)).toEqual(['Antecedentes']);
    expect(sectionsForTab(HABITS_TAB).map((section) => section.title)).toEqual([
      'Hábitos y alimentación',
      'Contexto de cocina',
      'Comidas fuera del hogar',
      'Ocupación y trabajo',
    ]);
    expect(CLINICAL_SECTIONS.every((section) => [CLINICAL_TAB, HABITS_TAB].includes(section.tab))).toBe(true);
  });
});

describe('formatYesNo', () => {
  it('muestra Sí, No o nada (para que la ficha muestre "Sin dato")', () => {
    expect(formatYesNo(true)).toBe('Sí');
    expect(formatYesNo(false)).toBe('No');
    expect(formatYesNo(null)).toBeNull();
    expect(formatYesNo(undefined)).toBeNull();
  });
});

describe('displayClinicalValue', () => {
  const cooks = CLINICAL_FIELDS.find((field) => field.name === 'cooks');
  const smoking = CLINICAL_FIELDS.find((field) => field.name === 'smoking');

  it('formatea los sí/no y deja el texto tal cual', () => {
    expect(displayClinicalValue(cooks, { cooks: false })).toBe('No');
    expect(displayClinicalValue(smoking, { smoking: 'No fuma' })).toBe('No fuma');
  });

  it('devuelve un valor vacío cuando no hay dato', () => {
    expect(displayClinicalValue(cooks, { cooks: null })).toBeNull();
    expect(displayClinicalValue(smoking, { smoking: null })).toBeNull();
  });
});
