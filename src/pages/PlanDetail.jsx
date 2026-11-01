import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPatient } from '../api/patients';
import { getPlan } from '../api/patientPlans';
import { usePatientData } from '../hooks/usePatientData';
import { formatDateTime } from '../utils/date';
import { mealTypeLabel } from '../utils/recipeLabels';
import {
  findingCounts,
  groupFindings,
  itemDisplay,
  optionDescription,
  planStatusLabel,
  planTextSections,
  recommendationSections,
  severityBadge,
} from './patientPlans';
import SectionCard from '../components/SectionCard';
import MissingClinicalDataWarning from '../components/MissingClinicalDataWarning';
import Badge from '../components/Badge';
import BackButton from '../components/BackButton';

const TEXT = 'text-sm whitespace-pre-line text-ink';

function FindingList({ findings }) {
  if (!findings?.length) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {findings.map((finding) => {
        const badge = severityBadge(finding.severity);
        return (
          <li key={finding.id} className="flex min-w-0 flex-col items-start gap-1.5 text-body-sm text-ink sm:flex-row">
            <Badge tone={badge.tone}>{badge.label}</Badge>
            <span className="min-w-0 break-words">{finding.message}</span>
          </li>
        );
      })}
    </ul>
  );
}

// Un ítem con sus hallazgos al lado (bloqueantes y advertencias). Un ítem no
// reconocido queda destacado: bloquea hasta reemplazarlo (DA-30).
function OptionItem({ item, findings }) {
  const { text, kind } = itemDisplay(item);
  const unrecognized = item.type === 'unrecognized';
  return (
    <li
      className={`flex min-w-0 flex-col gap-2 rounded-xl border px-3.5 py-2.5 ${
        unrecognized ? 'border-danger bg-danger-bg' : 'border-line'
      }`}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="min-w-0 break-words text-sm font-medium text-ink">{text}</span>
        {kind && <Badge tone={unrecognized ? 'danger' : 'neutral'}>{kind}</Badge>}
      </div>
      <FindingList findings={findings} />
    </li>
  );
}

function MealCard({ meal, findings }) {
  return (
    <SectionCard title={mealTypeLabel(meal.mealType)} subtitle={meal.instructions}>
      <div className="flex flex-col gap-4">
        {meal.options.map((option) => {
          const description = optionDescription(option);
          return (
            <article key={option.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-line p-4">
              <div className="min-w-0 break-words">
                <h3 className="text-sm font-semibold text-ink">Opción {option.order}</h3>
                {description && <p className={`mt-1 ${TEXT}`}>{description}</p>}
              </div>
              {option.items.length === 0 ? (
                <p className="text-sm text-muted">Sin ítems</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {option.items.map((item) => (
                    <OptionItem key={item.id} item={item} findings={findings.byItem.get(item.id)} />
                  ))}
                </ul>
              )}
              <FindingList findings={findings.byOption.get(option.id)} />
            </article>
          );
        })}
      </div>
    </SectionCard>
  );
}

function PlanDetail() {
  const { id, planId } = useParams();
  return <PlanDetailContent key={`${id}/${planId}`} patientId={id} planId={planId} />;
}

// Vista de solo lectura de una propuesta de plan (T39; RF-34). La edición es de
// otra tarea; la leyenda deja claro que es un borrador a revisar (RNF-10).
function PlanDetailContent({ patientId, planId }) {
  const navigate = useNavigate();
  const loadPlan = useCallback((id) => getPlan(id, planId), [planId]);
  const { data: plan, error } = usePatientData(patientId, loadPlan);
  // La ficha solo aporta el nombre y el aviso RF-45: si falla, la propuesta se
  // muestra igual.
  const { data: patient } = usePatientData(patientId, getPatient);

  const back = (
    <BackButton onClick={() => navigate(`/pacientes/${patientId}`, { state: { tab: 'Planes' } })}>
      Volver a la ficha
    </BackButton>
  );

  if (error && !plan) {
    return (
      <div>
        {back}
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div>
        {back}
        <p className="text-sm text-muted">Cargando propuesta...</p>
      </div>
    );
  }

  const findings = groupFindings(plan.findings);
  const counts = findingCounts(plan.findings);
  const recommendations = recommendationSections(plan);

  return (
    <div>
      {back}

      <div className="mb-6 min-w-0 break-words">
        <h1 className="text-2xl font-bold text-ink">Propuesta de plan alimentario</h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
          {patient && `${patient.firstName} ${patient.lastName} · `}
          <Badge tone="neutral">{planStatusLabel(plan.status)}</Badge>
        </p>
        {plan.generation && (
          <p className="mt-1 text-xs text-muted">Generada con IA: {formatDateTime(plan.generation.generatedAt)}</p>
        )}
      </div>

      <p className="mb-6 rounded-xl bg-notice-bg px-3.5 py-2.5 text-body-sm text-notice" role="note">
        Propuesta generada con IA: es un borrador editable, no un plan definitivo. El profesional debe revisarla y
        validarla antes de usarla con el paciente.
      </p>

      {patient?.missingClinicalData && <MissingClinicalDataWarning />}

      <div className="flex flex-col gap-5">
        <SectionCard title="Hallazgos" subtitle="Resultado de las reglas clínicas sobre esta propuesta.">
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
              <p className="text-body-sm text-muted">Cada hallazgo se muestra junto al ítem o la opción que lo origina.</p>
            )}
            <FindingList findings={findings.general} />
          </div>
        </SectionCard>

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
          <MealCard key={meal.id} meal={meal} findings={findings} />
        ))}
      </div>
    </div>
  );
}

export default PlanDetail;
