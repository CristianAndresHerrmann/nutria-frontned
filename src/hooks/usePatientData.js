import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Cargas de la ficha y sus pestañas. loadPatient es una función estable del
// cliente HTTP. Cada paciente tiene su propio alcance; solo la última carga
// todavía activa puede publicar datos o errores, incluso tras una recarga.
export function usePatientData(patientId, loadPatient) {
  const identity = useMemo(() => ({ patientId, loadPatient }), [patientId, loadPatient]);
  const activeScope = useRef(null);
  const [result, setResult] = useState(null);

  const reload = useCallback(() => {
    const scope = activeScope.current;
    if (scope?.identity !== identity) return Promise.resolve();
    const request = ++scope.request;
    return Promise.resolve()
      .then(() => identity.loadPatient(identity.patientId))
      .then((data) => {
        if (activeScope.current === scope && request === scope.request) setResult({ identity, data, error: '' });
      }, (err) => {
        if (activeScope.current === scope && request === scope.request) {
          setResult((previous) => ({ identity, data: previous?.identity === identity ? previous.data : null, error: err.message }));
        }
      });
  }, [identity]);

  useEffect(() => {
    const scope = { identity, request: 0 };
    activeScope.current = scope;
    reload();
    return () => {
      if (activeScope.current === scope) activeScope.current = null;
    };
  }, [reload, identity]);

  // Los handlers de guardado capturan este alcance antes de su await: al salir
  // de la pestaña o cambiar de paciente dejan de poder recargar o notificar.
  const isCurrent = useCallback(() => activeScope.current?.identity === identity, [identity]);

  return {
    data: result?.identity === identity ? result.data : null,
    error: result?.identity === identity ? result.error : '',
    reload,
    isCurrent,
  };
}
