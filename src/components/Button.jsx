const VARIANTS = {
  primary: 'bg-primary text-on-primary shadow-sm hover:enabled:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70',
  secondary: 'border border-line bg-white text-ink hover:bg-surface',
};

function Button({ variant = 'primary', type = 'button', className = '', children, ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex h-10.5 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 text-sm font-semibold [&_img]:size-4.25 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
