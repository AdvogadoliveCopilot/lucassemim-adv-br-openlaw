/* =========================================================== */
/* === ARQUIVO: civel/sw.js (Service Worker Platinum) === */
/* === FUNÇÃO: Cache de Alta Performance para o Núcleo Cível === */
/* =========================================================== */

const CACHE_NAME = 'civel-platinum-v2';

// Arquivos vitais para o App Cível funcionar offline
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './blindagem-patrimonial.html',
    './bancario-juros.html',
    './familia-sucessoes.html',
    './execucao-cobranca.html',
    './seguros-indenizacao.html',
    './contratos-negocios.html',
    '../mapa.css', // CSS Global (está na raiz principal)
    'codeleicivel/platinum-ui.js',
    'codeleicivel/civel-financas.js',
    'codeleicivel/civel-diagnostico.js',
    'codeleicivel/structure.js',
    'codeleicivel/civel-interacao.js'
];

// 1. Instalação (Salva os arquivos)
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('💎 [Platinum App] Instalando Cache...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Ativação (Limpa caches antigos)
self.addEventListener('activate', (event) => {
    event.waitUntil(
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

// 3. Interceptação (Estratégia: Cache First com Network Fallback)
// Isso faz o site abrir instantaneamente como um app
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});