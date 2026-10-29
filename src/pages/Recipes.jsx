import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listRecipes } from '../api/recipes';
import { MEAL_TYPES, mealTypeLabel } from '../utils/recipeLabels';
import { usePagination } from '../hooks/usePagination';
import Badge from '../components/Badge';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import TablePagination from '../components/TablePagination';
import { inputClass } from '../components/FormField';

// Recetas del nutricionista (T21). Por defecto solo las disponibles; las dadas
// de baja se muestran a pedido, para poder reactivarlas desde la edición.
function Recipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState(null);
  const [mealType, setMealType] = useState('');
  const [includeUnavailable, setIncludeUnavailable] = useState(false);
  const [error, setError] = useState('');

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

  const pagination = usePagination(recipes ?? [], { resetKey: `${mealType}|${includeUnavailable}` });

  const columns = [
    {
      key: 'name',
      header: 'Receta',
      className: 'font-semibold text-ink',
      cell: (recipe) => (
        <span className="flex flex-wrap items-center gap-2">
          {recipe.name}
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
      cell: (recipe) => (
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => navigate(`/catalogos/recetas/${recipe.id}/editar`)}
        >
          Editar
        </button>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-4 border-b border-line p-5">
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
          {recipes && <span className="text-body-sm whitespace-nowrap text-muted">{recipes.length} recetas</span>}
          <Button onClick={() => navigate('/catalogos/recetas/nueva')}>+ Nueva receta</Button>
        </div>
      </div>

      {!recipes && !error && <p className="p-5 text-sm text-muted">Cargando recetas...</p>}
      {error && (
        <p className="p-5 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {recipes && !error && recipes.length === 0 && (
        <p className="p-5 text-sm text-muted">
          {mealType ? 'No hay recetas para ese tipo de comida.' : 'Todavía no cargaste recetas.'}
        </p>
      )}

      {recipes && !error && recipes.length > 0 && (
        <>
          <DataTable columns={columns} rows={pagination.pageItems} rowKey={(recipe) => recipe.id} />
          <TablePagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default Recipes;
