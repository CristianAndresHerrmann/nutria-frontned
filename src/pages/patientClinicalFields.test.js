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

// Los 18 campos que acepta POST/PUT /patients desde T16.
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
];

describe('patientClinicalFields', () => {
  it('cubre exactamente los campos clínicos del backend, sin repetir', () => {
    const names = CLINICAL_FIELDS.map((field) => field.name);

    expect(new Set(names).size).toBe(names.length);
    expect([...names].sort()).toEqual([...BACKEND_CLINICAL_FIELDS].sort());
  });

  it('solo cooks y likesCooking son sí/no', () => {
    const yesNo = CLINICAL_FIELDS.filter((field) => field.kind === 'yesNo').map((field) => field.name);

    expect(yesNo).toEqual(['cooks', 'likesCooking']);
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
