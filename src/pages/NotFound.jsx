import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homePathFor } from '../utils/roleRoutes';
import SectionCard from '../components/SectionCard';
import Button from '../components/Button';

function NotFound() {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="flex justify-center pt-10">
      <SectionCard>
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
          <h1 className="text-xl font-bold text-ink">No encontramos esta página</h1>
          <p className="mb-2 text-sm text-muted">Revisá la dirección o volvé al inicio.</p>
          <Button onClick={() => navigate(homePathFor(role))}>Ir al inicio</Button>
        </div>
      </SectionCard>
    </div>
  );
}

export default NotFound;
