const TONES = {
  mint: 'bg-mint-50 text-mint-700',
  warning: 'bg-warning-bg text-warning',
  neutral: 'bg-neutral-soft text-muted',
};

function Badge({ children, tone = 'mint' }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-caption font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export default Badge;
