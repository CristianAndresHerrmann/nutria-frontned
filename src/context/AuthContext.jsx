import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  clearNutritionist,
  clearToken,
  getNutritionist,
  getToken,
  isTokenExpired,
  setNutritionist as persistNutritionist,
  setToken as persistToken,
} from '../api/client';
import { login as loginRequest } from '../api/auth';

const AuthContext = createContext(null);

function getValidToken() {
  const stored = getToken();
  if (stored && isTokenExpired(stored)) {
    clearToken();
    clearNutritionist();
    return null;
  }
  return stored;
}

// Chequeo periódico de expiración: cubre pantallas protegidas que no hacen
// ningún llamado a la API (donde una respuesta 401 nunca dispararía el logout).
const EXPIRY_CHECK_INTERVAL_MS = 30_000;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getValidToken);
  const [nutritionist, setNutritionist] = useState(() => (getValidToken() ? getNutritionist() : null));
  // true cuando la sesión se cerró sola (token vencido o 401 del backend), no
  // por un logout: el login lo usa para explicar por qué volvió a esa pantalla.
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    function handleUnauthorized() {
      clearNutritionist();
      setToken(null);
      setNutritionist(null);
      setSessionExpired(true);
    }

    window.addEventListener('nutria:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('nutria:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        clearToken();
        clearNutritionist();
        setToken(null);
        setNutritionist(null);
        setSessionExpired(true);
      }
    }, EXPIRY_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    persistToken(data.token);
    persistNutritionist(data.nutritionist);
    setToken(data.token);
    setNutritionist(data.nutritionist);
    setSessionExpired(false);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    clearNutritionist();
    setToken(null);
    setNutritionist(null);
    setSessionExpired(false);
  }, []);

  const value = {
    token,
    nutritionist,
    isAuthenticated: Boolean(token),
    sessionExpired,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
