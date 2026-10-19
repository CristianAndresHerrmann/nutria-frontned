import { useEffect, useMemo, useState } from 'react';
import { listFoodGroups, listFoods, listPathologies } from '../api/catalogs';
import { flattenTree, indent } from '../utils/foodGroupTree';
import { CONDITION_TYPES, EMPTY_CONDITION_FORM, conditionToForm, formToConditionPayload } from '../pages/patientConditions';
import FormField, { inputClass, textareaClass } from './FormField';
import Button from './Button';

const FORM_GRID = 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2';
const SEARCH_DELAY_MS = 300;
const MAX_RESULTS = 8;
const TARGET_OPTION = 'flex items-center gap-2 text-sm font-normal text-ink';

// Alta o edición de una condición, inline en la ficha. `condition` null es un
// alta. `onSubmit(payload)` guarda; si falla con un ApiError, los errores se
// muestran en su campo.
function ConditionForm({ condition, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => (condition ? conditionToForm(condition) : EMPTY_CONDITION_FORM));
  const [pathologies, setPathologies] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Resultados de la última búsqueda, con el texto que los trajo.
  const [found, setFound] = useState({ query: '', foods: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let cancelled = false;

    Promise.all([listPathologies(), listFoodGroups()])
      .then(([pathologyData, groupData]) => {
        if (cancelled) return;
        setPathologies(pathologyData);
        setGroups(groupData);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // La búsqueda va al backend (comunes + propios, solo vigentes); se espera a
  // que se deje de tipear para no disparar una request por tecla.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch) return undefined;

    let cancelled = false;

    listFoods({ search: debouncedSearch })
      .then((data) => {
        if (!cancelled) setFound({ query: debouncedSearch, foods: data.slice(0, MAX_RESULTS) });
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const groupOptions = useMemo(() => flattenTree(groups), [groups]);
  // Con el buscador vacío, o mientras llega la respuesta, no se muestran
  // resultados de una búsqueda anterior.
  const results = debouncedSearch && found.query === debouncedSearch ? found.foods : [];
  const searchDone = Boolean(debouncedSearch) && found.query === debouncedSearch;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function chooseFood(food) {
    setForm((current) => ({ ...current, foodId: food.id, foodName: food.name }));
    setSearch('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await onSubmit(formToConditionPayload(form));
    } catch (err) {
      const fields = err.fields || {};
      setFieldErrors(fields);
      // Si el error ya está en un campo, no se repite arriba del botón.
      if (Object.keys(fields).length === 0) setFormError(err.message);
      setIsSubmitting(false);
    }
  }

  const isPathology = form.type === 'pathology';
  // Sin alimento ni grupo, el backend señala foodId aunque se haya elegido
  // "grupo": se muestra en el selector que esté a la vista.
  const targetError = fieldErrors.foodId || fieldErrors.foodGroupId;

  return (
    <form
      className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5"
      onSubmit={handleSubmit}
      noValidate
    >
      <h3 className="text-sm font-semibold text-ink">{condition ? 'Editar condición' : 'Nueva condición'}</h3>

      {loadError && (
        <p className="text-body-sm text-danger" role="alert">
          {loadError}
        </p>
      )}

      <div className={FORM_GRID}>
        <FormField label="Tipo" required error={fieldErrors.type}>
          <select
            className={inputClass}
            value={form.type}
            onChange={(event) => updateField('type', event.target.value)}
            aria-invalid={Boolean(fieldErrors.type)}
          >
            {CONDITION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.singular}
              </option>
            ))}
          </select>
        </FormField>

        {isPathology && (
          <FormField label="Patología" required error={fieldErrors.pathologyId}>
            <select
              className={inputClass}
              value={form.pathologyId}
              onChange={(event) => updateField('pathologyId', event.target.value)}
              aria-invalid={Boolean(fieldErrors.pathologyId)}
            >
              <option value="">Elegí una patología</option>
              {pathologies.map((pathology) => (
                <option key={pathology.id} value={pathology.id}>
                  {pathology.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {!isPathology && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-ink">
              Se refiere a <span className="text-primary">*</span>
            </legend>
            <div className="flex h-10.5 items-center gap-6">
              <label className={TARGET_OPTION}>
                <input
                  type="radio"
                  name="target"
                  checked={form.target === 'food'}
                  onChange={() => updateField('target', 'food')}
                />
                Un alimento
              </label>
              <label className={TARGET_OPTION}>
                <input
                  type="radio"
                  name="target"
                  checked={form.target === 'group'}
                  onChange={() => updateField('target', 'group')}
                />
                Un grupo de alimentos
              </label>
            </div>
          </fieldset>
        )}
      </div>

      {!isPathology && form.target === 'food' && (
        <div className="flex flex-col gap-2 text-sm font-medium text-ink">
          <span>
            Alimento <span className="text-primary">*</span>
          </span>
          {form.foodId ? (
            <div className="flex items-center gap-3">
              <span className="font-semibold">{form.foodName}</span>
              <button
                type="button"
                className="text-body-sm font-medium text-primary hover:underline"
                onClick={() => setForm((current) => ({ ...current, foodId: '', foodName: '' }))}
              >
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <input
                type="search"
                className={`${inputClass} sm:max-w-80`}
                placeholder="Buscar alimento..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar alimento por nombre"
                aria-invalid={Boolean(targetError)}
              />
              {searchDone && results.length === 0 && (
                <span className="text-body-sm font-normal text-muted">No hay alimentos que coincidan.</span>
              )}
              {results.length > 0 && (
                <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-white sm:max-w-80">
                  {results.map((food) => (
                    <li key={food.id}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm hover:bg-surface"
                        onClick={() => chooseFood(food)}
                      >
                        <span className="text-ink">{food.name}</span>
                        <span className="text-xs font-normal text-muted">{food.foodGroup?.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {targetError && <span className="text-note font-normal text-danger">{targetError}</span>}
        </div>
      )}

      {!isPathology && form.target === 'group' && (
        <div className={FORM_GRID}>
          <FormField label="Grupo de alimentos" required error={targetError}>
            <select
              className={inputClass}
              value={form.foodGroupId}
              onChange={(event) => updateField('foodGroupId', event.target.value)}
              aria-invalid={Boolean(targetError)}
            >
              <option value="">Elegí un grupo</option>
              {groupOptions.map((group) => (
                <option key={group.id} value={group.id}>
                  {indent(group.depth)}
                  {group.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      )}

      <FormField label="Observaciones" error={fieldErrors.observations}>
        <textarea
          className={textareaClass}
          placeholder="Ej. Le cae mal en cantidad; tolera pequeñas porciones"
          value={form.observations}
          onChange={(event) => updateField('observations', event.target.value)}
          aria-invalid={Boolean(fieldErrors.observations)}
        />
      </FormField>

      {formError && (
        <p className="text-body-sm text-danger" role="alert">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar condición'}
        </Button>
      </div>
    </form>
  );
}

export default ConditionForm;
