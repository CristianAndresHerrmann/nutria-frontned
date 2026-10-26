// Las rutas de cada rol: el administrador vive bajo /admin y el nutricionista
// en todo lo demás. Es solo navegación: el backend responde 403 a una cuenta
// en las rutas del otro rol.
export const ROLES = {
  nutritionist: 'nutritionist',
  admin: 'admin',
};

const ADMIN_PREFIX = '/admin';

export function homePathFor(role) {
  return role === ROLES.admin ? ADMIN_PREFIX : '/';
}

function isAdminPath(pathname) {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

export function isPathAllowedFor(role, pathname) {
  if (role === ROLES.admin) return isAdminPath(pathname);
  if (role === ROLES.nutritionist) return !isAdminPath(pathname);
  return false;
}

// A dónde ir después del login. `from` es la ruta que se quería abrir cuando
// la sesión no existía o venció: se respeta solo si es del rol que entró. Así
// un administrador que entra desde /pacientes/... no termina en una pantalla
// de nutricionista.
export function resolvePostLoginPath(role, from) {
  if (from && from !== '/login' && isPathAllowedFor(role, from)) return from;
  return homePathFor(role);
}
