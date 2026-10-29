import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listFoodGroups, listFoods } from '../api/catalogs';
import { flattenTree, groupPath, indent } from '../utils/foodGroupTree';
import { categoryLabel } from '../utils/foodCategories';
import { usePagination } from '../hooks/usePagination';
import Badge from '../components/Badge';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import TablePagination from '../components/TablePagination';
import { inputClass } from '../components/FormField';
import searchIcon1 from '../assets/icons/search-1.svg';
import searchIcon2 from '../assets/icons/search-2.svg';

const SEARCH_DELAY_MS = 300;

// Alimentos comunes más los propios del nutricionista. Solo lectura: el alta va
// por su propia pantalla y no hay edición.
function Foods() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [foods, setFoods] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [groupId, setGroupId] = useState('');
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

    listFoods({ search: debouncedSearch, groupId })
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
  }, [debouncedSearch, groupId]);

  const groupOptions = useMemo(() => flattenTree(groups), [groups]);
  const hasFilters = Boolean(debouncedSearch.trim() || groupId);
  const pagination = usePagination(foods ?? [], { resetKey: `${debouncedSearch}|${groupId}` });

  const columns = [
    { key: 'name', header: 'Alimento', className: 'font-semibold text-ink', cell: (food) => food.name },
    {
      key: 'group',
      header: 'Grupo',
      className: 'text-muted',
      cell: (food) => groupPath(groups, food.foodGroupId) || food.foodGroup?.name,
    },
    {
      key: 'categories',
      header: 'Categorías',
      cell: (food) => (
        <div className="flex flex-wrap gap-1.5">
          {food.categories.map((category) => (
            <Badge key={category} tone="neutral">
              {categoryLabel(category)}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

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
        <>
          <DataTable columns={columns} rows={pagination.pageItems} rowKey={(food) => food.id} />
          <TablePagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default Foods;
