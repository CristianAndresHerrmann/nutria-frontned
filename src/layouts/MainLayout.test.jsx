// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './MainLayout';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

let container;
let root;
let router;
const originalShow = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;
const logout = vi.fn();

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // jsdom no implementa dialog: se simula su apertura/cierre. La contención
  // nativa del foco y el backdrop real se comprueban en navegador.
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () {
    if (!this.open) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
  useAuth.mockReturnValue({ logout, role: 'nutritionist', nutritionist: { name: 'Profesional Ficticia', email: 'profesional.ficticia@example.test' } });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  router?.dispose();
  container.remove();
  HTMLDialogElement.prototype.showModal = originalShow;
  HTMLDialogElement.prototype.close = originalClose;
  document.body.style.overflow = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function render(role = 'nutritionist') {
  useAuth.mockReturnValue({ logout, role, nutritionist: { name: 'Profesional Ficticia', email: 'profesional.ficticia@example.test' } });
  router = createMemoryRouter([
    { element: <MainLayout />, children: [{ path: '*', element: <p>Contenido</p> }] },
    { path: '/login', element: <p>Login</p> },
  ], { initialEntries: [role === 'admin' ? '/admin/cuentas' : '/'] });
  await act(async () => root.render(<RouterProvider router={router} />));
}

const menuButton = () => container.querySelector('[aria-controls="mobile-navigation"]');
const panel = () => container.querySelector('dialog');
async function open() {
  menuButton().focus();
  await act(async () => menuButton().click());
}

describe('navegación móvil', () => {
  it('ofrece la identidad completa en escritorio mediante un disclosure nativo', async () => {
    await render();
    const details = container.querySelector('aside details');
    await act(async () => details.querySelector('summary').click());
    expect(details.open).toBe(true);
    expect(details.querySelector('div').textContent).toContain('Profesional Ficticia');
    expect(details.querySelector('div').textContent).toContain('profesional.ficticia@example.test');
    await act(async () => details.querySelector('summary').click());
    expect(details.open).toBe(false);
  });

  it('abre con foco en el panel, anuncia el estado y restaura scroll y foco', async () => {
    document.body.style.overflow = 'auto';
    await render();
    await open();
    expect(panel().open).toBe(true);
    expect(document.activeElement).toBe(panel());
    expect(menuButton().getAttribute('aria-expanded')).toBe('true');
    expect(document.body.style.overflow).toBe('hidden');
    await act(async () => panel().querySelector('[aria-label="Cerrar menú"]').click());
    expect(panel().open).toBe(false);
    expect(menuButton().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(menuButton());
    expect(document.body.style.overflow).toBe('auto');
  });

  it('cierra con la cancelación nativa de Escape y al tocar el overlay', async () => {
    await render();
    await open();
    await act(async () => panel().dispatchEvent(new Event('cancel', { cancelable: true })));
    expect(panel().open).toBe(false);
    await open();
    await act(async () => panel().dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 350 })));
    expect(panel().open).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('cierra al navegar, incluso al seleccionar la ruta actual', async () => {
    await render();
    await open();
    await act(async () => panel().querySelector('a[href="/"]').click());
    expect(panel().open).toBe(false);
    await open();
    await act(async () => router.navigate('/pacientes'));
    expect(panel().open).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it.each(['nutritionist', 'admin'])('conserva identidad, navegación por rol y logout: %s', async (role) => {
    await render(role);
    await open();
    expect(panel().textContent).toContain('Profesional Ficticia');
    expect(panel().textContent).toContain('profesional.ficticia@example.test');
    if (role === 'admin') {
      expect(panel().textContent).toContain('Administrador');
      expect(panel().querySelector('a[href="/admin/cuentas"]')).not.toBeNull();
      expect(panel().querySelector('a[href="/pacientes"]')).toBeNull();
    } else {
      expect(panel().textContent).toContain('Nutricionista');
      expect(panel().textContent).toContain('Próximamente');
      expect(panel().querySelectorAll('a')).toHaveLength(3);
      expect(panel().textContent.match(/Pronto/g)).toHaveLength(2);
    }
    await act(async () => panel().querySelector('[aria-label="Cerrar sesión"]').click());
    expect(logout).toHaveBeenCalled();
    expect(router.state.location.pathname).toBe('/login');
    expect(document.body.style.overflow).toBe('');
  });

  it('libera el scroll al pasar a escritorio o desmontarse', async () => {
    await render();
    await open();
    await act(async () => window.dispatchEvent(new Event('resize')));
    expect(panel().open).toBe(false);
    expect(document.body.style.overflow).toBe('');
    await open();
    await act(async () => router.navigate('/login'));
    expect(document.body.style.overflow).toBe('');
  });
});
