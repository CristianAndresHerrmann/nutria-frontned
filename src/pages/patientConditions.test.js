import { describe, expect, it } from 'vitest';
import {
  EMPTY_CONDITION_FORM,
  conditionTargetName,
  conditionToForm,
  formToConditionPayload,
  groupConditionsByType,
} from './patientConditions';

const celiac = { id: 'c-1', type: 'pathology', pathologyId: 'p-1', pathology: { id: 'p-1', name: 'Celiaquía' } };
const nuts = { id: 'c-2', type: 'allergy', foodId: 'f-1', food: { id: 'f-1', name: 'Nueces' }, observations: 'Urticaria' };
const fish = { id: 'c-3', type: 'rejection', foodGroupId: 'g-1', foodGroup: { id: 'g-1', name: 'Pescados' } };

describe('groupConditionsByType', () => {
  it('arma los cinco bloques en orden, con los vacíos incluidos', () => {
    const groups = groupConditionsByType([fish, celiac, nuts]);

    expect(groups.map((group) => group.value)).toEqual(['pathology', 'allergy', 'intolerance', 'rejection', 'preference']);
    expect(groups.map((group) => group.conditions.length)).toEqual([1, 1, 0, 1, 0]);
  });
});

describe('conditionTargetName', () => {
  it('muestra la patología, el alimento o el grupo según lo que referencie', () => {
    expect([celiac, nuts, fish].map(conditionTargetName)).toEqual(['Celiaquía', 'Nueces', 'Pescados']);
  });
});

describe('formToConditionPayload', () => {
  it('una patología manda solo pathologyId, aunque haya quedado un alimento elegido', () => {
    const form = { ...EMPTY_CONDITION_FORM, type: 'pathology', pathologyId: 'p-1', foodId: 'f-1' };

    expect(formToConditionPayload(form)).toEqual({ type: 'pathology', pathologyId: 'p-1', observations: '' });
  });

  it('una condición sobre un alimento no manda el grupo', () => {
    const form = { ...EMPTY_CONDITION_FORM, type: 'allergy', target: 'food', foodId: 'f-1', foodGroupId: 'g-1' };

    expect(formToConditionPayload(form)).toEqual({ type: 'allergy', foodId: 'f-1', observations: '' });
  });

  it('una condición sobre un grupo no manda el alimento', () => {
    const form = { ...EMPTY_CONDITION_FORM, type: 'rejection', target: 'group', foodId: 'f-1', foodGroupId: 'g-1' };

    expect(formToConditionPayload(form)).toEqual({ type: 'rejection', foodGroupId: 'g-1', observations: '' });
  });

  it('no inventa datos: sin destino elegido lo manda vacío y lo valida el backend', () => {
    expect(formToConditionPayload(EMPTY_CONDITION_FORM)).toEqual({ type: 'allergy', foodId: '', observations: '' });
  });
});

describe('conditionToForm', () => {
  it('precarga una condición sobre un alimento y vuelve al mismo payload', () => {
    const form = conditionToForm(nuts);

    expect(form).toMatchObject({ type: 'allergy', target: 'food', foodId: 'f-1', foodName: 'Nueces' });
    expect(formToConditionPayload(form)).toEqual({ type: 'allergy', foodId: 'f-1', observations: 'Urticaria' });
  });

  it('precarga una condición sobre un grupo con el selector en grupo', () => {
    expect(conditionToForm(fish)).toMatchObject({ target: 'group', foodGroupId: 'g-1', observations: '' });
  });
});
