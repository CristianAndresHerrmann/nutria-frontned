import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createFood, listFoodGroups } from '../api/catalogs';
import { flattenTree } from '../utils/foodGroupTree';
import { EMPTY_FOOD_FORM, PRIVATE_FOOD_NOTICE, formToPayload } from '../pages/foodFormMapping';
import { useFormErrors } from '../hooks/useFormErrors';
import FoodFields from './FoodFields';
import FormError from './FormError';
import Button from './Button';
import iconCheck from '../assets/icons/icon-check.svg';

// Alta de un alimento sin salir del formulario de receta (T26). Es la misma alta
// que Catálogos › Alimentos: queda privado del nutricionista. Se monta solo
// mientras está abierto; al guardar llama a `onCreated(food)` y el que lo abrió
// lo cierra. Un error (nombre repetido incluido) lo deja abierto.
//
// Va en un portal porque se abre desde dentro del <form> de la receta, y un
// form anidado no es HTML válido. Los eventos de React igual burbujean por el
// árbol de componentes: el submit corta la propagación para no enviar la receta.
function CreateFoodDialog({ initialName, onCreated, onClose }) {
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const titleId = useId();

  const [form, setForm] = useState({ ...EMPTY_FOOD_FORM, name: initialName });
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const { fieldErrors, formError, reset, clearField, showError } = useFormErrors();

  // dialog provee Escape, foco contenido y fondo inerte sin librerías. Al
  // cerrar, el foco vuelve a donde estaba (el buscador de ingredientes).
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.focus();

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    listFoodGroups()
      .then((data) => {
        if (!cancelled) setGroups(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Con el nombre ya precargado, el foco arranca en el formulario.
  useEffect(() => {
    if (!isLoading) formRef.current?.querySelector('input, select')?.focus();
  }, [isLoading]);

  const groupOptions = useMemo(() => flattenTree(groups), [groups]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    clearField(field);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    reset();
    setIsSubmitting(true);

    try {
      const food = await createFood(formToPayload(form));
      onCreated(food);
    } catch (err) {
      showError(err);
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      tabIndex={-1}
      onCancel={(event) => {
        // El cierre lo decide el que abrió el modal: lo desmonta.
        event.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white p-0 text-ink shadow-card backdrop:bg-ink/40"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-ink">
              Nuevo alimento
            </h2>
            <p className="mt-1 text-body-sm text-muted">{PRIVATE_FOOD_NOTICE}</p>
          </div>
          <span className="text-note whitespace-nowrap text-muted">* Campo obligatorio</span>
        </div>

        {isLoading && <p className="text-sm text-muted">Cargando...</p>}

        {/* Sin grupos no se puede elegir dónde va el alimento. */}
        {loadError && (
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-danger" role="alert">
              {loadError}
            </p>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        )}

        {!isLoading && !loadError && (
          <form ref={formRef} className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <FoodFields form={form} groupOptions={groupOptions} fieldErrors={fieldErrors} onChange={updateField} />

            <FormError message={formError} />

            <div className="flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {!isSubmitting && <img src={iconCheck} alt="" />}
                {isSubmitting ? 'Guardando...' : 'Guardar alimento'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </dialog>,
    document.body,
  );
}

export default CreateFoodDialog;
