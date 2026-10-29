import { BRAND } from './brand.js?v=9cbc9739d0';
import { connectModel } from './model.js?v=9cbc9739d0';
import { CATALOG } from './catalog.js?v=9cbc9739d0';
import { totals, money, accessory, shipDate, shipLabel, option, fps, avgFps, onOffer, seriesPicks, seriesMatches, seriesPrice, seriesConfig, nearestSeries } from './pricing.js?v=9cbc9739d0';
import { mountConfigurator } from './configurator.js?v=9cbc9739d0';
import { mountCart } from './cart.js?v=9cbc9739d0';
import { demoCheckoutAllowed } from './gate.js?v=9cbc9739d0';

document.querySelectorAll('[data-brand]').forEach(el => { el.textContent = BRAND[el.dataset.brand]; });
document.title = `Rime | ${BRAND.name}`;
// Facts the copy quotes come from the catalog so they can't drift from the prices: finance term, build time, warranty years.
const warrantyYears = CATALOG.groups.find(g => g.id === 'warranty').options.map(o => ({ def: !!o.default, years: parseInt(o.name, 10) }));
const FACTS = { financeMonths: CATALOG.financeMonths, buildDays: CATALOG.buildDays,
  warrantyYears: (warrantyYears.find(w => w.def) ?? warrantyYears[0]).years,
  warrantyExtend: warrantyYears.filter(w => !w.def).map(w => w.years).join(' or ') };
document.querySelectorAll('[data-catalog]').forEach(el => { el.textContent = FACTS[el.dataset.catalog]; });
// The tab icon takes the brand accent; the static link in index.html is the fallback.
document.getElementById('favicon')?.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="9" y="3" width="14" height="26" rx="3" fill="none" stroke="${BRAND.accent}" stroke-width="3"/></svg>`));
// The sticky viewer fits the space below the announce bar, header and breadcrumb.
const setChrome = () => document.documentElement.style.setProperty('--chrome-h', Math.round(document.querySelector('.hero').getBoundingClientRect().top + scrollY) + 'px');
setChrome(); addEventListener('resize', setChrome); document.fonts?.ready.then(setChrome);
document.documentElement.style.setProperty('--accent', BRAND.accent);
export const model = connectModel(document.getElementById('viewer'));

// Newsletter field: UI only. Submitting swaps in a thank-you line and sends nothing.
const news = document.getElementById('newsletter');
if (news) news.addEventListener('submit', e => {
  e.preventDefault();
  const done = document.createElement('p');
  done.className = 'news-done';
  done.setAttribute('role', 'status');
  done.textContent = "Thanks, you're on the list";
  news.replaceWith(done);
});

// Configurator, price block and viewer toolbar.
const $ = id => document.getElementById(id);

// Viewer toolbar: lighting preview, power, reset. Rendered once; the model's state keeps it in sync.
const SWATCH = { arctic: '#e8f4ff', ice: '#5fd4ff', ember: '#ff8a3c', violet: '#9a6bff', off: '#20242b',
  rainbow: 'conic-gradient(#ff5f6d, #ffd166, #5fd4a0, #5fd4ff, #9a6bff, #ff5f6d)' };
const BOOT_LABEL = { off: 'See it boot', boot: 'Starting…', on: 'Shut down', shutdown: 'Shutting down…', cut: 'Shutting down…' };
$('viewerTools').innerHTML = `
  <div class="swatches" role="radiogroup" aria-label="Preview lighting" title="Lighting is set in software. Change it any time.">
    ${CATALOG.lighting.map(o => `
      <button type="button" class="swatch" role="radio" aria-checked="false" data-light="${o.id}" aria-label="${o.name}" title="${o.name}" style="--sw:${SWATCH[o.id]}"></button>`).join('')}
  </div>
  <button type="button" class="icon-btn" id="bootBtn" disabled aria-label="${BOOT_LABEL.off}" title="${BOOT_LABEL.off}">
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v8"/><path d="M6.6 6.8a8 8 0 1 0 10.8 0"/></svg></button>
  <button type="button" class="icon-btn" id="resetBtn" aria-label="Reset view" title="Reset view">
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4.5h4.5"/></svg></button>`;
$('viewerTools').addEventListener('click', e => {
  const sw = e.target.closest('.swatch'), btn = e.target.closest('.icon-btn');
  if (sw) model.send({ mode: sw.dataset.light });
  else if (btn?.id === 'bootBtn') model.send({ power: 'toggle' });
  else if (btn?.id === 'resetBtn') model.send({ view: 'home' });
});
// Gallery strip: each thumbnail flies the model to one of its camera presets (the embed accepts 'home', 'gpu', 'pump', 'radiator', 'board' and 'rear_close'). The model reports no camera state, so the store tracks the active one,
// the toolbar's Reset button moves it too, and the shopper dragging or zooming the model clears it.
const thumbs = [...document.querySelectorAll('#gallery [data-view]')];
const setView = v => thumbs.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.view === v)));
$('gallery').addEventListener('click', e => { const t = e.target.closest('[data-view]'); if (t) { model.send({ view: t.dataset.view }); setView(t.dataset.view); } });
$('viewerTools').addEventListener('click', e => { const id = e.target.closest('.icon-btn')?.id; if (id === 'resetBtn') setView('home'); });
// The power button stays disabled until the model reports its state, so an early click can't be lost.
model.onState(s => {
  const bootLabel = BOOT_LABEL[s.phase] || BOOT_LABEL.off;
  $('bootBtn').disabled = false; $('bootBtn').setAttribute('aria-label', bootLabel); $('bootBtn').title = bootLabel;
  document.querySelectorAll('#viewerTools .swatch').forEach(sw => sw.setAttribute('aria-checked', String(sw.dataset.light === s.mode)));
});

