import FormField, { inputClass, textareaClass } from './FormField';

// Un campo de patientClinicalFields en el formulario del paciente. El texto
// largo ocupa las dos columnas de la grilla.
function ClinicalFieldInput({ field, value, error, onChange }) {
  const common = {
    value,
    'aria-invalid': Boolean(error),
    onChange: (event) => onChange(field.name, event.target.value),
  };

  let control;
  if (field.kind === 'textarea') {
    control = <textarea className={textareaClass} placeholder={field.placeholder} {...common} />;
  } else if (field.kind === 'yesNo') {
    control = (
      <select className={inputClass} {...common}>
        <option value="">Sin dato</option>
        <option value="yes">Sí</option>
        <option value="no">No</option>
      </select>
    );
  } else {
    control = <input className={inputClass} placeholder={field.placeholder} {...common} />;
  }

  return (
    <div className={field.kind === 'textarea' ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
      <FormField label={field.label} error={error}>
        {control}
      </FormField>
    </div>
  );
}

export default ClinicalFieldInput;
