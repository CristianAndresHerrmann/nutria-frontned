import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCommonFood, getAdminFood, listAdminFoodGroups, updateAdminFood } from '../api/adminCatalog';
import { flattenTree } from '../utils/foodGroupTree';
import { EMPTY_FOOD_FORM, foodToForm, formToPayload } from './foodFormMapping';
import { useFormErrors } from '../hooks/useFormErrors';
import SectionCard from '../components/SectionCard';
import FoodFields from '../components/FoodFields';
import FormError from '../components/FormError';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import Badge from '../components/Badge';
import iconCheck from '../assets/icons/icon-check.svg';

const LIST_PATH = '/admin/catalogo/alimentos';

// Alta de un alimento común o corrección de cualquier alimento, común o privado
// (T25). La edición no cambia el dueño ni el estado: la baja, la reactivación y
// el paso al común se hacen desde el listado.
function AdminFoodForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FOOD_FORM);
  const [food, setFood] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { fieldErrors, formError, reset, showError } = useFormErrors();

  useEffect(() => {
    let cancelled = false;

    Promise.all([listAdminFoodGroups(), isEdit ? getAdminFood(id) : Promise.resolve(null)])
      .then(([groupData, foodData]) => {
        if (cancelled) return;
        setGroups(groupData);
        if (foodData) {
          setFood(foodData);
          setForm(foodToForm(foodData));
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
  }, [id, isEdit]);

  const groupOptions = useMemo(() => flattenTree(groups), [groups]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    reset();
    setIsSubmitting(true);

    try {
      const payload = formToPayload(form);
      if (isEdit) await updateAdminFood(id, payload);
      else await createCommonFood(payload);
      navigate(LIST_PATH, { replace: true });
    } catch (err) {
      showError(err);
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

      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="text-title font-bold break-words text-ink">{isEdit ? `Editar ${food.name}` : 'Nuevo alimento común'}</h1>
          {isEdit ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
              {food.common ? <Badge tone="mint">Común</Badge> : <Badge tone="neutral">Privado de {food.owner?.name}</Badge>}
              {!food.active && <Badge tone="warning">Dado de baja</Badge>}
              <span>Los planes que ya lo usan conservan su copia del nombre y las categorías.</span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">El alimento queda disponible para todas las nutricionistas.</p>
          )}
        </div>
        <span className="text-note whitespace-nowrap text-muted">* Campo obligatorio</span>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <SectionCard title="Alimento" subtitle="Nombre, grupo y categorías nutricionales.">
          <FoodFields form={form} groupOptions={groupOptions} fieldErrors={fieldErrors} onChange={updateField} />
        </SectionCard>

        <FormError message={formError} />

        <div className="flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:justify-end">
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

export default AdminFoodForm;
