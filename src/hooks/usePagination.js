import { useState } from 'react';
import { DEFAULT_PAGE_SIZE, clampPage, pageSlice } from '../utils/pagination';

// Página y tamaño de página de una tabla (DA-33). La página se guarda junto con la
// resetKey con la que se eligió: si la clave cambia (otra búsqueda u otro filtro),
// la página vuelve a 1 sin esperar a un efecto. Editar una fila en el lugar no
// cambia la clave, así que la página se mantiene.
export function usePagination(items, { resetKey = '' } = {}) {
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [selection, setSelection] = useState({ key: resetKey, page: 1 });

  const total = items.length;
  const requested = selection.key === resetKey ? selection.page : 1;
  // Si la lista se achica, la página no queda fuera de rango.
  const page = clampPage(requested, total, pageSize);

  function setPage(next) {
    setSelection({ key: resetKey, page: next });
  }

  function setPageSize(next) {
    setPageSizeState(next);
    setSelection({ key: resetKey, page: 1 });
  }

  return { pageItems: pageSlice(items, page, pageSize), page, pageSize, total, setPage, setPageSize };
}
