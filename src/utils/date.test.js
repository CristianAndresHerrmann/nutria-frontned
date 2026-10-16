import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  completeDateValueError,
  dateTextToValue,
  dateValueError,
  displayToIso,
  formatDate,
  isoToDisplay,
  isoToLocalDate,
  localDateToIso,
  maskDateText,
  todayInputValue,
  valueToDateText,
} from './date';

// Los corrimientos de un día solo aparecen con un huso negativo, así que los
// tests corren en hora de Argentina (UTC-3), como el usuario real.
const originalTz = process.env.TZ;

beforeAll(() => {
  process.env.TZ = 'America/Argentina/Buenos_Aires';
});

afterAll(() => {
  process.env.TZ = originalTz;
});

describe('displayToIso', () => {
  it('convierte DD/MM/AAAA a AAAA-MM-DD', () => {
    expect(displayToIso('14/03/1992')).toBe('1992-03-14');
  });

  it.each(['30/02/2023', '29/02/2023', '31/04/2023', '10/13/2023', '00/01/2023', '10/00/2023'])(
    'devuelve null para la fecha inexistente %s',
    (text) => {
      expect(displayToIso(text)).toBeNull();
    },
  );

  it.each(['29/02/2024', '29/02/2000'])('acepta el 29 de febrero de un año bisiesto (%s)', (text) => {
    expect(displayToIso(text)).not.toBeNull();
  });

  it.each(['', '14/03', '14/03/92', '1992-03-14', 'ab/cd/efgh', undefined])('devuelve null para %j', (text) => {
    expect(displayToIso(text)).toBeNull();
  });
});

describe('maskDateText', () => {
  it.each([
    ['1', '1'],
    ['14', '14'],
    ['143', '14/3'],
    ['1403', '14/03'],
    ['14031', '14/03/1'],
    ['14031992', '14/03/1992'],
    ['140319921', '14/03/1992'],
    ['14/03/1992', '14/03/1992'],
    ['14-03.19a92', '14/03/1992'],
    ['14/', '14'],
  ])('%j → %j', (raw, expected) => {
    expect(maskDateText(raw)).toBe(expected);
  });
});

describe('dateTextToValue / valueToDateText', () => {
  it('vacío sube vacío', () => {
    expect(dateTextToValue('')).toBe('');
    expect(valueToDateText('')).toBe('');
  });

  it('una fecha válida sube en formato de la API y vuelve igual', () => {
    expect(dateTextToValue('14/03/1992')).toBe('1992-03-14');
    expect(valueToDateText('1992-03-14')).toBe('14/03/1992');
  });

  it('una fecha inexistente sube igual (nunca como vacía), para que dateValueError la frene', () => {
    expect(dateTextToValue('30/02/2023')).toBe('2023-02-30');
    expect(valueToDateText('2023-02-30')).toBe('30/02/2023');
  });

  it('una fecha incompleta sube tal cual, nunca como vacía', () => {
    expect(dateTextToValue('14/03')).toBe('14/03');
    expect(valueToDateText('14/03')).toBe('14/03');
  });
});

describe('dateValueError', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('vacío o una fecha válida se pueden guardar', () => {
    expect(dateValueError('')).toBeNull();
    expect(dateValueError('1992-03-14', { max: '2026-10-16' })).toBeNull();
  });

  it.each(['2023-02-30', '2023-02-29', '2023-04-31', '2023-13-01'])('frena la fecha inexistente %s', (value) => {
    expect(dateValueError(value)).toBe('Esa fecha no existe');
  });

  it('frena una fecha incompleta', () => {
    expect(dateValueError('14/03')).toBe('Completá la fecha con el formato DD/MM/AAAA');
  });

  it('frena una fecha futura cuando el tope es hoy', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-16T15:00:00.000Z'));

    expect(dateValueError('2026-10-17', { max: '2026-10-16' })).toBe('La fecha no puede ser futura');
    expect(dateValueError('2026-10-16', { max: '2026-10-16' })).toBeNull();
  });

  it('frena una fecha fuera de un rango cualquiera', () => {
    expect(dateValueError('2026-12-01', { max: '2026-11-30' })).toBe('La fecha no puede ser posterior al 30/11/2026');
    expect(dateValueError('2019-12-31', { min: '2020-01-01' })).toBe('La fecha no puede ser anterior al 01/01/2020');
  });
});

describe('completeDateValueError', () => {
  it('no advierte mientras la fecha está a medio escribir', () => {
    expect(completeDateValueError('14/0')).toBeNull();
    expect(completeDateValueError('')).toBeNull();
  });

  it('advierte apenas se completa una fecha inexistente', () => {
    expect(completeDateValueError('2023-02-30')).toBe('Esa fecha no existe');
  });
});

describe('puente con el calendario', () => {
  it('ida y vuelta sin correr el día en UTC-3', () => {
    const date = isoToLocalDate('1992-03-14');

    expect(date.getDate()).toBe(14);
    expect(localDateToIso(date)).toBe('1992-03-14');
  });

  it('sin valor no hay día seleccionado', () => {
    expect(isoToLocalDate('')).toBeUndefined();
  });
});

describe('isoToDisplay / formatDate', () => {
  it('muestra DD/MM/AAAA', () => {
    expect(isoToDisplay('1992-03-14')).toBe('14/03/1992');
  });

  it('formatea el ISO de la API sin correr el día', () => {
    expect(formatDate('1992-03-14T00:00:00.000Z')).toBe('14/03/1992');
    expect(formatDate(null)).toBe('Sin dato');
  });
});

describe('todayInputValue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('usa la fecha local: a las 22 en Argentina sigue siendo hoy, aunque en UTC ya sea mañana', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-17T01:00:00.000Z'));

    expect(todayInputValue()).toBe('2026-10-16');
  });
});
