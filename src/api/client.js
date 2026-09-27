const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'nutria_token';
const NUTRITIONIST_KEY = 'nutria_nutritionist';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Almacenamiento no disponible (modo privado, etc.): la sesión no persiste entre recargas.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ver comentario en setToken.
  }
}

// { id, name, email } del login: se persiste junto al token para poder
// mostrar el nombre del nutricionista en el layout sin pegarle a la API de
// nuevo ni decodificarlo del JWT (que solo trae el id en `sub`).
export function getNutritionist() {
  try {
    const raw = localStorage.getItem(NUTRITIONIST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setNutritionist(nutritionist) {
  try {
    localStorage.setItem(NUTRITIONIST_KEY, JSON.stringify(nutritionist));
  } catch {
    // Ver comentario en setToken.
  }
}

export function clearNutritionist() {
  try {
    localStorage.removeItem(NUTRITIONIST_KEY);
  } catch {
    // Ver comentario en setToken.
  }
}

export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

// Mensajes para cuando el backend no llegó a responder con el formato de error
// de la API (sin red, timeout, un 502 del proxy con HTML). Cuando sí respondió,
// se muestra su `message` tal cual.
const NETWORK_ERROR_MESSAGE = 'No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.';
const TIMEOUT_MESSAGE = 'El servidor tardó demasiado en responder. Intentá de nuevo en unos minutos.';

function fallbackMessage(status) {
  if (status >= 500) return 'El servidor no está disponible en este momento. Intentá de nuevo en unos minutos.';
  if (status === 401) return 'Tu sesión expiró. Volvé a iniciar sesión.';
  if (status === 404) return 'No se encontró lo que buscabas.';
  return 'No se pudo completar la operación.';
}

// Único tipo de error que sale del cliente: toda pantalla puede mostrar
// `message` directamente y, en un formulario, `fields[campo]` junto al input.
export class ApiError extends Error {
  constructor({ status, code, message, details }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.fields = details?.fields ?? {};
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Único punto de salida hacia el backend. Devuelve el JSON de la respuesta o
// tira ApiError; nunca deja escapar un error crudo de fetch.
//
// `auth: false` para el login: ahí un 401 son credenciales inválidas, no una
// sesión vencida, y no tiene que disparar el cierre de sesión.
export async function apiRequest(path, { method = 'GET', body, auth = true, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const headers = {};
  const token = auth ? getToken() : null;

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (error?.name === 'TimeoutError') {
      throw new ApiError({ status: 0, code: 'TIMEOUT', message: TIMEOUT_MESSAGE });
    }
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: NETWORK_ERROR_MESSAGE });
  }

  const data = await readJson(response);

  if (response.ok) return data;

  if (response.status === 401 && auth) {
    clearToken();
    window.dispatchEvent(new Event('nutria:unauthorized'));
  }

  const apiError = data?.error;
  throw new ApiError({
    status: response.status,
    code: apiError?.code || 'HTTP_ERROR',
    message: apiError?.message || fallbackMessage(response.status),
    details: apiError?.details,
  });
}
