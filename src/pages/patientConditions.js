// Condiciones alimentarias del paciente (T18; RF-04 patologías, RF-07). La
// ficha las muestra agrupadas por tipo, en este orden.
export const CONDITION_TYPES = [
  { value: 'pathology', label: 'Patologías', singular: 'Patología' },
  { value: 'allergy', label: 'Alergias', singular: 'Alergia' },
  { value: 'intolerance', label: 'Intolerancias', singular: 'Intolerancia' },
  { value: 'rejection', label: 'Rechazos', singular: 'Rechazo' },
  { value: 'preference', label: 'Preferencias', singular: 'Preferencia' },
];

// Un bloque por tipo, aunque esté vacío, para que la ficha muestre siempre
// las cinco categorías.
export function groupConditionsByType(conditions) {
  return CONDITION_TYPES.map((type) => ({
    ...type,
    conditions: conditions.filter((condition) => condition.type === type.value),
  }));
}

// Nombre de lo que referencia la condición: la patología, el alimento o el grupo.
export function conditionTargetName(condition) {
  return condition.pathology?.name ?? condition.food?.name ?? condition.foodGroup?.name ?? '';
}

// target: si una condición que no es patología apunta a un alimento o a un
// grupo. foodName acompaña a foodId para mostrar el alimento elegido sin
// volver a buscarlo.
export const EMPTY_CONDITION_FORM = {
  type: 'allergy',
  target: 'food',
  pathologyId: '',
  foodId: '',
  foodName: '',
  foodGroupId: '',
  observations: '',
};

export function conditionToForm(condition) {
  return {
    type: condition.type,
    target: condition.foodGroupId ? 'group' : 'food',
    pathologyId: condition.pathologyId ?? '',
    foodId: condition.foodId ?? '',
    foodName: condition.food?.name ?? '',
    foodGroupId: condition.foodGroupId ?? '',
    observations: condition.observations ?? '',
  };
}

// Manda solo el destino que corresponde al tipo y a lo elegido (alimento o
// grupo): lo que quedó cargado de una opción anterior no viaja. Un destino sin
// elegir se manda vacío y lo rechaza el backend con el error en su campo. La
// fecha de registro no se manda: en el alta la pone el backend y en la edición
// se conserva.
export function formToConditionPayload(form) {
  const payload = { type: form.type, observations: form.observations };

  if (form.type === 'pathology') return { ...payload, pathologyId: form.pathologyId };
  if (form.target === 'group') return { ...payload, foodGroupId: form.foodGroupId };
  return { ...payload, foodId: form.foodId };
}
