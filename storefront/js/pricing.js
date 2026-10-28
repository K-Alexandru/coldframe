// Pure pricing and display helpers. Every number the page shows comes from here.
export const option = (catalog, gid, oid) => catalog.groups.find(g => g.id === gid)?.options.find(o => o.id === oid);

export function defaultConfig(catalog) {
  return Object.fromEntries(catalog.groups.map(g => [g.id, (g.options.find(o => o.default) ?? g.options[0]).id]));
}

export const money = n => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US');

export function delta(catalog, config, gid, oid) {
  return option(catalog, gid, oid).price - option(catalog, gid, config[gid]).price;
}

export function deltaLabel(catalog, config, gid, oid) {
  if (config[gid] === oid) return 'Selected';
  const d = delta(catalog, config, gid, oid);
  return d === 0 ? 'No extra cost' : (d > 0 ? '+' : '') + money(d);
}

export const monthly = (catalog, amount) => Math.ceil(amount / catalog.financeMonths);

export function totals(catalog, config) {
  const addons = catalog.groups.reduce((s, g) => s + option(catalog, g.id, config[g.id]).price, 0);
  const subtotal = catalog.basePrice + addons;
  return { base: catalog.basePrice, addons, subtotal, monthly: monthly(catalog, subtotal) };
}

export function shipDate(from, businessDays) {
  const d = new Date(from);
  for (let n = 0; n < businessDays;) { d.setDate(d.getDate() + 1); if (d.getDay() % 6 !== 0) n++; }
  return d;
}

export const shipLabel = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

export function fps(catalog, config, res) {
  const gpu = option(catalog, 'gpu', config.gpu).perf ?? 1, cpu = option(catalog, 'cpu', config.cpu).perf ?? 1;
  return catalog.games.map(g => ({ name: g.name, fps: Math.round(g.base[res] * (gpu * (1 - g.cpuBound) + cpu * g.cpuBound)) }));
}

// share code: one base-36 digit per group, the index of its selected option
export function encodeConfig(catalog, config) {
  return catalog.groups.map(g => g.options.findIndex(o => o.id === config[g.id]).toString(36)).join('');
}

export function decodeConfig(catalog, code) {
  const def = defaultConfig(catalog);
  if (typeof code !== 'string' || code.length !== catalog.groups.length) return def;
  const out = {};
  for (const [i, g] of catalog.groups.entries()) {
    const o = g.options[parseInt(code[i], 36)];
    if (!o) return def;
    out[g.id] = o.id;
  }
  return out;
}
