import { apiRequest } from './client';

// Catálogos comunes (T15). Solo lo que usa la interfaz: grupos y patologías se
// pueden dar de alta y editar por API, pero no tienen pantalla en esta tarea.

export function listFoodGroups() {
  return apiRequest('/food-groups');
}

// Arma la URL del listado con los filtros que tienen valor. Sin filtros, el
// backend devuelve solo los alimentos vigentes.
export function foodsPath({ search, groupId, includeInactive } = {}) {
  const params = new URLSearchParams();
  if (search && search.trim()) params.set('search', search.trim());
  if (groupId) params.set('groupId', groupId);
  if (includeInactive) params.set('includeInactive', 'true');

  const query = params.toString();
  return query ? `/foods?${query}` : '/foods';
}

export function listFoods(filters) {
  return apiRequest(foodsPath(filters));
}

export function getFood(id) {
  return apiRequest(`/foods/${id}`);
}

export function createFood(data) {
  return apiRequest('/foods', { method: 'POST', body: data });
}

export function updateFood(id, data) {
  return apiRequest(`/foods/${id}`, { method: 'PUT', body: data });
}
