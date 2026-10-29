import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DataTable from './DataTable';

const columns = [
  { key: 'name', header: 'Alimento', className: 'font-semibold', cell: (row) => row.name },
  { key: 'group', header: 'Grupo', cell: (row) => row.group },
  { key: 'actions', header: 'Acciones', hideHeader: true, cell: () => 'Editar' },
];

const rows = [
  { id: 'a', name: 'Manzana', group: 'Frutas frescas' },
  { id: 'b', name: 'Lentejas', group: 'Legumbres secas y en conserva' },
];

function render(props) {
  return renderToStaticMarkup(createElement(DataTable, { columns, rows, rowKey: (row) => row.id, ...props }));
}

const count = (html, pattern) => (html.match(pattern) || []).length;

describe('tabla de listados', () => {
  it('dibuja un encabezado por columna y oculta visualmente el de acciones', () => {
    const html = render();

    expect(html).toContain('>Alimento</th>');
    expect(html).toContain('>Grupo</th>');
    expect(html).toContain('<span class="sr-only">Acciones</span>');
  });

  it('dibuja una fila por elemento, con las celdas de cada columna', () => {
    const html = render();

    expect(count(html, /<tr>/g)).toBe(rows.length);
    expect(html).toContain('Manzana');
    expect(html).toContain('Legumbres secas y en conserva');
  });

  it('suma las clases de la columna a las de la celda base', () => {
    expect(render()).toContain('class="px-5 py-3 text-body-sm font-semibold"');
  });

  it('agrega la fila expandida debajo, ocupando todas las columnas', () => {
    const html = render({ renderExpanded: (row) => (row.id === 'b' ? 'Formulario de Lentejas' : null) });

    expect(count(html, /<tr>/g)).toBe(rows.length + 1);
    expect(html).toMatch(new RegExp(`colspan="${columns.length}"`, 'i'));
    expect(html.indexOf('Lentejas')).toBeLessThan(html.indexOf('Formulario de Lentejas'));
  });
});
