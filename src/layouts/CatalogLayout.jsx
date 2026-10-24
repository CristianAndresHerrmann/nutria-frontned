import { NavLink, Outlet } from 'react-router-dom';

// Encabezado y pestañas comunes a los listados de catálogos (T15). El Figma no
// tiene estas pantallas: se arman con los tokens y componentes existentes.
const TAB = 'rounded-lg px-4 py-2 text-sm font-medium';

function tabClass({ isActive }) {
  return isActive ? `${TAB} bg-mint-50 text-primary` : `${TAB} text-muted hover:bg-surface`;
}

function CatalogLayout() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-ink">Catálogos</h1>
        <p className="mt-2 text-sm text-muted">
          Alimentos de la base común y los que cargaste vos, y tus recetas. Lo que cargás vos solo lo ves vos.
        </p>
      </div>

      <nav className="mb-5 inline-flex gap-1 rounded-xl border border-line bg-white p-1" aria-label="Catálogos">
        <NavLink to="/catalogos/alimentos" className={tabClass}>
          Alimentos
        </NavLink>
        <NavLink to="/catalogos/grupos" className={tabClass}>
          Grupos
        </NavLink>
        <NavLink to="/catalogos/recetas" className={tabClass}>
          Recetas
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}

export default CatalogLayout;
