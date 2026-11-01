const TONES = {
  mint: 'bg-mint-50 text-mint-700',
  warning: 'bg-warning-bg text-warning',
  neutral: 'bg-neutral-soft text-muted',
  danger: 'bg-danger-bg text-danger',
};

function Badge({ children, tone = 'mint' }) {
  return (
    <span className={`inline-flex max-w-full items-center break-words rounded-full px-2.5 py-0.5 text-caption font-medium ${TONES[tone]}`}>
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}

export default Badge;
