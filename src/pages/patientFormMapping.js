import { isMinorFromDateInput, toDateInputValue } from '../utils/date';
import { CLINICAL_FIELDS } from './patientClinicalFields';

// Un booleano opcional se edita con un select de tres opciones: '' (sin dato),
// 'yes' y 'no'. Así "no cocina" y "no se sabe" no se confunden.
function yesNoToForm(value) {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return '';
}

function yesNoToPayload(value) {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

function clinicalToForm(patient) {
  return Object.fromEntries(
    CLINICAL_FIELDS.map(({ name, kind }) => [name, kind === 'yesNo' ? yesNoToForm(patient[name]) : patient[name] || '']),
  );
}

// Los textos van tal cual: el backend normaliza los vacíos a null. Se mandan
// todos los campos porque el PUT reemplaza el objeto completo.
function clinicalToPayload(form) {
  return Object.fromEntries(
    CLINICAL_FIELDS.map(({ name, kind }) => [name, kind === 'yesNo' ? yesNoToPayload(form[name]) : form[name]]),
  );
}

export const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  birthDate: '',
  phone: '',
  email: '',
  livesWith: '',
  goal: '',
  referenceWeight: '',
  guardianName: '',
  guardianRelationship: '',
  guardianContact: '',
  attendsAccompanied: false,
  ...clinicalToForm({}),
  incomplete: true,
};

export function patientToForm(patient) {
  return {
    firstName: patient.firstName || '',
    lastName: patient.lastName || '',
    birthDate: toDateInputValue(patient.birthDate),
    phone: patient.phone || '',
    email: patient.email || '',
    livesWith: patient.livesWith || '',
    goal: patient.goal || '',
    referenceWeight: patient.referenceWeight === null ? '' : String(patient.referenceWeight),
    guardianName: patient.guardianName || '',
    guardianRelationship: patient.guardianRelationship || '',
    guardianContact: patient.guardianContact || '',
    attendsAccompanied: Boolean(patient.attendsAccompanied),
    ...clinicalToForm(patient),
    incomplete: !patient.registrationComplete,
  };
}

// Si la sección de adulto responsable está oculta (paciente no menor), lo que
// haya quedado tipeado ahí no se manda: la ficha guardada tiene que reflejar
// lo que se ve en el formulario, no datos de una fecha que ya se cambió.
export function formToPayload(form) {
  const isMinor = isMinorFromDateInput(form.birthDate);

  return {
    firstName: form.firstName,
    lastName: form.lastName,
    birthDate: form.birthDate,
    phone: form.phone,
    email: form.email,
    livesWith: form.livesWith,
    goal: form.goal,
    referenceWeight: form.referenceWeight,
    guardianName: isMinor ? form.guardianName : '',
    guardianRelationship: isMinor ? form.guardianRelationship : '',
    guardianContact: isMinor ? form.guardianContact : '',
    attendsAccompanied: isMinor ? form.attendsAccompanied : null,
    ...clinicalToPayload(form),
    registrationComplete: !form.incomplete,
  };
}
