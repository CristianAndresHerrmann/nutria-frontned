import { useEffect, useState } from 'react';
import { listMeasurements } from '../api/patientMeasurements';
import { formatBmi, formatMeasurementValue, measurementLabel, splitMeasurements } from '../pages/patientMeasurements';
import { formatDate } from '../utils/date';
import SectionCard from './SectionCard';

const TH = 'px-4 py-3 text-left text-xs font-bold tracking-[0.3px] text-muted uppercase';
const TD = 'px-4 py-3 text-body-sm text-ink';

// Tabla del histórico: fecha, tipo, valor y unidad. `withBmi` suma la columna
// IMC, que solo tiene valor en los pesos con una talla anterior o del mismo día.
function MeasurementTable({ measurements, withBmi = false, emptyMessage }) {
  if (measurements.length === 0) return <p className="text-sm text-muted">{emptyMessage}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-neutral-soft/45">
            <th className={TH}>Fecha</th>
            <th className={TH}>Tipo</th>
            <th className={TH}>Valor</th>
            <th className={TH}>Unidad</th>
            {withBmi && <th className={TH}>IMC</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {measurements.map((measurement) => (
            <tr key={measurement.id}>
              <td className={TD}>{formatDate(measurement.date)}</td>
              <td className={TD}>{measurementLabel(measurement)}</td>
              <td className={TD}>{formatMeasurementValue(measurement.value)}</td>
              <td className={TD}>{measurement.unit || '—'}</td>
              {withBmi && <td className={TD}>{formatBmi(measurement.bmi)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Pestaña Mediciones de la ficha (T20; RF-11, RF-12): histórico de solo
// lectura, con antropometría y laboratorio separados. El orden (de la más
// reciente a la más antigua) y el IMC los da el backend. Las mediciones se
// cargan desde el formulario de consulta. Gráficos y variación entre consultas
// son del Incremento 5.
function PatientMeasurements({ patientId }) {
  const [measurements, setMeasurements] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listMeasurements(patientId)
      .then((data) => {
        setMeasurements(data);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [patientId]);

  if (error) {
    return (
      <SectionCard>
        <p className="text-body-sm text-danger" role="alert">
          {error}
        </p>
      </SectionCard>
    );
  }

  if (!measurements) {
    return (
      <SectionCard>
        <p className="text-sm text-muted">Cargando mediciones...</p>
      </SectionCard>
    );
  }

  const { anthropometry, laboratory } = splitMeasurements(measurements);

  return (
    <div className="flex flex-col gap-5">
      <SectionCard title="Antropometría" subtitle="Peso, talla, pliegues y circunferencias. El IMC se calcula con la talla más reciente a la fecha del peso.">
        <MeasurementTable measurements={anthropometry} withBmi emptyMessage="Sin mediciones registradas" />
      </SectionCard>
      <SectionCard title="Laboratorio" subtitle="Colesterol, triglicéridos, glucemia y otros parámetros. Ninguno es obligatorio.">

        <MeasurementTable measurements={laboratory} emptyMessage="Sin valores de laboratorio registrados" />
      </SectionCard>
    </div>
  );
}

export default PatientMeasurements;
