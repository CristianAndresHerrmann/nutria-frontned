import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// El texto se lee al importar el módulo (en el build real lo fija Vite), así que
// cada caso fija la variable y vuelve a importar el componente.
async function renderBanner(label) {
  vi.stubEnv('VITE_ENV_LABEL', label);
  vi.resetModules();
  const { default: EnvironmentBanner } = await import('./EnvironmentBanner');
  return renderToStaticMarkup(createElement(EnvironmentBanner));
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('aviso de entorno de prueba', () => {
  it('muestra el texto de VITE_ENV_LABEL', async () => {
    const html = await renderBanner('Entorno de prueba — solo datos ficticios');

    expect(html).toContain('role="note"');
    expect(html).toContain('Entorno de prueba — solo datos ficticios');
  });

  it('no renderiza nada sin VITE_ENV_LABEL (desarrollo local)', async () => {
    expect(await renderBanner('')).toBe('');
  });
});
