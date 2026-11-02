import { describe, expect, it } from 'vitest';
import {
  MAX_ITEMS,
  MAX_OPTIONS,
  addItem,
  addOption,
  formToPayload,
  itemFromFood,
  itemFromGroup,
  itemFromRecipe,
  planToForm,
  removeItem,
  removeOption,
  replaceItem,
  sameContent,
  setInstructions,
  setOptionDescription,
  setText,
} from './planForm';

const item = (id, fields) => ({
  id, optionId: 'o1', order: 1, foodId: null, foodName: null, foodCategories: [], foodGroupId: null,
  foodGroupName: null, recipeId: null, recipe: null, originalText: null, ...fields,
});

// Plan con la forma de la API, sin textos de introducción ni recomendaciones
// clínicas cargadas.
const plan = {
  id: 'plan-1',
  situationalDiagnosis: 'Diagnóstico',
  introduction: null,
  objectives: 'Objetivos',
  generalRecommendations: 'Generales',
  contextualRecommendations: null,
  clinicalRecommendations: 'Clínicas del catálogo',
  thematicRecommendations: null,
  meals: [{
    id: 'm1',
    mealType: 'lunch',
    instructions: 'Al mediodía',
    options: [{
      id: 'o1',
      order: 1,
      description: 'Opción liviana',
      items: [
        item('i1', { type: 'food', foodId: 'f1', foodName: 'Pollo', foodCategories: ['protein'] }),
        item('i2', { type: 'food_group', foodGroupId: 'g1', foodGroupName: 'Verduras', order: 2 }),
        item('i3', { type: 'recipe', recipeId: 'r1', recipe: { id: 'r1', name: 'Tarta', availableInCatalog: true }, order: 3 }),
        item('i4', { type: 'unrecognized', originalText: 'Agua', order: 4 }),
      ],
    }],
  }],
  findings: [],
};

const option = (form) => form.meals[0].options[0];

describe('planToForm y formToPayload', () => {
  it('manda los siete textos, incluso los que no se editan, con vacío en lugar de null', () => {
    const payload = formToPayload(planToForm(plan));

    expect(payload).toMatchObject({
      situationalDiagnosis: 'Diagnóstico',
      introduction: '',
      objectives: 'Objetivos',
      generalRecommendations: 'Generales',
      contextualRecommendations: '',
      clinicalRecommendations: 'Clínicas del catálogo',
      thematicRecommendations: '',
    });
  });

  it('cada ítem viaja solo con su referencia, sin ids ni copias del catálogo', () => {
    expect(formToPayload(planToForm(plan)).meals).toEqual([{
      mealType: 'lunch',
      instructions: 'Al mediodía',
      options: [{
        description: 'Opción liviana',
        items: [
          { type: 'food', foodId: 'f1' },
          { type: 'food_group', foodGroupId: 'g1' },
          { type: 'recipe', recipeId: 'r1' },
          { type: 'unrecognized', originalText: 'Agua' },
        ],
      }],
    }]);
  });

  it('conserva el id del servidor para ubicar los hallazgos guardados', () => {
    const form = planToForm(plan);

    expect(option(form).id).toBe('o1');
    expect(option(form).items.map(({ id }) => id)).toEqual(['i1', 'i2', 'i3', 'i4']);
    expect(new Set(option(form).items.map(({ key }) => key)).size).toBe(4);
  });
});

describe('edición de ítems', () => {
  it('reemplazar conserva la posición y el ítem nuevo no tiene id hasta guardar', () => {
    const form = planToForm(plan);
    const unrecognized = option(form).items[3];
    const edited = replaceItem(form, 'lunch', option(form).key, unrecognized.key, itemFromFood({ id: 'f2', name: 'Agua mineral' }));

    expect(option(edited).items.map(({ type }) => type)).toEqual(['food', 'food_group', 'recipe', 'food']);
    expect(option(edited).items[3]).toMatchObject({ id: null, foodId: 'f2', foodName: 'Agua mineral' });
    expect(formToPayload(edited).meals[0].options[0].items[3]).toEqual({ type: 'food', foodId: 'f2' });
  });

  it('agrega un grupo o una receta al final y quita un ítem', () => {
    const form = planToForm(plan);
    const key = option(form).key;
    const withGroup = addItem(form, 'lunch', key, itemFromGroup({ id: 'g2', name: 'Frutas' }));
    const withRecipe = addItem(withGroup, 'lunch', key, itemFromRecipe({ id: 'r2', name: 'Ensalada', availableInCatalog: true }));
    const removed = removeItem(withRecipe, 'lunch', key, option(withRecipe).items[0].key);

    expect(formToPayload(removed).meals[0].options[0].items).toEqual([
      { type: 'food_group', foodGroupId: 'g1' },
      { type: 'recipe', recipeId: 'r1' },
      { type: 'unrecognized', originalText: 'Agua' },
      { type: 'food_group', foodGroupId: 'g2' },
      { type: 'recipe', recipeId: 'r2' },
    ]);
    expect(option(removed).items[4].recipe).toEqual({ id: 'r2', name: 'Ensalada', availableInCatalog: true });
  });

  it(`no pasa de ${MAX_ITEMS} ítems por opción`, () => {
    let form = planToForm({ ...plan, meals: [{ ...plan.meals[0], options: [{ ...plan.meals[0].options[0], items: [] }] }] });
    for (let index = 0; index < MAX_ITEMS + 2; index += 1) {
      form = addItem(form, 'lunch', option(form).key, itemFromFood({ id: `f${index}`, name: `Alimento ${index}` }));
    }

    expect(option(form).items).toHaveLength(MAX_ITEMS);
  });
});

describe('edición de opciones y textos', () => {
  it('agrega una opción vacía, la describe y la quita', () => {
    const form = addOption(planToForm(plan), 'lunch');
    const added = form.meals[0].options[1];
    const described = setOptionDescription(form, 'lunch', added.key, 'Opción rápida');

    expect(formToPayload(described).meals[0].options[1]).toEqual({ description: 'Opción rápida', items: [] });
    expect(removeOption(described, 'lunch', added.key).meals[0].options).toHaveLength(1);
  });

  it(`no pasa de ${MAX_OPTIONS} opciones por comida`, () => {
    let form = planToForm(plan);
    for (let index = 0; index < MAX_OPTIONS + 2; index += 1) form = addOption(form, 'lunch');

    expect(form.meals[0].options).toHaveLength(MAX_OPTIONS);
  });

  it('edita los textos del plan y la indicación de la comida', () => {
    const form = setInstructions(setText(planToForm(plan), 'introduction', 'Nueva introducción'), 'lunch', 'Sin apuro');
    const payload = formToPayload(form);

    expect(payload.introduction).toBe('Nueva introducción');
    expect(payload.meals[0].instructions).toBe('Sin apuro');
  });
});

describe('sameContent', () => {
  it('detecta si hay algo para guardar', () => {
    const form = planToForm(plan);

    expect(sameContent(form, planToForm(plan))).toBe(true);
    expect(sameContent(form, setText(form, 'objectives', 'Otros'))).toBe(false);
    expect(sameContent(form, removeItem(form, 'lunch', option(form).key, option(form).items[0].key))).toBe(false);
  });
});
