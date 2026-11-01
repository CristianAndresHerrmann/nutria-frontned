import Badge from './Badge';
import { severityBadge } from '../pages/patientPlans';

// Hallazgos del motor de reglas con su badge de severidad (T39).
function FindingList({ findings }) {
  if (!findings?.length) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {findings.map((finding) => {
        const badge = severityBadge(finding.severity);
        return (
          <li key={finding.id} className="flex min-w-0 flex-col items-start gap-1.5 text-body-sm text-ink sm:flex-row">
            <Badge tone={badge.tone}>{badge.label}</Badge>
            <span className="min-w-0 break-words">{finding.message}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default FindingList;
