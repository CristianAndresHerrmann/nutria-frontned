// Error general de un formulario, arriba del botón de guardar (ver useFormErrors).
function FormError({ message }) {
  if (!message) return null;

  return (
    <p className="text-body-sm text-danger" role="alert">
      {message}
    </p>
  );
}

export default FormError;
