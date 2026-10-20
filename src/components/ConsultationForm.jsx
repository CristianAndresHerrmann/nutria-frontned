import { useState } from 'react';
import {
  CONSULTATION_TEXT_FIELDS,
  CONSULTATION_TYPES,
  emptyConsultationForm,
  formToConsultationPayload,
  newHabitRow,
} from '../pages/patientConsultations';
import { completeDateValueError, dateValueError, todayInputValue } from '../utils/date';
import FormField, { inputClass, textareaClass } from './FormField';
import DateInput from './DateInput';
import Button from './Button';

const FORM_GRID = 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2';
const RADIO_OPTION = 'flex items-center gap-2 text-sm font-normal text-ink';
const LINK_BUTTON = 'text-body-sm font-medium text-primary hover:underline disabled:opacity-50';
const DATE_REQUIRED_MESSAGE = 'La fecha de la consulta es obligatoria';

// Alta de una consulta, inline en la pestaña Consultas (T19). `onSubmit(payload)`
// guarda; si falla con un ApiError, los errores se muestran en su campo. Los
// hábitos pautados van al final, como cierre de la consulta (RF-22).
function ConsultationForm({ hasConsultations, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => emptyConsultationForm({ hasConsultations }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const dateRange = { max: todayInputValue() };
  const dateError = fieldErrors.date || completeDateValueError(form.date, dateRange);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function updateHabit(key, description) {
    setForm((current) => ({
      ...current,
      habits: current.habits.map((habit) => (habit.key === key ? { ...habit, description } : habit)),
    }));
    setFieldErrors((current) => ({ ...current, habits: undefined }));
  }

  function addHabit() {
    setForm((current) => ({ ...current, habits: [...current.habits, newHabitRow()] }));
  }

  function removeHabit(key) {
    setForm((current) => ({ ...current, habits: current.habits.filter((habit) => habit.key !== key) }));
    setFieldErrors((current) => ({ ...current, habits: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    // DateInput deja pasar una fecha a medio tipear o inexistente: se frena acá,
    // sin llamar a la API.
    const localDateError = form.date ? dateValueError(form.date, dateRange) : DATE_REQUIRED_MESSAGE;
    if (localDateError) {
      setFieldErrors({ date: localDateError });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await onSubmit(formToConsultationPayload(form));
    } catch (err) {
      const fields = err.fields || {};
      setFieldErrors(fields);
      // Si el error ya está en un campo, no se repite arriba del botón.
      if (Object.keys(fields).length === 0) setFormError(err.message);
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5"
      onSubmit={handleSubmit}
      noValidate
    >
      <h3 className="text-sm font-semibold text-ink">Nueva consulta</h3>

      <div className={FORM_GRID}>
        <FormField label="Fecha" required error={dateError}>
          <DateInput
            value={form.date}
            max={dateRange.max}
            invalid={Boolean(dateError)}
            onChange={(value) => updateField('date', value)}
          />
        </FormField>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-ink">
            Tipo <span className="text-primary">*</span>
          </legend>
          <div className="flex h-10.5 items-center gap-6">
            {CONSULTATION_TYPES.map((option) => (
              <label key={option.value} className={RADIO_OPTION}>
                <input
                  type="radio"
                  name="type"
                  checked={form.type === option.value}
                  onChange={() => updateField('type', option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
          {fieldErrors.type && <span className="text-note font-normal text-danger">{fieldErrors.type}</span>}
        </fieldset>

        {CONSULTATION_TEXT_FIELDS.map((field) => (
          <FormField key={field.name} label={field.label} error={fieldErrors[field.name]}>
            <textarea
              className={textareaClass}
              placeholder={field.placeholder}
              value={form[field.name]}
              onChange={(event) => updateField(field.name, event.target.value)}
              aria-invalid={Boolean(fieldErrors[field.name])}
            />
          </FormField>
        ))}
      </div>

      <FormField label="Observaciones" error={fieldErrors.observations}>
        <textarea
          className={textareaClass}
          placeholder="Lo conversado en la consulta"
          value={form.observations}
          onChange={(event) => updateField('observations', event.target.value)}
          aria-invalid={Boolean(fieldErrors.observations)}
        />
      </FormField>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-ink">Hábitos pautados</legend>
        <p className="text-body-sm text-muted">
          Lo que el paciente se propone trabajar hasta la próxima consulta. Se registran como pendientes.
        </p>
        {form.habits.map((habit, index) => (
          <div key={habit.key} className="flex items-center gap-3">
            <input
              type="text"
              className={inputClass}
              placeholder="Ej. Caminar 30 minutos tres veces por semana"
              value={habit.description}
              onChange={(event) => updateHabit(habit.key, event.target.value)}
              aria-label={`Hábito ${index + 1}`}
              aria-invalid={Boolean(fieldErrors.habits)}
            />
            <button type="button" className={LINK_BUTTON} onClick={() => removeHabit(habit.key)}>
              Quitar
            </button>
          </div>
        ))}
        {fieldErrors.habits && <span className="text-note font-normal text-danger">{fieldErrors.habits}</span>}
        <div>
          <button type="button" className={LINK_BUTTON} onClick={addHabit}>
            + Agregar hábito
          </button>
        </div>
      </fieldset>

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
          {isSubmitting ? 'Guardando...' : 'Guardar consulta'}
        </Button>
      </div>
    </form>
  );
}

export default ConsultationForm;
