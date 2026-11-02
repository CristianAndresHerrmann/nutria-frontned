import { afterEach, describe, expect, it, vi } from 'vitest';
import { setRecipeAvailability, updateRecipe } from './recipes';
import { ApiError } from './client';

afterEach(() => vi.unstubAllGlobals());

describe('disponibilidad de recetas (AUD-008)', () => {
  it.each([false, true])('envía solo disponibilidad=%s por PATCH y devuelve la receta actual del servidor', async (availableInCatalog) => {
    const updated = { id: 'r-1', name: 'Nombre editado en otra pestaña', availableInCatalog };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(updated), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(setRecipeAvailability('r-1', availableInCatalog)).resolves.toEqual(updated);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/recipes\/r-1$/);
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body)).toEqual({ availableInCatalog });
  });

  it('propaga el error del backend para que el listado lo muestre', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      error: { code: 'NOT_FOUND', message: 'Receta no encontrada' },
    }), { status: 404 })));

    await expect(setRecipeAvailability('r-1', false)).rejects.toMatchObject({
      name: ApiError.name, status: 404, code: 'NOT_FOUND', message: 'Receta no encontrada',
    });
  });

  it('la edición completa del formulario sigue enviándose por PUT', async () => {
    const data = { name: 'Edición', ingredients: [{ foodId: 'f-1' }], mealTypes: ['lunch'], availableInCatalog: true };
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'r-1', ...data }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await updateRecipe('r-1', data);

    expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(data);
  });
});
