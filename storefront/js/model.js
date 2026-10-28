// postMessage bridge to the embedded Glass Tower model (glass-tower/index.html?embed=1).
export function connectModel(iframe) {
  const queue = [], listeners = [];
  const api = { state: null, ready: false,
    send(msg) { if (api.ready) iframe.contentWindow.postMessage({ target: 'glass-tower', ...msg }, '*'); else queue.push(msg); },
    onState(fn) { listeners.push(fn); if (api.state) fn(api.state); } };
  addEventListener('message', e => {
    if (e.source !== iframe.contentWindow || !e.data || e.data.source !== 'glass-tower') return;
    const { phase, finish, mode } = e.data;
    api.state = { phase, finish, mode };
    // Any message from the embed proves its listener is up, so it counts as ready even if the one 'ready' post was missed.
    if (!api.ready) { api.ready = true; queue.splice(0).forEach(m => api.send(m)); }
    listeners.forEach(fn => fn(api.state));
  });
  // If the embed started before this listener existed, a harmless targeted ping makes it reply with its state.
  // Ping now (the iframe may already have loaded) and again on load (it may not have).
  const ping = () => iframe.contentWindow?.postMessage({ target: 'glass-tower' }, '*');
  ping(); iframe.addEventListener('load', ping);
  return api;
}
