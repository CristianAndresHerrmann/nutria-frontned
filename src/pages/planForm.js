// Edición del borrador del plan (T40; RF-40, RF-46). El formulario guarda lo
// que muestra la pantalla; al backend solo viaja la referencia de cada ítem: la
// copia del catálogo (nombres, categorías) la arma él.

// Mismos topes que updatePlanSchema del backend: con maxLength en los inputs,
// un texto largo no llega como error de Zod sin ubicación.
export const PLAN_TEXT_MAX_LENGTH = 4000;
export const SHORT_TEXT_MAX_LENGTH = 500;
export const MAX_OPTIONS = 10;
export const MAX_ITEMS = 15;

// Los siete textos del plan. El PUT es un reemplazo completo y guarda como null
// un texto omitido: se mandan siempre todos, aunque no estén a la vista.
export const PLAN_TEXT_FIELDS = [
  'situationalDiagnosis',
  'introduction',
  'objectives',
  'generalRecommendations',
  'contextualRecommendations',
  'clinicalRecommendations',
  'thematicRecommendations',
];

// Cada opción e ítem lleva una key propia para que React no confunda las filas
// al quitar o reemplazar. `id` es el del servidor: ubica los hallazgos de la
// última versión guardada, y un ítem nuevo no lo tiene hasta guardar.
let nextKey = 0;

function newKey() {
  nextKey += 1;
  return nextKey;
}

const EMPTY_ITEM = {
  id: null,
  foodId: null,
  foodName: null,
  foodGroupId: null,
  foodGroupName: null,
  recipeId: null,
  recipe: null,
  originalText: null,
};

function itemRow(fields) {
  return { ...EMPTY_ITEM, ...fields, key: newKey() };
}

export function itemFromFood(food) {
  return itemRow({ type: 'food', foodId: food.id, foodName: food.name });
}

export function itemFromGroup(group) {
  return itemRow({ type: 'food_group', foodGroupId: group.id, foodGroupName: group.name });
}

export function itemFromRecipe(recipe) {
  return itemRow({
    type: 'recipe',
    recipeId: recipe.id,
    recipe: { id: recipe.id, name: recipe.name, availableInCatalog: recipe.availableInCatalog },
  });
}

function optionRow(option) {
  return {
    key: newKey(),
    id: option.id,
    description: option.description ?? '',
    items: option.items.map((item) =>
      itemRow({
        id: item.id,
        type: item.type,
        foodId: item.foodId,
        foodName: item.foodName,
        foodGroupId: item.foodGroupId,
        foodGroupName: item.foodGroupName,
        recipeId: item.recipeId,
        recipe: item.recipe,
        originalText: item.originalText,
      }),
    ),
  };
}

export function planToForm(plan) {
  return {
    texts: Object.fromEntries(PLAN_TEXT_FIELDS.map((name) => [name, plan[name] ?? ''])),
    meals: plan.meals.map((meal) => ({
      mealType: meal.mealType,
      instructions: meal.instructions ?? '',
      options: meal.options.map(optionRow),
    })),
  };
}

function itemReference(item) {
  switch (item.type) {
    case 'food':
      return { type: 'food', foodId: item.foodId };
    case 'food_group':
      return { type: 'food_group', foodGroupId: item.foodGroupId };
    case 'recipe':
      return { type: 'recipe', recipeId: item.recipeId };
    default:
      return { type: 'unrecognized', originalText: item.originalText };
  }
}

// Comidas, opciones e ítems en el orden de la pantalla: el backend numera por
// posición. Los textos vacíos los normaliza el backend a null.
export function formToPayload(form) {
  return {
    ...Object.fromEntries(PLAN_TEXT_FIELDS.map((name) => [name, form.texts[name]])),
    meals: form.meals.map((meal) => ({
      mealType: meal.mealType,
      instructions: meal.instructions,
      options: meal.options.map((option) => ({
        description: option.description,
        items: option.items.map(itemReference),
      })),
    })),
  };
}

// true si los dos formularios mandarían lo mismo al backend.
export function sameContent(a, b) {
  return JSON.stringify(formToPayload(a)) === JSON.stringify(formToPayload(b));
}

export function setText(form, name, value) {
  return { ...form, texts: { ...form.texts, [name]: value } };
}

// Cambios dentro de una comida (una por tipo) y de una de sus opciones.
function updateMeal(form, mealType, change) {
  return { ...form, meals: form.meals.map((meal) => (meal.mealType === mealType ? change(meal) : meal)) };
}

function updateOption(form, mealType, optionKey, change) {
  return updateMeal(form, mealType, (meal) => ({
    ...meal,
    options: meal.options.map((option) => (option.key === optionKey ? change(option) : option)),
  }));
}

export function setInstructions(form, mealType, value) {
  return updateMeal(form, mealType, (meal) => ({ ...meal, instructions: value }));
}

export function setOptionDescription(form, mealType, optionKey, value) {
  return updateOption(form, mealType, optionKey, (option) => ({ ...option, description: value }));
}

// Una opción nueva empieza vacía: el guardado parcial la acepta y la composición
// incompleta queda como advertencia.
export function addOption(form, mealType) {
  return updateMeal(form, mealType, (meal) =>
    meal.options.length >= MAX_OPTIONS
      ? meal
      : { ...meal, options: [...meal.options, { key: newKey(), id: null, description: '', items: [] }] },
  );
}

export function removeOption(form, mealType, optionKey) {
  return updateMeal(form, mealType, (meal) => ({
    ...meal,
    options: meal.options.filter((option) => option.key !== optionKey),
  }));
}

export function addItem(form, mealType, optionKey, item) {
  return updateOption(form, mealType, optionKey, (option) =>
    option.items.length >= MAX_ITEMS ? option : { ...option, items: [...option.items, item] },
  );
}

// El ítem nuevo ocupa la posición del reemplazado.
export function replaceItem(form, mealType, optionKey, itemKey, item) {
  return updateOption(form, mealType, optionKey, (option) => ({
    ...option,
    items: option.items.map((current) => (current.key === itemKey ? item : current)),
  }));
}

export function removeItem(form, mealType, optionKey, itemKey) {
  return updateOption(form, mealType, optionKey, (option) => ({
    ...option,
    items: option.items.filter((item) => item.key !== itemKey),
  }));
}
