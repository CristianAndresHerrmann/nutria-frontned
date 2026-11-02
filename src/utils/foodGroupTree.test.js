import { describe, expect, it } from 'vitest';
import { flattenTree, groupPath, parentOptions } from './foodGroupTree';

const GROUPS = [
  { id: 'pescados', name: 'Pescados', parentId: 'carnes' },
  { id: 'lacteos', name: 'Lácteos', parentId: null },
  { id: 'carnes', name: 'Carnes, pescados y huevos', parentId: null },
  { id: 'aves', name: 'Aves', parentId: 'carnes' },
  { id: 'corral', name: 'Aves de corral', parentId: 'aves' },
];

describe('flattenTree', () => {
  it('ordena cada grupo seguido de sus subgrupos, con su profundidad', () => {
    const result = flattenTree(GROUPS).map(({ id, depth }) => [id, depth]);

    expect(result).toEqual([
      ['carnes', 0],
      ['aves', 1],
      ['corral', 2],
      ['pescados', 1],
      ['lacteos', 0],
    ]);
  });

  it('un grupo cuyo padre no vino en la lista queda como raíz y no se pierde', () => {
    const result = flattenTree([{ id: 'huerfano', name: 'Huérfano', parentId: 'no-esta' }]);

    expect(result).toEqual([{ id: 'huerfano', name: 'Huérfano', parentId: 'no-esta', depth: 0 }]);
  });
});

describe('groupPath', () => {
  it('arma la ruta desde la raíz', () => {
    expect(groupPath(GROUPS, 'corral')).toBe('Carnes, pescados y huevos › Aves › Aves de corral');
    expect(groupPath(GROUPS, 'lacteos')).toBe('Lácteos');
  });

  it('devuelve vacío para un grupo desconocido', () => {
    expect(groupPath(GROUPS, 'no-existe')).toBe('');
  });
});

describe('parentOptions', () => {
  const ids = (groups) => groups.map(({ id }) => id);

  it('en el alta ofrece todos los grupos, en el orden indentado', () => {
    expect(ids(parentOptions(GROUPS))).toEqual(ids(flattenTree(GROUPS)));
  });

  it('al editar excluye el grupo y sus subgrupos a cualquier profundidad', () => {
    expect(ids(parentOptions(GROUPS, 'carnes'))).toEqual(['lacteos']);
    expect(ids(parentOptions(GROUPS, 'aves'))).toEqual(['carnes', 'pescados', 'lacteos']);
    expect(ids(parentOptions(GROUPS, 'corral'))).toEqual(['carnes', 'aves', 'pescados', 'lacteos']);
  });
});
