import React, { useState } from 'react'
import type { Student, SeriesKey, TrainingSheet, Exercise, ExerciseBlock } from '@/types'
import { SERIES_KEYS } from '@/types'
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
} from 'lucide-react'
import ExercisePickerModal from '@/components/ExercisePickerModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface StudentTrainingColumnProps {
  student: Student
  sheet: TrainingSheet | null
  activeSeries: SeriesKey
  onSelectSeries: (series: SeriesKey) => void
  completedExercises: Record<number, boolean>
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
}

export default function StudentTrainingColumn({
  student,
  sheet,
  activeSeries,
  onSelectSeries,
  completedExercises,
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
}: StudentTrainingColumnProps) {
  const currentExercises: ExerciseBlock[] = sheet?.series_data?.[activeSeries] || []
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
    setSavingEdit(true)
    try {
      const ok = await onUpdateExerciseBlock(student.id, sheet.id, activeSeries, idx, editDraft)
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

  const initials = student.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')

  return (
    <div className="flex flex-col h-full min-h-0 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
      {/* HEADER DO ALUNO - otimizado verticalmente */}
      <div className="p-3 sm:p-3.5 bg-card/60 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#2A2A2A] border-2 border-primary/40 text-primary font-black text-sm flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h2
                className="text-base sm:text-lg font-black text-white leading-tight truncate"
                title={student.name}
              >
                {student.name}
              </h2>
              <span className="text-[11px] sm:text-xs text-[#9CA3AF] truncate block font-medium">
                {student.experience_level || 'Personal'} •{' '}
                <strong className="text-white font-bold">
                  {completedCount}/{totalCount}
                </strong>{' '}
                feitos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Exportar/Baixar/Compartilhar Ficha em PDF */}
            {sheet && onExportPdf && (
              <button
                type="button"
                onClick={() => onExportPdf(student, sheet)}
                className="min-h-[38px] min-w-[38px] p-2 rounded-lg text-[#9CA5B8] hover:text-secondary hover:bg-[#252B3E] transition-all flex items-center justify-center"
                title="Exportar / Compartilhar Ficha (PDF/Impressão)"
                aria-label={`Exportar ficha de ${student.name}`}
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {/* Botão rápido Anamnese com min 38px */}
            <button
              type="button"
              onClick={onOpenAnamnese}
              className={`min-h-[38px] min-w-[38px] p-2 rounded-lg transition-all flex items-center justify-center ${
                student.restrictions
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                  : 'text-[#9CA5B8] hover:text-primary hover:bg-[#252B3E]'
              }`}
              title="Consultar Anamnese / Restrições"
              aria-label={`Anamnese de ${student.name}`}
            >
              <HeartPulse className="w-4 h-4" />
            </button>

            {/* Editar cadastro do aluno */}
            <button
              type="button"
              onClick={onEditStudent}
              className="min-h-[38px] min-w-[38px] p-2 rounded-lg text-[#9CA5B8] hover:text-white hover:bg-[#252B3E] transition-all flex items-center justify-center"
              title="Editar Aluno"
              aria-label={`Editar ${student.name}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerta de Restrição rápida se existir (compacto) */}
        {student.restrictions && (
          <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-start gap-1.5 text-[11px] sm:text-xs text-amber-200 font-medium leading-tight">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
            <span className="break-words line-clamp-2">{student.restrictions}</span>
          </div>
        )}

        {/* Seletor de Séries A, B, C, D, E + Atalho de Adicionar Exercício na série */}
        <div className="flex items-center gap-1 sm:gap-1.5 mt-2.5 pt-2 border-t border-[#252525]">
          <div className="flex-1 flex items-center gap-1">
            {SERIES_KEYS.map((key) => {
              const hasItems = (sheet?.series_data?.[key]?.length || 0) > 0
              const isCurrent = activeSeries === key

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectSeries(key)}
                  className={`flex-1 min-h-[36px] py-1 px-1 rounded-lg text-xs font-black transition-all relative ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 ring-1 ring-primary/40'
                      : hasItems
                        ? 'bg-[#252B3E] text-white hover:bg-[#30374e]'
                        : 'bg-[#121522] text-[#9CA5B8] hover:text-white opacity-60'
                  }`}
                >
                  <span>Série {key}</span>
                </button>
              )
            })}
          </div>

          {/* Botão rápido para adicionar exercício na série ativa sem sair da aula */}
          {canEdit && sheet && onAddExerciseToSeries && (
            <button
              type="button"
              onClick={() => setAddExerciseModalOpen(true)}
              className="min-h-[36px] px-2 rounded-lg bg-primary/20 text-secondary hover:bg-primary/30 border border-primary/40 text-xs font-bold transition-all flex items-center gap-1 shrink-0"
              title={`Adicionar exercício à Série ${activeSeries}`}
              aria-label={`Adicionar exercício à Série ${activeSeries}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+ Exercício</span>
            </button>
          )}
        </div>
      </div>

      {/* LISTA DE EXERCÍCIOS DA SÉRIE - cards compactos para caber por inteiro na dobra */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 space-y-2.5">
        {!sheet ? (
          <div className="py-12 text-center text-sm text-[#8A8F98] px-4 space-y-2">
            <ClipboardList className="w-10 h-10 opacity-40 mx-auto" />
            <p className="font-semibold text-white text-base">Nenhuma ficha vinculada</p>
            <p>Monte uma ficha para este aluno na aba &quot;Fichas de Treino&quot;.</p>
          </div>
        ) : currentExercises.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8A8F98] px-4 space-y-2">
            <ClipboardList className="w-10 h-10 opacity-40 mx-auto" />
            <p className="font-semibold text-white text-base">Série {activeSeries} vazia</p>
            <p>Selecione outra série ou edite a ficha do aluno.</p>
          </div>
        ) : (
          currentExercises.map((block, idx) => {
            const ex = exercisesMap[block.exercise_id]
            const name = ex?.name || 'Exercício'
            const muscle = ex?.muscle_group || 'Geral'
            const isDone = Boolean(completedExercises[idx])
            // Descobre o primeiro exercício não concluído para dar destaque (continuidade)
            const firstUndoneIndex = currentExercises.findIndex((_, i) => !completedExercises[i])
            const isCurrentFocus = !isDone && idx === firstUndoneIndex
            const isEditingThis = editingIndex === idx

            const isNoteExpanded = Boolean(expandedNotes[idx])

            return (
              <div
                key={`${block.exercise_id}-${idx}`}
                className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                  isEditingThis
                    ? 'bg-[#181C2E] border-primary ring-2 ring-primary/30 shadow-xl'
                    : isDone
                      ? 'bg-secondary/10 border-secondary/40 shadow-sm'
                      : isCurrentFocus
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/40 shadow-md'
                        : 'bg-[#151515] border-[#2E2E2E] hover:border-primary/50 shadow-sm'
                }`}
              >
                {isCurrentFocus && (
                  <div className="flex items-center gap-1.5 mb-2 text-[11px] font-extrabold uppercase tracking-wider text-secondary">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    <span>Próximo exercício • Continuar daqui</span>
                  </div>
                )}
                {/* 1. TOPO: Checkmark + NOME DO EXERCÍCIO + Ações (lápis e vídeo) num bloco horizontal ampliado */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Botão de Checkmark da sessão - 44x44px (ampliado para toque e visualização rápida à distância) */}
                    <button
                      type="button"
                      onClick={() => onToggleExercise(idx)}
                      className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                        isDone
                          ? 'bg-secondary text-secondary-foreground shadow-md shadow-secondary/35 animate-check-pop ring-2 ring-secondary/50 font-bold'
                          : isCurrentFocus
                            ? 'border-2 border-primary bg-primary/20 text-primary hover:bg-primary/30'
                            : 'border-2 border-[#454545] bg-[#1F1F1F] text-transparent hover:border-primary hover:text-primary/40'
                      }`}
                      aria-label={isDone ? 'Desmarcar exercício' : 'Marcar como concluído'}
                    >
                      <Check className="w-6 h-6 stroke-[3.5]" />
                    </button>

                    {/* Nome do exercício com badge número e grupo muscular ampliado */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 leading-none mb-1">
                        <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#252525] text-primary shrink-0 border border-primary/25">
                          #{idx + 1}
                        </span>
                        <span className="text-xs text-[#9CA3AF] font-bold uppercase tracking-wider truncate">
                          {muscle}
                        </span>
                      </div>

                      <h3
                        onClick={() => ex && onOpenVideo(ex)}
                        className={`text-base sm:text-lg font-black leading-snug truncate transition-colors cursor-pointer ${
                          isDone ? 'line-through text-[#8A8F98]' : 'text-white hover:text-primary'
                        }`}
                        title={name}
                      >
                        {name}
                      </h3>
                    </div>
                  </div>

                  {/* Ações do Card: Trocar Exercício, Editar Parâmetros, Excluir e Vídeo */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Botão Trocar Exercício em si (Atende requisito 3: ex. Leg Press -> Extensora) */}
                    {canEdit && !isEditingThis && (
                      <button
                        type="button"
                        onClick={() => setReplaceModalIdx(idx)}
                        className="h-9 w-9 sm:h-9.5 sm:w-9.5 p-1.5 rounded-xl text-[#9CA5B8] hover:text-secondary hover:bg-secondary/15 border border-transparent hover:border-secondary/40 transition-all flex items-center justify-center active:scale-95"
                        title="Trocar este exercício por outro do acervo"
                        aria-label={`Trocar ${name} por outro exercício`}
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                    )}

                    {canEdit && !isEditingThis && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(idx, block)}
                        className="h-9 w-9 sm:h-9.5 sm:w-9.5 p-1.5 rounded-xl text-[#9CA5B8] hover:text-primary hover:bg-[#252B3E] border border-transparent hover:border-[#383838] transition-all flex items-center justify-center active:scale-95"
                        title="Editar parâmetros (séries, reps, carga, descanso, obs)"
                        aria-label={`Editar ${name}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {ex && (
                      <button
                        type="button"
                        onClick={() => onOpenVideo(ex)}
                        className="h-9 w-9 sm:h-9.5 sm:w-9.5 p-1.5 rounded-xl bg-primary/20 text-secondary hover:bg-primary/30 active:scale-95 transition-all flex items-center justify-center font-bold border border-primary/40 shadow-sm"
                        title="Ver demonstração em vídeo"
                        aria-label={`Ver vídeo de ${name}`}
                      >
                        <Play className="w-4 h-4 fill-current shrink-0" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. FORMULÁRIO DE EDIÇÃO INLINE (quando aberto) */}
                {isEditingThis && editDraft ? (
                  <div className="mt-3 pt-3 border-t border-[#2C2C2C] space-y-2.5 bg-[#141414] p-3 rounded-xl border border-primary/40 animate-fade-in">
                    <div className="flex items-center justify-between pb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1">
                          <Pencil className="w-3.5 h-3.5" /> Edição rápida
                        </span>
                        {/* Botão para trocar o exercício dentro do modo de edição */}
                        <button
                          type="button"
                          onClick={() => setReplaceModalIdx(idx)}
                          className="text-[11px] font-bold text-secondary hover:underline flex items-center gap-1 bg-secondary/15 px-2 py-0.5 rounded border border-secondary/30"
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
                          className="text-[11px] text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 hover:bg-red-950/30 px-1.5 py-0.5 rounded"
                          title="Remover exercício da ficha"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                      )}
                    </div>

                    {/* Exibe o nome do exercício selecionado no draft */}
                    <div className="bg-[#1C2033] p-2 rounded-lg border border-[#2B324D] flex items-center justify-between text-xs">
                      <span className="text-[#9CA5B8]">Exercício selecionado:</span>
                      <strong className="text-white truncate max-w-[180px]">{name}</strong>
                    </div>

                    {/* Grid com Séries, Reps, Carga, Descanso */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-bold block truncate">
                          Séries
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={editDraft.sets}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              sets: parseInt(e.target.value) || 1,
                            })
                          }
                          className="h-10 bg-[#1E1E1E] border-[#383838] text-white font-black text-center text-sm focus-visible:ring-primary px-1"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-bold block truncate">
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
                          className="h-10 bg-[#1E1E1E] border-[#383838] text-white font-black text-center text-sm focus-visible:ring-primary px-1"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-bold block truncate">
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
                          className="h-10 bg-[#1E1E1E] border-[#383838] text-primary font-black text-center text-sm focus-visible:ring-primary px-1"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-bold block truncate">
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
                          className="h-10 bg-[#1E1E1E] border-[#383838] text-white font-black text-center text-sm focus-visible:ring-primary px-1"
                        />
                      </div>
                    </div>

                    {/* Observações */}
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-bold block">
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
                        className="h-10 bg-[#1E1E1E] border-[#383838] text-white text-xs sm:text-sm focus-visible:ring-primary"
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
                        className="h-9 px-3 border-[#333333] bg-[#1E1E1E] hover:bg-[#282828] text-white text-xs font-bold"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveEdit(idx)}
                        disabled={savingEdit}
                        className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-sm shadow-primary/30"
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
                  /* Modo de Visualização: 4 colunas horizontais ampliadas em uma linha única para alta legibilidade */
                  <div className="mt-2.5 pt-2.5 border-t border-[#262626]">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {/* Séries */}
                      <div className="bg-[#1A1A1A] border border-[#282828] rounded-xl py-1.5 px-1.5 flex flex-col items-center justify-center min-h-[52px]">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#9CA3AF] font-bold leading-none mb-1">
                          Séries
                        </span>
                        <span className="text-base sm:text-lg font-black text-white leading-tight">
                          {block.sets}x
                        </span>
                      </div>

                      {/* Repetições */}
                      <div className="bg-[#1A1A1A] border border-[#282828] rounded-xl py-1.5 px-1.5 flex flex-col items-center justify-center min-h-[52px]">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#9CA3AF] font-bold leading-none mb-1">
                          Reps
                        </span>
                        <span className="text-base sm:text-lg font-black text-white leading-tight truncate max-w-full px-0.5">
                          {block.reps || '10'}
                        </span>
                      </div>

                      {/* Carga */}
                      <div className="bg-[#1A1A1A] border border-[#282828] rounded-xl py-1.5 px-1.5 flex flex-col items-center justify-center min-h-[52px]">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#9CA3AF] font-bold leading-none mb-1">
                          Carga
                        </span>
                        <span className="text-base sm:text-lg font-black text-primary leading-tight truncate max-w-full px-0.5">
                          {block.load || '—'}
                        </span>
                      </div>

                      {/* Descanso */}
                      <div className="bg-[#1A1A1A] border border-[#282828] rounded-xl py-1.5 px-1.5 flex flex-col items-center justify-center min-h-[52px]">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#9CA3AF] font-bold leading-none mb-1">
                          Pausa
                        </span>
                        <span className="text-base sm:text-lg font-black text-white leading-tight truncate max-w-full px-0.5">
                          {block.time || '60s'}
                        </span>
                      </div>
                    </div>

                    {/* Observações em linha compacta, truncadas se longas, clicáveis para expandir */}
                    {block.notes && (
                      <button
                        type="button"
                        onClick={() => toggleNote(idx)}
                        className="mt-2 w-full text-left text-xs sm:text-[13px] text-[#D1D5DB] bg-[#181818] px-2.5 py-1.5 rounded-lg border border-[#282828] hover:border-[#3A3A3A] transition-colors flex items-start gap-1.5"
                        title={block.notes}
                      >
                        <strong className="text-primary font-bold shrink-0">Obs:</strong>
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

      {/* FOOTER DA COLUNA: Conclusão da Série e Ficha (mais compacto) */}
      <div className="p-2.5 sm:p-3 bg-card/60 border-t border-border space-y-1.5 shrink-0">
        <Button
          onClick={onCompleteSeries}
          disabled={!sheet || currentExercises.length === 0}
          className={`w-full min-h-[42px] h-10 text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 rounded-xl shadow-md ${
            isSeriesAllDone
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              : 'bg-primary hover:opacity-90 text-primary-foreground shadow-primary/25'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {isSeriesAllDone
              ? `Finalizar Série ${activeSeries} (Pronta)`
              : `Concluir Série ${activeSeries}`}
          </span>
        </Button>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={onCompleteSheet}
            disabled={!sheet}
            className="text-left text-[11px] sm:text-xs text-[#8A8F98] hover:text-white py-1 transition-colors font-semibold"
          >
            Marcar toda a ficha como concluída
          </button>

          {sheet && onExportPdf && (
            <button
              type="button"
              onClick={() => onExportPdf(student, sheet)}
              className="text-[11px] text-secondary hover:underline flex items-center gap-1 font-bold shrink-0"
            >
              <Printer className="w-3.5 h-3.5" /> PDF
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
