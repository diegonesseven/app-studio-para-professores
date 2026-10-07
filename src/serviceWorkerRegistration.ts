/**
 * Utilitário de registro e ciclo de vida do Service Worker PWA
 */

export interface SWRegistrationCallbacks {
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onError?: (error: unknown) => void
}

let registrationInstance: ServiceWorkerRegistration | null = null

export function registerServiceWorker(callbacks?: SWRegistrationCallbacks) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  // Apenas roda no browser
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })
      registrationInstance = reg

      // Checa atualizações a cada 30 minutos em background
      setInterval(
        () => {
          reg.update().catch(() => {})
        },
        30 * 60 * 1000,
      )

      reg.addEventListener('updatefound', () => {
        const installingWorker = reg.installing
        if (!installingWorker) return

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Nova versão encontrada e pronta para ser ativada
              console.log('[PWA] Nova versão disponível do Studio Bru Oliveira!')
              callbacks?.onUpdate?.(reg)
            } else {
              // Primeira instalação em cache
              console.log('[PWA] Conteúdo em cache para uso rápido!')
              callbacks?.onSuccess?.(reg)
            }
          }
        })
      })

      // Escuta mudanças no controller (quando skipWaiting assume)
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          console.log('[PWA] Versão atualizada assumiu o controle.')
        }
      })
    } catch (error) {
      console.warn('[PWA] Falha ao registrar Service Worker:', error)
      callbacks?.onError?.(error)
    }
  })
}

export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        console.error(error.message)
      })
  }
}

/**
 * Detecta se a aplicação está rodando em modo standalone (PWA instalado)
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false

  const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches
  const isIosStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  const isDocumentFullscreen = document.referrer.includes('android-app://')

  return Boolean(isStandaloneMedia || isIosStandalone || isDocumentFullscreen)
}
