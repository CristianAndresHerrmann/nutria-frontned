import { apiRequest } from './client';

// Recomendaciones clínicas por patología (T22; RF-30). El nutricionista ve las
// comunes (solo lectura) y las suyas; no hay borrado: la baja es lógica
// (active = false) y va por la edición.

// Arma la URL del listado con los filtros que tienen valor.
export function recommendationsPath({ pathologyId, includeInactive } = {}) {
  const params = new URLSearchParams();
  if (pathologyId) params.set('pathologyId', pathologyId);
  if (includeInactive) params.set('includeInactive', 'true');

  const query = params.toString();
  return query ? `/clinical-recommendations?${query}` : '/clinical-recommendations';
}

export function listRecommendations(filters) {
  return apiRequest(recommendationsPath(filters));
}

export function getRecommendation(id) {
  return apiRequest(`/clinical-recommendations/${id}`);
}

export function createRecommendation(data) {
  return apiRequest('/clinical-recommendations', { method: 'POST', body: data });
}

export function updateRecommendation(id, data) {
  return apiRequest(`/clinical-recommendations/${id}`, { method: 'PUT', body: data });
}
