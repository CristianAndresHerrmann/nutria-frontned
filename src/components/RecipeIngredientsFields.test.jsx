// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import RecipeIngredientsFields from './RecipeIngredientsFields';
import FoodPicker from './FoodPicker';
import { addIngredient, newIngredientRow } from '../pages/recipeFormMapping';
import { createFood, listFoodGroups, listFoods } from '../api/catalogs';

vi.mock('../api/catalogs', () => ({ createFood: vi.fn(), listFoodGroups: vi.fn(), listFoods: vi.fn() }));

let container;
let root;
const originalShow = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;
const created = { id: 'f-new', name: 'Kéfir ficticio', active: true, foodGroupId: 'g1', categories: ['protein'] };

// Lo mínimo de RecipeForm: las filas en el estado del padre y agregar con
// addIngredient, igual que en la pantalla.
function Recipe() {
  const [rows, setRows] = useState([newIngredientRow({ id: 'f1', name: 'Arroz', active: true }, '1 taza')]);
  return (
    <RecipeIngredientsFields
      rows={rows}
      onAdd={(food) => setRows((current) => addIngredient(current, food))}
      onQuantityChange={() => {}}
      onMove={() => {}}
      onRemove={() => {}}
    />
  );
}

async function type(element, value) {
  const prototype = Object.getPrototypeOf(element);
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  });
}

// Busca y espera el debounce del buscador.
async function search(text) {
  await type(container.querySelector('input[type="search"]'), text);
  await act(async () => vi.advanceTimersByTime(300));
}

// La opción de crear lleva debajo "No está en el catálogo": se compara el comienzo.
function button(text) {
  return [...document.body.querySelectorAll('button')].find((el) => el.textContent.startsWith(text));
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  listFoods.mockResolvedValue([]);
  listFoodGroups.mockResolvedValue([{ id: 'g1', name: 'Lácteos', parentId: null }]);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  HTMLDialogElement.prototype.showModal = originalShow;
  HTMLDialogElement.prototype.close = originalClose;
  document.body.style.overflow = '';
  vi.useRealTimers();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe('crear un ingrediente que no está en el catálogo (T26)', () => {
  it('sin resultados ofrece crearlo; al guardar queda agregado y la receta sigue igual', async () => {
    await act(async () => root.render(<Recipe />));
    createFood.mockResolvedValueOnce(created);

    await search('  Kéfir ficticio ');
    expect(listFoods).toHaveBeenCalledWith({ search: 'Kéfir ficticio' });
    await act(async () => button('+ Crear «Kéfir ficticio»').click());

    const dialog = document.body.querySelector('dialog');
    expect(dialog.querySelector('input').value).toBe('Kéfir ficticio');
    expect(container.querySelector('input[type="search"]').value).toBe('');

    await type(dialog.querySelector('select'), 'g1');
    await act(async () => dialog.querySelector('input[type="checkbox"]').click());
    await act(async () => dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

    expect(document.body.querySelector('dialog')).toBeNull();
    const rows = [...container.querySelectorAll('li')];
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('Arroz'),
      expect.stringContaining('Kéfir ficticio'),
    ]);
    expect(container.querySelector('input[aria-label="Cantidad de Arroz"]').value).toBe('1 taza');
  });

  it('cerrar el modal no agrega nada', async () => {
    await act(async () => root.render(<Recipe />));

    await search('Kéfir ficticio');
    await act(async () => button('+ Crear «Kéfir ficticio»').click());
    await act(async () => button('Cancelar').click());

    expect(document.body.querySelector('dialog')).toBeNull();
    expect(container.querySelectorAll('li')).toHaveLength(1);
    expect(createFood).not.toHaveBeenCalled();
  });

  it('sin onCreate (buscador de los planes) no se ofrece crear', async () => {
    await act(async () => root.render(<FoodPicker onSelect={() => {}} />));

    await search('Kéfir ficticio');

    expect(container.textContent).toContain('No hay alimentos con ese nombre');
    expect(container.textContent).not.toContain('+ Crear');
  });
});
