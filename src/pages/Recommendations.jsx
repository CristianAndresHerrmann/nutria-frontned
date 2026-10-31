import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listRecommendations } from '../api/recommendations';
import { listPathologies } from '../api/catalogs';
import { groupByPathology } from './recommendationFormMapping';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { inputClass } from '../components/FormField';

// Recomendaciones clínicas por patología (T22; RF-30). Las comunes son de solo
// lectura; las propias se editan y se dan de baja desde la edición. Por defecto
// solo las vigentes; las dadas de baja se muestran a pedido, para poder
// reactivarlas.
function Recommendations() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState(null);
  const [pathologies, setPathologies] = useState([]);
  const [pathologyId, setPathologyId] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    listPathologies()
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

  useEffect(() => {
    let cancelled = false;

    listRecommendations({ pathologyId, includeInactive })
      .then((data) => {
        if (!cancelled) {
          setRecommendations(data);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [pathologyId, includeInactive]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-4 border-b border-line p-5">
        <select
          className={`${inputClass} sm:max-w-64`}
          value={pathologyId}
          onChange={(event) => setPathologyId(event.target.value)}
          aria-label="Filtrar por patología"
        >
          <option value="">Todas las patologías</option>
          {pathologies.map((pathology) => (
            <option key={pathology.id} value={pathology.id}>
              {pathology.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
          />
          Mostrar dadas de baja
        </label>

        <div className="flex w-full flex-col items-start gap-4 sm:ml-auto sm:w-auto sm:flex-row sm:flex-wrap sm:items-center xl:flex-nowrap">
          {recommendations && (
            <span className="text-body-sm text-muted xl:whitespace-nowrap">{recommendations.length} recomendaciones</span>
          )}
          <Button onClick={() => navigate('/catalogos/recomendaciones/nueva')}>+ Nueva recomendación</Button>
        </div>
      </div>

      {!recommendations && !error && <p className="p-5 text-sm text-muted">Cargando recomendaciones...</p>}
      {error && (
        <p className="p-5 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {recommendations && !error && recommendations.length === 0 && (
        <p className="p-5 text-sm text-muted">
          {pathologyId ? 'No hay recomendaciones para esa patología.' : 'Todavía no hay recomendaciones.'}
        </p>
      )}

      {recommendations && !error && recommendations.length > 0 && (
        <div className="flex min-w-0 flex-col gap-6 p-5">
          {groupByPathology(recommendations).map((group) => (
            <div key={group.pathology.id} className="flex flex-col gap-2">
              <h3 className="text-xs font-bold tracking-[0.3px] text-muted uppercase">{group.pathology.name}</h3>
              {group.recommendations.map((recommendation) => (
                <article key={recommendation.id} className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="min-w-0 max-w-full break-words text-sm font-semibold text-ink">{recommendation.title}</h4>
                    <Badge tone={recommendation.own ? 'mint' : 'neutral'}>{recommendation.own ? 'Propia' : 'Común'}</Badge>
                    {!recommendation.active && <Badge tone="warning">Dada de baja</Badge>}
                    {recommendation.own && (
                      <button
                        type="button"
                        className="ml-auto text-body-sm font-medium text-primary hover:underline"
                        onClick={() => navigate(`/catalogos/recomendaciones/${recommendation.id}/editar`)}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                  <p className="text-body-sm whitespace-pre-line text-muted">{recommendation.text}</p>
                </article>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Recommendations;
