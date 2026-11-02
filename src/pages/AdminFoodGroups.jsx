import { useEffect, useMemo, useState } from 'react';
import { createFoodGroup, listAdminFoodGroups, updateFoodGroup } from '../api/adminCatalog';
import { flattenTree, indent, parentOptions } from '../utils/foodGroupTree';
import Button from '../components/Button';
import CatalogEntryForm from '../components/CatalogEntryForm';
import FormField, { inputClass } from '../components/FormField';

// Sangría por nivel de la jerarquía, en px (como FoodGroups).
const INDENT_PX = 28;
const LINK_BUTTON = 'text-body-sm font-medium text-primary hover:underline disabled:opacity-50';

function toForm(group) {
  return { name: group?.name ?? '', description: group?.description ?? '', parentId: group?.parentId ?? '' };
}

// Lo vacío viaja como null: el backend lo normaliza igual, y un padre vacío deja
// al grupo como raíz.
function toPayload(form) {
  return { name: form.name, description: form.description || null, parentId: form.parentId || null };
}

// Grupos de alimentos desde el panel del administrador (T25): alta y edición, con
// su grupo padre. Un grupo no puede quedar dentro de uno de sus subgrupos: el
// selector no los ofrece, y el backend igual lo rechaza.
function AdminFoodGroups() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');
  // null: sin formulario; 'new': alta; un id: edición de ese grupo.
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    listAdminFoodGroups()
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const tree = useMemo(() => flattenTree(groups || []), [groups]);
  const editingGroup = editing && editing !== 'new' ? groups.find((group) => group.id === editing) : null;

  function open(target) {
    setNotice('');
    setEditing(target);
  }

  async function handleSubmit(form) {
    const payload = toPayload(form);
    if (editingGroup) {
      const updated = await updateFoodGroup(editingGroup.id, payload);
      setGroups((current) => current.map((group) => (group.id === updated.id ? updated : group)));
      setNotice(`Grupo «${updated.name}» actualizado.`);
    } else {
      const created = await createFoodGroup(payload);
      setGroups((current) => [...current, created]);
      setNotice(`Grupo «${created.name}» creado.`);
    }
    setEditing(null);
  }

  return (
    <div>
      {notice && (
        <p className="mb-4 rounded-xl bg-mint-50 px-3.5 py-2.5 text-body-sm text-mint-700" role="status">
          {notice}
        </p>
      )}

      {editing && groups && (
        <div className="mb-6">
          <CatalogEntryForm
            key={editing}
            title={editingGroup ? `Editar el grupo «${editingGroup.name}»` : 'Nuevo grupo de alimentos'}
            initialForm={toForm(editingGroup)}
            submitLabel={editingGroup ? 'Guardar grupo' : 'Crear grupo'}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
          >
            {({ form, onChange, fieldErrors }) => (
              <FormField label="Grupo padre" error={fieldErrors.parentId}>
                <select
                  className={inputClass}
                  value={form.parentId}
                  onChange={(event) => onChange('parentId', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.parentId)}
                >
                  <option value="">Ninguno (grupo raíz)</option>
                  {parentOptions(groups, editingGroup?.id).map((group) => (
                    <option key={group.id} value={group.id}>
                      {indent(group.depth)}
                      {group.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </CatalogEntryForm>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-line p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-muted">Grupos de alimentos y sus subgrupos.</p>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {groups && <span className="text-body-sm whitespace-nowrap text-muted">{groups.length} grupos</span>}
            <Button onClick={() => open('new')} disabled={!groups || Boolean(editing)}>
              + Nuevo grupo
            </Button>
          </div>
        </div>

        {!groups && !error && <p className="p-5 text-sm text-muted">Cargando grupos...</p>}
        {error && (
          <p className="p-5 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        {groups && groups.length === 0 && <p className="p-5 text-sm text-muted">Todavía no hay grupos cargados.</p>}

        {tree.length > 0 && (
          <ul className="divide-y divide-line">
            {tree.map((group) => (
              <li
                key={group.id}
                className="flex min-w-0 flex-wrap items-center justify-between gap-2.5 py-3 pr-5 pl-[min(var(--group-indent),40%)] xl:pl-[var(--group-indent)]"
                style={{ '--group-indent': `${20 + group.depth * INDENT_PX}px` }}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {group.depth > 0 && (
                    <span className="text-muted" aria-hidden="true">
                      └
                    </span>
                  )}
                  <div className="min-w-0">
                    <span className={`text-sm break-words text-ink ${group.depth === 0 ? 'font-semibold' : 'font-medium'}`}>{group.name}</span>
                    {group.description && <p className="mt-0.5 text-body-sm break-words text-muted">{group.description}</p>}
                  </div>
                </div>
                <button type="button" className={LINK_BUTTON} onClick={() => open(group.id)} disabled={Boolean(editing)}>
                  Editar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AdminFoodGroups;
