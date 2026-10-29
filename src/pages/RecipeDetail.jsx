import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRecipe } from '../api/recipes';
import { cookingMethodLabel, mealTypeLabel } from '../utils/recipeLabels';
import SectionCard from '../components/SectionCard';
import BackButton from '../components/BackButton';
import Badge from '../components/Badge';
import Button from '../components/Button';

const LIST_PATH = '/catalogos/recetas';

// Vista de solo lectura de una receta, común o propia (T30): es donde se lee la
// preparación. Desde acá se edita (solo las propias) o se duplica como una
// receta propia nueva.
function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    getRecipe(id)
      .then((data) => {
        if (!cancelled) setRecipe(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="max-w-4xl">
        <p className="mb-4 text-sm text-danger" role="alert">
          {error}
        </p>
        <Button variant="secondary" onClick={() => navigate(LIST_PATH)}>
          Volver
        </Button>
      </div>
    );
  }

  if (!recipe) {
    return <p className="text-sm text-muted">Cargando receta...</p>;
  }

  const details = [
    ['Cocción', recipe.cookingMethod ? cookingMethodLabel(recipe.cookingMethod) : 'Sin dato'],
    ['Tiempo', recipe.timeMinutes ? `${recipe.timeMinutes} min` : 'Sin dato'],
    ['Lugar de compra', recipe.purchasePlace || 'Sin dato'],
  ];

  return (
    <div className="max-w-4xl">
      <BackButton onClick={() => navigate(LIST_PATH)}>Volver a recetas</BackButton>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{recipe.name}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Badge tone={recipe.own ? 'mint' : 'neutral'}>{recipe.own ? 'Propia' : 'Común'}</Badge>
            {recipe.mealTypes.map((value) => (
              <Badge key={value} tone="neutral">
                {mealTypeLabel(value)}
              </Badge>
            ))}
            {!recipe.availableInCatalog && <Badge tone="warning">No disponible</Badge>}
          </p>
          {!recipe.own && (
            <p className="mt-2 text-body-sm text-muted">
              Receta básica común: no se edita. Duplicala para adaptarla como una receta propia.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          {recipe.own && (
            <Button variant="secondary" onClick={() => navigate(`${LIST_PATH}/${id}/editar`)}>
              Editar
            </Button>
          )}
          <Button onClick={() => navigate(`${LIST_PATH}/nueva?base=${id}`)}>Duplicar</Button>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <SectionCard title="Datos">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-caption text-muted">{label}</dt>
                <dd className="mt-0.5 text-sm text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard title="Ingredientes" subtitle="En el orden de la receta.">
          <ul className="flex flex-col divide-y divide-line">
            {recipe.ingredients.map(({ order, quantityDescription, food }) => (
              <li key={order} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0">
                <span className="flex items-center gap-2 text-ink">
                  {food.name}
                  {!food.active && <Badge tone="warning">Dado de baja</Badge>}
                </span>
                <span className="text-muted">{quantityDescription || '—'}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Preparación">
          <p className="text-sm whitespace-pre-line text-ink">{recipe.preparation || 'Sin preparación cargada.'}</p>
          {recipe.finalNote && <p className="mt-4 text-body-sm whitespace-pre-line text-muted">{recipe.finalNote}</p>}
        </SectionCard>
      </div>
    </div>
  );
}

export default RecipeDetail;
