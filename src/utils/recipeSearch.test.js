import { describe, expect, it } from 'vitest';
import { filterRecipes } from './recipeSearch';

const recipe = (name, ...foods) => ({ name, ingredients: foods.map((foodName) => ({ food: { name: foodName } })) });

const RECIPES = [
  recipe('Arroz con pollo y verduras', 'Arroz blanco', 'Pechuga de pollo', 'Morrón'),
  recipe('Merluza al horno con papa y zapallo', 'Merluza', 'Papa', 'Limón'),
  recipe('Licuado de banana con leche y avena', 'Leche', 'Banana', 'Avena arrollada'),
];
const names = (recipes) => recipes.map(({ name }) => name);

describe('filterRecipes', () => {
  it('sin búsqueda devuelve todas', () => {
    expect(filterRecipes(RECIPES, '   ')).toBe(RECIPES);
  });

  it('busca en el nombre de la receta, sin distinguir mayúsculas', () => {
    expect(names(filterRecipes(RECIPES, 'MERLUZA'))).toEqual(['Merluza al horno con papa y zapallo']);
  });

  it('busca en los ingredientes', () => {
    expect(names(filterRecipes(RECIPES, 'pechuga'))).toEqual(['Arroz con pollo y verduras']);
  });

  it('no distingue tildes, ni en lo que se escribe ni en los nombres', () => {
    expect(names(filterRecipes(RECIPES, 'limon'))).toEqual(['Merluza al horno con papa y zapallo']);
    expect(names(filterRecipes(RECIPES, 'morron'))).toEqual(['Arroz con pollo y verduras']);
    expect(names(filterRecipes(RECIPES, 'Plátano o banana'))).toEqual([]);
    expect(names(filterRecipes(RECIPES, 'LIMÓN'))).toEqual(['Merluza al horno con papa y zapallo']);
  });

  it('sin coincidencias devuelve una lista vacía', () => {
    expect(filterRecipes(RECIPES, 'sushi')).toEqual([]);
  });
});
