import { describe, expect, it } from 'vitest';
import {
  EMPTY_RECIPE_FORM,
  addIngredient,
  formToPayload,
  moveIngredient,
  newIngredientRow,
  recipeToForm,
  toggleMealType,
} from './recipeFormMapping';
import { recipesPath } from '../api/recipes';

const arroz = { id: 'arroz', name: 'Arroz blanco', active: true };
const atun = { id: 'atun', name: 'Atún al natural', active: true };
const tomate = { id: 'tomate', name: 'Tomate', active: false };

const recipe = {
  id: 'r-1',
  name: 'Ensalada de arroz y atún',
  preparation: '1. Hervir el arroz.',
  finalNote: null,
  cookingMethod: 'stovetop',
  timeMinutes: 25,
  purchasePlace: null,
  origin: 'professional',
  availableInCatalog: true,
  mealTypes: ['lunch', 'dinner'],
  ingredients: [
    { order: 1, quantityDescription: '1 taza cocida', food: arroz },
    { order: 2, quantityDescription: null, food: atun },
  ],
};

describe('recipeToForm / formToPayload', () => {
  it('ida y vuelta: los null pasan a vacío en el formulario y los ingredientes conservan su orden', () => {
    const form = recipeToForm(recipe);

    expect(form).toMatchObject({ finalNote: '', purchasePlace: '', timeMinutes: '25', cookingMethod: 'stovetop' });
    expect(form.ingredients.map(({ food, quantityDescription }) => [food.id, quantityDescription])).toEqual([
      ['arroz', '1 taza cocida'],
      ['atun', ''],
    ]);

    expect(formToPayload(form, { isEditMode: true })).toEqual({
      name: 'Ensalada de arroz y atún',
      cookingMethod: 'stovetop',
      timeMinutes: 25,
      purchasePlace: '',
      mealTypes: ['lunch', 'dinner'],
      ingredients: [
        { foodId: 'arroz', quantityDescription: '1 taza cocida' },
        { foodId: 'atun', quantityDescription: '' },
      ],
      preparation: '1. Hervir el arroz.',
      finalNote: '',
      availableInCatalog: true,
    });
  });

  it('el alta no manda availableInCatalog: la receta nace disponible', () => {
    expect(formToPayload(EMPTY_RECIPE_FORM)).not.toHaveProperty('availableInCatalog');
  });

  it('manda los tipos de comida en el orden del formulario y no en el que se marcaron', () => {
    const payload = formToPayload({ ...EMPTY_RECIPE_FORM, mealTypes: ['dinner', 'breakfast'] });

    expect(payload.mealTypes).toEqual(['breakfast', 'dinner']);
  });

  it('no inventa datos: vacío es null en método y tiempo, y lo que no es número llega al backend tal cual', () => {
    expect(formToPayload(EMPTY_RECIPE_FORM)).toMatchObject({ cookingMethod: null, timeMinutes: null, mealTypes: [], ingredients: [] });
    expect(formToPayload({ ...EMPTY_RECIPE_FORM, timeMinutes: ' 40 ' }).timeMinutes).toBe(40);
    expect(formToPayload({ ...EMPTY_RECIPE_FORM, timeMinutes: 'media hora' }).timeMinutes).toBe('media hora');
  });
});

describe('ingredientes', () => {
  it('agrega un alimento al final y no lo repite', () => {
    const rows = addIngredient(addIngredient([], arroz), atun);

    expect(rows.map(({ food }) => food.id)).toEqual(['arroz', 'atun']);
    expect(addIngredient(rows, arroz)).toBe(rows);
  });

  it('mueve una fila hacia arriba o abajo, sin salirse de la lista', () => {
    const rows = [newIngredientRow(arroz), newIngredientRow(atun), newIngredientRow(tomate)];
    const ids = (list) => list.map(({ food }) => food.id);

    expect(ids(moveIngredient(rows, rows[2].key, -1))).toEqual(['arroz', 'tomate', 'atun']);
    expect(ids(moveIngredient(rows, rows[0].key, 1))).toEqual(['atun', 'arroz', 'tomate']);
    expect(moveIngredient(rows, rows[0].key, -1)).toBe(rows);
    expect(moveIngredient(rows, rows[2].key, 1)).toBe(rows);
  });

  it('da una key distinta a cada fila', () => {
    expect(newIngredientRow(arroz).key).not.toBe(newIngredientRow(arroz).key);
  });
});

describe('toggleMealType', () => {
  it('marca y desmarca sin repetir', () => {
    expect(toggleMealType(['lunch'], 'dinner', true)).toEqual(['lunch', 'dinner']);
    expect(toggleMealType(['lunch', 'dinner'], 'lunch', true)).toEqual(['dinner', 'lunch']);
    expect(toggleMealType(['lunch', 'dinner'], 'lunch', false)).toEqual(['dinner']);
  });
});

describe('recipesPath', () => {
  it('sin filtros pide las disponibles', () => {
    expect(recipesPath()).toBe('/recipes');
    expect(recipesPath({ mealType: '', includeUnavailable: false })).toBe('/recipes');
  });

  it('agrega solo los filtros con valor', () => {
    expect(recipesPath({ mealType: 'lunch', includeUnavailable: true })).toBe('/recipes?mealType=lunch&includeUnavailable=true');
  });
});
