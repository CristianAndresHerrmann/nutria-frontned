import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathFor } from '../utils/roleRoutes';

// `role`: el rol que puede ver estas rutas. Una cuenta del otro rol vuelve a su
// propio inicio; el backend le respondería 403 de todos modos.
function ProtectedRoute({ role: requiredRole }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== requiredRole) {
    return <Navigate to={homePathFor(role)} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
