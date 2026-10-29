// Paginación de las tablas en el cliente (DA-33): la API devuelve todas las filas
// y la pantalla muestra una página por vez.

export const PAGE_SIZES = [10, 25];
export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];

// Una lista vacía tiene una página (vacía), para que "página 1" siempre exista.
export function pageCount(total, pageSize) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function clampPage(page, total, pageSize) {
  return Math.min(Math.max(1, page), pageCount(total, pageSize));
}

export function pageSlice(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// Filas que muestra la página, contando desde 1: { from: 11, to: 20 }.
export function pageRange(page, pageSize, total) {
  if (total === 0) return { from: 0, to: 0 };
  return { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total) };
}
