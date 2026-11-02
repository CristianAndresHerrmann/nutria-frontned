// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import DataTable from './DataTable';
import PasswordResetForm from './PasswordResetForm';

let container;
let root;
const onSubmit = vi.fn();
const rows = [{ id: 'ficticio', name: 'Profesional Ficticia' }];
const columns = [{ key: 'name', header: 'Nombre', cell: (row) => row.name }];

function Accounts() {
  const [state, setState] = useState({ password: '', isSubmitting: false, formError: '', fieldErrors: {} });
  return <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} renderExpanded={(row) => (
    <PasswordResetForm accountName={row.name} state={state} onStateChange={setState} onSubmit={onSubmit} onCancel={() => {}} />
  )} />;
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<Accounts />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe('restablecimiento entre variantes responsive', () => {
  it('comparte el borrador entre tarjeta y tabla, y envía el valor vigente desde cualquiera', async () => {
    const inputs = container.querySelectorAll('input');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(inputs[0], 'ClaveFicticia123');
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect([...inputs].map((node) => node.value)).toEqual(['ClaveFicticia123', 'ClaveFicticia123']);
    onSubmit.mockRejectedValueOnce({ message: 'Error ficticio', fields: { password: 'Error de contraseña ficticio' } });
    await act(async () => container.querySelector('table form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(onSubmit).toHaveBeenCalledWith('ClaveFicticia123');
    for (const form of container.querySelectorAll('form')) {
      expect(form.textContent).toContain('Error de contraseña ficticio');
      expect(form.querySelector('input').getAttribute('aria-invalid')).toBe('true');
      expect(form.querySelector('button[type="submit"]').disabled).toBe(false);
    }
  });

  it('mantiene bloqueado el envío en ambas variantes mientras espera la respuesta', async () => {
    let finish;
    onSubmit.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    await act(async () => container.querySelector('article form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    for (const form of container.querySelectorAll('form')) {
      expect(form.querySelector('button[type="submit"]').disabled).toBe(true);
      expect(form.textContent).toContain('Guardando...');
    }
    await act(async () => finish());
  });
});
