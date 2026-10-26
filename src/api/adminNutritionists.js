import { apiRequest } from './client';

// Cuentas de nutricionista, desde el panel del administrador (T31).

export function listNutritionists() {
  return apiRequest('/admin/nutritionists');
}

export function createNutritionist(data) {
  return apiRequest('/admin/nutritionists', { method: 'POST', body: data });
}

export function setNutritionistActive(id, active) {
  return apiRequest(`/admin/nutritionists/${id}`, { method: 'PATCH', body: { active } });
}

export function resetNutritionistPassword(id, password) {
  return apiRequest(`/admin/nutritionists/${id}/password`, { method: 'PUT', body: { password } });
}
