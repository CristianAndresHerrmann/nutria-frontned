import { useCallback, useState } from 'react';

export const FIELDS_NOTICE = 'Revisá los campos marcados antes de guardar.';

function hasAny(fields) {
  return Object.values(fields ?? {}).some(Boolean);
}

// Errores de un formulario (T29), iguales en todos: `fieldErrors` va junto a cada
// campo y `formError` arriba del botón de guardar. Si hay algún campo marcado,
// `formError` es el aviso fijo, porque el `message` del backend repite el primer
// error de campo; si el error no trae campos (conflicto, 500, red), es su mensaje.
// `hasOtherErrors` suma errores locales que el formulario guarda aparte (las
// mediciones de una consulta).
export function useFormErrors({ hasOtherErrors = false } = {}) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const reset = useCallback(() => {
    setFieldErrors({});
    setGeneralError('');
  }, []);

  const clearField = useCallback((name) => {
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }, []);

  const showFieldErrors = useCallback((fields) => {
    setFieldErrors(fields);
    setGeneralError('');
  }, []);

  const showError = useCallback((err) => {
    const fields = err?.fields;
    if (hasAny(fields)) {
      showFieldErrors(fields);
    } else {
      setFieldErrors({});
      setGeneralError(err?.message ?? '');
    }
  }, [showFieldErrors]);

  const formError = generalError || (hasAny(fieldErrors) || hasOtherErrors ? FIELDS_NOTICE : '');

  return { fieldErrors, formError, reset, clearField, showFieldErrors, showError };
}
