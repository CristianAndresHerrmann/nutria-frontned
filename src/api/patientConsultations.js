import { apiRequest } from './client';

// Consultas del paciente (T19). El backend filtra por el nutricionista del
// token: un paciente ajeno responde 404. El GET y el PUT de una consulta
// existen en la API, pero ninguna pantalla los usa todavía.
function consultationsPath(patientId) {
  return `/patients/${patientId}/consultations`;
}

export function listConsultations(patientId) {
  return apiRequest(consultationsPath(patientId));
}

export function createConsultation(patientId, data) {
  return apiRequest(consultationsPath(patientId), { method: 'POST', body: data });
}
