import { useCallback, useEffect, useRef, useState } from 'react';
import { generatePlan } from '../api/patientPlans';

// Generación de una propuesta de plan (T39; RNF-02). Vive en la ficha y no en
// la pestaña Planes: mientras se genera se puede usar el resto de la ficha, y
// al volver a Planes el estado (en curso, error o propuesta lista) sigue ahí.
// La ficha se monta con `key` por paciente, así que el resultado de una
// generación de otro paciente nunca se publica.
export function usePlanGeneration(patientId) {
  const [state, setState] = useState({ status: 'idle', error: null, plan: null });
  const mounted = useRef(true);
  const inFlight = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const generate = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setState({ status: 'generating', error: null, plan: null });
    try {
      const plan = await generatePlan(patientId);
      if (mounted.current) setState({ status: 'done', error: null, plan });
    } catch (error) {
      if (mounted.current) setState({ status: 'error', error, plan: null });
    } finally {
      inFlight.current = false;
    }
  }, [patientId]);

  return { ...state, generate };
}
