import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPatient } from '../api/patients';
import { formatDate } from '../utils/date';
import { initialsOf } from '../utils/initials';
import SectionCard from '../components/SectionCard';
import Badge from '../components/Badge';
import iconArrowLeft from '../assets/icons/icon-arrow-left.svg';
import '../components/buttons.css';
import './PatientDetail.css';

const TABS = ['Resumen', 'Información clínica', 'Hábitos y alimentación', 'Planes'];

function Field({ label, value }) {
  return (
    <div className="patient-detail__field">
      <span className="patient-detail__field-label">{label}</span>
      <span className="patient-detail__field-value">{value || 'Sin dato'}</span>
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

  if (error) {
    return (
      <p className="patient-detail__status patient-detail__status--error" role="alert">
        {error}
      </p>
    );
  }

  if (!patient) {
    return <p className="patient-detail__status">Cargando ficha...</p>;
  }

  const isMinor = patient.age !== null && patient.age < 18;

  return (
    <div className="patient-detail">
      <button type="button" className="patient-detail__back" onClick={() => navigate('/pacientes')}>
        <img src={iconArrowLeft} alt="" />
        Volver a pacientes
      </button>

      <div className="patient-detail__header">
        <div className="patient-detail__identity">
          <span className="patient-detail__avatar">{initialsOf(patient)}</span>
          <div>
            <h1 className="patient-detail__title">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="patient-detail__meta">
              {patient.age === null ? 'Sin dato' : `${patient.age} años`}
              {patient.goal && (
                <>
                  {' · '}
                  <Badge tone="mint">{patient.goal}</Badge>
                </>
              )}
              {!patient.registrationComplete && <Badge tone="warning">Ficha incompleta</Badge>}
            </p>
          </div>
        </div>
        <button type="button" className="btn btn--secondary" onClick={() => navigate(`/pacientes/${id}/editar`)}>
          Editar paciente
        </button>
      </div>

      <nav className="patient-detail__tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={tab === activeTab ? 'patient-detail__tab patient-detail__tab--active' : 'patient-detail__tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'Resumen' ? (
        <div className="patient-detail__content">
          <SectionCard title="Datos personales">
            <div className="patient-detail__grid">
              <Field label="Fecha de nacimiento" value={patient.birthDate ? formatDate(patient.birthDate) : null} />
              <Field label="Teléfono" value={patient.phone} />
              <Field label="Correo" value={patient.email} />
              <Field label="Vive con" value={patient.livesWith} />
            </div>
          </SectionCard>

          <SectionCard title="Objetivo" subtitle="El objetivo puede ajustarse durante el proceso.">
            <div className="patient-detail__grid">
              <Field label="Objetivo" value={patient.goal} />
              <Field label="Peso de referencia" value={patient.referenceWeight ? `${patient.referenceWeight} kg` : null} />
            </div>
          </SectionCard>

          {isMinor && (
            <SectionCard title="Adulto responsable">
              <div className="patient-detail__grid">
                <Field label="Nombre" value={patient.guardianName} />
                <Field label="Vínculo" value={patient.guardianRelationship} />
                <Field label="Contacto" value={patient.guardianContact} />
                <Field label="Asiste acompañado" value={patient.attendsAccompanied ? 'Sí' : 'No'} />
              </div>
            </SectionCard>
          )}
        </div>
      ) : (
        <div className="patient-detail__content">
          <SectionCard>
            <p className="patient-detail__soon">Pronto</p>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

export default PatientDetail;
