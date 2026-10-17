/* ================================================================== */
/* === ARQUIVO: sw.js (Service Worker Elite V11 - Cache sem versao velha) === */
/* === Site: lucassemim.adv.br — Advocacia Criminal — Sabará/BH    === */
/* ================================================================== */

// 1. CONFIGURAÇÃO E ARQUITETURA DE CACHES
const CACHE_VERSION = 'v14'; // trocar o numero apaga TODOS os caches antigos dos visitantes
const CACHES = {
  shell:  `sw-shell-${CACHE_VERSION}`,
  pages:  `sw-pages-${CACHE_VERSION}`,
  images: `sw-images-${CACHE_VERSION}`,
  api:    `sw-api-${CACHE_VERSION}`
};
const ALL_CACHES = Object.values(CACHES);
const IS_DEBUG = false;

const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/llms.txt',
  '/Favicon-lucassemim.png',
  '/offline.html'
  // V11: removidos /css/main.css e /js/mobile-elite.js (404) e os JS sem versao.
  // JS/CSS agora sao buscados na rede com revalidacao (ver bloco F).
];

const CACHEABLE_EXTERNAL_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdnjs.cloudflare.com',
  'https://flagcdn.com'
];

// 2. UTILITÁRIOS E HELPERS
const log = (...args) => IS_DEBUG && console.log('[SW V10]', ...args);
const warn = (...args) => IS_DEBUG && console.warn('[SW V10]', ...args);

function isExternalCacheable(url) {
  return CACHEABLE_EXTERNAL_ORIGINS.some(origin => url.startsWith(origin));
}

async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const toDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(toDelete.map(key => cache.delete(key)));
      log(`Limpou ${toDelete.length} itens antigos de ${cacheName}`);
    }
  } catch (err) {
    warn('Erro ao limitar tamanho do cache:', err);
  }
}

async function cacheWithTTL(cache, request, response, ttlSeconds = 300) {
  try {
    const headers = new Headers(response.headers);
    headers.append('sw-cache-timestamp', Date.now().toString());
    headers.append('sw-cache-ttl', ttlSeconds.toString());
    
    const responseBody = await response.clone().blob();
    const clonedResponse = new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
    await cache.put(request, clonedResponse);
  } catch (err) {
    warn('Erro ao salvar cache com TTL:', err);
  }
}

function isCacheExpired(cachedResponse) {
  if (!cachedResponse) return true;
  const timestamp = parseInt(cachedResponse.headers.get('sw-cache-timestamp') || '0', 10);
  const ttl = parseInt(cachedResponse.headers.get('sw-cache-ttl') || '300', 10);
  if (!timestamp) return false;
  return (Date.now() - timestamp) > (ttl * 1000);
}

async function sendPendingForms() {
  try {
    const cache = await caches.open(CACHES.api);
    const pending = await cache.match('/pending-forms');
    if (pending) {
      const forms = await pending.json();
      log('Enviando formulários pendentes do Background Sync:', forms);
      await cache.delete('/pending-forms');
    }
  } catch (err) {
    warn('Erro ao sincronizar formulários pendentes:', err);
  }
}

// 3. INSTALL — Pré-cache do shell
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHES.shell).then(async cache => {
      log('Cache Shell V10 aberto. Iniciando pré-cache...');
      await Promise.all(
        SHELL_URLS.map(url => 
          cache.add(url).catch(err => {
            warn(`Falha não-bloqueante ao pré-cachear URL: ${url}`, err);
          })
        )
      );
      log('Pré-cache do Shell concluído com sucesso.');
    })
  );
});

// 4. ACTIVATE — Limpa caches antigos, assume controle e notifica clientes
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => {
          if (!ALL_CACHES.includes(key)) {
            log('Deletando cache antigo/órfão:', key);
            return caches.delete(key);
          }
        })
      );
      
      await self.clients.claim();
      log('Service Worker V10 ativo e no controle de todas as abas.');
      
      const windowClients = await self.clients.matchAll({ type: 'window' });
      windowClients.forEach(client => {
        client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
      });
    })()
  );
});

