import { apiRequest } from './client';

// Recetas comunes y propias (T21, T30). La baja lógica de una propia puede
// hacerse por PATCH desde el listado o junto con la edición completa por PUT.

// Arma la URL del listado con los filtros que tienen valor. Con `patientId`, el
// backend excluye las recetas con ingredientes restringidos por las condiciones
// del paciente (RF-28).
export function recipesPath({ mealType, includeUnavailable, patientId } = {}) {
  const params = new URLSearchParams();
  if (mealType) params.set('mealType', mealType);
  if (includeUnavailable) params.set('includeUnavailable', 'true');
  if (patientId) params.set('patientId', patientId);

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

export function setRecipeAvailability(id, availableInCatalog) {
  return apiRequest(`/recipes/${id}`, { method: 'PATCH', body: { availableInCatalog } });
}
