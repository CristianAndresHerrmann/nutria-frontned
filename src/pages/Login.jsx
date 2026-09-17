import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

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
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/';
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login">
      <div className="login__brand">
        <span className="login__brand-mark">
          <BrandMark />
        </span>
        <span className="login__brand-name">
          Nutr<span className="login__brand-accent">IA</span>
        </span>
      </div>

      <div className="login__card">
        <p className="login__eyebrow">Espacio profesional</p>
        <h1 className="login__title">Iniciar sesión</h1>
        <p className="login__subtitle">Gestioná la información de tus pacientes de forma simple y segura.</p>

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <label className="login__label" htmlFor="email">
            <span className="login__label-text">
              Correo electrónico <span className="login__required">*</span>
            </span>
            <input
              id="email"
              type="email"
              className="login__input"
              placeholder="tu@email.com"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="login__label" htmlFor="password">
            <span className="login__label-text">
              Contraseña <span className="login__required">*</span>
            </span>
            <div className="login__input-group">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="login__input"
                placeholder="Ingresá tu contraseña"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="login__toggle-password"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </label>

          {error && (
            <p className="login__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>

      <p className="login__footer">NutrIA acompaña tu práctica profesional.</p>
    </div>
  );
}

export default Login;
