import { apiRequest } from './client';

// Catálogos (T15). El nutricionista ve los alimentos comunes y los suyos, y da de
// alta alimentos privados; no edita nada del catálogo.

export function listFoodGroups() {
  return apiRequest('/food-groups');
}

export function listPathologies() {
  return apiRequest('/pathologies');
}

// Arma la URL del listado con los filtros que tienen valor.
export function foodsPath({ search, groupId } = {}) {
  const params = new URLSearchParams();
  if (search && search.trim()) params.set('search', search.trim());
  if (groupId) params.set('groupId', groupId);

  const query = params.toString();
  return query ? `/foods?${query}` : '/foods';
}

export function listFoods(filters) {
  return apiRequest(foodsPath(filters));
}

export function createFood(data) {
  return apiRequest('/foods', { method: 'POST', body: data });
}
