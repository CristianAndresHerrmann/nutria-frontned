import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPatient, getPatient, updatePatient } from '../api/patients';
import { isMinorFromDateInput, todayInputValue } from '../utils/date';
import { EMPTY_FORM, formToPayload, patientToForm } from './patientFormMapping';
import { CLINICAL_SECTIONS } from './patientClinicalFields';
import SectionCard from '../components/SectionCard';
import FormField, { inputClass } from '../components/FormField';
import ClinicalFieldInput from '../components/ClinicalFieldInput';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import iconPerson from '../assets/icons/icon-person.svg';
import iconTarget from '../assets/icons/icon-target.svg';
import iconCheck from '../assets/icons/icon-check.svg';

const FORM_GRID = 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2';

function PatientForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEditMode) return undefined;

    let cancelled = false;

    getPatient(id)
      .then((patient) => {
        if (!cancelled) setForm(patientToForm(patient));
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
  }, [id, isEditMode]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const isMinor = isMinorFromDateInput(form.birthDate);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const payload = formToPayload(form);
      const patient = isEditMode ? await updatePatient(id, payload) : await createPatient(payload);
      navigate(`/pacientes/${patient.id}`, { replace: true });
    } catch (err) {
      setFormError(err.message);
      setFieldErrors(err.fields || {});
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Cargando ficha...</p>;
  }

  // Sin la ficha no hay sobre qué editar: no se muestra el form ni la
  // posibilidad de guardar, para no pisar datos con un objeto vacío.
  if (loadError) {
    return (
      <div className="max-w-4xl">
        <p className="mb-4 text-sm text-danger" role="alert">
          {loadError}
        </p>
        <Button variant="secondary" onClick={() => navigate('/pacientes')}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <BackButton onClick={() => navigate('/pacientes')}>Volver</BackButton>

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-title font-bold text-ink">{isEditMode ? 'Editar paciente' : 'Nuevo paciente'}</h1>
          <p className="mt-2 text-sm text-muted">
            {isEditMode ? 'Actualizá los datos de la ficha.' : 'Completá los datos básicos para crear una nueva ficha.'}
          </p>
        </div>
        <span className="text-note whitespace-nowrap text-muted">* Campo obligatorio</span>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <SectionCard
          icon={<img src={iconPerson} alt="" />}
          title="Información personal"
          subtitle="Datos básicos de identificación y contacto."
        >
          <div className={FORM_GRID}>
            <FormField label="Nombre" required error={fieldErrors.firstName}>
              <input
                className={inputClass}
                placeholder="Ej. Camila"
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                required
              />
            </FormField>

            <FormField label="Apellido" required error={fieldErrors.lastName}>
              <input
                className={inputClass}
                placeholder="Ej. Fernández"
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                required
              />
            </FormField>

            <FormField label="Fecha de nacimiento" error={fieldErrors.birthDate}>
              <input
                type="date"
                className={inputClass}
                value={form.birthDate}
                max={todayInputValue()}
                onChange={(event) => updateField('birthDate', event.target.value)}
              />
            </FormField>

            <FormField label="Teléfono" error={fieldErrors.phone}>
              <input
                className={inputClass}
                placeholder="+54 9 11..."
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />
            </FormField>

            <FormField label="Correo electrónico" error={fieldErrors.email}>
              <input
                type="email"
                className={inputClass}
                placeholder="paciente@email.com"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
            </FormField>

            <FormField label="¿Con quién vive?" error={fieldErrors.livesWith}>
              <input
                className={inputClass}
                placeholder="Ej. Familia, pareja, sola/o"
                value={form.livesWith}
                onChange={(event) => updateField('livesWith', event.target.value)}
              />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard
          icon={<img src={iconTarget} alt="" />}
          title="Objetivo"
          subtitle="Podés completar esta información ahora o más adelante."
        >
          <div className={FORM_GRID}>
            <FormField label="Objetivo principal" error={fieldErrors.goal}>
              <input
                className={inputClass}
                placeholder="Ej. Mejorar hábitos"
                value={form.goal}
                onChange={(event) => updateField('goal', event.target.value)}
              />
            </FormField>

            <FormField label="Peso en el que se sentía cómoda/o" error={fieldErrors.referenceWeight}>
              <input
                type="number"
                step="0.1"
                className={inputClass}
                placeholder="Opcional"
                value={form.referenceWeight}
                onChange={(event) => updateField('referenceWeight', event.target.value)}
              />
            </FormField>
          </div>
        </SectionCard>

        {isMinor && (
          <SectionCard title="Adulto responsable" subtitle="Obligatorio: el paciente es menor de edad.">
            <div className={FORM_GRID}>
              <FormField label="Nombre" required error={fieldErrors.guardianName}>
                <input
                  className={inputClass}
                  value={form.guardianName}
                  onChange={(event) => updateField('guardianName', event.target.value)}
                  required
                />
              </FormField>

              <FormField label="Vínculo" required error={fieldErrors.guardianRelationship}>
                <input
                  className={inputClass}
                  value={form.guardianRelationship}
                  onChange={(event) => updateField('guardianRelationship', event.target.value)}
                  required
                />
              </FormField>

              <FormField label="Contacto" required error={fieldErrors.guardianContact}>
                <input
                  className={inputClass}
                  value={form.guardianContact}
                  onChange={(event) => updateField('guardianContact', event.target.value)}
                  required
                />
              </FormField>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={form.attendsAccompanied}
                  onChange={(event) => updateField('attendsAccompanied', event.target.checked)}
                />
                <span>Asiste acompañado</span>
              </label>
              {fieldErrors.attendsAccompanied && (
                <span className="text-note text-danger">{fieldErrors.attendsAccompanied}</span>
              )}
            </div>
          </SectionCard>
        )}

        {CLINICAL_SECTIONS.map((section) => (
          <SectionCard key={section.title} title={section.title} subtitle={section.subtitle}>
            <div className={FORM_GRID}>
              {section.fields.map((field) => (
                <ClinicalFieldInput
                  key={field.name}
                  field={field}
                  value={form[field.name]}
                  error={fieldErrors[field.name]}
                  onChange={updateField}
                />
              ))}
            </div>
          </SectionCard>
        ))}

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.incomplete}
            onChange={(event) => updateField('incomplete', event.target.checked)}
          />
          <span>Marcar ficha como incompleta</span>
        </label>

        {formError && (
          <p className="text-body-sm text-danger" role="alert">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-line pt-3">
          <Button variant="secondary" onClick={() => navigate('/pacientes')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {!isSubmitting && <img src={iconCheck} alt="" />}
            {isSubmitting ? 'Guardando...' : 'Guardar paciente'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default PatientForm;
