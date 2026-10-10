import React, { useEffect, useState } from 'react'
import type { Student, SeriesKey, TrainingSheet, Exercise, ExerciseBlock } from '@/types'
import { SERIES_KEYS } from '@/types'
import { getAvailableSeriesKeys, getNextSeriesKey } from '@/lib/seriesCycle'
import {
  HeartPulse,
  Edit2,
  Pencil,
  Play,
  Check,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Save,
  X,
  Loader2,
  ArrowRightLeft,
  Plus,
  Trash2,
  Share2,
  Printer,
  ChevronUp,
  ChevronDown,
  Calendar,
  VideoOff,
} from 'lucide-react'
import ExercisePickerModal from '@/components/ExercisePickerModal'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { parseAndFormatDate } from '@/lib/dateUtils'
import { StudentAvatar } from '@/components/StudentAvatar'

interface StudentTrainingColumnProps {
  student: Student
  sheet: TrainingSheet | null
  activeSeries: SeriesKey
  onSelectSeries: (series: SeriesKey) => void
  completedExercises: Record<number, boolean>
  inProgressExercises?: Record<number, boolean>
  onToggleExercise: (index: number) => void
  onOpenAnamnese: () => void
  onEditStudent: () => void
  onOpenVideo: (exercise: Exercise) => void
  onCompleteSeries: () => void
  onCompleteSheet: () => void
  exercisesMap: Record<string, Exercise>
  onUpdateExerciseBlock?: (
    studentId: string,
    sheetId: string,
    seriesKey: SeriesKey,
    exerciseIndex: number,
    updatedBlock: ExerciseBlock,
  ) => Promise<boolean>
  onAddExerciseToSeries?: (
    studentId: string,
    sheetId: string,
    seriesKey: SeriesKey,
    exercise: Exercise,
  ) => Promise<boolean>
  onRemoveExerciseFromSeries?: (
    studentId: string,
    sheetId: string,
    seriesKey: SeriesKey,
    exerciseIndex: number,
  ) => Promise<boolean>
  onExportPdf?: (student: Student, sheet: TrainingSheet) => void
  canEdit?: boolean
  completedSessionsCount?: number
  onEditStartDate?: (sheet: TrainingSheet) => void
}

