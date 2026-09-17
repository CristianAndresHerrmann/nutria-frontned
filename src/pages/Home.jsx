import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPatients } from '../api/patients';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/date';
import { initialsOf } from '../utils/initials';
import SectionCard from '../components/SectionCard';
import '../components/buttons.css';
import './Home.css';

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
      <p className="home__status home__status--error" role="alert">
        {error}
      </p>
    );
  }

  if (!patients) {
    return <p className="home__status">Cargando...</p>;
  }

  const recentPatients = patients.slice(0, 3);

  return (
    <div className="home">
      <div className="home__header">
        <div>
          <h1 className="home__title">Hola, {firstNameOf(nutritionist?.name) || 'Nutricionista'}</h1>
          <p className="home__subtitle">Gestioná tus pacientes desde un único lugar.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/pacientes/nuevo')}>
          + Nuevo paciente
        </button>
      </div>

      <div className="home__stat-card">
        <span className="home__stat-label">Total de pacientes</span>
        <div className="home__stat-row">
          <span className="home__stat-value">{patients.length}</span>
          <button type="button" className="home__link" onClick={() => navigate('/pacientes')}>
            Ver todos →
          </button>
        </div>
      </div>

      <SectionCard title="Pacientes recientes" subtitle="Últimas fichas actualizadas">
        {recentPatients.length === 0 ? (
          <p className="home__status">Todavía no hay pacientes cargados.</p>
        ) : (
          <ul className="home__list">
            {recentPatients.map((patient) => (
              <li key={patient.id} className="home__list-item">
                <button type="button" className="home__patient-cell" onClick={() => navigate(`/pacientes/${patient.id}`)}>
                  <span className="home__avatar">{initialsOf(patient)}</span>
                  <span className="home__patient-info">
                    <span className="home__patient-name">
                      {patient.firstName} {patient.lastName}
                    </span>
                    <span className="home__patient-goal">{patient.goal || 'Sin dato'}</span>
                  </span>
                </button>
                <span className="home__patient-date">Actualizado {formatDateTime(patient.updatedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

export default Home;
