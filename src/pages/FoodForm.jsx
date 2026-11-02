import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFood, listFoodGroups } from '../api/catalogs';
import { flattenTree } from '../utils/foodGroupTree';
import { EMPTY_FOOD_FORM, formToPayload } from './foodFormMapping';
import { useFormErrors } from '../hooks/useFormErrors';
import SectionCard from '../components/SectionCard';
import FoodFields from '../components/FoodFields';
import FormError from '../components/FormError';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import iconCheck from '../assets/icons/icon-check.svg';

const LIST_PATH = '/catalogos/alimentos';

// Solo alta: el alimento queda privado del nutricionista y después no se edita
// desde su cuenta (lo corrige el administrador).
function FoodForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FOOD_FORM);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { fieldErrors, formError, reset, showError } = useFormErrors();

  useEffect(() => {
    let cancelled = false;

    listFoodGroups()
      .then((data) => {
        if (!cancelled) setGroups(data);
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
  }, []);

  const groupOptions = useMemo(() => flattenTree(groups), [groups]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    reset();
    setIsSubmitting(true);

    try {
      await createFood(formToPayload(form));
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

  // Sin grupos no se puede elegir dónde va el alimento.
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
          <h1 className="text-title font-bold text-ink">Nuevo alimento</h1>
          <p className="mt-2 text-sm text-muted">
            El alimento queda disponible solo para vos. Una vez guardado no se puede modificar: si hace falta
            corregirlo, pedíselo al administrador del catálogo.
          </p>
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

export default FoodForm;
