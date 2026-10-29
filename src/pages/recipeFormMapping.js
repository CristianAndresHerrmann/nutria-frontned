import { MEAL_TYPES } from '../utils/recipeLabels';

export const EMPTY_RECIPE_FORM = {
  name: '',
  cookingMethod: '',
  timeMinutes: '',
  purchasePlace: '',
  mealTypes: [],
  ingredients: [],
  preparation: '',
  finalNote: '',
  availableInCatalog: true,
};

// Cada fila de ingrediente lleva una key propia para que React no confunda los
// inputs al quitar o mover una fila. `food` es { id, name, active }: el nombre
// se muestra y el id es lo único que viaja.
let nextIngredientKey = 0;

export function newIngredientRow(food, quantityDescription = '') {
  nextIngredientKey += 1;
  return { key: nextIngredientKey, food, quantityDescription };
}

// Un alimento va una sola vez en la receta: si ya está, no se agrega de nuevo.
export function addIngredient(rows, food) {
  if (rows.some((row) => row.food.id === food.id)) return rows;
  return [...rows, newIngredientRow({ id: food.id, name: food.name, active: food.active })];
}

// Mueve una fila hacia arriba (-1) o hacia abajo (+1). En el borde no hace nada.
export function moveIngredient(rows, key, offset) {
  const from = rows.findIndex((row) => row.key === key);
  const to = from + offset;
  if (from === -1 || to < 0 || to >= rows.length) return rows;

  const moved = [...rows];
  [moved[from], moved[to]] = [moved[to], moved[from]];
  return moved;
}

// Marca o desmarca un tipo de comida sin repetirlo.
export function toggleMealType(mealTypes, value, checked) {
  const without = mealTypes.filter((mealType) => mealType !== value);
  return checked ? [...without, value] : without;
}

export function recipeToForm(recipe) {
  return {
    name: recipe.name,
    cookingMethod: recipe.cookingMethod ?? '',
    timeMinutes: recipe.timeMinutes === null || recipe.timeMinutes === undefined ? '' : String(recipe.timeMinutes),
    purchasePlace: recipe.purchasePlace ?? '',
    mealTypes: recipe.mealTypes,
    ingredients: recipe.ingredients.map(({ food, quantityDescription }) => newIngredientRow(food, quantityDescription ?? '')),
    preparation: recipe.preparation ?? '',
    finalNote: recipe.finalNote ?? '',
    availableInCatalog: recipe.availableInCatalog,
  };
}

// Copia de una receta, común o propia, como borrador de una receta nueva: el
// alta la guarda como propia y la original no cambia. El nombre se marca como
// copia para no confundirla con la original en el listado.
export function recipeToDraft(recipe) {
  return { ...recipeToForm(recipe), name: `${recipe.name} (copia)`, availableInCatalog: true };
}

// Body del PUT para dar de baja o reactivar una receta desde el listado. El PUT
// reemplaza la receta entera: se arma con el mismo mapeo que el formulario de
// edición, para no pisar ningún campo.
export function availabilityPayload(recipe, available) {
  return { ...formToPayload(recipeToForm(recipe), { isEditMode: true }), availableInCatalog: available };
}

// Un número si se escribió uno; vacío es null. Lo que no sea un número se manda
// igual y lo rechaza el backend con el error en su campo.
function minutesToPayload(value) {
  const trimmed = String(value).trim();
  if (trimmed === '') return null;
  const minutes = Number(trimmed);
  return Number.isFinite(minutes) ? minutes : trimmed;
}

// Los tipos salen en el orden del formulario, no en el que se marcaron, y los
// ingredientes en el orden de la lista: el backend numera por posición. El PUT
// reemplaza la receta entera, así que se mandan todos los campos; los vacíos los
// normaliza el backend a null. `availableInCatalog` solo existe en la edición.
export function formToPayload(form, { isEditMode = false } = {}) {
  const payload = {
    name: form.name,
    cookingMethod: form.cookingMethod || null,
    timeMinutes: minutesToPayload(form.timeMinutes),
    purchasePlace: form.purchasePlace,
    mealTypes: MEAL_TYPES.map(({ value }) => value).filter((value) => form.mealTypes.includes(value)),
    ingredients: form.ingredients.map(({ food, quantityDescription }) => ({ foodId: food.id, quantityDescription })),
    preparation: form.preparation,
    finalNote: form.finalNote,
  };

  return isEditMode ? { ...payload, availableInCatalog: form.availableInCatalog } : payload;
}
