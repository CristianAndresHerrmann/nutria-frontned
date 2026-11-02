import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import EnvironmentBanner from './components/EnvironmentBanner';
import MainLayout from './layouts/MainLayout';
import CatalogLayout from './layouts/CatalogLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientDetail from './pages/PatientDetail';
import PlanDetail from './pages/PlanDetail';
import Foods from './pages/Foods';
import FoodGroups from './pages/FoodGroups';
import FoodForm from './pages/FoodForm';
import Recipes from './pages/Recipes';
import RecipeForm from './pages/RecipeForm';
import RecipeDetail from './pages/RecipeDetail';
import Recommendations from './pages/Recommendations';
import RecommendationForm from './pages/RecommendationForm';
import AdminAccounts from './pages/AdminAccounts';
import AdminCatalogLayout from './layouts/AdminCatalogLayout';
import AdminFoods from './pages/AdminFoods';
import AdminFoodForm from './pages/AdminFoodForm';
import AdminFoodGroups from './pages/AdminFoodGroups';
import AdminPathologies from './pages/AdminPathologies';
import AdminCatalogActivity from './pages/AdminCatalogActivity';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute role="nutritionist" />}>
            <Route element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="pacientes" element={<Patients />} />
              <Route path="pacientes/nuevo" element={<PatientForm />} />
              <Route path="pacientes/:id" element={<PatientDetail />} />
              <Route path="pacientes/:id/editar" element={<PatientForm />} />
              <Route path="pacientes/:id/planes/:planId" element={<PlanDetail />} />
              <Route path="catalogos" element={<CatalogLayout />}>
                <Route index element={<Navigate to="alimentos" replace />} />
                <Route path="alimentos" element={<Foods />} />
                <Route path="grupos" element={<FoodGroups />} />
                <Route path="recetas" element={<Recipes />} />
                <Route path="recomendaciones" element={<Recommendations />} />
              </Route>
              <Route path="catalogos/alimentos/nuevo" element={<FoodForm />} />
              <Route path="catalogos/recetas/nueva" element={<RecipeForm />} />
              <Route path="catalogos/recetas/:id" element={<RecipeDetail />} />
              <Route path="catalogos/recetas/:id/editar" element={<RecipeForm />} />
              <Route path="catalogos/recomendaciones/nueva" element={<RecommendationForm />} />
              <Route path="catalogos/recomendaciones/:id/editar" element={<RecommendationForm />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
          <Route path="admin" element={<ProtectedRoute role="admin" />}>
            <Route element={<MainLayout />}>
              <Route index element={<Navigate to="cuentas" replace />} />
              <Route path="cuentas" element={<AdminAccounts />} />
              <Route path="catalogo" element={<AdminCatalogLayout />}>
                <Route index element={<Navigate to="alimentos" replace />} />
                <Route path="alimentos" element={<AdminFoods />} />
                <Route path="grupos" element={<AdminFoodGroups />} />
                <Route path="patologias" element={<AdminPathologies />} />
                <Route path="actividad" element={<AdminCatalogActivity />} />
              </Route>
              <Route path="catalogo/alimentos/nuevo" element={<AdminFoodForm />} />
              <Route path="catalogo/alimentos/:id/editar" element={<AdminFoodForm />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
        <EnvironmentBanner />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
