import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPatient } from '../api/patients';
import { formatDate, formatDateTime } from '../utils/date';
import { initialsOf } from '../utils/initials';
import { CLINICAL_TAB, HABITS_TAB, displayClinicalValue, sectionsForTab } from './patientClinicalFields';
import SectionCard from '../components/SectionCard';
import PatientConditions from '../components/PatientConditions';
import PatientConsultations from '../components/PatientConsultations';
import PatientMeasurements from '../components/PatientMeasurements';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import BackButton from '../components/BackButton';
import Button from '../components/Button';

const CONSULTATIONS_TAB = 'Consultas';
const MEASUREMENTS_TAB = 'Mediciones';
const TABS = ['Resumen', CLINICAL_TAB, HABITS_TAB, CONSULTATIONS_TAB, MEASUREMENTS_TAB, 'Planes'];

const FIELD_GRID = 'grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4';

// `wide` ocupa la fila entera (texto largo); whitespace-pre-line respeta los
// saltos de línea que se cargaron en un textarea.
function Field({ label, value, wide = false }) {
  return (
    <div className={`flex flex-col gap-1 ${wide ? 'col-span-full' : ''}`}>
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm font-medium whitespace-pre-line text-ink">{value || 'Sin dato'}</span>
    </div>
  );
}

function ClinicalSections({ tab, patient }) {
  return (
    <div className="flex flex-col gap-5">
      {sectionsForTab(tab).map((section) => (
        <SectionCard key={section.title} title={section.title} subtitle={section.subtitle}>
          <div className={FIELD_GRID}>
            {section.fields.map((field) => (
              <Field
                key={field.name}
                label={field.label}
                value={displayClinicalValue(field, patient)}
                wide={field.kind === 'textarea'}
              />
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Resumen');

  useEffect(() => {
    let cancelled = false;

    getPatient(id)
      .then((data) => {
        if (!cancelled) setPatient(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Tras cambiar una condición: el aviso de datos clínicos faltantes (RF-45)
  // se calcula en el backend con las condiciones del paciente. Tras guardar una
  // consulta: el backend movió la última actualización. Si falla, la ficha
  // sigue mostrando lo que ya tenía.
  const refreshPatient = useCallback(() => {
    getPatient(id)
      .then(setPatient)
      .catch(() => {});
  }, [id]);

  if (error) {
    return (
      <p className="text-sm text-danger" role="alert">
        {error}
      </p>
    );
  }

  if (!patient) {
    return <p className="text-sm text-muted">Cargando ficha...</p>;
  }

  const isMinor = patient.age !== null && patient.age < 18;

  return (
    <div>
      <BackButton onClick={() => navigate('/pacientes')}>Volver a pacientes</BackButton>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar size="lg">{initialsOf(patient)}</Avatar>
          <div>
            <h1 className="text-2xl font-bold text-ink">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-muted">
              {patient.age === null ? 'Sin dato' : `${patient.age} años`}
              {patient.goal && (
                <>
                  {' · '}
                  <Badge tone="mint">{patient.goal}</Badge>
                </>
              )}
              {!patient.registrationComplete && <Badge tone="warning">Ficha incompleta</Badge>}
            </p>
            <p className="mt-1 text-xs text-muted">Última actualización: {formatDateTime(patient.updatedAt)}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/pacientes/${id}/editar`)}>
          Editar paciente
        </Button>
      </div>

      {/* RF-45: advertencia, no bloquea nada. La confirmación antes de aprobar un plan es del Incremento 4. */}
      {patient.missingClinicalData && (
        <p className="mb-6 rounded-xl bg-warning-bg px-3.5 py-2.5 text-body-sm text-warning" role="status">
          No hay patologías, alergias, intolerancias ni medicación registradas para este paciente.
        </p>
      )}

      <nav className="mb-6 flex gap-1 border-b border-line">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === activeTab ? 'border-primary text-primary' : 'border-transparent text-muted'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'Resumen' && (
        <div className="flex flex-col gap-5">
          <SectionCard title="Datos personales">
            <div className={FIELD_GRID}>
              <Field label="Fecha de nacimiento" value={patient.birthDate ? formatDate(patient.birthDate) : null} />
              <Field label="Teléfono" value={patient.phone} />
              <Field label="Correo" value={patient.email} />
              <Field label="Vive con" value={patient.livesWith} />
            </div>
          </SectionCard>

          <SectionCard title="Objetivo" subtitle="El objetivo puede ajustarse durante el proceso.">
            <div className={FIELD_GRID}>
              <Field label="Objetivo" value={patient.goal} />
              <Field label="Peso de referencia" value={patient.referenceWeight ? `${patient.referenceWeight} kg` : null} />
            </div>
          </SectionCard>

          {isMinor && (
            <SectionCard title="Adulto responsable">
              <div className={FIELD_GRID}>
                <Field label="Nombre" value={patient.guardianName} />
                <Field label="Vínculo" value={patient.guardianRelationship} />
                <Field label="Contacto" value={patient.guardianContact} />
                <Field label="Asiste acompañado" value={patient.attendsAccompanied ? 'Sí' : 'No'} />
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {(activeTab === CLINICAL_TAB || activeTab === HABITS_TAB) && (
        <div className="flex flex-col gap-5">
          <ClinicalSections tab={activeTab} patient={patient} />
          {activeTab === CLINICAL_TAB && <PatientConditions patientId={id} onChange={refreshPatient} />}
        </div>
      )}

      {activeTab === CONSULTATIONS_TAB && <PatientConsultations patientId={id} onChange={refreshPatient} />}

      {activeTab === MEASUREMENTS_TAB && <PatientMeasurements patientId={id} />}

      {activeTab === 'Planes' && (
        <div className="flex flex-col gap-5">
          <SectionCard>
            <p className="text-sm text-muted">Pronto</p>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

export default PatientDetail;
