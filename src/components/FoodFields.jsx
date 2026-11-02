import { indent } from '../utils/foodGroupTree';
import { FOOD_CATEGORIES } from '../utils/foodCategories';
import { toggleCategory } from '../pages/foodFormMapping';
import FormField, { inputClass } from './FormField';

const FORM_GRID = 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2';

// Nombre, grupo y categorías de un alimento: el alta del nutricionista y el alta
// y la edición del administrador (T25). `groupOptions` viene de flattenTree.
function FoodFields({ form, groupOptions, fieldErrors, onChange }) {
  return (
    <div className="flex flex-col gap-5">
      <div className={FORM_GRID}>
        <FormField label="Nombre" required error={fieldErrors.name}>
          <input
            className={inputClass}
            placeholder="Ej. Caballa"
            value={form.name}
            onChange={(event) => onChange('name', event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            required
          />
        </FormField>

        <FormField label="Grupo" required error={fieldErrors.foodGroupId}>
          <select
            className={inputClass}
            value={form.foodGroupId}
            onChange={(event) => onChange('foodGroupId', event.target.value)}
            aria-invalid={Boolean(fieldErrors.foodGroupId)}
            required
          >
            <option value="">Elegí un grupo</option>
            {groupOptions.map((group) => (
              <option key={group.id} value={group.id}>
                {indent(group.depth)}
                {group.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-ink">
          Categorías <span className="text-primary">*</span>
        </legend>
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
          {FOOD_CATEGORIES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.categories.includes(value)}
                onChange={(event) => onChange('categories', toggleCategory(form.categories, value, event.target.checked))}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {fieldErrors.categories && <span className="text-note text-danger">{fieldErrors.categories}</span>}
      </fieldset>
    </div>
  );
}

export default FoodFields;
