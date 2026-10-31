import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolvePostLoginPath } from '../utils/roleRoutes';
import Button from '../components/Button';
import { inputClass } from '../components/FormField';

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a20.32 20.32 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

function BrandMark() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#f5fcf9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h4l2.5-8 5 16L16 12h6" />
    </svg>
  );
}

function Login() {
  const { isAuthenticated, role, sessionExpired, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname;

  if (isAuthenticated) {
    return <Navigate to={resolvePostLoginPath(role, from)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const { nutritionist } = await login(email, password);
      navigate(resolvePostLoginPath(nutritionist.role, from), { replace: true });
    } catch (err) {
      // Un error de validación va debajo de cada input; el mensaje general queda
      // para lo que no es de un campo (credenciales inválidas, sin conexión).
      const fields = err.fields || {};
      setFieldErrors(fields);
      if (Object.keys(fields).length === 0) setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-linear-to-r from-[#f3f8f6] to-surface px-4 py-8">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-2xl bg-primary">
          <BrandMark />
        </span>
        <span className="text-xl font-semibold tracking-[-0.5px] text-ink">
          Nutr<span className="text-primary">IA</span>
        </span>
      </div>

      <div className="w-full max-w-[420px] break-words rounded-2xl border border-line bg-white px-5 py-6 shadow-card sm:px-9 sm:py-9">
        <p className="mb-1.5 text-sm font-medium text-primary">Espacio profesional</p>
        <h1 className="mb-3 text-2xl font-semibold tracking-[-0.6px] text-ink">Iniciar sesión</h1>
        <p className="mb-7 text-sm leading-6 text-muted">Gestioná la información de tus pacientes de forma simple y segura.</p>

        {sessionExpired && (
          <p className="-mt-3 mb-5 rounded-xl bg-notice-bg px-3.5 py-2.5 text-body-sm text-notice" role="status">
            Tu sesión expiró. Volvé a iniciar sesión.
          </p>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <label className="flex flex-col gap-2 text-sm font-medium text-ink" htmlFor="email">
            <span>
              Correo electrónico <span className="text-primary">*</span>
            </span>
            <input
              id="email"
              type="email"
              className={inputClass}
              placeholder="tu@email.com"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              required
            />
            {fieldErrors.email && <span className="text-note font-normal text-danger">{fieldErrors.email}</span>}
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-ink" htmlFor="password">
            <span>
              Contraseña <span className="text-primary">*</span>
            </span>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`${inputClass} pr-11`}
                placeholder="Ingresá tu contraseña"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                required
              />
              <button
                type="button"
                className="absolute right-3 flex items-center justify-center text-muted hover:text-ink"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
            {fieldErrors.password && <span className="text-note font-normal text-danger">{fieldErrors.password}</span>}
          </label>

          {error && (
            <p className="-mt-2 text-body-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
          </Button>
        </form>
      </div>

      <p className="text-xs text-muted">NutrIA acompaña tu práctica profesional.</p>
    </div>
  );
}

export default Login;