// 5. FETCH — Estratégias especializadas por tipo de recurso
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar protocolos não-HTTP e métodos que não sejam GET
  if (!['http:', 'https:'].includes(url.protocol)) return;
  if (request.method !== 'GET') return;

  const isSameOrigin = url.origin === self.location.origin;
  const isExternal = isExternalCacheable(request.url);

  // Se for externo e não estiver na lista de CDNs permitidos, passa direto para rede
  if (!isSameOrigin && !isExternal) return;

  const acceptHeader = request.headers.get('accept') || '';
  const pathname = url.pathname;

  // A) NAVEGAÇÃO / PÁGINAS HTML (Network First com Fallback em Cache)
  if (request.mode === 'navigate' || acceptHeader.includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
            const pagesCache = await caches.open(CACHES.pages);
            pagesCache.put(request, networkResponse.clone());
            limitCacheSize(CACHES.pages, 30);
          }
          return networkResponse;
        } catch (err) {
          log('Falha de rede em navegação. Buscando fallback no cache...');
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) return offlinePage;

          const indexPage = await caches.match('/index.html');
          if (indexPage) return indexPage;

          return new Response(
            '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Offline | Dr. Lucas Semim</title></head><body style="background:#050505;color:#fff;font-family:sans-serif;text-align:center;padding:50px 20px;"><h1>Sem Conexão</h1><p>Verifique sua internet ou ligue para o plantão 24h: (31) 98942-0094.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
      })()
    );
    return;
  }

  // B) FONTES (Cache First — Salva no Shell)
  if (
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.ttf')
  ) {
    event.respondWith(
      (async () => {
        const cachedFont = await caches.match(request);
        if (cachedFont) return cachedFont;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
            const shellCache = await caches.open(CACHES.shell);
            shellCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return new Response('', { status: 408, statusText: 'Font Fetch Timeout' });
        }
      })()
    );
    return;
  }

  // C) IMAGENS (Stale While Revalidate — Limite de 60 itens)
  if (
    request.destination === 'image' ||
    /\.(jpe?g|png|webp|svg|ico|gif)$/i.test(pathname) ||
    url.hostname.includes('flagcdn.com')
  ) {
    event.respondWith(
      (async () => {
        const imagesCache = await caches.open(CACHES.images);
        const cachedImage = await imagesCache.match(request);

        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
            imagesCache.put(request, networkResponse.clone());
            limitCacheSize(CACHES.images, 60);
          }
          return networkResponse;
        }).catch(err => {
          log('Falha ao revalidar imagem na rede:', request.url);
          return null;
        });

        return cachedImage || (await fetchPromise) || new Response('', { status: 404 });
      })()
    );
    return;
  }

  // D) API / JSON / DADOS DINÂMICOS (Network First com Timeout de 3s e TTL de 5 min)
  if (
    pathname.endsWith('.json') ||
    pathname.endsWith('.txt') ||
    acceptHeader.includes('application/json')
  ) {
    event.respondWith(
      (async () => {
        const apiCache = await caches.open(CACHES.api);

        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('API Timeout')), 3000)
          );

          const networkResponse = await Promise.race([
            fetch(request),
            timeoutPromise
          ]);

          if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
            await cacheWithTTL(apiCache, request, networkResponse.clone(), 300);
            return networkResponse;
          }
        } catch (err) {
          log('Falha ou timeout na rede para JSON. Verificando cache com TTL...');
        }

        const cachedApiResponse = await apiCache.match(request);
        if (cachedApiResponse && !isCacheExpired(cachedApiResponse)) {
          return cachedApiResponse;
        }

        if (cachedApiResponse) {
          return cachedApiResponse;
        }

        return new Response('{"error": "Offline and no valid cache"}', {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })()
    );
    return;
  }

  // E) CDNs EXTERNOS (cdnjs, etc. — Stale While Revalidate)
  if (isExternal) {
    event.respondWith(
      (async () => {
        const shellCache = await caches.open(CACHES.shell);
        const cachedResource = await shellCache.match(request);

        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
            shellCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResource || (await fetchPromise) || new Response('', { status: 404 });
      })()
    );
    return;
  }

  // F) JS / CSS DO PROPRIO SITE — REDE PRIMEIRO COM REVALIDACAO (V11)
  // O nginx da hospedagem manda JS/CSS com cache de 10 anos. Sem isto, o navegador
  // (e o cache-first antigo) serviriam arquivo velho para sempre.
  // cache:'no-cache' = pergunta ao servidor (304 se igual), ignorando o max-age de 10 anos.
  if (/\.(js|css)$/i.test(pathname)) {
    event.respondWith(
      (async () => {
        const shellCache = await caches.open(CACHES.shell);
        try {
          const networkResponse = await fetch(request, { cache: 'no-cache' });
          if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
            shellCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          const cachedAsset = await shellCache.match(request, { ignoreSearch: true });
          return cachedAsset || new Response('', { status: 404, statusText: 'Asset Not Found' });
        }
      })()
    );
    return;
  }

  // G) DEMAIS ASSETS ESTATICOS (Cache First com Network Fallback)
  event.respondWith(
    (async () => {
      const cachedAsset = await caches.match(request);
      if (cachedAsset) return cachedAsset;

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
          const shellCache = await caches.open(CACHES.shell);
          shellCache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        return new Response('', { status: 404, statusText: 'Asset Not Found' });
      }
    })()
  );
});

// 6. MESSAGE — Comunicação bidirecional (SKIP_WAITING do force-update.js)
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    log('Mensagem SKIP_WAITING recebida. Ativando novo Service Worker...');
    self.skipWaiting();
  }
});

// 7. PUSH NOTIFICATIONS
self.addEventListener('push', event => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body:    data.body    || 'Nova atualização do Dr. Lucas Semim Advocacia.',
      icon:    '/Favicon-lucassemim.png',
      badge:   '/Favicon-lucassemim.png',
      vibrate: [200, 100, 200],
      tag:     data.tag     || 'semim-notification',
      data:    { url: data.url || '/' },
      actions: [
        { action: 'open',    title: 'Ver agora' },
        { action: 'dismiss', title: 'Dispensar' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '⚖️ Dr. Lucas Semim — Plantão 24h', options)
    );
  } catch (err) {
    warn('Erro ao processar push notification:', err);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existingClient = clients.find(c => c.url === targetUrl && 'focus' in c);
      if (existingClient) {
        return existingClient.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 8. BACKGROUND SYNC (Formulários Offline do diagnostico.js)
self.addEventListener('sync', event => {
  if (event.tag === 'semim-form-sync') {
    log('Background Sync acionado para tag: semim-form-sync');
    event.waitUntil(sendPendingForms());
  }
});