import './SectionCard.css';

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <section className="section-card">
      {title && (
        <header className="section-card__header">
          {icon && <span className="section-card__icon">{icon}</span>}
          <div>
            <h2 className="section-card__title">{title}</h2>
            {subtitle && <p className="section-card__subtitle">{subtitle}</p>}
          </div>
        </header>
      )}
      <div className="section-card__content">{children}</div>
    </section>
  );
}

export default SectionCard;
