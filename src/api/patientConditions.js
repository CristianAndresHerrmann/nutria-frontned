import { apiRequest } from './client';

// Condiciones alimentarias del paciente (T18): patologías, alergias,
// intolerancias, rechazos y preferencias.

function conditionsPath(patientId) {
  return `/patients/${patientId}/conditions`;
}

export function listConditions(patientId) {
  return apiRequest(conditionsPath(patientId));
}

export function createCondition(patientId, data) {
  return apiRequest(conditionsPath(patientId), { method: 'POST', body: data });
}

export function updateCondition(patientId, conditionId, data) {
  return apiRequest(`${conditionsPath(patientId)}/${conditionId}`, { method: 'PUT', body: data });
}

export function deleteCondition(patientId, conditionId) {
  return apiRequest(`${conditionsPath(patientId)}/${conditionId}`, { method: 'DELETE' });
}
