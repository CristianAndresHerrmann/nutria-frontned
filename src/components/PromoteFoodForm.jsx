import FormField, { inputClass } from './FormField';
import FormError from './FormError';
import Button from './Button';

// Pasar un alimento privado al catálogo común (T25), inline en su fila. El nombre
// es opcional: vacío conserva el que tiene. Si choca con otro alimento, el 409 del
// backend vuelve en `fields.name` y se puede elegir otro sin cerrar el formulario.
// DataTable monta ambas variantes CSS: el padre comparte `state` para conservar el
// borrador, los errores y el envío al cruzar md (como PasswordResetForm). Arranca
// en { name: '', isSubmitting: false, formError: '', fieldErrors: {} }.
function PromoteFoodForm({ food, state, onStateChange, onSubmit, onCancel }) {
  const { name, isSubmitting, formError, fieldErrors } = state;
  function update(changes) {
    onStateChange((current) => ({ ...current, ...changes }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    update({ formError: '', fieldErrors: {}, isSubmitting: true });
    try {
      await onSubmit(name.trim());
    } catch (err) {
      const fields = err.fields || {};
      update({ fieldErrors: fields, formError: Object.keys(fields).length === 0 ? err.message : '', isSubmitting: false });
    }
  }

  return (
    <form className="mt-3 flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-surface p-5" onSubmit={handleSubmit} noValidate>
      <div>
        <h3 className="text-sm font-semibold break-words text-ink">Pasar «{food.name}» al catálogo común</h3>
        <p className="mt-1 text-body-sm text-muted">
          Desde ahí lo ven todas las nutricionistas. La actividad del catálogo sigue mostrando quién lo cargó.
        </p>
      </div>

      <div className="min-w-0 max-w-full sm:w-80">
        <FormField label="Nombre en el catálogo común" error={fieldErrors.name}>
          <input
            className={inputClass}
            placeholder={food.name}
            value={name}
            onChange={(event) => update({ name: event.target.value })}
            aria-invalid={Boolean(fieldErrors.name)}
          />
        </FormField>
        <p className="mt-1.5 text-note text-muted">Vacío conserva el nombre actual.</p>
      </div>

      <FormError message={formError} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end xl:flex-nowrap">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Pasar al común'}
        </Button>
      </div>
    </form>
  );
}

export default PromoteFoodForm;
