import { NavLink, Outlet } from 'react-router-dom';
import './MainLayout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/pacientes', label: 'Pacientes' },
];

function MainLayout() {
  return (
    <div className="layout">
      <aside className="layout__sidebar">
        <div className="layout__brand">NutrIA</div>
        <nav className="layout__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'layout__nav-link layout__nav-link--active' : 'layout__nav-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="layout__main">
        <header className="layout__header">
          <span>Panel del nutricionista</span>
        </header>

        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
