import { useState } from 'react';
import FormField, { inputClass } from './FormField';
import Button from './Button';

const FORM_GRID = 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3';
const EMPTY_FORM = { name: '', email: '', password: '' };

// Alta de una cuenta de nutricionista, inline en el panel. `onSubmit(payload)`
// guarda; si falla con un ApiError, los errores se muestran en su campo (un
// email repetido llega en `fields.email`).
function NutritionistAccountForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await onSubmit(form);
    } catch (err) {
      const fields = err.fields || {};
      setFieldErrors(fields);
      // Si el error ya está en un campo, no se repite arriba del botón.
      if (Object.keys(fields).length === 0) setFormError(err.message);
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5" onSubmit={handleSubmit} noValidate>
      <div>
        <h3 className="text-sm font-semibold text-ink">Nueva cuenta de nutricionista</h3>
        <p className="mt-1 text-body-sm text-muted">
          La cuenta nace activa. Comunicale la contraseña inicial a la nutricionista por un canal privado.
        </p>
      </div>

      <div className={FORM_GRID}>
        <FormField label="Nombre" required error={fieldErrors.name}>
          <input
            className={inputClass}
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            autoComplete="off"
            required
          />
        </FormField>

        <FormField label="Email" required error={fieldErrors.email}>
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            autoComplete="off"
            required
          />
        </FormField>

        <FormField label="Contraseña inicial" required error={fieldErrors.password}>
          <input
            type="password"
            className={inputClass}
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            autoComplete="new-password"
            placeholder="Al menos 8 caracteres"
            required
          />
        </FormField>
      </div>

      {formError && (
        <p className="text-body-sm text-danger" role="alert">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear cuenta'}
        </Button>
      </div>
    </form>
  );
}

export default NutritionistAccountForm;
