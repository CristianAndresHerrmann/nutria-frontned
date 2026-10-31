const TH = 'px-5 py-3 text-left text-xs font-bold tracking-[0.3px] text-muted uppercase';
const TD = 'break-words px-5 py-3 text-body-sm';

// Tabla de listados (DA-33). Cada columna define su encabezado y cómo se dibuja
// la celda; `className` suma clases a la celda sin pisar las de la base.
// `hideHeader` deja el encabezado solo para lectores de pantalla (columna de
// acciones). `renderExpanded` agrega, si devuelve algo, una fila completa debajo.
// Los estados de carga, error y vacío los resuelve cada pantalla.
function DataTable({ columns, rows, rowKey, renderExpanded }) {
  return (
    <>
      <div className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <article key={rowKey(row)} className="min-w-0 p-5">
            <dl className="flex min-w-0 flex-col gap-4">
              {columns.filter((column) => !column.hideHeader).map((column) => (
                <div key={column.key} className="min-w-0">
                  <dt className="mb-1 text-xs font-bold tracking-[0.3px] text-muted uppercase">{column.header}</dt>
                  <dd className="min-w-0 break-words text-body-sm">{column.cell(row)}</dd>
                </div>
              ))}
            </dl>
            {columns.some((column) => column.hideHeader) && (
              <div className="mt-4 flex min-w-0 flex-wrap gap-3 border-t border-line pt-3">
                {columns.filter((column) => column.hideHeader).map((column) => (
                  <div key={column.key} className="min-w-0">{column.cell(row)}</div>
                ))}
              </div>
            )}
            {renderExpanded && <div className="min-w-0">{renderExpanded(row)}</div>}
          </article>
        ))}
      </div>
      <table className="hidden w-full table-fixed md:table xl:table-auto">
        <thead>
          <tr className="bg-neutral-soft/45">
            {columns.map((column) => (
              <th key={column.key} className={TH}>
                {column.hideHeader ? <span className="sr-only">{column.header}</span> : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <DataRow key={rowKey(row)} columns={columns} row={row} expanded={renderExpanded?.(row)} />
          ))}
        </tbody>
      </table>
    </>
  );
}

function DataRow({ columns, row, expanded }) {
  return (
    <>
      <tr>
        {columns.map((column) => (
          <td key={column.key} className={column.className ? `${TD} ${column.className}` : TD}>
            {column.cell(row)}
          </td>
        ))}
      </tr>
      {expanded && (
        <tr>
          <td colSpan={columns.length} className="bg-surface px-5 py-4">
            {expanded}
          </td>
        </tr>
      )}
    </>
  );
}

export default DataTable;
