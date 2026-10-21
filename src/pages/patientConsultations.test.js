import { describe, expect, it } from 'vitest';
import {
  complianceBadge,
  consultationTypeLabel,
  emptyConsultationForm,
  formToConsultationPayload,
  newHabitRow,
} from './patientConsultations';

describe('emptyConsultationForm', () => {
  it('arranca con la fecha de hoy, tipo primera y una fila de hábito vacía', () => {
    const form = emptyConsultationForm({ today: '2026-10-19' });

    expect(form).toMatchObject({ date: '2026-10-19', type: 'first', observations: '' });
    expect(form.habits).toHaveLength(1);
    expect(form.habits[0].description).toBe('');
  });

  it('propone seguimiento cuando el paciente ya tiene consultas', () => {
    expect(emptyConsultationForm({ hasConsultations: true, today: '2026-10-19' }).type).toBe('follow_up');
  });
});

describe('newHabitRow', () => {
  it('da una key distinta a cada fila', () => {
    expect(newHabitRow().key).not.toBe(newHabitRow().key);
  });
});

describe('formToConsultationPayload', () => {
  it('manda los hábitos con descripción, recortados, y descarta las filas en blanco', () => {
    const form = {
      ...emptyConsultationForm({ today: '2026-10-19' }),
      habits: [
        { key: 1, description: '  Caminar 30 minutos ' },
        { key: 2, description: '   ' },
        { key: 3, description: 'Fruta en la merienda' },
      ],
    };

    expect(formToConsultationPayload(form).habits).toEqual([
      { description: 'Caminar 30 minutos' },
      { description: 'Fruta en la merienda' },
    ]);
  });

  it('una consulta sin hábitos ni datos opcionales manda fecha, tipo y textos vacíos', () => {
    expect(formToConsultationPayload(emptyConsultationForm({ today: '2026-10-19' }))).toEqual({
      date: '2026-10-19',
      type: 'first',
      motivation: '',
      decisionOrigin: '',
      perceivedObstacle: '',
      mainHabit: '',
      observations: '',
      habits: [],
      measurements: [],
    });
  });

  it('manda peso, talla y las mediciones agregadas en measurements (T20)', () => {
    const form = {
      ...emptyConsultationForm({ today: '2026-10-19' }),
      weight: '70,2',
      height: '165',
      measurements: [{ key: 1, type: 'glucose', detail: '', value: '98', unit: 'mg/dL' }],
    };

    const payload = formToConsultationPayload(form);

    expect(payload.measurements).toEqual([
      { type: 'weight', value: 70.2 },
      { type: 'height', value: 165 },
      { type: 'glucose', detail: '', value: 98, unit: 'mg/dL' },
    ]);
    expect(payload).not.toHaveProperty('weight');
    expect(payload).not.toHaveProperty('height');
  });
});

describe('etiquetas', () => {
  it('muestra el tipo de consulta en castellano', () => {
    expect(consultationTypeLabel('first')).toBe('Primera');
    expect(consultationTypeLabel('follow_up')).toBe('Seguimiento');
  });

  it('muestra el estado del hábito en castellano', () => {
    expect(complianceBadge('pending')).toEqual({ label: 'Pendiente', tone: 'neutral' });
    expect(complianceBadge('not_met').label).toBe('No cumplido');
  });
});
