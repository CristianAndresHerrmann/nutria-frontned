import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPatients } from '../api/patients';
import { formatDateTime } from '../utils/date';
import { initialsOf } from '../utils/initials';
import Badge from '../components/Badge';
import searchIcon1 from '../assets/icons/search-1.svg';
import searchIcon2 from '../assets/icons/search-2.svg';
import rowDot from '../assets/icons/row-dot.svg';
import '../components/buttons.css';
import './Patients.css';

function fullName(patient) {
  return `${patient.firstName} ${patient.lastName}`.trim();
}

function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    listPatients()
      .then((data) => {
        if (!cancelled) setPatients(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((patient) => fullName(patient).toLowerCase().includes(term));
  }, [patients, search]);

  return (
    <div className="patients">
      <div className="patients__header">
        <div>
          <h1 className="patients__title">Pacientes</h1>
          <p className="patients__subtitle">Gestioná la información de tus pacientes.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/pacientes/nuevo')}>
          + Nuevo paciente
        </button>
      </div>

      <div className="patients__card">
        <div className="patients__toolbar">
          <div className="patients__search">
            <span className="patients__search-icon">
              <img src={searchIcon1} alt="" style={{ position: 'absolute', inset: '69.42% 12.5% 12.5% 69.42%' }} />
              <img src={searchIcon2} alt="" style={{ position: 'absolute', inset: '12.5% 20.83% 20.83% 12.5%' }} />
            </span>
            <input
              type="search"
              className="patients__search-input"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar paciente por nombre"
            />
          </div>
          <span className="patients__count">{patients.length} pacientes</span>
        </div>

        {isLoading && <p className="patients__status">Cargando pacientes...</p>}
        {error && (
          <p className="patients__status patients__status--error" role="alert">
            {error}
          </p>
        )}

        {!isLoading && !error && filteredPatients.length === 0 && (
          <p className="patients__status">
            {patients.length === 0 ? 'Todavía no hay pacientes cargados.' : 'No hay pacientes que coincidan con la búsqueda.'}
          </p>
        )}

        {!isLoading && !error && filteredPatients.length > 0 && (
          <table className="patients__table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Edad</th>
                <th>Objetivo</th>
                <th>Última actualización</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <button type="button" className="patients__patient-cell" onClick={() => navigate(`/pacientes/${patient.id}`)}>
                      <span className="patients__avatar">{initialsOf(patient)}</span>
                      <span className="patients__patient-name">{fullName(patient)}</span>
                    </button>
                    {!patient.registrationComplete && (
                      <Badge tone="warning">Ficha incompleta</Badge>
                    )}
                  </td>
                  <td>{patient.age === null ? 'Sin dato' : `${patient.age} años`}</td>
                  <td>{patient.goal ? <Badge tone="mint">{patient.goal}</Badge> : 'Sin dato'}</td>
                  <td>{formatDateTime(patient.updatedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="patients__open-button"
                      onClick={() => navigate(`/pacientes/${patient.id}`)}
                      aria-label={`Abrir ficha de ${fullName(patient)}`}
                    >
                      <img src={rowDot} alt="" />
                      <img src={rowDot} alt="" />
                      <img src={rowDot} alt="" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Patients;
