/* eslint-disable no-restricted-globals */
/**
 * Service Worker do Studio Bru Oliveira
 *
 * Estratégia de Cache:
 * - App Shell / Assets estáticos: Stale-While-Revalidate com Network-First para a navegação HTML.
 * - Cache versionado com skipWaiting + clients.claim() para que qualquer atualização de versão
 *   seja ativada e assuma as abas/janelas imediatamente ao recarregar ou reabrir.
 * - API / PocketBase (/api/* e /realtime): NUNCA em cache (rede primária e exclusiva),
 *   garantindo que dados de alunos, treinos e avaliações nunca venham desatualizados.
 */

const CACHE_NAME = 'studio-bru-shell-v2'

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/site.webmanifest',
  '/icon.svg',
  '/icon-maskable.svg',
  '/icon-192.svg',
  '/icon-maskable-192.svg',
  '/apple-touch-icon.svg',
  '/favicon.ico',
]

// Instalação: baixa os assets essenciais do shell e ativa imediatamente
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => {
        // Assume controle sem aguardar o fechamento do navegador
        return self.skipWaiting()
      })
      .catch((err) => {
        console.warn('[SW] Falha no precache inicial:', err)
      }),
  )
})

// Ativação: limpa versões de cache antigas e assume controle dos clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name)
            }
            return null
          }),
        )
      })
      .then(() => {
        // Assume controle imediato de todas as abas e janelas abertas
        return self.clients.claim()
      }),
  )
})

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // 1. Apenas processa requisições GET
  if (request.method !== 'GET') {
    return
  }

  // 2. REGRA CRÍTICA: NÃO cachear chamadas de API ou realtime do PocketBase / backend externo
  // Nunca intercepta nem armazena em cache para jamais servir dados de alunos ou fichas desatualizados
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/api/') ||
    url.pathname.includes('/realtime') ||
    (url.hostname.includes('skip') && url.pathname.includes('/api'))
  ) {
    return
  }

  // 3. Navegação HTML (quando o usuário acessa ou recarrega a página)
  // Estratégia Network-First: busca na rede a versão mais recente do app;
  // se falhar (offline), entrega a casca do app (/index.html) em cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request)
          if (cachedResponse) {
            return cachedResponse
          }
          const indexFallback = await caches.match('/index.html')
          if (indexFallback) {
            return indexFallback
          }
          return caches.match('/')
        }),
    )
    return
  }

  // 4. Assets estáticos do mesmo domínio (/assets/*, .js, .css, .svg, .png, etc.)
  // Estratégia Stale-While-Revalidate: entrega imediata do cache com atualização em background
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const responseToCache = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache)
              })
            }
            return networkResponse
          })
          .catch(() => {
            return cachedResponse
          })

        return cachedResponse || fetchPromise
      }),
    )
    return
  }

  // 5. Fontes do Google e scripts essenciais (Stale-While-Revalidate)
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('goskip.dev')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const responseToCache = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache)
              })
            }
            return networkResponse
          })
          .catch(() => cachedResponse)

        return cachedResponse || fetchPromise
      }),
    )
  }
})

// Mensagem para disparar skipWaiting sob demanda
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
