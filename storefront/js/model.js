// postMessage bridge to the embedded Rime model (glass-tower/index.html?embed=1).
export function connectModel(iframe) {
  const queue = [], listeners = [], interactListeners = [];
  const api = { state: null, ready: false,
    send(msg) { if (api.ready) iframe.contentWindow.postMessage({ target: 'glass-tower', ...msg }, '*'); else queue.push(msg); },
    onState(fn) { listeners.push(fn); if (api.state) fn(api.state); },
    onInteract(fn) { interactListeners.push(fn); } };
  addEventListener('message', e => {
    if (e.source !== iframe.contentWindow || !e.data || e.data.source !== 'glass-tower') return;
    const { phase, finish, mode, parts } = e.data;
    api.state = { phase, finish, mode, parts };
    // Any message from the embed proves its listener is up, so it counts as ready even if the one 'ready' post was missed.
    if (!api.ready) { api.ready = true; queue.splice(0).forEach(m => api.send(m)); }
    listeners.forEach(fn => fn(api.state));
    if (e.data.type === 'interact') interactListeners.forEach(fn => fn());
  });
  // If the embed started before this listener existed, a harmless targeted ping makes it reply with its state.
  // Ping now (the iframe may already have loaded) and again on load (it may not have).
  const ping = () => iframe.contentWindow?.postMessage({ target: 'glass-tower' }, '*');
  ping(); iframe.addEventListener('load', ping);
  return api;
}
