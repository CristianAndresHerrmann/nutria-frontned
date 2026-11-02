import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, clampPage, pageCount, pageRange, pageSlice } from './pagination';

const items = Array.from({ length: 23 }, (_, index) => index + 1);

describe('paginación de tablas', () => {
  it('ofrece 10 y 25 filas por página, con 10 por defecto', () => {
    expect(PAGE_SIZES).toEqual([10, 25]);
    expect(DEFAULT_PAGE_SIZE).toBe(10);
  });

  it('cuenta las páginas, con una sola para una lista vacía', () => {
    expect(pageCount(0, 10)).toBe(1);
    expect(pageCount(10, 10)).toBe(1);
    expect(pageCount(23, 10)).toBe(3);
    expect(pageCount(23, 25)).toBe(1);
  });

  it('recorta la página al rango válido', () => {
    expect(clampPage(0, 23, 10)).toBe(1);
    expect(clampPage(5, 23, 10)).toBe(3);
    expect(clampPage(3, 23, 25)).toBe(1);
    expect(clampPage(2, 0, 10)).toBe(1);
  });

  it('devuelve las filas de la página, con la última parcial', () => {
    expect(pageSlice(items, 1, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(pageSlice(items, 3, 10)).toEqual([21, 22, 23]);
    expect(pageSlice([], 1, 10)).toEqual([]);
  });

  it('informa el rango de filas que muestra la página', () => {
    expect(pageRange(1, 10, 23)).toEqual({ from: 1, to: 10 });
    expect(pageRange(3, 10, 23)).toEqual({ from: 21, to: 23 });
    expect(pageRange(1, 25, 23)).toEqual({ from: 1, to: 23 });
    expect(pageRange(1, 10, 0)).toEqual({ from: 0, to: 0 });
  });
});
