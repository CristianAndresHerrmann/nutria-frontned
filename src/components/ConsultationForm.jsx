import { useState } from 'react';
import {
  CONSULTATION_TEXT_FIELDS,
  CONSULTATION_TYPES,
  emptyConsultationForm,
  formToConsultationPayload,
  newHabitRow,
} from '../pages/patientConsultations';
import {
  changeMeasurementRow,
  hasMeasurementErrors,
  measurementFormErrors,
  newMeasurementRow,
} from '../pages/patientMeasurements';
import { completeDateValueError, dateValueError, todayInputValue } from '../utils/date';
import FormField, { inputClass, textareaClass } from './FormField';
import ConsultationMeasurementsFields from './ConsultationMeasurementsFields';
import DateInput from './DateInput';
import Button from './Button';

const FORM_GRID = 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2';
const RADIO_OPTION = 'flex items-center gap-2 text-sm font-normal text-ink';
const LINK_BUTTON = 'text-body-sm font-medium text-primary hover:underline disabled:opacity-50';
const DATE_REQUIRED_MESSAGE = 'La fecha de la consulta es obligatoria';
const NO_MEASUREMENT_ERRORS = { rows: {} };

// Alta de una consulta, inline en la pestaña Consultas (T19). `onSubmit(payload)`
// guarda; si falla con un ApiError, los errores se muestran en su campo. Las
// mediciones (T20) van antes de los hábitos pautados, que cierran la consulta
// (RF-22).
function ConsultationForm({ hasConsultations, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => emptyConsultationForm({ hasConsultations }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [measurementErrors, setMeasurementErrors] = useState(NO_MEASUREMENT_ERRORS);

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

  function updateFixedMeasurement(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setMeasurementErrors((current) => ({ ...current, [field]: undefined }));
    setFieldErrors((current) => ({ ...current, measurements: undefined }));
  }

  function clearRowErrors(key) {
    setMeasurementErrors(({ rows: { [key]: _removed, ...rows }, ...current }) => ({ ...current, rows }));
    setFieldErrors((current) => ({ ...current, measurements: undefined }));
  }

  function updateMeasurementRow(key, field, value) {
    setForm((current) => ({
      ...current,
      measurements: current.measurements.map((row) => (row.key === key ? changeMeasurementRow(row, field, value) : row)),
    }));
    clearRowErrors(key);
  }

  function addMeasurementRow() {
    setForm((current) => ({ ...current, measurements: [...current.measurements, newMeasurementRow()] }));
  }

  function removeMeasurementRow(key) {
    setForm((current) => ({ ...current, measurements: current.measurements.filter((row) => row.key !== key) }));
    clearRowErrors(key);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    // DateInput deja pasar una fecha a medio tipear o inexistente, y el backend
    // señala cualquier medición inválida sin decir cuál: las dos cosas se frenan
    // acá, sin llamar a la API, con el error en su campo.
    const localDateError = form.date ? dateValueError(form.date, dateRange) : DATE_REQUIRED_MESSAGE;
    const localMeasurementErrors = measurementFormErrors(form);
    setMeasurementErrors(localMeasurementErrors);
    if (localDateError || hasMeasurementErrors(localMeasurementErrors)) {
      setFieldErrors(localDateError ? { date: localDateError } : {});
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
      className="flex min-w-0 flex-col gap-5 rounded-xl border border-line bg-surface p-5"
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

        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-ink">
            Tipo <span className="text-primary">*</span>
          </legend>
          <div className="flex min-h-10.5 flex-wrap items-center gap-x-6 gap-y-3 xl:h-10.5 xl:flex-nowrap">
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

      <ConsultationMeasurementsFields
        form={form}
        errors={measurementErrors}
        backendError={fieldErrors.measurements}
        onFieldChange={updateFixedMeasurement}
        onRowChange={updateMeasurementRow}
        onAddRow={addMeasurementRow}
        onRemoveRow={removeMeasurementRow}
      />

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="text-sm font-medium text-ink">Hábitos pautados</legend>
        <p className="text-body-sm text-muted">
          Lo que el paciente se propone trabajar hasta la próxima consulta. Se registran como pendientes.
        </p>
        {form.habits.map((habit, index) => (
          <div key={habit.key} className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end xl:flex-nowrap">
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
