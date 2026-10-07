import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { trainingSheetsService } from '@/services/trainingSheets'
import { studentsService } from '@/services/students'
import { exercisesService } from '@/services/exercises'
import type {
  TrainingSheet,
  Student,
  Exercise,
  SeriesKey,
  ExerciseBlock,
  SeriesData,
} from '@/types'
import { SERIES_KEYS } from '@/types'
import ExercisePickerModal from '@/components/ExercisePickerModal'
import VideoModal from '@/components/VideoModal'
import {
  ArrowLeft,
  Save,
  Plus,
  Play,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  User,
  ClipboardList,
  Sparkles,
  Loader2,
  Copy,
  ArrowRightLeft,
  Share2,
  Printer,
  Download,
} from 'lucide-react'
import { shareOrExportSheet } from '@/services/trainingSheetPdf'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'

export default function SheetForm() {
  const { id } = useParams<{ id: string }>()
  const { appearance } = useTheme()
  const [searchParams] = useSearchParams()
  const queryStudentId = searchParams.get('student') || ''

  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [student, setStudent] = useState<Student | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [activeTab, setActiveTab] = useState<SeriesKey>('A')

  // Mapa de exercícios completo por ID para exibição de detalhes
  const [exercisesMap, setExercisesMap] = useState<Record<string, Exercise>>({})

  // Séries A-E
  const [seriesData, setSeriesData] = useState<SeriesData>({
    A: [],
    B: [],
    C: [],
    D: [],
    E: [],
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modais
  const [pickerOpen, setPickerOpen] = useState(false)
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null)
  const [activeVideo, setActiveVideo] = useState<{
    title: string
    youtubeId?: string | null
    youtubeUrl?: string | null
  } | null>(null)

  // Carregar dados iniciais
  useEffect(() => {
    async function init() {
      try {
        setLoading(true)
        // 1. Carregar acervo de exercícios para mapa rápido
        const exList = await exercisesService.getAll()
        const map: Record<string, Exercise> = {}
        exList.forEach((e) => {
          map[e.id] = e
        })
        setExercisesMap(map)

        if (id) {
          // Edição de ficha existente
          const sheet = await trainingSheetsService.getById(id)
          setTitle(sheet.title || '')
          setNotes(sheet.notes || '')

          const initialSeries: SeriesData = {
            A: sheet.series_data?.A || [],
            B: sheet.series_data?.B || [],
            C: sheet.series_data?.C || [],
            D: sheet.series_data?.D || [],
            E: sheet.series_data?.E || [],
          }
          setSeriesData(initialSeries)

          // Carregar aluno vinculado
          const st = await studentsService.getById(sheet.student)
          setStudent(st)
        } else if (queryStudentId) {
          // Criação com query param de aluno
          const st = await studentsService.getById(queryStudentId)
          setStudent(st)
          setTitle(`Ficha de Treino - ${st.name}`)
        } else {
          // Se não tem aluno, redireciona para a lista
          navigate('/treinos')
        }
      } catch (err: unknown) {
        toast({
          title: 'Erro ao carregar ficha',
          description: err instanceof Error ? err.message : 'Falha na inicialização',
          variant: 'destructive',
        })
        navigate('/treinos')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [id, queryStudentId, navigate])

  const currentBlocks: ExerciseBlock[] = seriesData[activeTab] || []

  // Adicionar exercício selecionado à série ativa
  const handleAddExercise = (exercise: Exercise) => {
    const newBlock: ExerciseBlock = {
      exercise_id: exercise.id,
      sets: 3,
      reps: '10 a 12',
      time: '60s',
      load: 'Carga inicial',
      notes: '',
      order: currentBlocks.length + 1,
    }

    setSeriesData((prev) => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), newBlock],
    }))

    toast({
      title: 'Exercício adicionado',
      description: `${exercise.name} adicionado à Série ${activeTab}.`,
    })
  }

  // Substituir exercício preservando parâmetros (Requisito 3)
  const handleReplaceExercise = (exercise: Exercise) => {
    if (replaceIndex === null) return
    setSeriesData((prev) => {
      const list = [...(prev[activeTab] || [])]
      if (replaceIndex >= 0 && replaceIndex < list.length) {
        list[replaceIndex] = {
          ...list[replaceIndex],
          exercise_id: exercise.id,
        }
      }
      return {
        ...prev,
        [activeTab]: list,
      }
    })

    toast({
      title: 'Exercício substituído',
      description: `Alterado para ${exercise.name} mantendo a posição e parâmetros.`,
    })
    setReplaceIndex(null)
  }

  // Atualizar campo específico de um bloco
  const handleUpdateBlock = (index: number, field: keyof ExerciseBlock, value: unknown) => {
    setSeriesData((prev) => {
      const list = [...(prev[activeTab] || [])]
      list[index] = {
        ...list[index],
        [field]: value,
      }
      return {
        ...prev,
        [activeTab]: list,
      }
    })
  }

  // Remover bloco da série
  const handleRemoveBlock = (index: number) => {
    setSeriesData((prev) => {
      const list = (prev[activeTab] || []).filter((_, i) => i !== index)
      // Reordenar
      const reordered = list.map((item, i) => ({ ...item, order: i + 1 }))
      return {
        ...prev,
        [activeTab]: reordered,
      }
    })
  }

  // Mover bloco para cima / baixo (reordenação manual simples e touch-friendly)
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    setSeriesData((prev) => {
      const list = [...(prev[activeTab] || [])]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= list.length) return prev

      const temp = list[index]
      list[index] = list[targetIndex]
      list[targetIndex] = temp

      const reordered = list.map((item, i) => ({ ...item, order: i + 1 }))
      return {
        ...prev,
        [activeTab]: reordered,
      }
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) {
      toast({
        title: 'Aluno não identificado',
        description: 'Vincule um aluno para salvar a ficha.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        student: student.id,
        title: title.trim() || `Ficha de Treino - ${student.name}`,
        notes: notes.trim(),
        series_data: seriesData,
      }

      if (isEditing && id) {
        await trainingSheetsService.update(id, payload)
        toast({
          title: 'Ficha salva com sucesso',
          description: 'Alterações registradas no Studio Bru Oliveira.',
        })
      } else {
        await trainingSheetsService.create(payload)
        toast({
          title: 'Ficha criada com sucesso',
          description: 'A nova ficha já pode ser usada nas aulas.',
        })
      }
      navigate('/treinos')
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar ficha',
        description: err instanceof Error ? err.message : 'Falha na gravação',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-[#8A8F98] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Carregando ficha de treino...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/treinos"
            className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2E2E2E] text-[#8A8F98] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Ficha de Treino
              </span>
              {student && (
                <Badge className="bg-[#2A2A2A] text-white border-0 text-xs">{student.name}</Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
              {isEditing ? 'Editar Ficha de Séries' : 'Montar Nova Ficha'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {student && isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                const sheetObj: TrainingSheet = {
                  id: id || '',
                  collectionId: '',
                  collectionName: 'training_sheets',
                  student: student.id,
                  title,
                  notes,
                  series_data: seriesData,
                  created: '',
                  updated: '',
                }
                const res = await shareOrExportSheet({
                  student,
                  sheet: sheetObj,
                  exercisesMap,
                  studioName: appearance.studio_name,
                  primaryColor: appearance.primary_color,
                  logoUrl: appearance.logo_url,
                })
                if (res === 'opened') {
                  toast({
                    title: 'Ficha Pronta para Exportação / PDF',
                    description:
                      'Janela de impressão aberta. Escolha "Salvar como PDF" para compartilhar.',
                  })
                }
              }}
              className="border-primary/40 bg-primary/10 hover:bg-primary/20 text-white font-semibold h-11 px-4 shadow-sm flex items-center gap-2"
              title="Exportar ficha em PDF ou compartilhar via WhatsApp"
            >
              <Share2 className="w-4 h-4 text-secondary" /> Exportar / PDF
            </Button>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:opacity-90 text-primary-foreground font-bold h-11 px-6 shadow-md"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Ficha'}
          </Button>
        </div>
      </div>

      {/* Identificação da Ficha */}
      <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-5 sm:p-6 shadow-md grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-[#8A8F98] uppercase tracking-wider font-semibold">
            Título da Ficha
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Ficha Hipertrofia & Força Geral"
            className="bg-[#121212] border-[#2E2E2E] text-white font-semibold h-11 focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[#8A8F98] uppercase tracking-wider font-semibold">
            Observações do Professor / Recomendações
          </Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Descanso controlado de 60s, priorizar cadência controlada"
            className="bg-[#121212] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Tabs das Séries A, B, C, D, E */}
      <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {SERIES_KEYS.map((key) => {
              const count = seriesData[key]?.length || 0
              const isActive = activeTab === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'bg-[#141414] text-[#8A8F98] hover:text-white border border-[#2A2A2A]'
                  }`}
                >
                  <span>Série {key}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? 'bg-black/20 text-white' : 'bg-[#2A2A2A] text-[#8A8F98]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <Button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="bg-[#2A2A2A] hover:bg-[#333333] text-white text-xs font-semibold h-10 px-4 shrink-0 flex items-center gap-1.5 border border-[#3A3A3A]"
          >
            <Plus className="w-4 h-4 text-primary" /> Adicionar Exercício
          </Button>
        </div>

        {/* Lista de Exercícios da Série Ativa */}
        {currentBlocks.length === 0 ? (
          <div className="py-14 text-center flex flex-col items-center justify-center text-[#8A8F98]">
            <ClipboardList className="w-12 h-12 stroke-[1.5] opacity-40 mb-3" />
            <p className="text-sm font-bold text-white mb-1">Série {activeTab} vazia</p>
            <p className="text-xs max-w-xs mb-4">
              Toque no botão abaixo para escolher exercícios do acervo para esta série.
            </p>
            <Button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="bg-primary hover:opacity-90 text-primary-foreground text-xs h-9 px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Escolher Exercício para Série {activeTab}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentBlocks.map((block, index) => {
              const ex = exercisesMap[block.exercise_id]
              const exName = ex?.name || 'Exercício não encontrado'
              const muscle = ex?.muscle_group || 'Geral'
              const ytId = ex?.youtube_id
              const ytUrl = ex?.youtube_url

              return (
                <div
                  key={`${block.exercise_id}-${index}`}
                  className="bg-[#141414] border border-[#2A2A2A] hover:border-primary/40 rounded-xl p-4 transition-all space-y-3"
                >
                  {/* Topo do Exercício */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Reordenação manual e indicador de ordem */}
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveBlock(index, 'up')}
                            className="p-1 text-[#8A8F98] hover:text-white disabled:opacity-20"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === currentBlocks.length - 1}
                            onClick={() => handleMoveBlock(index, 'down')}
                            className="p-1 text-[#8A8F98] hover:text-white disabled:opacity-20"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="w-6 text-center text-xs font-bold text-secondary">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            onClick={() =>
                              setActiveVideo({
                                title: exName,
                                youtubeId: ytId,
                                youtubeUrl: ytUrl,
                              })
                            }
                            className="text-base font-bold text-white hover:text-secondary cursor-pointer transition-colors truncate"
                          >
                            {exName}
                          </h4>
                          {ytId && (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveVideo({
                                  title: exName,
                                  youtubeId: ytId,
                                  youtubeUrl: ytUrl,
                                })
                              }
                              className="p-1 rounded bg-primary/20 text-secondary hover:bg-primary/30 transition-colors"
                              title="Assistir demonstração"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] text-[#8A8F98] block">
                          Agrupamento: <strong className="text-white">{muscle}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Botão de Trocar Exercício em si (Requisito 3) */}
                      <button
                        type="button"
                        onClick={() => setReplaceIndex(index)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-secondary hover:bg-secondary/15 border border-secondary/30 transition-colors flex items-center gap-1"
                        title="Trocar este exercício por outro do acervo"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Trocar Exercício
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(index)}
                        className="p-2 rounded-lg text-[#8A8F98] hover:text-red-400 hover:bg-[#2A2A2A] transition-colors"
                        title="Remover exercício da série"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Parâmetros em Linha Compacta (Séries, Reps, Tempo, Carga, Obs) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-[#222222]">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#8A8F98]">Séries</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={block.sets}
                        onChange={(e) =>
                          handleUpdateBlock(index, 'sets', parseInt(e.target.value) || 1)
                        }
                        className="h-9 bg-[#1E1E1E] border-[#2E2E2E] text-white text-xs focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#8A8F98]">Repetições</Label>
                      <Input
                        value={block.reps}
                        onChange={(e) => handleUpdateBlock(index, 'reps', e.target.value)}
                        placeholder="Ex: 10 a 12"
                        className="h-9 bg-[#1E1E1E] border-[#2E2E2E] text-white text-xs focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#8A8F98]">Descanso / Tempo</Label>
                      <Input
                        value={block.time}
                        onChange={(e) => handleUpdateBlock(index, 'time', e.target.value)}
                        placeholder="Ex: 60s"
                        className="h-9 bg-[#1E1E1E] border-[#2E2E2E] text-white text-xs focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-[#8A8F98]">Carga Sugerida</Label>
                      <Input
                        value={block.load}
                        onChange={(e) => handleUpdateBlock(index, 'load', e.target.value)}
                        placeholder="Ex: 25kg"
                        className="h-9 bg-[#1E1E1E] border-[#2E2E2E] text-white text-xs focus-visible:ring-primary"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <Label className="text-[11px] text-[#8A8F98]">Observações</Label>
                      <Input
                        value={block.notes}
                        onChange={(e) => handleUpdateBlock(index, 'notes', e.target.value)}
                        placeholder="Ex: Pegada aberta"
                        className="h-9 bg-[#1E1E1E] border-[#2E2E2E] text-white text-xs focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="pt-2 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPickerOpen(true)}
                className="border-[#2E2E2E] bg-[#141414] hover:bg-[#252525] text-white text-xs h-10 px-5"
              >
                <Plus className="w-4 h-4 mr-1 text-primary" /> Adicionar Mais um Exercício na Série{' '}
                {activeTab}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Escolha de Exercício (Adicionar Novo) */}
      <ExercisePickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
        title={`Adicionar Exercício à Série ${activeTab}`}
        description="Selecione um exercício do acervo para incluir nesta série"
        actionLabel="Adicionar"
        onPreviewVideo={(ex) =>
          setActiveVideo({
            title: ex.name,
            youtubeId: ex.youtube_id,
            youtubeUrl: ex.youtube_url,
          })
        }
      />

      {/* Modal de Troca de Exercício Existente (Requisito 3) */}
      {replaceIndex !== null && (
        <ExercisePickerModal
          isOpen={true}
          onClose={() => setReplaceIndex(null)}
          title={`Substituir Exercício #${replaceIndex + 1}`}
          description={`Escolha o novo exercício para substituir na Série ${activeTab}. Os valores de séries, repetições, carga e tempo serão mantidos.`}
          actionLabel="Substituir"
          currentExerciseId={currentBlocks[replaceIndex]?.exercise_id}
          onSelect={handleReplaceExercise}
          onPreviewVideo={(ex) =>
            setActiveVideo({
              title: ex.name,
              youtubeId: ex.youtube_id,
              youtubeUrl: ex.youtube_url,
            })
          }
        />
      )}

      {/* Modal de Vídeo */}
      <VideoModal
        isOpen={Boolean(activeVideo)}
        onClose={() => setActiveVideo(null)}
        title={activeVideo?.title || ''}
        youtubeId={activeVideo?.youtubeId}
        youtubeUrl={activeVideo?.youtubeUrl}
      />
    </div>
  )
}
