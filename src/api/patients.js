import { apiFetch } from './client';

async function parseOrThrow(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'No se pudo completar la operación');
    if (data.fields) error.fields = data.fields;
    throw error;
  }

  return data;
}

export async function listPatients() {
  const response = await apiFetch('/patients');
  return parseOrThrow(response);
}

export async function getPatient(id) {
  const response = await apiFetch(`/patients/${id}`);
  return parseOrThrow(response);
}

export async function createPatient(data) {
  const response = await apiFetch('/patients', { method: 'POST', body: JSON.stringify(data) });
  return parseOrThrow(response);
}

export async function updatePatient(id, data) {
  const response = await apiFetch(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  return parseOrThrow(response);
}
