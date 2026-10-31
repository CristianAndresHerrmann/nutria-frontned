// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DataTable from './DataTable';

const columns = [
  { key: 'name', header: 'Alimento', className: 'font-semibold', cell: (row) => row.name },
  { key: 'group', header: 'Grupo', cell: (row) => row.group },
  { key: 'actions', header: 'Acciones', hideHeader: true, cell: (row) => createElement('button', { 'aria-label': `Editar ${row.name}` }, 'Editar') },
];

const rows = [
  { id: 'a', name: 'Manzana', group: 'Frutas frescas' },
  { id: 'b', name: 'Lentejas', group: 'Legumbres secas y en conserva' },
];

function render(props) {
  const html = renderToStaticMarkup(createElement(DataTable, { columns, rows, rowKey: (row) => row.id, ...props }));
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('tabla y tarjetas de listados', () => {
  it('dibuja un encabezado por columna y oculta visualmente el de acciones', () => {
    const table = render().querySelector('table');
    expect([...table.querySelectorAll('th')].map((node) => node.textContent)).toEqual(['Alimento', 'Grupo', 'Acciones']);
    expect(table.querySelector('th:last-child .sr-only').textContent).toBe('Acciones');
  });

  it('dibuja una fila por elemento, con las celdas de cada columna', () => {
    const document = render();
    const tableRows = document.querySelectorAll('tbody > tr');
    const cards = document.querySelectorAll('article');
    expect(tableRows).toHaveLength(rows.length);
    expect(cards).toHaveLength(rows.length);
    rows.forEach((row, index) => {
      for (const node of [tableRows[index], cards[index]]) {
        expect(node.textContent).toContain(row.name);
        expect(node.textContent).toContain(row.group);
        expect(node.querySelector('button').getAttribute('aria-label')).toBe(`Editar ${row.name}`);
      }
      expect([...cards[index].querySelectorAll('dt')].map((node) => node.textContent)).toEqual(['Alimento', 'Grupo']);
      expect(cards[index].querySelector('button').closest('dl')).toBeNull();
    });
  });

  it('suma las clases de la columna a las de la celda base', () => {
    const cell = render().querySelector('tbody td');
    expect(cell.classList.contains('px-5')).toBe(true);
    expect(cell.classList.contains('font-semibold')).toBe(true);
  });

  it('agrega la fila expandida debajo, ocupando todas las columnas', () => {
    const document = render({ renderExpanded: (row) => row.id === 'b' ? createElement('form', null, 'Formulario de Lentejas') : null });
    const table = document.querySelector('table');
    expect(table.querySelectorAll('tbody > tr')).toHaveLength(rows.length + 1);
    expect(table.querySelector('form').closest('td').colSpan).toBe(columns.length);
    const cards = document.querySelectorAll('article');
    expect(cards[0].querySelector('form')).toBeNull();
    expect(cards[1].querySelector('form').textContent).toBe('Formulario de Lentejas');
    expect(cards[1].querySelector('button').compareDocumentPosition(cards[1].querySelector('form')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('selecciona las variantes con CSS y conserva textos largos completos', () => {
    const name = 'Nombre'.repeat(60);
    const document = render({ rows: [{ id: 'long', name, group: 'Grupo completo' }] });
    expect(document.querySelector('table').classList.contains('hidden')).toBe(true);
    expect(document.querySelector('table').classList.contains('md:table')).toBe(true);
    expect(document.querySelector('article').parentElement.classList.contains('md:hidden')).toBe(true);
    expect(document.querySelector('article dd').textContent).toBe(name);
    expect(document.querySelector('tbody td').textContent).toBe(name);
  });
});
