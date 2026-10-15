import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listFoodGroups, listFoods } from '../api/catalogs';
import { flattenTree, groupPath } from '../utils/foodGroupTree';
import { categoryLabel } from '../utils/foodCategories';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { inputClass } from '../components/FormField';
import searchIcon1 from '../assets/icons/search-1.svg';
import searchIcon2 from '../assets/icons/search-2.svg';

const TH = 'px-5 py-3 text-left text-xs font-bold tracking-[0.3px] text-muted uppercase';
const TD = 'px-5 py-3 text-body-sm';
const SEARCH_DELAY_MS = 300;

// Sangría de las opciones del selector según la profundidad del grupo. Un
// <option> no admite estilos, y los espacios comunes se colapsan: van NBSP.
function indent(depth) {
  return '    '.repeat(depth);
}

function Foods() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [foods, setFoods] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [groupId, setGroupId] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    listFoodGroups()
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // La búsqueda va al backend; se espera a que se deje de tipear para no
  // disparar una request por tecla.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    listFoods({ search: debouncedSearch, groupId, includeInactive })
      .then((data) => {
        if (!cancelled) {
          setFoods(data);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, groupId, includeInactive]);

  const groupOptions = useMemo(() => flattenTree(groups), [groups]);
  const hasFilters = Boolean(debouncedSearch.trim() || groupId || includeInactive);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-4 border-b border-line p-5">
        <div className="relative w-full max-w-80">
          <span className="absolute top-1/2 left-3.5 size-4.25 -translate-y-1/2">
            <img src={searchIcon1} alt="" style={{ position: 'absolute', inset: '69.42% 12.5% 12.5% 69.42%' }} />
            <img src={searchIcon2} alt="" style={{ position: 'absolute', inset: '12.5% 20.83% 20.83% 12.5%' }} />
          </span>
          <input
            type="search"
            className={`${inputClass} pl-10`}
            placeholder="Buscar alimento..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar alimento por nombre"
          />
        </div>

        <select
          className={`${inputClass} max-w-64`}
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
          aria-label="Filtrar por grupo"
        >
          <option value="">Todos los grupos</option>
          {groupOptions.map((group) => (
            <option key={group.id} value={group.id}>
              {indent(group.depth)}
              {group.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={includeInactive} onChange={(event) => setIncludeInactive(event.target.checked)} />
          <span>Mostrar dados de baja</span>
        </label>

        <div className="ml-auto flex items-center gap-4">
          {foods && <span className="text-body-sm whitespace-nowrap text-muted">{foods.length} alimentos</span>}
          <Button onClick={() => navigate('/catalogos/alimentos/nuevo')}>+ Nuevo alimento</Button>
        </div>
      </div>

      {!foods && !error && <p className="p-5 text-sm text-muted">Cargando alimentos...</p>}
      {error && (
        <p className="p-5 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {foods && !error && foods.length === 0 && (
        <p className="p-5 text-sm text-muted">
          {hasFilters ? 'No hay alimentos que coincidan con la búsqueda.' : 'Todavía no hay alimentos cargados.'}
        </p>
      )}

      {foods && !error && foods.length > 0 && (
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-soft/45">
              <th className={TH}>Alimento</th>
              <th className={TH}>Grupo</th>
              <th className={TH}>Categorías</th>
              <th className={TH}>Estado</th>
              <th className={TH} />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {foods.map((food) => (
              <tr key={food.id}>
                <td className={TD}>
                  <span className="text-sm font-semibold text-ink">{food.name}</span>
                </td>
                <td className={`${TD} text-muted`}>{groupPath(groups, food.foodGroupId) || food.foodGroup?.name}</td>
                <td className={TD}>
                  <div className="flex flex-wrap gap-1.5">
                    {food.categories.map((category) => (
                      <Badge key={category} tone="neutral">
                        {categoryLabel(category)}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className={TD}>{food.active ? 'Vigente' : <Badge tone="warning">Dado de baja</Badge>}</td>
                <td className={`${TD} text-right`}>
                  {food.editable && (
                    <button
                      type="button"
                      className="rounded-lg px-3 py-1.5 text-sm font-semibold text-primary hover:bg-mint-50"
                      onClick={() => navigate(`/catalogos/alimentos/${food.id}/editar`)}
                      aria-label={`Editar ${food.name}`}
                    >
                      Editar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Foods;
