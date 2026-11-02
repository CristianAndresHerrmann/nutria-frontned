import { useEffect, useState } from 'react';
import { createPathology, listAdminPathologies, updatePathology } from '../api/adminCatalog';
import { usePagination } from '../hooks/usePagination';
import Button from '../components/Button';
import CatalogEntryForm from '../components/CatalogEntryForm';
import DataTable from '../components/DataTable';
import TablePagination from '../components/TablePagination';

const LINK_BUTTON = 'text-body-sm font-medium text-primary hover:underline disabled:opacity-50';

function toForm(pathology) {
  return { name: pathology?.name ?? '', description: pathology?.description ?? '' };
}

function byName(a, b) {
  return a.name.localeCompare(b.name, 'es');
}

// Patologías desde el panel del administrador (T25; RF-04): alta y edición del
// nombre y la descripción.
function AdminPathologies() {
  const [pathologies, setPathologies] = useState(null);
  const [error, setError] = useState('');
  // null: sin formulario; 'new': alta; un id: edición de esa patología.
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const pagination = usePagination(pathologies ?? []);

  useEffect(() => {
    let cancelled = false;

    listAdminPathologies()
      .then((data) => {
        if (!cancelled) setPathologies(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const editingPathology = editing && editing !== 'new' ? pathologies.find((item) => item.id === editing) : null;

  function open(target) {
    setNotice('');
    setEditing(target);
  }

  async function handleSubmit(form) {
    const payload = { name: form.name, description: form.description || null };
    if (editingPathology) {
      const updated = await updatePathology(editingPathology.id, payload);
      setPathologies((current) => current.map((item) => (item.id === updated.id ? updated : item)).sort(byName));
      setNotice(`Patología «${updated.name}» actualizada.`);
    } else {
      const created = await createPathology(payload);
      setPathologies((current) => [...current, created].sort(byName));
      setNotice(`Patología «${created.name}» creada.`);
    }
    setEditing(null);
  }

  const columns = [
    { key: 'name', header: 'Patología', className: 'font-semibold text-ink', cell: (item) => item.name },
    { key: 'description', header: 'Descripción', className: 'text-muted', cell: (item) => item.description || 'Sin descripción' },
    {
      key: 'actions',
      header: 'Acciones',
      hideHeader: true,
      cell: (item) => (
        <div className="flex justify-end">
          <button type="button" className={LINK_BUTTON} onClick={() => open(item.id)} disabled={Boolean(editing)}>
            Editar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {notice && (
        <p className="mb-4 rounded-xl bg-mint-50 px-3.5 py-2.5 text-body-sm text-mint-700" role="status">
          {notice}
        </p>
      )}

      {editing && pathologies && (
        <div className="mb-6">
          <CatalogEntryForm
            key={editing}
            title={editingPathology ? `Editar la patología «${editingPathology.name}»` : 'Nueva patología'}
            initialForm={toForm(editingPathology)}
            submitLabel={editingPathology ? 'Guardar patología' : 'Crear patología'}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-line p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-muted">Patologías que las nutricionistas registran en sus pacientes.</p>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {pathologies && <span className="text-body-sm whitespace-nowrap text-muted">{pathologies.length} patologías</span>}
            <Button onClick={() => open('new')} disabled={!pathologies || Boolean(editing)}>
              + Nueva patología
            </Button>
          </div>
        </div>

        {!pathologies && !error && <p className="p-5 text-sm text-muted">Cargando patologías...</p>}
        {error && (
          <p className="p-5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {pathologies && pathologies.length === 0 && <p className="p-5 text-sm text-muted">Todavía no hay patologías cargadas.</p>}

        {pathologies && pathologies.length > 0 && (
          <>
            <DataTable columns={columns} rows={pagination.pageItems} rowKey={(item) => item.id} />
            <TablePagination {...pagination} />
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPathologies;
