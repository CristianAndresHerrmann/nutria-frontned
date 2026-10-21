import { apiRequest } from './client';

// Mediciones y laboratorio del paciente (T20). El backend filtra por el
// nutricionista del token: un paciente ajeno responde 404. Se cargan con la
// consulta (createConsultation); el alta suelta, el PUT y el DELETE existen en
// la API, pero ninguna pantalla los usa todavía.
export function listMeasurements(patientId) {
  return apiRequest(`/patients/${patientId}/measurements`);
}
