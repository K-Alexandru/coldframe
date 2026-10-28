// Decides whether the local-only demo checkout may load. Pure on purpose: main.js passes in location.hostname and the brand domain.
// The public copy is served from another host and is built without checkout.js, so it never takes this path.
const LOCAL_HOSTS = ['127.0.0.1', 'localhost', '[::1]'];

export function demoCheckoutAllowed(hostname, brandDomain) {
  if (typeof hostname !== 'string' || !hostname) return false;
  const host = hostname.toLowerCase();
  if (LOCAL_HOSTS.includes(host)) return true;
  return typeof brandDomain === 'string' && brandDomain !== '' && host === brandDomain.toLowerCase();
}
