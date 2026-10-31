import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createRecipe, getRecipe, updateRecipe } from '../api/recipes';
import { COOKING_METHODS, MEAL_TYPES } from '../utils/recipeLabels';
import {
  EMPTY_RECIPE_FORM,
  addIngredient,
  formToPayload,
  moveIngredient,
  recipeToDraft,
  recipeToForm,
  toggleMealType,
} from './recipeFormMapping';
import { useFormErrors } from '../hooks/useFormErrors';
import SectionCard from '../components/SectionCard';
import FormField, { inputClass, textareaClass } from '../components/FormField';
import FormError from '../components/FormError';
import RecipeIngredientsFields from '../components/RecipeIngredientsFields';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import iconCheck from '../assets/icons/icon-check.svg';

const FORM_GRID = 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3';
const LIST_PATH = '/catalogos/recetas';
const COMMON_READ_ONLY_MESSAGE = 'Las recetas comunes son de solo lectura.';

// Alta y edición de una receta del nutricionista (T21; RF-27). La edición
// reemplaza la receta entera, y es también donde se da de baja (lógica) o se
// reactiva. Con ?base=<id>, el alta arranca como copia de otra receta, común o
// propia (T30): se guarda como una receta propia nueva. Una común no se edita:
// si se llega a su edición por URL, no hay formulario.
function RecipeForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const baseId = isEditMode ? null : searchParams.get('base');
  const navigate = useNavigate();

  // Volver o cancelar lleva a la receta de la que se partió (la que se edita o
  // la que se duplica); un alta en blanco vuelve al listado.
  const sourceId = isEditMode ? id : baseId;
  const backPath = sourceId ? `${LIST_PATH}/${sourceId}` : LIST_PATH;

  const [form, setForm] = useState(EMPTY_RECIPE_FORM);
  const [baseName, setBaseName] = useState('');
  const [isLoading, setIsLoading] = useState(isEditMode || Boolean(baseId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { fieldErrors, formError, reset, clearField, showError } = useFormErrors();

  useEffect(() => {
    if (!sourceId) return undefined;

    let cancelled = false;

    getRecipe(sourceId)
      .then((recipe) => {
        if (cancelled) return;
        if (isEditMode && !recipe.own) {
          setLoadError(COMMON_READ_ONLY_MESSAGE);
        } else if (isEditMode) {
          setForm(recipeToForm(recipe));
        } else {
          setForm(recipeToDraft(recipe));
          setBaseName(recipe.name);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sourceId, isEditMode]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    clearField(field);
  }

  function updateIngredients(change) {
    setForm((current) => ({ ...current, ingredients: change(current.ingredients) }));
    clearField('ingredients');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    reset();
    setIsSubmitting(true);

    try {
      const payload = formToPayload(form, { isEditMode });
      const saved = await (isEditMode ? updateRecipe(id, payload) : createRecipe(payload));
      navigate(`${LIST_PATH}/${saved.id}`, { replace: true });
    } catch (err) {
      showError(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Cargando receta...</p>;
  }

  // Sin la receta no hay sobre qué editar: no se muestra el form, para no
  // pisarla con un objeto vacío.
  if (loadError) {
    return (
      <div className="max-w-4xl">
        <p className="mb-4 text-sm text-danger" role="alert">
          {loadError}
        </p>
        <Button variant="secondary" onClick={() => navigate(LIST_PATH)}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <BackButton onClick={() => navigate(backPath)}>Volver</BackButton>

      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="text-title font-bold text-ink">{isEditMode ? 'Editar receta' : 'Nueva receta'}</h1>
          <p className="mt-2 text-sm text-muted">
            Los ingredientes se eligen del catálogo de alimentos. La receta solo la ves vos.
          </p>
          {baseName && (
            <p className="mt-2 text-sm text-ink">
              Copia de «{baseName}». Al guardar se crea una receta propia nueva; la original no cambia.
            </p>
          )}
        </div>
        <span className="text-note whitespace-nowrap text-muted">* Campo obligatorio</span>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <SectionCard title="Receta" subtitle="Nombre, cocción y para qué comidas sirve.">
          <div className="flex flex-col gap-5">
            <FormField label="Nombre" required error={fieldErrors.name}>
              <input
                className={inputClass}
                placeholder="Ej. Ensalada de arroz y atún"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                aria-invalid={Boolean(fieldErrors.name)}
                required
              />
            </FormField>

            <div className={FORM_GRID}>
              <FormField label="Método de cocción" error={fieldErrors.cookingMethod}>
                <select
                  className={inputClass}
                  value={form.cookingMethod}
                  onChange={(event) => updateField('cookingMethod', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.cookingMethod)}
                >
                  <option value="">Sin dato</option>
                  {COOKING_METHODS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Tiempo (minutos)" error={fieldErrors.timeMinutes}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={inputClass}
                  placeholder="Ej. 25"
                  value={form.timeMinutes}
                  onChange={(event) => updateField('timeMinutes', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.timeMinutes)}
                />
              </FormField>

              <FormField label="Lugar de compra" error={fieldErrors.purchasePlace}>
                <input
                  className={inputClass}
                  placeholder="Ej. Verdulería"
                  value={form.purchasePlace}
                  onChange={(event) => updateField('purchasePlace', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.purchasePlace)}
                />
              </FormField>
            </div>

            <fieldset className="flex min-w-0 flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-ink">
                Tipos de comida <span className="text-primary">*</span>
              </legend>
              <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
                {MEAL_TYPES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={form.mealTypes.includes(value)}
                      onChange={(event) => updateField('mealTypes', toggleMealType(form.mealTypes, value, event.target.checked))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.mealTypes && <span className="text-note text-danger">{fieldErrors.mealTypes}</span>}
            </fieldset>
          </div>
        </SectionCard>

        <SectionCard
          title={
            <>
              Ingredientes <span className="text-primary">*</span>
            </>
          }
          subtitle="Alimentos del catálogo, en el orden de la receta. Cada alimento va una sola vez: si se incorpora en tandas, indicalo en la preparación."
        >
          <RecipeIngredientsFields
            rows={form.ingredients}
            error={fieldErrors.ingredients}
            onAdd={(food) => updateIngredients((rows) => addIngredient(rows, food))}
            onQuantityChange={(key, quantityDescription) =>
              updateIngredients((rows) => rows.map((row) => (row.key === key ? { ...row, quantityDescription } : row)))
            }
            onMove={(key, offset) => updateIngredients((rows) => moveIngredient(rows, key, offset))}
            onRemove={(key) => updateIngredients((rows) => rows.filter((row) => row.key !== key))}
          />
        </SectionCard>

        <SectionCard title="Preparación">
          <div className="flex flex-col gap-5">
            <FormField label="Preparación" error={fieldErrors.preparation}>
              <textarea
                className={textareaClass}
                placeholder="Paso a paso de la receta"
                value={form.preparation}
                onChange={(event) => updateField('preparation', event.target.value)}
                aria-invalid={Boolean(fieldErrors.preparation)}
              />
            </FormField>

            <FormField label="Nota final" error={fieldErrors.finalNote}>
              <textarea
                className={textareaClass}
                placeholder="Ej. Se conserva en heladera hasta el día siguiente"
                value={form.finalNote}
                onChange={(event) => updateField('finalNote', event.target.value)}
                aria-invalid={Boolean(fieldErrors.finalNote)}
              />
            </FormField>
          </div>
        </SectionCard>

        {isEditMode && (
          <SectionCard title="Disponibilidad">
            <label className="flex items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.availableInCatalog}
                onChange={(event) => updateField('availableInCatalog', event.target.checked)}
              />
              <span>
                Disponible en el catálogo
                <span className="mt-1 block text-body-sm text-muted">
                  Si la desmarcás, la receta deja de ofrecerse, pero no se borra: la podés volver a activar.
                </span>
              </span>
            </label>
          </SectionCard>
        )}

        <FormError message={formError} />

        <div className="flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => navigate(backPath)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {!isSubmitting && <img src={iconCheck} alt="" />}
            {isSubmitting ? 'Guardando...' : 'Guardar receta'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default RecipeForm;
