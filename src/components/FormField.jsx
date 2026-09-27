// Clases del input de texto de todos los formularios (login, paciente, buscador).
// Quien lo usa puede sumar padding extra para un ícono (ej. `${inputClass} pl-10`).
export const inputClass =
  'h-10.5 w-full rounded-xl border border-line-input bg-surface px-3.5 text-sm text-ink placeholder:text-ink/50 focus:border-primary focus:ring-3 focus:ring-primary/12 focus:outline-none aria-invalid:border-danger';

function FormField({ label, required, error, children }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-ink">
      <span>
        {label} {required && <span className="text-primary">*</span>}
      </span>
      {children}
      {error && <span className="text-note font-normal text-danger">{error}</span>}
    </label>
  );
}

export default FormField;
