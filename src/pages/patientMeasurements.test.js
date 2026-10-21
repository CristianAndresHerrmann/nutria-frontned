import { describe, expect, it } from 'vitest';
import {
  changeMeasurementRow,
  EXTRA_MEASUREMENT_TYPES,
  formatBmi,
  formatMeasurementValue,
  formToMeasurementsPayload,
  hasMeasurementErrors,
  measurementFormErrors,
  measurementLabel,
  newMeasurementRow,
  parseMeasurementValue,
  splitMeasurements,
  unitOptionsFor,
} from './patientMeasurements';

function form(overrides = {}) {
  return { weight: '', height: '', measurements: [], ...overrides };
}

function row(overrides) {
  return { ...newMeasurementRow(), ...overrides };
}

describe('parseMeasurementValue', () => {
  it('acepta punto o coma decimal', () => {
    expect(parseMeasurementValue('68,5')).toBe(68.5);
    expect(parseMeasurementValue('68.5')).toBe(68.5);
    expect(parseMeasurementValue(' 165 ')).toBe(165);
    expect(parseMeasurementValue('-3')).toBe(-3);
  });

  it.each(['', 'abc', '1,2,3'])('"%s" no es un número', (text) => {
    expect(parseMeasurementValue(text)).toBeNaN();
  });
});

describe('formToMeasurementsPayload', () => {
  it('manda peso y talla con su tipo, más las filas cargadas', () => {
    const payload = formToMeasurementsPayload(
      form({
        weight: '70,2',
        height: '165',
        measurements: [row({ type: 'glucose', value: '98', unit: 'mg/dL' }), row({ type: 'skinfold' })],
      }),
    );

    expect(payload).toEqual([
      { type: 'weight', value: 70.2 },
      { type: 'height', value: 165 },
      { type: 'glucose', detail: '', value: 98, unit: 'mg/dL' },
    ]);
  });

  it('sin mediciones manda una lista vacía', () => {
    expect(formToMeasurementsPayload(form({ measurements: [row({})] }))).toEqual([]);
  });

  it('acepta solo laboratorio, sin peso ni talla', () => {
    const payload = formToMeasurementsPayload(form({ measurements: [row({ type: 'cholesterol', value: '190' })] }));

    expect(payload.map((measurement) => measurement.type)).toEqual(['cholesterol']);
  });
});

describe('measurementFormErrors', () => {
  it('un formulario sin mediciones no tiene errores', () => {
    expect(hasMeasurementErrors(measurementFormErrors(form({ measurements: [row({})] })))).toBe(false);
  });

  it('señala peso y talla inválidos con los mensajes del backend', () => {
    const errors = measurementFormErrors(form({ weight: '0', height: 'mucho' }));

    expect(errors.weight).toBe('El valor debe ser mayor a cero');
    expect(errors.height).toBe('El valor debe ser un número');
  });

  it.each(['skinfold', 'circumference', 'other'])('exige detalle para %s', (type) => {
    const measurement = row({ type, value: '10' });
    const errors = measurementFormErrors(form({ measurements: [measurement] }));

    expect(errors.rows[measurement.key]).toEqual({
      detail: 'Indicá qué se midió (por ejemplo, qué pliegue o qué circunferencia)',
    });
  });

  it('una fila con detalle pero sin valor señala el valor', () => {
    const measurement = row({ type: 'circumference', detail: 'Cintura' });

    expect(measurementFormErrors(form({ measurements: [measurement] })).rows[measurement.key]).toEqual({
      value: 'El valor debe ser un número',
    });
  });

  it('un laboratorio sin detalle es válido', () => {
    const errors = measurementFormErrors(form({ measurements: [row({ type: 'glucose', value: '98' })] }));

    expect(hasMeasurementErrors(errors)).toBe(false);
  });
});

describe('newMeasurementRow', () => {
  it('da una key distinta a cada fila y no ofrece peso ni talla', () => {
    expect(newMeasurementRow().key).not.toBe(newMeasurementRow().key);
    expect(EXTRA_MEASUREMENT_TYPES.map((option) => option.value)).not.toContain('weight');
    expect(EXTRA_MEASUREMENT_TYPES.map((option) => option.value)).not.toContain('height');
  });
});

describe('histórico', () => {
  it('separa antropometría y laboratorio, con other en laboratorio', () => {
    const { anthropometry, laboratory } = splitMeasurements([
      { id: '1', type: 'weight' },
      { id: '2', type: 'glucose' },
      { id: '3', type: 'circumference' },
      { id: '4', type: 'other' },
    ]);

    expect(anthropometry.map((m) => m.id)).toEqual(['1', '3']);
    expect(laboratory.map((m) => m.id)).toEqual(['2', '4']);
  });

  it('muestra el tipo en castellano, con el detalle si lo tiene', () => {
    expect(measurementLabel({ type: 'weight', detail: null })).toBe('Peso');
    expect(measurementLabel({ type: 'circumference', detail: 'Cintura' })).toBe('Circunferencia · Cintura');
  });

  it('formatea valor e IMC con coma decimal, y un IMC ausente como guion', () => {
    expect(formatMeasurementValue(70.2)).toBe('70,2');
    expect(formatBmi(25.8)).toBe('25,8');
    expect(formatBmi(25)).toBe('25,0');
    expect(formatBmi(null)).toBe('—');
  });
});

describe('unidades', () => {
  it.each([
    ['skinfold', 'mm'],
    ['circumference', 'cm'],
    ['cholesterol', 'mg/dL'],
    ['triglycerides', 'mg/dL'],
    ['glucose', 'mg/dL'],
  ])('%s ofrece una sola unidad fija: %s', (type, unit) => {
    expect(unitOptionsFor(type)).toEqual([{ value: unit, label: unit }]);
  });

  it('otro ofrece sin unidad y la lista de unidades de laboratorio', () => {
    const options = unitOptionsFor('other').map((option) => option.value);

    expect(options[0]).toBe('');
    expect(options).toContain('%');
    expect(options).toContain('µUI/mL');
  });

  it('una fila nueva arranca con la unidad de su tipo', () => {
    const measurement = newMeasurementRow();

    expect(measurement.unit).toBe(unitOptionsFor(measurement.type)[0].value);
  });

  it('cambiar el tipo vuelve la unidad a la del tipo nuevo y conserva lo demás', () => {
    const measurement = row({ type: 'other', detail: 'HbA1c', value: '6,1', unit: '%' });

    expect(changeMeasurementRow(measurement, 'type', 'glucose')).toMatchObject({
      type: 'glucose',
      unit: 'mg/dL',
      detail: 'HbA1c',
      value: '6,1',
    });
    expect(changeMeasurementRow(measurement, 'type', 'other').unit).toBe('');
    expect(changeMeasurementRow(measurement, 'unit', 'g/dL').unit).toBe('g/dL');
  });

  it('una fila con unidad pero sin detalle ni valor cuenta como en blanco', () => {
    expect(formToMeasurementsPayload(form({ measurements: [row({ type: 'glucose', unit: 'mg/dL' })] }))).toEqual([]);
  });
});
