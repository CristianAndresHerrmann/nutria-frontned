// Aviso de entorno de prueba (staging). El texto se fija en el build con
// VITE_ENV_LABEL; en local la variable no está y no se muestra nada. Va fijo
// abajo y sin capturar clics. La copia de reserva ocupa exactamente el mismo
// alto, incluso cuando el aviso ocupa varias líneas; no agrega un segundo anuncio.
const LABEL = import.meta.env.VITE_ENV_LABEL;
const BANNER = 'w-fit max-w-[calc(100%-2rem)] break-words rounded-full bg-notice-bg px-3.5 py-1.5 text-center text-note font-semibold text-notice shadow-card';

function EnvironmentBanner() {
  if (!LABEL) return null;

  return (
    <>
      <div aria-hidden="true" className="pb-3 pt-6">
        <p className={`invisible mx-auto ${BANNER}`}>{LABEL}</p>
      </div>
      <p
        role="note"
        className={`pointer-events-none fixed bottom-3 left-1/2 z-50 -translate-x-1/2 ${BANNER}`}
      >
        {LABEL}
      </p>
    </>
  );
}

export default EnvironmentBanner;
