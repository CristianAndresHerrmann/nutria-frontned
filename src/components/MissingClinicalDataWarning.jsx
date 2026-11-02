// RF-45: advertencia, no bloquea nada. Se muestra en la ficha y en la vista del
// plan. La confirmación antes de aprobar un plan es del Incremento 4.
function MissingClinicalDataWarning() {
  return (
    <p className="mb-6 rounded-xl bg-warning-bg px-3.5 py-2.5 text-body-sm text-warning" role="status">
      No hay patologías, alergias, intolerancias ni medicación registradas para este paciente.
    </p>
  );
}

export default MissingClinicalDataWarning;
