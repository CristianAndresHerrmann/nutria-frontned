// Tipos de comida y métodos de cocción de una receta (RF-27). Los valores son
// los del enum del backend; el orden es el que se muestra en pantalla.
export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Desayuno' },
  { value: 'lunch', label: 'Almuerzo' },
  { value: 'afternoon_snack', label: 'Merienda' },
  { value: 'dinner', label: 'Cena' },
];

export const COOKING_METHODS = [
  { value: 'oven', label: 'Horno' },
  { value: 'stovetop', label: 'Hornalla' },
  { value: 'microwave', label: 'Microondas' },
  { value: 'no_cooking', label: 'Sin cocción' },
];

const MEAL_TYPE_LABELS = Object.fromEntries(MEAL_TYPES.map(({ value, label }) => [value, label]));
const COOKING_METHOD_LABELS = Object.fromEntries(COOKING_METHODS.map(({ value, label }) => [value, label]));

export function mealTypeLabel(value) {
  return MEAL_TYPE_LABELS[value] || value;
}

export function cookingMethodLabel(value) {
  return COOKING_METHOD_LABELS[value] || value;
}
