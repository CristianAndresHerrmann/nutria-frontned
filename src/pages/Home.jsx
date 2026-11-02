import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPatients } from '../api/patients';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/date';
import { initialsOf } from '../utils/initials';
import SectionCard from '../components/SectionCard';
import Avatar from '../components/Avatar';
import Button from '../components/Button';

function firstNameOf(fullName) {
  return fullName ? fullName.trim().split(/\s+/)[0] : '';
}

function Home() {
  const { nutritionist } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    listPatients()
      .then((data) => {
        if (!cancelled) setPatients(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <p className="text-sm text-danger" role="alert">
        {error}
      </p>
    );
  }

  if (!patients) {
    return <p className="text-sm text-muted">Cargando...</p>;
  }

  const recentPatients = patients.slice(0, 3);

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="min-w-0">
          <h1 className="text-title font-bold text-ink">Hola, {firstNameOf(nutritionist?.name) || 'Nutricionista'}</h1>
          <p className="mt-2 text-sm text-muted">Gestioná tus pacientes desde un único lugar.</p>
        </div>
        <Button onClick={() => navigate('/pacientes/nuevo')}>+ Nuevo paciente</Button>
      </div>

      <div className="mb-5 flex w-full flex-col gap-2 rounded-2xl border border-line bg-white px-6 py-5 shadow-card sm:max-w-80">
        <span className="text-body-sm text-muted">Total de pacientes</span>
        <div className="flex items-baseline justify-between">
          <span className="text-[32px] font-bold text-primary">{patients.length}</span>
          <button type="button" className="text-body-sm font-semibold text-primary hover:underline" onClick={() => navigate('/pacientes')}>
            Ver todos →
          </button>
        </div>
      </div>

      <SectionCard title="Pacientes recientes" subtitle="Últimas fichas actualizadas">
        {recentPatients.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay pacientes cargados.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {recentPatients.map((patient) => (
              <li key={patient.id} className="flex min-w-0 flex-col items-start justify-between gap-2 py-2 sm:flex-row sm:items-center xl:gap-0">
                <button type="button" className="group inline-flex min-w-0 items-center gap-3 text-left" onClick={() => navigate(`/pacientes/${patient.id}`)}>
                  <Avatar>{initialsOf(patient)}</Avatar>
                  <span className="flex min-w-0 flex-col items-start">
                    <span className="text-sm font-semibold text-ink group-hover:text-primary">
                      {patient.firstName} {patient.lastName}
                    </span>
                    <span className="text-note text-muted">{patient.goal || 'Sin dato'}</span>
                  </span>
                </button>
                <span className="text-body-sm text-muted sm:shrink-0 sm:whitespace-nowrap">Actualizado {formatDateTime(patient.updatedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export default Home;
