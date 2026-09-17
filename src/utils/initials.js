export function initialsOf(patient) {
  return `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase();
}
