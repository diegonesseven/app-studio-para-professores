import React from 'react'
import { X, ExternalLink, VideoOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  if (!isOpen) return null

  const directUrl =
    youtubeUrl || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2E2E2E] bg-[#171717]">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs uppercase tracking-wider text-primary font-semibold">
              Demonstração do Exercício
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white truncate">{title}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#8A8F98] hover:text-white hover:bg-[#2A2A2A] transition-colors"
            aria-label="Fechar vídeo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Area */}
        <div className="w-full bg-black relative aspect-video flex items-center justify-center">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-[#8A8F98]">
              <VideoOff className="w-12 h-12 mb-3 text-[#8A8F98]/50" />
              <p className="text-sm font-medium text-white mb-1">Vídeo não configurado</p>
              <p className="text-xs max-w-xs">
                Este exercício ainda não possui link de vídeo do YouTube vinculado.
              </p>
            </div>
          )}
        </div>

        {/* Footer com fallback / link externo */}
        <div className="p-3 bg-[#171717] border-t border-[#2E2E2E] flex items-center justify-between">
          <span className="text-xs text-[#8A8F98]">Studio Bru Oliveira • Ficha de Execução</span>

          <div className="flex items-center gap-2">
            {directUrl && (
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline px-2 py-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir no YouTube
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="border-[#2E2E2E] bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white text-xs h-8"
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
