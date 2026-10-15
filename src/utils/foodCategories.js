// Categorías nutricionales de un alimento (RF-25). Los valores son los del enum
// del backend; el orden es el que se muestra en el formulario.
export const FOOD_CATEGORIES = [
  { value: 'protein', label: 'Proteína' },
  { value: 'carbohydrate', label: 'Hidrato' },
  { value: 'vegetable', label: 'Verdura' },
  { value: 'fiber', label: 'Fibra' },
  { value: 'healthy_fat', label: 'Grasa saludable' },
  { value: 'infusion', label: 'Infusión' },
];

const LABELS = Object.fromEntries(FOOD_CATEGORIES.map(({ value, label }) => [value, label]));

export function categoryLabel(value) {
  return LABELS[value] || value;
}
