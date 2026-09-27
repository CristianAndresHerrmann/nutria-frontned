import { describe, expect, it } from 'vitest';
import { formToPayload, patientToForm } from './patientFormMapping';

function baseForm(overrides = {}) {
  return {
    firstName: 'Tomás',
    lastName: 'Gómez',
    birthDate: '',
    phone: '',
    email: '',
    livesWith: '',
    goal: '',
    referenceWeight: '',
    guardianName: 'María Gómez',
    guardianRelationship: 'Madre',
    guardianContact: '+54 342 555-0202',
    attendsAccompanied: true,
    incomplete: true,
    ...overrides,
  };
}

describe('formToPayload', () => {
  it('manda los datos del adulto responsable tal cual cuando el paciente es menor', () => {
    const payload = formToPayload(baseForm({ birthDate: '2015-01-01' }));

    expect(payload.guardianName).toBe('María Gómez');
    expect(payload.guardianRelationship).toBe('Madre');
    expect(payload.guardianContact).toBe('+54 342 555-0202');
    expect(payload.attendsAccompanied).toBe(true);
  });

  // La sección de adulto responsable se oculta para un paciente adulto, así
  // que lo que haya quedado tipeado ahí (de cuando la fecha era de un menor)
  // no se manda: la ficha guardada tiene que reflejar lo que se ve.
  it('no manda los datos del adulto responsable cuando el paciente no es menor, aunque estén cargados', () => {
    const payload = formToPayload(baseForm({ birthDate: '1990-01-01' }));

    expect(payload.guardianName).toBe('');
    expect(payload.guardianRelationship).toBe('');
    expect(payload.guardianContact).toBe('');
    expect(payload.attendsAccompanied).toBeNull();
  });

  it('tampoco los manda cuando no hay fecha de nacimiento cargada', () => {
    const payload = formToPayload(baseForm({ birthDate: '' }));

    expect(payload.guardianName).toBe('');
    expect(payload.attendsAccompanied).toBeNull();
  });

  it('invierte "incomplete" en "registrationComplete"', () => {
    expect(formToPayload(baseForm({ incomplete: true })).registrationComplete).toBe(false);
    expect(formToPayload(baseForm({ incomplete: false })).registrationComplete).toBe(true);
  });
});

describe('patientToForm', () => {
  it('convierte un paciente sin datos opcionales a strings vacíos', () => {
    const form = patientToForm({
      firstName: 'Ana',
      lastName: 'Diaz',
      birthDate: null,
      phone: null,
      email: null,
      livesWith: null,
      goal: null,
      referenceWeight: null,
      guardianName: null,
      guardianRelationship: null,
      guardianContact: null,
      attendsAccompanied: null,
      registrationComplete: false,
    });

    expect(form.birthDate).toBe('');
    expect(form.referenceWeight).toBe('');
    expect(form.incomplete).toBe(true);
  });

  it('recorta la hora de birthDate para el input date', () => {
    const form = patientToForm({ firstName: 'Ana', lastName: 'Diaz', birthDate: '1992-03-14T00:00:00.000Z' });

    expect(form.birthDate).toBe('1992-03-14');
  });
});
