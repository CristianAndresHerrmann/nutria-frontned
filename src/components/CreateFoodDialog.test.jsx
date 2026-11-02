// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import CreateFoodDialog from './CreateFoodDialog';
import { createFood, listFoodGroups } from '../api/catalogs';
import { FIELDS_NOTICE } from '../hooks/useFormErrors';

vi.mock('../api/catalogs', () => ({ createFood: vi.fn(), listFoodGroups: vi.fn() }));

let container;
let root;
const onCreated = vi.fn();
const onClose = vi.fn();
const outerSubmit = vi.fn((event) => event.preventDefault());
const originalShow = HTMLDialogElement.prototype.showModal;
const originalClose = HTMLDialogElement.prototype.close;
const DUPLICATE = 'Ya existe un alimento con ese nombre';
const created = { id: 'f-new', name: 'Kéfir ficticio', active: true, foodGroupId: 'g1', categories: ['protein'] };

async function type(element, value) {
  const prototype = Object.getPrototypeOf(element);
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  });
}

function dialog() {
  return document.body.querySelector('dialog');
}

async function fillAndSubmit() {
  await type(dialog().querySelector('select'), 'g1');
  await act(async () => dialog().querySelector('input[type="checkbox"]').click());
  await act(async () => dialog().querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  // jsdom no implementa dialog: se simula su apertura/cierre. La contención
  // nativa del foco y el backdrop real se comprueban en navegador.
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  listFoodGroups.mockResolvedValue([{ id: 'g1', name: 'Lácteos', parentId: null }]);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  // Se abre desde dentro del formulario de la receta, como en la pantalla real.
  await act(async () => root.render(
    <form onSubmit={outerSubmit}>
      <CreateFoodDialog initialName="Kéfir ficticio" onCreated={onCreated} onClose={onClose} />
    </form>,
  ));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  HTMLDialogElement.prototype.showModal = originalShow;
  HTMLDialogElement.prototype.close = originalClose;
  document.body.style.overflow = '';
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe('alta de un alimento desde la receta (T26)', () => {
  it('se abre con el nombre buscado, fuera del formulario de la receta y con el aviso de privado', () => {
    expect(dialog().open).toBe(true);
    expect(container.contains(dialog())).toBe(false);
    expect(dialog().querySelector('input').value).toBe('Kéfir ficticio');
    expect(dialog().querySelector('select').textContent).toContain('Lácteos');
    expect(dialog().textContent).toContain('queda disponible solo para vos');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('guardar crea el alimento y lo entrega, sin enviar la receta', async () => {
    createFood.mockResolvedValueOnce(created);

    await fillAndSubmit();

    expect(createFood).toHaveBeenCalledWith({ name: 'Kéfir ficticio', foodGroupId: 'g1', categories: ['protein'] });
    expect(onCreated).toHaveBeenCalledWith(created);
    expect(outerSubmit).not.toHaveBeenCalled();
  });

  it('un nombre repetido se muestra en su campo y el modal no se cierra', async () => {
    createFood.mockRejectedValueOnce({ message: DUPLICATE, fields: { name: DUPLICATE } });

    await fillAndSubmit();

    expect(onCreated).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog().open).toBe(true);
    expect(dialog().querySelector('input').getAttribute('aria-invalid')).toBe('true');
    expect(dialog().textContent).toContain(DUPLICATE);
    expect(dialog().querySelector('[role="alert"]').textContent).toBe(FIELDS_NOTICE);
    expect(dialog().querySelector('button[type="submit"]').disabled).toBe(false);
  });

  it('Cancelar y Escape cierran sin crear nada', async () => {
    const cancel = [...dialog().querySelectorAll('button')].find((el) => el.textContent === 'Cancelar');
    await act(async () => cancel.click());
    await act(async () => dialog().dispatchEvent(new Event('cancel', { cancelable: true })));

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(createFood).not.toHaveBeenCalled();
    expect(outerSubmit).not.toHaveBeenCalled();
  });
});
