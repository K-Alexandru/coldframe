import { totals, monthly as monthlyOf, money, option, delta, encodeConfig, decodeConfig, shipDate, shipLabel } from './pricing.js';

export function mountCart({ catalog, brand, drawer, body, scrim, countEl }) {
  const key = `${brand.storageKey}.cart`;
  let items = [], view = 'cart', agreed = false, closeTimer = 0, returnFocus = null;
  try {
    const raw = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(raw)) items = raw.filter(it => it && typeof it.code === 'string').map(it => ({ code: it.code, qty: Math.min(3, Math.max(1, Math.round(+it.qty) || 1)) }));
  } catch { items = []; }
  const save = () => { try { localStorage.setItem(key, JSON.stringify(items)); } catch {} };
  const lineTotal = it => totals(catalog, decodeConfig(catalog, it.code)).subtotal * it.qty;
  const sum = () => items.reduce((s, it) => s + lineTotal(it), 0);
  // The 3-year upsell price comes from the catalog: the w3 option minus the included w2 option.
  const upsellPrice = delta(catalog, { warranty: 'w2' }, 'warranty', 'w3');

  const parts = cfg => catalog.groups.map(g => `<li><span>${g.name}</span>${option(catalog, g.id, cfg[g.id]).name}</li>`).join('');
  const draw = () => {
    const n = items.reduce((s, it) => s + it.qty, 0);
    countEl.hidden = n === 0; countEl.textContent = n;
    const total = sum(), monthly = monthlyOf(catalog, total);
    const head = `<header class="d-head"><h2 id="cartTitle" tabindex="-1">${view === 'review' ? 'Order review' : 'Your cart'}</h2><button class="x" data-close aria-label="Close cart">×</button></header>`;
    if (!items.length) { body.innerHTML = head + `<p class="empty">Your cart is empty.</p>`; return; }
    const lines = items.map((it, i) => { const cfg = decodeConfig(catalog, it.code); return `
      <article class="line">
        <div class="l-top"><b>${catalog.name}</b><span>${money(lineTotal(it))}</span></div>
        <p class="muted">${option(catalog, 'finish', cfg.finish).name} · ${option(catalog, 'gpu', cfg.gpu).name.replace('NVIDIA GeForce ', '')}</p>
        <details><summary>Full configuration</summary><ul class="parts">${parts(cfg)}</ul></details>
        ${view === 'cart' ? `<div class="l-actions"><label>Qty <select data-qty="${i}">${[1, 2, 3].map(q => `<option${q === it.qty ? ' selected' : ''}>${q}</option>`).join('')}</select></label><button class="link" data-remove="${i}">Remove</button></div>` : `<p class="muted">Qty ${it.qty}</p>`}
      </article>`; }).join('');
    const upsell = view === 'cart' && items.some(it => decodeConfig(catalog, it.code).warranty === 'w2')
      ? `<button class="upsell" data-upsell>Add a 3-year warranty <b>+${money(upsellPrice)}</b></button>` : '';
    const sums = `<dl class="sums"><dt>Subtotal</dt><dd>${money(total)}</dd><dt>Shipping</dt><dd>Free</dd><dt>Tax</dt><dd>Calculated at checkout</dd><dt class="t">Total</dt><dd class="t">${money(total)}</dd></dl>
      <p class="muted">or ${money(monthly)}/mo for ${catalog.financeMonths} months at 0% APR</p>`;
    const foot = view === 'cart'
      ? `<label class="agree"><input type="checkbox" data-agree ${agreed ? 'checked' : ''}> I agree to the sale, warranty and return policies</label><button class="primary wide" data-checkout ${agreed ? '' : 'disabled'}>Checkout</button>`
      : `<p>Estimated delivery: <b>${shipLabel(shipDate(new Date(), catalog.buildDays + 3))}</b></p><button class="link" data-back>Back to cart</button>`;
    body.innerHTML = head + lines + upsell + sums + foot;
  };

  // A re-render replaces the focused control, so focus that began inside the drawer moves to the heading.
  const render = () => {
    const had = drawer.contains(document.activeElement);
    draw();
    if (had) body.querySelector('#cartTitle')?.focus();
  };

  // While the drawer is open, the rest of the page is inert so keyboard focus and screen readers stay in the dialog.
  const setInert = on => document.querySelectorAll('body > :not(#cartDrawer):not(#scrim):not(script)').forEach(el => { el.inert = on; });
  const isOpen = () => !drawer.hidden && drawer.classList.contains('open');
  const open = () => {
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = 0; view = 'cart'; render(); } // reopened mid-close: undo the pending hide
    if (!isOpen()) returnFocus = document.activeElement;
    drawer.hidden = false; scrim.hidden = false; setInert(true);
    void drawer.offsetWidth; // reflow so the slide-in transition runs
    drawer.classList.add('open');
    drawer.querySelector('[data-close]')?.focus();
  };
  const close = () => {
    drawer.classList.remove('open'); scrim.hidden = true; setInert(false);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => { closeTimer = 0; drawer.hidden = true; view = 'cart'; render(); }, 250);
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  };
  body.addEventListener('click', e => {
    const t = e.target;
    const rm = t.closest('[data-remove]');
    if (t.closest('[data-close]')) close();
    else if (rm) { items.splice(+rm.dataset.remove, 1); save(); render(); }
    else if (t.closest('[data-upsell]')) { items = items.map(it => { const c = decodeConfig(catalog, it.code); return c.warranty === 'w2' ? { ...it, code: encodeConfig(catalog, { ...c, warranty: 'w3' }) } : it; }); save(); render(); }
    else if (t.closest('[data-checkout]')) { view = 'review'; render(); }
    else if (t.closest('[data-back]')) { view = 'cart'; render(); }
  });
  body.addEventListener('change', e => {
    const t = e.target;
    // The qty select takes focus back after its re-render so keyboard users can keep adjusting it.
    if (t.dataset.qty !== undefined) { items[+t.dataset.qty].qty = +t.value; save(); render(); body.querySelector(`[data-qty="${t.dataset.qty}"]`)?.focus(); }
    // Update in place: re-rendering here would detach the checkbox being clicked.
    if (t.dataset.agree !== undefined) { agreed = t.checked; body.querySelector('[data-checkout]').disabled = !agreed; }
  });
  scrim.addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) close(); });
  render();
  return {
    add(config) { const code = encodeConfig(catalog, config), hit = items.find(it => it.code === code); if (hit) hit.qty = Math.min(3, hit.qty + 1); else items.push({ code, qty: 1 }); save(); view = 'cart'; render(); open(); },
    open, close,
  };
}
