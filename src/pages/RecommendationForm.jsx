import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createRecommendation, getRecommendation, updateRecommendation } from '../api/recommendations';
import { listPathologies } from '../api/catalogs';
import { EMPTY_RECOMMENDATION_FORM, formToPayload, recommendationToForm } from './recommendationFormMapping';
import SectionCard from '../components/SectionCard';
import FormField, { inputClass, textareaClass } from '../components/FormField';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import iconCheck from '../assets/icons/icon-check.svg';

const LIST_PATH = '/catalogos/recomendaciones';
const COMMON_READ_ONLY_MESSAGE = 'Las recomendaciones comunes son de solo lectura.';

// Alta y edición de una recomendación clínica propia (T22; RF-30). La edición
// reemplaza la recomendación entera, y es también donde se da de baja (lógica)
// o se reactiva. Una común no se edita: si se llega por URL, no hay formulario.
function RecommendationForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_RECOMMENDATION_FORM);
  const [pathologies, setPathologies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let cancelled = false;

    Promise.all([listPathologies(), isEditMode ? getRecommendation(id) : null])
      .then(([pathologyList, recommendation]) => {
        if (cancelled) return;
        setPathologies(pathologyList);
        if (recommendation && !recommendation.own) setLoadError(COMMON_READ_ONLY_MESSAGE);
        else if (recommendation) setForm(recommendationToForm(recommendation));
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

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const payload = formToPayload(form, { isEditMode });
      await (isEditMode ? updateRecommendation(id, payload) : createRecommendation(payload));
      navigate(LIST_PATH, { replace: true });
    } catch (err) {
      setFormError(err.message);
      setFieldErrors(err.fields || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">{isEditMode ? 'Cargando recomendación...' : 'Cargando patologías...'}</p>;
  }

  // Sin la recomendación (o sin las patologías) no hay sobre qué editar: no se
  // muestra el form, para no pisarla con un objeto vacío.
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

  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);

  return (
    <div className="max-w-4xl">
      <BackButton onClick={() => navigate(LIST_PATH)}>Volver</BackButton>

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-bold text-ink">
            {isEditMode ? 'Editar recomendación' : 'Nueva recomendación'}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Recomendación estándar de una patología, reutilizable entre tus pacientes. La que cargás solo la ves vos.
          </p>
        </div>
        <span className="text-note whitespace-nowrap text-muted">* Campo obligatorio</span>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <SectionCard title="Recomendación">
          <div className="flex flex-col gap-5">
            <FormField label="Patología" required error={fieldErrors.pathologyId}>
              <select
                className={inputClass}
                value={form.pathologyId}
                onChange={(event) => updateField('pathologyId', event.target.value)}
                aria-invalid={Boolean(fieldErrors.pathologyId)}
                required
              >
                <option value="">Elegí una patología</option>
                {pathologies.map((pathology) => (
                  <option key={pathology.id} value={pathology.id}>
                    {pathology.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Título" required error={fieldErrors.title}>
              <input
                className={inputClass}
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                aria-invalid={Boolean(fieldErrors.title)}
                required
              />
            </FormField>

            <FormField label="Texto" required error={fieldErrors.text}>
              <textarea
                className={`${textareaClass} min-h-40`}
                value={form.text}
                onChange={(event) => updateField('text', event.target.value)}
                aria-invalid={Boolean(fieldErrors.text)}
                required
              />
            </FormField>
          </div>
        </SectionCard>

        {isEditMode && (
          <SectionCard title="Vigencia">
            <label className="flex items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.active}
                onChange={(event) => updateField('active', event.target.checked)}
              />
              <span>
                Vigente
                <span className="mt-1 block text-body-sm text-muted">
                  Si la desmarcás, la recomendación deja de ofrecerse, pero no se borra: la podés volver a activar.
                </span>
              </span>
            </label>
          </SectionCard>
        )}

        {formError && !hasFieldErrors && (
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
            {isSubmitting ? 'Guardando...' : 'Guardar recomendación'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default RecommendationForm;
