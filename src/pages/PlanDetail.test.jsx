// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import PlanDetail from './PlanDetail';
import { getPatient } from '../api/patients';
import { getPlan, updatePlan } from '../api/patientPlans';
import { listFoodGroups } from '../api/catalogs';
import { listRecipes } from '../api/recipes';
import { ApiError } from '../api/client';

vi.mock('../api/patients', () => ({ getPatient: vi.fn() }));
vi.mock('../api/patientPlans', () => ({ getPlan: vi.fn(), updatePlan: vi.fn() }));
vi.mock('../api/catalogs', () => ({ listFoods: vi.fn(), listFoodGroups: vi.fn() }));
vi.mock('../api/recipes', () => ({ listRecipes: vi.fn() }));

const item = (id, fields) => ({
  id, optionId: 'o1', order: 1, foodId: null, foodName: null, foodCategories: [], foodGroupId: null,
  foodGroupName: null, recipeId: null, recipe: null, originalText: null, ...fields,
});

// Plan ficticio con la forma de la API: una comida, una opción con un alimento,
// un grupo y un ítem no reconocido, un hallazgo bloqueante en ese ítem y una
// advertencia de composición en la opción.
const plan = {
  id: 'plan-1',
  patientId: 'A',
  status: 'draft',
  situationalDiagnosis: '[Propuesta simulada] Diagnóstico',
  introduction: null,
  objectives: '[Propuesta simulada] Objetivos',
  generalRecommendations: '[Propuesta simulada] Recomendación general',
  contextualRecommendations: null,
  clinicalRecommendations: null,
  thematicRecommendations: null,
  meals: [{
    id: 'm1',
    planId: 'plan-1',
    mealType: 'breakfast',
    instructions: 'Antes de las 9',
    options: [{
      id: 'o1',
      planMealId: 'm1',
      order: 1,
      description: 'Desayuno simple',
      items: [
        item('i1', { type: 'food', foodId: 'f1', foodName: 'Avena', foodCategories: ['cereal'] }),
        item('i2', { type: 'food_group', foodGroupId: 'g1', foodGroupName: 'Frutas', order: 2 }),
        item('i3', { type: 'unrecognized', originalText: 'Agua', order: 3 }),
      ],
    }],
  }],
  findings: [
    { id: 'f1', planId: 'plan-1', optionId: 'o1', optionItemId: 'i3', type: 'unrecognized_item', severity: 'blocking', message: '"Agua" no está en el catálogo' },
    { id: 'f2', planId: 'plan-1', optionId: 'o1', optionItemId: null, type: 'composition', severity: 'warning', message: 'Opción 1 del desayuno: falta proteína' },
  ],
  generation: { provider: 'fake', model: 'fake-deterministic', templateVersion: 'v1', validationResult: 'blocking', generatedAt: '2026-10-30T12:00:00Z' },
};

const patient = (fields) => ({ id: 'A', firstName: 'Paciente', lastName: 'Ficticio', missingClinicalData: false, ...fields });

let root;
let container;
let router;

async function render() {
  router = createMemoryRouter([
    { path: '/pacientes/:id/planes/:planId', element: <PlanDetail /> },
    { path: '/pacientes/:id', element: <p>Ficha</p> },
  ], { initialEntries: ['/pacientes/A/planes/plan-1'] });
  await act(async () => root.render(<RouterProvider router={router} />));
}

// El ítem del plan cuyo texto empieza con `text` (sus hallazgos van adentro).
function itemNode(text) {
  const node = [...container.querySelectorAll('li')].find((el) => el.textContent.startsWith(text));
  expect(node, `ítem ${text}`).toBeDefined();
  return node;
}

// El elemento más chico que contiene el texto.
function closest(text, selector) {
  const node = [...container.querySelectorAll(selector)].reverse().find((el) => el.textContent.includes(text));
  expect(node, `${selector} con ${text}`).toBeDefined();
  return node;
}

// El campo (input, textarea o select) de un FormField por su etiqueta.
function field(label) {
  const node = [...container.querySelectorAll('label')].find((el) => el.firstChild?.textContent.trim() === label);
  expect(node, `campo ${label}`).toBeDefined();
  return node.querySelector('input, textarea, select');
}

function button(text) {
  const node = [...container.querySelectorAll('button')].find(
    (el) => el.getAttribute('aria-label') === text || el.textContent === text,
  );
  expect(node, `botón ${text}`).toBeDefined();
  return node;
}

async function type(element, value) {
  const prototype = Object.getPrototypeOf(element);
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  });
}

async function click(text) {
  await act(async () => button(text).click());
}

function hasButton(text) {
  return [...container.querySelectorAll('button')].some((el) => el.textContent === text);
}

// La propuesta se abre en lectura: la edición empieza con "Editar propuesta".
async function renderEditing() {
  await render();
  await click('Editar propuesta');
}

