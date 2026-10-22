// VM Univers — service worker v2
const V = 'vmu-v2';
const STATIC = V + '-static';
const IMG = V + '-img';
const MAX_IMG = 60;
const PRECACHE = [
  '/',
  '/manifest.webmanifest',
  '/app/univers-192.png',
  '/app/univers-512.png',
  '/app/logo-vm.webp'   // optionnel : ignoré s'il n'existe pas encore
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC)
      .then(c => Promise.all(PRECACHE.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !k.startsWith(V)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map(k => c.delete(k)));
}

function cacheable(r) {
  return r && (r.ok || r.type === 'opaque');
}

async function swr(req, name, max) {
  const c = await caches.open(name);
  const hit = await c.match(req);
  const net = fetch(req).then(r => {
    if (cacheable(r)) { c.put(req, r.clone()); if (max) trim(name, max); }
    return r;
  }).catch(() => null);
  return hit || (await net) || Response.error();
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Pages : réseau d'abord, repli sur la page en cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => {
        if (r.ok && url.origin === location.origin) {
          const copy = r.clone();
          caches.open(STATIC).then(c => c.put(req, copy));
        }
        return r;
      }).catch(async () => (await caches.match(req)) || (await caches.match('/')) || Response.error())
    );
    return;
  }

  // Images (y compris celles de velocemercato.fr) : cache avec renouvellement
  if (req.destination === 'image') {
    e.respondWith(swr(req, IMG, MAX_IMG));
    return;
  }

  // Autres ressources du même domaine
  if (url.origin === location.origin) {
    e.respondWith(swr(req, STATIC));
  }
  // Appels tiers (compteurs, QR) : jamais mis en cache
});
