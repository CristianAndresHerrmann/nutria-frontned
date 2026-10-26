import { describe, expect, it } from 'vitest';
import { homePathFor, isPathAllowedFor, resolvePostLoginPath } from './roleRoutes';

describe('homePathFor', () => {
  it('lleva al administrador a /admin y al nutricionista a su inicio', () => {
    expect(homePathFor('admin')).toBe('/admin');
    expect(homePathFor('nutritionist')).toBe('/');
  });
});

describe('isPathAllowedFor', () => {
  it.each([
    ['admin', '/admin', true],
    ['admin', '/admin/cuentas', true],
    ['admin', '/pacientes', false],
    ['admin', '/', false],
    ['admin', '/administracion', false],
    ['nutritionist', '/pacientes/1', true],
    ['nutritionist', '/', true],
    ['nutritionist', '/admin', false],
    ['nutritionist', '/admin/cuentas', false],
    [null, '/', false],
  ])('%s en %s → %s', (role, pathname, expected) => {
    expect(isPathAllowedFor(role, pathname)).toBe(expected);
  });
});

describe('resolvePostLoginPath', () => {
  it('vuelve a la ruta que se quería abrir si es del rol que entró', () => {
    expect(resolvePostLoginPath('nutritionist', '/pacientes/1')).toBe('/pacientes/1');
    expect(resolvePostLoginPath('admin', '/admin/cuentas')).toBe('/admin/cuentas');
  });

  it('una ruta del otro rol lleva al inicio del rol que entró', () => {
    expect(resolvePostLoginPath('admin', '/pacientes/1')).toBe('/admin');
    expect(resolvePostLoginPath('nutritionist', '/admin/cuentas')).toBe('/');
  });

  it('sin ruta previa, o con /login, lleva al inicio del rol', () => {
    expect(resolvePostLoginPath('admin', undefined)).toBe('/admin');
    expect(resolvePostLoginPath('nutritionist', '/login')).toBe('/');
  });
});
