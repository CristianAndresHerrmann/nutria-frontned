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

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (options.body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('nutria:unauthorized'));
  }

  return response;
}
