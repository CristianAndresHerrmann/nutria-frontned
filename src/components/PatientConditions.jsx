import { useState } from 'react';
import { createCondition, deleteCondition, listConditions, updateCondition } from '../api/patientConditions';
import { conditionTargetName, groupConditionsByType } from '../pages/patientConditions';
import { formatDate } from '../utils/date';
import { usePatientData } from '../hooks/usePatientData';
import ConditionForm from './ConditionForm';
import SectionCard from './SectionCard';
import Badge from './Badge';
import Button from './Button';

const LINK_BUTTON = 'text-body-sm font-medium text-primary hover:underline disabled:opacity-50';
const NEW = 'new';

// Condiciones alimentarias en la pestaña de información clínica (T18). Alta,
// edición y baja inline. `onChange` avisa a la ficha que cambiaron, porque el
// aviso de datos clínicos faltantes (RF-45) depende de ellas.
function PatientConditions({ patientId, onChange }) {
  const { data: conditions, error: loadError, reload, isCurrent } = usePatientData(patientId, listConditions);
  const [actionError, setActionError] = useState('');
  const error = actionError || loadError;
  // null: sin formulario; NEW: alta; un id: edición de esa condición.
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function afterChange() {
    if (!isCurrent()) return;
    setEditing(null);
    setActionError('');
    await reload();
    if (isCurrent()) onChange?.();
  }

  // Los errores de guardado los muestra el formulario en su campo.
  async function handleSubmit(payload) {
    if (editing === NEW) await createCondition(patientId, payload);
    else await updateCondition(patientId, editing, payload);
    await afterChange();
  }

  async function handleDelete(condition, groupLabel) {
    if (!window.confirm(`¿Eliminar "${conditionTargetName(condition)}" de ${groupLabel.toLowerCase()}?`)) return;

    setDeletingId(condition.id);
    setActionError('');
    try {
      await deleteCondition(patientId, condition.id);
      await afterChange();
    } catch (err) {
      if (isCurrent()) setActionError(err.message);
    } finally {
      if (isCurrent()) setDeletingId(null);
    }
  }

  const editedCondition = conditions?.find((condition) => condition.id === editing) ?? null;

  return (
    <SectionCard
      title="Condiciones alimentarias"
      subtitle="Patologías, alergias, intolerancias, rechazos y preferencias del paciente."
    >
      <div className="flex flex-col gap-5">
        {error && (
          <p className="text-body-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {!conditions && !error && <p className="text-sm text-muted">Cargando condiciones...</p>}

        {editing ? (
          <ConditionForm
            key={editing}
            condition={editedCondition}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        ) : (
          conditions && (
            <div>
              <Button variant="secondary" onClick={() => setEditing(NEW)}>
                + Agregar condición
              </Button>
            </div>
          )
        )}

        {conditions && (
          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {groupConditionsByType(conditions).map((group) => (
              <div key={group.value} className="flex min-w-0 flex-col gap-2">
                <h3 className="text-xs font-bold tracking-[0.3px] text-muted uppercase">{group.label}</h3>
                {group.conditions.length === 0 && <p className="text-sm text-muted">Sin registros</p>}
                {group.conditions.map((condition) => (
                  <div key={condition.id} className="flex flex-col gap-1 rounded-xl border border-line p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 max-w-full break-words text-sm font-semibold text-ink">{conditionTargetName(condition)}</span>
                      {condition.foodGroup && <Badge tone="neutral">Grupo</Badge>}
                    </div>
                    {condition.observations && (
                      <p className="text-body-sm whitespace-pre-line text-ink">{condition.observations}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-4 xl:flex-nowrap">
                      <span className="text-xs text-muted">Registrada el {formatDate(condition.registeredAt)}</span>
                      <button
                        type="button"
                        className={`${LINK_BUTTON} ml-auto`}
                        onClick={() => setEditing(condition.id)}
                        disabled={Boolean(editing) || deletingId === condition.id}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={LINK_BUTTON}
                        onClick={() => handleDelete(condition, group.label)}
                        disabled={Boolean(editing) || deletingId === condition.id}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export default PatientConditions;
