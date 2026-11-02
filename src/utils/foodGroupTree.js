// La API devuelve los grupos de alimentos como lista plana con parentId. Estas
// funciones arman lo que necesita la interfaz: el orden indentado (listado de
// grupos y selector) y la ruta de un grupo dentro de la jerarquía.

function byName(a, b) {
  return a.name.localeCompare(b.name, 'es');
}

// Cada grupo seguido de sus subgrupos, con su profundidad (0 = raíz). Hermanos en
// orden alfabético. Un grupo cuyo padre no vino en la lista se trata como raíz,
// para no perderlo.
export function flattenTree(groups) {
  const ids = new Set(groups.map((group) => group.id));
  const childrenOf = new Map();

  for (const group of groups) {
    const parentId = group.parentId && ids.has(group.parentId) ? group.parentId : null;
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId).push(group);
  }

  const result = [];
  const seen = new Set();

  function visit(parentId, depth) {
    for (const group of (childrenOf.get(parentId) || []).sort(byName)) {
      if (seen.has(group.id)) continue;
      seen.add(group.id);
      result.push({ ...group, depth });
      visit(group.id, depth + 1);
    }
  }

  visit(null, 0);
  return result;
}

// Los padres posibles de un grupo (T25), en el orden indentado: todos menos el
// grupo y sus subgrupos, a cualquier profundidad. Sin groupId (alta), todos. Es
// ayuda visual: el backend igual rechaza un ciclo con 400 en parentId.
export function parentOptions(groups, groupId) {
  const tree = flattenTree(groups);
  if (!groupId) return tree;

  const start = tree.findIndex((group) => group.id === groupId);
  if (start === -1) return tree;
  let end = start + 1;
  while (end < tree.length && tree[end].depth > tree[start].depth) end += 1;
  return [...tree.slice(0, start), ...tree.slice(end)];
}

// "Carnes, pescados y huevos › Aves". Corta si encuentra un ciclo en los datos.
export function groupPath(groups, id) {
  const byId = new Map(groups.map((group) => [group.id, group]));
  const names = [];
  const seen = new Set();
  let current = byId.get(id);

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : null;
  }

  return names.join(' › ');
}

// Sangría de las opciones del selector según la profundidad del grupo. Un
// <option> no admite estilos, y los espacios comunes se colapsan: van NBSP.
export function indent(depth) {
  return '    '.repeat(depth);
}
