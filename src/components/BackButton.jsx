import iconArrowLeft from '../assets/icons/icon-arrow-left.svg';

function BackButton({ onClick, children }) {
  return (
    <button
      type="button"
      className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
      onClick={onClick}
    >
      <img src={iconArrowLeft} alt="" className="size-4" />
      {children}
    </button>
  );
}

export default BackButton;
