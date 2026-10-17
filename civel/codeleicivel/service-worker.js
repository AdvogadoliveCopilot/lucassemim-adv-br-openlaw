/* =========================================================== */
/* === ARQUIVO: service-worker.js (Quantum Cache) === */
/* =========================================================== */

const CACHE_NAME = 'civel-app-v5-elite';
const ASSETS = [
  '/',
  '/index.html',
  '/mapa.css',
  '/codeleicivel/civel-core.js',
  '/codeleicivel/structure.js',
  '/codeleicivel/platinum-ui.js',
  '/civel/img/favicon.ico'
];

// 1. INSTALAÇÃO (Armazena o essencial)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. ATIVAÇÃO (Limpa caches antigos)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim();
});

// 3. INTERCEPTAÇÃO (Offline First: Tenta cache, se falhar, tenta rede)
self.addEventListener('fetch', (e) => {
  // Não cacheia chamadas de API (HubSpot, etc)
  if (e.request.url.includes('api') || e.request.method !== 'GET') {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request).then((networkResponse) => {
          return networkResponse;
      });
    })
  );
});