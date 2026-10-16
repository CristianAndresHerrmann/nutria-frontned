import { describe, expect, it } from 'vitest';
import { EMPTY_FORM, formToPayload, patientToForm } from './patientFormMapping';

function baseForm(overrides = {}) {
  return {
    ...EMPTY_FORM,
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

describe('datos clínicos (T16)', () => {
  it('un paciente sin datos clínicos da campos vacíos y sí/no en "sin dato"', () => {
    const form = patientToForm({ firstName: 'Ana', lastName: 'Diaz', medicalHistory: null, cooks: null });

    expect(form.medicalHistory).toBe('');
    expect(form.workContext).toBe('');
    expect(form.cooks).toBe('');
    expect(form.likesCooking).toBe('');
  });

  it('carga los datos clínicos guardados en el formulario', () => {
    const form = patientToForm({
      firstName: 'Ana',
      lastName: 'Diaz',
      medication: 'Levotiroxina 50 mcg',
      cooks: true,
      likesCooking: false,
    });

    expect(form.medication).toBe('Levotiroxina 50 mcg');
    expect(form.cooks).toBe('yes');
    expect(form.likesCooking).toBe('no');
  });

  it('convierte los sí/no del formulario en true, false o null', () => {
    expect(formToPayload(baseForm({ cooks: 'yes' })).cooks).toBe(true);
    expect(formToPayload(baseForm({ cooks: 'no' })).cooks).toBe(false);
    expect(formToPayload(baseForm({ cooks: '' })).cooks).toBeNull();
  });

  // El PUT reemplaza el objeto completo: si el formulario omitiera un campo
  // clínico, el backend lo guardaría como null y se perdería lo ya cargado.
  it('manda todos los campos clínicos, también los vacíos', () => {
    const payload = formToPayload(baseForm({ smoking: 'No fuma' }));

    expect(payload.smoking).toBe('No fuma');
    expect(payload).toHaveProperty('medicalHistory', '');
    expect(payload).toHaveProperty('likesCooking', null);
  });

  it('un paciente guardado vuelve igual tras pasar por el formulario', () => {
    const saved = {
      medicalHistory: 'Hipotiroidismo familiar',
      medication: '',
      smoking: 'No fuma',
      intakePatterns: 'Picoteo por la tarde',
      cooks: false,
      likesCooking: true,
    };

    const payload = formToPayload(patientToForm({ firstName: 'Ana', lastName: 'Diaz', ...saved }));

    expect(payload).toMatchObject(saved);
  });
});
