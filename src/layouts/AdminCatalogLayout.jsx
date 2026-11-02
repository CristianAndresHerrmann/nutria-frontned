import { NavLink, Outlet, useLocation } from 'react-router-dom';
import ScrollTabs from '../components/ScrollTabs';

// Encabezado y pestañas del catálogo en el panel del administrador (T25). Como
// CatalogLayout, sin diseño en Figma: tokens y componentes existentes.
const TAB = 'shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium';

function tabClass({ isActive }) {
  return isActive ? `${TAB} bg-mint-50 text-primary` : `${TAB} text-muted hover:bg-surface`;
}

function AdminCatalogLayout() {
  const { pathname } = useLocation();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-ink">Catálogo</h1>
        <p className="mt-2 text-sm text-muted">
          Alimentos comunes y los que cargó cada nutricionista, grupos y patologías. Los planes que ya usan un alimento
          conservan su copia cuando lo corregís.
        </p>
      </div>

      <ScrollTabs activeKey={pathname} className="mb-5 flex w-fit gap-1 rounded-xl border border-line bg-white p-1" aria-label="Catálogo">
        <NavLink to="/admin/catalogo/alimentos" className={tabClass}>
          Alimentos
        </NavLink>
        <NavLink to="/admin/catalogo/grupos" className={tabClass}>
          Grupos
        </NavLink>
        <NavLink to="/admin/catalogo/patologias" className={tabClass}>
          Patologías
        </NavLink>
        <NavLink to="/admin/catalogo/actividad" className={tabClass}>
          Actividad
        </NavLink>
      </ScrollTabs>

      <Outlet />
    </div>
  );
}

export default AdminCatalogLayout;
