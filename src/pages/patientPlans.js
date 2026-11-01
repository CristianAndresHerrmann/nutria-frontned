// Mapeos de la API de planes (T39) a lo que muestra la pantalla. Los valores
// de los enums son los del backend.

const STATUS_LABELS = { draft: 'Borrador' };

export function planStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

// Texto de un ítem según su tipo y la etiqueta que lo acompaña. Un ítem no
// reconocido muestra el texto tal como lo propuso la IA.
export function itemDisplay(item) {
  switch (item.type) {
    case 'food':
      return { text: item.foodName, kind: null };
    case 'food_group':
      return { text: item.foodGroupName, kind: 'Grupo' };
    case 'recipe':
      return { text: item.recipe?.name, kind: 'Receta' };
    default:
      return { text: item.originalText, kind: 'No reconocido' };
  }
}

// La descripción de una opción, o null si solo repite el título "Opción N"
// (la IA suele mandarla así) o está vacía.
export function optionDescription(option) {
  const description = option.description?.trim();
  if (!description || description.toLowerCase() === `opción ${option.order}`) return null;
  return description;
}

const SEVERITY_BADGES = {
  blocking: { label: 'Bloqueante', tone: 'danger' },
  warning: { label: 'Advertencia', tone: 'warning' },
};

export function severityBadge(severity) {
  return SEVERITY_BADGES[severity] || { label: severity, tone: 'neutral' };
}

// Ubica cada hallazgo donde se muestra: junto a su ítem, al pie de su opción
// (composición) o arriba de todo si no apunta a ninguno. Conserva el orden del
// backend dentro de cada grupo.
export function groupFindings(findings) {
  const byItem = new Map();
  const byOption = new Map();
  const general = [];
  for (const finding of findings) {
    if (finding.optionItemId) push(byItem, finding.optionItemId, finding);
    else if (finding.optionId) push(byOption, finding.optionId, finding);
    else general.push(finding);
  }
  return { byItem, byOption, general };
}

function push(map, key, value) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}

export function findingCounts(findings) {
  return {
    blocking: findings.filter((finding) => finding.severity === 'blocking').length,
    warning: findings.filter((finding) => finding.severity === 'warning').length,
  };
}

const TEXT_SECTIONS = [
  { name: 'situationalDiagnosis', label: 'Diagnóstico situacional' },
  { name: 'introduction', label: 'Introducción' },
  { name: 'objectives', label: 'Objetivos' },
];

const RECOMMENDATION_SECTIONS = [
  { name: 'generalRecommendations', label: 'Generales' },
  { name: 'contextualRecommendations', label: 'Contextuales' },
  { name: 'clinicalRecommendations', label: 'Clínicas' },
  { name: 'thematicRecommendations', label: 'Temáticas' },
];

// Siempre las tres: un texto vacío se ve como "Sin dato".
export function planTextSections(plan) {
  return TEXT_SECTIONS.map(({ name, label }) => ({ name, label, text: plan[name] }));
}

// Solo las cargadas: la IA nunca escribe las clínicas (DA-28).
export function recommendationSections(plan) {
  return RECOMMENDATION_SECTIONS.filter(({ name }) => plan[name]).map(({ name, label }) => ({ name, label, text: plan[name] }));
}

const IA_TIMEOUT_REASONS = ['timeout', 'provider_timeout'];
const NOT_CREATED = 'No se creó ningún plan. Podés reintentar.';

// Mensaje del error de generación (RNF-02). Un 503 IA_UNAVAILABLE garantiza
// que no se guardó nada (DA-31). Un timeout del cliente no: el backend pudo
// terminar después, así que se pide revisar el listado antes de reintentar.
export function generationErrorMessage(err) {
  if (err.code === 'IA_UNAVAILABLE') {
    const reason = err.details?.reason;
    if (IA_TIMEOUT_REASONS.includes(reason)) return `El servicio de IA tardó demasiado en responder. ${NOT_CREATED}`;
    if (reason === 'invalid_output') return `La propuesta recibida no tenía un formato válido. ${NOT_CREATED}`;
    return `${err.message}. ${NOT_CREATED}`;
  }
  if (err.code === 'TIMEOUT') {
    return 'No se recibió respuesta a tiempo. La propuesta pudo haberse generado: revisá el listado antes de reintentar.';
  }
  return err.message;
}
