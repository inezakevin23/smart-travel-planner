// Simple client-side search helpers — currently alias to UI handlers in ui.js

function normalize(s) {
  return String(s, "").toLowerCase().trim();
}

export function matches(query, item, fields = []) {
  const q = normalize(query);
  if (!q) return true;
  for (const f of fields) {
    if (normalize(item[f]).includes(q)) return true;
  }
  return false;
}
