import { isMinorFromDateInput, toDateInputValue } from '../utils/date';

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
    registrationComplete: !form.incomplete,
  };
}
