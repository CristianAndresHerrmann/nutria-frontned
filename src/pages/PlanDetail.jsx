import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPatient } from '../api/patients';
import { getPlan, updatePlan } from '../api/patientPlans';
import { usePatientData } from '../hooks/usePatientData';
import { useFormErrors } from '../hooks/useFormErrors';
import { formatDateTime } from '../utils/date';
import {
  TEXT_SECTIONS,
  editableRecommendationSections,
  findingCounts,
  groupFindings,
  planStatusLabel,
  planTextSections,
  recommendationSections,
} from './patientPlans';
import { PLAN_TEXT_MAX_LENGTH, formToPayload, planToForm, sameContent, setText } from './planForm';
import SectionCard from '../components/SectionCard';
import MissingClinicalDataWarning from '../components/MissingClinicalDataWarning';
import Badge from '../components/Badge';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import FindingList from '../components/FindingList';
import FormError from '../components/FormError';
import FormField, { textareaClass } from '../components/FormField';
import PlanMealFields from '../components/PlanMealFields';
import PlanMealView from '../components/PlanMealView';

const TEXT = 'text-sm whitespace-pre-line text-ink';
const UNSAVED_MESSAGE = 'Hay cambios sin guardar. ¿Salir igual?';
const DISCARD_MESSAGE = 'Hay cambios sin guardar. ¿Descartarlos?';

function PlanDetail() {
  const { id, planId } = useParams();
  return <PlanDetailContent key={`${id}/${planId}`} patientId={id} planId={planId} />;
}

// Propuesta de plan (T39) y su edición (T40; RF-40, RF-46). Abrirla revalida el
// borrador en el backend, así que muestra los hallazgos con las condiciones
// actuales del paciente.
function PlanDetailContent({ patientId, planId }) {
  const navigate = useNavigate();
  const loadPlan = useCallback((id) => getPlan(id, planId), [planId]);
  const { data: plan, error } = usePatientData(patientId, loadPlan);
  // La ficha solo aporta el nombre y el aviso RF-45: si falla, la propuesta se
  // muestra igual.
  const { data: patient } = usePatientData(patientId, getPatient);

  const goBack = useCallback(
    () => navigate(`/pacientes/${patientId}`, { state: { tab: 'Planes' } }),
    [navigate, patientId],
  );

  if (error && !plan) {
    return (
      <div>
        <BackButton onClick={goBack}>Volver a la ficha</BackButton>
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div>
        <BackButton onClick={goBack}>Volver a la ficha</BackButton>
        <p className="text-sm text-muted">Cargando propuesta...</p>
      </div>
    );
  }

  return <PlanScreen initialPlan={plan} patient={patient} patientId={patientId} onBack={goBack} />;
}

// La propuesta se abre en lectura: es un borrador a revisar (RNF-10), y se
// edita a pedido con "Editar propuesta". `plan` es la última versión guardada
// (con sus hallazgos) y `form`, el borrador en edición o null mientras se lee.
function PlanScreen({ initialPlan, patient, patientId, onBack }) {
  const [plan, setPlan] = useState(initialPlan);
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState('');
  const saved = useMemo(() => planToForm(plan), [plan]);

  const editing = form !== null;
  const hasChanges = editing && !sameContent(form, saved);

  // Recargar o cerrar la pestaña con cambios pide confirmación al navegador.
  useEffect(() => {
    if (!hasChanges) return undefined;
    function warn(event) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanges]);

  function handleBack() {
    if (hasChanges && !window.confirm(UNSAVED_MESSAGE)) return;
    onBack();
  }

  function startEditing() {
    setForm(saved);
    setNotice('');
  }

  function cancelEditing() {
    if (hasChanges && !window.confirm(DISCARD_MESSAGE)) return;
    setForm(null);
  }

  function handleSaved(updated) {
    setPlan(updated);
    setForm(null);
    setNotice('Cambios guardados. Los hallazgos se actualizaron.');
  }

  const findings = groupFindings(plan.findings);
  const counts = findingCounts(plan.findings);

  return (
    <div>
      <BackButton onClick={handleBack}>Volver a la ficha</BackButton>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 break-words">
          <h1 className="text-2xl font-bold text-ink">Propuesta de plan alimentario</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            {patient && `${patient.firstName} ${patient.lastName} · `}
            <Badge tone="neutral">{planStatusLabel(plan.status)}</Badge>
          </p>
          {plan.generation && (
            <p className="mt-1 text-xs text-muted">Generada con IA: {formatDateTime(plan.generation.generatedAt)}</p>
          )}
        </div>
        {!editing && (
          <Button className="self-start" onClick={startEditing}>
            Editar propuesta
          </Button>
        )}
      </div>

      <p className="mb-6 rounded-xl bg-notice-bg px-3.5 py-2.5 text-body-sm text-notice" role="note">
        Propuesta generada con IA: es un borrador que requiere revisión, no un plan definitivo. El profesional debe
        revisarla y validarla antes de usarla con el paciente.
      </p>

      {patient?.missingClinicalData && <MissingClinicalDataWarning />}

      {notice && (
        <p className="mb-6 rounded-xl bg-mint-50 px-3.5 py-2.5 text-body-sm text-mint-700" role="status">
          {notice}
        </p>
      )}

      <div className="flex flex-col gap-5">
        <SectionCard title="Hallazgos" subtitle="Resultado de las reglas clínicas sobre la última versión guardada.">
          <div className="flex flex-col gap-3">
            <p className="flex flex-wrap items-center gap-2 text-sm text-ink">
              <Badge tone={counts.blocking > 0 ? 'danger' : 'neutral'}>
                {counts.blocking} {counts.blocking === 1 ? 'bloqueante' : 'bloqueantes'}
              </Badge>
              <Badge tone={counts.warning > 0 ? 'warning' : 'neutral'}>
                {counts.warning} {counts.warning === 1 ? 'advertencia' : 'advertencias'}
              </Badge>
            </p>
            {plan.findings.length > 0 && (
              <p className="text-body-sm text-muted">
                Cada hallazgo se muestra junto al ítem o la opción que lo origina. Un bloqueo se levanta editando la
                propuesta y guardando la corrección de lo que lo produce.
              </p>
            )}
            {hasChanges && (
              <p className="rounded-xl bg-notice-bg px-3.5 py-2.5 text-body-sm text-notice">
                Hay cambios sin guardar: los hallazgos corresponden a la última versión guardada.
              </p>
            )}
            <FindingList findings={findings.general} />
          </div>
        </SectionCard>

        {editing ? (
          <PlanEditor
            plan={plan}
            form={form}
            findings={findings}
            hasChanges={hasChanges}
            patientId={patientId}
            onChange={setForm}
            onSaved={handleSaved}
            onCancel={cancelEditing}
          />
        ) : (
          <PlanView plan={plan} findings={findings} />
        )}
      </div>
    </div>
  );
}