async function chooseKind(label) {
  const radio = [...container.querySelectorAll('input[type="radio"]')].find((el) => el.parentElement.textContent === label);
  await act(async () => radio.click());
}

async function save() {
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}

// Lo que responde el backend al guardar: ids nuevos y hallazgos recalculados.
function savedPlan(items, findings = []) {
  const option = {
    ...plan.meals[0].options[0],
    id: 'o9',
    items: items.map((fields, index) => item(`n${index}`, { order: index + 1, optionId: 'o9', ...fields })),
  };
  return { ...plan, meals: [{ ...plan.meals[0], id: 'm9', options: [option] }], findings };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  getPlan.mockResolvedValue(plan);
  getPatient.mockResolvedValue(patient());
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  router.dispose();
  container.remove();
  vi.unstubAllGlobals();
});

describe('vista de la propuesta (T39)', () => {
  it('se abre en lectura, con la leyenda de borrador a revisar y las secciones del plan', async () => {
    await render();

    expect(getPlan).toHaveBeenCalledWith('A', 'plan-1');
    expect(container.querySelector('[role="note"]').textContent).toContain('borrador que requiere revisión');
    expect(container.textContent).toContain('Paciente Ficticio');
    for (const text of ['Diagnóstico situacional', '[Propuesta simulada] Diagnóstico', 'Introducción', 'Sin dato', '[Propuesta simulada] Objetivos', 'Generales', '[Propuesta simulada] Recomendación general']) {
      expect(container.textContent).toContain(text);
    }
    expect(container.textContent).not.toContain('Clínicas');
    expect(container.querySelectorAll('input, textarea, select')).toHaveLength(0);
    expect(hasButton('Editar propuesta')).toBe(true);
    expect(hasButton('Guardar cambios')).toBe(false);
  });

  it('muestra comidas, opciones e ítems según su tipo, sin acciones', async () => {
    await render();

    expect(container.textContent).toContain('Desayuno');
    expect(container.textContent).toContain('Antes de las 9');
    const option = closest('Opción 1', 'article');
    expect(option.textContent).toContain('Desayuno simple');
    expect(itemNode('Avena').textContent).toBe('Avena');
    expect(itemNode('Frutas').textContent).toBe('FrutasGrupo');
  });

  it('muestra cada hallazgo junto a su ítem u opción y destaca el no reconocido', async () => {
    await render();

    const unrecognized = itemNode('Agua');
    expect(unrecognized.className).toContain('border-danger');
    expect(unrecognized.textContent).toContain('No reconocido');
    expect(unrecognized.textContent).toContain('Bloqueante');
    expect(unrecognized.textContent).toContain('"Agua" no está en el catálogo');

    expect(itemNode('Avena').textContent).not.toContain('Bloqueante');
    const composition = closest('falta proteína', 'li');
    expect(composition.textContent).toContain('Advertencia');
    expect(closest('Opción 1', 'article').textContent).toContain('falta proteína');

    expect(container.textContent).toContain('1 bloqueante');
    expect(container.textContent).toContain('1 advertencia');
  });

  it('muestra el aviso de datos clínicos faltantes solo cuando corresponde (RF-45)', async () => {
    await render();
    expect(container.textContent).not.toContain('No hay patologías');

    await act(async () => root.unmount());
    router.dispose();
    root = createRoot(container);
    getPatient.mockResolvedValue(patient({ missingClinicalData: true }));
    await render();
    expect(container.textContent).toContain('No hay patologías, alergias, intolerancias ni medicación registradas');
  });

  it('un error al cargar el plan se muestra y deja volver a la ficha', async () => {
    getPlan.mockRejectedValue(new Error('Plan no encontrado'));
    await render();

    expect(container.querySelector('[role="alert"]').textContent).toBe('Plan no encontrado');
    const back = [...container.querySelectorAll('button')].find((node) => node.textContent === 'Volver a la ficha');
    await act(async () => back.click());
    expect(router.state.location.pathname).toBe('/pacientes/A');
    expect(router.state.location.state).toEqual({ tab: 'Planes' });
  });

  it('volver a la ficha desde la lectura no pide confirmación', async () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);
    await render();

    await click('Volver a la ficha');
    expect(confirm).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/pacientes/A');
  });
});

