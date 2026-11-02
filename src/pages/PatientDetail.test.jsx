// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import PatientDetail from './PatientDetail';
import { getPatient } from '../api/patients';
import { createCondition, deleteCondition, listConditions, updateCondition } from '../api/patientConditions';
import { createConsultation, listConsultations } from '../api/patientConsultations';
import { listMeasurements } from '../api/patientMeasurements';
import { generatePlan, listPlans } from '../api/patientPlans';
import { ApiError } from '../api/client';

vi.mock('../api/patients', () => ({ getPatient: vi.fn() }));
vi.mock('../api/patientConditions', () => ({ listConditions: vi.fn(), createCondition: vi.fn(), updateCondition: vi.fn(), deleteCondition: vi.fn() }));
vi.mock('../api/patientConsultations', () => ({ listConsultations: vi.fn(), createConsultation: vi.fn() }));
vi.mock('../api/patientMeasurements', () => ({ listMeasurements: vi.fn() }));
vi.mock('../api/patientPlans', () => ({ listPlans: vi.fn(), generatePlan: vi.fn() }));
// Los formularios solo entregan un payload ficticio: se prueban la ficha y las
// pestañas reales, sus efectos y sus callbacks de guardado, no sus validadores.
vi.mock('../components/ConditionForm', () => ({ default: ({ onSubmit, onCancel }) => (
  <div><button onClick={() => onSubmit({ type: 'allergy', foodId: 'food' })}>Guardar condición ficticia</button><button onClick={onCancel}>Cancelar</button></div>
) }));
vi.mock('../components/ConsultationForm', () => ({ default: ({ onSubmit, onCancel }) => (
  <div><button onClick={() => onSubmit({ type: 'first', date: '2026-01-01' })}>Guardar consulta ficticia</button><button onClick={onCancel}>Cancelar</button></div>
) }));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const patient = (id) => ({ id, firstName: `Paciente ${id}`, lastName: 'Ficticio', age: 30, registrationComplete: true, updatedAt: '2026-01-01T00:00:00Z' });
const condition = (label) => ({ id: label, type: 'allergy', food: { id: 'food', name: label }, registeredAt: '2026-01-01' });
const consultation = (label) => ({ id: label, date: '2026-01-01', type: 'first', observations: label, habits: [] });
const measurement = (label) => ({ id: label, date: '2026-01-01', type: 'other', detail: label, value: 10, unit: null });
const tabs = [
  ['Información clínica', listConditions, condition, '+ Agregar condición', 'Guardar condición ficticia', createCondition],
  ['Consultas', listConsultations, consultation, '+ Nueva consulta', 'Guardar consulta ficticia', createConsultation],
  ['Mediciones', listMeasurements, measurement],
];

let root;
let container;
let router;

