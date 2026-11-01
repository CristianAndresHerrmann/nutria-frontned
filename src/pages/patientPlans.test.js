import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import {
  findingCounts,
  generationErrorMessage,
  groupFindings,
  editableRecommendationSections,
  itemDisplay,
  optionDescription,
  planStatusLabel,
  planTextSections,
  recommendationSections,
  severityBadge,
} from './patientPlans';

// Ítems con la forma del serializer: lo que no aplica a su tipo llega en null.
const baseItem = { foodName: null, foodCategories: [], foodGroupName: null, recipe: null, originalText: null };

describe('planStatusLabel', () => {
  it('traduce el estado del backend', () => {
    expect(planStatusLabel('draft')).toBe('Borrador');
  });

  it('deja tal cual un estado que todavía no conoce', () => {
    expect(planStatusLabel('approved')).toBe('approved');
  });
});

describe('itemDisplay', () => {
  it.each([
    [{ ...baseItem, type: 'food', foodName: 'Pollo', foodCategories: ['protein'] }, { text: 'Pollo', kind: null }],
    [{ ...baseItem, type: 'food_group', foodGroupName: 'Frutas' }, { text: 'Frutas', kind: 'Grupo' }],
    [{ ...baseItem, type: 'recipe', recipe: { id: 'r', name: 'Tarta de verdura', availableInCatalog: true } }, { text: 'Tarta de verdura', kind: 'Receta' }],
    [{ ...baseItem, type: 'unrecognized', originalText: 'Agua' }, { text: 'Agua', kind: 'No reconocido' }],
  ])('muestra el nombre según el tipo %#', (item, expected) => {
    expect(itemDisplay(item)).toEqual(expected);
  });
});

describe('optionDescription', () => {
  it.each([
    [{ order: 1, description: 'Opción 1' }, null],
    [{ order: 2, description: ' opción 2 ' }, null],
    [{ order: 1, description: null }, null],
    [{ order: 1, description: '' }, null],
    [{ order: 3, description: 'Opción con receta' }, 'Opción con receta'],
    [{ order: 1, description: 'Opción 2' }, 'Opción 2'],
  ])('omite la descripción que repite el título %#', (option, expected) => {
    expect(optionDescription(option)).toBe(expected);
  });
});

describe('severityBadge', () => {
  it('diferencia bloqueante de advertencia', () => {
    expect(severityBadge('blocking')).toEqual({ label: 'Bloqueante', tone: 'danger' });
    expect(severityBadge('warning')).toEqual({ label: 'Advertencia', tone: 'warning' });
  });
});

describe('groupFindings y findingCounts', () => {
  const findings = [
    { id: 'f1', severity: 'blocking', optionId: 'o1', optionItemId: 'i1', message: '"Agua" no está en el catálogo' },
    { id: 'f2', severity: 'blocking', optionId: 'o1', optionItemId: 'i1', message: 'Agua: alergia' },
    { id: 'f3', severity: 'warning', optionId: 'o1', optionItemId: null, message: 'Opción 1 del desayuno: falta fruta' },
    { id: 'f4', severity: 'warning', optionId: null, optionItemId: null, message: 'Hallazgo general' },
  ];

  it('ubica cada hallazgo en su ítem, su opción o arriba, en el orden del backend', () => {
    const { byItem, byOption, general } = groupFindings(findings);

    expect(byItem.get('i1').map((f) => f.id)).toEqual(['f1', 'f2']);
    expect(byOption.get('o1').map((f) => f.id)).toEqual(['f3']);
    expect(general.map((f) => f.id)).toEqual(['f4']);
  });

  it('un ítem u opción sin hallazgos no tiene entrada', () => {
    const { byItem, byOption } = groupFindings(findings);

    expect(byItem.get('i2')).toBeUndefined();
    expect(byOption.get('o2')).toBeUndefined();
  });

  it('cuenta bloqueantes y advertencias', () => {
    expect(findingCounts(findings)).toEqual({ blocking: 2, warning: 2 });
    expect(findingCounts([])).toEqual({ blocking: 0, warning: 0 });
  });
});

describe('secciones de texto', () => {
  const plan = {
    situationalDiagnosis: 'Diagnóstico',
    introduction: null,
    objectives: 'Objetivos',
    generalRecommendations: 'Generales',
    contextualRecommendations: null,
    clinicalRecommendations: null,
    thematicRecommendations: 'Temáticas',
  };

  it('siempre devuelve diagnóstico, introducción y objetivos, aunque estén vacíos', () => {
    expect(planTextSections(plan)).toEqual([
      { name: 'situationalDiagnosis', label: 'Diagnóstico situacional', text: 'Diagnóstico' },
      { name: 'introduction', label: 'Introducción', text: null },
      { name: 'objectives', label: 'Objetivos', text: 'Objetivos' },
    ]);
  });

  it('devuelve solo las recomendaciones cargadas, en orden', () => {
    expect(recommendationSections(plan)).toEqual([
      { name: 'generalRecommendations', label: 'Generales', text: 'Generales' },
      { name: 'thematicRecommendations', label: 'Temáticas', text: 'Temáticas' },
    ]);
  });
});

describe('editableRecommendationSections', () => {
  const plan = { generalRecommendations: 'Generales', contextualRecommendations: null, thematicRecommendations: null };

  it('las que escribe la IA siempre se editan, aunque estén vacías', () => {
    expect(editableRecommendationSections({ ...plan, clinicalRecommendations: null })).toEqual([
      { name: 'generalRecommendations', label: 'Generales' },
      { name: 'contextualRecommendations', label: 'Contextuales' },
      { name: 'thematicRecommendations', label: 'Temáticas' },
    ]);
  });

  it('las clínicas aparecen solo si el plan las tiene', () => {
    expect(editableRecommendationSections({ ...plan, clinicalRecommendations: 'Del catálogo' }).map(({ name }) => name)).toEqual([
      'generalRecommendations',
      'contextualRecommendations',
      'clinicalRecommendations',
      'thematicRecommendations',
    ]);
  });
});

describe('generationErrorMessage', () => {
  const unavailable = (reason) => new ApiError({
    status: 503, code: 'IA_UNAVAILABLE', message: 'El servicio de IA no está disponible', details: { reason },
  });

  it.each(['timeout', 'provider_timeout'])('un %s de la IA avisa que tardó y que no se creó nada', (reason) => {
    expect(generationErrorMessage(unavailable(reason))).toBe(
      'El servicio de IA tardó demasiado en responder. No se creó ningún plan. Podés reintentar.',
    );
  });

  it('una salida inválida avisa el formato', () => {
    expect(generationErrorMessage(unavailable('invalid_output'))).toBe(
      'La propuesta recibida no tenía un formato válido. No se creó ningún plan. Podés reintentar.',
    );
  });

  it.each(['unreachable', 'provider_error', 'bad_status', 'bad_body'])('%s usa el mensaje del backend', (reason) => {
    expect(generationErrorMessage(unavailable(reason))).toBe(
      'El servicio de IA no está disponible. No se creó ningún plan. Podés reintentar.',
    );
  });

  it('un timeout del cliente pide revisar el listado antes de reintentar', () => {
    const err = new ApiError({ status: 0, code: 'TIMEOUT', message: 'El servidor tardó demasiado en responder.' });
    expect(generationErrorMessage(err)).toMatch(/pudo haberse generado: revisá el listado/);
  });

  it('cualquier otro error muestra su mensaje', () => {
    const err = new ApiError({ status: 404, code: 'NOT_FOUND', message: 'Paciente no encontrado' });
    expect(generationErrorMessage(err)).toBe('Paciente no encontrado');
  });
});
