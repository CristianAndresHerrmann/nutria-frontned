import { describe, expect, it } from 'vitest';
import { formToPayload, toggleCategory } from './foodFormMapping';
import { foodsPath } from '../api/catalogs';

describe('formToPayload', () => {
  it('manda nombre, grupo y categorías, en el orden del formulario y no en el que se marcaron', () => {
    const payload = formToPayload({ name: 'Caballa', foodGroupId: 'pescados', categories: ['healthy_fat', 'protein'] });

    expect(payload).toEqual({ name: 'Caballa', foodGroupId: 'pescados', categories: ['protein', 'healthy_fat'] });
  });

  it('no inventa datos: un formulario vacío se manda vacío y lo valida el backend', () => {
    expect(formToPayload({ name: '', foodGroupId: '', categories: [] })).toEqual({ name: '', foodGroupId: '', categories: [] });
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
  it('sin filtros pide el listado completo', () => {
    expect(foodsPath()).toBe('/foods');
    expect(foodsPath({ search: '   ', groupId: '' })).toBe('/foods');
  });

  it('agrega solo los filtros con valor', () => {
    expect(foodsPath({ search: ' caba ', groupId: 'g-1' })).toBe('/foods?search=caba&groupId=g-1');
  });
});
