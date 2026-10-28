import { defaultConfig, deltaLabel, option, encodeConfig, decodeConfig } from './pricing.js';

// Markup uses the class names from store.css (.group-head, .opt-name, .opt-spec, .opt-badge, .opt-delta, .help).
export function mountConfigurator({ root, catalog, model, onChange }) {
  const fromHash = new URLSearchParams(location.hash.slice(1)).get('c');
  let config = fromHash ? decodeConfig(catalog, fromHash) : defaultConfig(catalog);

  const render = () => {
    root.innerHTML = catalog.groups.map(g => `
      <div class="group" role="group" aria-labelledby="g-${g.id}" data-group="${g.id}">
        <div class="group-head"><h3 id="g-${g.id}">${g.name}</h3><span class="current">${option(catalog, g.id, config[g.id]).name}</span></div>
        <div class="opts" role="radiogroup" aria-label="${g.name}">
          ${g.options.map(o => `
            <button type="button" class="opt" role="radio" aria-checked="${config[g.id] === o.id}" data-group="${g.id}" data-option="${o.id}">
              ${o.badge ? `<span class="opt-badge">${o.badge}</span>` : ''}
              <span class="opt-name">${o.name}</span><span class="opt-spec">${o.spec}</span>
              <span class="opt-delta${config[g.id] === o.id ? ' sel' : ''}">${deltaLabel(catalog, config, g.id, o.id)}</span>
            </button>`).join('')}
        </div>
        <p class="help">${g.help}</p>
      </div>`).join('');
  };

  const pushModel = () => {
    for (const g of catalog.groups) { const m = option(catalog, g.id, config[g.id]).model; if (m) model.send(m); }
  };

  const set = (gid, oid) => {
    if (config[gid] === oid || !option(catalog, gid, oid)) return;
    config = { ...config, [gid]: oid };
    history.replaceState(null, '', '#c=' + encodeConfig(catalog, config));
    const hadFocus = root.contains(document.activeElement);
    render();
    // render replaced the focused button: restore focus only if it was inside the configurator, without scrolling
    if (hadFocus) root.querySelector(`.opt[data-group="${gid}"][data-option="${oid}"]`)?.focus({ preventScroll: true });
    const m = option(catalog, gid, oid).model; if (m) model.send(m);
    onChange(config);
  };

  root.addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) set(b.dataset.group, b.dataset.option); });
  render(); pushModel(); onChange(config);
  return { get config() { return config; }, set };
}
