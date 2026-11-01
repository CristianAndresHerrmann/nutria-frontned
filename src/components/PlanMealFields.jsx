import { useState } from 'react';
import { mealTypeLabel } from '../utils/recipeLabels';
import { itemDisplay } from '../pages/patientPlans';
import {
  MAX_ITEMS,
  MAX_OPTIONS,
  SHORT_TEXT_MAX_LENGTH,
  addItem,
  addOption,
  removeItem,
  removeOption,
  replaceItem,
  setInstructions,
  setOptionDescription,
} from '../pages/planForm';
import Badge from './Badge';
import FindingList from './FindingList';
import FormField, { inputClass } from './FormField';
import PlanItemPicker from './PlanItemPicker';
import SectionCard from './SectionCard';

const LINK_BUTTON = 'text-body-sm font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline';

// Un ítem con sus hallazgos al lado. Un ítem no reconocido queda destacado:
// bloquea hasta reemplazarlo (DA-30).
function ItemRow({ item, findings, picker, onReplace, onRemove }) {
  const { text, kind } = itemDisplay(item);
  const unrecognized = item.type === 'unrecognized';
  return (
    <li
      className={`flex min-w-0 flex-col gap-2 rounded-xl border px-3.5 py-2.5 ${
        unrecognized ? 'border-danger bg-danger-bg' : 'border-line'
      }`}
    >
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 break-words text-sm font-medium text-ink">{text}</span>
          {kind && <Badge tone={unrecognized ? 'danger' : 'neutral'}>{kind}</Badge>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button type="button" className={LINK_BUTTON} onClick={onReplace} aria-label={`Reemplazar ${text}`}>
            Reemplazar
          </button>
          <button type="button" className={LINK_BUTTON} onClick={onRemove} aria-label={`Quitar ${text}`}>
            Quitar
          </button>
        </div>
      </div>
      <FindingList findings={findings} />
      {picker}
    </li>
  );
}

// Una comida del borrador en edición (T40). Los hallazgos son los de la última
// versión guardada y se ubican por el id del servidor: un ítem o una opción
// nuevos no tienen hallazgos hasta guardar. `onChange` recibe una función que
// transforma el formulario completo.
function PlanMealFields({ meal, findings, patientId, onChange }) {
  // El selector abierto: { optionKey, itemKey }, con itemKey null para agregar.
  const [picking, setPicking] = useState(null);
  const { mealType } = meal;
  const label = mealTypeLabel(mealType);

  function choose(item) {
    const { optionKey, itemKey } = picking;
    onChange((form) =>
      itemKey ? replaceItem(form, mealType, optionKey, itemKey, item) : addItem(form, mealType, optionKey, item),
    );
    setPicking(null);
  }

  function pickerFor(optionKey, itemKey, title) {
    if (picking?.optionKey !== optionKey || picking?.itemKey !== itemKey) return null;
    return (
      <PlanItemPicker
        title={title}
        patientId={patientId}
        mealType={mealType}
        onSelect={choose}
        onCancel={() => setPicking(null)}
      />
    );
  }

  function confirmRemoveOption(option, position) {
    const message = `¿Quitar la opción ${position} (${label.toLowerCase()}) con sus ítems?`;
    if (option.items.length > 0 && !window.confirm(message)) return;
    onChange((form) => removeOption(form, mealType, option.key));
  }

  return (
    <SectionCard title={label}>
      <div className="flex flex-col gap-4">
        <FormField label="Indicación de la comida">
          <input
            type="text"
            className={inputClass}
            value={meal.instructions}
            maxLength={SHORT_TEXT_MAX_LENGTH}
            onChange={(event) => onChange((form) => setInstructions(form, mealType, event.target.value))}
          />
        </FormField>

        {meal.options.length === 0 && <p className="text-sm text-muted">Sin opciones</p>}

        {meal.options.map((option, index) => {
          const position = index + 1;
          return (
            <article key={option.key} className="flex min-w-0 flex-col gap-3 rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">Opción {position}</h3>
                <button type="button" className={LINK_BUTTON} onClick={() => confirmRemoveOption(option, position)}>
                  Quitar opción
                </button>
              </div>

              <FormField label="Descripción de la opción">
                <input
                  type="text"
                  className={inputClass}
                  value={option.description}
                  maxLength={SHORT_TEXT_MAX_LENGTH}
                  onChange={(event) =>
                    onChange((form) => setOptionDescription(form, mealType, option.key, event.target.value))
                  }
                />
              </FormField>

              {option.items.length === 0 ? (
                <p className="text-sm text-muted">Sin ítems</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {option.items.map((item) => (
                    <ItemRow
                      key={item.key}
                      item={item}
                      findings={findings.byItem.get(item.id)}
                      picker={pickerFor(option.key, item.key, `Reemplazar ${itemDisplay(item).text}`)}
                      onReplace={() => setPicking({ optionKey: option.key, itemKey: item.key })}
                      onRemove={() => onChange((form) => removeItem(form, mealType, option.key, item.key))}
                    />
                  ))}
                </ul>
              )}

              {pickerFor(option.key, null, `Agregar ítem a la opción ${position}`) ?? (
                <div>
                  <button
                    type="button"
                    className={LINK_BUTTON}
                    onClick={() => setPicking({ optionKey: option.key, itemKey: null })}
                    disabled={option.items.length >= MAX_ITEMS}
                  >
                    Agregar ítem
                  </button>
                </div>
              )}

              <FindingList findings={findings.byOption.get(option.id)} />
            </article>
          );
        })}

        <div>
          <button
            type="button"
            className={LINK_BUTTON}
            onClick={() => onChange((form) => addOption(form, mealType))}
            disabled={meal.options.length >= MAX_OPTIONS}
          >
            Agregar opción
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

export default PlanMealFields;
