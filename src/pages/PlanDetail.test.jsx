// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import PlanDetail from './PlanDetail';
import { getPatient } from '../api/patients';
import { getPlan } from '../api/patientPlans';

vi.mock('../api/patients', () => ({ getPatient: vi.fn() }));
vi.mock('../api/patientPlans', () => ({ getPlan: vi.fn() }));

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
  it('muestra la leyenda de propuesta editable y las secciones del plan', async () => {
    await render();

    expect(getPlan).toHaveBeenCalledWith('A', 'plan-1');
    expect(container.querySelector('[role="note"]').textContent).toContain('borrador editable');
    expect(container.textContent).toContain('Paciente Ficticio');
    for (const text of ['Diagnóstico situacional', '[Propuesta simulada] Diagnóstico', 'Introducción', 'Sin dato', '[Propuesta simulada] Objetivos', 'Generales', '[Propuesta simulada] Recomendación general']) {
      expect(container.textContent).toContain(text);
    }
    expect(container.textContent).not.toContain('Clínicas');
  });

  it('muestra comidas, opciones e ítems según su tipo', async () => {
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
});
