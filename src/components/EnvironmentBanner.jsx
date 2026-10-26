// Aviso de entorno de prueba (staging). El texto se fija en el build con
// VITE_ENV_LABEL; en local la variable no está y no se muestra nada. Va fijo
// abajo y sin capturar clics para no mover el layout de ninguna pantalla.
const LABEL = import.meta.env.VITE_ENV_LABEL;

function EnvironmentBanner() {
  if (!LABEL) return null;

  return (
    <p
      role="note"
      className="pointer-events-none fixed bottom-3 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-notice-bg px-3.5 py-1.5 text-note font-semibold text-notice shadow-card"
    >
      {LABEL}
    </p>
  );
}

export default EnvironmentBanner;
