import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { exercisesService, parseVideoUrl } from '@/services/exercises'
import { useAuth } from '@/contexts/AuthContext'
import type { Exercise, MuscleGroup } from '@/types'
import { MUSCLE_GROUPS, TARGET_MUSCLE_GROUPS } from '@/types'
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
  Tags,
  Check,
  ChevronDown,
  Sparkles,
  Info,
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

  // Modo de Classificação Rápida
  const [classifyMode, setClassifyMode] = useState(false)
  const [openSelectorId, setOpenSelectorId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

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

  // Contagem de exercícios com classificação não padrão (caso exista algum dado anômalo)
  const nonStandardCount = useMemo(() => {
    return exercises.filter((ex) => !MUSCLE_GROUPS.includes(ex.muscle_group)).length
  }, [exercises])

  // Função para salvar a classificação rápida diretamente
  const handleQuickClassify = async (exerciseId: string, newGroup: MuscleGroup) => {
    const previousGroup = exercises.find((e) => e.id === exerciseId)?.muscle_group
    if (previousGroup === newGroup) {
      setOpenSelectorId(null)
      return
    }

    // Atualização otimista
    setExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, muscle_group: newGroup } : e)),
    )
    setOpenSelectorId(null)
    setSavingId(exerciseId)

    try {
      await exercisesService.updateMuscleGroup(exerciseId, newGroup)
      toast({
        title: 'Classificação salva!',
        description: `Exercício atualizado para "${newGroup}".`,
      })
    } catch (err: unknown) {
      // Rollback se falhar
      if (previousGroup) {
        setExercises((prev) =>
          prev.map((e) => (e.id === exerciseId ? { ...e, muscle_group: previousGroup } : e)),
        )
      }
      toast({
        title: 'Erro ao classificar',
        description: err instanceof Error ? err.message : 'Falha na conexão',
        variant: 'destructive',
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Dumbbell className="w-7 h-7 text-primary" /> Acervo de Exercícios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Biblioteca completa de movimentos com vídeos demonstrativos para as aulas
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão de Modo Classificar */}
          <Button
            type="button"
            onClick={() => setClassifyMode((prev) => !prev)}
            variant={classifyMode ? 'default' : 'outline'}
            className={`h-11 px-4 font-semibold flex items-center gap-2 transition-all ${
              classifyMode
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                : 'border-border bg-card hover:bg-muted text-foreground'
            }`}
          >
            <Tags className="w-4 h-4" />
            <span>{classifyMode ? 'Sair do Modo Classificar' : 'Modo Classificar'}</span>
            {nonStandardCount > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  classifyMode
                    ? 'bg-black/20 text-white'
                    : 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                }`}
              >
                {nonStandardCount} pendente{nonStandardCount > 1 ? 's' : ''}
              </span>
            )}
          </Button>

          {isAdmin && (
            <Link to="/acervo/novo">
              <Button className="bg-primary hover:opacity-90 text-primary-foreground font-medium h-11 px-5 shadow-md flex items-center gap-2">
                <Plus className="w-4 h-4" /> Novo Exercício
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Banner de instrução quando no Modo Classificar */}
      {classifyMode && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Modo de Classificação Rápida Ativo
              </p>
              <p className="text-xs text-muted-foreground">
                Toque no botão de grupo do exercício para reclassificá-lo diretamente (Quadríceps,
                Posterior, Glúteo, etc.). O salvamento é automático na nuvem.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-500/15 px-3 py-1.5 rounded-lg border border-amber-500/30">
            <Info className="w-4 h-4" />
            <span>
              {nonStandardCount === 0
                ? 'Todos os 14 grupos musculares organizados!'
                : `${nonStandardCount} exercício(s) pendente(s)`}
            </span>
          </div>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Input
            placeholder="Pesquisar exercício por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 pl-11 pr-4 focus-visible:ring-primary shadow-sm"
          />
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="relative">
          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="w-full h-12 bg-card border border-border text-foreground rounded-md px-3.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer shadow-sm"
          >
            <option value="all">Todos os Agrupamentos</option>
            {MUSCLE_GROUPS.map((mg) => (
              <option key={mg} value={mg}>
                {mg}
              </option>
            ))}
          </select>
          <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Lista de Exercícios */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Carregando acervo de exercícios...</p>
        </div>
      ) : exercises.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Nenhum exercício cadastrado</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
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
                className="bg-card border border-border hover:border-primary/50 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group flex flex-col"
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
                  className="relative aspect-video bg-muted/60 cursor-pointer overflow-hidden flex items-center justify-center group/thumb"
                >
                  {thumbSrc ? (
                    <img
                      src={thumbSrc}
                      alt={exercise.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                      loading="lazy"
                    />
                  ) : hasVideo && isVimeo ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900/30 via-slate-800 to-slate-900 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-[#00adef]/20 border border-[#00adef]/40 text-[#00adef] flex items-center justify-center mb-1 shadow-sm">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                      <span className="text-xs font-semibold text-white">Vídeo Vimeo</span>
                      <span className="text-[10px] text-gray-300">Clique para reproduzir</span>
                    </div>
                  ) : (
                    /* Estado sem vídeo cadastrado */
                    <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                      <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground mb-1.5">
                        <VideoOff className="w-4 h-4 opacity-70" />
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        Vídeo não cadastrado ainda
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        Toque para ver detalhes
                      </span>
                    </div>
                  )}

                  {/* Botão Play flutuante quando há vídeo */}
                  {hasVideo && (
                    <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/15 flex items-center justify-center transition-colors">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover/thumb:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  <Badge className="absolute top-2.5 left-2.5 backdrop-blur-md text-[11px] font-medium border bg-card/90 text-foreground border-border shadow-sm">
                    {exercise.muscle_group}
                  </Badge>

                  {/* Badge de plataforma quando houver */}
                  {isVimeo && (
                    <Badge className="absolute top-2.5 right-2.5 bg-[#00adef] text-white text-[10px] border-0 font-semibold shadow-sm">
                      Vimeo
                    </Badge>
                  )}
                  {isYouTube && (
                    <Badge className="absolute top-2.5 right-2.5 bg-red-600 text-white text-[10px] border-0 font-semibold shadow-sm">
                      YouTube
                    </Badge>
                  )}
                  {!hasVideo && (
                    <Badge className="absolute top-2.5 right-2.5 bg-card/90 text-muted-foreground text-[10px] border border-border font-normal">
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
                      className="text-base font-bold text-foreground hover:text-primary cursor-pointer transition-colors line-clamp-1"
                      title={exercise.name}
                    >
                      {exercise.name}
                    </h3>
                  </div>

                  {/* Seletor Rápido de Agrupamento (Modo Classificar ou ao clicar no badge) */}
                  <div className="mt-3 pt-2.5 border-t border-border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Tags className="w-3 h-3" /> Grupo:
                      </span>
                      {savingId === exercise.id ? (
                        <span className="text-[11px] text-amber-600 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Salvando...
                        </span>
                      ) : null}
                    </div>

                    {/* Botão de disparo do seletor */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenSelectorId((curr) => (curr === exercise.id ? null : exercise.id))
                        }
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all bg-card border-border text-foreground hover:border-primary/50"
                      >
                        <span className="truncate">{exercise.muscle_group}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
                      </button>

                      {/* Dropdown / Grid de seleção rápida */}
                      {openSelectorId === exercise.id && (
                        <div className="absolute left-0 right-0 bottom-full mb-1 z-30 bg-card border border-border rounded-xl shadow-xl p-2 animate-fade-in">
                          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border px-1">
                            <span className="text-[11px] font-semibold text-foreground">
                              Classificar como:
                            </span>
                            <button
                              type="button"
                              onClick={() => setOpenSelectorId(null)}
                              className="text-[10px] text-muted-foreground hover:text-foreground"
                            >
                              Fechar
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                            {TARGET_MUSCLE_GROUPS.map((mg) => {
                              const isSelected = exercise.muscle_group === mg
                              return (
                                <button
                                  key={mg}
                                  type="button"
                                  onClick={() => handleQuickClassify(exercise.id, mg)}
                                  className={`flex items-center justify-between px-2 py-1.5 rounded text-left text-xs transition-colors ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground font-bold'
                                      : 'bg-muted/40 hover:bg-primary/10 text-foreground hover:text-primary'
                                  }`}
                                >
                                  <span className="truncate">{mg}</span>
                                  {isSelected && <Check className="w-3 h-3 shrink-0 ml-1" />}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Linha de ações inferiores */}
                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-border">
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
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 py-1">
                        <VideoOff className="w-3.5 h-3.5 opacity-60" /> Sem vídeo
                      </span>
                    )}

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <Link to={`/acervo/${exercise.id}/editar`}>
                          <button
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Editar exercício"
                            aria-label={`Editar ${exercise.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => setDeleteId(exercise.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
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
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> Excluir exercício?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Esta ação removerá este exercício permanentemente do acervo. Fichas que já contenham o
              exercício continuarão com o registro histórico, mas o vídeo não estará mais vinculado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="border-border bg-card hover:bg-muted text-foreground"
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
