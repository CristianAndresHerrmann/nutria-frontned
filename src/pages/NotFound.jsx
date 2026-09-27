import { useNavigate } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import Button from '../components/Button';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center pt-10">
      <SectionCard>
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
          <h1 className="text-xl font-bold text-ink">No encontramos esta página</h1>
          <p className="mb-2 text-sm text-muted">Revisá la dirección o volvé al inicio.</p>
          <Button onClick={() => navigate('/')}>Ir al inicio</Button>
        </div>
      </SectionCard>
    </div>
  );
}

export default NotFound;
