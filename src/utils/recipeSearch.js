// Búsqueda de recetas en el cliente (DA-33: el listado ya llega completo). Busca
// en el nombre de la receta y en los de sus ingredientes ("pollo" encuentra el
// arroz con pollo), sin distinguir mayúsculas ni tildes.
export function normalizeSearch(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function filterRecipes(recipes, search) {
  const term = normalizeSearch(search);
  if (!term) return recipes;

  return recipes.filter(
    (recipe) =>
      normalizeSearch(recipe.name).includes(term) ||
      recipe.ingredients.some(({ food }) => normalizeSearch(food.name).includes(term)),
  );
}
