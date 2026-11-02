import { PAGE_SIZES, pageCount, pageRange } from '../utils/pagination';
import Button from './Button';
import { inputClass } from './FormField';
import iconArrowLeft from '../assets/icons/icon-arrow-left.svg';

// Pie de una tabla paginada (DA-33). Recibe lo que devuelve usePagination. Si
// todas las filas entran en la página más chica, no se muestra.
function TablePagination({ page, pageSize, total, setPage, setPageSize }) {
  if (total <= PAGE_SIZES[0]) return null;

  const { from, to } = pageRange(page, pageSize, total);
  const isFirst = page === 1;
  const isLast = page === pageCount(total, pageSize);

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col items-start gap-4 border-t border-line px-5 py-4 text-body-sm text-muted sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
    >
      <label className="flex items-center gap-2.5">
        Filas por página
        <select
          className={`${inputClass} max-w-20`}
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value))}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <div className="flex max-w-full flex-wrap items-center gap-3">
        <span aria-live="polite" className="whitespace-nowrap">
          {from}–{to} de {total}
        </span>
        <Button variant="icon" aria-label="Página anterior" disabled={isFirst} onClick={() => setPage(page - 1)}>
          <img src={iconArrowLeft} alt="" />
        </Button>
        <Button variant="icon" aria-label="Página siguiente" disabled={isLast} onClick={() => setPage(page + 1)}>
          <img src={iconArrowLeft} alt="" className="rotate-180" />
        </Button>
      </div>
    </nav>
  );
}

export default TablePagination;
