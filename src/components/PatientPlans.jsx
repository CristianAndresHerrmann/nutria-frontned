import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPlans } from '../api/patientPlans';
import { generationErrorMessage, planStatusLabel } from '../pages/patientPlans';
import { formatDateTime } from '../utils/date';
import { usePatientData } from '../hooks/usePatientData';
import SectionCard from './SectionCard';
import DataTable from './DataTable';
import Badge from './Badge';
import Button from './Button';

const NOTICE = 'flex min-w-0 flex-col items-start gap-3 rounded-xl px-3.5 py-2.5 text-body-sm sm:flex-row sm:items-center sm:justify-between';

// Pestaña Planes de la ficha (T39): listado de planes del paciente y generación
// de una propuesta con IA. `generation` viene de usePlanGeneration en la ficha,
// así sobrevive a los cambios de pestaña (RNF-02). Tras generar no se navega
// solo a la propuesta: se ofrece el enlace.
function PatientPlans({ patientId, generation }) {
  const navigate = useNavigate();
  const { data: plans, error, reload } = usePatientData(patientId, listPlans);
  const isGenerating = generation.status === 'generating';
  const generatedPlanId = generation.plan?.id;
  const generationError = generation.error;

  // Un plan nuevo entra al listado. Tras un error también se recarga: si el
  // cliente cortó por timeout, el backend pudo haberlo guardado igual.
  useEffect(() => {
    if (generatedPlanId || generationError) reload();
  }, [generatedPlanId, generationError, reload]);

  const columns = [
    { key: 'createdAt', header: 'Creado', cell: (plan) => formatDateTime(plan.createdAt) },
    { key: 'updatedAt', header: 'Última modificación', cell: (plan) => formatDateTime(plan.updatedAt) },
    { key: 'status', header: 'Estado', cell: (plan) => <Badge tone="neutral">{planStatusLabel(plan.status)}</Badge> },
    {
      key: 'actions',
      header: 'Acciones',
      hideHeader: true,
      cell: (plan) => (
        <Button variant="secondary" onClick={() => navigate(`/pacientes/${patientId}/planes/${plan.id}`)}>
          Ver
        </Button>
      ),
    },
  ];

  return (
    <SectionCard title="Planes" subtitle="Propuestas de plan alimentario generadas para el paciente.">
      <div className="flex flex-col gap-5">
        <div>
          <Button onClick={generation.generate} disabled={isGenerating}>
            {isGenerating ? 'Generando propuesta...' : 'Generar propuesta'}
          </Button>
        </div>

        {isGenerating && (
          <p className="text-body-sm text-muted" role="status">
            Generando la propuesta con IA. Puede tardar hasta 30 segundos; podés seguir usando la ficha.
          </p>
        )}

        {generation.status === 'error' && (
          <div className={`${NOTICE} bg-danger-bg`}>
            <p className="min-w-0 break-words text-danger" role="alert">
              {generationErrorMessage(generationError)}
            </p>
            <Button variant="secondary" onClick={generation.generate}>
              Reintentar
            </Button>
          </div>
        )}

        {generation.status === 'done' && (
          <div className={`${NOTICE} bg-mint-50`}>
            <p className="min-w-0 break-words text-mint-700" role="status">
              Propuesta generada.
            </p>
            <Button variant="secondary" onClick={() => navigate(`/pacientes/${patientId}/planes/${generatedPlanId}`)}>
              Ver propuesta
            </Button>
          </div>
        )}

        {error && (
          <p className="text-body-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {!plans && !error && <p className="text-sm text-muted">Cargando planes...</p>}

        {plans?.length === 0 && <p className="text-sm text-muted">Sin planes registrados</p>}

        {plans?.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-line">
            <DataTable columns={columns} rows={plans} rowKey={(plan) => plan.id} />
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export default PatientPlans;
