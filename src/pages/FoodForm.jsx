import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createFood, getFood, listFoodGroups, updateFood } from '../api/catalogs';
import { flattenTree } from '../utils/foodGroupTree';
import { FOOD_CATEGORIES } from '../utils/foodCategories';
import { EMPTY_FOOD_FORM, foodToForm, formToPayload, toggleCategory } from './foodFormMapping';
import SectionCard from '../components/SectionCard';
import FormField, { inputClass } from '../components/FormField';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import iconCheck from '../assets/icons/icon-check.svg';

const FORM_GRID = 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2';
const LIST_PATH = '/catalogos/alimentos';
const NOT_EDITABLE_MESSAGE =
  'Este alimento lo cargó otro nutricionista o es parte de la base inicial: solo quien lo cargó puede editarlo.';

function indent(depth) {
  return '    '.repeat(depth);
}

function FoodForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FOOD_FORM);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let cancelled = false;

    Promise.all([listFoodGroups(), isEditMode ? getFood(id) : null])
      .then(([groupList, food]) => {
        if (cancelled) return;
        setGroups(groupList);
        if (!food) return;
        // El backend rechazaría el guardado con 403; no se ofrece un formulario
        // que no se va a poder guardar.
        if (!food.editable) setLoadError(NOT_EDITABLE_MESSAGE);
        else setForm(foodToForm(food));
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
  }, [id, isEditMode]);

  const groupOptions = useMemo(() => flattenTree(groups), [groups]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const payload = formToPayload(form, { isEditMode });
      if (isEditMode) await updateFood(id, payload);
      else await createFood(payload);
      navigate(LIST_PATH, { replace: true });
    } catch (err) {
      setFormError(err.message);
      setFieldErrors(err.fields || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Cargando...</p>;
  }

  if (loadError) {
    return (
      <div className="max-w-3xl">
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
    <div className="max-w-3xl">
      <BackButton onClick={() => navigate(LIST_PATH)}>Volver</BackButton>

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-bold text-ink">{isEditMode ? 'Editar alimento' : 'Nuevo alimento'}</h1>
          <p className="mt-2 text-sm text-muted">
            El catálogo es común a todos los nutricionistas: lo que cargues lo van a ver todos, pero solo vos vas a
            poder editarlo.
          </p>
        </div>
        <span className="text-note whitespace-nowrap text-muted">* Campo obligatorio</span>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <SectionCard title="Alimento" subtitle="Nombre, grupo y categorías nutricionales.">
          <div className="flex flex-col gap-5">
            <div className={FORM_GRID}>
              <FormField label="Nombre" required error={fieldErrors.name}>
                <input
                  className={inputClass}
                  placeholder="Ej. Caballa"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.name)}
                  required
                />
              </FormField>

              <FormField label="Grupo" required error={fieldErrors.foodGroupId}>
                <select
                  className={inputClass}
                  value={form.foodGroupId}
                  onChange={(event) => updateField('foodGroupId', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.foodGroupId)}
                  required
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

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-ink">
                Categorías <span className="text-primary">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                {FOOD_CATEGORIES.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={form.categories.includes(value)}
                      onChange={(event) => updateField('categories', toggleCategory(form.categories, value, event.target.checked))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.categories && <span className="text-note text-danger">{fieldErrors.categories}</span>}
            </fieldset>

            {isEditMode && (
              <div className="flex flex-col gap-1">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" checked={form.active} onChange={(event) => updateField('active', event.target.checked)} />
                  <span>Vigente</span>
                </label>
                <span className="text-note text-muted">
                  Desmarcalo para dar de baja el alimento: deja de ofrecerse, pero no se borra.
                </span>
                {fieldErrors.active && <span className="text-note text-danger">{fieldErrors.active}</span>}
              </div>
            )}
          </div>
        </SectionCard>

        {formError && (
          <p className="text-body-sm text-danger" role="alert">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-line pt-3">
          <Button variant="secondary" onClick={() => navigate(LIST_PATH)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {!isSubmitting && <img src={iconCheck} alt="" />}
            {isSubmitting ? 'Guardando...' : 'Guardar alimento'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default FoodForm;
