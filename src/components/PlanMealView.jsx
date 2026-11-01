import { mealTypeLabel } from '../utils/recipeLabels';
import { itemDisplay, optionDescription } from '../pages/patientPlans';
import Badge from './Badge';
import FindingList from './FindingList';
import SectionCard from './SectionCard';

// Un ítem con sus hallazgos al lado (bloqueantes y advertencias). Un ítem no
// reconocido queda destacado: bloquea hasta reemplazarlo (DA-30).
function OptionItem({ item, findings }) {
  const { text, kind } = itemDisplay(item);
  const unrecognized = item.type === 'unrecognized';
  return (
    <li
      className={`flex min-w-0 flex-col gap-2 rounded-xl border px-3.5 py-2.5 ${
        unrecognized ? 'border-danger bg-danger-bg' : 'border-line'
      }`}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="min-w-0 break-words text-sm font-medium text-ink">{text}</span>
        {kind && <Badge tone={unrecognized ? 'danger' : 'neutral'}>{kind}</Badge>}
      </div>
      <FindingList findings={findings} />
    </li>
  );
}

// Una comida del borrador en modo lectura (T39), con los hallazgos de la
// última versión guardada junto a cada ítem u opción.
function PlanMealView({ meal, findings }) {
  return (
    <SectionCard title={mealTypeLabel(meal.mealType)} subtitle={meal.instructions}>
      <div className="flex flex-col gap-4">
        {meal.options.length === 0 && <p className="text-sm text-muted">Sin opciones</p>}
        {meal.options.map((option) => {
          const description = optionDescription(option);
          return (
            <article key={option.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-line p-4">
              <div className="min-w-0 break-words">
                <h3 className="text-sm font-semibold text-ink">Opción {option.order}</h3>
                {description && <p className="mt-1 text-sm whitespace-pre-line text-ink">{description}</p>}
              </div>
              {option.items.length === 0 ? (
                <p className="text-sm text-muted">Sin ítems</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {option.items.map((item) => (
                    <OptionItem key={item.id} item={item} findings={findings.byItem.get(item.id)} />
                  ))}
                </ul>
              )}
              <FindingList findings={findings.byOption.get(option.id)} />
            </article>
          );
        })}
      </div>
    </SectionCard>
  );
}

export default PlanMealView;
