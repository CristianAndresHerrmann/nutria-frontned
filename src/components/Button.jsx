// El tamaño va en cada variante: `icon` es un botón cuadrado sin texto, y pasar su
// tamaño por className pisaría la altura y el padding de la base. `ghost` es el
// botón de ícono sin borde de las acciones de una fila de tabla.
const VARIANTS = {
  primary:
    'min-h-10.5 max-w-full whitespace-normal break-words px-5 py-2 xl:h-10.5 xl:whitespace-nowrap xl:py-0 bg-primary text-on-primary shadow-sm hover:enabled:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70',
  secondary: 'min-h-10.5 max-w-full whitespace-normal break-words px-5 py-2 xl:h-10.5 xl:whitespace-nowrap xl:py-0 border border-line bg-white text-ink hover:bg-surface',
  icon: 'size-9 border border-line bg-white hover:enabled:bg-surface disabled:cursor-not-allowed disabled:opacity-40',
  ghost: 'size-8 hover:enabled:bg-surface disabled:cursor-not-allowed disabled:opacity-40',
  action: 'min-h-8 max-w-full break-words px-2 py-1 xl:size-8 xl:p-0 hover:enabled:bg-surface disabled:cursor-not-allowed disabled:opacity-40',
};

function Button({ variant = 'primary', type = 'button', className = '', children, ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold [&_img]:size-4.25 [&_img]:shrink-0 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