// Viewer hint: wording follows the input type, and it fades after the first press inside the viewer.
// The iframe swallows pointer events, so a press there is seen as the window losing focus to the iframe.
const viewerCap = $('viewerCap');
if (matchMedia('(pointer: coarse)').matches) viewerCap.textContent = 'Drag to rotate · pinch to zoom';
window.addEventListener('blur', () => { if (document.activeElement === $('viewer')) viewerCap.classList.add('seen'); });
// On touch the parent never blurs, so the embed also posts 'interact' whenever the shopper starts a drag or zoom. A 6 s timer covers a missed message.
model.onInteract(() => { viewerCap.classList.add('seen'); setView(null); });   // the shopper moved the camera: no preset describes it any more
setTimeout(() => viewerCap.classList.add('seen'), 6000);

// ---- Series: Core, Pro and Elite are presets of the configurator state ----------------------------------------
const SERIES = CATALOG.series;
const urlSeries = SERIES.find(s => s.id === new URLSearchParams(location.search).get('series'));
let seriesId = null;   // the series last picked, or the closest one to a shared build; the first render settles it
$('series').innerHTML = SERIES.map(s => `
  <button type="button" class="series-card" role="radio" aria-checked="false" data-series="${s.id}">
    <span class="s-name">${s.name}</span><span class="s-line">${s.line}</span><span class="s-from">From ${money(seriesPrice(CATALOG, s))}</span>
  </button>`).join('');
const pickSeries = id => {
  seriesId = id;
  // The same path as clicking each option: the configurator changes the groups, posts the part swaps and calls updatePrice.
  configurator.apply(seriesPicks(CATALOG, SERIES.find(s => s.id === seriesId)));
  updatePrice(configurator.config);   // also covers a pick that changes nothing
};
$('series').addEventListener('click', e => { const b = e.target.closest('[data-series]'); if (b) pickSeries(b.dataset.series); });

// Launch offer strip: any option with a lower price than its compareAt, worded from the catalog.
const OFFERS = CATALOG.groups.flatMap(g => g.options.filter(o => onOffer(o) && o.price === 0).map(o => `Launch offer: ${parseInt(o.name, 10)}-year warranty free`));
if (OFFERS.length) { $('offer').textContent = OFFERS[0]; $('offer').hidden = false; }
// Customize opens the first row (Processor) and brings the configurator into view.
$('customizeBtn').addEventListener('click', () => { configurator.open(); $('customize').scrollIntoView(); });