beforeEach(async () => {
  vi.resetAllMocks();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  getPatient.mockImplementation(async (id) => patient(id));
  listConditions.mockResolvedValue([]);
  listConsultations.mockResolvedValue([]);
  listMeasurements.mockResolvedValue([]);
  listPlans.mockResolvedValue([]);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  router = createMemoryRouter([
    { path: '/pacientes/:id', element: <PatientDetail /> },
    { path: '/pacientes/:id/planes/:planId', element: <p>Vista del plan</p> },
  ], { initialEntries: ['/pacientes/A'] });
  await act(async () => root.render(<RouterProvider router={router} />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  router.dispose();
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function click(text) {
  const button = [...container.querySelectorAll('button')].find((node) => node.textContent === text);
  expect(button, `Botón ${text}`).toBeDefined();
  await act(async () => button.click());
}

async function navigate(id) {
  await act(async () => router.navigate(`/pacientes/${id}`));
}

describe('ficha y pestañas con respuestas demoradas (AUD-017)', () => {
  it.each(tabs)('%s: no muestra una respuesta ni un error del paciente anterior', async (tab, list, row) => {
    const old = deferred();
    list.mockImplementation((id) => id === 'A' ? old.promise : Promise.resolve([row('Datos de B')]));
    await click(tab);
    await navigate('B');
    expect(container.textContent).not.toContain('Paciente A');
    await click(tab);
    expect(container.textContent).toContain('Datos de B');
    await act(async () => old.resolve([row('Datos de A atrasados')]));
    expect(container.textContent).not.toContain('Datos de A atrasados');
    expect(container.textContent).toContain('Datos de B');
  });

  it.each(tabs)('%s: un error tardío de A no reemplaza el contenido de B', async (tab, list, row) => {
    const old = deferred();
    list.mockImplementation((id) => id === 'A' ? old.promise : Promise.resolve([row('Datos de B')]));
    await click(tab);
    await navigate('B');
    await click(tab);
    await act(async () => old.reject(new Error('Error atrasado de A')));
    expect(container.textContent).toContain('Datos de B');
    expect(container.textContent).not.toContain('Error atrasado de A');
  });

  it('cambiar de paciente limpia datos y formularios mientras llega la nueva ficha', async () => {
    await click('Consultas');
    await click('+ Nueva consulta');
    const next = deferred();
    getPatient.mockReturnValueOnce(next.promise);
    await navigate('B');
    expect(container.textContent).toBe('Cargando ficha...');
    expect(container.textContent).not.toContain('Guardar consulta ficticia');
    await act(async () => next.resolve(patient('B')));
    expect(container.textContent).toContain('Paciente B');
    await click('Consultas');
    expect(container.textContent).not.toContain('Guardar consulta ficticia');
  });

  it.each(tabs.slice(0, 2))('%s: guardar recarga el historial y actualiza la ficha vigente', async (tab, list, row, add, save, create) => {
    await click(tab);
    await click(add);
    list.mockResolvedValueOnce([row('Registro guardado')]);
    create.mockResolvedValueOnce({ id: 'nuevo' });
    await click(save);
    expect(create).toHaveBeenCalledWith('A', expect.any(Object));
    expect(list).toHaveBeenCalledTimes(2);
    expect(getPatient).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain('Registro guardado');
    expect(container.textContent).not.toContain(save);
  });

  it.each(tabs.slice(0, 2))('%s: un guardado que termina tras cambiar de paciente no recarga la ficha abandonada', async (tab, list, _row, add, save, create) => {
    await click(tab);
    await click(add);
    const saving = deferred();
    create.mockReturnValueOnce(saving.promise);
    await click(save);
    await navigate('B');
    await act(async () => saving.resolve({ id: 'nuevo' }));
    expect(list).toHaveBeenCalledTimes(1);
    expect(getPatient.mock.calls.map(([id]) => id)).toEqual(['A', 'B']);
    expect(container.textContent).toContain('Paciente B');
  });

  it('editar una condición mantiene la recarga del historial y de la ficha', async () => {
    listConditions.mockResolvedValueOnce([condition('Condición inicial')]);
    await click('Información clínica');
    await click('Editar');
    listConditions.mockResolvedValueOnce([condition('Condición editada')]);
    await click('Guardar condición ficticia');
    expect(updateCondition).toHaveBeenCalledWith('A', 'Condición inicial', expect.any(Object));
    expect(createCondition).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Condición editada');
    expect(getPatient).toHaveBeenCalledTimes(2);
  });

  it('un error de eliminación vigente se muestra y permite reintentar', async () => {
    listConditions.mockResolvedValueOnce([condition('Condición ficticia')]);
    deleteCondition.mockRejectedValueOnce(new Error('No se pudo eliminar'));
    await click('Información clínica');
    await click('Eliminar');
    expect(container.querySelector('[role="alert"]').textContent).toBe('No se pudo eliminar');
    expect(container.textContent).toContain('Condición ficticia');
    await click('Eliminar');
    expect(deleteCondition).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(listConditions).toHaveBeenCalledTimes(2);
  });

  it('una recarga vieja de la ficha no sobrescribe un paciente diferente', async () => {
    await click('Información clínica');
    await click('+ Agregar condición');
    const refresh = deferred();
    getPatient.mockReturnValueOnce(refresh.promise);
    await click('Guardar condición ficticia');
    expect(getPatient).toHaveBeenCalledTimes(2);
    await navigate('B');
    await act(async () => refresh.resolve({ ...patient('A'), firstName: 'Ficha vieja atrasada' }));
    expect(container.textContent).toContain('Paciente B');
    expect(container.textContent).not.toContain('Ficha vieja atrasada');
  });

  it('eliminar una condición recarga solo mientras la pestaña sigue montada', async () => {
    listConditions.mockResolvedValueOnce([condition('Condición ficticia')]);
    await click('Información clínica');
    const deleting = deferred();
    deleteCondition.mockReturnValueOnce(deleting.promise);
    await click('Eliminar');
    await click('Resumen');
    await act(async () => deleting.resolve());
    expect(listConditions).toHaveBeenCalledTimes(1);
    expect(getPatient).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Datos personales');
  });
});

describe('pestaña Planes (T39)', () => {
  const summary = (id) => ({ id, patientId: 'A', status: 'draft', createdAt: '2026-10-30T12:00:00Z', updatedAt: '2026-10-30T12:00:00Z' });

  function button(text) {
    return [...container.querySelectorAll('button')].find((node) => node.textContent === text);
  }

  it('lista los planes y abre la vista de uno', async () => {
    listPlans.mockResolvedValueOnce([summary('plan-1')]);
    await click('Planes');
    expect(listPlans).toHaveBeenCalledWith('A');
    expect(container.textContent).toContain('Borrador');
    await act(async () => button('Ver').click());
    expect(router.state.location.pathname).toBe('/pacientes/A/planes/plan-1');
  });

  it('sin planes muestra el estado vacío', async () => {
    await click('Planes');
    expect(container.textContent).toContain('Sin planes registrados');
  });

  it('mientras genera la ficha sigue operativa y el estado sobrevive al cambio de pestaña (RNF-02)', async () => {
    const request = deferred();
    generatePlan.mockReturnValueOnce(request.promise);
    await click('Planes');
    await click('Generar propuesta');

    expect(button('Generando propuesta...').disabled).toBe(true);
    expect(container.querySelector('[role="status"]').textContent).toContain('podés seguir usando la ficha');

    await click('Consultas');
    expect(container.textContent).toContain('Sin consultas registradas');
    expect(button('PlanesGenerando')).toBeDefined();

    await click('PlanesGenerando');
    expect(button('Generando propuesta...').disabled).toBe(true);

    listPlans.mockResolvedValueOnce([summary('plan-nuevo')]);
    await act(async () => request.resolve({ id: 'plan-nuevo' }));
    expect(container.textContent).toContain('Propuesta generada.');
    expect(container.textContent).toContain('Borrador');
    expect(button('Planes')).toBeDefined();

    await click('Ver propuesta');
    expect(router.state.location.pathname).toBe('/pacientes/A/planes/plan-nuevo');
  });

  it('un error de la IA muestra el motivo y permite reintentar', async () => {
    generatePlan
      .mockRejectedValueOnce(new ApiError({
        status: 503, code: 'IA_UNAVAILABLE', message: 'El servicio de IA no está disponible', details: { reason: 'provider_error' },
      }))
      .mockResolvedValueOnce({ id: 'plan-1' });
    await click('Planes');
    await click('Generar propuesta');

    expect(container.querySelector('[role="alert"]').textContent).toBe(
      'El servicio de IA no está disponible. No se creó ningún plan. Podés reintentar.',
    );

    await click('Reintentar');
    expect(generatePlan).toHaveBeenCalledTimes(2);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain('Propuesta generada.');
  });

  it('una generación que termina tras cambiar de paciente no aparece en la ficha nueva', async () => {
    const request = deferred();
    generatePlan.mockReturnValueOnce(request.promise);
    await click('Planes');
    await click('Generar propuesta');
    await navigate('B');
    await click('Planes');
    await act(async () => request.resolve({ id: 'plan-de-A' }));
    expect(container.textContent).toContain('Paciente B');
    expect(container.textContent).not.toContain('Propuesta generada.');
    expect(button('Generar propuesta').disabled).toBe(false);
  });

  it('volver desde la vista de un plan abre la pestaña Planes', async () => {
    await act(async () => router.navigate('/pacientes/B', { state: { tab: 'Planes' } }));
    expect(container.textContent).toContain('Generar propuesta');
  });
});
