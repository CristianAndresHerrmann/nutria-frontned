import { useNavigate } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import '../components/buttons.css';
import './NotFound.css';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found">
      <SectionCard>
        <div className="not-found__content">
          <h1 className="not-found__title">No encontramos esta página</h1>
          <p className="not-found__subtitle">Revisá la dirección o volvé al inicio.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('/')}>
            Ir al inicio
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

export default NotFound;