// El borrador en lectura (T39).
function PlanView({ plan, findings }) {
  const recommendations = recommendationSections(plan);
  return (
    <>
      {planTextSections(plan).map((section) => (
        <SectionCard key={section.name} title={section.label}>
          <p className={TEXT}>{section.text || 'Sin dato'}</p>
        </SectionCard>
      ))}

      <SectionCard title="Recomendaciones">
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted">Sin recomendaciones</p>
        ) : (
          <div className="flex flex-col gap-4">
            {recommendations.map((section) => (
              <div key={section.name} className="flex min-w-0 flex-col gap-1">
                <h3 className="text-xs text-muted">{section.label}</h3>
                <p className={TEXT}>{section.text}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {plan.meals.map((meal) => (
        <PlanMealView key={meal.id} meal={meal} findings={findings} />
      ))}
    </>
  );
}

// El borrador en edición (T40). Un bloqueo solo se levanta al guardar la
// corrección: el backend revalida y responde los hallazgos nuevos.
function PlanEditor({ plan, form, findings, hasChanges, patientId, onChange, onSaved, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fieldErrors, formError, reset, clearField, showError } = useFormErrors();

  function updateText(name, value) {
    onChange((current) => setText(current, name, value));
    clearField(name);
  }

  // Los errores de ítems y opciones llegan todos en `meals`.
  function updateMeals(change) {
    onChange(change);
    clearField('meals');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    reset();
    setIsSubmitting(true);

    try {
      // Los ids cambian en cada guardado: la vista se arma de nuevo con la
      // respuesta para ubicar los hallazgos nuevos.
      onSaved(await updatePlan(patientId, plan.id, formToPayload(form)));
    } catch (err) {
      showError(err);
      setIsSubmitting(false);
    }
  }

  function textField({ name, label }) {
    return (
      <FormField key={name} label={label} error={fieldErrors[name]}>
        <textarea
          className={textareaClass}
          value={form.texts[name]}
          maxLength={PLAN_TEXT_MAX_LENGTH}
          onChange={(event) => updateText(name, event.target.value)}
          aria-invalid={Boolean(fieldErrors[name])}
        />
      </FormField>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <SectionCard title="Textos de la propuesta">
        <div className="flex flex-col gap-5">{TEXT_SECTIONS.map(textField)}</div>
      </SectionCard>

      <SectionCard title="Recomendaciones">
        <div className="flex flex-col gap-5">{editableRecommendationSections(plan).map(textField)}</div>
      </SectionCard>

      {fieldErrors.meals && (
        <p className="rounded-xl bg-danger-bg px-3.5 py-2.5 text-body-sm text-danger" role="alert">
          {fieldErrors.meals}
        </p>
      )}

      {form.meals.map((meal) => (
        <PlanMealFields key={meal.mealType} meal={meal} findings={findings} patientId={patientId} onChange={updateMeals} />
      ))}

      <div className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-line bg-surface/95 py-3 backdrop-blur-xs sm:flex-row sm:items-center sm:justify-end sm:gap-4">
        <FormError message={formError} />
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!hasChanges || isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}

export default PlanDetail;
