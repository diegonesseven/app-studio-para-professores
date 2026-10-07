import React, { useState, useEffect } from 'react'
import { Download, Share, Smartphone, PlusSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export const InstallPromptBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 1. Verifica se já está em modo standalone
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches
    const isIosStandalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    const isInstalled = isStandaloneMedia || isIosStandalone

    if (isInstalled) {
      setIsStandalone(true)
      return
    }

    // 2. Verifica se o usuário já dispensou nesta sessão
    if (sessionStorage.getItem('pwa_banner_dismissed') === 'true') {
      setDismissed(true)
    }

    // 3. Detecta iOS
    const ua = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(ua)
    setIsIos(isIosDevice)

    // 4. Captura evento nativo do Android / Chrome / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Escuta evento de instalação concluída
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null)
      setIsStandalone(true)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('pwa_banner_dismissed', 'true')
  }

  // Não exibe se já for standalone, se dispensado ou se não for instalável
  if (isStandalone || dismissed) {
    return null
  }

  // Banner para Android / Chrome / Desktop
  if (deferredPrompt) {
    return (
      <div className="bg-gradient-to-r from-primary/20 via-[#1E1E1E] to-[#1E1E1E] border-b border-primary/30 px-4 py-2.5 text-xs sm:text-sm text-white flex items-center justify-between gap-3 shadow-md shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <p className="truncate">
            <span className="font-bold text-primary">Instalar App:</span> Tenha ícone próprio e
            abertura em tela 100% cheia.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="h-8 bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs px-3 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Instalar PWA
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md text-[#8A8F98] hover:text-white"
            aria-label="Dispensar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Banner discreto orientativo para Safari no iOS (iPad / iPhone)
  if (isIos) {
    return (
      <div className="bg-[#181818] border-b border-[#2A2A2A] px-4 py-2 text-xs text-[#8A8F98] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Smartphone className="w-4 h-4 text-primary shrink-0" />
          <p className="truncate">
            Para tela 100% cheia no iOS: toque em{' '}
            <Share className="w-3.5 h-3.5 inline mx-0.5 text-white" /> e depois em{' '}
            <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-white" />{' '}
            <strong className="text-white">Adicionar à Tela de Início</strong>.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md text-[#8A8F98] hover:text-white shrink-0"
          aria-label="Dispensar aviso"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return null
}
