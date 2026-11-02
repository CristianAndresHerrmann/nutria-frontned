import { afterEach, describe, expect, it, vi } from 'vitest';
import { GENERATE_TIMEOUT_MS, generatePlan, getPlan, listPlans, updatePlan } from './patientPlans';
import { ApiError } from './client';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stubFetch(body, status = 200) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('planes del paciente (T39)', () => {
  it('lista los planes del paciente con GET', async () => {
    const plans = [{ id: 'p-1', patientId: 'pac-1', status: 'draft' }];
    const fetchMock = stubFetch(plans);

    await expect(listPlans('pac-1')).resolves.toEqual(plans);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/patients\/pac-1\/plans$/);
    expect(options.method).toBe('GET');
  });

  it('trae un plan del paciente con GET', async () => {
    const plan = { id: 'p-1', meals: [], findings: [] };
    const fetchMock = stubFetch(plan);

    await expect(getPlan('pac-1', 'p-1')).resolves.toEqual(plan);

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/patients\/pac-1\/plans\/p-1$/);
  });

  it('genera con POST sin body y espera más que el timeout del backend', async () => {
    const plan = { id: 'p-1', meals: [], findings: [] };
    const fetchMock = stubFetch(plan, 201);
    const timeout = vi.spyOn(AbortSignal, 'timeout');

    await expect(generatePlan('pac-1')).resolves.toEqual(plan);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/patients\/pac-1\/plans\/generate$/);
    expect(options.method).toBe('POST');
    expect(options.body).toBeUndefined();
    expect(timeout).toHaveBeenCalledWith(GENERATE_TIMEOUT_MS);
    expect(GENERATE_TIMEOUT_MS).toBeGreaterThan(30_000);
  });

  it('propaga el 503 de la IA con su motivo para poder reintentar', async () => {
    stubFetch({
      error: { code: 'IA_UNAVAILABLE', message: 'El servicio de IA no está disponible', details: { reason: 'provider_error' } },
    }, 503);

    await expect(generatePlan('pac-1')).rejects.toMatchObject({
      name: ApiError.name,
      status: 503,
      code: 'IA_UNAVAILABLE',
      message: 'El servicio de IA no está disponible',
      details: { reason: 'provider_error' },
    });
  });
});

describe('edición del borrador (T40)', () => {
  it('reemplaza el borrador con PUT y devuelve el plan revalidado', async () => {
    const saved = { id: 'p-1', meals: [], findings: [] };
    const payload = { introduction: 'Nueva', meals: [] };
    const fetchMock = stubFetch(saved);

    await expect(updatePlan('pac-1', 'p-1', payload)).resolves.toEqual(saved);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/patients\/pac-1\/plans\/p-1$/);
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it('propaga el 400 con el error en su campo', async () => {
    stubFetch({
      error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: { fields: { meals: 'Opción 1 del almuerzo, ítem 2: el alimento no existe' } } },
    }, 400);

    await expect(updatePlan('pac-1', 'p-1', { meals: [] })).rejects.toMatchObject({
      status: 400,
      fields: { meals: 'Opción 1 del almuerzo, ítem 2: el alimento no existe' },
    });
  });
});
