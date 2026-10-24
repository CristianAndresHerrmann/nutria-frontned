export const EMPTY_RECOMMENDATION_FORM = {
  pathologyId: '',
  title: '',
  text: '',
  active: true,
};

export function recommendationToForm(recommendation) {
  return {
    pathologyId: recommendation.pathologyId,
    title: recommendation.title,
    text: recommendation.text,
    active: recommendation.active,
  };
}

// Los vacíos se mandan tal cual: el backend los rechaza con el error en su
// campo. `active` solo existe en la edición: el alta nace vigente.
export function formToPayload(form, { isEditMode = false } = {}) {
  const payload = { pathologyId: form.pathologyId, title: form.title, text: form.text };
  return isEditMode ? { ...payload, active: form.active } : payload;
}

// Agrupa por patología respetando el orden en que llegan (el backend ordena por
// patología y título). Solo aparecen las patologías que tienen recomendaciones.
export function groupByPathology(recommendations) {
  const groups = [];
  const byId = new Map();

  for (const recommendation of recommendations) {
    let group = byId.get(recommendation.pathology.id);
    if (!group) {
      group = { pathology: recommendation.pathology, recommendations: [] };
      byId.set(recommendation.pathology.id, group);
      groups.push(group);
    }
    group.recommendations.push(recommendation);
  }

  return groups;
}
