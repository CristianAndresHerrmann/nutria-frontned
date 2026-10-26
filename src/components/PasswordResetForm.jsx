import { useState } from 'react';
import FormField, { inputClass } from './FormField';
import Button from './Button';

// Restablecimiento de la contraseña de una cuenta, inline en su fila. La define
// el administrador: no hay recuperación por email.
function PasswordResetForm({ accountName, onSubmit, onCancel }) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await onSubmit(password);
    } catch (err) {
      const fields = err.fields || {};
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setFormError(err.message);
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="sm:w-80">
          <FormField label={`Nueva contraseña de ${accountName}`} required error={fieldErrors.password}>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              autoComplete="new-password"
              placeholder="Al menos 8 caracteres"
              required
            />
          </FormField>
        </div>
        <div className="flex gap-3 sm:mt-7">
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
