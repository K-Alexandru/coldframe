import { BRAND } from './brand.js';
import { connectModel } from './model.js';
import { CATALOG } from './catalog.js';
import { totals, money, shipDate, shipLabel, option, fps } from './pricing.js';
import { mountConfigurator } from './configurator.js';
import { mountCart } from './cart.js';

document.querySelectorAll('[data-brand]').forEach(el => { el.textContent = BRAND[el.dataset.brand]; });
document.title = `Glass Tower | ${BRAND.name}`;
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

// Viewer toolbar: lighting preview, power, GPU close-up, reset. Rendered once; the model's state keeps it in sync.
const SWATCH = { arctic: '#e8f4ff', ice: '#5fd4ff', ember: '#ff8a3c', violet: '#9a6bff', off: '#20242b',
  rainbow: 'conic-gradient(#ff5f6d, #ffd166, #5fd4a0, #5fd4ff, #9a6bff, #ff5f6d)' };
const BOOT_LABEL = { off: 'See it boot', boot: 'Starting…', on: 'Shut down', shutdown: 'Shutting down…', cut: 'Shutting down…' };
$('viewerTools').innerHTML = `
  <div class="swatches" role="radiogroup" aria-label="Preview lighting" title="Lighting is set in software. Change it any time.">
    ${CATALOG.lighting.map(o => `
      <button type="button" class="swatch" role="radio" aria-checked="false" data-light="${o.id}" aria-label="${o.name}" title="${o.name}" style="background:${SWATCH[o.id]}"></button>`).join('')}
  </div>
  <button type="button" class="icon-btn" id="bootBtn" disabled aria-label="${BOOT_LABEL.off}" title="${BOOT_LABEL.off}">
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v8"/><path d="M6.6 6.8a8 8 0 1 0 10.8 0"/></svg></button>
  <button type="button" class="chip" id="gpuBtn">GPU close-up</button>
  <button type="button" class="icon-btn" id="resetBtn" aria-label="Reset view" title="Reset view">
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4.5h4.5"/></svg></button>`;
$('viewerTools').addEventListener('click', e => {
  const sw = e.target.closest('.swatch'), btn = e.target.closest('.chip, .icon-btn');
  if (sw) model.send({ mode: sw.dataset.light });
  else if (btn?.id === 'bootBtn') model.send({ power: 'toggle' });
  else if (btn?.id === 'gpuBtn') model.send({ view: 'gpu' });
  else if (btn?.id === 'resetBtn') model.send({ view: 'home' });
});
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

const updatePrice = config => {
  const t = totals(CATALOG, config);
  $('price').textContent = money(t.subtotal);
  $('addPrice').textContent = money(t.subtotal);
  $('monthly').textContent = `or ${money(t.monthly)}/mo for ${CATALOG.financeMonths} months at 0% APR`;
  $('ship').textContent = `Ships by ${shipLabel(shipDate(new Date(), CATALOG.buildDays))} · free shipping`;
  $('subtitle').textContent = `${option(CATALOG, 'finish', config.finish).name} · ${option(CATALOG, 'gpu', config.gpu).name.replace('NVIDIA GeForce ', '')} · ${option(CATALOG, 'cpu', config.cpu).name.replace('AMD ', '')}`;
  $('summaryBar').innerHTML = `<span>${CATALOG.name}</span><b>${money(t.subtotal)}</b><span class="muted">${money(t.monthly)}/mo</span><button class="primary" data-add>Add to cart</button>`;
  lastConfig = config;
  renderPerf(config, perfRes);
  renderSpecs(config);
};

