import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminFoodsPath, promoteFood } from './adminCatalog';

afterEach(() => vi.unstubAllGlobals());

describe('adminFoodsPath', () => {
  it('sin filtros pide el catálogo completo', () => {
    expect(adminFoodsPath()).toBe('/admin/foods');
    expect(adminFoodsPath({ owner: '', search: '   ', groupId: '' })).toBe('/admin/foods');
  });

  it('manda solo los filtros con valor', () => {
    expect(adminFoodsPath({ owner: 'common', search: ' ké ', groupId: 'g-1' })).toBe('/admin/foods?owner=common&search=k%C3%A9&groupId=g-1');
  });
});

describe('promoteFood', () => {
  it.each([
    ['sin nombre manda un body vacío', '', {}],
    ['con nombre lo renombra', 'Kéfir de leche', { name: 'Kéfir de leche' }],
  ])('%s', async (_case, name, body) => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'f-1', common: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await promoteFood('f-1', name);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/admin\/foods\/f-1\/promote$/);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual(body);
  });
});
