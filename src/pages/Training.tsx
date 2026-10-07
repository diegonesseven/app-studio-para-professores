import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { studentsService } from '@/services/students'
import { trainingSheetsService } from '@/services/trainingSheets'
import { exercisesService } from '@/services/exercises'
import { workoutProgressService } from '@/services/workoutProgress'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/contexts/AuthContext'
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

export default function Training() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isProfessor, isAdmin } = useAuth()
  const canEditTraining = isProfessor || isAdmin

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
  const [exercisesMap, setExercisesMap] = useState<Record<string, Exercise>>({})

  // Série ativa por aluno: { [studentId]: 'A' | 'B' | ... }
  const [activeSeriesMap, setActiveSeriesMap] = useState<Record<string, SeriesKey>>({})

  // Exercícios marcados como feitos na sessão: { [studentId]: { [exerciseIndex]: true } }
  const [completedMap, setCompletedMap] = useState<Record<string, Record<number, boolean>>>({})

  // ID do registro de progresso em andamento na nuvem: { [studentId]: recordId }
  const [sessionRecordMap, setSessionRecordMap] = useState<Record<string, string>>({})

  // Mobile carrossel tab ativa (índice 0, 1 ou 2)
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

  // 2. Carregar dados dos alunos selecionados quando a URL mudar
  useEffect(() => {
    async function loadSelectedSession() {
      if (selectedStudentIds.length === 0) {
        setSelectedStudents([])
        setSheetsMap({})
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const studentsData = await Promise.all(
          selectedStudentIds.map((id) => studentsService.getById(id)),
        )
        setSelectedStudents(studentsData)

        // Carregar fichas e histórico recente de cada aluno para determinar onde começar
        const newSheetsMap: Record<string, TrainingSheet | null> = {}
        const newSeriesMap: Record<string, SeriesKey> = { ...activeSeriesMap }
        const newCompletedMap: Record<string, Record<number, boolean>> = { ...completedMap }
        const newSessionRecords: Record<string, string> = { ...sessionRecordMap }

        await Promise.all(
          studentsData.map(async (st) => {
            const sheet = await trainingSheetsService.getByStudent(st.id)
            newSheetsMap[st.id] = sheet

            // Descobre o último registro do aluno no backend
            const latest = await workoutProgressService.getLatestByStudent(st.id)

            let seriesToOpen: SeriesKey = newSeriesMap[st.id] || 'A'
            let initialCompleted: Record<number, boolean> = {}

            if (latest && !newSeriesMap[st.id]) {
              // Verifica se a série mais recente NÃO foi concluída inteiramente (continuidade)
              const seriesExercises = sheet?.series_data?.[latest.series_completed] || []
              const totalEx = seriesExercises.length
              const savedIndices = latest.completed_indices || []
              const hasUnfinishedExercises =
                latest.is_completed === false ||
                (totalEx > 0 && savedIndices.length < totalEx && latest.is_completed !== true)

              if (hasUnfinishedExercises) {
                // CONTINUIDADE: mantém a mesma série aberta no ponto onde parou!
                seriesToOpen = latest.series_completed
                savedIndices.forEach((i) => {
                  initialCompleted[i] = true
                })
                newSessionRecords[st.id] = latest.id
              } else {
                // Série 100% concluída: avança para a próxima série
                const keys: SeriesKey[] = ['A', 'B', 'C', 'D', 'E']
                const idx = keys.indexOf(latest.series_completed)
                seriesToOpen = keys[(idx + 1) % keys.length]
              }
            }

            newSeriesMap[st.id] = seriesToOpen
            if (Object.keys(initialCompleted).length > 0) {
              newCompletedMap[st.id] = initialCompleted
            }
          }),
        )

        setSheetsMap(newSheetsMap)
        setActiveSeriesMap(newSeriesMap)
        setCompletedMap(newCompletedMap)
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
  }, [studentIdsParam])

  // Adicionar aluno à sessão (Máximo 3)
  const handleAddStudentToSession = (student: Student) => {
    if (selectedStudentIds.includes(student.id)) {
      setStudentSearch('')
      setSearchDropdownOpen(false)
      return
    }

    if (selectedStudentIds.length >= 3) {
      toast({
        title: 'Limite atingido',
        description: 'Máximo de 3 alunos por sessão para garantir a melhor atenção.',
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

    try {
      const existing = await workoutProgressService.getActiveSession(studentId, sheet.id, seriesKey)
      if (existing && existing.completed_indices) {
        const cMap: Record<number, boolean> = {}
        existing.completed_indices.forEach((idx) => {
          cMap[idx] = true
        })
        setCompletedMap((prev) => ({
          ...prev,
          [studentId]: cMap,
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
      }
    } catch {
      /* intentionally ignored */
    }
  }

  // Marcar/Desmarcar exercício do aluno com persistência imediata na nuvem
  const handleToggleExercise = async (studentId: string, idx: number) => {
    const studentMap = { ...(completedMap[studentId] || {}) }
    const nextVal = !studentMap[idx]
    if (nextVal) {
      studentMap[idx] = true
    } else {
      delete studentMap[idx]
    }

    setCompletedMap((prev) => ({
      ...prev,
      [studentId]: studentMap,
    }))

    // Persistência na nuvem (PocketBase) para sincronizar entre dispositivos
    const sheet = sheetsMap[studentId]
    const currentSeries = activeSeriesMap[studentId] || 'A'
    if (!sheet) return

    const exercisesInSeries = sheet.series_data?.[currentSeries] || []
    const completedIndices = Object.keys(studentMap)
      .map(Number)
      .filter((i) => studentMap[i])
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
        is_completed: isAllDone,
        exercises_snapshot: exercisesInSeries,
        notes: isAllDone
          ? `Série ${currentSeries} 100% concluída`
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
      })
    }
  }

  // Concluir série de um aluno e salvar no backend
  const handleCompleteSeries = async (student: Student) => {
    const sheet = sheetsMap[student.id]
    if (!sheet) return

    const currentSeries = activeSeriesMap[student.id] || 'A'
    const exercisesInSeries = sheet.series_data?.[currentSeries] || []

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

      // Calcular próxima série
      const keys: SeriesKey[] = ['A', 'B', 'C', 'D', 'E']
      const currentIdx = keys.indexOf(currentSeries)
      const nextKey = keys[(currentIdx + 1) % keys.length]

      // Abrir modal de confirmação "Série X concluída! Marcar a próxima?"
      setAdvanceDialog({
        student,
        completedSeries: currentSeries,
        nextSeries: nextKey,
      })

      // Limpar checks da série atual desse aluno
      setCompletedMap((prev) => ({
        ...prev,
        [student.id]: {},
      }))
      setSessionRecordMap((prev) => {
        const next = { ...prev }
        delete next[student.id]
        return next
      })

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

    try {
      // Registra a série atual como salva no histórico
      const currentSeries = activeSeriesMap[student.id] || 'A'
      const currentExercises = sheet.series_data?.[currentSeries] || []
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

      // Marcar todos os exercícios como checados visualmente
      const allDone: Record<number, boolean> = {}
      currentExercises.forEach((_, i) => {
        allDone[i] = true
      })

      setCompletedMap((prev) => ({
        ...prev,
        [student.id]: allDone,
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

  // Filtragem de alunos para a barra de pesquisa
  const filteredSearchStudents = allStudents.filter((st) => {
    if (!studentSearch.trim()) return false
    const term = studentSearch.toLowerCase()
    return st.name.toLowerCase().includes(term)
  })

  return (
    <div className="flex flex-col flex-1 min-h-0 max-w-full space-y-2.5 sm:space-y-3 animate-fade-in h-full">
      {/* BARRA SUPERIOR DE CONTROLE E SELEÇÃO DE ALUNOS */}
      <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-2.5 sm:p-3 shadow-md shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Alunos Selecionados (Chips) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider text-[#8A8F98] font-bold mr-1 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" /> Sessão ({selectedStudents.length}/3):
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
          <div className="w-full max-w-lg bg-[#1E1E1E] border border-[#2E2E2E] rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-primary/25 mx-auto">
              <PlaySquare className="w-8 h-8 text-white stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Pesquise os alunos para iniciar a sessão
              </h2>
              <p className="text-sm text-[#8A8F98] max-w-sm mx-auto">
                Selecione até 3 alunos simultâneos. As fichas abrirão lado a lado no tablet ou em
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
                    <Plus className="w-3.5 h-3.5 mr-1 text-[#F06A2A]" /> {st.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* RENDERIZAÇÃO RESPONSIVA */
        <div className="flex-1 flex flex-col min-h-0">
          {/* LAYOUT DESKTOP / TABLET (>= 1024px) — 3 COLUNAS LADO A LADO */}
          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">
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
                    onToggleExercise={(idx) => handleToggleExercise(st.id, idx)}
                    onOpenAnamnese={() => setAnamneseStudent(st)}
                    onEditStudent={() => navigate(`/alunos/${st.id}/editar`)}
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
                  />
                </div>
              )
            })}

            {/* Espaços vazios até 3 colunas para manter proporção perfeita */}
            {Array.from({ length: 3 - selectedStudents.length }).map((_, i) => (
              <div
                key={`empty-col-${i}`}
                className="hidden lg:flex flex-col items-center justify-center border-2 border-dashed border-[#2A2A2A] rounded-2xl p-6 text-center text-[#8A8F98] h-full min-h-0"
              >
                <Users className="w-8 h-8 opacity-30 mb-2" />
                <p className="text-sm font-semibold text-white mb-1">
                  Espaço livre para mais um aluno
                </p>
                <p className="text-xs max-w-xs mb-3">
                  Você pode acompanhar até 3 alunos simultâneos lado a lado em tempo real.
                </p>
              </div>
            ))}
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
                  onToggleExercise={(idx) =>
                    handleToggleExercise(selectedStudents[mobileActiveIndex].id, idx)
                  }
                  onOpenAnamnese={() => setAnamneseStudent(selectedStudents[mobileActiveIndex])}
                  onEditStudent={() =>
                    navigate(`/alunos/${selectedStudents[mobileActiveIndex].id}/editar`)
                  }
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
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
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
              className="bg-[#F06A2A] hover:bg-[#D95C1C] text-white font-semibold"
            >
              Sim, avançar para Série {advanceDialog?.nextSeries}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE MARCAR TODA A FICHA COMO CONCLUÍDA */}
      <Dialog
        open={Boolean(sheetCompleteConfirm)}
        onOpenChange={(open) => !open && setSheetCompleteConfirm(null)}
      >
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#F06A2A]" /> Marcar toda a ficha como
              concluída?
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
