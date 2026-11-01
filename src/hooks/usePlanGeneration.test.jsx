// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { generatePlan } from '../api/patientPlans';
import { usePlanGeneration } from './usePlanGeneration';

vi.mock('../api/patientPlans', () => ({ generatePlan: vi.fn() }));

let container;
let root;
let current;

function Harness({ patientId }) {
  const generation = usePlanGeneration(patientId);
  useEffect(() => { current = generation; });
  return null;
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(async () => {
  vi.resetAllMocks();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<Harness patientId="A" />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('generación de una propuesta (T39; RNF-02)', () => {
  it('pasa por en curso y termina con el plan generado', async () => {
    const request = deferred();
    generatePlan.mockReturnValueOnce(request.promise);
    expect(current.status).toBe('idle');

    await act(async () => { current.generate(); });
    expect(current.status).toBe('generating');
    expect(generatePlan).toHaveBeenCalledWith('A');

    await act(async () => request.resolve({ id: 'plan-1' }));
    expect(current).toMatchObject({ status: 'done', plan: { id: 'plan-1' }, error: null });
  });

  it('un error queda disponible y reintentar vuelve a generar', async () => {
    const failure = new Error('El servicio de IA no está disponible');
    generatePlan.mockRejectedValueOnce(failure).mockResolvedValueOnce({ id: 'plan-2' });

    await act(async () => current.generate());
    expect(current).toMatchObject({ status: 'error', error: failure, plan: null });

    await act(async () => current.generate());
    expect(generatePlan).toHaveBeenCalledTimes(2);
    expect(current).toMatchObject({ status: 'done', plan: { id: 'plan-2' }, error: null });
  });

  it('ignora un segundo pedido mientras hay uno en curso', async () => {
    const request = deferred();
    generatePlan.mockReturnValueOnce(request.promise);

    await act(async () => { current.generate(); });
    await act(async () => { current.generate(); });
    expect(generatePlan).toHaveBeenCalledTimes(1);

    await act(async () => request.resolve({ id: 'plan-1' }));
  });
});
