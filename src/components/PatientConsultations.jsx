import { useCallback, useEffect, useState } from 'react';
import { createConsultation, listConsultations } from '../api/patientConsultations';
import { CONSULTATION_TEXT_FIELDS, complianceBadge, consultationTypeLabel } from '../pages/patientConsultations';
import { formatDate } from '../utils/date';
import ConsultationForm from './ConsultationForm';
import SectionCard from './SectionCard';
import Badge from './Badge';
import Button from './Button';

const FIELD_GRID = 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4';
const LABEL = 'text-xs text-muted';
const VALUE = 'text-sm whitespace-pre-line text-ink';

// Una consulta del historial. Los datos opcionales que no se cargaron no se
// muestran, para que una consulta corta no quede llena de "Sin dato".
function ConsultationCard({ consultation }) {
  const filledFields = CONSULTATION_TEXT_FIELDS.filter((field) => consultation[field.name]);

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink">{formatDate(consultation.date)}</span>
        <Badge tone={consultation.type === 'first' ? 'mint' : 'neutral'}>
          {consultationTypeLabel(consultation.type)}
        </Badge>
      </div>

      {filledFields.length > 0 && (
        <div className={FIELD_GRID}>
          {filledFields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1">
              <span className={LABEL}>{field.label}</span>
              <span className={VALUE}>{consultation[field.name]}</span>
            </div>
          ))}
        </div>
      )}

      {consultation.observations && (
        <div className="flex flex-col gap-1">
          <span className={LABEL}>Observaciones</span>
          <p className={VALUE}>{consultation.observations}</p>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Hábitos pautados</span>
        {consultation.habits.length === 0 ? (
          <p className="text-sm text-muted">Sin hábitos pautados</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {consultation.habits.map((habit) => {
              const badge = complianceBadge(habit.compliance);
              return (
                <li key={habit.id} className="flex items-start justify-between gap-3 text-sm text-ink">
                  <span>{habit.description}</span>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}

// Pestaña Consultas de la ficha (T19): historial, de la más reciente a la más
// antigua (el orden lo da el backend), y alta inline. `onChange` avisa a la
// ficha que se guardó una consulta, para que muestre la nueva última
// actualización.
function PatientConsultations({ patientId, onChange }) {
  const [consultations, setConsultations] = useState(null);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(
    () =>
      listConsultations(patientId).then((data) => {
        setConsultations(data);
        setError('');
      }),
    [patientId],
  );

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  // Los errores de guardado los muestra el formulario en su campo.
  async function handleSubmit(payload) {
    await createConsultation(patientId, payload);
    setIsCreating(false);
    await load().catch((err) => setError(err.message));
    onChange?.();
  }

  return (
    <SectionCard title="Consultas" subtitle="Registro de cada encuentro con el paciente.">
      <div className="flex flex-col gap-5">
        {error && (
          <p className="text-body-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {!consultations && !error && <p className="text-sm text-muted">Cargando consultas...</p>}

        {isCreating ? (
          <ConsultationForm
            hasConsultations={consultations.length > 0}
            onSubmit={handleSubmit}
            onCancel={() => setIsCreating(false)}
          />
        ) : (
          consultations && (
            <div>
              <Button variant="secondary" onClick={() => setIsCreating(true)}>
                + Nueva consulta
              </Button>
            </div>
          )
        )}

        {consultations?.length === 0 && <p className="text-sm text-muted">Sin consultas registradas</p>}

        {consultations?.map((consultation) => (
          <ConsultationCard key={consultation.id} consultation={consultation} />
        ))}
      </div>
    </SectionCard>
  );
}

export default PatientConsultations;
