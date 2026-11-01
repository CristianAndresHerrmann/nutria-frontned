import { apiRequest } from './client';

// Planes del paciente (T39, T40). El backend filtra por el nutricionista del
// token: un paciente ajeno responde 404.
function plansPath(patientId) {
  return `/patients/${patientId}/plans`;
}

// La generación es una sola request que espera a la IA: el backend corta a los
// 30 s (IA_GENERATION_TIMEOUT_MS). El cliente tiene que esperar más que eso;
// con el default de 15 s cortaría antes y un reintento podría duplicar el plan.
export const GENERATE_TIMEOUT_MS = 40_000;

export function listPlans(patientId) {
  return apiRequest(plansPath(patientId));
}

export function getPlan(patientId, planId) {
  return apiRequest(`${plansPath(patientId)}/${planId}`);
}

// Sin body: el backend genera las cuatro comidas.
export function generatePlan(patientId) {
  return apiRequest(`${plansPath(patientId)}/generate`, { method: 'POST', timeoutMs: GENERATE_TIMEOUT_MS });
}

// Reemplazo completo del borrador (T40): el backend lo guarda, lo revalida y
// responde el plan con sus hallazgos nuevos. Los ids de comidas, opciones,
// ítems y hallazgos cambian en cada guardado.
export function updatePlan(patientId, planId, data) {
  return apiRequest(`${plansPath(patientId)}/${planId}`, { method: 'PUT', body: data });
}
