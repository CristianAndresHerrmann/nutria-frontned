import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import { inputClass } from './FormField';
import {
  dateTextToValue,
  dateValueError,
  displayToIso,
  isoToLocalDate,
  isoToDisplay,
  localDateToIso,
  maskDateText,
  valueToDateText,
} from '../utils/date';
import iconCalendar from '../assets/icons/icon-calendar.svg';

// Sin el CSS de react-day-picker: todo el estilo sale de los tokens. Los
// estados del día (seleccionado, hoy, deshabilitado) se aplican sobre la celda,
// así que pintan al botón con [&>button].
const CALENDAR_CLASSES = {
  root: 'relative text-body-sm text-ink',
  months: 'flex flex-col',
  month: 'flex flex-col gap-2',
  month_caption: 'flex h-9 items-center pr-18',
  caption_label: 'relative inline-flex items-center gap-1 whitespace-nowrap font-semibold',
  dropdowns: 'relative inline-flex items-center gap-2',
  dropdown_root:
    'relative inline-flex items-center rounded-lg border border-line-input px-2 py-1 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/12',
  dropdown: 'absolute inset-0 z-2 w-full cursor-pointer appearance-none opacity-0',
  chevron: 'size-4 fill-primary',
  nav: 'absolute top-0 right-0 flex h-9 items-center gap-1',
  button_previous:
    'inline-flex size-8 items-center justify-center rounded-lg hover:bg-mint-50 aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent',
  button_next:
    'inline-flex size-8 items-center justify-center rounded-lg hover:bg-mint-50 aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent',
  month_grid: 'border-collapse',
  weekday: 'h-8 w-9 text-center text-caption font-medium text-muted',
  day: 'size-9 p-0 text-center',
  day_button:
    'inline-flex size-9 items-center justify-center rounded-full hover:bg-mint-50 focus-visible:outline-2 focus-visible:outline-primary',
  selected: '[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-on-primary [&>button]:hover:bg-primary-hover',
  today: 'font-semibold text-primary',
  outside: 'text-muted/60',
  disabled: 'opacity-40 [&>button]:cursor-default [&>button]:hover:bg-transparent',
  hidden: 'invisible',
};

const DEFAULT_START_MONTH = new Date(1900, 0);

// Único campo de fecha de la app (nacimiento, consulta, medición). El valor que
// entra y sale es AAAA-MM-DD, igual que lo espera la API; el usuario ve y tipea
// DD/MM/AAAA o elige el día en el calendario. `min` y `max` son AAAA-MM-DD.
// El mensaje de error lo muestra el FormField que lo envuelve: el formulario lo
// calcula con completeDateValueError (mientras se tipea) y dateValueError (al
// guardar, sin llamar a la API si hay error).
function DateInput({ value, onChange, min, max, invalid = false, disabled = false }) {
  const [text, setText] = useState(() => valueToDateText(value));
  const [lastValue, setLastValue] = useState(value);
  const [blurred, setBlurred] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  // Si el valor cambia desde afuera (el modo edición carga al paciente), se
  // muestra; si es el eco de lo que se acaba de tipear, se respeta lo tipeado.
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== dateTextToValue(text)) setText(valueToDateText(value));
  }

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleMouseDown(event) {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      buttonRef.current?.focus();
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // El borde se pone rojo con la misma regla que frena el guardado; lo
  // incompleto recién cuando se sale del campo.
  const iso = displayToIso(text);
  const isLocallyInvalid =
    (text.length === 10 || blurred) && Boolean(dateValueError(dateTextToValue(text), { min, max }));

  function handleTextChange(event) {
    const nextText = maskDateText(event.target.value);
    setText(nextText);
    setBlurred(false);
    onChange(dateTextToValue(nextText));
  }

  function handleSelect(date) {
    if (date) {
      const nextValue = localDateToIso(date);
      setText(isoToDisplay(nextValue));
      onChange(nextValue);
    }
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  const selected = iso ? isoToLocalDate(iso) : undefined;
  const minDate = isoToLocalDate(min);
  const maxDate = isoToLocalDate(max);
  const disabledDays = [minDate && { before: minDate }, maxDate && { after: maxDate }].filter(Boolean);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD/MM/AAAA"
        className={`${inputClass} pr-11`}
        value={text}
        disabled={disabled}
        aria-invalid={invalid || isLocallyInvalid}
        onChange={handleTextChange}
        onBlur={() => setBlurred(true)}
      />
      <button
        ref={buttonRef}
        type="button"
        className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-lg hover:bg-mint-50 disabled:opacity-40"
        aria-label="Abrir calendario"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
      >
        <img src={iconCalendar} alt="" className="size-4.5" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Elegir fecha"
          className="absolute top-full left-0 z-20 mt-2 rounded-2xl border border-line bg-white p-3 font-normal shadow-card"
        >
          <DayPicker
            mode="single"
            required
            locale={es}
            captionLayout="dropdown"
            classNames={CALENDAR_CLASSES}
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected ?? maxDate ?? new Date()}
            startMonth={minDate ?? DEFAULT_START_MONTH}
            endMonth={maxDate ?? new Date(new Date().getFullYear() + 1, 11)}
            disabled={disabledDays}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

export default DateInput;
