import { apiRequest } from './client';

export function listPatients() {
  return apiRequest('/patients');
}

export function getPatient(id) {
  return apiRequest(`/patients/${id}`);
}

export function createPatient(data) {
  return apiRequest('/patients', { method: 'POST', body: data });
}

export function updatePatient(id, data) {
  return apiRequest(`/patients/${id}`, { method: 'PUT', body: data });
}
