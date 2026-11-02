import { useEffect, useState } from 'react';
import { listCatalogActivity } from '../api/adminCatalog';
import { listNutritionists } from '../api/adminNutritionists';
import { formatDateTime } from '../utils/date';
import { usePagination } from '../hooks/usePagination';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import TablePagination from '../components/TablePagination';
import { inputClass } from '../components/FormField';

// Actividad del catálogo (T25): qué alimento cargó cada nutricionista y cuándo,
// sigan privados o hayan pasado al común. Nada de pacientes ni de planes.
function AdminCatalogActivity() {
  const [nutritionists, setNutritionists] = useState([]);
  const [nutritionistId, setNutritionistId] = useState('');
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState('');
  const pagination = usePagination(entries ?? [], { resetKey: nutritionistId });

  useEffect(() => {
    let cancelled = false;

    listNutritionists()
      .then((data) => {
        if (!cancelled) setNutritionists(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    listCatalogActivity(nutritionistId)
      .then((data) => {
        if (!cancelled) {
          setEntries(data);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [nutritionistId]);

  const columns = [
    { key: 'createdAt', header: 'Fecha', cell: (entry) => formatDateTime(entry.createdAt) },
    { key: 'nutritionist', header: 'Nutricionista', cell: (entry) => entry.createdBy?.name },
    { key: 'food', header: 'Alimento', className: 'font-semibold text-ink', cell: (entry) => entry.name },
    {
      key: 'status',
      header: 'Estado',
      cell: (entry) => (
        <div className="flex flex-wrap gap-1.5">
          {entry.common ? <Badge tone="mint">Pasado al común</Badge> : <Badge tone="neutral">Privado</Badge>}
          {!entry.active && <Badge tone="warning">Dado de baja</Badge>}
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-4 border-b border-line p-5">
        <select
          className={`${inputClass} sm:max-w-64`}
          value={nutritionistId}
          onChange={(event) => setNutritionistId(event.target.value)}
          aria-label="Filtrar por nutricionista"
        >
          <option value="">Todas las nutricionistas</option>
          {nutritionists.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        {entries && <span className="text-body-sm whitespace-nowrap text-muted sm:ml-auto">{entries.length} alimentos cargados</span>}
      </div>

      {!entries && !error && <p className="p-5 text-sm text-muted">Cargando actividad...</p>}
      {error && (
        <p className="p-5 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {entries && !error && entries.length === 0 && (
        <p className="p-5 text-sm text-muted">Todavía no hay alimentos cargados por nutricionistas.</p>
      )}

      {entries && !error && entries.length > 0 && (
        <>
          <DataTable columns={columns} rows={pagination.pageItems} rowKey={(entry) => entry.id} />
          <TablePagination {...pagination} />
        </>
      )}
    </div>
  );
}

export default AdminCatalogActivity;
