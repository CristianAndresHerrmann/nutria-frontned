import Badge from './Badge';
import FoodPicker from './FoodPicker';
import { inputClass } from './FormField';

const LINK_BUTTON = 'text-body-sm font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline';

// Lista dinámica de ingredientes de una receta (T21). Cada ingrediente es un
// alimento del catálogo, nunca texto libre, con una cantidad descriptiva. El
// orden de la lista es el de la receta. `error` es el de details.fields.ingredients.
function RecipeIngredientsFields({ rows, error, onAdd, onQuantityChange, onMove, onRemove }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 && <p className="text-body-sm text-muted">Todavía no agregaste ingredientes.</p>}

      {rows.length > 0 && (
        <ol className="flex flex-col gap-2">
          {rows.map((row, index) => (
            <li key={row.key} className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-3.5 py-2">
              <span className="w-5 text-body-sm font-semibold text-muted">{index + 1}.</span>
              <span className="flex min-w-0 basis-full flex-wrap items-center gap-2 text-sm font-medium text-ink sm:min-w-40 sm:flex-1 xl:flex-nowrap">
                <span className="min-w-0 max-w-full break-words">{row.food.name}</span>
                {/* Un alimento dado de baja después de cargar la receta se puede conservar, no volver a agregar. */}
                {!row.food.active && <Badge tone="warning">Dado de baja</Badge>}
              </span>
              <input
                type="text"
                className={`${inputClass} sm:max-w-56`}
                placeholder="Cantidad, ej. 1 taza"
                value={row.quantityDescription}
                onChange={(event) => onQuantityChange(row.key, event.target.value)}
                aria-label={`Cantidad de ${row.food.name}`}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={LINK_BUTTON}
                  onClick={() => onMove(row.key, -1)}
                  disabled={index === 0}
                  aria-label={`Subir ${row.food.name}`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={LINK_BUTTON}
                  onClick={() => onMove(row.key, 1)}
                  disabled={index === rows.length - 1}
                  aria-label={`Bajar ${row.food.name}`}
                >
                  ↓
                </button>
                <button type="button" className={LINK_BUTTON} onClick={() => onRemove(row.key)}>
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <FoodPicker onSelect={onAdd} excludeIds={rows.map((row) => row.food.id)} invalid={Boolean(error)} />
      {error && <span className="text-note text-danger">{error}</span>}
    </div>
  );
}

export default RecipeIngredientsFields;
