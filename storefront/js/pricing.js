// Pure pricing and display helpers. Every number the page shows comes from here.
export const option = (catalog, gid, oid) => catalog.groups.find(g => g.id === gid)?.options.find(o => o.id === oid);

export function defaultConfig(catalog) {
  return Object.fromEntries(catalog.groups.map(g => [g.id, (g.options.find(o => o.default) ?? g.options[0]).id]));
}

export const money = n => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-CA');

export function delta(catalog, config, gid, oid) {
  return option(catalog, gid, oid).price - option(catalog, gid, config[gid]).price;
}

export function deltaLabel(catalog, config, gid, oid) {
  if (config[gid] === oid) return 'Selected';
  const d = delta(catalog, config, gid, oid);
  return d === 0 ? 'No extra cost' : (d > 0 ? '+' : '') + money(d);
}

// Launch offer: an option with a compareAt price and a lower price is shown as ~~was~~ Free (or ~~was~~ price).
export const onOffer = o => !!o && typeof o.compareAt === 'number' && o.compareAt > o.price;
// The option's name as the cart and checkout list it: an offer option that costs nothing says so.
export const partLabel = (catalog, gid, oid) => { const o = option(catalog, gid, oid); return o.name + (onOffer(o) && o.price === 0 ? ' · Free' : ''); };

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

export const shipLabel = d => d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });

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

// ---- Series: Core, Pro and Elite are presets of the configurator state ----------------------------------------
// A preset sets these groups; finish, OS, warranty, packaging and extra storage carry over from whatever is picked.
export const SERIES_GROUPS = ['cpu', 'gpu', 'cooling', 'memory', 'storage', 'psu'];
const defaultOf = g => g.options.find(o => o.default) ?? g.options[0];

// The picks of one series for every series group: its own pick, or the group default when it names none.
export function seriesPicks(catalog, series) {
  return Object.fromEntries(SERIES_GROUPS.map(gid => {
    const g = catalog.groups.find(x => x.id === gid), own = series.picks?.[gid];
    return [gid, (own && option(catalog, gid, own) ? own : defaultOf(g).id)];
  }));
}
export const seriesConfig = (catalog, series, base = defaultConfig(catalog)) => ({ ...base, ...seriesPicks(catalog, series) });
export const seriesMatches = (catalog, config, series) => { const p = seriesPicks(catalog, series); return SERIES_GROUPS.every(gid => config[gid] === p[gid]); };

// The "from" price: the series picks over the defaults, with the cheapest finish, OS, warranty and packaging.
export function seriesPrice(catalog, series) {
  const cfg = seriesConfig(catalog, series);
  for (const gid of ['finish', 'os', 'warranty', 'packaging']) {
    const g = catalog.groups.find(x => x.id === gid);
    cfg[gid] = g.options.reduce((a, b) => b.price < a.price ? b : a, defaultOf(g)).id;   // ties keep the default
  }
  return totals(catalog, cfg).subtotal;
}

// The series a configuration is closest to (most series groups equal). Pro wins ties, as the default build.
export function nearestSeries(catalog, config) {
  const score = s => { const p = seriesPicks(catalog, s); return SERIES_GROUPS.filter(gid => config[gid] === p[gid]).length; };
  const order = [...catalog.series].sort((a, b) => (b.id === 'pro') - (a.id === 'pro'));
  return order.reduce((best, s) => score(s) > score(best) ? s : best, order[0]);
}

// Part swaps for the 3D view: { gpu: 'rtx5090fe', aio: 'kraken360' } from every selected option that names a `part`.
export function partsOf(catalog, config) {
  const out = {};
  for (const g of catalog.groups) { const o = option(catalog, g.id, config[g.id]); if (o?.part) out[o.part] = o.id; }
  return out;
}

// Average estimated FPS over the catalog games at one resolution, to the nearest 5.
export function avgFps(catalog, config, res) {
  const rows = fps(catalog, config, res);
  return Math.round(rows.reduce((s, r) => s + r.fps, 0) / rows.length / 5) * 5;
}

// ---- Cart lines ------------------------------------------------------------------------------------------------
// A cart line is { code, qty } for a PC (code = share code of the configuration) or { acc, qty } for an accessory. Accessories are separate lines,
// never part of the PC configuration. A cart saved before accessories existed holds PC lines only and still loads.
export const PC_MAX_QTY = 3, ACC_MAX_QTY = 5;
export const accessory = (catalog, id) => (catalog.accessories ?? []).find(a => a.id === id);
export const isAccessoryLine = it => typeof it?.acc === 'string';
export const maxQty = it => (isAccessoryLine(it) ? ACC_MAX_QTY : PC_MAX_QTY);
const clampQty = (q, max) => Math.min(max, Math.max(1, Math.round(+q) || 1));

// Reads saved lines: unknown accessories and malformed entries are dropped, quantities are clamped, duplicate accessories merge.
export function normalizeItems(catalog, raw) {
  const out = [];
  if (!Array.isArray(raw)) return out;
  for (const it of raw) {
    if (it && typeof it.code === 'string') out.push({ code: it.code, qty: clampQty(it.qty, PC_MAX_QTY) });
    else if (it && typeof it.acc === 'string' && accessory(catalog, it.acc)) {
      const hit = out.find(o => o.acc === it.acc), qty = clampQty(it.qty, ACC_MAX_QTY);
      if (hit) hit.qty = Math.min(ACC_MAX_QTY, hit.qty + qty); else out.push({ acc: it.acc, qty });
    }
  }
  return out;
}

export function lineTotal(catalog, it) {
  return (isAccessoryLine(it) ? accessory(catalog, it.acc).price : totals(catalog, decodeConfig(catalog, it.code)).subtotal) * it.qty;
}

// Cart totals: PC lines and accessory lines separately, then the order. Shipping is free on every order and no tax is added on top (the cart and checkout both read Tax as Included),
// so the total is the subtotal; both are returned so the cart and checkout read one place.
export function cartTotals(catalog, items) {
  let pc = 0, accessories = 0, count = 0;
  for (const it of items) { const t = lineTotal(catalog, it); if (isAccessoryLine(it)) accessories += t; else pc += t; count += it.qty; }
  const subtotal = pc + accessories;
  return { pc, accessories, subtotal, shipping: 0, tax: 0, total: subtotal + 0 + 0, count, monthly: monthly(catalog, subtotal) };
}
