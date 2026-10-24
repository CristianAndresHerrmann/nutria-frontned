import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listRecipes } from '../api/recipes';
import { MEAL_TYPES, mealTypeLabel } from '../utils/recipeLabels';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { inputClass } from '../components/FormField';

const TH = 'px-5 py-3 text-left text-xs font-bold tracking-[0.3px] text-muted uppercase';
const TD = 'px-5 py-3 text-body-sm';

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
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-soft/45">
              <th className={TH}>Receta</th>
              <th className={TH}>Tipos de comida</th>
              <th className={TH}>Ingredientes</th>
              <th className={TH}>Tiempo</th>
              <th className={TH}>
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {recipes.map((recipe) => (
              <tr key={recipe.id}>
                <td className={`${TD} font-semibold text-ink`}>
                  <span className="flex flex-wrap items-center gap-2">
                    {recipe.name}
                    {!recipe.availableInCatalog && <Badge tone="warning">No disponible</Badge>}
                  </span>
                </td>
                <td className={TD}>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.mealTypes.map((value) => (
                      <Badge key={value} tone="neutral">
                        {mealTypeLabel(value)}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className={`${TD} text-muted`}>{recipe.ingredients.map(({ food }) => food.name).join(', ')}</td>
                <td className={`${TD} whitespace-nowrap text-muted`}>
                  {recipe.timeMinutes ? `${recipe.timeMinutes} min` : '—'}
                </td>
                <td className={`${TD} text-right`}>
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => navigate(`/catalogos/recetas/${recipe.id}/editar`)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Recipes;
