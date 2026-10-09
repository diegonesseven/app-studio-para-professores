import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { studentsService } from '@/services/students'
import { trainingSheetsService } from '@/services/trainingSheets'
import { exercisesService } from '@/services/exercises'
import { workoutProgressService } from '@/services/workoutProgress'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { safeDateToISO } from '@/lib/dateUtils'
import { getAvailableSeriesKeys, getNextSeriesKey } from '@/lib/seriesCycle'
import type {
  Student,
  TrainingSheet,
  Exercise,
  SeriesKey,
  WorkoutProgress,
  ExerciseBlock,
  SeriesData,
} from '@/types'
import StudentTrainingColumn from '@/components/StudentTrainingColumn'
import AnamneseModal from '@/components/AnamneseModal'
import VideoModal from '@/components/VideoModal'
import { openSheetPrintWindow, shareOrExportSheet } from '@/services/trainingSheetPdf'
import { templateSheetsStorage } from '@/services/templateSheets'
import {
  Search,
  X,
  PlaySquare,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
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

// ID fixo do "aluno virtual" usado quando a sessão abre direto de uma Ficha Modelo
// (aula avulsa / aluno visitante). Fica apenas em memória: nada é gravado no banco.
const TEMPLATE_SESSION_ID = 'sessao-modelo'

/**
 * Ficha da sessão é de modelo (camada de modelos, sem registro no banco)?
 * IDs dos modelos de fábrica começam com 'modelo-'; modelos criados pelo professor
 * também abrem pelo mesmo parâmetro ?template=, então basta o aluno virtual da sessão.
 */
function isTemplateSessionKey(key: string): boolean {
  return key === TEMPLATE_SESSION_ID
}

export default function Training() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isProfessor, isAdmin } = useAuth()
  const { appearance } = useTheme()
  const canEditTraining = isProfessor || isAdmin

  // ID da ficha específica aberta diretamente (ex: vindo de /treinos)
  const sheetIdParam = searchParams.get('sheet') || ''

  // ID da ficha modelo aberta em modo aula avulsa (sem histórico no banco)
  const templateSheetParam = searchParams.get('template') || ''
  // Ficha modelo em memória (objetos default + custom salvos localmente)
  const templateSheet = useMemo(() => {
    if (!templateSheetParam) return null
    return templateSheetsStorage.getTemplateById(templateSheetParam) || null
  }, [templateSheetParam])

  // Alunos selecionados na sessão (IDs)
  const studentIdsParam = searchParams.get('students') || ''
  const selectedStudentIds = useMemo(() => {
    return studentIdsParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }, [studentIdsParam])

  // Lista de todos os alunos para busca e seleção rápida
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false)

  // Dados carregados dos alunos selecionados
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [sheetsMap, setSheetsMap] = useState<Record<string, TrainingSheet | null>>({})
  const [completedSessionsCountMap, setCompletedSessionsCountMap] = useState<
    Record<string, number>
  >({})
  const [exercisesMap, setExercisesMap] = useState<Record<string, Exercise>>({})

  // Série ativa por aluno: { [studentId]: 'A' | 'B' | ... }
  const [activeSeriesMap, setActiveSeriesMap] = useState<Record<string, SeriesKey>>({})

  // Exercícios marcados como feitos na sessão (verde): { [studentId]: { [seriesKey]: { [exerciseIndex]: true } } }
  const [completedMap, setCompletedMap] = useState<
    Record<string, Partial<Record<SeriesKey, Record<number, boolean>>>>
  >({})

  // Exercícios em execução na sessão (amarelo - 1º toque): { [studentId]: { [seriesKey]: { [exerciseIndex]: true } } }
  const [inProgressMap, setInProgressMap] = useState<
    Record<string, Partial<Record<SeriesKey, Record<number, boolean>>>>
  >({})

  // ID do registro de progresso em andamento na nuvem: { [studentId]: recordId }
  const [sessionRecordMap, setSessionRecordMap] = useState<Record<string, string>>({})

  // Modal para editar data de início da ficha
  const [editingStartDateSheet, setEditingStartDateSheet] = useState<TrainingSheet | null>(null)
  const [newStartDateInput, setNewStartDateInput] = useState<string>('')
  const [savingStartDate, setSavingStartDate] = useState(false)

  // Mobile carrossel tab ativa (índice 0, 1, 2 ou 3)
  const [mobileActiveIndex, setMobileActiveIndex] = useState(0)

  // Modais
  const [anamneseStudent, setAnamneseStudent] = useState<Student | null>(null)
  const [activeVideo, setActiveVideo] = useState<{
    title: string
    youtubeId?: string | null
    youtubeUrl?: string | null
  } | null>(null)

  // Dialog de avanço de série
  const [advanceDialog, setAdvanceDialog] = useState<{
    student: Student
    completedSeries: SeriesKey
    nextSeries: SeriesKey
  } | null>(null)

  // Dialog de conclusão de ficha completa
  const [sheetCompleteConfirm, setSheetCompleteConfirm] = useState<{
    student: Student
    sheet: TrainingSheet
  } | null>(null)

  const [loading, setLoading] = useState(true)

  // Realtime updates para workout_progress e training_sheets
  useRealtime<WorkoutProgress>('workout_progress', (e) => {
    // Quando outro dispositivo marcar progresso, sincroniza feedback leve
    if (e.action === 'create' && e.record) {
      // Se for um dos alunos da sessão, podemos reconsultar
      const rec = e.record
      if (selectedStudentIds.includes(rec.student)) {
        toast({
          title: 'Progresso sincronizado',
          description: `Série ${rec.series_completed} registrada em tempo real.`,
        })
      }
    }
  })

  useRealtime<TrainingSheet>('training_sheets', (e) => {
    if (e.record && selectedStudentIds.includes(e.record.student)) {
      setSheetsMap((prev) => ({
        ...prev,
        [e.record.student]: e.record,
      }))
    }
  })

  // 1. Carregar alunos gerais e mapa de exercícios
  useEffect(() => {
    async function loadInitial() {
      try {
        const [stList, exList] = await Promise.all([
          studentsService.getAll(),
          exercisesService.getAll(),
        ])
        setAllStudents(stList)

        const exMap: Record<string, Exercise> = {}
        exList.forEach((e) => {
          exMap[e.id] = e
        })
        setExercisesMap(exMap)
      } catch (err: unknown) {
        console.error(err)
      }
    }
    loadInitial()
  }, [])

  // 2. Carregar dados da sessão (modo ficha modelo OU modo alunos fixos)
  useEffect(() => {
    async function loadSelectedSession() {
      // CASO A: Ficha Modelo aberta em modo aula avulsa (?template=ID)
      if (templateSheetParam) {
        setLoading(true)
        try {
          const tSheet = templateSheetsStorage.getTemplateById(templateSheetParam)
          if (!tSheet) {
            toast({
              title: 'Modelo não encontrado',
              description: 'A ficha modelo solicitada não foi localizada.',
              variant: 'destructive',
            })
            setSelectedStudents([])
            setSheetsMap({})
            setLoading(false)
            return
          }

          // Monta o "aluno virtual" da ficha modelo (apenas em memória, sem persistência no banco)
          const virtualStudent: Student = {
            id: TEMPLATE_SESSION_ID,
            name: `${tSheet.title} (Modelo)`,
            phone: '',
            birthdate: '',
            created: tSheet.created,
            updated: tSheet.updated,
          }

          const availableKeys = getAvailableSeriesKeys(tSheet.series_data)
          const defaultSeries: SeriesKey = availableKeys[0] || 'A'

          setSelectedStudents([virtualStudent])
          setSheetsMap({ [TEMPLATE_SESSION_ID]: tSheet })
          setCompletedSessionsCountMap({ [TEMPLATE_SESSION_ID]: 0 })
          setActiveSeriesMap((prev) => ({
            ...prev,
            [TEMPLATE_SESSION_ID]: prev[TEMPLATE_SESSION_ID] || defaultSeries,
          }))
          setCompletedMap((prev) => ({
            ...prev,
            [TEMPLATE_SESSION_ID]: prev[TEMPLATE_SESSION_ID] || {},
          }))
          setInProgressMap((prev) => ({
            ...prev,
            [TEMPLATE_SESSION_ID]: prev[TEMPLATE_SESSION_ID] || {},
          }))
        } finally {
          setLoading(false)
        }
        return
      }

      // CASO B: Alunos fixos (?students=... ou ?sheet=...)
      // Se tiver ?sheet= e nenhum ?students=, resolve o aluno da ficha primeiro
      let targetStudentIds = [...selectedStudentIds]
      let specificSheetFromParam: TrainingSheet | null = null

      if (targetStudentIds.length === 0 && sheetIdParam) {
        try {
          setLoading(true)
          specificSheetFromParam = await trainingSheetsService.getById(sheetIdParam)
          if (specificSheetFromParam && specificSheetFromParam.student) {
            targetStudentIds = [specificSheetFromParam.student]
          }
        } catch (err) {
          console.error('Erro ao buscar ficha pelo ID:', err)
        }
      }

      if (targetStudentIds.length === 0) {
        setSelectedStudents([])
        setSheetsMap({})
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const studentsData = await Promise.all(
          targetStudentIds.map((id) => studentsService.getById(id)),
        )
        setSelectedStudents(studentsData)

        // Carregar fichas e histórico recente de cada aluno para determinar onde começar
        const newSheetsMap: Record<string, TrainingSheet | null> = {}
        const newCompletedSessionsMap: Record<string, number> = {}
        const newSeriesMap: Record<string, SeriesKey> = { ...activeSeriesMap }
        const newCompletedMap: Record<string, Record<number, boolean>> = { ...completedMap }
        const newInProgressMap: Record<string, Record<number, boolean>> = { ...inProgressMap }
        const newSessionRecords: Record<string, string> = { ...sessionRecordMap }

        await Promise.all(
          studentsData.map(async (st) => {
            // Se veio pelo parâmetro ?sheet= e corresponde a este aluno, usa diretamente
            let sheet: TrainingSheet | null = null
            if (specificSheetFromParam && specificSheetFromParam.student === st.id) {
              sheet = specificSheetFromParam
            } else if (sheetIdParam) {
              // Tenta buscar a ficha específica
              try {
                const fetched = await trainingSheetsService.getById(sheetIdParam)
                if (fetched && fetched.student === st.id) {
                  sheet = fetched
                }
              } catch {
                sheet = null
              }
            }

            if (!sheet) {
              sheet = await trainingSheetsService.getByStudent(st.id)
            }

            newSheetsMap[st.id] = sheet

            if (sheet) {
              const count = await workoutProgressService.countCompletedSessions(st.id, sheet.id)
              newCompletedSessionsMap[st.id] = count
            } else {
              newCompletedSessionsMap[st.id] = 0
            }

            // Descobre o último registro do aluno no backend
            const latest = await workoutProgressService.getLatestByStudent(st.id)
            const availableKeys = getAvailableSeriesKeys(sheet?.series_data)

            let seriesToOpen: SeriesKey = newSeriesMap[st.id] || availableKeys[0] || 'A'
            let initialCompleted: Record<number, boolean> = {}
            let initialInProgress: Record<number, boolean> = {}

            if (latest && !newSeriesMap[st.id]) {
              // Verifica se a série mais recente NÃO foi concluída inteiramente (continuidade)
              const seriesExercises = sheet?.series_data?.[latest.series_completed] || []
              const totalEx = seriesExercises.length
              const savedIndices = latest.completed_indices || []
              const savedInProgress = latest.in_progress_indices || []
              const hasUnfinishedExercises =
                latest.is_completed === false ||
                (totalEx > 0 && savedIndices.length < totalEx && latest.is_completed !== true)

              if (hasUnfinishedExercises && availableKeys.includes(latest.series_completed)) {
                // CONTINUIDADE: mantém a mesma série aberta no ponto onde parou!
                seriesToOpen = latest.series_completed
                savedIndices.forEach((i) => {
                  initialCompleted[i] = true
                })
                savedInProgress.forEach((i) => {
                  initialInProgress[i] = true
                })
                newSessionRecords[st.id] = latest.id
              } else {
                // Série 100% concluída: avança para a próxima série respeitando as séries reais da ficha
                // Ao terminar a última série disponível, recomeça na série A
                seriesToOpen = getNextSeriesKey(latest.series_completed, availableKeys)
              }
            } else if (!availableKeys.includes(seriesToOpen)) {
              // Se a série atual não existe na ficha, garante a primeira disponível (A)
              seriesToOpen = availableKeys[0] || 'A'
            }

            newSeriesMap[st.id] = seriesToOpen
            if (Object.keys(initialCompleted).length > 0) {
              newCompletedMap[st.id] = initialCompleted
            }
            if (Object.keys(initialInProgress).length > 0) {
              newInProgressMap[st.id] = initialInProgress
            }
          }),
        )

        setSheetsMap(newSheetsMap)
        setCompletedSessionsCountMap(newCompletedSessionsMap)
        setActiveSeriesMap(newSeriesMap)
        setCompletedMap(newCompletedMap)
        setInProgressMap(newInProgressMap)
        setSessionRecordMap(newSessionRecords)
      } catch (err: unknown) {
        toast({
          title: 'Erro ao carregar sessão',
          description: err instanceof Error ? err.message : 'Falha na conexão',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadSelectedSession()
  }, [studentIdsParam, templateSheetParam, sheetIdParam])

  // Adicionar aluno à sessão (Máximo 4)
  const handleAddStudentToSession = (student: Student) => {
    // Se estava em modo ficha modelo, ao adicionar um aluno real, transita para a sessão do aluno
    if (templateSheetParam) {
      setSearchParams({ students: student.id })
      setStudentSearch('')
      setSearchDropdownOpen(false)
      return
    }

    if (selectedStudentIds.includes(student.id)) {
      setStudentSearch('')
      setSearchDropdownOpen(false)
      return
    }

    if (selectedStudentIds.length >= 4) {
      toast({
        title: 'Limite atingido',
        description: 'Máximo de 4 alunos por sessão para garantir a melhor atenção.',
        variant: 'destructive',
      })
      setStudentSearch('')
      setSearchDropdownOpen(false)
      return
    }

    const nextIds = [...selectedStudentIds, student.id]
    setSearchParams({ students: nextIds.join(',') })
    setStudentSearch('')
    setSearchDropdownOpen(false)
  }

  // Remover aluno da sessão
  const handleRemoveStudentFromSession = (studentId: string) => {
    if (isTemplateSessionKey(studentId)) {
      setSearchParams({})
      setSelectedStudents([])
      setSheetsMap({})
      return
    }
    const nextIds = selectedStudentIds.filter((id) => id !== studentId)
    if (nextIds.length) {
      setSearchParams({ students: nextIds.join(',') })
    } else {
      setSearchParams({})
    }
  }

  // Carrega continuidade ao alternar manualmente a aba de série do aluno
  const handleSelectSeriesForStudent = async (studentId: string, seriesKey: SeriesKey) => {
    setActiveSeriesMap((prev) => ({
      ...prev,
      [studentId]: seriesKey,
    }))

    const sheet = sheetsMap[studentId]
    if (!sheet) return

    // Se for ficha modelo (sessão avulsa), mantém o progresso em memória sem consultar banco
    if (isTemplateSessionKey(studentId)) {
      return
    }

    try {
      const existing = await workoutProgressService.getActiveSession(studentId, sheet.id, seriesKey)
      if (existing) {
        const cMap: Record<number, boolean> = {}
        const ipMap: Record<number, boolean> = {}
        ;(existing.completed_indices || []).forEach((idx) => {
          cMap[idx] = true
        })
        ;(existing.in_progress_indices || []).forEach((idx) => {
          ipMap[idx] = true
        })
        setCompletedMap((prev) => ({
          ...prev,
          [studentId]: cMap,
        }))
        setInProgressMap((prev) => ({
          ...prev,
          [studentId]: ipMap,
        }))
        setSessionRecordMap((prev) => ({
          ...prev,
          [studentId]: existing.id,
        }))
      } else {
        setCompletedMap((prev) => ({
          ...prev,
          [studentId]: {},
        }))
        setInProgressMap((prev) => ({
          ...prev,
          [studentId]: {},
        }))
      }
    } catch {
      /* intentionally ignored */
    }
  }

  // Sistema de 2 toques por exercício:
  // 1º toque: amarelo ("em execução")
  // 2º toque: verde ("concluído")
  // 3º toque: desmarca / volta a nenhum
  const handleToggleExercise = async (studentId: string, idx: number) => {
    const studentCompleted = { ...(completedMap[studentId] || {}) }
    const studentInProgress = { ...(inProgressMap[studentId] || {}) }

    const isDone = Boolean(studentCompleted[idx])
    const isInProg = Boolean(studentInProgress[idx])

    if (!isInProg && !isDone) {
      // 1º toque: Em execução (amarelo)
      studentInProgress[idx] = true
      delete studentCompleted[idx]
    } else if (isInProg && !isDone) {
      // 2º toque: Concluído (verde)
      delete studentInProgress[idx]
      studentCompleted[idx] = true
    } else {
      // 3º toque: Volta a nenhum (desmarcar por engano)
      delete studentInProgress[idx]
      delete studentCompleted[idx]
    }

    setInProgressMap((prev) => ({
      ...prev,
      [studentId]: studentInProgress,
    }))
    setCompletedMap((prev) => ({
      ...prev,
      [studentId]: studentCompleted,
    }))

    // REQUISITO: Se for Ficha Modelo (aula avulsa / visitante), NÃO salvar histórico no banco
    if (isTemplateSessionKey(studentId)) {
      return
    }

    // Persistência na nuvem (PocketBase) para alunos fixos
    const sheet = sheetsMap[studentId]
    const currentSeries = activeSeriesMap[studentId] || 'A'
    if (!sheet) return

    const exercisesInSeries = sheet.series_data?.[currentSeries] || []
    const completedIndices = Object.keys(studentCompleted)
      .map(Number)
      .filter((i) => studentCompleted[i])
      .sort((a, b) => a - b)
    const inProgressIndices = Object.keys(studentInProgress)
      .map(Number)
      .filter((i) => studentInProgress[i])
      .sort((a, b) => a - b)

    const isAllDone =
      exercisesInSeries.length > 0 && completedIndices.length === exercisesInSeries.length

    try {
      const saved = await workoutProgressService.saveExerciseProgress({
        id: sessionRecordMap[studentId],
        student: studentId,
        training_sheet: sheet.id,
        series_completed: currentSeries,
        completed_indices: completedIndices,
        in_progress_indices: inProgressIndices,
        is_completed: isAllDone,
        exercises_snapshot: exercisesInSeries,
        notes: isAllDone
          ? `Série ${currentSeries} 100% concluída`
          : inProgressIndices.length > 0
            ? `Executando exercício #${inProgressIndices.map((i) => i + 1).join(', #')} (${completedIndices.length}/${exercisesInSeries.length} concluídos)`
            : `Em andamento (${completedIndices.length}/${exercisesInSeries.length})`,
      })
      if (saved && saved.id) {
        setSessionRecordMap((prev) => ({
          ...prev,
          [studentId]: saved.id,
        }))
      }
    } catch (err) {
      console.error('Erro ao sincronizar exercício no backend:', err)
    }
  }

  // Atualização inline de um bloco de exercício da ficha
  const handleUpdateExerciseBlock = async (
    studentId: string,
    sheetId: string,
    seriesKey: SeriesKey,
    exerciseIndex: number,
    updatedBlock: ExerciseBlock,
  ): Promise<boolean> => {
    const currentSheet = sheetsMap[studentId]
    if (!currentSheet) return false

    const currentSeriesList = [...(currentSheet.series_data?.[seriesKey] || [])]
    if (exerciseIndex < 0 || exerciseIndex >= currentSeriesList.length) return false

    // Monta a nova lista de exercícios preservando id e ordem
    const updatedList = [...currentSeriesList]
    updatedList[exerciseIndex] = {
      ...updatedList[exerciseIndex],
      ...updatedBlock,
    }

    const updatedSeriesData: SeriesData = {
      ...(currentSheet.series_data || {}),
      [seriesKey]: updatedList,
    }

    // Se for Ficha Modelo, atualiza somente o estado local / template storage em memória se custom
    if (isTemplateSessionKey(studentId)) {
      const updatedSheet: TrainingSheet = {
        ...currentSheet,
        series_data: updatedSeriesData,
      }
      setSheetsMap((prev) => ({
        ...prev,
        [studentId]: updatedSheet,
      }))
      toast({
        title: 'Treino atualizado',
        description: 'Alterações aplicadas na sessão do modelo.',
      })
      return true
    }

    try {
      const savedSheet = await trainingSheetsService.update(sheetId, {
        series_data: updatedSeriesData,
      })

      // Atualiza o estado local imediatamente
      setSheetsMap((prev) => ({
        ...prev,
        [studentId]: savedSheet,
      }))

      toast({
        title: 'Treino atualizado em tempo real',
        description: 'Alterações salvas na ficha do aluno.',
      })
      return true
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar exercício',
        description: err instanceof Error ? err.message : 'Falha ao gravar no backend',
        variant: 'destructive',
      })
      return false
    }
  }

  // Adicionar exercício diretamente na tela de treino
  const handleAddExerciseToSeries = async (
    studentId: string,
    sheetId: string,
    seriesKey: SeriesKey,
    exercise: Exercise,
  ): Promise<boolean> => {
    const currentSheet = sheetsMap[studentId]
    if (!currentSheet) return false

    const currentSeriesList = [...(currentSheet.series_data?.[seriesKey] || [])]
    const newBlock: ExerciseBlock = {
      exercise_id: exercise.id,
      sets: 3,
      reps: '10 a 12',
      time: '60s',
      load: 'Carga inicial',
      notes: '',
      order: currentSeriesList.length + 1,
    }

    const updatedSeriesData: SeriesData = {
      ...(currentSheet.series_data || {}),
      [seriesKey]: [...currentSeriesList, newBlock],
    }

    if (isTemplateSessionKey(studentId)) {
      setSheetsMap((prev) => ({
        ...prev,
        [studentId]: {
          ...currentSheet,
          series_data: updatedSeriesData,
        },
      }))
      toast({
        title: 'Exercício adicionado',
        description: `${exercise.name} inserido na Série ${seriesKey}.`,
      })
      return true
    }

    try {
      const savedSheet = await trainingSheetsService.update(sheetId, {
        series_data: updatedSeriesData,
      })

      setSheetsMap((prev) => ({
        ...prev,
        [studentId]: savedSheet,
      }))

      toast({
        title: 'Exercício adicionado',
        description: `${exercise.name} inserido na Série ${seriesKey}.`,
      })
      return true
    } catch (err: unknown) {
      toast({
        title: 'Erro ao adicionar exercício',
        description: err instanceof Error ? err.message : 'Falha ao salvar no backend',
        variant: 'destructive',
      })
      return false
    }
  }

  // Remover exercício diretamente na tela de treino
  const handleRemoveExerciseFromSeries = async (
    studentId: string,
    sheetId: string,
    seriesKey: SeriesKey,
    exerciseIndex: number,
  ): Promise<boolean> => {
    const currentSheet = sheetsMap[studentId]
    if (!currentSheet) return false

    const currentSeriesList = [...(currentSheet.series_data?.[seriesKey] || [])]
    if (exerciseIndex < 0 || exerciseIndex >= currentSeriesList.length) return false

    const updatedList = currentSeriesList
      .filter((_, idx) => idx !== exerciseIndex)
      .map((block, idx) => ({ ...block, order: idx + 1 }))

    const updatedSeriesData: SeriesData = {
      ...(currentSheet.series_data || {}),
      [seriesKey]: updatedList,
    }

    if (isTemplateSessionKey(studentId)) {
      setSheetsMap((prev) => ({
        ...prev,
        [studentId]: {
          ...currentSheet,
          series_data: updatedSeriesData,
        },
      }))
      setCompletedMap((prev) => {
        const studentChecks = { ...(prev[studentId] || {}) }
        delete studentChecks[exerciseIndex]
        return {
          ...prev,
          [studentId]: studentChecks,
        }
      })
      toast({
        title: 'Exercício removido',
        description: `Exercício removido da Série ${seriesKey}.`,
      })
      return true
    }

    try {
      const savedSheet = await trainingSheetsService.update(sheetId, {
        series_data: updatedSeriesData,
      })

      setSheetsMap((prev) => ({
        ...prev,
        [studentId]: savedSheet,
      }))

      // Ajusta os completedMap eliminando o índice removido
      setCompletedMap((prev) => {
        const studentChecks = { ...(prev[studentId] || {}) }
        delete studentChecks[exerciseIndex]
        return {
          ...prev,
          [studentId]: studentChecks,
        }
      })

      toast({
        title: 'Exercício removido',
        description: `Exercício removido da Série ${seriesKey}.`,
      })
      return true
    } catch (err: unknown) {
      toast({
        title: 'Erro ao remover exercício',
        description: err instanceof Error ? err.message : 'Falha no backend',
        variant: 'destructive',
      })
      return false
    }
  }

  // Exportar/Compartilhar Ficha do Aluno em PDF
  const handleExportPdf = async (student: Student, sheet: TrainingSheet) => {
    try {
      const result = await shareOrExportSheet({
        student,
        sheet,
        exercisesMap,
        studioName: appearance.studio_name,
        primaryColor: appearance.primary_color,
        logoUrl: appearance.logo_url,
        completedSessionsCount: completedSessionsCountMap[student.id] || 0,
      })
      if (result === 'opened') {
        toast({
          title: 'Ficha Pronta para Exportação / PDF',
          description: 'A janela de impressão foi aberta. Selecione "Salvar como PDF" ou imprima.',
        })
      }
    } catch {
      openSheetPrintWindow({
        student,
        sheet,
        exercisesMap,
        studioName: appearance.studio_name,
        primaryColor: appearance.primary_color,
        logoUrl: appearance.logo_url,
        completedSessionsCount: completedSessionsCountMap[student.id] || 0,
      })
    }
  }

  // Concluir série de um aluno e salvar no backend (ou apenas em memória para modelo)
  const handleCompleteSeries = async (student: Student) => {
    const sheet = sheetsMap[student.id]
    if (!sheet) return

    const currentSeries = activeSeriesMap[student.id] || 'A'
    const exercisesInSeries = sheet.series_data?.[currentSeries] || []
    const availableKeys = getAvailableSeriesKeys(sheet.series_data)
    const nextKey = getNextSeriesKey(currentSeries, availableKeys)

    // REQUISITO: Se for ficha modelo, NÃO salvar histórico no banco
    if (isTemplateSessionKey(student.id)) {
      setAdvanceDialog({
        student,
        completedSeries: currentSeries,
        nextSeries: nextKey,
      })
      setCompletedMap((prev) => ({
        ...prev,
        [student.id]: {},
      }))
      setInProgressMap((prev) => ({
        ...prev,
        [student.id]: {},
      }))
      toast({
        title: `Série ${currentSeries} concluída!`,
        description: `Treino modelo executado com sucesso (sem gravação de histórico).`,
      })
      return
    }

    const allIndices = exercisesInSeries.map((_, i) => i)
    try {
      await workoutProgressService.saveExerciseProgress({
        id: sessionRecordMap[student.id],
        student: student.id,
        training_sheet: sheet.id,
        series_completed: currentSeries,
        completed_indices: allIndices,
        is_completed: true,
        exercises_snapshot: exercisesInSeries,
        notes: `Concluído em aula pelo Studio Bru Oliveira`,
      })

      // Abrir modal de confirmação "Série X concluída! Marcar a próxima?"
      setAdvanceDialog({
        student,
        completedSeries: currentSeries,
        nextSeries: nextKey,
      })

      // Limpar checks e execuções da série atual desse aluno
      setCompletedMap((prev) => ({
        ...prev,
        [student.id]: {},
      }))
      setInProgressMap((prev) => ({
        ...prev,
        [student.id]: {},
      }))
      setSessionRecordMap((prev) => {
        const next = { ...prev }
        delete next[student.id]
        return next
      })
      // Atualizar contagem de sessões concluídas
      const updatedCount = await workoutProgressService.countCompletedSessions(student.id, sheet.id)
      setCompletedSessionsCountMap((prev) => ({
        ...prev,
        [student.id]: updatedCount,
      }))

      toast({
        title: `Série ${currentSeries} concluída!`,
        description: `Progresso salvo para ${student.name}.`,
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao registrar progresso',
        description: err instanceof Error ? err.message : 'Falha na gravação',
        variant: 'destructive',
      })
    }
  }

  // Confirmar avanço para a próxima série
  const handleConfirmAdvanceSeries = () => {
    if (!advanceDialog) return
    const { student, nextSeries } = advanceDialog
    setActiveSeriesMap((prev) => ({
      ...prev,
      [student.id]: nextSeries,
    }))
    setAdvanceDialog(null)
  }

  // Concluir toda a ficha de treino
  const handleCompleteEntireSheet = async () => {
    if (!sheetCompleteConfirm) return
    const { student, sheet } = sheetCompleteConfirm

    const currentSeries = activeSeriesMap[student.id] || 'A'
    const currentExercises = sheet.series_data?.[currentSeries] || []

    // REQUISITO: Se for ficha modelo, NÃO salvar histórico no banco
    if (isTemplateSessionKey(student.id)) {
      const allDone: Record<number, boolean> = {}
      currentExercises.forEach((_, i) => {
        allDone[i] = true
      })
      setCompletedMap((prev) => ({
        ...prev,
        [student.id]: allDone,
      }))
      setInProgressMap((prev) => ({
        ...prev,
        [student.id]: {},
      }))
      toast({
        title: 'Ficha Concluída com Sucesso! 🎯',
        description: `Treino modelo concluído (aula avulsa, sem gravação no histórico).`,
      })
      setSheetCompleteConfirm(null)
      return
    }

    try {
      // Registra a série atual como salva no histórico
      const allIndices = currentExercises.map((_, i) => i)

      await workoutProgressService.saveExerciseProgress({
        id: sessionRecordMap[student.id],
        student: student.id,
        training_sheet: sheet.id,
        series_completed: currentSeries,
        completed_indices: allIndices,
        is_completed: true,
        exercises_snapshot: sheet.series_data?.[currentSeries] || [],
        notes: `Ficha inteira concluída na sessão`,
      })

      // Marcar todos os exercícios como concluídos visualmente e limpar em execução
      const allDone: Record<number, boolean> = {}
      currentExercises.forEach((_, i) => {
        allDone[i] = true
      })

      setCompletedMap((prev) => ({
        ...prev,
        [student.id]: allDone,
      }))
      setInProgressMap((prev) => ({
        ...prev,
        [student.id]: {},
      }))

      const updatedCount = await workoutProgressService.countCompletedSessions(student.id, sheet.id)
      setCompletedSessionsCountMap((prev) => ({
        ...prev,
        [student.id]: updatedCount,
      }))

      toast({
        title: 'Ficha Concluída com Sucesso! 🎯',
        description: `Treino de ${student.name} finalizado e registrado no histórico.`,
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao concluir ficha',
        description: err instanceof Error ? err.message : 'Falha ao salvar',
        variant: 'destructive',
      })
    } finally {
      setSheetCompleteConfirm(null)
    }
  }

  // Abrir modal para editar data de início da ficha
  const handleOpenEditStartDate = (sheet: TrainingSheet) => {
    setEditingStartDateSheet(sheet)
    const currentVal = sheet.start_date || sheet.created
    if (currentVal) {
      setNewStartDateInput(currentVal.split('T')[0])
    } else {
      setNewStartDateInput(new Date().toISOString().split('T')[0])
    }
  }

  // Salvar nova data de início da ficha
  const handleSaveStartDate = async () => {
    if (!editingStartDateSheet || !newStartDateInput) return
    setSavingStartDate(true)
    try {
      const updated = await trainingSheetsService.update(editingStartDateSheet.id, {
        start_date: safeDateToISO(newStartDateInput),
      })
      setSheetsMap((prev) => ({
        ...prev,
        [editingStartDateSheet.student]: updated,
      }))
      toast({
        title: 'Data de início atualizada',
        description: 'A nova data agora é refletida no treino e nos PDFs da ficha.',
      })
      setEditingStartDateSheet(null)
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar data de início',
        description: err instanceof Error ? err.message : 'Falha na gravação',
        variant: 'destructive',
      })
    } finally {
      setSavingStartDate(false)
    }
  }

  // Filtragem de alunos para a barra de pesquisa
  const filteredSearchStudents = allStudents.filter((st) => {
    if (!studentSearch.trim()) return false
    const term = studentSearch.toLowerCase()
    return st.name.toLowerCase().includes(term)
  })

  return (
    <div className="flex flex-col flex-1 min-h-0 max-w-full space-y-2.5 sm:space-y-3 animate-fade-in h-full">
      {/* BARRA SUPERIOR DE CONTROLE E SELEÇÃO DE ALUNOS (compacta no modo multi-ficha) */}
      <div
        className={`bg-card/60 border border-border rounded-2xl shadow-md shrink-0 transition-all ${
          selectedStudents.length > 1 ? 'p-2 sm:p-2.5' : 'p-2.5 sm:p-3'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
          {/* Alunos Selecionados (Chips) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider text-[#8A8F98] font-bold mr-1 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" /> Sessão ({selectedStudents.length}/4):
            </span>

            {selectedStudents.length === 0 ? (
              <span className="text-xs text-[#8A8F98] italic">
                Nenhum aluno selecionado. Pesquise abaixo para começar.
              </span>
            ) : (
              selectedStudents.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center gap-2 bg-[#2A2A2A] border border-[#3A3A3A] px-3 py-1.5 rounded-xl text-xs font-semibold text-white animate-fade-in"
                >
                  <span className="truncate max-w-[120px] sm:max-w-[160px]">{st.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStudentFromSession(st.id)}
                    className="text-[#8A8F98] hover:text-white p-0.5 rounded"
                    title="Remover da sessão"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Busca e Adição de Alunos */}
          <div className="relative min-w-[260px] sm:w-80">
            <div className="relative">
              <Input
                placeholder="Pesquisar aluno para a aula..."
                value={studentSearch}
                onFocus={() => setSearchDropdownOpen(true)}
                onChange={(e) => {
                  setStudentSearch(e.target.value)
                  setSearchDropdownOpen(true)
                }}
                className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-11 pl-9 pr-3 text-sm focus-visible:ring-primary"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
            </div>

            {/* Dropdown de Alunos */}
            {searchDropdownOpen && filteredSearchStudents.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto p-1.5 space-y-1 animate-fade-in">
                {filteredSearchStudents.map((st) => {
                  const isAlreadySelected = selectedStudentIds.includes(st.id)
                  return (
                    <button
                      key={st.id}
                      type="button"
                      disabled={isAlreadySelected}
                      onClick={() => handleAddStudentToSession(st)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                        isAlreadySelected
                          ? 'opacity-40 cursor-not-allowed bg-black/20 text-[#8A8F98]'
                          : 'hover:bg-[#2A2A2A] text-white'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold truncate">{st.name}</span>
                        <span className="text-[10px] text-[#8A8F98]">
                          {st.phone || 'Sem telefone'}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-primary shrink-0">
                        {isAlreadySelected ? 'Na sessão' : '+ Adicionar'}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ÁREA DE TREINO PRINCIPAL */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#8A8F98] gap-3">
          <Loader2 className="w-9 h-9 animate-spin text-primary" />
          <p className="text-sm">Carregando painel de condução de treinos...</p>
        </div>
      ) : selectedStudents.length === 0 ? (
        /* Empty State com busca em destaque */
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/25 mx-auto">
              <PlaySquare className="w-8 h-8 text-white stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Pesquise os alunos para iniciar a sessão
              </h2>
              <p className="text-sm text-[#8A8F98] max-w-sm mx-auto">
                Selecione até 4 alunos simultâneos. As fichas abrirão lado a lado no tablet ou em
                abas deslizáveis no celular.
              </p>
            </div>

            {/* Acesso rápido aos alunos cadastrados */}
            <div className="pt-2 border-t border-[#2A2A2A]">
              <p className="text-xs text-[#8A8F98] mb-3 font-medium">
                Ou selecione rapidamente um aluno:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {allStudents.slice(0, 5).map((st) => (
                  <Button
                    key={st.id}
                    variant="outline"
                    onClick={() => handleAddStudentToSession(st)}
                    className="border-[#2E2E2E] bg-[#141414] hover:bg-[#2A2A2A] text-white text-xs h-9 px-3"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-primary" /> {st.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* RENDERIZAÇÃO RESPONSIVA */
        <div className="flex-1 flex flex-col min-h-0">
          {/* LAYOUT DESKTOP / TABLET (>= 1024px) — RESPONSIVO AO Nº REAL DE ALUNOS NA SESSÃO */}
          <div
            className={`hidden lg:grid gap-2.5 flex-1 min-h-0 ${
              selectedStudents.length === 1
                ? 'grid-cols-1 max-w-3xl mx-auto w-full'
                : selectedStudents.length === 2
                  ? 'grid-cols-2'
                  : selectedStudents.length === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-2 xl:grid-cols-4'
            }`}
          >
            {selectedStudents.map((st) => {
              const sheet = sheetsMap[st.id] || null
              const activeSeries = activeSeriesMap[st.id] || 'A'
              const completedExercises = completedMap[st.id] || {}

              return (
                <div key={st.id} className="h-full min-h-0 flex flex-col">
                  <StudentTrainingColumn
                    student={st}
                    sheet={sheet}
                    activeSeries={activeSeries}
                    onSelectSeries={(series) => handleSelectSeriesForStudent(st.id, series)}
                    completedExercises={completedExercises}
                    inProgressExercises={inProgressMap[st.id] || {}}
                    onToggleExercise={(idx) => handleToggleExercise(st.id, idx)}
                    onOpenAnamnese={() => {
                      if (isTemplateSessionKey(st.id)) {
                        toast({
                          title: 'Ficha Modelo',
                          description: 'Fichas modelo não possuem anamnese de aluno fixo.',
                        })
                        return
                      }
                      setAnamneseStudent(st)
                    }}
                    onEditStartDate={handleOpenEditStartDate}
                    onEditStudent={() => {
                      if (isTemplateSessionKey(st.id)) {
                        navigate('/fichas')
                        return
                      }
                      navigate(`/alunos/${st.id}/editar`)
                    }}
                    onOpenVideo={(ex) =>
                      setActiveVideo({
                        title: ex.name,
                        youtubeId: ex.youtube_id,
                        youtubeUrl: ex.youtube_url,
                      })
                    }
                    onCompleteSeries={() => handleCompleteSeries(st)}
                    onCompleteSheet={() =>
                      sheet &&
                      setSheetCompleteConfirm({
                        student: st,
                        sheet,
                      })
                    }
                    exercisesMap={exercisesMap}
                    onUpdateExerciseBlock={handleUpdateExerciseBlock}
                    onAddExerciseToSeries={handleAddExerciseToSeries}
                    onRemoveExerciseFromSeries={handleRemoveExerciseFromSeries}
                    onExportPdf={handleExportPdf}
                    canEdit={canEditTraining}
                    completedSessionsCount={completedSessionsCountMap[st.id] ?? 0}
                  />
                </div>
              )
            })}
          </div>

          {/* LAYOUT MOBILE & TABLET PORTRAIT (< 1024px) — ABAS E CARROSSEL */}
          <div className="lg:hidden flex flex-col flex-1 min-h-0">
            {/* Tabs dos Alunos no topo */}
            {selectedStudents.length > 1 && (
              <div className="flex items-center gap-2 pb-2 shrink-0 overflow-x-auto">
                {selectedStudents.map((st, idx) => {
                  const isActive = mobileActiveIndex === idx
                  const initials = st.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0].toUpperCase())
                    .join('')

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setMobileActiveIndex(idx)}
                      className={`flex-1 min-w-[110px] min-h-[40px] flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all border ${
                        isActive
                          ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/25'
                          : 'bg-[#1E1E1E] border-[#2E2E2E] text-[#8A8F98] hover:text-white'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center text-[10px] font-bold">
                        {initials}
                      </span>
                      <span className="truncate">{st.name.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Coluna do Aluno Ativo no Mobile */}
            {selectedStudents[mobileActiveIndex] && (
              <div className="flex-1 min-h-0 flex flex-col">
                <StudentTrainingColumn
                  student={selectedStudents[mobileActiveIndex]}
                  sheet={sheetsMap[selectedStudents[mobileActiveIndex].id] || null}
                  activeSeries={activeSeriesMap[selectedStudents[mobileActiveIndex].id] || 'A'}
                  onSelectSeries={(series) =>
                    handleSelectSeriesForStudent(selectedStudents[mobileActiveIndex].id, series)
                  }
                  completedExercises={completedMap[selectedStudents[mobileActiveIndex].id] || {}}
                  inProgressExercises={inProgressMap[selectedStudents[mobileActiveIndex].id] || {}}
                  onToggleExercise={(idx) =>
                    handleToggleExercise(selectedStudents[mobileActiveIndex].id, idx)
                  }
                  onOpenAnamnese={() => {
                    const st = selectedStudents[mobileActiveIndex]
                    if (isTemplateSessionKey(st.id)) {
                      toast({
                        title: 'Ficha Modelo',
                        description: 'Fichas modelo não possuem anamnese de aluno fixo.',
                      })
                      return
                    }
                    setAnamneseStudent(st)
                  }}
                  onEditStartDate={handleOpenEditStartDate}
                  onEditStudent={() => {
                    const st = selectedStudents[mobileActiveIndex]
                    if (isTemplateSessionKey(st.id)) {
                      navigate('/fichas')
                      return
                    }
                    navigate(`/alunos/${st.id}/editar`)
                  }}
                  onOpenVideo={(ex) =>
                    setActiveVideo({
                      title: ex.name,
                      youtubeId: ex.youtube_id,
                      youtubeUrl: ex.youtube_url,
                    })
                  }
                  onCompleteSeries={() => handleCompleteSeries(selectedStudents[mobileActiveIndex])}
                  onCompleteSheet={() => {
                    const st = selectedStudents[mobileActiveIndex]
                    const sheet = sheetsMap[st.id]
                    if (sheet) {
                      setSheetCompleteConfirm({ student: st, sheet })
                    }
                  }}
                  exercisesMap={exercisesMap}
                  onUpdateExerciseBlock={handleUpdateExerciseBlock}
                  onAddExerciseToSeries={handleAddExerciseToSeries}
                  onRemoveExerciseFromSeries={handleRemoveExerciseFromSeries}
                  onExportPdf={handleExportPdf}
                  canEdit={canEditTraining}
                  completedSessionsCount={
                    completedSessionsCountMap[selectedStudents[mobileActiveIndex].id] ?? 0
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE ANAMNESE RÁPIDA (Sem sair da tela de treino) */}
      <AnamneseModal
        isOpen={Boolean(anamneseStudent)}
        onClose={() => setAnamneseStudent(null)}
        student={anamneseStudent}
      />

      {/* MODAL DE PLAYER DE VÍDEO DO YOUTUBE */}
      <VideoModal
        isOpen={Boolean(activeVideo)}
        onClose={() => setActiveVideo(null)}
        title={activeVideo?.title || ''}
        youtubeId={activeVideo?.youtubeId}
        youtubeUrl={activeVideo?.youtubeUrl}
      />

      {/* MODAL DE AVANÇO DE SÉRIE ("Série X concluída! Marcar a próxima?") */}
      <Dialog
        open={Boolean(advanceDialog)}
        onOpenChange={(open) => !open && setAdvanceDialog(null)}
      >
        <DialogContent className="bg-card border-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Série {advanceDialog?.completedSeries} concluída!
            </DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              O treino de <strong className="text-white">{advanceDialog?.student.name}</strong> para
              a Série {advanceDialog?.completedSeries} foi salvo no histórico com data e horário.
              Deseja já avançar a ficha para a Série {advanceDialog?.nextSeries}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAdvanceDialog(null)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Agora não
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAdvanceSeries}
              className="bg-primary hover:opacity-90 text-primary-foreground font-semibold"
            >
              Sim, avançar para Série {advanceDialog?.nextSeries}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE EDITAR DATA DE INÍCIO DA FICHA */}
      <Dialog
        open={Boolean(editingStartDateSheet)}
        onOpenChange={(open) => !open && setEditingStartDateSheet(null)}
      >
        <DialogContent className="bg-card border-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Alterar Data de Início da Ficha
            </DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              Altere a data oficial de início da ficha de{' '}
              <strong className="text-white">
                {editingStartDateSheet?.expand?.student?.name || 'aluno'}
              </strong>
              . Essa data será exibida no treino, nos cabeçalhos e na ficha impressa/PDF.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <label
              htmlFor="startDateInput"
              className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold block"
            >
              Nova data de início
            </label>
            <Input
              id="startDateInput"
              type="date"
              value={newStartDateInput}
              onChange={(e) => setNewStartDateInput(e.target.value)}
              className="bg-[#121522] border-[#252B3E] text-white h-11 focus-visible:ring-primary"
            />
          </div>

          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={savingStartDate}
              onClick={() => setEditingStartDateSheet(null)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={savingStartDate || !newStartDateInput}
              onClick={handleSaveStartDate}
              className="bg-primary hover:opacity-90 text-primary-foreground font-semibold"
            >
              {savingStartDate ? 'Salvando...' : 'Salvar Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE MARCAR TODA A FICHA COMO CONCLUÍDA */}
      <Dialog
        open={Boolean(sheetCompleteConfirm)}
        onOpenChange={(open) => !open && setSheetCompleteConfirm(null)}
      >
        <DialogContent className="bg-card border-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> Marcar toda a ficha como concluída?
            </DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              Confirmar a conclusão de toda a ficha para o aluno{' '}
              <strong className="text-white">{sheetCompleteConfirm?.student.name}</strong>? Isso
              marcará todos os exercícios e registrará a data e hora no histórico da aula.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSheetCompleteConfirm(null)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCompleteEntireSheet}
              className="bg-[#2EA55B] hover:bg-[#289150] text-white font-semibold"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
