import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, getToken, getTokenRole, isTokenExpired, setToken } from './client';

// Entorno node: localStorage y window se reemplazan por dobles mínimos, y
// fetch por un stub que devuelve la Response que cada caso necesita.

function createStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

let dispatchEvent;

beforeEach(() => {
  dispatchEvent = vi.fn();
  vi.stubGlobal('localStorage', createStorage());
  vi.stubGlobal('window', { dispatchEvent });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('devuelve el JSON de una respuesta exitosa y manda el token', async () => {
    setToken('token-valido');
    const fetchMock = vi.fn(async () => jsonResponse(200, [{ id: '1' }]));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/patients')).resolves.toEqual([{ id: '1' }]);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer token-valido');
  });

  it('serializa el body como JSON', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(201, { id: '1' }));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/patients', { method: 'POST', body: { firstName: 'Ana' } });

    const options = fetchMock.mock.calls[0][1];
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({ firstName: 'Ana' });
  });

  it('sin conexión tira ApiError NETWORK_ERROR con un mensaje legible', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );

    const error = await apiRequest('/patients').catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
    expect(error.message).toContain('No se pudo conectar con el servidor');
  });

  it('si el servidor no responde a tiempo tira ApiError TIMEOUT', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (url, { signal }) =>
          new Promise((resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason));
          }),
      ),
    );

    const error = await apiRequest('/patients', { timeoutMs: 10 }).catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('TIMEOUT');
  });

  it('un 400 de validación expone el mensaje de cada campo en fields', async () => {
    const fields = { firstName: 'El nombre es obligatorio', guardianName: 'Dato del adulto responsable obligatorio' };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(400, { error: { code: 'VALIDATION_ERROR', message: 'El nombre es obligatorio', details: { fields } } }),
      ),
    );

    const error = await apiRequest('/patients', { method: 'POST', body: {} }).catch((err) => err);

    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', message: 'El nombre es obligatorio' });
    expect(error.fields).toEqual(fields);
  });

  it('un error sin detalle por campo deja fields vacío', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Paciente no encontrado' } })),
    );

    const error = await apiRequest('/patients/x').catch((err) => err);

    expect(error.message).toBe('Paciente no encontrado');
    expect(error.fields).toEqual({});
  });

  it('un 401 con sesión cierra la sesión y avisa a la app', async () => {
    setToken('token-vencido');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Token inválido o expirado' } })),
    );

    const error = await apiRequest('/patients').catch((err) => err);

    expect(error.status).toBe(401);
    expect(getToken()).toBeNull();
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'nutria:unauthorized' }));
  });

  it('un 401 del login (auth: false) no se trata como sesión expirada', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Credenciales inválidas' } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    setToken('token-anterior');

    const error = await apiRequest('/auth/login', { method: 'POST', body: {}, auth: false }).catch((err) => err);

    expect(error.message).toBe('Credenciales inválidas');
    expect(dispatchEvent).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('una respuesta de error que no es JSON (ej. 502 del proxy) da un mensaje genérico', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>Bad Gateway</html>', { status: 502, headers: { 'Content-Type': 'text/html' } })),
    );

    const error = await apiRequest('/patients').catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.message).toContain('no está disponible');
    expect(error.message).not.toContain('html');
  });
});

// JWT con el payload dado y una firma cualquiera: el cliente nunca la verifica.
function fakeToken(payload) {
  const encoded = btoa(JSON.stringify(payload)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${encoded}.firma`;
}

describe('lectura del token', () => {
  it('getTokenRole devuelve el rol del claim role', () => {
    expect(getTokenRole(fakeToken({ sub: '1', role: 'admin' }))).toBe('admin');
    expect(getTokenRole(fakeToken({ sub: '1', role: 'nutritionist' }))).toBe('nutritionist');
  });

  it('getTokenRole devuelve null para un token sin rol o ilegible', () => {
    expect(getTokenRole(fakeToken({ sub: '1' }))).toBeNull();
    expect(getTokenRole('no-es-un-jwt')).toBeNull();
  });

  it('isTokenExpired compara exp con la hora actual y trata un token ilegible como vencido', () => {
    const now = Math.floor(Date.now() / 1000);

    expect(isTokenExpired(fakeToken({ exp: now + 3600 }))).toBe(false);
    expect(isTokenExpired(fakeToken({ exp: now - 1 }))).toBe(true);
    expect(isTokenExpired('no-es-un-jwt')).toBe(true);
  });
});
