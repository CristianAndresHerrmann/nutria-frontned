import { useState } from 'react';
import { useFormErrors } from '../hooks/useFormErrors';
import FormField, { inputClass, textareaClass } from './FormField';
import FormError from './FormError';
import Button from './Button';

// Alta y edición de un ítem del catálogo con nombre y descripción: grupos y
// patologías del panel del administrador (T25). `children` suma campos propios
// (el padre de un grupo), que leen y escriben `form` con `onChange`.
// `onSubmit(form)` guarda; si falla, los errores van a su campo (un nombre
// repetido llega en `fields.name`, un ciclo en `fields.parentId`).
function CatalogEntryForm({ title, initialForm, submitLabel, onSubmit, onCancel, children }) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fieldErrors, formError, reset, showError } = useFormErrors();

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    reset();
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      showError(err);
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex min-w-0 flex-col gap-5 rounded-xl border border-line bg-surface p-5" onSubmit={handleSubmit} noValidate>
      <h3 className="text-sm font-semibold break-words text-ink">{title}</h3>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <FormField label="Nombre" required error={fieldErrors.name}>
          <input
            className={inputClass}
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            required
          />
        </FormField>
        {children?.({ form, onChange: updateField, fieldErrors })}
      </div>

      <FormField label="Descripción" error={fieldErrors.description}>
        <textarea
          className={textareaClass}
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
          aria-invalid={Boolean(fieldErrors.description)}
        />
      </FormField>

      <FormError message={formError} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end xl:flex-nowrap">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default CatalogEntryForm;