export default function StudentTrainingColumn({
  student,
  sheet,
  activeSeries,
  onSelectSeries,
  completedExercises,
  inProgressExercises = {},
  onToggleExercise,
  onOpenAnamnese,
  onEditStudent,
  onOpenVideo,
  onCompleteSeries,
  onCompleteSheet,
  exercisesMap,
  onUpdateExerciseBlock,
  onAddExerciseToSeries,
  onRemoveExerciseFromSeries,
  onExportPdf,
  canEdit = true,
  completedSessionsCount,
  onEditStartDate,
}: StudentTrainingColumnProps) {
  const availableKeys = getAvailableSeriesKeys(sheet?.series_data)
  // Garante que a série ativa pertença às séries disponíveis da ficha
  const effectiveActiveSeries = availableKeys.includes(activeSeries)
    ? activeSeries
    : availableKeys[0] || 'A'
  const currentExercises: ExerciseBlock[] = sheet?.series_data?.[effectiveActiveSeries] || []
  const totalCount = currentExercises.length
  const completedCount = currentExercises.filter((_, idx) => completedExercises[idx]).length
  const isSeriesAllDone = totalCount > 0 && completedCount === totalCount

  // Estado da edição inline por exercício (índice do exercício sendo editado)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<ExerciseBlock | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  // Modal de troca / substituição de exercício em si
  const [replaceModalIdx, setReplaceModalIdx] = useState<number | null>(null)
  // Modal de adição rápida de novo exercício na série atual
  const [addExerciseModalOpen, setAddExerciseModalOpen] = useState(false)
  // Controle de exclusão rápida
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null)
  // Controle de notas expandidas por exercício
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({})

  // Layout de 4 colunas simultâneas (Item 5): enxuga rótulos/paddings sem perder legibilidade
  const [isCompactGrid, setIsCompactGrid] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px) and (max-width: 1535px)')
    const update = () => setIsCompactGrid(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const toggleNote = (idx: number) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  const handleStartEdit = (idx: number, block: ExerciseBlock) => {
    setEditingIndex(idx)
    setEditDraft({ ...block })
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditDraft(null)
  }

  const handleSaveEdit = async (idx: number) => {
    if (!editDraft || !sheet || !onUpdateExerciseBlock) return
    const finalDraft: ExerciseBlock = {
      ...editDraft,
      sets: Math.max(1, editDraft.sets || 1),
    }
    setSavingEdit(true)
    try {
      const ok = await onUpdateExerciseBlock(student.id, sheet.id, activeSeries, idx, finalDraft)
      if (ok) {
        setEditingIndex(null)
        setEditDraft(null)
      }
    } finally {
      setSavingEdit(false)
    }
  }

  // Substituição direta do exercício (ex: Leg press -> Extensora) mantendo posição e parâmetros
  const handleReplaceExercise = async (targetIdx: number, newExercise: Exercise) => {
    if (!sheet || !onUpdateExerciseBlock) return
    const currentBlock = currentExercises[targetIdx]
    if (!currentBlock) return

    const updatedBlock: ExerciseBlock = {
      ...currentBlock,
      exercise_id: newExercise.id,
      // Se estiver editando este card no momento, atualiza também o draft ativo
      exercise: newExercise,
    }

    if (editingIndex === targetIdx && editDraft) {
      setEditDraft({
        ...editDraft,
        exercise_id: newExercise.id,
      })
    }

    setSavingEdit(true)
    try {
      await onUpdateExerciseBlock(student.id, sheet.id, activeSeries, targetIdx, updatedBlock)
    } finally {
      setSavingEdit(false)
      setReplaceModalIdx(null)
    }
  }

  // Remoção de um exercício diretamente na tela de treino
  const handleRemoveExercise = async (idx: number) => {
    if (!sheet || !onRemoveExerciseFromSeries) return
    setDeletingIdx(idx)
    try {
      await onRemoveExerciseFromSeries(student.id, sheet.id, activeSeries, idx)
      if (editingIndex === idx) {
        setEditingIndex(null)
        setEditDraft(null)
      }
    } finally {
      setDeletingIdx(null)
    }
  }

  // Adição de novo exercício na série atual diretamente na tela de treino
  const handleAddExerciseToCurrentSeries = async (newExercise: Exercise) => {
    if (!sheet || !onAddExerciseToSeries) return
    setSavingEdit(true)
    try {
      await onAddExerciseToSeries(student.id, sheet.id, activeSeries, newExercise)
    } finally {
      setSavingEdit(false)
      setAddExerciseModalOpen(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
      {/* HEADER DO ALUNO - otimizado verticalmente */}
      <div className="px-2 py-1.5 sm:px-2.5 sm:py-2 bg-card/60 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onEditStudent}
              className="rounded-full hover:scale-105 transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-primary"
              title={`Ver cadastro de ${student.name} na aba Alunos`}
              aria-label={`Ver cadastro de ${student.name} na aba Alunos`}
            >
              <StudentAvatar
                student={student}
                className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-primary/40 hover:border-primary"
                textClassName="text-xs font-black"
                alt={student.name}
              />
            </button>
            <div className="min-w-0">
              <button
                type="button"
                onClick={onEditStudent}
                className="text-left group/name block max-w-full cursor-pointer"
                title={`Ver cadastro de ${student.name} na aba Alunos`}
                aria-label={`Ver cadastro de ${student.name} na aba Alunos`}
              >
                <h2 className="text-xs sm:text-sm font-black text-foreground group-hover/name:text-primary transition-colors leading-tight break-words underline-offset-2 hover:underline line-clamp-1">
                  {student.name}
                </h2>
              </button>
              <span className="text-[10px] text-muted-foreground truncate block font-medium">
                {student.experience_level || 'Personal'} •{' '}
                <strong className="text-foreground font-bold">
                  {completedCount}/{totalCount}
                </strong>{' '}
                feitos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {/* Exportar/Baixar/Compartilhar Ficha em PDF */}
            {sheet && onExportPdf && (
              <button
                type="button"
                onClick={() => onExportPdf(student, sheet)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-all flex items-center justify-center cursor-pointer"
                title="Exportar / Compartilhar Ficha (PDF/Impressão)"
                aria-label={`Exportar ficha de ${student.name}`}
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Botão rápido Anamnese */}
            <button
              type="button"
              onClick={onOpenAnamnese}
              className={`h-7 w-7 sm:h-8 sm:w-8 p-1 rounded-md transition-all flex items-center justify-center cursor-pointer ${
                student.restrictions
                  ? 'bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 border border-amber-500/30'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
              title="Consultar Anamnese / Restrições"
              aria-label={`Anamnese de ${student.name}`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
            </button>

            {/* Editar cadastro do aluno */}
            <button
              type="button"
              onClick={onEditStudent}
              className="h-7 w-7 sm:h-8 sm:w-8 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center justify-center cursor-pointer"
              title="Editar Aluno"
              aria-label={`Editar ${student.name}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Badges de Início da Ficha (com botão de edição rápida) e Sessões Concluídas */}
        {sheet && (
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <div className="flex items-center gap-1">
              <Badge className="bg-muted text-muted-foreground border border-border text-[9px] sm:text-[10px] px-1 py-0.2 font-medium flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                <span>
                  Início:{' '}
                  <strong className="text-foreground">
                    {parseAndFormatDate(sheet.start_date || sheet.created, 'Recente')}
                  </strong>
                </span>
              </Badge>
              {canEdit && onEditStartDate && (
                <button
                  type="button"
                  onClick={() => onEditStartDate(sheet)}
                  className="p-0.5 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
                  title="Alterar data de início da ficha"
                  aria-label="Alterar data de início da ficha"
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {completedSessionsCount !== undefined && (
              <Badge className="bg-primary/10 text-foreground border border-primary/20 text-[9px] sm:text-[10px] px-1 py-0.2 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                <span>
                  Sessões:{' '}
                  <strong className="text-primary font-black">{completedSessionsCount}</strong>
                </span>
              </Badge>
            )}
          </div>
        )}

        {/* Alerta de Restrição rápida se existir (compacto) */}
        {student.restrictions && (
          <div className="mt-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 flex items-start gap-1 text-[10px] text-amber-800 font-medium leading-tight">
            <AlertTriangle className="w-3 h-3 shrink-0 text-amber-600 mt-0.5" />
            <span className="break-words line-clamp-1">{student.restrictions}</span>
          </div>
        )}

        {/* Seletor de Séries A, B, C, D, E + Atalho de Adicionar Exercício na série */}
        <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-border">
          <div className="flex-1 flex items-center gap-1">
            {(() => {
              // Exibe apenas as séries que a ficha realmente possui (ou pelo menos Série A se vazia)
              const availableKeys = getAvailableSeriesKeys(sheet?.series_data)
              return availableKeys.map((key) => {
                const isCurrent = activeSeries === key

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectSeries(key)}
                    className={`flex-1 min-h-[30px] sm:min-h-[32px] py-0.5 px-1 rounded-md text-[11px] sm:text-xs font-black transition-all relative cursor-pointer ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 ring-1 ring-primary/40'
                        : 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                    }`}
                  >
                    <span>Série {key}</span>
                  </button>
                )
              })
            })()}
          </div>

          {/* Botão rápido para adicionar exercício na série ativa sem sair da aula */}
          {canEdit && sheet && onAddExerciseToSeries && (
            <button
              type="button"
              onClick={() => setAddExerciseModalOpen(true)}
              className="min-h-[30px] sm:min-h-[32px] px-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              title={`Adicionar exercício à Série ${activeSeries}`}
              aria-label={`Adicionar exercício à Série ${activeSeries}`}
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">+ Exercício</span>
            </button>
          )}
        </div>
      </div>

      {/* LISTA DE EXERCÍCIOS DA SÉRIE - rolagem interna por ficha sem travar coluna */}
      <div className="flex-1 min-h-[140px] overflow-y-auto p-1.5 sm:p-2 space-y-1.5">
        {!sheet ? (
          <div className="py-10 text-center text-sm text-muted-foreground px-4 space-y-2">
            <ClipboardList className="w-9 h-9 opacity-40 mx-auto" />
            <p className="font-semibold text-foreground text-sm sm:text-base">
              Nenhuma ficha vinculada
            </p>
            <p className="text-xs">
              Monte uma ficha para este aluno na aba &quot;Fichas de Treino&quot;.
            </p>
          </div>
        ) : currentExercises.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground px-4 space-y-2">
            <ClipboardList className="w-9 h-9 opacity-40 mx-auto" />
            <p className="font-semibold text-foreground text-sm sm:text-base">
              Série {activeSeries} vazia
            </p>
            <p className="text-xs">Selecione outra série ou edite a ficha do aluno.</p>
          </div>
        ) : (
          currentExercises.map((block, idx) => {
            const ex = exercisesMap[block.exercise_id]
            const name = ex?.name || 'Exercício'
            const muscle = ex?.muscle_group || 'Geral'
            const isDone = Boolean(completedExercises[idx])
            const isInProgress = !isDone && Boolean(inProgressExercises[idx])
            const isEditingThis = editingIndex === idx

            const isNoteExpanded = Boolean(expandedNotes[idx])

            return (
              <div
                key={`${block.exercise_id}-${idx}`}
                className={`p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                  isEditingThis
                    ? 'bg-card border-primary ring-2 ring-primary/20 shadow-md'
                    : isDone
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/20'
                      : isInProgress
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                        : 'bg-card border-border hover:border-primary/40 shadow-xs'
                }`}
              >
                {isInProgress && (
                  <div className="flex items-center gap-1 mb-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span>Em execução • 1º toque</span>
                  </div>
                )}
                {isDone && (
                  <div className="flex items-center gap-1 mb-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Concluído • 2º toque</span>
                  </div>
                )}
                {/* 1. TOPO: Botão de status de 2 toques + NOME DO EXERCÍCIO + Ações */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Botão de 2 Toques: Nenhum -> Amarelo (Em execução) -> Verde (Concluído) -> Nenhum */}
                    <button
                      type="button"
                      onClick={() => onToggleExercise(idx)}
                      className={`min-w-[36px] min-h-[36px] w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500 font-black'
                          : isInProgress
                            ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-400 font-black animate-pulse'
                            : 'border-2 border-border bg-muted/60 text-transparent hover:border-amber-400 hover:text-amber-500'
                      }`}
                      title={
                        isDone
                          ? 'Concluído (toque para desmarcar)'
                          : isInProgress
                            ? 'Em execução (toque para concluir)'
                            : 'Nenhum (toque para iniciar execução)'
                      }
                      aria-label={
                        isDone
                          ? 'Concluído (toque para desmarcar)'
                          : isInProgress
                            ? 'Em execução (toque para concluir)'
                            : 'Nenhum (toque para iniciar execução)'
                      }
                    >
                      {isDone ? (
                        <Check className="w-5 h-5 stroke-[3.5]" />
                      ) : isInProgress ? (
                        <Play className="w-4 h-4 fill-current stroke-[2.5]" />
                      ) : (
                        <Check className="w-5 h-5 stroke-[3.5]" />
                      )}
                    </button>

                    {/* Nome do exercício com badge número e grupo muscular ampliado */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 leading-none mb-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-muted text-primary shrink-0 border border-primary/25">
                          #{idx + 1}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider truncate">
                          {muscle}
                        </span>
                      </div>

                      <h3
                        onClick={() => ex && onOpenVideo(ex)}
                        className={`text-xs sm:text-sm md:text-base font-black leading-snug break-words transition-colors cursor-pointer ${
                          isDone
                            ? 'line-through text-muted-foreground'
                            : isInProgress
                              ? 'text-amber-800 hover:text-amber-900'
                              : 'text-foreground hover:text-primary'
                        }`}
                        title={name}
                      >
                        {name}
                      </h3>
                    </div>
                  </div>

                  {/* Ações do Card: Trocar Exercício, Editar Parâmetros, Excluir e Vídeo */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Botão Trocar Exercício em si */}
                    {canEdit && !isEditingThis && (
                      <button
                        type="button"
                        onClick={() => setReplaceModalIdx(idx)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
                        title="Trocar este exercício por outro do acervo"
                        aria-label={`Trocar ${name} por outro exercício`}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canEdit && !isEditingThis && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(idx, block)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted border border-transparent hover:border-border transition-all flex items-center justify-center active:scale-95 cursor-pointer"
                        title="Editar parâmetros (séries, reps, carga, descanso, obs)"
                        aria-label={`Editar ${name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {ex &&
                      (() => {
                        const hasVideo = Boolean(ex.youtube_url || ex.youtube_id)
                        return hasVideo ? (
                          <button
                            type="button"
                            onClick={() => onOpenVideo(ex)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition-all flex items-center justify-center font-bold border border-primary/20 shadow-xs cursor-pointer"
                            title="Ver demonstração em vídeo"
                            aria-label={`Ver vídeo de ${name}`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenVideo(ex)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-1 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all flex items-center justify-center border border-border cursor-pointer"
                            title="Vídeo não cadastrado ainda (toque para ver)"
                            aria-label={`Vídeo não cadastrado de ${name}`}
                          >
                            <VideoOff className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          </button>
                        )
                      })()}
                  </div>
                </div>

                {/* 2. FORMULÁRIO DE EDIÇÃO INLINE (quando aberto) */}
                {isEditingThis && editDraft ? (
                  <div className="mt-3 pt-3 border-t border-border space-y-2.5 bg-muted/30 p-3 rounded-xl border border-primary/30 animate-fade-in">
                    <div className="flex items-center justify-between pb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1">
                          <Pencil className="w-3.5 h-3.5" /> Edição rápida
                        </span>
                        {/* Botão para trocar o exercício dentro do modo de edição */}
                        <button
                          type="button"
                          onClick={() => setReplaceModalIdx(idx)}
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded border border-primary/20 cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3 h-3" /> Substituir exercício
                        </button>
                      </div>

                      {/* Botão de Excluir Exercício da Série */}
                      {onRemoveExerciseFromSeries && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(idx)}
                          disabled={deletingIdx === idx}
                          className="text-[11px] text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 hover:bg-red-50 px-1.5 py-0.5 rounded cursor-pointer"
                          title="Remover exercício da ficha"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                      )}
                    </div>

                    {/* Exibe o nome do exercício selecionado no draft */}
                    <div className="bg-card p-2 rounded-lg border border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Exercício selecionado:</span>
                      <strong className="text-foreground truncate max-w-[180px]">{name}</strong>
                    </div>

                    {/* Grid com Séries, Reps, Carga, Descanso */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block truncate">
                          Séries
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={editDraft.sets === 0 ? '' : editDraft.sets}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '') {
                              setEditDraft({
                                ...editDraft,
                                sets: 0,
                              })
                              return
                            }
                            const parsed = parseInt(val, 10)
                            setEditDraft({
                              ...editDraft,
                              sets: Number.isNaN(parsed) ? 0 : parsed,
                            })
                          }}
                          onBlur={() => {
                            if (!editDraft.sets || editDraft.sets < 1) {
                              setEditDraft({
                                ...editDraft,
                                sets: 1,
                              })
                            }
                          }}
                          className="h-10 bg-card border-border text-foreground font-black text-center text-sm focus-visible:ring-primary px-1 shadow-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block truncate">
                          Reps
                        </label>
                        <Input
                          type="text"
                          value={editDraft.reps}
                          placeholder="Ex: 10"
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              reps: e.target.value,
                            })
                          }
                          className="h-10 bg-card border-border text-foreground font-black text-center text-sm focus-visible:ring-primary px-1 shadow-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block truncate">
                          Carga
                        </label>
                        <Input
                          type="text"
                          value={editDraft.load}
                          placeholder="Ex: 25kg"
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              load: e.target.value,
                            })
                          }
                          className="h-10 bg-card border-border text-primary font-black text-center text-sm focus-visible:ring-primary px-1 shadow-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block truncate">
                          Descanso
                        </label>
                        <Input
                          type="text"
                          value={editDraft.time}
                          placeholder="Ex: 60s"
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              time: e.target.value,
                            })
                          }
                          className="h-10 bg-card border-border text-foreground font-black text-center text-sm focus-visible:ring-primary px-1 shadow-xs"
                        />
                      </div>
                    </div>

                    {/* Observações */}
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
                        Observações
                      </label>
                      <Input
                        type="text"
                        value={editDraft.notes}
                        placeholder="Ex: Banco no 3º furo, cadência 3-0-1"
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            notes: e.target.value,
                          })
                        }
                        className="h-10 bg-card border-border text-foreground text-xs sm:text-sm focus-visible:ring-primary shadow-xs"
                      />
                    </div>

                    {/* Botões Salvar / Cancelar */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={savingEdit}
                        className="h-9 px-3 border-border bg-card hover:bg-muted text-foreground text-xs font-bold"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEdit(idx)}
                        disabled={savingEdit}
                        className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-sm"
                      >
                        {savingEdit ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5 mr-1" /> Salvar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Modo de Visualização: 4 colunas horizontais com min-h-[44px] e tipografia adaptativa */
                  <div className="mt-1.5 pt-1.5 border-t border-border">
                    <div className="grid grid-cols-4 gap-1 sm:gap-1.5 text-center">
                      {/* Séries */}
                      <div className="bg-muted/40 border border-border rounded-lg py-1 px-1 flex flex-col items-center justify-center min-h-[44px]">
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-0.5">
                          Séries
                        </span>
                        <span className="text-xs sm:text-sm md:text-base font-black text-foreground leading-tight">
                          {block.sets}x
                        </span>
                      </div>

                      {/* Repetições */}
                      <div className="bg-muted/40 border border-border rounded-lg py-1 px-1 flex flex-col items-center justify-center min-h-[44px]">
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-0.5">
                          Reps
                        </span>
                        <span className="text-xs sm:text-sm md:text-base font-black text-foreground leading-tight break-words max-w-full px-0.5">
                          {block.reps || '10'}
                        </span>
                      </div>

                      {/* Carga */}
                      <div className="bg-muted/40 border border-border rounded-lg py-1 px-1 flex flex-col items-center justify-center min-h-[44px]">
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-0.5">
                          Carga
                        </span>
                        <span className="text-xs sm:text-sm md:text-base font-black text-primary leading-tight break-words max-w-full px-0.5">
                          {block.load || '—'}
                        </span>
                      </div>

                      {/* Descanso */}
                      <div className="bg-muted/40 border border-border rounded-lg py-1 px-1 flex flex-col items-center justify-center min-h-[44px]">
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-bold leading-none mb-0.5">
                          Pausa
                        </span>
                        <span className="text-xs sm:text-sm md:text-base font-black text-foreground leading-tight break-words max-w-full px-0.5">
                          {block.time || '60s'}
                        </span>
                      </div>
                    </div>

                    {/* Observações em linha compacta, truncadas se longas, clicáveis para expandir */}
                    {block.notes && (
                      <button
                        type="button"
                        onClick={() => toggleNote(idx)}
                        className="mt-1.5 w-full text-left text-[11px] sm:text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-md border border-border hover:border-primary/30 transition-colors flex items-start gap-1 cursor-pointer"
                        title={block.notes}
                      >
                        <strong className="text-primary font-bold shrink-0 text-[10px] sm:text-[11px]">
                          Obs:
                        </strong>
                        <span
                          className={`min-w-0 flex-1 leading-snug break-words ${
                            isNoteExpanded ? '' : 'line-clamp-1'
                          }`}
                        >
                          {block.notes}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* FOOTER DA COLUNA: Conclusão da Série e Ficha (otimizado verticalmente) */}
      <div className="px-2 py-1.5 sm:px-2.5 sm:py-2 bg-card border-t border-border space-y-1 shrink-0">
        <Button
          onClick={onCompleteSeries}
          disabled={!sheet || currentExercises.length === 0}
          className={`w-full min-h-[32px] sm:min-h-[34px] h-8 sm:h-8.5 text-xs font-black transition-all flex items-center justify-center gap-1.5 rounded-lg shadow-sm cursor-pointer ${
            isSeriesAllDone
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              : 'bg-primary hover:opacity-90 text-primary-foreground shadow-primary/25'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isSeriesAllDone
              ? `Finalizar Série ${activeSeries} (Pronta)`
              : `Concluir Série ${activeSeries}`}
          </span>
        </Button>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onCompleteSheet}
            disabled={!sheet}
            className="text-left text-[10px] text-muted-foreground hover:text-foreground transition-colors font-semibold truncate cursor-pointer"
          >
            Marcar ficha concluída
          </button>

          {sheet && onExportPdf && (
            <button
              type="button"
              onClick={() => onExportPdf(student, sheet)}
              className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold shrink-0 cursor-pointer"
            >
              <Printer className="w-3 h-3" /> PDF
            </button>
          )}
        </div>
      </div>

      {/* Modal para Trocar Exercício da Posição Atual (Requisito 3) */}
      {replaceModalIdx !== null && (
        <ExercisePickerModal
          isOpen={true}
          onClose={() => setReplaceModalIdx(null)}
          title={`Substituir Exercício #${replaceModalIdx + 1}`}
          description={`Troque o exercício atual da Série ${activeSeries} por outro do acervo. A carga e parâmetros serão preservados.`}
          actionLabel="Substituir"
          currentExerciseId={currentExercises[replaceModalIdx]?.exercise_id}
          onSelect={(ex) => handleReplaceExercise(replaceModalIdx, ex)}
          onPreviewVideo={onOpenVideo}
        />
      )}

      {/* Modal para Adicionar Novo Exercício à Série Atual em Tempo Real (Requisito 2) */}
      {addExerciseModalOpen && (
        <ExercisePickerModal
          isOpen={true}
          onClose={() => setAddExerciseModalOpen(false)}
          title={`Adicionar Exercício à Série ${activeSeries}`}
          description={`Selecione um exercício do acervo para adicionar à Série ${activeSeries} de ${student.name}.`}
          actionLabel="Adicionar"
          onSelect={handleAddExerciseToCurrentSeries}
          onPreviewVideo={onOpenVideo}
        />
      )}
    </div>
  )
}
