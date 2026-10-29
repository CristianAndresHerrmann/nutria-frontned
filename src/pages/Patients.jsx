import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPatients } from '../api/patients';
import { formatDateTime } from '../utils/date';
import { initialsOf } from '../utils/initials';
import { usePagination } from '../hooks/usePagination';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import TablePagination from '../components/TablePagination';
import { inputClass } from '../components/FormField';
import searchIcon1 from '../assets/icons/search-1.svg';
import searchIcon2 from '../assets/icons/search-2.svg';
import rowDot from '../assets/icons/row-dot.svg';

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

  const pagination = usePagination(filteredPatients, { resetKey: search.trim().toLowerCase() });

  const columns = [
    {
      key: 'name',
      header: 'Paciente',
      cell: (patient) => (
        <div className="flex items-center gap-2.5">
          <button type="button" className="group inline-flex items-center gap-3" onClick={() => navigate(`/pacientes/${patient.id}`)}>
            <Avatar>{initialsOf(patient)}</Avatar>
            <span className="text-sm font-semibold text-ink group-hover:text-primary">{fullName(patient)}</span>
          </button>
          {!patient.registrationComplete && <Badge tone="warning">Ficha incompleta</Badge>}
        </div>
      ),
    },
    { key: 'age', header: 'Edad', cell: (patient) => (patient.age === null ? 'Sin dato' : `${patient.age} años`) },
    {
      key: 'goal',
      header: 'Objetivo',
      cell: (patient) => (patient.goal ? <Badge tone="mint">{patient.goal}</Badge> : 'Sin dato'),
    },
    { key: 'updatedAt', header: 'Última actualización', cell: (patient) => formatDateTime(patient.updatedAt) },
    {
      key: 'actions',
      header: 'Acciones',
      hideHeader: true,
      cell: (patient) => (
        <button
          type="button"
          className="inline-flex items-center gap-0.75 rounded-lg p-2 hover:bg-surface [&>img]:size-1"
          onClick={() => navigate(`/pacientes/${patient.id}`)}
          aria-label={`Abrir ficha de ${fullName(patient)}`}
        >
          <img src={rowDot} alt="" />
          <img src={rowDot} alt="" />
          <img src={rowDot} alt="" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-ink">Pacientes</h1>
          <p className="mt-2 text-sm text-muted">Gestioná la información de tus pacientes.</p>
        </div>
        <Button onClick={() => navigate('/pacientes/nuevo')}>+ Nuevo paciente</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="flex items-center justify-between gap-4 border-b border-line p-5">
          <div className="relative w-full max-w-96">
            <span className="absolute top-1/2 left-3.5 size-4.25 -translate-y-1/2">
              <img src={searchIcon1} alt="" style={{ position: 'absolute', inset: '69.42% 12.5% 12.5% 69.42%' }} />
              <img src={searchIcon2} alt="" style={{ position: 'absolute', inset: '12.5% 20.83% 20.83% 12.5%' }} />
            </span>
            <input
              type="search"
              className={`${inputClass} pl-10`}
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar paciente por nombre"
            />
          </div>
          <span className="text-body-sm whitespace-nowrap text-muted">{patients.length} pacientes</span>
        </div>

        {isLoading && <p className="p-5 text-sm text-muted">Cargando pacientes...</p>}
        {error && (
          <p className="p-5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {!isLoading && !error && filteredPatients.length === 0 && (
          <p className="p-5 text-sm text-muted">
            {patients.length === 0 ? 'Todavía no hay pacientes cargados.' : 'No hay pacientes que coincidan con la búsqueda.'}
          </p>
        )}

        {!isLoading && !error && filteredPatients.length > 0 && (
          <>
            <DataTable columns={columns} rows={pagination.pageItems} rowKey={(patient) => patient.id} />
            <TablePagination {...pagination} />
          </>
        )}
      </div>
    </div>
  );
}

export default Patients;
