/* eslint-disable no-restricted-globals */
/**
 * Service Worker do Studio Bru Oliveira
 *
 * Estratégia de Cache:
 * - App Shell / Assets estáticos: Stale-While-Revalidate com Network-First para a navegação HTML
 * - Sempre busca a versão mais recente na rede e faz skipWaiting para que novos deploys
 *   sejam carregados instantaneamente ao recarregar a página.
 * - API / PocketBase (/api/*): Network-only com fallback transparente (não interfere no banco online).
 * - Recursos externos (ex: YouTube, Google Fonts): Cache-First ou Network-First controlado.
 */

const CACHE_NAME = 'studio-bru-shell-v1'

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/site.webmanifest',
  '/icon.svg',
  '/icon-maskable.svg',
  '/icon-192.svg',
  '/icon-maskable-192.svg',
  '/favicon.ico',
]

// Instalação: baixa os assets essenciais do shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => {
        // Ativa o novo service worker sem esperar as abas fecharem
        return self.skipWaiting()
      })
      .catch((err) => {
        console.warn('[SW] Falha no precache inicial:', err)
      }),
  )
})

// Ativação: limpa caches antigos e assume o controle imediatamente
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
        // Assume controle de todas as abas e janelas abertas
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

  // 2. Não interceptar requisições para a API do PocketBase ou Skip Connector
  // Deixa ir direto para a rede para garantir dados sempre frescos
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/realtime') ||
    (url.hostname.includes('skip') && url.pathname.includes('/api'))
  ) {
    return
  }

  // 3. Navegação HTML (quando o usuário acessa ou recarrega a página)
  // Estratégia Network-First: busca na rede para pegar a versão atualizada do app;
  // se falhar (sem internet temporária), entrega a casca do app (/index.html em cache)
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
          // Fallback offline para a casca do app
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

  // 4. Assets estáticos do mesmo domínio (/assets/*, .js, .css, .svg, .png)
  // Estratégia Stale-While-Revalidate: entrega rápido do cache enquanto busca a versão atualizada
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
            // Se falhar rede e não tiver cache, apenas não quebra
            return cachedResponse
          })

        // Retorna imediatamente o cache se houver, ou a rede
        return cachedResponse || fetchPromise
      }),
    )
    return
  }

  // 5. Fontes do Google e CDNs conhecidos (Stale-While-Revalidate)
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

// Permite que o app envie mensagem pedindo skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
