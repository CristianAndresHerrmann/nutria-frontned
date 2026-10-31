function SectionCard({ icon, title, subtitle, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-line bg-white shadow-card">
      {title && (
        <header className="flex items-start gap-3 border-b border-line p-5">
          {icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-mint-50 [&_img]:size-4.5">
              {icon}
            </span>
          )}
          <div className="min-w-0 break-words">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-body-sm text-muted">{subtitle}</p>}
          </div>
        </header>
      )}
      <div className="min-w-0 break-words p-5">{children}</div>
    </section>
  );
}

export default SectionCard;
