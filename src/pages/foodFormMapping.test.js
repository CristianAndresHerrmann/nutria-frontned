import { describe, expect, it } from 'vitest';
import { foodToForm, formToPayload, toggleCategory } from './foodFormMapping';
import { foodsPath } from '../api/catalogs';

const form = { name: 'Caballa', foodGroupId: 'pescados', categories: ['healthy_fat', 'protein'], active: false };

describe('formToPayload', () => {
  it('el alta no manda active: el alimento nace vigente', () => {
    expect(formToPayload(form, { isEditMode: false })).toEqual({
      name: 'Caballa',
      foodGroupId: 'pescados',
      categories: ['protein', 'healthy_fat'],
    });
  });

  it('la edición manda active, que es la baja lógica', () => {
    expect(formToPayload(form, { isEditMode: true }).active).toBe(false);
  });

  it('manda las categorías en el orden del formulario, no en el que se marcaron', () => {
    const payload = formToPayload({ ...form, categories: ['infusion', 'protein', 'fiber'] }, { isEditMode: false });

    expect(payload.categories).toEqual(['protein', 'fiber', 'infusion']);
  });
});

describe('foodToForm', () => {
  it('carga el alimento de la API en el formulario', () => {
    const food = {
      id: 'x',
      name: 'Caballa',
      foodGroupId: 'pescados',
      categories: ['protein'],
      active: true,
      editable: true,
      foodGroup: { id: 'pescados', name: 'Pescados', parentId: 'carnes' },
    };

    expect(foodToForm(food)).toEqual({ name: 'Caballa', foodGroupId: 'pescados', categories: ['protein'], active: true });
  });
});

describe('toggleCategory', () => {
  it('marca y desmarca sin repetir', () => {
    expect(toggleCategory(['protein'], 'fiber', true)).toEqual(['protein', 'fiber']);
    expect(toggleCategory(['protein', 'fiber'], 'protein', true)).toEqual(['fiber', 'protein']);
    expect(toggleCategory(['protein', 'fiber'], 'protein', false)).toEqual(['fiber']);
  });
});

describe('foodsPath', () => {
  it('sin filtros pide el listado de vigentes', () => {
    expect(foodsPath()).toBe('/foods');
    expect(foodsPath({ search: '   ', groupId: '', includeInactive: false })).toBe('/foods');
  });

  it('agrega solo los filtros con valor', () => {
    expect(foodsPath({ search: ' caba ', groupId: 'g-1', includeInactive: true })).toBe(
      '/foods?search=caba&groupId=g-1&includeInactive=true',
    );
  });
});