// Performance panel: estimated FPS per game at the chosen resolution.
const RESOLUTIONS = [['1080p', '1080p'], ['1440p', '1440p'], ['4k', '4K']];
let lastConfig = null, perfRes = '1080p';
// Bars share one fixed scale (the top estimate across every resolution, with the fastest CPU and GPU), so a faster part or a lower resolution visibly moves the bars.
const bestOf = gid => CATALOG.groups.find(g => g.id === gid).options.reduce((a, b) => (b.perf ?? 1) > (a.perf ?? 1) ? b : a).id;
const FPS_SCALE_MAX = Math.max(...RESOLUTIONS.flatMap(([id]) => fps(CATALOG, { gpu: bestOf('gpu'), cpu: bestOf('cpu') }, id).map(r => r.fps)));
const renderPerf = (config, res) => {
  const rows = fps(CATALOG, config, res);
  const max = FPS_SCALE_MAX;
  $('perf').innerHTML = `
    <h2>Estimated performance</h2>
    <div class="seg" role="group" aria-label="Resolution">
      ${RESOLUTIONS.map(([id, label]) => `<button type="button" data-res="${id}" aria-pressed="${id === res}"${id === res ? ' class="on"' : ''}>${label}</button>`).join('')}
    </div>
    <div role="list" aria-label="Estimated frames per second at ${RESOLUTIONS.find(r => r[0] === res)[1]}">
      ${rows.map(r => `<div class="fps-row" role="listitem"><span>${r.name}</span><span class="fps-bar" aria-hidden="true"><i style="width:${(r.fps / max * 100).toFixed(1)}%"></i></span><span class="fps-num">${r.fps} FPS</span></div>`).join('')}
    </div>
    <p class="note">Estimates from internal testing; real results vary.</p>`;
};
$('perf').addEventListener('click', e => {
  const btn = e.target.closest('[data-res]');
  if (!btn || !lastConfig) return;
  perfRes = btn.dataset.res;
  renderPerf(lastConfig, perfRes);
  $('perf').querySelector(`[data-res="${perfRes}"]`).focus();
});

// Spec table: one row per configurator group, then the fixed rows, then what ships in the box.
const FIXED_SPECS = [
  ['Case', 'Glass Tower dual-chamber mid-tower, 470 × 285 × 476 mm, 4 mm tempered glass'],
  ['Motherboard', 'ASUS ROG STRIX X870E-E GAMING WIFI'],
  ['Fans', '4 × NZXT F120 RGB Duo (3 intake, 1 exhaust)'],
  ['Wireless', 'Wi-Fi 7, Bluetooth 5.4'],
  ['Lighting', `Addressable RGB fans and cooler, ${CATALOG.lighting.length} presets, set in software`],
];
const IN_THE_BOX = ['The PC', 'Power cable', 'Accessory box with spare screws', 'Wi-Fi antenna', 'Printed burn-in report'];
const renderSpecs = config => {
  const groupRows = CATALOG.groups.map(g => {
    const o = option(CATALOG, g.id, config[g.id]);
    return [g.name, o.spec ? `${o.name} (${o.spec})` : o.name];
  });
  $('specs').innerHTML = `
    <h2>Full specifications</h2>
    <p class="note">Specs updated Oct 2026</p>
    <table class="spec-table"><tbody>
      ${[...groupRows, ...FIXED_SPECS].map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}
    </tbody></table>
    <h3>What's in the box</h3>
    <ul class="box-list">${IN_THE_BOX.map(i => `<li>${i}</li>`).join('')}</ul>`;
};
export const configurator = mountConfigurator({ root: $('configurator'), catalog: CATALOG, model, onChange: updatePrice });

// Cart drawer. Delegated so the sticky summary bar's re-rendered button works too.
const cart = mountCart({ catalog: CATALOG, brand: BRAND, drawer: $('cartDrawer'), body: $('cartBody'), scrim: $('scrim'), countEl: $('cartCount') });
document.addEventListener('click', e => { if (e.target.closest('[data-add]')) cart.add(configurator.config); });
$('cartBtn').addEventListener('click', () => cart.open());

// In-page links never touch the location hash, which holds the share code (#c=...). '#' does nothing; '#id' scrolls.
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  e.preventDefault();
  const id = a.getAttribute('href').slice(1);
  if (id) document.getElementById(id)?.scrollIntoView();
});

// The summary bar shows only once the price block has scrolled out above the viewport.
new IntersectionObserver(([e]) => { $('summaryBar').hidden = e.isIntersecting || e.boundingClientRect.top >= 0; }).observe(document.querySelector('.price-block'));
