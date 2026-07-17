const CACHE = 'lua-beauty-v5';
const PRECACHE_URLS = ['/', '/manifest.json', '/favicon.svg', '/icons.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/') || e.request.url.includes('/admin/') || e.request.url.includes('picsum')) {
    e.respondWith(fetch(e.request));
    return;
  }

  const url = new URL(e.request.url);
  // Estrategia "Network First" para el HTML principal (evita pantallas en blanco en nuevas versiones)
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          if (r.ok) {
            const clone = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Estrategia "Cache First" para archivos estáticos (JS, CSS, imágenes)
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(r => {
      if (r.ok && r.type === 'basic') {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return r;
    }))
  );
});
