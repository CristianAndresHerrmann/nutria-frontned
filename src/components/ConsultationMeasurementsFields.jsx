import {
  EXTRA_MEASUREMENT_TYPES,
  FIXED_UNITS,
  TYPES_REQUIRING_DETAIL,
  unitOptionsFor,
} from '../pages/patientMeasurements';
import FormField, { inputClass } from './FormField';

const FIXED_GRID = 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2';
const ROW_GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4';
const LINK_BUTTON = 'text-body-sm font-medium text-primary hover:underline disabled:opacity-50';

// Bloque opcional de mediciones del formulario de consulta (T20; RF-11, RF-12).
// Peso y talla, con unidad fija, y las demás mediciones o valores de laboratorio
// como filas que se agregan, con la unidad elegida de un desplegable según el
// tipo. Todas toman la fecha de la consulta. `errors` son
// los de la validación local (por campo y por fila); `backendError` es el
// `details.fields.measurements` del backend, que no dice qué fila falló.
function ConsultationMeasurementsFields({
  form,
  errors,
  backendError,
  onFieldChange,
  onRowChange,
  onAddRow,
  onRemoveRow,
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="text-sm font-medium text-ink">Mediciones</legend>
      <p className="text-body-sm text-muted">
        Opcionales. Se registran con la fecha de la consulta; el IMC se calcula solo cuando hay peso y talla.
      </p>

      <div className={FIXED_GRID}>
        {['weight', 'height'].map((field) => (
          <FormField
            key={field}
            label={`${field === 'weight' ? 'Peso' : 'Talla'} (${FIXED_UNITS[field]})`}
            error={errors[field]}
          >
            <input
              type="text"
              inputMode="decimal"
              className={inputClass}
              placeholder={field === 'weight' ? 'Ej. 68,5' : 'Ej. 165'}
              value={form[field]}
              onChange={(event) => onFieldChange(field, event.target.value)}
              aria-invalid={Boolean(errors[field])}
            />
          </FormField>
        ))}
      </div>

      {form.measurements.map((row) => {
        const rowErrors = errors.rows[row.key] || {};
        const unitOptions = unitOptionsFor(row.type);
        return (
          <div key={row.key} className="flex flex-col gap-2 rounded-xl border border-line p-4">
            <div className={ROW_GRID}>
              <FormField label="Tipo">
                <select
                  className={inputClass}
                  value={row.type}
                  onChange={(event) => onRowChange(row.key, 'type', event.target.value)}
                >
                  {EXTRA_MEASUREMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Detalle" required={TYPES_REQUIRING_DETAIL.includes(row.type)} error={rowErrors.detail}>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Ej. Cintura, tricipital, HbA1c"
                  value={row.detail}
                  onChange={(event) => onRowChange(row.key, 'detail', event.target.value)}
                  aria-invalid={Boolean(rowErrors.detail)}
                />
              </FormField>
              <FormField label="Valor" required error={rowErrors.value}>
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputClass}
                  value={row.value}
                  onChange={(event) => onRowChange(row.key, 'value', event.target.value)}
                  aria-invalid={Boolean(rowErrors.value)}
                />
              </FormField>
              <FormField label="Unidad">
                {/* Una sola opción cuando el tipo tiene unidad fija: se ve, pero no se cambia. */}
                <select
                  className={`${inputClass} disabled:opacity-70`}
                  value={row.unit}
                  disabled={unitOptions.length === 1}
                  onChange={(event) => onRowChange(row.key, 'unit', event.target.value)}
                >
                  {unitOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="flex justify-end">
              <button type="button" className={LINK_BUTTON} onClick={() => onRemoveRow(row.key)}>
                Quitar
              </button>
            </div>
          </div>
        );
      })}

      {backendError && <span className="text-note font-normal text-danger">{backendError}</span>}
      <div>
        <button type="button" className={LINK_BUTTON} onClick={onAddRow}>
          + Agregar medición o laboratorio
        </button>
      </div>
    </fieldset>
  );
}

export default ConsultationMeasurementsFields;
