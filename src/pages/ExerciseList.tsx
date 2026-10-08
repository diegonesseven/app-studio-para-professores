import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { exercisesService, parseVideoUrl } from '@/services/exercises'
import { useAuth } from '@/contexts/AuthContext'
import type { Exercise, MuscleGroup } from '@/types'
import { MUSCLE_GROUPS } from '@/types'
import VideoModal from '@/components/VideoModal'
import {
  Search,
  Plus,
  Play,
  Edit2,
  Trash2,
  Dumbbell,
  AlertCircle,
  Loader2,
  Filter,
  VideoOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

export default function ExerciseList() {
  const { isAdmin } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all')

  // Modal de Vídeo
  const [activeVideo, setActiveVideo] = useState<{
    title: string
    youtubeId?: string | null
    youtubeUrl?: string | null
  } | null>(null)

  // Dialog de Exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadExercises = async () => {
    try {
      setLoading(true)
      const data = await exercisesService.getAll(search, selectedMuscle)
      setExercises(data)
    } catch (err: unknown) {
      toast({
        title: 'Erro ao carregar acervo',
        description: err instanceof Error ? err.message : 'Falha na conexão',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExercises()
  }, [search, selectedMuscle])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setDeleting(true)
      await exercisesService.delete(deleteId)
      toast({
        title: 'Exercício excluído',
        description: 'O exercício foi removido do acervo.',
      })
      setDeleteId(null)
      loadExercises()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao excluir',
        description: err instanceof Error ? err.message : 'Falha ao excluir exercício',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Dumbbell className="w-7 h-7 text-primary" /> Acervo de Exercícios
          </h1>
          <p className="text-sm text-[#8A8F98] mt-1">
            Biblioteca completa de movimentos com vídeos demonstrativos para as aulas
          </p>
        </div>

        {isAdmin && (
          <Link to="/acervo/novo">
            <Button className="bg-primary hover:opacity-90 text-primary-foreground font-medium h-11 px-5 shadow-md flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Exercício
            </Button>
          </Link>
        )}
      </div>

      {/* Filtros e Busca */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Input
            placeholder="Pesquisar exercício por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1E1E1E] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 pl-11 pr-4 focus-visible:ring-primary"
          />
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
        </div>

        <div className="relative">
          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="w-full h-12 bg-[#1E1E1E] border border-[#2E2E2E] text-white rounded-md px-3.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos os Agrupamentos</option>
            {MUSCLE_GROUPS.map((mg) => (
              <option key={mg} value={mg}>
                {mg}
              </option>
            ))}
          </select>
          <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98] pointer-events-none" />
        </div>
      </div>

      {/* Lista de Exercícios */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#8A8F98] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Carregando acervo de exercícios...</p>
        </div>
      ) : exercises.length === 0 ? (
        <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2A2A2A] flex items-center justify-center text-[#8A8F98] mb-4">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Nenhum exercício cadastrado</h3>
          <p className="text-sm text-[#8A8F98] max-w-sm mb-6">
            Não encontramos exercícios com os filtros atuais. Adicione novos exercícios com vídeos
            para sua equipe.
          </p>
          {isAdmin && (
            <Link to="/acervo/novo">
              <Button className="bg-primary hover:opacity-90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-1.5" /> Adicionar Primeiro Exercício
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {exercises.map((exercise) => {
            const videoInfo = parseVideoUrl(exercise.youtube_url || exercise.youtube_id || '')
            const hasVideo = videoInfo.platform !== 'none' || Boolean(exercise.youtube_id)
            const isVimeo = videoInfo.platform === 'vimeo'
            const isYouTube = videoInfo.platform === 'youtube'
            const thumbSrc = exercise.thumbnail_url || videoInfo.thumbnailUrl

            return (
              <div
                key={exercise.id}
                className="bg-[#1E1E1E] border border-[#2E2E2E] hover:border-primary/40 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl group flex flex-col"
              >
                {/* Thumbnail / Video trigger */}
                <div
                  onClick={() =>
                    setActiveVideo({
                      title: exercise.name,
                      youtubeId: exercise.youtube_id,
                      youtubeUrl: exercise.youtube_url,
                    })
                  }
                  className="relative aspect-video bg-black/60 cursor-pointer overflow-hidden flex items-center justify-center group/thumb"
                >
                  {thumbSrc ? (
                    <img
                      src={thumbSrc}
                      alt={exercise.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                      loading="lazy"
                    />
                  ) : hasVideo && isVimeo ? (
                    <div className="w-full h-full bg-gradient-to-br from-[#1a233a] via-[#101426] to-[#0b0e1b] flex flex-col items-center justify-center text-[#8A8F98] p-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-[#00adef]/20 border border-[#00adef]/40 text-[#00adef] flex items-center justify-center mb-1 shadow-sm">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                      <span className="text-xs font-semibold text-white">Vídeo Vimeo</span>
                      <span className="text-[10px] text-[#8A8F98]">Clique para reproduzir</span>
                    </div>
                  ) : (
                    /* Estado sem vídeo cadastrado */
                    <div className="w-full h-full bg-gradient-to-b from-[#222222] to-[#181818] flex flex-col items-center justify-center text-[#8A8F98] p-4 text-center">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8A8F98] mb-1.5">
                        <VideoOff className="w-4 h-4 opacity-70" />
                      </div>
                      <span className="text-xs font-medium text-white/90">
                        Vídeo não cadastrado ainda
                      </span>
                      <span className="text-[10px] text-[#8A8F98]/80 mt-0.5">
                        Toque para ver detalhes
                      </span>
                    </div>
                  )}

                  {/* Botão Play flutuante quando há vídeo */}
                  {hasVideo && (
                    <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 flex items-center justify-center transition-colors">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  <Badge className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-white text-[11px] border border-white/10 font-normal">
                    {exercise.muscle_group}
                  </Badge>

                  {/* Badge de plataforma quando houver */}
                  {isVimeo && (
                    <Badge className="absolute top-2.5 right-2.5 bg-[#00adef]/90 text-white text-[10px] border-0 font-semibold shadow-sm">
                      Vimeo
                    </Badge>
                  )}
                  {isYouTube && (
                    <Badge className="absolute top-2.5 right-2.5 bg-red-600/90 text-white text-[10px] border-0 font-semibold shadow-sm">
                      YouTube
                    </Badge>
                  )}
                  {!hasVideo && (
                    <Badge className="absolute top-2.5 right-2.5 bg-black/60 text-[#8A8F98] text-[10px] border border-white/10 font-normal">
                      Sem vídeo
                    </Badge>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() =>
                        setActiveVideo({
                          title: exercise.name,
                          youtubeId: exercise.youtube_id,
                          youtubeUrl: exercise.youtube_url,
                        })
                      }
                      className="text-base font-bold text-white hover:text-primary cursor-pointer transition-colors line-clamp-1"
                      title={exercise.name}
                    >
                      {exercise.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#2A2A2A]">
                    {hasVideo ? (
                      <button
                        onClick={() =>
                          setActiveVideo({
                            title: exercise.name,
                            youtubeId: exercise.youtube_id,
                            youtubeUrl: exercise.youtube_url,
                          })
                        }
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium py-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Ver vídeo{' '}
                        {isVimeo ? 'Vimeo' : ''}
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#8A8F98] flex items-center gap-1 py-1">
                        <VideoOff className="w-3.5 h-3.5 opacity-60" /> Vídeo não cadastrado
                      </span>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <Link to={`/acervo/${exercise.id}/editar`}>
                          <button
                            className="p-1.5 rounded-lg text-[#8A8F98] hover:text-white hover:bg-[#2A2A2A] transition-colors"
                            title="Editar exercício"
                            aria-label={`Editar ${exercise.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => setDeleteId(exercise.id)}
                          className="p-1.5 rounded-lg text-[#8A8F98] hover:text-red-400 hover:bg-[#2A2A2A] transition-colors"
                          title="Excluir exercício"
                          aria-label={`Excluir ${exercise.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Vídeo */}
      <VideoModal
        isOpen={Boolean(activeVideo)}
        onClose={() => setActiveVideo(null)}
        title={activeVideo?.title || ''}
        youtubeId={activeVideo?.youtubeId}
        youtubeUrl={activeVideo?.youtubeUrl}
      />

      {/* Confirmação de Exclusão */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> Excluir exercício?
            </DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              Esta ação removerá este exercício permanentemente do acervo. Fichas que já contenham o
              exercício continuarão com o registro histórico, mas o vídeo não estará mais vinculado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              disabled={deleting}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
