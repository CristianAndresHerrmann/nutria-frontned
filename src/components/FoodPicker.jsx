import { useEffect, useState } from 'react';
import { listFoods } from '../api/catalogs';
import { inputClass } from './FormField';
import searchIcon1 from '../assets/icons/search-1.svg';
import searchIcon2 from '../assets/icons/search-2.svg';

const SEARCH_DELAY_MS = 300;
const MAX_RESULTS = 8;
const OPTION = 'flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm';

// Buscador sobre el catálogo de alimentos (T15): los comunes y los privados del
// nutricionista, solo vigentes. Elegir uno llama a `onSelect(food)` y limpia la
// búsqueda. Los de `excludeIds` (ya elegidos) se muestran deshabilitados.
function FoodPicker({ onSelect, excludeIds = [], invalid = false }) {
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

  function choose(food) {
    onSelect(food);
    setSearch('');
    setDebouncedSearch('');
    setResults(null);
  }

  const isOpen = Boolean(search.trim() && debouncedSearch);

  return (
    <div className="relative">
      <span className="absolute top-1/2 left-3.5 size-4.25 -translate-y-1/2">
        <img src={searchIcon1} alt="" style={{ position: 'absolute', inset: '69.42% 12.5% 12.5% 69.42%' }} />
        <img src={searchIcon2} alt="" style={{ position: 'absolute', inset: '12.5% 20.83% 20.83% 12.5%' }} />
      </span>
      <input
        type="search"
        className={`${inputClass} pl-10`}
        placeholder="Buscar un alimento del catálogo para agregarlo..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          // Enter en el buscador no envía el formulario de la receta.
          if (event.key === 'Enter') event.preventDefault();
          if (event.key === 'Escape') setSearch('');
        }}
        aria-label="Buscar alimento para agregar como ingrediente"
        aria-invalid={invalid}
      />

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          {error && (
            <p className="px-3.5 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          {!error && !results && <p className="px-3.5 py-2 text-sm text-muted">Buscando...</p>}
          {!error && results && results.length === 0 && (
            <p className="px-3.5 py-2 text-sm text-muted">
              No hay alimentos con ese nombre. Si falta, cargalo desde Catálogos › Alimentos.
            </p>
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
                      <span>{food.name}</span>
                      <span className="text-note text-muted">{alreadyAdded ? 'Ya agregado' : food.foodGroup?.name}</span>
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
