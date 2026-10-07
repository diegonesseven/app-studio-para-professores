import { useEffect, useState } from 'react'
import { exercisesService } from '@/services/exercises'
import type { Exercise } from '@/types'
import { Search, Plus, Dumbbell, Play, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ExercisePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
  onPreviewVideo?: (exercise: Exercise) => void
}

export default function ExercisePickerModal({
  isOpen,
  onClose,
  onSelect,
  onPreviewVideo,
}: ExercisePickerModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      exercisesService
        .getAll(search)
        .then((data) => setExercises(data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isOpen, search])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E2E2E] bg-[#171717]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F06A2A]/15 border border-[#F06A2A]/30 text-[#F06A2A] flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Selecionar Exercício</h3>
              <p className="text-xs text-[#8A8F98]">Adicione exercícios do acervo à série ativa</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-[#8A8F98] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Busca */}
        <div className="p-4 border-b border-[#2E2E2E] bg-[#141414]">
          <div className="relative">
            <Input
              placeholder="Buscar por nome do exercício..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#1E1E1E] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-11 pl-10 focus-visible:ring-[#F06A2A]"
              autoFocus
            />
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
          </div>
        </div>

        {/* Lista de Exercícios */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#8A8F98]">Carregando exercícios...</div>
          ) : exercises.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8A8F98]">
              Nenhum exercício encontrado.
            </div>
          ) : (
            exercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] hover:border-[#F06A2A]/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {ex.thumbnail_url ? (
                    <img
                      src={ex.thumbnail_url}
                      alt={ex.name}
                      className="w-12 h-10 object-cover rounded-md border border-[#2E2E2E] shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-10 bg-[#2A2A2A] rounded-md flex items-center justify-center shrink-0 text-[#8A8F98]">
                      <Dumbbell className="w-4 h-4 opacity-50" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-white block truncate">
                      {ex.name}
                    </span>
                    <Badge className="bg-[#2A2A2A] text-[#8A8F98] text-[10px] font-normal px-2 py-0 border-0 mt-0.5">
                      {ex.muscle_group}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {ex.youtube_id && onPreviewVideo && (
                    <button
                      type="button"
                      onClick={() => onPreviewVideo(ex)}
                      className="p-2 rounded-lg text-[#8A8F98] hover:text-[#F06A2A] hover:bg-[#2A2A2A] transition-colors"
                      title="Prévia do vídeo"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => {
                      onSelect(ex)
                      onClose()
                    }}
                    className="bg-[#F06A2A] hover:bg-[#D95C1C] text-white text-xs h-8 px-3"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
