import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPatient, getPatient, updatePatient } from '../api/patients';
import { isMinorFromDateInput, toDateInputValue } from '../utils/date';
import SectionCard from '../components/SectionCard';
import FormField from '../components/FormField';
import iconPerson from '../assets/icons/icon-person.svg';
import iconTarget from '../assets/icons/icon-target.svg';
import iconCheck from '../assets/icons/icon-check.svg';
import iconArrowLeft from '../assets/icons/icon-arrow-left.svg';
import '../components/buttons.css';
import './PatientForm.css';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  birthDate: '',
  phone: '',
  email: '',
  livesWith: '',
  goal: '',
  referenceWeight: '',
  guardianName: '',
  guardianRelationship: '',
  guardianContact: '',
  attendsAccompanied: false,
  incomplete: true,
};

function patientToForm(patient) {
  return {
    firstName: patient.firstName || '',
    lastName: patient.lastName || '',
    birthDate: toDateInputValue(patient.birthDate),
    phone: patient.phone || '',
    email: patient.email || '',
    livesWith: patient.livesWith || '',
    goal: patient.goal || '',
    referenceWeight: patient.referenceWeight === null ? '' : String(patient.referenceWeight),
    guardianName: patient.guardianName || '',
    guardianRelationship: patient.guardianRelationship || '',
    guardianContact: patient.guardianContact || '',
    attendsAccompanied: Boolean(patient.attendsAccompanied),
    incomplete: !patient.registrationComplete,
  };
}

function formToPayload(form) {
  return {
    firstName: form.firstName,
    lastName: form.lastName,
    birthDate: form.birthDate,
    phone: form.phone,
    email: form.email,
    livesWith: form.livesWith,
    goal: form.goal,
    referenceWeight: form.referenceWeight,
    guardianName: form.guardianName,
    guardianRelationship: form.guardianRelationship,
    guardianContact: form.guardianContact,
    attendsAccompanied: form.attendsAccompanied,
    registrationComplete: !form.incomplete,
  };
}

function PatientForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        if (!cancelled) setFormError(err.message);
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
    return <p className="patient-form__status">Cargando ficha...</p>;
  }

  return (
    <div className="patient-form">
      <button type="button" className="patient-form__back" onClick={() => navigate('/pacientes')}>
        <img src={iconArrowLeft} alt="" />
        Volver
      </button>

      <div className="patient-form__intro">
        <div>
          <h1 className="patient-form__title">{isEditMode ? 'Editar paciente' : 'Nuevo paciente'}</h1>
          <p className="patient-form__subtitle">
            {isEditMode ? 'Actualizá los datos de la ficha.' : 'Completá los datos básicos para crear una nueva ficha.'}
          </p>
        </div>
        <span className="patient-form__required-hint">* Campo obligatorio</span>
      </div>

      <form className="patient-form__form" onSubmit={handleSubmit} noValidate>
        <SectionCard
          icon={<img src={iconPerson} alt="" />}
          title="Información personal"
          subtitle="Datos básicos de identificación y contacto."
        >
          <div className="patient-form__grid">
            <FormField label="Nombre" required error={fieldErrors.firstName}>
              <input
                className="field-input"
                placeholder="Ej. Camila"
                value={form.firstName}
                onChange={(event) => updateField('firstName', event.target.value)}
                required
              />
            </FormField>

            <FormField label="Apellido" required error={fieldErrors.lastName}>
              <input
                className="field-input"
                placeholder="Ej. Fernández"
                value={form.lastName}
                onChange={(event) => updateField('lastName', event.target.value)}
                required
              />
            </FormField>

            <FormField label="Fecha de nacimiento" error={fieldErrors.birthDate}>
              <input
                type="date"
                className="field-input"
                value={form.birthDate}
                onChange={(event) => updateField('birthDate', event.target.value)}
              />
            </FormField>

            <FormField label="Teléfono" error={fieldErrors.phone}>
              <input
                className="field-input"
                placeholder="+54 9 11..."
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />
            </FormField>

            <FormField label="Correo electrónico" error={fieldErrors.email}>
              <input
                type="email"
                className="field-input"
                placeholder="paciente@email.com"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
              />
            </FormField>

            <FormField label="¿Con quién vive?" error={fieldErrors.livesWith}>
              <input
                className="field-input"
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
          <div className="patient-form__grid">
            <FormField label="Objetivo principal" error={fieldErrors.goal}>
              <input
                className="field-input"
                placeholder="Ej. Mejorar hábitos"
                value={form.goal}
                onChange={(event) => updateField('goal', event.target.value)}
              />
            </FormField>

            <FormField label="Peso en el que se sentía cómoda/o" error={fieldErrors.referenceWeight}>
              <input
                type="number"
                step="0.1"
                className="field-input"
                placeholder="Opcional"
                value={form.referenceWeight}
                onChange={(event) => updateField('referenceWeight', event.target.value)}
              />
            </FormField>
          </div>
        </SectionCard>

        {isMinor && (
          <SectionCard title="Adulto responsable" subtitle="Obligatorio: el paciente es menor de edad.">
            <div className="patient-form__grid">
              <FormField label="Nombre" required error={fieldErrors.guardianName}>
                <input
                  className="field-input"
                  value={form.guardianName}
                  onChange={(event) => updateField('guardianName', event.target.value)}
                  required
                />
              </FormField>

              <FormField label="Vínculo" required error={fieldErrors.guardianRelationship}>
                <input
                  className="field-input"
                  value={form.guardianRelationship}
                  onChange={(event) => updateField('guardianRelationship', event.target.value)}
                  required
                />
              </FormField>

              <FormField label="Contacto" required error={fieldErrors.guardianContact}>
                <input
                  className="field-input"
                  value={form.guardianContact}
                  onChange={(event) => updateField('guardianContact', event.target.value)}
                  required
                />
              </FormField>

              <label className="patient-form__checkbox-label">
                <input
                  type="checkbox"
                  checked={form.attendsAccompanied}
                  onChange={(event) => updateField('attendsAccompanied', event.target.checked)}
                />
                <span>Asiste acompañado</span>
              </label>
              {fieldErrors.attendsAccompanied && (
                <span className="patient-form__field-error">{fieldErrors.attendsAccompanied}</span>
              )}
            </div>
          </SectionCard>
        )}

        <label className="patient-form__checkbox-label">
          <input
            type="checkbox"
            checked={form.incomplete}
            onChange={(event) => updateField('incomplete', event.target.checked)}
          />
          <span>Marcar ficha como incompleta</span>
        </label>

        {formError && (
          <p className="patient-form__general-error" role="alert">
            {formError}
          </p>
        )}

        <div className="patient-form__actions">
          <button type="button" className="btn btn--secondary" onClick={() => navigate('/pacientes')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
            {!isSubmitting && <img src={iconCheck} alt="" />}
            {isSubmitting ? 'Guardando...' : 'Guardar paciente'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PatientForm;
