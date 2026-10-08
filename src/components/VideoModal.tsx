import { useMemo } from 'react'
import { X, ExternalLink, VideoOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseVideoUrl, extractVimeoId, extractYoutubeId } from '@/services/exercises'

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
          embedUrl: `https://player.vimeo.com/video/${vimeo}?autoplay=0`,
          thumbnailUrl: null,
        }
      }

      const yt = extractYoutubeId(youtubeId)
      if (yt) {
        return {
          platform: 'youtube' as const,
          id: yt,
          originalUrl: `https://www.youtube.com/watch?v=${yt}`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1`,
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

  if (!isOpen) return null

  const hasVideo = videoInfo.platform !== 'none' && Boolean(videoInfo.embedUrl)
  const isVimeo = videoInfo.platform === 'vimeo'
  const isYouTube = videoInfo.platform === 'youtube'
  const platformLabel = isVimeo ? 'Vimeo' : isYouTube ? 'YouTube' : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog - Generoso para tablet (~95vw) e desktop (até 1100px) */}
      <div className="relative w-[95vw] max-w-[1100px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[95vh] animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-border bg-card/80 shrink-0">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5">
              Demonstração do Exercício
              {platformLabel && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#C1C7D0] uppercase tracking-normal font-normal">
                  {platformLabel}
                </span>
              )}
            </span>
            <h3 className="text-base sm:text-xl font-bold text-white truncate">{title}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#8A8F98] hover:text-white hover:bg-[#2A2A2A] transition-colors shrink-0"
            aria-label="Fechar vídeo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Area */}
        <div className="w-full bg-black relative aspect-video flex items-center justify-center overflow-hidden">
          {hasVideo && isVimeo && videoInfo.embedUrl ? (
            <iframe
              src={videoInfo.embedUrl}
              title={title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : hasVideo && isYouTube && videoInfo.embedUrl ? (
            <iframe
              src={videoInfo.embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-[#8A8F98]">
              <div className="w-14 h-14 rounded-2xl bg-[#1E1E1E] border border-[#2E2E2E] flex items-center justify-center text-[#8A8F98] mb-3">
                <VideoOff className="w-7 h-7 text-[#8A8F98]/70" />
              </div>
              <p className="text-base font-semibold text-white mb-1">Vídeo não cadastrado ainda</p>
              <p className="text-xs max-w-xs text-[#8A8F98]">
                Este exercício foi salvo sem link de vídeo demonstrativo. Você pode editá-lo para
                adicionar um link do YouTube ou Vimeo quando desejar.
              </p>
            </div>
          )}
        </div>

        {/* Footer com link externo se houver vídeo */}
        <div className="px-4 sm:px-6 py-3 bg-card/80 border-t border-border flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[#8A8F98] truncate">
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
                <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Abrir no{' '}
                {platformLabel || 'Player'}
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="border-border bg-card hover:bg-muted text-white text-xs sm:text-sm h-8 sm:h-9 px-4"
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
