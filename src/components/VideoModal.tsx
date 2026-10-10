import { useState, useEffect, useMemo } from 'react'
import { X, ExternalLink, VideoOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  parseVideoUrl,
  extractVimeoId,
  extractYoutubeId,
  fetchVimeoDimensions,
  type VideoDimensions,
} from '@/services/exercises'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  youtubeId?: string | null
  youtubeUrl?: string | null
}

export default function VideoModal({
  isOpen,
  onClose,
  title,
  youtubeId,
  youtubeUrl,
}: VideoModalProps) {
  const videoInfo = useMemo(() => {
    // 1. Prioriza a URL original quando disponível
    if (youtubeUrl) {
      const parsed = parseVideoUrl(youtubeUrl)
      if (parsed.platform !== 'none') return parsed
    }

    // 2. Se só temos o ID armazenado no campo legado youtubeId
    if (youtubeId) {
      const vimeo = extractVimeoId(youtubeId)
      if (vimeo) {
        return {
          platform: 'vimeo' as const,
          id: vimeo,
          originalUrl: `https://vimeo.com/${vimeo}`,
          embedUrl: `https://player.vimeo.com/video/${vimeo}?autoplay=0&muted=1`,
          thumbnailUrl: null,
        }
      }

      const yt = extractYoutubeId(youtubeId)
      if (yt) {
        return {
          platform: 'youtube' as const,
          id: yt,
          originalUrl: `https://www.youtube.com/watch?v=${yt}`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&rel=0&modestbranding=1`,
          thumbnailUrl: `https://img.youtube.com/vi/${yt}/hqdefault.jpg`,
        }
      }
    }

    return {
      platform: 'none' as const,
      id: null,
      originalUrl: youtubeUrl || '',
      embedUrl: null,
      thumbnailUrl: null,
    }
  }, [youtubeId, youtubeUrl])

  const [dimensions, setDimensions] = useState<VideoDimensions | null>(null)
  const [loadingDimensions, setLoadingDimensions] = useState(false)

  // Busca dimensões via oEmbed quando for Vimeo
  useEffect(() => {
    if (!isOpen || videoInfo.platform !== 'vimeo' || !videoInfo.id) {
      setDimensions(null)
      setLoadingDimensions(false)
      return
    }

    let isMounted = true
    const controller = new AbortController()

    setLoadingDimensions(true)
    fetchVimeoDimensions(videoInfo.id, controller.signal)
      .then((dims) => {
        if (!isMounted) return
        setDimensions(dims)
        setLoadingDimensions(false)
      })
      .catch(() => {
        if (!isMounted) return
        setLoadingDimensions(false)
      })

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [isOpen, videoInfo.platform, videoInfo.id])

  if (!isOpen) return null

  const hasVideo = videoInfo.platform !== 'none' && Boolean(videoInfo.embedUrl)
  const isVimeo = videoInfo.platform === 'vimeo'
  const isYouTube = videoInfo.platform === 'youtube'
  const platformLabel = isVimeo ? 'Vimeo' : isYouTube ? 'YouTube' : null

  // Cálculo da proporção:
  // Se for Vimeo e temos dimensões do oEmbed, usa a proporção real (ex.: 238/426 = ~9/16 vertical).
  // Se ainda estiver carregando ou não obteve dimensões, o fallback é 16/9 para horizontal.
  // Para YouTube, padrão 16/9.
  const isPortrait = Boolean(dimensions?.isPortrait)
  const aspectRatioValue = dimensions ? `${dimensions.width} / ${dimensions.height}` : '16 / 9'

  // Largura máxima e estilização adaptativa do modal:
  // - Vídeo vertical (portrait): modal mais estreito e focado (max-w-[480px] a max-w-[540px]),
  //   ocupando a altura da tela sem gerar faixas brancas enormes dos lados.
  // - Vídeo horizontal (landscape): modal generoso para tablet e desktop (max-w-[1000px]).
  // - Sem vídeo: modal compacto padrão (max-w-[480px]).
  const modalMaxWidthClass = !hasVideo
    ? 'max-w-md w-full'
    : isPortrait
      ? 'max-w-[460px] w-full'
      : 'max-w-[1000px] w-[95vw]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Adaptativo */}
      <div
        className={`relative ${modalMaxWidthClass} bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[96vh] transition-[max-width] duration-300 ease-out animate-fade-in-up`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 border-b border-border bg-card/90 shrink-0">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
              Demonstração do Exercício
              {platformLabel && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-normal font-normal border border-border">
                  {platformLabel}
                </span>
              )}
              {isPortrait && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary uppercase tracking-normal font-semibold">
                  Vertical
                </span>
              )}
            </span>
            <h3 className="text-sm sm:text-lg font-bold text-foreground truncate">{title}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Fechar vídeo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Area Container */}
        <div className="w-full bg-black relative flex items-center justify-center overflow-hidden shrink min-h-0">
          {hasVideo && isVimeo && videoInfo.embedUrl ? (
            <div
              className="w-full flex items-center justify-center transition-[aspect-ratio] duration-300"
              style={{
                aspectRatio: aspectRatioValue,
                maxHeight: 'calc(96vh - 120px)',
              }}
            >
              <iframe
                src={videoInfo.embedUrl}
                title={title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0 block"
              />
              {loadingDimensions && (
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/70 pointer-events-none">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>
          ) : hasVideo && isYouTube && videoInfo.embedUrl ? (
            <div
              className="w-full flex items-center justify-center"
              style={{
                aspectRatio: '16 / 9',
                maxHeight: 'calc(96vh - 120px)',
              }}
            >
              <iframe
                src={videoInfo.embedUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0 block"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 text-muted-foreground bg-muted/20">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground mb-3">
                <VideoOff className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground/70" />
              </div>
              <p className="text-sm sm:text-base font-semibold text-foreground mb-1">
                Vídeo não cadastrado ainda
              </p>
              <p className="text-xs max-w-xs text-muted-foreground">
                Este exercício foi salvo sem link de vídeo demonstrativo. Você pode editá-lo para
                adicionar um link do YouTube ou Vimeo quando desejar.
              </p>
            </div>
          )}
        </div>

        {/* Footer com link externo se houver vídeo */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-card border-t border-border flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <span className="text-[11px] sm:text-xs text-muted-foreground truncate">
            Studio Bru Oliveira • Ficha de Execução
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {hasVideo && videoInfo.originalUrl && (
              <a
                href={videoInfo.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-primary hover:underline px-2.5 py-1.5 font-semibold bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Abrir no</span> {platformLabel || 'Player'}
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="border-border bg-card hover:bg-muted text-foreground text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
