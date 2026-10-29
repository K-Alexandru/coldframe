import { defaultConfig, deltaLabel, option, encodeConfig, decodeConfig, onOffer, partsOf, money } from './pricing.js?v=9cbc9739d0';

// Markup uses the class names from store.css (.row-head, .row-panel, .opt-name, .opt-spec, .opt-badge, .opt-delta, .help).
// Every group is a collapsed row: label, current pick, price delta and a chevron. One row is open at a time.
// Finish has two choices, so its swatches sit inline in the row and it never needs opening.
// `initial` is the configuration to start from when the URL carries no share code (for example a series deep link).
const INLINE = { finish: { black: '#1b1e23', snow: '#f1f3f6' } };   // groups shown inline, with a colour dot per option
const SHORT = n => n.replace('AMD ', '').replace('NVIDIA GeForce ', '').replace('NZXT ', '');
const CHEVRON = '<svg class="row-chev" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

export function mountConfigurator({ root, catalog, model, onChange, initial }) {
  const fromHash = new URLSearchParams(location.hash.slice(1)).get('c');
  let config = fromHash ? decodeConfig(catalog, fromHash) : (initial ?? defaultConfig(catalog));
  const rows = catalog.groups.filter(g => !INLINE[g.id]);
  let openId = null;   // the group whose row is open, or null

  // An option on launch offer shows its old price struck through, then Free (or its price).
  const deltaHtml = (gid, o) => onOffer(o)
    ? `<s><span class="sr">Was </span>${money(o.compareAt)}</s> ${o.price === 0 ? 'Free' : money(o.price)}${config[gid] === o.id ? ' · Selected' : ''}`
    : deltaLabel(catalog, config, gid, o.id);

  // The price the current pick adds to the build, as the row's summary shows it.
  const rowDelta = (gid) => {
    const o = option(catalog, gid, config[gid]);
    if (onOffer(o)) return o.price === 0 ? 'Free' : money(o.price);
    if (o.price === 0) return o.id === 'none' ? '' : 'Included';
    return (o.price > 0 ? '+' : '') + money(o.price);
  };
  const summary = gid => `<span class="row-label">${catalog.groups.find(g => g.id === gid).name}</span>
    <span class="row-pick">${SHORT(option(catalog, gid, config[gid]).name)}</span><span class="row-delta">${rowDelta(gid)}</span>`;

  const optHtml = (g, o) => `
    <button type="button" class="opt${INLINE[g.id] ? ' fin' : ''}" role="radio" aria-checked="${config[g.id] === o.id}" data-group="${g.id}" data-option="${o.id}">
      ${INLINE[g.id] ? `<span class="dot" aria-hidden="true" style="--c:${INLINE[g.id][o.id]}"></span>` : ''}
      <span class="opt-txt">
        ${o.badge ? `<span class="opt-badge">${o.badge}</span>` : ''}
        <span class="opt-name">${o.name}</span><span class="opt-spec">${o.spec}</span>
        <span class="opt-delta${config[g.id] === o.id ? ' sel' : ''}">${deltaHtml(g.id, o)}</span>
      </span>
    </button>`;

  const render = () => {
    root.innerHTML = catalog.groups.map(g => INLINE[g.id] ? `
      <div class="group inline" role="group" aria-labelledby="g-${g.id}" data-group="${g.id}">
        <h3 class="row-h"><span class="row-head static" id="g-${g.id}">${summary(g.id)}</span></h3>
        <div class="opts" role="radiogroup" aria-label="${g.name}">${g.options.map(o => optHtml(g, o)).join('')}</div>
        <p class="help">${g.help}</p>
      </div>` : `
      <div class="group" data-group="${g.id}">
        <h3 class="row-h"><button type="button" class="row-head" id="g-${g.id}" aria-expanded="${openId === g.id}" aria-controls="p-${g.id}">${summary(g.id)}${CHEVRON}</button></h3>
        <div class="row-panel" id="p-${g.id}" role="group" aria-labelledby="g-${g.id}"${openId === g.id ? '' : ' hidden'}>
          <div class="opts" role="radiogroup" aria-label="${g.name}">${g.options.map(o => optHtml(g, o)).join('')}</div>
          <p class="help">${g.help}</p>
        </div>
      </div>`).join('');
  };

  // Open one row and close the rest (null closes all). Touches only the attributes, so focus and scroll stay put.
  const setOpen = gid => {
    openId = gid;
    root.querySelectorAll('.row-head[aria-controls]').forEach(h => {
      const on = h.id === 'g-' + gid;
      h.setAttribute('aria-expanded', String(on));
      document.getElementById(h.getAttribute('aria-controls')).hidden = !on;
    });
  };
  // Open a row from outside (the buy box's Customize button): the first row when no group is named.
  const open = gid => {
    const id = rows.some(g => g.id === gid) ? gid : rows[0].id;
    setOpen(id);
    root.querySelector('#g-' + id)?.focus({ preventScroll: true });
  };

  // The 3D view takes the finish through each option's `model` message and swapped parts (GPU, cooler) through one `parts` message.
  let sentParts = '';
  const sendParts = () => {
    const parts = partsOf(catalog, config), key = JSON.stringify(parts);
    if (key === sentParts) return;
    sentParts = key;
    if (Object.keys(parts).length) model.send({ parts });
  };
  const pushModel = () => {
    for (const g of catalog.groups) { const m = option(catalog, g.id, config[g.id]).model; if (m) model.send(m); }
    sendParts();
  };

  // Every change goes through here, whether it is one option clicked or a whole series picked.
  const apply = changes => {
    const next = Object.entries(changes).filter(([gid, oid]) => option(catalog, gid, oid) && config[gid] !== oid);
    if (!next.length) return;
    config = { ...config, ...Object.fromEntries(next) };
    history.replaceState(null, '', '#c=' + encodeConfig(catalog, config));
    const focused = root.contains(document.activeElement) ? document.activeElement : null;
    const refocus = focused?.matches?.('.opt') ? `.opt[data-group="${focused.dataset.group}"][data-option="${focused.dataset.option}"]` : '';
    render();   // rebuilds every row, so each summary shows the new pick at once; openId keeps the open row open
    // render replaced the focused button: restore focus only if it was inside the configurator, without scrolling
    if (refocus) root.querySelector(refocus)?.focus({ preventScroll: true });
    for (const [gid, oid] of next) { const m = option(catalog, gid, oid).model; if (m) model.send(m); }
    sendParts();
    onChange(config);
  };
  const set = (gid, oid) => apply({ [gid]: oid });

  root.addEventListener('click', e => {
    const head = e.target.closest('.row-head[aria-controls]');
    if (head) { setOpen(openId === head.id.slice(2) ? null : head.id.slice(2)); return; }
    const b = e.target.closest('.opt');
    if (b) set(b.dataset.group, b.dataset.option);
  });
  render(); pushModel(); onChange(config);
  return { get config() { return config; }, get openRow() { return openId; }, set, apply, open };
}
