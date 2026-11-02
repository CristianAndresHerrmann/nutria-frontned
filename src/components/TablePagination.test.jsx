import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TablePagination from './TablePagination';

const noop = () => {};

function render(props) {
  return renderToStaticMarkup(
    createElement(TablePagination, { page: 1, pageSize: 10, total: 232, setPage: noop, setPageSize: noop, ...props }),
  );
}

// El botón con ese aria-label, con sus atributos.
function button(html, label) {
  return html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))[0];
}

describe('pie de una tabla paginada', () => {
  it('muestra el rango de filas de la página', () => {
    expect(render({ page: 2 })).toContain('11–20 de 232');
    expect(render({ page: 10, pageSize: 25 })).toContain('226–232 de 232');
  });

  it('ofrece 10 y 25 filas por página, con el tamaño actual elegido', () => {
    const html = render({ pageSize: 25 });

    expect(html).toContain('Filas por página');
    expect(html).toContain('<option value="10">10</option>');
    expect(html).toContain('<option value="25" selected="">25</option>');
  });

  it('deshabilita la página anterior en la primera y la siguiente en la última', () => {
    const first = render({ page: 1 });
    expect(button(first, 'Página anterior')).toContain('disabled=""');
    expect(button(first, 'Página siguiente')).not.toContain('disabled=""');

    const last = render({ page: 24 });
    expect(button(last, 'Página anterior')).not.toContain('disabled=""');
    expect(button(last, 'Página siguiente')).toContain('disabled=""');
  });

  it('no se muestra si todas las filas entran en una página de 10', () => {
    expect(render({ total: 10 })).toBe('');
    expect(render({ total: 11 })).toContain('aria-label="Paginación"');
  });
});
