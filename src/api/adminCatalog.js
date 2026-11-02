import { apiRequest } from './client';

// Catálogo desde el panel del administrador (T25): alimentos comunes y privados de
// todos, grupos, patologías y la actividad del catálogo. Nada de pacientes.

export function listAdminFoodGroups() {
  return apiRequest('/admin/food-groups');
}

export function createFoodGroup(data) {
  return apiRequest('/admin/food-groups', { method: 'POST', body: data });
}

export function updateFoodGroup(id, data) {
  return apiRequest(`/admin/food-groups/${id}`, { method: 'PUT', body: data });
}

export function listAdminPathologies() {
  return apiRequest('/admin/pathologies');
}

export function createPathology(data) {
  return apiRequest('/admin/pathologies', { method: 'POST', body: data });
}

export function updatePathology(id, data) {
  return apiRequest(`/admin/pathologies/${id}`, { method: 'PUT', body: data });
}

// owner: 'common' o el id de un nutricionista. Solo viajan los filtros con valor.
export function adminFoodsPath({ owner, search, groupId } = {}) {
  const params = new URLSearchParams();
  if (owner) params.set('owner', owner);
  if (search && search.trim()) params.set('search', search.trim());
  if (groupId) params.set('groupId', groupId);

  const query = params.toString();
  return query ? `/admin/foods?${query}` : '/admin/foods';
}

export function listAdminFoods(filters) {
  return apiRequest(adminFoodsPath(filters));
}

export function getAdminFood(id) {
  return apiRequest(`/admin/foods/${id}`);
}

export function createCommonFood(data) {
  return apiRequest('/admin/foods', { method: 'POST', body: data });
}

export function updateAdminFood(id, data) {
  return apiRequest(`/admin/foods/${id}`, { method: 'PUT', body: data });
}

// Sin name conserva el nombre que tenía.
export function promoteFood(id, name) {
  return apiRequest(`/admin/foods/${id}/promote`, { method: 'POST', body: name ? { name } : {} });
}

export function listCatalogActivity(nutritionistId) {
  return apiRequest(nutritionistId ? `/admin/catalog-activity?nutritionistId=${nutritionistId}` : '/admin/catalog-activity');
}
