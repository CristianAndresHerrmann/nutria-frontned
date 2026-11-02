// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { usePatientData } from './usePatientData';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

let container;
let root;
let current;
let load;
const pending = [];

function Harness({ patientId }) {
  const state = usePatientData(patientId, load);
  useEffect(() => { current = state; });
  return <p>{state.error || state.data || 'Cargando'}</p>;
}

async function render(patientId, strict = false) {
  await act(async () => root.render(strict ? <StrictMode><Harness patientId={patientId} /></StrictMode> : <Harness patientId={patientId} />));
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  pending.length = 0;
  load = vi.fn(() => {
    const request = deferred();
    pending.push(request);
    return request.promise;
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('cargas de paciente (AUD-017)', () => {
  it.each(['resolve', 'reject'])('ignora un %s del paciente anterior que llega después de la respuesta actual', async (settle) => {
    await render('A');
    const oldScope = current;
    await render('B');
    expect(oldScope.isCurrent()).toBe(false);
    await act(async () => pending[1].resolve('Datos de B'));
    await act(async () => pending[0][settle](settle === 'resolve' ? 'Datos de A' : new Error('Error de A')));
    expect(container.textContent).toBe('Datos de B');
    await oldScope.reload();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('oculta datos y errores anteriores mientras carga el nuevo paciente', async () => {
    await render('A');
    await act(async () => pending[0].resolve('Datos de A'));
    await render('B');
    expect(container.textContent).toBe('Cargando');
    await act(async () => pending[1].reject(new Error('Error de B')));
    expect(container.textContent).toBe('Error de B');
    await render('C');
    expect(container.textContent).toBe('Cargando');
  });

  it('volver a A no reactiva una carga de la primera visita a A', async () => {
    await render('A');
    await render('B');
    await render('A');
    await act(async () => pending[2].resolve('Segunda visita a A'));
    await act(async () => pending[0].resolve('Primera visita a A'));
    expect(container.textContent).toBe('Segunda visita a A');
  });

  it('solo la última recarga puede publicar datos o errores del mismo paciente', async () => {
    await render('A');
    await act(async () => pending[0].resolve('Datos iniciales'));
    let firstReload;
    let secondReload;
    await act(async () => { firstReload = current.reload(); secondReload = current.reload(); });
    await act(async () => { pending[2].resolve('Última recarga'); await secondReload; });
    await act(async () => { pending[1].reject(new Error('Error de recarga vieja')); await firstReload; });
    expect(container.textContent).toBe('Última recarga');
  });

  it('una recarga fallida conserva los datos y permite recuperarse', async () => {
    await render('A');
    await act(async () => pending[0].resolve('Datos existentes'));
    let reloading;
    await act(async () => { reloading = current.reload(); });
    await act(async () => { pending[1].reject(new Error('Sin conexión')); await reloading; });
    expect(current).toMatchObject({ data: 'Datos existentes', error: 'Sin conexión' });
    await act(async () => { reloading = current.reload(); });
    await act(async () => { pending[2].resolve('Datos recuperados'); await reloading; });
    expect(current).toMatchObject({ data: 'Datos recuperados', error: '' });
  });

  it('desmontar invalida también el callback de recarga pendiente', async () => {
    await render('A');
    const oldScope = current;
    await act(async () => root.render(null));
    await act(async () => pending[0].reject(new Error('Respuesta tras desmontar')));
    expect(oldScope.isCurrent()).toBe(false);
    await oldScope.reload();
    expect(load).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('');
  });

  it('el montaje doble de StrictMode invalida la primera request aunque el paciente sea el mismo', async () => {
    await render('A', true);
    expect(load).toHaveBeenCalledTimes(2);
    await act(async () => pending[1].resolve('Montaje vigente'));
    await act(async () => pending[0].resolve('Montaje descartado'));
    expect(container.textContent).toBe('Montaje vigente');
  });
});
