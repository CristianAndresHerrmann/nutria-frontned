// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DataTable from './DataTable';
import PromoteFoodForm from './PromoteFoodForm';

let container;
let root;
const onSubmit = vi.fn();
const rows = [{ id: 'kefir', name: 'Kéfir ficticio' }];
const columns = [{ key: 'name', header: 'Alimento', cell: (row) => row.name }];
const EMPTY_PROMOTE_STATE = { name: '', isSubmitting: false, formError: '', fieldErrors: {} };
const CONFLICT = 'Otro nutricionista tiene un alimento privado vigente con ese nombre: renombralo o dalo de baja';

function Foods() {
  const [state, setState] = useState(EMPTY_PROMOTE_STATE);
  return <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} renderExpanded={(row) => (
    <PromoteFoodForm food={row} state={state} onStateChange={setState} onSubmit={onSubmit} onCancel={() => {}} />
  )} />;
}

async function type(input, value) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function submit(form) {
  await act(async () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<Foods />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe('pasar un alimento al común (T25)', () => {
  it('sin nombre conserva el actual: envía un nombre vacío', async () => {
    onSubmit.mockResolvedValueOnce(undefined);

    await submit(container.querySelector('table form'));

    expect(onSubmit).toHaveBeenCalledWith('');
  });

  it('el 409 del nombre se muestra en el campo de ambas variantes, y se reintenta con otro', async () => {
    onSubmit.mockRejectedValueOnce({ message: CONFLICT, fields: { name: CONFLICT } });

    await submit(container.querySelector('article form'));

    for (const form of container.querySelectorAll('form')) {
      expect(form.textContent).toContain(CONFLICT);
      expect(form.querySelector('input').getAttribute('aria-invalid')).toBe('true');
      expect(form.querySelector('button[type="submit"]').disabled).toBe(false);
    }

    onSubmit.mockResolvedValueOnce(undefined);
    await type(container.querySelector('table input'), '  Kéfir de leche ');
    await submit(container.querySelector('table form'));
    expect(onSubmit).toHaveBeenLastCalledWith('Kéfir de leche');
  });

  it('un error sin campos (ya es común) se muestra arriba de los botones', async () => {
    onSubmit.mockRejectedValueOnce({ message: 'El alimento ya es común', fields: {} });

    await submit(container.querySelector('table form'));

    expect(container.querySelector('table [role="alert"]').textContent).toBe('El alimento ya es común');
  });
});
