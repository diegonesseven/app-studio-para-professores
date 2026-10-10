import React, { useRef } from 'react'
import { Camera, Image as ImageIcon, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export interface PhotoSourceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilesSelected: (files: File[]) => void
  title?: string
  description?: string
  accept?: string
  multiple?: boolean
}

/**
 * Modal / Seletor de Origem de Foto:
 * Oferece duas opções ao usuário:
 * 1. "Tirar foto" -> abre a câmera do celular/tablet diretamente via input com capture="environment"
 * 2. "Escolher da galeria" -> abre a biblioteca de fotos/arquivos do dispositivo
 *
 * Preserva exatamente o mesmo fluxo de salvamento / validação / redimensionamento.
 */
export function PhotoSourceModal({
  open,
  onOpenChange,
  onFilesSelected,
  title = 'Foto do Aluno',
  description = 'Como você deseja adicionar a foto?',
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  multiple = false,
}: PhotoSourceModalProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
      onOpenChange(false)
    }
    e.target.value = ''
  }

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
      onOpenChange(false)
    }
    e.target.value = ''
  }

  const handleTriggerCamera = () => {
    cameraInputRef.current?.click()
  }

  const handleTriggerGallery = () => {
    galleryInputRef.current?.click()
  }

  return (
    <>
      {/* Input nativo invisível para câmera (capture="environment") */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture="environment"
        className="hidden"
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleCameraChange}
      />

      {/* Input nativo invisível para galeria (sem capture, permitindo múltiplos se configurado) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleGalleryChange}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#181C2E] border-[#252B3E] text-white sm:max-w-md p-6">
          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" /> {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#9CA5B8]">{description}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            {/* Opção 1: Tirar foto na hora */}
            <button
              type="button"
              onClick={handleTriggerCamera}
              className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-[#121522] border-2 border-primary/50 hover:border-primary hover:bg-primary/10 transition-all text-white group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 group-hover:bg-primary text-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                <Camera className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="font-bold text-sm block">Tirar foto</span>
                <span className="text-[11px] text-[#9CA5B8]">Abre a câmera do celular/tablet</span>
              </div>
            </button>

            {/* Opção 2: Escolher da galeria */}
            <button
              type="button"
              onClick={handleTriggerGallery}
              className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl bg-[#121522] border border-[#252B3E] hover:border-[#384260] hover:bg-[#1E2338] transition-all text-white group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="w-12 h-12 rounded-full bg-[#252B3E] group-hover:bg-[#384260] text-secondary flex items-center justify-center transition-colors">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="font-bold text-sm block">Escolher da galeria</span>
                <span className="text-[11px] text-[#9CA5B8]">Buscar foto salva no aparelho</span>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
export default PhotoSourceModal
