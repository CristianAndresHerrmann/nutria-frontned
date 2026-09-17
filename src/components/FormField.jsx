import './FormField.css';

function FormField({ label, required, error, children }) {
  return (
    <label className="form-field">
      <span className="form-field__label">
        {label} {required && <span className="form-field__required">*</span>}
      </span>
      {children}
      {error && <span className="form-field__error">{error}</span>}
    </label>
  );
}

export default FormField;
