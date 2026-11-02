import { useEffect, useId, useMemo, useState } from 'react';
import { listFoodGroups } from '../api/catalogs';
import { listRecipes } from '../api/recipes';
import { flattenTree, indent } from '../utils/foodGroupTree';
import { filterRecipes } from '../utils/recipeSearch';
import { mealTypeLabel } from '../utils/recipeLabels';
import { itemFromFood, itemFromGroup, itemFromRecipe } from '../pages/planForm';
import FoodPicker from './FoodPicker';
import { inputClass } from './FormField';

const KINDS = [
  { value: 'food', label: 'Alimento' },
  { value: 'group', label: 'Grupo' },
  { value: 'recipe', label: 'Receta' },
];

const KIND_OPTION = 'flex items-center gap-2 text-sm font-normal text-ink';
const LINK_BUTTON = 'text-body-sm font-medium text-primary hover:underline';
const RESULT = 'flex w-full min-w-0 break-words px-3.5 py-2 text-left text-sm text-ink hover:bg-surface';

function GroupSelect({ onSelect }) {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listFoodGroups()
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => flattenTree(groups ?? []), [groups]);

  if (error) {
    return (
      <p className="text-body-sm text-danger" role="alert">
        {error}
      </p>
    );
  }

  return (
    <select
      className={inputClass}
      value=""
      disabled={!groups}
      aria-label="Grupo de alimentos para el plan"
      onChange={(event) => {
        const group = options.find(({ id }) => id === event.target.value);
        if (group) onSelect(itemFromGroup(group));
      }}
    >
      <option value="">{groups ? 'Elegí un grupo' : 'Cargando grupos...'}</option>
      {options.map((group) => (
        <option key={group.id} value={group.id}>
          {indent(group.depth)}
          {group.name}
        </option>
      ))}
    </select>
  );
}

// Recetas del catálogo para la comida, ya filtradas por el backend con las
// condiciones del paciente (RF-28, RF-29). La búsqueda es en el cliente, como en
// el listado de recetas.
function RecipeSearch({ patientId, mealType, onSelect }) {
  const [recipes, setRecipes] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    listRecipes({ patientId, mealType })
      .then((data) => {
        if (!cancelled) setRecipes(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, mealType]);

  const results = useMemo(() => filterRecipes(recipes ?? [], search), [recipes, search]);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <input
        type="search"
        className={inputClass}
        placeholder="Buscar receta por nombre o ingrediente..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.preventDefault();
        }}
        aria-label="Buscar receta para el plan"
      />
      <p className="text-note text-muted">
        Recetas de {mealTypeLabel(mealType).toLowerCase()} sin ingredientes restringidos por las alergias, intolerancias
        o rechazos del paciente.
      </p>
      {error && (
        <p className="text-body-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {!error && !recipes && <p className="text-sm text-muted">Cargando recetas...</p>}
      {!error && recipes && results.length === 0 && <p className="text-sm text-muted">No hay recetas que coincidan.</p>}
      {results.length > 0 && (
        <ul className="max-h-72 divide-y divide-line overflow-y-auto overscroll-contain rounded-xl border border-line bg-white">
          {results.map((recipe) => (
            <li key={recipe.id}>
              <button type="button" className={RESULT} onClick={() => onSelect(itemFromRecipe(recipe))}>
                {recipe.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Qué va en un ítem del plan (T40): un alimento, un grupo o una receta del
// catálogo, nunca texto libre. Así un ítem no reconocido se resuelve (DA-26).
// `onSelect` recibe el ítem listo para el formulario.
function PlanItemPicker({ title, patientId, mealType, onSelect, onCancel }) {
  const [kind, setKind] = useState('food');
  const name = useId();

  return (
    <div role="group" aria-label={title} className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-surface p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="min-w-0 break-words text-sm font-semibold text-ink">{title}</span>
        <button type="button" className={LINK_BUTTON} onClick={onCancel}>
          Cancelar
        </button>
      </div>
      <fieldset className="flex flex-wrap gap-x-6 gap-y-2">
        <legend className="sr-only">Tipo de ítem</legend>
        {KINDS.map(({ value, label }) => (
          <label key={value} className={KIND_OPTION}>
            <input type="radio" name={name} checked={kind === value} onChange={() => setKind(value)} />
            {label}
          </label>
        ))}
      </fieldset>
      {kind === 'food' && (
        <FoodPicker
          onSelect={(food) => onSelect(itemFromFood(food))}
          placeholder="Buscar un alimento del catálogo..."
          ariaLabel="Buscar alimento para el plan"
        />
      )}
      {kind === 'group' && <GroupSelect onSelect={onSelect} />}
      {kind === 'recipe' && <RecipeSearch patientId={patientId} mealType={mealType} onSelect={onSelect} />}
    </div>
  );
}

export default PlanItemPicker;
