import { describe, expect, it } from 'vitest';
import {
  EMPTY_RECOMMENDATION_FORM,
  formToPayload,
  groupByPathology,
  recommendationToForm,
} from './recommendationFormMapping';
import { recommendationsPath } from '../api/recommendations';

const celiaquia = { id: 'celiaquia', name: 'Celiaquía' };
const diabetes = { id: 'diabetes', name: 'Diabetes' };

const recommendation = {
  id: 'r-1',
  pathologyId: 'celiaquia',
  pathology: celiaquia,
  title: 'Ejemplo ficticio',
  text: 'Texto de ejemplo.',
  active: false,
  own: true,
};

describe('recommendationsPath', () => {
  it('sin filtros pide el listado completo', () => {
    expect(recommendationsPath()).toBe('/clinical-recommendations');
    expect(recommendationsPath({ pathologyId: '', includeInactive: false })).toBe('/clinical-recommendations');
  });

  it('agrega solo los filtros con valor', () => {
    expect(recommendationsPath({ pathologyId: 'celiaquia', includeInactive: true })).toBe(
      '/clinical-recommendations?pathologyId=celiaquia&includeInactive=true',
    );
    expect(recommendationsPath({ includeInactive: true })).toBe('/clinical-recommendations?includeInactive=true');
  });
});

describe('recommendationFormMapping', () => {
  it('la recomendación pasa al formulario y vuelve igual en la edición', () => {
    const form = recommendationToForm(recommendation);

    expect(form).toEqual({ pathologyId: 'celiaquia', title: 'Ejemplo ficticio', text: 'Texto de ejemplo.', active: false });
    expect(formToPayload(form, { isEditMode: true })).toEqual(form);
  });

  it('el alta no manda active: nace vigente', () => {
    const payload = formToPayload({ ...EMPTY_RECOMMENDATION_FORM, pathologyId: 'diabetes', title: 'T', text: 'X' });

    expect(payload).toEqual({ pathologyId: 'diabetes', title: 'T', text: 'X' });
  });

  it('los vacíos se mandan tal cual para que el backend marque el campo', () => {
    expect(formToPayload(EMPTY_RECOMMENDATION_FORM)).toEqual({ pathologyId: '', title: '', text: '' });
  });
});

describe('groupByPathology', () => {
  it('agrupa en el orden en que llegan y deja afuera las patologías sin recomendaciones', () => {
    const items = [
      { id: 'a', pathology: celiaquia },
      { id: 'b', pathology: celiaquia },
      { id: 'c', pathology: diabetes },
    ];

    expect(groupByPathology(items)).toEqual([
      { pathology: celiaquia, recommendations: [items[0], items[1]] },
      { pathology: diabetes, recommendations: [items[2]] },
    ]);
  });

  it('una lista vacía no tiene grupos', () => {
    expect(groupByPathology([])).toEqual([]);
  });
});
