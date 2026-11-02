import { useEffect, useRef, useState } from 'react';
import { listFoods } from '../api/catalogs';
import { inputClass } from './FormField';
import searchIcon1 from '../assets/icons/search-1.svg';
import searchIcon2 from '../assets/icons/search-2.svg';

const SEARCH_DELAY_MS = 300;
const MAX_RESULTS = 8;
const OPTION = 'flex w-full min-w-0 flex-col items-start justify-between gap-1 break-words px-3.5 py-2 text-left text-sm sm:flex-row sm:items-center sm:gap-3';

// Buscador sobre el catálogo de alimentos (T15): los comunes y los privados del
// nutricionista, solo vigentes. Elegir uno llama a `onSelect(food)` y limpia la
// búsqueda. Los de `excludeIds` (ya elegidos) se muestran deshabilitados. Los
// textos por defecto son los de los ingredientes de una receta. Con `onCreate`,
// una búsqueda sin resultados ofrece crear el alimento con lo buscado (T26).
function FoodPicker({
  onSelect,
  onCreate,
  excludeIds = [],
  invalid = false,
  placeholder = 'Buscar un alimento del catálogo para agregarlo...',
  ariaLabel = 'Buscar alimento para agregar como ingrediente',
}) {
  const inputRef = useRef(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // La búsqueda va al backend; se espera a que se deje de tipear para no
  // disparar una request por tecla.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch) return undefined;

    let cancelled = false;

    listFoods({ search: debouncedSearch })
      .then((data) => {
        if (!cancelled) {
          setResults(data);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  function clear() {
    setSearch('');
    setDebouncedSearch('');
    setResults(null);
  }

  function choose(food) {
    onSelect(food);
    clear();
  }

  // El botón desaparece al limpiar la búsqueda: el foco pasa antes al buscador,
  // que es adonde vuelve al cerrar el modal.
  function create() {
    inputRef.current.focus();
    onCreate(search.trim());
    clear();
  }

  const isOpen = Boolean(search.trim() && debouncedSearch);

  return (
    <div className="relative min-w-0">
      <div className="relative">
        <span className="absolute top-1/2 left-3.5 size-4.25 -translate-y-1/2">
          <img src={searchIcon1} alt="" style={{ position: 'absolute', inset: '69.42% 12.5% 12.5% 69.42%' }} />
          <img src={searchIcon2} alt="" style={{ position: 'absolute', inset: '12.5% 20.83% 20.83% 12.5%' }} />
        </span>
        <input
          ref={inputRef}
          type="search"
          className={`${inputClass} pl-10`}
          placeholder={placeholder}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            // Enter en el buscador no envía el formulario que lo contiene.
            if (event.key === 'Enter') event.preventDefault();
            if (event.key === 'Escape') setSearch('');
          }}
          aria-label={ariaLabel}
          aria-invalid={invalid}
        />
      </div>

      {isOpen && (
        <div className="relative z-10 mt-1 max-h-72 overflow-y-auto overscroll-contain rounded-xl border border-line bg-white shadow-card xl:absolute xl:inset-x-0 xl:top-full xl:max-h-none">
          {error && (
            <p className="px-3.5 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          {!error && !results && <p className="px-3.5 py-2 text-sm text-muted">Buscando...</p>}
          {!error && results && results.length === 0 && !onCreate && (
            <p className="px-3.5 py-2 text-sm text-muted">
              No hay alimentos con ese nombre. Si falta, cargalo desde Catálogos › Alimentos.
            </p>
          )}
          {!error && results && results.length === 0 && onCreate && (
            <button type="button" className={`${OPTION} font-medium text-primary hover:bg-surface`} onClick={create}>
              <span className="min-w-0 max-w-full">+ Crear «{search.trim()}»</span>
              <span className="min-w-0 max-w-full text-note text-muted">No está en el catálogo</span>
            </button>
          )}
          {!error && results && results.length > 0 && (
            <ul className="divide-y divide-line">
              {results.slice(0, MAX_RESULTS).map((food) => {
                const alreadyAdded = excludeIds.includes(food.id);
                return (
                  <li key={food.id}>
                    <button
                      type="button"
                      className={`${OPTION} ${alreadyAdded ? 'cursor-not-allowed text-muted' : 'text-ink hover:bg-surface'}`}
                      onClick={() => choose(food)}
                      disabled={alreadyAdded}
                    >
                      <span className="min-w-0 max-w-full">{food.name}</span>
                      <span className="min-w-0 max-w-full text-note text-muted">{alreadyAdded ? 'Ya agregado' : food.foodGroup?.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default FoodPicker;
