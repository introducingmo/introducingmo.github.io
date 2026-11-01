/* Introducing Mo: keeps Mo's turntable frames and the site's images on the device, so a second visit opens instantly.
   Pages themselves always come from the network, so edits show up straight away. */
const CACHE = "mo-assets-v2";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("mo-assets-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const frames = /\/f\/.+\.webp$/.test(url.pathname);                      // versioned with ?v=, so they never change in place
  const images = /\/img\/.+\.(webp|png|jpg|jpeg|svg)$/.test(url.pathname);
  const fonts = /\/fonts\/.+\.woff2$/.test(url.pathname);
  if (!frames && !images && !fonts) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req);
    if (hit && (frames || fonts)) return hit;                               // frames and fonts: cache first
    const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;                                                      // images: show the cached copy, refresh it in the background
  }));
});
