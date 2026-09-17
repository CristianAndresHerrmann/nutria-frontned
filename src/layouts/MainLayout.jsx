import { NavLink, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoMark from '../assets/icons/logo-mark.svg';
import navInicio from '../assets/icons/nav-inicio.svg';
import navPacientes from '../assets/icons/nav-pacientes.svg';
import navPlanes1 from '../assets/icons/nav-planes-1.svg';
import navPlanes2 from '../assets/icons/nav-planes-2.svg';
import navPlanes3 from '../assets/icons/nav-planes-3.svg';
import navPlanes4 from '../assets/icons/nav-planes-4.svg';
import navSeguimiento from '../assets/icons/nav-seguimiento.svg';
import logout1 from '../assets/icons/logout-1.svg';
import logout2 from '../assets/icons/logout-2.svg';
import logout3 from '../assets/icons/logout-3.svg';
import './MainLayout.css';

const HEADER_TITLES = [
  { pattern: '/', title: 'Inicio' },
  { pattern: '/pacientes', title: 'Pacientes' },
  { pattern: '/pacientes/nuevo', title: 'Nuevo paciente' },
  { pattern: '/pacientes/:id/editar', title: 'Editar paciente' },
  { pattern: '/pacientes/:id', title: 'Ficha del paciente' },
];

function headerTitleFor(pathname) {
  const match = HEADER_TITLES.find(({ pattern }) => matchPath({ path: pattern, end: true }, pathname));
  return match ? match.title : 'NutrIA';
}

function initialsOf(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

// Ícono compuesto de varios fragmentos vectoriales exportados de Figma
// (el diseño original los guarda como paths separados, no como un solo SVG).
function PlanesAlimentariosIcon() {
  return (
    <span className="layout__composite-icon">
      <img src={navPlanes1} alt="" style={{ position: 'absolute', inset: '8.8% 16.67%' }} />
      <img src={navPlanes2} alt="" style={{ position: 'absolute', inset: '8.8% 16.67% 66.48% 58.33%' }} />
      <img src={navPlanes3} alt="" style={{ position: 'absolute', inset: '37.64% 58.33% 62.36% 33.33%' }} />
      <img src={navPlanes4} alt="" style={{ position: 'absolute', inset: '54.12% 33.33% 45.88% 33.33%' }} />
      <img src={navPlanes4} alt="" style={{ position: 'absolute', inset: '70.6% 33.33% 29.4% 33.33%' }} />
    </span>
  );
}

function LogoutIcon() {
  return (
    <span className="layout__composite-icon">
      <img src={logout1} alt="" style={{ position: 'absolute', inset: '29.17% 12.5% 29.17% 66.67%' }} />
      <img src={logout2} alt="" style={{ position: 'absolute', top: '50%', left: '37.5%', right: '12.5%', height: '1px' }} />
      <img src={logout3} alt="" style={{ position: 'absolute', inset: '12.5% 62.5% 12.5% 12.5%' }} />
    </span>
  );
}

function MainLayout() {
  const { logout, nutritionist } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const initials = initialsOf(nutritionist?.name);

  return (
    <div className="layout">
      <aside className="layout__sidebar">
        <div className="layout__brand">
          <span className="layout__brand-mark">
            <img src={logoMark} alt="" />
          </span>
          <span className="layout__brand-name">
            Nutr<span className="layout__brand-accent">IA</span>
          </span>
        </div>

        <p className="layout__nav-heading">Menú principal</p>
        <nav className="layout__nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'layout__nav-link layout__nav-link--active' : 'layout__nav-link')}>
            <img src={navInicio} alt="" />
            Inicio
          </NavLink>
          <NavLink to="/pacientes" className={({ isActive }) => (isActive ? 'layout__nav-link layout__nav-link--active' : 'layout__nav-link')}>
            <img src={navPacientes} alt="" />
            Pacientes
          </NavLink>
        </nav>

        <p className="layout__nav-heading">Próximamente</p>
        <div className="layout__nav">
          <span className="layout__nav-link layout__nav-link--disabled">
            <PlanesAlimentariosIcon />
            Planes alimentarios
            <span className="layout__soon">Pronto</span>
          </span>
          <span className="layout__nav-link layout__nav-link--disabled">
            <img src={navSeguimiento} alt="" />
            Seguimiento
            <span className="layout__soon">Pronto</span>
          </span>
        </div>

        <div className="layout__profile">
          <span className="layout__avatar">{initials}</span>
          <div className="layout__profile-info">
            <span className="layout__profile-name">{nutritionist?.name || 'Nutricionista'}</span>
            <span className="layout__profile-email">{nutritionist?.email || ''}</span>
          </div>
          <button type="button" className="layout__logout" onClick={handleLogout} aria-label="Cerrar sesión">
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <div className="layout__main">
        <header className="layout__header">
          <span className="layout__header-title">{headerTitleFor(location.pathname)}</span>
          <div className="layout__header-profile">
            <span className="layout__divider" />
            <span className="layout__avatar">{initials}</span>
            <div className="layout__header-profile-text">
              <span className="layout__header-profile-name">Lic. {nutritionist?.name || 'Nutricionista'}</span>
              <span className="layout__header-profile-role">Nutricionista</span>
            </div>
          </div>
        </header>

        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
