import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { trainingSheetsService } from '@/services/trainingSheets'
import { studentsService } from '@/services/students'
import { exercisesService } from '@/services/exercises'
import { templateSheetsStorage } from '@/services/templateSheets'
import { sanitizeText } from '@/lib/validation'
import { safeDateToISO, parseAndFormatDate } from '@/lib/dateUtils'
import type {
  TrainingSheet,
  Student,
  Exercise,
  SeriesKey,
  ExerciseBlock,
  SeriesData,
  TemplateLevel,
  TemplateGender,
} from '@/types'
import { SERIES_KEYS } from '@/types'
import ExercisePickerModal from '@/components/ExercisePickerModal'
import { StudentCombobox } from '@/components/StudentCombobox'
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
  Calendar,
  CheckCircle2,
  VideoOff,
} from 'lucide-react'
import { workoutProgressService } from '@/services/workoutProgress'
import { shareOrExportSheet } from '@/services/trainingSheetPdf'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

export default function SheetForm() {
  const { id } = useParams<{ id: string }>()
  const { appearance } = useTheme()
  const [searchParams] = useSearchParams()
  const queryStudentId = searchParams.get('student') || ''

  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [student, setStudent] = useState<Student | null>(null)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [isTemplateMode, setIsTemplateMode] = useState<boolean>(!queryStudentId && !id)
  const [templateLevel, setTemplateLevel] = useState<TemplateLevel>('Iniciante')
  const [templateGender, setTemplateGender] = useState<TemplateGender>('Feminino')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [sheetCreated, setSheetCreated] = useState<string>('')
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(0)
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

  // Lista de fichas existentes para opção de importar como base
  const [availableSheets, setAvailableSheets] = useState<TrainingSheet[]>([])
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedSheetToImport, setSelectedSheetToImport] = useState<string>('')

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
        // 1. Carregar acervo de exercícios, fichas existentes e alunos cadastrados
        const [exList, allSheets, allSt] = await Promise.all([
          exercisesService.getAll(),
          trainingSheetsService.getAll(),
          studentsService.getAll(),
        ])
        const map: Record<string, Exercise> = {}
        exList.forEach((e) => {
          map[e.id] = e
        })
        setExercisesMap(map)
        setAvailableSheets(allSheets)
        setAllStudents(allSt)

        if (id) {
          // Edição de ficha existente (pode ser do backend ou modelo local)
          let sheet: TrainingSheet | undefined
          try {
            sheet = await trainingSheetsService.getById(id)
          } catch {
            sheet = templateSheetsStorage.getTemplateById(id)
          }

          if (sheet) {
            setTitle(sheet.title || '')
            setNotes(sheet.notes || '')
            setSheetCreated(sheet.created || '')
            if (sheet.start_date) {
              setStartDate(sheet.start_date.split('T')[0])
            } else if (sheet.created) {
              setStartDate(sheet.created.split('T')[0])
            }

            const initialSeries: SeriesData = {
              A: sheet.series_data?.A || [],
              B: sheet.series_data?.B || [],
              C: sheet.series_data?.C || [],
              D: sheet.series_data?.D || [],
              E: sheet.series_data?.E || [],
            }
            setSeriesData(initialSeries)

            if (sheet.is_template || !sheet.student) {
              setIsTemplateMode(true)
              setTemplateLevel(sheet.template_level || 'Iniciante')
              setTemplateGender(sheet.template_gender || 'Feminino')
            } else {
              setIsTemplateMode(false)
              const countSessions = await workoutProgressService.countCompletedSessions(
                sheet.student,
                sheet.id,
              )
              setCompletedSessionsCount(countSessions)
              const st = await studentsService.getById(sheet.student)
              setStudent(st)
            }
          }
        } else if (queryStudentId) {
          // Criação com aluno vinculado
          const st = await studentsService.getById(queryStudentId)
          setStudent(st)
          setIsTemplateMode(false)
          setTitle(`Ficha de Treino - ${st.name}`)
        } else {
          // Criação de ficha modelo sem aluno
          setIsTemplateMode(true)
          setTitle('Ficha Modelo - Treino Base')
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

  // Aplicar ficha de outro aluno como base desta ficha
  const handleImportSheetAsBase = (sourceSheetId: string) => {
    const source = availableSheets.find((s) => s.id === sourceSheetId)
    if (!source) return

    const sourceStudentName = source.expand?.student?.name || 'aluno'
    const clonedSeries: SeriesData = source.series_data
      ? JSON.parse(JSON.stringify(source.series_data))
      : { A: [], B: [], C: [], D: [], E: [] }

    setSeriesData(clonedSeries)
    if (source.notes && !notes) {
      setNotes(source.notes)
    }

    toast({
      title: 'Ficha importada como base!',
      description: `Séries A–E copiadas de ${sourceStudentName}. Ajuste os exercícios e clique em Salvar.`,
    })
    setImportModalOpen(false)
  }

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
    setSaving(true)
    try {
      // Sanitizar dados das séries contra injeção maliciosa de scripts
      const cleanedSeriesData: SeriesData = {}
      SERIES_KEYS.forEach((key) => {
        const blocks = seriesData[key] || []
        cleanedSeriesData[key] = blocks.map((b) => ({
          ...b,
          sets: Math.max(1, b.sets || 1),
          reps: sanitizeText(b.reps),
          time: sanitizeText(b.time),
          load: sanitizeText(b.load),
          notes: sanitizeText(b.notes),
        }))
      })

      const parsedStartDate = startDate ? safeDateToISO(startDate) : new Date().toISOString()

      if (isTemplateMode || !student) {
        // Salva ficha modelo (armazenamento de modelos pré-programados)
        const templateId = id || `modelo-custom-${Date.now()}`
        const modelObj: TrainingSheet = {
          id: templateId,
          collectionId: 'templates',
          collectionName: 'training_sheets',
          student: '',
          title: sanitizeText(title) || `Ficha Modelo - ${templateLevel} (${templateGender})`,
          notes: sanitizeText(notes),
          series_data: cleanedSeriesData,
          start_date: parsedStartDate,
          is_template: true,
          template_level: templateLevel,
          template_gender: templateGender,
          is_archived: false,
          created: sheetCreated || new Date().toISOString(),
          updated: new Date().toISOString(),
        }

        templateSheetsStorage.saveCustomTemplate(modelObj)
        toast({
          title: 'Ficha Modelo salva com sucesso!',
          description: `Disponível na lista com a etiqueta Modelo (${templateLevel} • ${templateGender}).`,
        })
        navigate('/treinos')
        return
      }

      // Ficha com aluno vinculado (salva no banco de dados sem alterar schema)
      const payload = {
        student: student.id,
        title: sanitizeText(title) || `Ficha de Treino - ${student.name}`,
        notes: sanitizeText(notes),
        series_data: cleanedSeriesData,
        start_date: parsedStartDate,
      }

      if (isEditing && id) {
        await trainingSheetsService.update(id, payload)
        toast({
          title: 'Ficha salva com sucesso',
          description: 'Alterações registradas no Studio Bru Oliveira.',
        })
      } else {
        // Ao criar uma ficha nova para o aluno, arquiva as anteriores para histórico
        await trainingSheetsService.archivePreviousSheets(student.id)
        await trainingSheetsService.create({
          ...payload,
          is_archived: false,
        })
        toast({
          title: 'Ficha criada com sucesso',
          description: 'A nova ficha está ativa e a anterior foi arquivada no cadastro.',
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
      <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Carregando dados da ficha de treino...</p>
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
            className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Ficha de Treino
              </span>
              {student ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/alunos?studentId=${student.id}&search=${encodeURIComponent(student.name)}`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted hover:bg-primary/10 text-foreground hover:text-primary border border-border hover:border-primary/40 text-xs font-semibold transition-all cursor-pointer group"
                  title={`Abrir cadastro completo de ${student.name} na aba Alunos`}
                >
                  <User className="w-3 h-3 text-primary" />
                  <span className="underline-offset-2 group-hover:underline">{student.name}</span>
                </button>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-800 border border-amber-500/30 text-xs font-semibold">
                  Ficha Modelo
                </Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {isEditing ? 'Editar Ficha de Séries' : 'Montar Nova Ficha'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {availableSheets.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const firstOther = availableSheets.find(
                  (s) => s.student !== student?.id && s.id !== id,
                )
                setSelectedSheetToImport(firstOther?.id || availableSheets[0]?.id || '')
                setImportModalOpen(true)
              }}
              className="border-border bg-card hover:bg-muted text-foreground font-semibold h-11 px-3 sm:px-4 text-xs sm:text-sm flex items-center gap-1.5"
              title="Copiar séries de outro aluno como ponto de partida"
            >
              <Copy className="w-4 h-4 text-primary" />
              <span>Usar outra ficha como base</span>
            </Button>
          )}

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
                  start_date: startDate ? safeDateToISO(startDate) : sheetCreated,
                  created: sheetCreated,
                  updated: '',
                }
                const res = await shareOrExportSheet({
                  student,
                  sheet: sheetObj,
                  exercisesMap,
                  studioName: appearance.studio_name,
                  primaryColor: appearance.primary_color,
                  logoUrl: appearance.logo_url,
                  completedSessionsCount,
                })
                if (res === 'opened') {
                  toast({
                    title: 'Ficha Pronta para Exportação / PDF',
                    description:
                      'Janela de impressão aberta. Escolha "Salvar como PDF" para compartilhar.',
                  })
                }
              }}
              className="border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-semibold h-11 px-4 shadow-sm flex items-center gap-2"
              title="Exportar ficha em PDF ou compartilhar via WhatsApp"
            >
              <Share2 className="w-4 h-4" /> Exportar / PDF
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
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        {/* Badges de Início da Ficha e Sessões Concluídas */}
        {isEditing && (
          <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border">
            <Badge className="bg-muted text-foreground border border-border text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>
                Início da ficha:{' '}
                <strong className="text-primary font-bold">
                  {startDate ? parseAndFormatDate(startDate, 'Hoje') : 'Hoje'}
                </strong>
              </span>
            </Badge>

            <Badge className="bg-primary/10 text-foreground border border-primary/20 text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>
                Sessões concluídas:{' '}
                <strong className="text-primary font-black">{completedSessionsCount}</strong>
              </span>
            </Badge>
          </div>
        )}

        {/* Escolha do tipo: Ficha com Aluno ou Ficha Modelo */}
        <div className="bg-muted/40 border border-border rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Vínculo da Ficha:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsTemplateMode(false)
                  if (!student && allStudents.length > 0) {
                    setStudent(allStudents[0])
                    setTitle(`Ficha de Treino - ${allStudents[0].name}`)
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isTemplateMode
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                Vincular a Aluno
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTemplateMode(true)
                  setStudent(null)
                  if (!title || title.startsWith('Ficha de Treino')) {
                    setTitle(`Ficha Modelo - ${templateLevel} (${templateGender})`)
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isTemplateMode
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                Ficha Modelo (Sem Aluno)
              </button>
            </div>
          </div>

          {!isTemplateMode && (
            <div className="flex items-center gap-2 w-full sm:w-80">
              <span className="text-xs text-muted-foreground font-medium shrink-0">Aluno:</span>
              <StudentCombobox
                students={allStudents}
                value={student?.id || ''}
                compact
                placeholder="Buscar aluno..."
                onChange={(_id, st) => {
                  setStudent(st)
                  if (st) setTitle(`Ficha de Treino - ${st.name}`)
                }}
              />
            </div>
          )}
        </div>

        {/* Parâmetros da Ficha Modelo (Nível e Gênero) */}
        {isTemplateMode && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Nível de Experiência do Modelo
              </Label>
              <select
                value={templateLevel}
                onChange={(e) => {
                  const lvl = e.target.value as TemplateLevel
                  setTemplateLevel(lvl)
                  setTitle(`Ficha Modelo - ${lvl} (${templateGender})`)
                }}
                className="w-full h-10 bg-card border border-border text-foreground rounded-md px-3 text-xs focus:ring-1 focus:ring-primary shadow-sm"
              >
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Gênero / Público Alvo
              </Label>
              <select
                value={templateGender}
                onChange={(e) => {
                  const gen = e.target.value as TemplateGender
                  setTemplateGender(gen)
                  setTitle(`Ficha Modelo - ${templateLevel} (${gen})`)
                }}
                className="w-full h-10 bg-card border border-border text-foreground rounded-md px-3 text-xs focus:ring-1 focus:ring-primary shadow-sm"
              >
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Unissex">Unissex</option>
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5 md:col-span-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Título da Ficha
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ficha Hipertrofia & Força Geral"
              className="bg-card border-border text-foreground font-semibold h-11 focus-visible:ring-primary shadow-sm"
            />
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Data de Início da Ficha
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-card border-border text-foreground font-semibold h-11 focus-visible:ring-primary shadow-sm"
            />
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Observações / Recomendações
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Descanso 60s, priorizar cadência"
              className="bg-card border-border text-foreground h-11 focus-visible:ring-primary shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs das Séries A, B, C, D, E */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {(() => {
              // Na edição ou montagem de ficha: se for ficha existente já com séries específicas (ex: só A e B),
              // mostramos as séries disponíveis que ela possui ou todas as 5 se for criação nova.
              // Para garantir que o professor consiga adicionar exercícios nas séries desejadas e navegar entre as existentes:
              const activeKeysWithData = SERIES_KEYS.filter((k) => (seriesData[k] || []).length > 0)
              // Mostra pelo menos as séries com conteúdo mais as sequenciais necessárias, ou todas
              return SERIES_KEYS.map((key) => {
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
                        : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                    }`}
                  >
                    <span>Série {key}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive ? 'bg-black/20 text-white' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })
            })()}
          </div>

          <Button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold h-10 px-4 shrink-0 flex items-center gap-1.5 border border-border"
          >
            <Plus className="w-4 h-4 text-primary" /> Adicionar Exercício
          </Button>
        </div>

        {/* Lista de Exercícios da Série Ativa */}
        {currentBlocks.length === 0 ? (
          <div className="py-14 text-center flex flex-col items-center justify-center text-muted-foreground">
            <ClipboardList className="w-12 h-12 stroke-[1.5] opacity-40 mb-3" />
            <p className="text-sm font-bold text-foreground mb-1">Série {activeTab} vazia</p>
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
                  className="bg-card border border-border hover:border-primary/40 rounded-xl p-4 transition-all space-y-3 shadow-xs"
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
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === currentBlocks.length - 1}
                            onClick={() => handleMoveBlock(index, 'down')}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="w-6 text-center text-xs font-bold text-primary">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <h4
                            onClick={() =>
                              setActiveVideo({
                                title: exName,
                                youtubeId: ytId,
                                youtubeUrl: ytUrl,
                              })
                            }
                            className="text-base font-bold text-foreground hover:text-primary cursor-pointer transition-colors break-words leading-snug"
                          >
                            {exName}
                          </h4>
                          {ytId || ytUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveVideo({
                                  title: exName,
                                  youtubeId: ytId,
                                  youtubeUrl: ytUrl,
                                })
                              }
                              className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0 mt-0.5"
                              title="Assistir demonstração"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setActiveVideo({
                                  title: exName,
                                  youtubeId: ytId,
                                  youtubeUrl: ytUrl,
                                })
                              }
                              className="p-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                              title="Sem vídeo cadastrado (toque para ver detalhes)"
                            >
                              <VideoOff className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          Agrupamento: <strong className="text-foreground">{muscle}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Botão de Trocar Exercício em si (Requisito 3) */}
                      <button
                        type="button"
                        onClick={() => setReplaceIndex(index)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 border border-primary/20 transition-colors flex items-center gap-1"
                        title="Trocar este exercício por outro do acervo"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Trocar Exercício
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(index)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remover exercício da série"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Parâmetros em Linha Compacta (Séries, Reps, Tempo, Carga, Obs) */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-border">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Séries</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={block.sets === 0 ? '' : block.sets}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '') {
                            handleUpdateBlock(index, 'sets', 0)
                            return
                          }
                          const parsed = parseInt(val, 10)
                          handleUpdateBlock(index, 'sets', Number.isNaN(parsed) ? 0 : parsed)
                        }}
                        onBlur={() => {
                          if (!block.sets || block.sets < 1) {
                            handleUpdateBlock(index, 'sets', 1)
                          }
                        }}
                        className="h-9 bg-card border-border text-foreground text-xs focus-visible:ring-primary shadow-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Repetições</Label>
                      <Input
                        value={block.reps}
                        onChange={(e) => handleUpdateBlock(index, 'reps', e.target.value)}
                        placeholder="Ex: 10 a 12"
                        className="h-9 bg-card border-border text-foreground text-xs focus-visible:ring-primary shadow-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Descanso / Tempo</Label>
                      <Input
                        value={block.time}
                        onChange={(e) => handleUpdateBlock(index, 'time', e.target.value)}
                        placeholder="Ex: 60s"
                        className="h-9 bg-card border-border text-foreground text-xs focus-visible:ring-primary shadow-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Carga Sugerida</Label>
                      <Input
                        value={block.load}
                        onChange={(e) => handleUpdateBlock(index, 'load', e.target.value)}
                        placeholder="Ex: 25kg"
                        className="h-9 bg-card border-border text-foreground text-xs focus-visible:ring-primary shadow-xs"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Observações</Label>
                      <Input
                        value={block.notes}
                        onChange={(e) => handleUpdateBlock(index, 'notes', e.target.value)}
                        placeholder="Ex: Pegada aberta"
                        className="h-9 bg-card border-border text-foreground text-xs focus-visible:ring-primary shadow-xs"
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
                className="border-border bg-card hover:bg-muted text-foreground text-xs h-10 px-5"
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

      {/* Modal Usar Outra Ficha Como Base (Item 3) */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Copy className="w-5 h-5 text-primary" /> Usar ficha de outro aluno como base
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Escolha uma ficha existente no Studio Bru Oliveira para copiar para este aluno. As
              séries A–E, exercícios, repetições, cargas e observações atuais serão substituídos
              pelas da ficha escolhida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Selecione a ficha modelo:
              </label>
              <select
                value={selectedSheetToImport}
                onChange={(e) => setSelectedSheetToImport(e.target.value)}
                className="w-full h-12 bg-card border border-border text-foreground rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {availableSheets.map((sh) => {
                  const sName = sh.expand?.student?.name || 'Aluno'
                  const titleStr = sh.title || 'Ficha'
                  return (
                    <option key={sh.id} value={sh.id}>
                      {sName} — {titleStr}
                    </option>
                  )
                })}
              </select>
            </div>

            {selectedSheetToImport &&
              (() => {
                const preview = availableSheets.find((s) => s.id === selectedSheetToImport)
                if (!preview) return null
                const seriesCount = Object.keys(preview.series_data || {}).filter(
                  (k) => (preview.series_data as Record<string, unknown[]>)?.[k]?.length > 0,
                )
                return (
                  <div className="bg-muted/40 border border-border rounded-xl p-3 text-xs space-y-1">
                    <p className="text-muted-foreground">
                      Aluno de origem:{' '}
                      <strong className="text-foreground">
                        {preview.expand?.student?.name || 'Não identificado'}
                      </strong>
                    </p>
                    <p className="text-muted-foreground">
                      Séries com exercícios:{' '}
                      <strong className="text-primary">
                        {seriesCount.length > 0 ? seriesCount.join(', ') : 'Nenhuma'}
                      </strong>
                    </p>
                    {preview.notes && (
                      <p className="text-muted-foreground italic">Obs: {preview.notes}</p>
                    )}
                  </div>
                )
              })()}
          </div>

          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportModalOpen(false)}
              className="border-border bg-card hover:bg-muted text-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!selectedSheetToImport}
              onClick={() => handleImportSheetAsBase(selectedSheetToImport)}
              className="bg-primary hover:opacity-90 text-primary-foreground font-bold"
            >
              Aplicar Séries Desta Ficha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
