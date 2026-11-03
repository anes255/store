// Categories can sit inside other categories (`parent_id`): Computers →
// CPU, RAM… One helper so the dashboard and the shop agree on what is a
// main category, what is under it, and which products a category covers.

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

/** Categories with no parent — or whose parent no longer exists. */
export function topLevel(categories = []) {
  return categories.filter((c) => !c.parent_id || !categories.some((p) => sameId(p.id, c.parent_id)));
}

/** Direct children of a category. */
export function childrenOf(categories = [], id) {
  return categories.filter((c) => sameId(c.parent_id, id));
}

/** The category itself plus everything under it, at any depth. */
export function withDescendants(categories = [], id) {
  const out = [];
  const seen = new Set();
  const walk = (cid) => {
    const key = String(cid);
    if (seen.has(key)) return; // a loop in bad data must not hang the page
    seen.add(key);
    out.push(cid);
    childrenOf(categories, cid).forEach((c) => walk(c.id));
  };
  if (id != null && id !== '') walk(id);
  return out;
}

/** The parent of a category, or null. */
export function parentOf(categories = [], id) {
  const c = categories.find((x) => sameId(x.id, id));
  return c && c.parent_id ? categories.find((p) => sameId(p.id, c.parent_id)) || null : null;
}

/** The main category a category belongs to (itself when it has no parent). */
export function rootOf(categories = [], id) {
  let cur = categories.find((x) => sameId(x.id, id)) || null;
  const seen = new Set();
  while (cur && cur.parent_id && !seen.has(String(cur.id))) {
    seen.add(String(cur.id));
    const up = categories.find((p) => sameId(p.id, cur.parent_id));
    if (!up) break;
    cur = up;
  }
  return cur;
}
