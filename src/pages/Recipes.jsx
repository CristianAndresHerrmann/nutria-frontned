import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listRecipes, updateRecipe } from '../api/recipes';
import { availabilityPayload } from './recipeFormMapping';
import { MEAL_TYPES, mealTypeLabel } from '../utils/recipeLabels';
import { filterRecipes } from '../utils/recipeSearch';
import { usePagination } from '../hooks/usePagination';
import Badge from '../components/Badge';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import TablePagination from '../components/TablePagination';
import { inputClass } from '../components/FormField';
import iconEye from '../assets/icons/icon-eye.svg';
import iconEdit from '../assets/icons/icon-edit.svg';
import iconCopy from '../assets/icons/icon-copy.svg';
import iconTrash from '../assets/icons/icon-trash.svg';
import iconRestore from '../assets/icons/icon-restore.svg';
import searchIcon1 from '../assets/icons/search-1.svg';
import searchIcon2 from '../assets/icons/search-2.svg';

const RECIPES_PATH = '/catalogos/recetas';

// Recetas básicas comunes y las del nutricionista (T21, T30). Por defecto solo
// las disponibles; las dadas de baja se muestran a pedido, para poder
// reactivarlas. Acciones por fila, como íconos: ver el detalle (también desde el
// nombre), duplicar cualquier receta como una propia nueva y, solo en las
// propias, editar y dar de baja o reactivar. No hay borrado: la baja es lógica.
// Las comunes son de solo lectura. El buscador filtra en el cliente, por nombre de
// receta o de ingrediente.
function Recipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState(null);
  const [search, setSearch] = useState('');
  const [mealType, setMealType] = useState('');
  const [includeUnavailable, setIncludeUnavailable] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    listRecipes({ mealType, includeUnavailable })
      .then((data) => {
        if (!cancelled) {
          setRecipes(data);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [mealType, includeUnavailable]);

  const filteredRecipes = useMemo(() => filterRecipes(recipes ?? [], search), [recipes, search]);
  const pagination = usePagination(filteredRecipes, {
    resetKey: `${search.trim().toLowerCase()}|${mealType}|${includeUnavailable}`,
  });

  async function handleToggleAvailable(recipe) {
    const deactivating = recipe.availableInCatalog;
    const question = deactivating
      ? `¿Dar de baja «${recipe.name}»? Deja de ofrecerse en el catálogo y en los planes nuevos; la podés reactivar.`
      : `¿Reactivar «${recipe.name}»?`;
    if (!window.confirm(question)) return;

    setActionError('');
    setTogglingId(recipe.id);
    try {
      const updated = await updateRecipe(recipe.id, availabilityPayload(recipe, !deactivating));
      setRecipes((current) =>
        deactivating && !includeUnavailable
          ? current.filter(({ id }) => id !== recipe.id)
          : current.map((row) => (row.id === recipe.id ? updated : row)),
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  // Botón de ícono de una fila: el tooltip dice la acción y el aria-label suma
  // el nombre de la receta, para que cada botón se distinga con lector de pantalla.
  function iconAction(action, recipe, icon, onClick, disabled = false) {
    return (
      <Button variant="ghost" aria-label={`${action} «${recipe.name}»`} title={action} onClick={onClick} disabled={disabled}>
        <img src={icon} alt="" />
      </Button>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Receta',
      className: 'font-semibold text-ink',
      cell: (recipe) => (
        <span className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="text-left hover:text-primary hover:underline"
            onClick={() => navigate(`${RECIPES_PATH}/${recipe.id}`)}
          >
            {recipe.name}
          </button>
          <Badge tone={recipe.own ? 'mint' : 'neutral'}>{recipe.own ? 'Propia' : 'Común'}</Badge>
          {!recipe.availableInCatalog && <Badge tone="warning">No disponible</Badge>}
        </span>
      ),
    },
    {
      key: 'mealTypes',
      header: 'Tipos de comida',
      cell: (recipe) => (
        <div className="flex flex-wrap gap-1.5">
          {recipe.mealTypes.map((value) => (
            <Badge key={value} tone="neutral">
              {mealTypeLabel(value)}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'ingredients',
      header: 'Ingredientes',
      className: 'text-muted',
      cell: (recipe) => recipe.ingredients.map(({ food }) => food.name).join(', '),
    },
    {
      key: 'time',
      header: 'Tiempo',
      className: 'whitespace-nowrap text-muted',
      cell: (recipe) => (recipe.timeMinutes ? `${recipe.timeMinutes} min` : '—'),
    },
    {
      key: 'actions',
      header: 'Acciones',
      hideHeader: true,
      className: 'text-right',
      cell: (recipe) => {
        const busy = togglingId === recipe.id;
        return (
          <span className="inline-flex justify-end gap-1">
            {iconAction('Ver', recipe, iconEye, () => navigate(`${RECIPES_PATH}/${recipe.id}`))}
            {recipe.own && iconAction('Editar', recipe, iconEdit, () => navigate(`${RECIPES_PATH}/${recipe.id}/editar`), busy)}
            {iconAction('Duplicar', recipe, iconCopy, () => navigate(`${RECIPES_PATH}/nueva?base=${recipe.id}`))}
            {recipe.own &&
              (recipe.availableInCatalog
                ? iconAction('Dar de baja', recipe, iconTrash, () => handleToggleAvailable(recipe), busy)
                : iconAction('Reactivar', recipe, iconRestore, () => handleToggleAvailable(recipe), busy))}
          </span>
        );
      },
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
            placeholder="Buscar receta o ingrediente..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar receta por nombre o ingrediente"
          />
        </div>

        <select
          className={`${inputClass} max-w-64`}
          value={mealType}
          onChange={(event) => setMealType(event.target.value)}
          aria-label="Filtrar por tipo de comida"
        >
          <option value="">Todos los tipos de comida</option>
          {MEAL_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={includeUnavailable}
            onChange={(event) => setIncludeUnavailable(event.target.checked)}
          />
          Mostrar no disponibles
        </label>

        <div className="ml-auto flex items-center gap-4">
          {recipes && <span className="text-body-sm whitespace-nowrap text-muted">{filteredRecipes.length} recetas</span>}
          <Button onClick={() => navigate(`${RECIPES_PATH}/nueva`)}>+ Nueva receta</Button>
        </div>
      </div>

      {!recipes && !error && <p className="p-5 text-sm text-muted">Cargando recetas...</p>}
      {error && (
        <p className="p-5 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {actionError && (
        <p className="border-b border-line px-5 py-3 text-body-sm text-danger" role="alert">
          {actionError}
        </p>
      )}

      {recipes && !error && filteredRecipes.length === 0 && (
        <p className="p-5 text-sm text-muted">
          {search.trim()
            ? 'No hay recetas que coincidan con la búsqueda.'
            : mealType
              ? 'No hay recetas para ese tipo de comida.'
              : 'Todavía no hay recetas.'}
        </p>
      )}

      {recipes && !error && filteredRecipes.length > 0 && (
        <>
          <DataTable columns={columns} rows={pagination.pageItems} rowKey={(recipe) => recipe.id} />
          <TablePagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default Recipes;
