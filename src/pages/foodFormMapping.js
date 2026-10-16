import { FOOD_CATEGORIES } from '../utils/foodCategories';

export const EMPTY_FOOD_FORM = {
  name: '',
  foodGroupId: '',
  categories: [],
};

// Marca o desmarca una categoría sin repetirla.
export function toggleCategory(categories, value, checked) {
  const without = categories.filter((category) => category !== value);
  return checked ? [...without, value] : without;
}

// Las categorías salen en el orden del formulario, no en el que se marcaron. Lo
// que falte (grupo, categorías) se manda igual: la validación es del backend, que
// responde con el error de cada campo.
export function formToPayload(form) {
  return {
    name: form.name,
    foodGroupId: form.foodGroupId,
    categories: FOOD_CATEGORIES.map(({ value }) => value).filter((value) => form.categories.includes(value)),
  };
}
