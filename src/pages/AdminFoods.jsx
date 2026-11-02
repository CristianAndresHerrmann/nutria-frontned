import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAdminFoodGroups, listAdminFoods, promoteFood, updateAdminFood } from '../api/adminCatalog';
import { listNutritionists } from '../api/adminNutritionists';
import { flattenTree, groupPath, indent } from '../utils/foodGroupTree';
import { categoryLabel } from '../utils/foodCategories';
import { foodToForm, formToPayload } from './foodFormMapping';
import { usePagination } from '../hooks/usePagination';
import Badge from '../components/Badge';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import TablePagination from '../components/TablePagination';
import PromoteFoodForm from '../components/PromoteFoodForm';
import { inputClass } from '../components/FormField';
import searchIcon1 from '../assets/icons/search-1.svg';
import searchIcon2 from '../assets/icons/search-2.svg';

const SEARCH_DELAY_MS = 300;
const EMPTY_PROMOTE_STATE = { name: '', isSubmitting: false, formError: '', fieldErrors: {} };
const LINK_BUTTON = 'text-body-sm font-medium text-primary hover:underline disabled:opacity-50';

// Catálogo completo de alimentos para el administrador (T25): los comunes y los
// privados de cada nutricionista, incluidos los dados de baja. Desde acá se
// corrigen, se dan de baja o se reactivan, y un privado pasa al común.
function AdminFoods() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [nutritionists, setNutritionists] = useState([]);
  const [foods, setFoods] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [groupId, setGroupId] = useState('');
  const [owner, setOwner] = useState('');
  const [error, setError] = useState('');
  const [promotingId, setPromotingId] = useState(null);
  const [promoteForm, setPromoteForm] = useState(EMPTY_PROMOTE_STATE);
  const [togglingId, setTogglingId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([listAdminFoodGroups(), listNutritionists()])
      .then(([groupData, accountData]) => {
        if (!cancelled) {
          setGroups(groupData);
          setNutritionists(accountData);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    listAdminFoods({ owner, search: debouncedSearch, groupId })
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
  }, [owner, debouncedSearch, groupId]);

  const groupOptions = useMemo(() => flattenTree(groups), [groups]);
  const hasFilters = Boolean(debouncedSearch.trim() || groupId || owner);
  const pagination = usePagination(foods ?? [], { resetKey: `${owner}|${debouncedSearch}|${groupId}` });
  const isBusy = Boolean(promotingId) || Boolean(togglingId);

  function replaceFood(updated) {
    setFoods((current) => current.map((food) => (food.id === updated.id ? updated : food)));
  }

  function clearMessages() {
    setNotice('');
    setActionError('');
  }

  async function handleToggleActive(food) {
    const deactivating = food.active;
    const question = deactivating
      ? `¿Dar de baja «${food.name}»? Deja de ofrecerse al cargar planes y recetas; los que ya lo usan lo conservan.`
      : `¿Reactivar «${food.name}»?`;
    if (!window.confirm(question)) return;

    clearMessages();
    setTogglingId(food.id);
    try {
      replaceFood(await updateAdminFood(food.id, { ...formToPayload(foodToForm(food)), active: !deactivating }));
      setNotice(`«${food.name}» ${deactivating ? 'dado de baja' : 'reactivado'}.`);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  // Si falla, el error vuelve al formulario inline y se muestra en su campo.
  async function handlePromote(food, name) {
    const promoted = await promoteFood(food.id, name);
    replaceFood(promoted);
    setPromotingId(null);
    setNotice(`«${promoted.name}» ahora es parte del catálogo común.`);
  }

  const columns = [
    {
      key: 'name',
      header: 'Alimento',
      cell: (food) => (
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="font-semibold text-ink">{food.name}</span>
          <div className="flex flex-wrap gap-1.5">
            {food.common ? <Badge tone="mint">Común</Badge> : <Badge tone="neutral">Privado de {food.owner?.name}</Badge>}
            {!food.active && <Badge tone="warning">Dado de baja</Badge>}
          </div>
        </div>
      ),
    },
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
    {
      key: 'actions',
      header: 'Acciones',
      hideHeader: true,
      cell: (food) => (
        <div className="flex flex-wrap items-center justify-end gap-4">
          <button
            type="button"
            className={LINK_BUTTON}
            disabled={isBusy}
            onClick={() => navigate(`/admin/catalogo/alimentos/${food.id}/editar`)}
          >
            Editar
          </button>
          <button type="button" className={LINK_BUTTON} disabled={isBusy} onClick={() => handleToggleActive(food)}>
            {togglingId === food.id ? 'Guardando...' : food.active ? 'Dar de baja' : 'Reactivar'}
          </button>
          {!food.common && (
            <button
              type="button"
              className={LINK_BUTTON}
              disabled={isBusy}
              onClick={() => {
                clearMessages();
                setPromoteForm(EMPTY_PROMOTE_STATE);
                setPromotingId(food.id);
              }}
            >
              Pasar al común
            </button>
          )}
        </div>
      ),
    },
  ];

  function renderPromote(food) {
    if (promotingId !== food.id) return null;
    return (
      <PromoteFoodForm
        food={food}
        state={promoteForm}
        onStateChange={setPromoteForm}
        onSubmit={(name) => handlePromote(food, name)}
        onCancel={() => setPromotingId(null)}
      />
    );
  }

  return (
    <div>
      {notice && (
        <p className="mb-4 rounded-xl bg-mint-50 px-3.5 py-2.5 text-body-sm text-mint-700" role="status">
          {notice}
        </p>
      )}
      {actionError && (
        <p className="mb-4 text-body-sm text-danger" role="alert">
          {actionError}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="flex flex-wrap items-center gap-4 border-b border-line p-5">
          <div className="relative w-full min-w-0 sm:max-w-72">
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
            className={`${inputClass} sm:max-w-56`}
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            aria-label="Filtrar por origen"
          >
            <option value="">Comunes y privados</option>
            <option value="common">Solo comunes</option>
            {nutritionists.map((account) => (
              <option key={account.id} value={account.id}>
                Privados de {account.name}
              </option>
            ))}
          </select>

          <select
            className={`${inputClass} sm:max-w-56`}
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

          <div className="flex w-full flex-col items-start gap-4 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap">
            {foods && <span className="text-body-sm whitespace-nowrap text-muted">{foods.length} alimentos</span>}
            <Button onClick={() => navigate('/admin/catalogo/alimentos/nuevo')} disabled={isBusy}>
              + Nuevo alimento común
            </Button>
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
            {hasFilters ? 'No hay alimentos que coincidan con los filtros.' : 'Todavía no hay alimentos cargados.'}
          </p>
        )}

        {foods && !error && foods.length > 0 && (
          <>
            <DataTable columns={columns} rows={pagination.pageItems} rowKey={(food) => food.id} renderExpanded={renderPromote} />
            <TablePagination {...pagination} />
          </>
        )}
      </div>
    </div>
  );
}

export default AdminFoods;
