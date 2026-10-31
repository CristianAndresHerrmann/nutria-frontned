// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import DateInput from './DateInput';

let container;
let root;
const onChange = vi.fn();

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('innerWidth', 360);
  vi.stubGlobal('innerHeight', 800);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.getAttribute('role') === 'dialog') return { left: 0, top: 0, width: 280, height: 340, right: 280, bottom: 340 };
    return { left: 240, top: 600, width: 100, height: 42, right: 340, bottom: 642 };
  });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<DateInput value="2026-01-15" max="2026-12-31" onChange={onChange} />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const calendar = () => document.querySelector('[role="dialog"]');
const trigger = () => container.querySelector('button');
async function open() { await act(async () => trigger().click()); }

describe('calendario junto al borde del viewport', () => {
  it('sale de los contenedores que recortan, se desplaza a la izquierda y abre arriba si no cabe abajo', async () => {
    await open();
    expect(calendar().parentElement).toBe(document.body);
    expect(calendar().style.left).toBe('64px');
    expect(calendar().style.top).toBe('252px');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('limita la altura al cambiar el viewport y conserva los controles de mes y año', async () => {
    await open();
    vi.stubGlobal('innerHeight', 280);
    await act(async () => window.dispatchEvent(new Event('resize')));
    expect(calendar().style.maxHeight).toBe('248px');
    expect(calendar().style.top).toBe('16px');
    expect(calendar().querySelectorAll('select')).toHaveLength(2);
  });

  it('selecciona sin cerrar antes por el pointerdown del portal y devuelve la fecha ISO', async () => {
    await open();
    const day = [...calendar().querySelectorAll('button')].find((node) => node.textContent === '16');
    await act(async () => {
      day.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      day.click();
    });
    expect(onChange).toHaveBeenCalledWith('2026-01-16');
    expect(calendar()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('cierra con Escape devolviendo foco y al tocar fuera', async () => {
    await open();
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(calendar()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    await open();
    await act(async () => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(calendar()).toBeNull();
  });
});