const IN_THE_BOX = ['The PC', 'Power cable', 'Accessory box (spare screws, cable ties)', 'Quick-start guide', 'Wi-Fi antenna', 'Printed burn-in report'];
$('boxList').innerHTML = IN_THE_BOX.map(i => `<li>${i}</li>`).join('');
const BUILD_ROWS = [['CPU', 'cpu', n => n.replace('AMD ', '')], ['GPU', 'gpu', n => n.replace('NVIDIA GeForce ', '')], ['Memory', 'memory', n => n],
  ['Storage', 'storage', n => n], ['Cooler', 'cooling', n => n.replace('NZXT ', '')], ['OS', 'os', n => n]];

const updatePrice = config => {
  const t = totals(CATALOG, config);
  // Which series this is: a deep link or the closest one on first render, then the last pick, switching only if the build now matches another series exactly.
  if (!seriesId) seriesId = (urlSeries && !new URLSearchParams(location.hash.slice(1)).has('c') ? urlSeries : nearestSeries(CATALOG, config)).id;
  else { const hit = SERIES.find(s => seriesMatches(CATALOG, config, s)); if (hit) seriesId = hit.id; }
  const series = SERIES.find(s => s.id === seriesId), customised = !seriesMatches(CATALOG, config, series);
  document.querySelectorAll('#series [data-series]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.series === seriesId)));
  $('subtitle').textContent = series.name + (customised ? ' · customised' : '');
  $('bestChip').textContent = series.badge ?? ''; $('bestChip').hidden = !series.badge || customised;
  $('price').textContent = money(t.subtotal);
  $('monthly').textContent = `or ${money(t.monthly)}/mo for ${CATALOG.financeMonths} months at 0% APR`;
  $('thisBuild').innerHTML = BUILD_ROWS.map(([label, gid, short]) => `<div><dt>${label}</dt><dd>${short(option(CATALOG, gid, config[gid]).name)}</dd></div>`).join('');
  $('target').textContent = `1440p · ~${avgFps(CATALOG, config, '1440p')} FPS avg`;
  $('target').title = 'Estimated from internal testing; real results vary.';
  $('ship').textContent = `Ships by ${shipLabel(shipDate(new Date(), CATALOG.buildDays))}`;
  const w = option(CATALOG, 'warranty', config.warranty), lower = s => s.charAt(0).toLowerCase() + s.slice(1);
  $('trustWarranty').textContent = `${parseInt(w.name, 10)}-year warranty`;
  $('warrantyText').textContent = `${w.name} (${lower(w.spec)}). Lifetime phone and chat support. 30-day returns: send the PC back within 30 days of delivery for a refund.`;
  $('summaryBar').innerHTML = `<div class="sb-name">${CATALOG.name}<span class="muted">${$('subtitle').textContent}</span></div>`
    + `<div class="sb-price"><b>${money(t.subtotal)} <small class="cur">CAD</small></b><span class="muted">or ${money(t.monthly)}/mo</span></div><button class="primary" data-add>Add to cart</button>`;
  lastConfig = config;
  renderPerf(config, perfRes);
  renderSpecs(config);
};

// Performance: one tile per game. The gradient is generated from the title (same title, same tile, always) in a cold palette; the title is text; the numeral is the
// estimated FPS for the current build at the chosen resolution; the thin bar is that number against 240 FPS (faster games fill it).
const RESOLUTIONS = [['1080p', '1080p'], ['1440p', '1440p'], ['4k', '4K']];
const FPS_BAR_MAX = 240;
let lastConfig = null, perfRes = '1440p';
const titleHash = t => { let h = 2166136261; for (const c of t) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const tileGradient = title => {
  const h = titleHash(title), hue = 188 + h % 80, hue2 = 188 + (h >>> 8) % 80, angle = 105 + (h >>> 16) % 150, glow = 15 + (h >>> 20) % 70;
  return `radial-gradient(120% 90% at ${glow}% 0%, hsl(${hue2} 62% 24% / .75), transparent 62%), linear-gradient(${angle}deg, hsl(${hue} 52% 18%), hsl(${(hue + 36) % 360} 48% 10%))`;
};
const perfGames = CATALOG.games;
$('perf').innerHTML = `
  <p class="kicker">Performance</p>
  <h2>Estimated performance</h2>
  <div class="perf-bar">
    <div class="seg" role="tablist" aria-label="Resolution">
      ${RESOLUTIONS.map(([id, label]) => `<button type="button" role="tab" id="perfTab-${id}" data-res="${id}" aria-controls="perfTiles" aria-selected="${id === perfRes}" tabindex="${id === perfRes ? 0 : -1}">${label}</button>`).join('')}
    </div>
    <p class="avg-pill" id="perfAvg"></p>
  </div>
  <div class="tiles" id="perfTiles" role="tabpanel" aria-label="Estimated frames per second">
    ${perfGames.map(g => `<article class="tile" style="--tile-bg:${tileGradient(g.name)}"><h3 class="tile-title">${g.name}</h3>
      <p class="tile-fps"><span class="fps-num"></span><span class="fps-unit">FPS</span></p><span class="tile-bar" aria-hidden="true"><i></i></span></article>`).join('')}
  </div>
  <p class="note perf-note">Estimates from internal testing; real results vary. Bars are scaled to ${FPS_BAR_MAX} FPS.</p>`;
const perfTiles = [...$('perf').querySelectorAll('.tile')];
const renderPerf = (config, res) => {
  fps(CATALOG, config, res).forEach((r, i) => {
    perfTiles[i].querySelector('.fps-num').textContent = r.fps;
    perfTiles[i].querySelector('.tile-bar i').style.width = Math.min(100, r.fps / FPS_BAR_MAX * 100).toFixed(1) + '%';
  });
  $('perfTiles').setAttribute('aria-labelledby', `perfTab-${res}`);
  $('perfAvg').textContent = `Avg ${avgFps(CATALOG, config, '1440p')} FPS at 1440p`;
  $('perf').querySelectorAll('[data-res]').forEach(b => { const on = b.dataset.res === res; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
};
const pickRes = (id, focus) => {
  perfRes = id;
  if (lastConfig) renderPerf(lastConfig, perfRes);
  if (focus) $('perf').querySelector(`[data-res="${id}"]`).focus();
};
$('perf').addEventListener('click', e => { const b = e.target.closest('[data-res]'); if (b) pickRes(b.dataset.res); });
// Arrow keys, Home and End move between the tabs and select as they go.
$('perf').addEventListener('keydown', e => {
  const b = e.target.closest('[data-res]');
  if (!b) return;
  const ids = RESOLUTIONS.map(r => r[0]), at = ids.indexOf(b.dataset.res);
  const to = { ArrowRight: (at + 1) % ids.length, ArrowDown: (at + 1) % ids.length, ArrowLeft: (at + ids.length - 1) % ids.length, ArrowUp: (at + ids.length - 1) % ids.length, Home: 0, End: ids.length - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  pickRes(ids[to], true);
});

// Spec table: one row per configurator group plus the fixed rows, split into collapsible categories, then what ships in the box.
// A name that is a catalog group id shows that group's current pick; any other name is a fixed row.
const FIXED_SPECS = {
  Case: 'Rime dual-chamber mid-tower, 470 × 285 × 476 mm, 4 mm tempered glass',
  Motherboard: 'ASUS ROG STRIX X870E-E GAMING WIFI',
  Fans: '4 × NZXT F120 RGB Duo (3 intake, 1 exhaust)',
  Wireless: 'Wi-Fi 7, Bluetooth 5.4',
  Lighting: `Addressable RGB fans and cooler, ${CATALOG.lighting.length} presets, set in software`,
};
const SPEC_CATS = [
  ['proc', 'Processor &amp; graphics', ['cpu', 'gpu', 'Motherboard']],
  ['mem', 'Memory &amp; storage', ['memory', 'storage', 'storage2']],
  ['cool', 'Cooling &amp; power', ['cooling', 'psu', 'Fans']],
  ['case', 'Case &amp; connectivity', ['Case', 'finish', 'packaging', 'Wireless', 'Lighting']],
  ['soft', 'Software &amp; warranty', ['os', 'warranty']],
];
const specOpen = new Set(['proc']);   // which categories are open survives a re-render
const renderSpecs = config => {
  const row = k => {
    const g = CATALOG.groups.find(x => x.id === k);
    if (!g) return [k, FIXED_SPECS[k]];
    const o = option(CATALOG, g.id, config[g.id]);
    return [g.name, o.spec ? `${o.name} (${o.spec})` : o.name];
  };
  $('specs').innerHTML = `
    <p class="kicker">Specs</p>
    <h2>Full specifications</h2>
    <div class="spec-bar"><p class="note">Specs updated Oct 2026</p><button type="button" class="link" id="specAll">${specOpen.size === SPEC_CATS.length ? 'Collapse all' : 'Expand all'}</button></div>
    <div class="spec-cats">
      ${SPEC_CATS.map(([id, name, keys]) => `
      <details class="spec-cat" data-cat="${id}"${specOpen.has(id) ? ' open' : ''}>
        <summary>${name}</summary>
        <table class="spec-table"><tbody>${keys.map(row).map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>
      </details>`).join('')}
    </div>
    <h3>What's in the box</h3>
    <ul class="box-list">${IN_THE_BOX.map(i => `<li>${i}</li>`).join('')}</ul>`;
};
$('specs').addEventListener('toggle', e => {
  const d = e.target.closest?.('details[data-cat]');
  if (!d) return;
  if (d.open) specOpen.add(d.dataset.cat); else specOpen.delete(d.dataset.cat);
  const all = $('specAll'); if (all) all.textContent = specOpen.size === SPEC_CATS.length ? 'Collapse all' : 'Expand all';
}, true);
$('specs').addEventListener('click', e => {
  if (!e.target.closest('#specAll')) return;
  const openAll = specOpen.size < SPEC_CATS.length;
  $('specs').querySelectorAll('details[data-cat]').forEach(d => { d.open = openAll; });
});

// Reviews: sort and star filter over the review cards already on the page (their stars and date are data attributes).
const revList = $('revList');
const reviews = [...revList.children].map(el => ({ el, rating: Number(el.dataset.rating), date: el.dataset.date }));
let revStars = 0, revSort = 'newest';
const newest = (a, b) => b.date.localeCompare(a.date);
const REV_SORTS = { newest, highest: (a, b) => b.rating - a.rating || newest(a, b), lowest: (a, b) => a.rating - b.rating || newest(a, b) };
const renderReviews = () => {
  const shown = reviews.filter(r => !revStars || r.rating === revStars).sort(REV_SORTS[revSort]);
  reviews.forEach(r => { r.el.hidden = !shown.includes(r); });
  shown.forEach(r => revList.append(r.el));
  document.querySelectorAll('#reviews .pill[data-stars]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.stars) === revStars)));
  $('revShowing').textContent = `Showing ${shown.length} of ${reviews.length} featured reviews`;
  $('revEmpty').hidden = shown.length > 0;
  $('revEmpty').innerHTML = shown.length ? '' : `No ${revStars}-star reviews among the featured ones. <button type="button" class="link" data-stars="0">Show all reviews</button>`;
};
$('reviews').addEventListener('click', e => { const b = e.target.closest('[data-stars]'); if (b) { revStars = Number(b.dataset.stars); renderReviews(); } });
$('revSort').addEventListener('change', e => { revSort = e.target.value; renderReviews(); });
renderReviews();

// Complete your setup: one card per in-house accessory. An accessory is its own cart line; its button follows what the cart holds.
const ACC_TICK = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
$('accessories').innerHTML = `
  <p class="kicker">Accessories</p>
  <h2 id="accTitle">Complete your setup</h2>
  <p class="acc-lede">Monitor, keyboard, mouse and headset, designed by us to sit next to the Rime. They ship with your PC and are a separate line in your cart.</p>
  <ul class="acc-grid">
    ${CATALOG.accessories.map(a => `
    <li class="acc-card" data-acc="${a.id}">
      <img src="${a.img}" width="480" height="360" loading="lazy" alt="${a.alt}">
      <div class="acc-body">
        <h3>${a.name}</h3>
        <p class="acc-spec">${a.spec}</p>
        <div class="acc-foot"><span class="acc-price">${money(a.price)} <small class="cur">CAD</small></span><span class="acc-act"></span></div>
      </div>
    </li>`).join('')}
  </ul>
  <p class="sr" id="accStatus" role="status" aria-live="polite"></p>`;
const syncAccessories = items => {
  document.querySelectorAll('#accessories .acc-card').forEach(card => {
    const a = accessory(CATALOG, card.dataset.acc), line = items.find(it => it.acc === a.id), act = card.querySelector('.acc-act');
    const state = line ? 'in' + line.qty : 'out';
    if (act.dataset.state === state) return;   // unchanged: leave the focused button alone
    act.dataset.state = state;
    act.innerHTML = line
      ? `<span class="acc-added">${ACC_TICK} Added${line.qty > 1 ? ` · ${line.qty}` : ''}</span><button type="button" class="link acc-remove" data-acc-remove="${a.id}" aria-label="Remove ${a.name} from cart">Remove</button>`
      : `<button type="button" class="acc-btn" data-acc-add="${a.id}" aria-label="Add ${a.name} to cart, ${money(a.price)}">Add</button>`;
  });
};

// Compare the series: three cards over the same presets as the buy box. The button applies the series and returns to the buy box.
const shortName = n => n.replace(/^(AMD |NVIDIA GeForce |NZXT |Corsair )/, '');
const CMP_ROWS = [['Processor', 'cpu'], ['Graphics', 'gpu'], ['Memory', 'memory'], ['Storage', 'storage'], ['Cooling', 'cooling'], ['Power', 'psu']];
$('compare').innerHTML = `
  <p class="kicker">Compare</p>
  <h2>Compare the series</h2>
  <div class="cmp-grid">
    ${SERIES.map(sr => { const picks = seriesPicks(CATALOG, sr), cfg = seriesConfig(CATALOG, sr); return `
    <article class="cmp-card${sr.badge ? ' pick' : ''}" data-cmp="${sr.id}">
      <div class="cmp-top"><h3>${sr.name}</h3>${sr.badge ? `<span class="chip-best">${sr.badge}</span>` : ''}</div>
      <p class="cmp-from"><small>From</small> <b>${money(seriesPrice(CATALOG, sr))}</b> <span class="cur">CAD</span></p>
      <dl class="cmp-specs">${CMP_ROWS.map(([label, gid]) => `<div><dt>${label}</dt><dd>${shortName(option(CATALOG, gid, picks[gid]).name)}</dd></div>`).join('')}</dl>
      <p class="cmp-fps">1440p · ~${avgFps(CATALOG, cfg, '1440p')} FPS avg</p>
      <button type="button" class="btn-dark" data-choose="${sr.id}">Choose ${sr.name}</button>
    </article>`; }).join('')}
  </div>
  <p class="note">Finish, operating system, warranty and packaging carry over when you switch series. From prices use the lowest-priced finish, operating system, warranty and packaging.</p>`;
$('compare').addEventListener('click', e => {
  const b = e.target.closest('[data-choose]');
  if (!b) return;
  pickSeries(b.dataset.choose);
  document.querySelector('.buy').scrollIntoView();
  document.querySelector(`#series [data-series="${b.dataset.choose}"]`)?.focus({ preventScroll: true });
});
export const configurator = mountConfigurator({ root: $('configurator'), catalog: CATALOG, model, onChange: updatePrice, initial: urlSeries ? seriesConfig(CATALOG, urlSeries) : undefined });

// Cart drawer. Delegated so the sticky summary bar's re-rendered button works too.
const cart = mountCart({ catalog: CATALOG, brand: BRAND, drawer: $('cartDrawer'), body: $('cartBody'), scrim: $('scrim'), countEl: $('cartCount'), onChange: syncAccessories });
document.addEventListener('click', e => { if (e.target.closest('[data-add]')) cart.add(configurator.config); });
$('cartBtn').addEventListener('click', () => cart.open());
$('accessories').addEventListener('click', e => {
  const add = e.target.closest('[data-acc-add]'), rm = e.target.closest('[data-acc-remove]');
  const id = (add ?? rm)?.dataset[add ? 'accAdd' : 'accRemove'];
  if (!id) return;
  const a = accessory(CATALOG, id), card = $('accessories').querySelector(`[data-acc="${id}"]`);
  if (add) cart.addAccessory(id); else cart.removeAccessory(id);
  $('accStatus').textContent = add ? `${a.name} added to cart` : `${a.name} removed from cart`;
  card.querySelector(add ? '.acc-remove' : '.acc-btn')?.focus({ preventScroll: true });   // the button that was pressed is replaced; keep keyboard focus on the new one
});
// Local-only demo checkout. The public build has no checkout.js, and this import is never reached from its host.
const demoCheckout = demoCheckoutAllowed(location.hostname, BRAND.domain);
if (demoCheckout) {
  import('./checkout.js?v=9cbc9739d0').then(m => m.mountCheckout({ catalog: CATALOG, brand: BRAND, cart })).catch(e => console.warn('demo checkout unavailable:', e.message));
}

// Header nav. A link whose section is not on the page yet reads "Soon" and does nothing, rather than pointing nowhere.
const mainNav = $('mainNav');
mainNav.querySelectorAll('a[href^="#"]').forEach(a => {
  const id = a.getAttribute('href').slice(1);
  if (id && !document.getElementById(id)) { a.setAttribute('href', '#'); a.setAttribute('aria-disabled', 'true'); a.insertAdjacentHTML('beforeend', ' <span class="soon">Soon</span>'); }
});
// Under 960px the menu button opens a sheet with the same links plus Track order (only where the demo checkout is allowed, since the public build has nothing behind it). Focus stays inside it, Esc closes it, and the page behind is inert.
const menuBtn = $('menuBtn');
const navScrim = Object.assign(document.createElement('div'), { id: 'navScrim', hidden: true });
const sheet = Object.assign(document.createElement('div'), { id: 'navSheet', className: 'nav-sheet', hidden: true });
sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Menu');
sheet.innerHTML = `<div class="sheet-head"><span class="wordmark">${BRAND.name}</span><button type="button" class="x" data-sheet-close aria-label="Close menu">×</button></div>
  <nav aria-label="Menu">${mainNav.innerHTML.replace(' aria-current="page"', '')}${demoCheckout ? '<a href="#" class="track">Track order</a>' : ''}</nav>`;
document.body.append(navScrim, sheet);
const setSheetInert = on => document.querySelectorAll('body > :not(#navSheet):not(#navScrim):not(script)').forEach(el => { el.inert = on; });
const openSheet = () => {
  sheet.hidden = false; navScrim.hidden = false; setSheetInert(true);
  menuBtn.setAttribute('aria-expanded', 'true');
  sheet.querySelector('[data-sheet-close]').focus();
};
const closeSheet = (restoreFocus = true) => {
  if (sheet.hidden) return;
  sheet.hidden = true; navScrim.hidden = true; setSheetInert(false);
  menuBtn.setAttribute('aria-expanded', 'false');
  if (restoreFocus) menuBtn.focus({ preventScroll: true });
};
menuBtn.addEventListener('click', () => (sheet.hidden ? openSheet() : closeSheet()));
navScrim.addEventListener('click', () => closeSheet());
sheet.addEventListener('click', e => { if (e.target.closest('[data-sheet-close], a:not([aria-disabled])')) closeSheet(); });
sheet.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const f = [...sheet.querySelectorAll('button, a[href]')];
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
  else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
});
addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
matchMedia('(min-width: 961px)').addEventListener('change', e => { if (e.matches) closeSheet(false); });

// In-page links never touch the location hash, which holds the share code (#c=...). '#' does nothing; '#id' scrolls.
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  e.preventDefault();
  const id = a.getAttribute('href').slice(1);
  if (id) document.getElementById(id)?.scrollIntoView();
});

// The summary bar (the phone's sticky buy bar) shows only once the buy box's Add to cart has scrolled out above the viewport.
new IntersectionObserver(([e]) => { $('summaryBar').hidden = e.isIntersecting || e.boundingClientRect.top >= 0; }).observe($('addTop'));
