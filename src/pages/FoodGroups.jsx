import { useEffect, useMemo, useState } from 'react';
import { listFoodGroups } from '../api/catalogs';
import { flattenTree } from '../utils/foodGroupTree';
import Badge from '../components/Badge';

// Sangría por nivel de la jerarquía, en px. Es un valor calculado, así que va
// como estilo y no como clase de Tailwind.
const INDENT_PX = 28;

// Solo lectura en esta tarea: el alta y la edición de grupos existen en la API,
// pero no tienen pantalla.
function FoodGroups() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    listFoodGroups()
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

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between gap-4 border-b border-line p-5">
        <p className="text-sm text-muted">Grupos de alimentos y sus subgrupos.</p>
        {groups && <span className="text-body-sm whitespace-nowrap text-muted">{groups.length} grupos</span>}
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
            <li key={group.id} className="flex items-center gap-2.5 py-3 pr-5" style={{ paddingLeft: 20 + group.depth * INDENT_PX }}>
              {group.depth > 0 && <span className="text-muted" aria-hidden="true">└</span>}
              <div className="min-w-0">
                <span className={`text-sm text-ink ${group.depth === 0 ? 'font-semibold' : 'font-medium'}`}>{group.name}</span>
                {group.description && <p className="mt-0.5 text-body-sm text-muted">{group.description}</p>}
              </div>
              {group.editable && <Badge tone="mint">Propio</Badge>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FoodGroups;