describe('edición del borrador (T40)', () => {
  it('"Editar propuesta" muestra los textos, las comidas y los ítems en campos editables', async () => {
    await renderEditing();

    expect(hasButton('Editar propuesta')).toBe(false);
    // La leyenda de borrador sigue a la vista mientras se edita (RNF-10).
    expect(container.querySelector('[role="note"]').textContent).toContain('borrador que requiere revisión');
    expect(field('Diagnóstico situacional').value).toBe('[Propuesta simulada] Diagnóstico');
    expect(field('Introducción').value).toBe('');
    expect(field('Objetivos').value).toBe('[Propuesta simulada] Objetivos');
    expect(field('Generales').value).toBe('[Propuesta simulada] Recomendación general');
    expect(field('Contextuales').value).toBe('');
    expect(field('Temáticas').value).toBe('');
    // La IA no escribe las clínicas y elegirlas del catálogo es otra tarea.
    expect(container.textContent).not.toContain('Clínicas');
    expect(field('Indicación de la comida').value).toBe('Antes de las 9');
    expect(closest('Opción 1', 'article').contains(field('Descripción de la opción'))).toBe(true);
    expect(field('Descripción de la opción').value).toBe('Desayuno simple');
    expect(itemNode('Avena').textContent).toBe('AvenaReemplazarQuitar');
    expect(itemNode('Frutas').textContent).toBe('FrutasGrupoReemplazarQuitar');
    expect(itemNode('Agua').textContent).toContain('Bloqueante');
    expect(button('Guardar cambios').disabled).toBe(true);
  });

  it('edita la introducción y guarda: manda el plan completo y vuelve a la lectura con los hallazgos revalidados', async () => {
    updatePlan.mockResolvedValue({ ...savedPlan(plan.meals[0].options[0].items), introduction: 'Introducción nueva' });
    await renderEditing();

    await type(field('Introducción'), 'Introducción nueva');
    expect(container.textContent).toContain('Hay cambios sin guardar');
    expect(button('Guardar cambios').disabled).toBe(false);
    await save();

    expect(updatePlan).toHaveBeenCalledWith('A', 'plan-1', {
      situationalDiagnosis: '[Propuesta simulada] Diagnóstico',
      introduction: 'Introducción nueva',
      objectives: '[Propuesta simulada] Objetivos',
      generalRecommendations: '[Propuesta simulada] Recomendación general',
      contextualRecommendations: '',
      clinicalRecommendations: '',
      thematicRecommendations: '',
      meals: [{
        mealType: 'breakfast',
        instructions: 'Antes de las 9',
        options: [{
          description: 'Desayuno simple',
          items: [
            { type: 'food', foodId: 'f1' },
            { type: 'food_group', foodGroupId: 'g1' },
            { type: 'unrecognized', originalText: 'Agua' },
          ],
        }],
      }],
    });
    expect(container.querySelector('[role="status"]').textContent).toBe('Cambios guardados. Los hallazgos se actualizaron.');
    expect(container.textContent).not.toContain('Hay cambios sin guardar');
    expect(container.textContent).toContain('0 bloqueantes');
    expect(container.querySelectorAll('input, textarea, select')).toHaveLength(0);
    expect(container.textContent).toContain('Introducción nueva');
    expect(hasButton('Editar propuesta')).toBe(true);
  });

  it('cancelar descarta los cambios y vuelve a la lectura, con confirmación si hay cambios', async () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);
    await renderEditing();

    await type(field('Objetivos'), 'Otros objetivos');
    await click('Cancelar');
    expect(confirm).toHaveBeenCalledWith('Hay cambios sin guardar. ¿Descartarlos?');
    expect(field('Objetivos').value).toBe('Otros objetivos');

    confirm.mockReturnValue(true);
    await click('Cancelar');
    expect(container.querySelectorAll('input, textarea, select')).toHaveLength(0);
    expect(container.textContent).toContain('[Propuesta simulada] Objetivos');
    expect(container.textContent).not.toContain('Otros objetivos');
    expect(updatePlan).not.toHaveBeenCalled();

    // Sin cambios, cancelar no pregunta y la edición vuelve a empezar del guardado.
    confirm.mockClear();
    await click('Editar propuesta');
    expect(field('Objetivos').value).toBe('[Propuesta simulada] Objetivos');
    await click('Cancelar');
    expect(confirm).not.toHaveBeenCalled();
    expect(hasButton('Editar propuesta')).toBe(true);
  });

  it('reemplazar el ítem no reconocido por un grupo lo resuelve al guardar', async () => {
    listFoodGroups.mockResolvedValue([{ id: 'g2', name: 'Bebidas', parentId: null }]);
    const items = [
      { type: 'food', foodId: 'f1', foodName: 'Avena' },
      { type: 'food_group', foodGroupId: 'g1', foodGroupName: 'Frutas' },
      { type: 'food_group', foodGroupId: 'g2', foodGroupName: 'Bebidas' },
    ];
    updatePlan.mockResolvedValue(savedPlan(items));
    await renderEditing();

    await click('Reemplazar Agua');
    await chooseKind('Grupo');
    await type(container.querySelector('select[aria-label="Grupo de alimentos para el plan"]'), 'g2');

    expect(itemNode('Bebidas').textContent).toContain('Grupo');
    expect(container.textContent).not.toContain('No reconocido');
    // Hasta guardar, el bloqueo sigue contado: es de la última versión guardada.
    expect(container.textContent).toContain('1 bloqueante');

    await save();
    expect(updatePlan.mock.calls[0][2].meals[0].options[0].items[2]).toEqual({ type: 'food_group', foodGroupId: 'g2' });
    expect(container.textContent).toContain('0 bloqueantes');
    expect(itemNode('Bebidas').textContent).toBe('BebidasGrupo');
  });

  it('asigna una receta filtrada por el paciente y muestra el bloqueo que devuelve el backend', async () => {
    listRecipes.mockResolvedValue([
      { id: 'r1', name: 'Licuado de banana', availableInCatalog: true, ingredients: [{ food: { name: 'Banana' } }] },
      { id: 'r2', name: 'Tostadas', availableInCatalog: true, ingredients: [{ food: { name: 'Pan' } }] },
    ]);
    await renderEditing();

    await click('Agregar ítem');
    await chooseKind('Receta');
    expect(listRecipes).toHaveBeenCalledWith({ patientId: 'A', mealType: 'breakfast' });
    await type(container.querySelector('input[aria-label="Buscar receta para el plan"]'), 'banana');
    expect(container.textContent).not.toContain('Tostadas');
    await click('Licuado de banana');
    expect(itemNode('Licuado de banana').textContent).toContain('Receta');

    const recipe = { id: 'r1', name: 'Licuado de banana', availableInCatalog: true };
    const items = [...plan.meals[0].options[0].items, { type: 'recipe', recipeId: 'r1', recipe }];
    const blocking = {
      id: 'f9', planId: 'plan-1', optionId: null, optionItemId: 'n3', type: 'direct_condition', severity: 'blocking',
      message: 'Receta Licuado de banana, ingrediente Banana: alergia del paciente (Banana)',
    };
    updatePlan.mockResolvedValue(savedPlan(items, [blocking]));
    await save();

    expect(updatePlan.mock.calls[0][2].meals[0].options[0].items[3]).toEqual({ type: 'recipe', recipeId: 'r1' });
    expect(itemNode('Licuado de banana').textContent).toContain('Bloqueante');
    expect(itemNode('Licuado de banana').textContent).toContain('alergia del paciente (Banana)');
  });

  it('quita un ítem y agrega una opción vacía', async () => {
    updatePlan.mockResolvedValue(savedPlan([]));
    await renderEditing();

    await click('Quitar Avena');
    await click('Agregar opción');
    expect(container.textContent).toContain('Opción 2');
    await save();

    expect(updatePlan.mock.calls[0][2].meals[0].options).toEqual([
      { description: 'Desayuno simple', items: [{ type: 'food_group', foodGroupId: 'g1' }, { type: 'unrecognized', originalText: 'Agua' }] },
      { description: '', items: [] },
    ]);
  });

  it('muestra el error de un texto junto a su campo y el de un ítem arriba de las comidas (T29)', async () => {
    updatePlan.mockRejectedValueOnce(new ApiError({
      status: 400, code: 'VALIDATION_ERROR', message: 'Datos inválidos',
      details: { fields: { introduction: 'No puede superar los 4000 caracteres' } },
    }));
    await renderEditing();

    await type(field('Introducción'), 'Texto ficticio');
    await save();
    expect(field('Introducción').getAttribute('aria-invalid')).toBe('true');
    expect(closest('No puede superar', 'label').textContent).toContain('Introducción');
    expect(container.textContent).toContain('Revisá los campos marcados antes de guardar.');

    const message = 'Opción 1 del desayuno, ítem 1: el alimento está dado de baja';
    updatePlan.mockRejectedValueOnce(new ApiError({
      status: 400, code: 'VALIDATION_ERROR', message, details: { fields: { meals: message } },
    }));
    await save();
    expect(field('Introducción').getAttribute('aria-invalid')).toBe('false');
    expect([...container.querySelectorAll('[role="alert"]')].map((el) => el.textContent)).toContain(message);
    // Un error no saca de la edición ni pierde cambios.
    expect(field('Introducción').value).toBe('Texto ficticio');
    expect(button('Guardar cambios').disabled).toBe(false);
  });

  it('volver a la ficha con cambios sin guardar pide confirmación', async () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);
    await renderEditing();

    await type(field('Objetivos'), 'Otros objetivos');
    await click('Volver a la ficha');
    expect(confirm).toHaveBeenCalledWith('Hay cambios sin guardar. ¿Salir igual?');
    expect(router.state.location.pathname).toBe('/pacientes/A/planes/plan-1');

    confirm.mockReturnValue(true);
    await click('Volver a la ficha');
    expect(router.state.location.pathname).toBe('/pacientes/A');
  });
});
