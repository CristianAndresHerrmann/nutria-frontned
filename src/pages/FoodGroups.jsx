import { useEffect, useMemo, useState } from 'react';
import { listFoodGroups } from '../api/catalogs';
import { flattenTree } from '../utils/foodGroupTree';

// Sangría por nivel de la jerarquía, en px. Es un valor calculado, así que va
// como estilo y no como clase de Tailwind.
const INDENT_PX = 28;

// Solo lectura: el alta y la edición de grupos son del administrador (T25).
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
      <div className="flex flex-col items-start justify-between gap-4 border-b border-line p-5 sm:flex-row sm:items-center">
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
            <li key={group.id} className="flex min-w-0 items-center gap-2.5 py-3 pr-5 pl-[min(var(--group-indent),40%)] xl:pl-[var(--group-indent)]" style={{ '--group-indent': `${20 + group.depth * INDENT_PX}px` }}>
              {group.depth > 0 && <span className="text-muted" aria-hidden="true">└</span>}
              <div className="min-w-0">
                <span className={`text-sm text-ink ${group.depth === 0 ? 'font-semibold' : 'font-medium'}`}>{group.name}</span>
                {group.description && <p className="mt-0.5 text-body-sm text-muted">{group.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FoodGroups;
