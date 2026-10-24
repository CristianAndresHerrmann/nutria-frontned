import { apiRequest } from './client';

// Recetas del nutricionista (T21). Ve solo las suyas; no hay borrado: la baja es
// lógica (availableInCatalog = false) y va por la edición.

// Arma la URL del listado con los filtros que tienen valor.
export function recipesPath({ mealType, includeUnavailable } = {}) {
  const params = new URLSearchParams();
  if (mealType) params.set('mealType', mealType);
  if (includeUnavailable) params.set('includeUnavailable', 'true');

  const query = params.toString();
  return query ? `/recipes?${query}` : '/recipes';
}

export function listRecipes(filters) {
  return apiRequest(recipesPath(filters));
}

export function getRecipe(id) {
  return apiRequest(`/recipes/${id}`);
}

export function createRecipe(data) {
  return apiRequest('/recipes', { method: 'POST', body: data });
}

export function updateRecipe(id, data) {
  return apiRequest(`/recipes/${id}`, { method: 'PUT', body: data });
}
