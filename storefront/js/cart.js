import { monthly as monthlyOf, money, option, delta, onOffer, partLabel, encodeConfig, decodeConfig, shipDate, shipLabel,
  accessory, isAccessoryLine, normalizeItems, lineTotal as lineTotalOf, cartTotals, maxQty, ACC_MAX_QTY } from './pricing.js?v=a9088dcd53';

// `onChange(items)` runs after every draw so the page's accessory buttons can follow the cart.
export function mountCart({ catalog, brand, drawer, body, scrim, countEl, onChange = () => {} }) {
  const key = `${brand.storageKey}.cart`;
  let items = [], view = 'cart', agreed = false, closeTimer = 0, returnFocus = null, checkout = null;
  // Views after the review belong to the optional local checkout module; without it the flow ends at the review.
  const TITLES = { cart: 'Your cart', review: 'Order review', ship: 'Shipping and payment', processing: 'Placing your order', confirmed: 'Order confirmed' };
  const isCheckoutView = v => v === 'ship' || v === 'processing' || v === 'confirmed';
  try {
    items = normalizeItems(catalog, JSON.parse(localStorage.getItem(key)));   // a cart saved before accessories existed (PC lines only) loads as is
  } catch { items = []; }
  const save = () => { try { localStorage.setItem(key, JSON.stringify(items)); } catch {} };
  const lineTotal = it => lineTotalOf(catalog, it);
  const sum = () => cartTotals(catalog, items).total;
  // The 3-year upsell price comes from the catalog: the w3 option minus the included w2 option. On launch offer it reads ~~was~~ Free.
  const w3 = option(catalog, 'warranty', 'w3');
  const upsellPrice = delta(catalog, { warranty: 'w2' }, 'warranty', 'w3');
  const upsellPriceHtml = onOffer(w3) && upsellPrice === 0 ? `<s><span class="sr">Was </span>${money(w3.compareAt)}</s> Free` : `+${money(upsellPrice)}`;

  const parts = cfg => catalog.groups.map(g => `<li><span>${g.name}</span>${partLabel(catalog, g.id, cfg[g.id])}</li>`).join('');
  const draw = () => {
    const n = cartTotals(catalog, items).count;
    onChange(items);
    countEl.hidden = n === 0; countEl.textContent = n;
    countEl.closest('button')?.setAttribute('aria-label', n ? `Cart, ${n} ${n === 1 ? 'item' : 'items'}` : 'Cart');
    const total = sum(), monthly = monthlyOf(catalog, total);
    const head = `<header class="d-head"><h2 id="cartTitle" tabindex="-1">${TITLES[view]}</h2><button class="x" data-close aria-label="Close cart"${view === 'processing' ? ' disabled' : ''}>×</button></header>`;
    drawer.classList.toggle('wide', !!checkout && isCheckoutView(view));
    if (checkout && isCheckoutView(view)) { body.innerHTML = head + checkout.html(view); return; }
    if (!items.length) { body.innerHTML = head + `<p class="empty">Your cart is empty.</p>`; return; }
    const actions = (it, i, name) => view === 'cart' ? `<div class="l-actions"><label>Qty <select data-qty="${i}" aria-label="Quantity, ${name}">${Array.from({ length: maxQty(it) }, (_, q) => q + 1).map(q => `<option${q === it.qty ? ' selected' : ''}>${q}</option>`).join('')}</select></label><button class="link" data-remove="${i}" aria-label="Remove ${name}">Remove</button></div>` : `<p class="muted">Qty ${it.qty}</p>`;
    // The PC lines come first, then the accessories; each keeps its place in `items` for the qty and remove controls.
    const order = items.map((it, i) => i).sort((x, y) => isAccessoryLine(items[x]) - isAccessoryLine(items[y]));
    const lines = order.map(i => { const it = items[i]; if (isAccessoryLine(it)) { const a = accessory(catalog, it.acc); return `
      <article class="line acc-line" data-acc-line="${a.id}">
        <div class="l-acc"><img src="${a.img}" width="64" height="48" alt="" loading="lazy"><div><div class="l-top"><b>${a.name}</b><span>${money(lineTotal(it))}</span></div><p class="muted">${a.spec}${it.qty > 1 ? ` · ${money(a.price)} each` : ''}</p></div></div>
        ${actions(it, i, a.name)}
      </article>`; }
      const cfg = decodeConfig(catalog, it.code); return `
      <article class="line">
        <div class="l-top"><b>${catalog.name}</b><span>${money(lineTotal(it))}</span></div>
        <p class="muted">${option(catalog, 'finish', cfg.finish).name} · ${option(catalog, 'gpu', cfg.gpu).name.replace('NVIDIA GeForce ', '')}</p>
        <details><summary>Full configuration</summary><ul class="parts">${parts(cfg)}</ul></details>
        ${actions(it, i, catalog.name)}
      </article>`; }).join('');
    // "Add to your setup": the accessories not in the cart yet, one tap each.
    const rest = (catalog.accessories ?? []).filter(a => !items.some(it => it.acc === a.id));
    const setup = view === 'cart' && rest.length ? `<section class="d-setup" aria-labelledby="setupTitle"><h3 id="setupTitle">Add to your setup</h3><ul>${rest.map(a => `
      <li><img src="${a.img}" width="64" height="48" alt="" loading="lazy"><span class="s-name">${a.name}</span><span class="s-price">${money(a.price)}</span><button type="button" class="mini" data-acc-add="${a.id}" aria-label="Add ${a.name}, ${money(a.price)}">Add</button></li>`).join('')}</ul></section>` : '';
    const upsell = view === 'cart' && items.some(it => !isAccessoryLine(it) && decodeConfig(catalog, it.code).warranty === 'w2')
      ? `<button class="upsell" data-upsell>Add a 3-year warranty <b>${upsellPriceHtml}</b></button>` : '';
    const sums = `<dl class="sums"><dt>Subtotal</dt><dd>${money(total)}</dd><dt>Shipping</dt><dd>Free</dd><dt>Tax</dt><dd>Included</dd><dt class="t">Total</dt><dd class="t">${money(total)} CAD</dd></dl>
      <p class="muted">or ${money(monthly)}/mo for ${catalog.financeMonths} months at 0% APR</p>`;
    const foot = view === 'cart'
      ? `<label class="agree"><input type="checkbox" data-agree ${agreed ? 'checked' : ''}> I agree to the sale, warranty and return policies</label><button class="primary wide" data-checkout ${agreed ? '' : 'disabled'}>Checkout</button>`
      : `<p>Estimated delivery: <b>${shipLabel(shipDate(new Date(), catalog.buildDays + 3))}</b></p>${checkout ? '<button class="primary wide" data-continue>Continue to shipping</button>' : ''}<button class="link" data-back>Back to cart</button>`;
    body.innerHTML = head + lines + upsell + setup + sums + foot;
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
    if (view === 'processing') return; // the order is mid-flight; the confirmation follows in a moment
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
    else if (t.closest('[data-acc-add]')) { addAccessory(t.closest('[data-acc-add]').dataset.accAdd); body.querySelector(`[data-acc-line="${t.closest('[data-acc-add]').dataset.accAdd}"] [data-qty]`)?.focus(); }
    else if (t.closest('[data-upsell]')) { items = items.map(it => { if (isAccessoryLine(it)) return it; const c = decodeConfig(catalog, it.code); return c.warranty === 'w2' ? { ...it, code: encodeConfig(catalog, { ...c, warranty: 'w3' }) } : it; }); save(); render(); }
    else if (t.closest('[data-checkout]')) { view = 'review'; render(); }
    else if (t.closest('[data-back]')) { view = 'cart'; render(); }
    else if (t.closest('[data-continue]')) { view = 'ship'; render(); }
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
  // Accessories are their own lines, merged by id; the cart drawer is left as it is (the page's button announces the change).
  const addAccessory = id => {
    if (!accessory(catalog, id)) return;
    const hit = items.find(it => it.acc === id);
    if (hit) hit.qty = Math.min(ACC_MAX_QTY, hit.qty + 1); else items.push({ acc: id, qty: 1 });
    save(); render();
  };
  const removeAccessory = id => { const i = items.findIndex(it => it.acc === id); if (i >= 0) { items.splice(i, 1); save(); render(); } };
  render();
  return {
    addAccessory, removeAccessory, hasAccessory: id => items.some(it => it.acc === id),
    add(config) { const code = encodeConfig(catalog, config), hit = items.find(it => it.code === code); if (hit) hit.qty = Math.min(3, hit.qty + 1); else items.push({ code, qty: 1 }); save(); view = 'cart'; render(); open(); },
    open, close,
    // Hands the checkout module what it needs from the cart; `make` returns { html(view) } for the checkout views.
    attachCheckout(make) {
      checkout = make({
        items: () => items.map(it => ({ ...it })),
        total: sum,
        clear() { items = []; agreed = false; save(); },
        go(v) { view = v; render(); },
        show(v) { open(); view = v; render(); },
      });
      if (view === 'review') render();
    },
  };
}
