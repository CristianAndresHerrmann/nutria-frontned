import { useState } from 'react';
import FormField, { inputClass } from './FormField';
import Button from './Button';

// Restablecimiento de la contraseña de una cuenta, inline en su fila. La define
// el administrador: no hay recuperación por email.
function PasswordResetForm({ accountName, onSubmit, onCancel, state, onStateChange }) {
  // DataTable monta ambas variantes CSS: el padre comparte este estado para
  // conservar el borrador, los errores y el envío al cruzar md. El modo local
  // mantiene la API previa para usar el formulario de manera independiente.
  const [localState, setLocalState] = useState({ password: '', isSubmitting: false, formError: '', fieldErrors: {} });
  const { password, isSubmitting, formError, fieldErrors } = state ?? localState;
  const setState = onStateChange ?? setLocalState;
  function update(changes) { setState((current) => ({ ...current, ...changes })); }

  async function handleSubmit(event) {
    event.preventDefault();
    update({ formError: '', fieldErrors: {}, isSubmitting: true });

    try {
      await onSubmit(password);
    } catch (err) {
      const fields = err.fields || {};
      update({ fieldErrors: fields, formError: Object.keys(fields).length === 0 ? err.message : '', isSubmitting: false });
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start xl:flex-nowrap">
        <div className="min-w-0 max-w-full sm:w-80">
          <FormField label={`Nueva contraseña de ${accountName}`} required error={fieldErrors.password}>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(event) => update({ password: event.target.value })}
              aria-invalid={Boolean(fieldErrors.password)}
              autoComplete="new-password"
              placeholder="Al menos 8 caracteres"
              required
            />
          </FormField>
        </div>
        <div className="flex max-w-full flex-wrap gap-3 sm:mt-7 xl:flex-nowrap">
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Restablecer'}
          </Button>
        </div>
      </div>

      {formError && (
        <p className="text-body-sm text-danger" role="alert">
          {formError}
        </p>
      )}
    </form>
  );
}

export default PasswordResetForm;
