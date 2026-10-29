import { NavLink, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoMark from '../assets/icons/logo-mark.svg';
import navInicio from '../assets/icons/nav-inicio.svg';
import navPacientes from '../assets/icons/nav-pacientes.svg';
import navCatalogos from '../assets/icons/nav-catalogos.svg';
import navPlanes1 from '../assets/icons/nav-planes-1.svg';
import navPlanes2 from '../assets/icons/nav-planes-2.svg';
import navPlanes3 from '../assets/icons/nav-planes-3.svg';
import navPlanes4 from '../assets/icons/nav-planes-4.svg';
import navSeguimiento from '../assets/icons/nav-seguimiento.svg';
import logout1 from '../assets/icons/logout-1.svg';
import logout2 from '../assets/icons/logout-2.svg';
import logout3 from '../assets/icons/logout-3.svg';
import Avatar from '../components/Avatar';

const NUTRITIONIST_HEADER_TITLES = [
  { pattern: '/', title: 'Inicio' },
  { pattern: '/pacientes', title: 'Pacientes' },
  { pattern: '/pacientes/nuevo', title: 'Nuevo paciente' },
  { pattern: '/pacientes/:id/editar', title: 'Editar paciente' },
  { pattern: '/pacientes/:id', title: 'Ficha del paciente' },
  { pattern: '/catalogos', title: 'Catálogos' },
  { pattern: '/catalogos/alimentos', title: 'Alimentos' },
  { pattern: '/catalogos/alimentos/nuevo', title: 'Nuevo alimento' },
  { pattern: '/catalogos/grupos', title: 'Grupos de alimentos' },
  { pattern: '/catalogos/recetas', title: 'Recetas' },
  { pattern: '/catalogos/recetas/nueva', title: 'Nueva receta' },
  { pattern: '/catalogos/recetas/:id/editar', title: 'Editar receta' },
  { pattern: '/catalogos/recetas/:id', title: 'Receta' },
  { pattern: '/catalogos/recomendaciones', title: 'Recomendaciones' },
  { pattern: '/catalogos/recomendaciones/nueva', title: 'Nueva recomendación' },
  { pattern: '/catalogos/recomendaciones/:id/editar', title: 'Editar recomendación' },
];

const ADMIN_HEADER_TITLES = [{ pattern: '/admin/cuentas', title: 'Cuentas' }];

function headerTitleFor(titles, pathname) {
  const match = titles.find(({ pattern }) => matchPath({ path: pattern, end: true }, pathname));
  return match ? match.title : 'Página no encontrada';
}

function initialsOf(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

const NAV_LINK = 'flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium [&>img]:size-4.5 [&>img]:shrink-0';

function navLinkClass({ isActive }) {
  return isActive ? `${NAV_LINK} bg-mint-50 text-primary` : `${NAV_LINK} text-muted hover:bg-surface`;
}

const SOON_LINK = 'flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted/50 [&>img]:size-4.5 [&>img]:shrink-0';

function SoonBadge() {
  return <span className="ml-auto whitespace-nowrap rounded-sm bg-neutral-soft px-1.5 py-0.5 text-[9px] font-semibold text-muted/50">Pronto</span>;
}

function NavHeading({ children }) {
  return <p className="mb-2 px-3 text-2xs font-bold tracking-[1.4px] text-muted uppercase">{children}</p>;
}

// Ícono compuesto de varios fragmentos vectoriales exportados de Figma
// (el diseño original los guarda como paths separados, no como un solo SVG).
function PlanesAlimentariosIcon() {
  return (
    <span className="relative block size-4.5 shrink-0">
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
    <span className="relative block size-4.5 shrink-0">
      <img src={logout1} alt="" style={{ position: 'absolute', inset: '29.17% 12.5% 29.17% 66.67%' }} />
      <img src={logout2} alt="" style={{ position: 'absolute', top: '50%', left: '37.5%', right: '12.5%', height: '1px' }} />
      <img src={logout3} alt="" style={{ position: 'absolute', inset: '12.5% 62.5% 12.5% 12.5%' }} />
    </span>
  );
}

function NutritionistNav() {
  return (
    <>
      <NavHeading>Menú principal</NavHeading>
      <nav className="mb-6 flex flex-col gap-1">
        <NavLink to="/" end className={navLinkClass}>
          <img src={navInicio} alt="" />
          Inicio
        </NavLink>
        <NavLink to="/pacientes" className={navLinkClass}>
          <img src={navPacientes} alt="" />
          Pacientes
        </NavLink>
        <NavLink to="/catalogos" className={navLinkClass}>
          <img src={navCatalogos} alt="" />
          Catálogos
        </NavLink>
      </nav>

      <NavHeading>Próximamente</NavHeading>
      <div className="mb-6 flex flex-col gap-1">
        <span className={SOON_LINK}>
          <PlanesAlimentariosIcon />
          Planes alimentarios
          <SoonBadge />
        </span>
        <span className={SOON_LINK}>
          <img src={navSeguimiento} alt="" />
          Seguimiento
          <SoonBadge />
        </span>
      </div>
    </>
  );
}

// El administrador no ve pacientes ni catálogos: solo las cuentas (T31). La
// curación del catálogo se suma en su propia tarea.
function AdminNav() {
  return (
    <>
      <NavHeading>Administración</NavHeading>
      <nav className="mb-6 flex flex-col gap-1">
        <NavLink to="/admin/cuentas" className={navLinkClass}>
          <img src={navPacientes} alt="" />
          Cuentas
        </NavLink>
      </nav>
    </>
  );
}

// Lo que cambia del layout según el rol de la cuenta.
const ROLE_VARIANTS = {
  nutritionist: {
    Nav: NutritionistNav,
    headerTitles: NUTRITIONIST_HEADER_TITLES,
    label: 'Nutricionista',
    displayName: (name) => `Lic. ${name || 'Nutricionista'}`,
  },
  admin: {
    Nav: AdminNav,
    headerTitles: ADMIN_HEADER_TITLES,
    label: 'Administrador',
    displayName: (name) => name || 'Administrador',
  },
};

function MainLayout() {
  const { logout, nutritionist, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const initials = initialsOf(nutritionist?.name);
  const variant = ROLE_VARIANTS[role] || ROLE_VARIANTS.nutritionist;
  const { Nav } = variant;

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-6">
        <div className="mb-6 flex items-center gap-2.5 px-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary">
            <img src={logoMark} alt="" className="size-4.75" />
          </span>
          <span className="text-xl font-semibold tracking-[-0.5px] text-ink">
            Nutr<span className="text-primary">IA</span>
          </span>
        </div>

        <Nav />

        <div className="mt-auto flex items-center gap-2.5 border-t border-line px-3 pt-4">
          <Avatar>{initials}</Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-ink">{nutritionist?.name || variant.label}</span>
            <span className="truncate text-caption text-muted">{nutritionist?.email || ''}</span>
          </div>
          <button
            type="button"
            className="flex size-6 shrink-0 items-center justify-center text-muted hover:text-ink"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-18 shrink-0 items-center justify-between border-b border-line bg-surface/95 px-10 backdrop-blur-xs">
          <span className="text-body-sm text-muted">{headerTitleFor(variant.headerTitles, location.pathname)}</span>
          <div className="flex items-center gap-3">
            <span className="h-6 w-px bg-line" />
            <Avatar>{initials}</Avatar>
            <div className="flex flex-col">
              <span className="text-caption font-semibold text-ink">{variant.displayName(nutritionist?.name)}</span>
              <span className="text-[10.8px] text-muted">{variant.label}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-10 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
