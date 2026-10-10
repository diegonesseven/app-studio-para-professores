import { useEffect, useState } from 'react'
import { exercisesService } from '@/services/exercises'
import type { Exercise } from '@/types'
import { Search, Plus, Dumbbell, Play, Check, X, VideoOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ExercisePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
  onPreviewVideo?: (exercise: Exercise) => void
  title?: string
  description?: string
  actionLabel?: string
  currentExerciseId?: string
}

export default function ExercisePickerModal({
  isOpen,
  onClose,
  onSelect,
  onPreviewVideo,
  title = 'Selecionar Exercício',
  description = 'Adicione exercícios do acervo à série ativa',
  actionLabel = 'Adicionar',
  currentExerciseId,
}: ExercisePickerModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string>('todos')
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

  const muscleGroups = [
    'todos',
    'Quadríceps',
    'Posterior',
    'Glúteo',
    'Adutores',
    'Abdutores',
    'Panturrilha',
    'Peito',
    'Costas',
    'Bíceps',
    'Tríceps',
    'Ombro',
    'Abdômen',
    'Mobilidades',
    'Outros',
  ]

  const filteredExercises = exercises.filter((ex) => {
    if (selectedMuscle === 'todos') return true
    return ex.muscle_group === selectedMuscle
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Busca e Filtro por Grupo Muscular */}
        <div className="p-3.5 border-b border-border bg-muted/30 space-y-2">
          <div className="relative">
            <Input
              placeholder="Buscar por nome do exercício (ex: Leg press, Agachamento, Extensora)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground h-11 pl-10 focus-visible:ring-primary text-sm"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>
          {/* Filtros em chips horizontais */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {muscleGroups.map((group) => {
              const active = selectedMuscle === group
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedMuscle(group)}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {group === 'todos' ? 'Todos' : group}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lista de Exercícios */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Carregando acervo de exercícios...
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Nenhum exercício encontrado para a busca.
            </div>
          ) : (
            filteredExercises.map((ex) => {
              const isCurrent = currentExerciseId === ex.id

              return (
                <div
                  key={ex.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-primary/10 border-primary ring-1 ring-primary/30'
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {ex.thumbnail_url ? (
                      <img
                        src={ex.thumbnail_url}
                        alt={ex.name}
                        className="w-12 h-10 object-cover rounded-md border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-10 bg-muted rounded-md flex items-center justify-center shrink-0 text-muted-foreground">
                        <Dumbbell className="w-4 h-4 opacity-50" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground block break-words leading-snug">
                          {ex.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-primary text-primary-foreground font-bold px-1.5 py-0.2 rounded shrink-0">
                            Atual
                          </span>
                        )}
                      </div>
                      <Badge className="bg-muted text-muted-foreground text-[10px] font-normal px-2 py-0 border-0 mt-1">
                        {ex.muscle_group}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {(() => {
                      const hasVideo = Boolean(ex.youtube_id || ex.youtube_url)
                      if (!onPreviewVideo) return null
                      return hasVideo ? (
                        <button
                          type="button"
                          onClick={() => onPreviewVideo(ex)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                          title="Prévia do vídeo"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onPreviewVideo(ex)}
                          className="p-2 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors"
                          title="Sem vídeo cadastrado (toque para detalhes)"
                        >
                          <VideoOff className="w-4 h-4" />
                        </button>
                      )
                    })()}

                    <Button
                      size="sm"
                      onClick={() => {
                        onSelect(ex)
                        onClose()
                      }}
                      className="bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs h-8 px-3 shadow-sm"
                    >
                      {actionLabel === 'Substituir' ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" /> Substituir
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 mr-1" /> {actionLabel}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
