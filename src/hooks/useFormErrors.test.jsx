// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ApiError } from '../api/client';
import FormError from '../components/FormError';
import { FIELDS_NOTICE, useFormErrors } from './useFormErrors';

let container;
let root;
let current;

function Harness({ hasOtherErrors }) {
  const errors = useFormErrors({ hasOtherErrors });
  useEffect(() => { current = errors; });
  return <FormError message={errors.formError} />;
}

async function render(props = {}) {
  await act(async () => root.render(<Harness {...props} />));
}

async function run(action) {
  await act(async () => action(current));
}

function alertText() {
  return container.querySelector('[role="alert"]')?.textContent ?? null;
}

function validationError(fields) {
  return new ApiError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: Object.values(fields)[0],
    details: { fields },
  });
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('errores de formulario (T29)', () => {
  it('sin errores no muestra nada arriba del botón', async () => {
    await render();
    expect(current.fieldErrors).toEqual({});
    expect(alertText()).toBeNull();
  });

  it('un error con campos va a cada campo y arriba solo el aviso fijo, sin repetir el mensaje', async () => {
    await render();
    const fields = { name: 'El nombre es obligatorio', foodGroupId: 'Elegí un grupo' };
    await run((errors) => errors.showError(validationError(fields)));
    expect(current.fieldErrors).toEqual(fields);
    expect(alertText()).toBe(FIELDS_NOTICE);
  });

  it.each([
    ['un conflicto sin campos', { status: 409, code: 'CONFLICT', message: 'Ya existe un alimento con ese nombre', details: {} }],
    ['un error del servidor', { status: 500, code: 'INTERNAL_ERROR', message: 'El servidor no está disponible' }],
    ['un error de red', { status: 0, code: 'NETWORK_ERROR', message: 'No se pudo conectar con el servidor' }],
  ])('%s se muestra arriba del botón', async (_name, data) => {
    await render();
    await run((errors) => errors.showError(new ApiError(data)));
    expect(current.fieldErrors).toEqual({});
    expect(alertText()).toBe(data.message);
  });

  it('campos sin texto cuentan como un error sin campos', async () => {
    await render();
    const error = new ApiError({ status: 400, message: 'Datos inválidos', details: { fields: { name: undefined, email: '' } } });
    await run((errors) => errors.showError(error));
    expect(alertText()).toBe('Datos inválidos');
  });

  it('la validación local marca el campo y muestra el aviso fijo', async () => {
    await render();
    await run((errors) => errors.showFieldErrors({ birthDate: 'La fecha no puede ser futura' }));
    expect(current.fieldErrors).toEqual({ birthDate: 'La fecha no puede ser futura' });
    expect(alertText()).toBe(FIELDS_NOTICE);
  });

  it('el aviso sigue mientras quede un campo marcado y se va al corregir el último', async () => {
    await render();
    await run((errors) => errors.showError(validationError({ name: 'Obligatorio', title: 'Obligatorio' })));
    await run((errors) => errors.clearField('name'));
    expect(current.fieldErrors.name).toBeUndefined();
    expect(alertText()).toBe(FIELDS_NOTICE);
    await run((errors) => errors.clearField('title'));
    expect(alertText()).toBeNull();
  });

  it('un error nuevo reemplaza al anterior', async () => {
    await render();
    await run((errors) => errors.showError(validationError({ name: 'Obligatorio' })));
    await run((errors) => errors.showError(new ApiError({ status: 500, message: 'Falla del servidor' })));
    expect(current.fieldErrors).toEqual({});
    expect(alertText()).toBe('Falla del servidor');
    await run((errors) => errors.showError(validationError({ name: 'Obligatorio' })));
    expect(alertText()).toBe(FIELDS_NOTICE);
  });

  it('reset limpia los campos y el mensaje', async () => {
    await render();
    await run((errors) => errors.showError(new ApiError({ status: 500, message: 'Falla del servidor' })));
    await run((errors) => errors.reset());
    expect(current.fieldErrors).toEqual({});
    expect(alertText()).toBeNull();
  });

  it('los errores locales que el formulario guarda aparte también muestran el aviso fijo', async () => {
    await render({ hasOtherErrors: true });
    expect(alertText()).toBe(FIELDS_NOTICE);
  });
});
