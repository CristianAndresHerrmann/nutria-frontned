// El tamaño va en cada variante: `icon` es un botón cuadrado sin texto, y pasar su
// tamaño por className pisaría la altura y el padding de la base.
const VARIANTS = {
  primary:
    'h-10.5 px-5 bg-primary text-on-primary shadow-sm hover:enabled:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70',
  secondary: 'h-10.5 px-5 border border-line bg-white text-ink hover:bg-surface',
  icon: 'size-9 border border-line bg-white hover:enabled:bg-surface disabled:cursor-not-allowed disabled:opacity-40',
};

function Button({ variant = 'primary', type = 'button', className = '', children, ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold [&_img]:size-4.25 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
