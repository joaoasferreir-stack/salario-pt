// Service Worker — Calculadora Salário PT 2026
// Estratégia: Cache-First com fallback. Funciona 100% offline.

const CACHE = 'salario-pt-v1';

// Todos os ficheiros a guardar em cache no install
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap'
];

// Install: pré-carrega tudo em cache
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache local assets first (always works)
      return cache.addAll(['./index.html', './manifest.json', './icon-192.svg', './icon-512.svg'])
        .then(() => {
          // Try to cache Google Fonts (may fail offline, that's ok)
          return cache.add('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap')
            .catch(() => console.log('Font cache skipped (offline ok)'));
        });
    }).then(() => self.skipWaiting())
  );
});

// Activate: limpa caches antigas
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: Cache-First
self.addEventListener('fetch', evt => {
  // Skip non-GET and chrome-extension requests
  if (evt.request.method !== 'GET') return;
  if (evt.request.url.startsWith('chrome-extension')) return;

  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      // Not in cache — try network, then cache it
      return fetch(evt.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(evt.request, clone));
        return response;
      }).catch(() => {
        // Offline and not cached — return index.html as fallback
        return caches.match('./index.html');
      });
    })
  );
});
