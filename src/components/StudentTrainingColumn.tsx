import React from 'react'
import type { Student, SeriesKey, TrainingSheet, Exercise, ExerciseBlock } from '@/types'
import { SERIES_KEYS } from '@/types'
import {
  HeartPulse,
  Edit2,
  Play,
  Check,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
}: StudentTrainingColumnProps) {
  const currentExercises: ExerciseBlock[] = sheet?.series_data?.[activeSeries] || []
  const totalCount = currentExercises.length
  const completedCount = currentExercises.filter((_, idx) => completedExercises[idx]).length
  const isSeriesAllDone = totalCount > 0 && completedCount === totalCount

  const initials = student.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl shadow-xl overflow-hidden">
      {/* HEADER DO ALUNO */}
      <div className="p-4 bg-[#171717] border-b border-[#2E2E2E]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#2A2A2A] border border-[#F06A2A]/40 text-[#F06A2A] font-bold text-sm flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate" title={student.name}>
                {student.name}
              </h2>
              <span className="text-[11px] text-[#8A8F98] truncate block">
                {student.experience_level || 'Personal'} • {completedCount}/{totalCount} feitos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Botão rápido Anamnese */}
            <button
              type="button"
              onClick={onOpenAnamnese}
              className={`p-2 rounded-lg transition-colors ${
                student.restrictions
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : 'text-[#8A8F98] hover:text-[#F06A2A] hover:bg-[#2A2A2A]'
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
              className="p-2 rounded-lg text-[#8A8F98] hover:text-white hover:bg-[#2A2A2A] transition-colors"
              title="Editar Aluno"
              aria-label={`Editar ${student.name}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerta de Restrição rápida se existir */}
        {student.restrictions && (
          <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 flex items-center gap-1.5 text-[11px] text-amber-300 font-medium truncate">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span className="truncate">{student.restrictions}</span>
          </div>
        )}

        {/* Seletor de Séries A, B, C, D, E */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#252525]">
          {SERIES_KEYS.map((key) => {
            const hasItems = (sheet?.series_data?.[key]?.length || 0) > 0
            const isCurrent = activeSeries === key

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectSeries(key)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                  isCurrent
                    ? 'bg-[#F06A2A] text-white shadow-md shadow-[#F06A2A]/25'
                    : hasItems
                      ? 'bg-[#252525] text-white hover:bg-[#303030]'
                      : 'bg-[#141414] text-[#8A8F98] hover:text-white opacity-60'
                }`}
              >
                <span>{key}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* LISTA DE EXERCÍCIOS DA SÉRIE */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {!sheet ? (
          <div className="py-12 text-center text-xs text-[#8A8F98] px-4 space-y-2">
            <ClipboardList className="w-8 h-8 opacity-40 mx-auto" />
            <p className="font-semibold text-white">Nenhuma ficha vinculada</p>
            <p>Monte uma ficha para este aluno na aba &quot;Fichas de Treino&quot;.</p>
          </div>
        ) : currentExercises.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#8A8F98] px-4 space-y-2">
            <ClipboardList className="w-8 h-8 opacity-40 mx-auto" />
            <p className="font-semibold text-white">Série {activeSeries} vazia</p>
            <p>Selecione outra série ou edite a ficha do aluno.</p>
          </div>
        ) : (
          currentExercises.map((block, idx) => {
            const ex = exercisesMap[block.exercise_id]
            const name = ex?.name || 'Exercício'
            const muscle = ex?.muscle_group || 'Geral'
            const isDone = Boolean(completedExercises[idx])

            return (
              <div
                key={`${block.exercise_id}-${idx}`}
                className={`p-3 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-600/40'
                    : 'bg-[#141414] border-[#2A2A2A] hover:border-[#F06A2A]/40'
                }`}
              >
                {/* Linha superior: Checkmark, Nome grande e Botão de Vídeo */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Botão de Checkmark da sessão */}
                    <button
                      type="button"
                      onClick={() => onToggleExercise(idx)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                        isDone
                          ? 'bg-[#2EA55B] text-white shadow-md shadow-[#2EA55B]/30 animate-check-pop'
                          : 'border-2 border-[#3A3A3A] text-transparent hover:border-[#F06A2A]'
                      }`}
                      aria-label={isDone ? 'Desmarcar exercício' : 'Marcar como concluído'}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    {/* Nome do exercício com toque grande */}
                    <div
                      onClick={() => ex && onOpenVideo(ex)}
                      className="min-w-0 cursor-pointer group/name"
                    >
                      <h3
                        className={`text-sm sm:text-base font-bold leading-tight truncate transition-colors ${
                          isDone
                            ? 'line-through text-[#8A8F98]'
                            : 'text-white group-hover/name:text-[#F06A2A]'
                        }`}
                        title={name}
                      >
                        {name}
                      </h3>
                      <span className="text-[10px] text-[#8A8F98] block">{muscle}</span>
                    </div>
                  </div>

                  {/* Botão de vídeo bem visível */}
                  {ex && (
                    <button
                      type="button"
                      onClick={() => onOpenVideo(ex)}
                      className="p-2 rounded-lg bg-[#F06A2A]/15 text-[#F06A2A] hover:bg-[#F06A2A]/25 transition-colors shrink-0 flex items-center gap-1"
                      title="Ver vídeo do exercício"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span className="text-[11px] font-bold hidden sm:inline">Vídeo</span>
                    </button>
                  )}
                </div>

                {/* Parâmetros em Linha Compacta e Legível à Distância */}
                <div className="grid grid-cols-4 gap-1.5 mt-2.5 pt-2 border-t border-[#222222] text-center">
                  <div className="bg-[#1E1E1E] rounded-md p-1">
                    <span className="text-[9px] uppercase tracking-wider text-[#8A8F98] block">
                      Séries
                    </span>
                    <span className="text-xs font-bold text-white">{block.sets}x</span>
                  </div>

                  <div className="bg-[#1E1E1E] rounded-md p-1">
                    <span className="text-[9px] uppercase tracking-wider text-[#8A8F98] block">
                      Reps
                    </span>
                    <span className="text-xs font-bold text-white truncate block">
                      {block.reps || '10'}
                    </span>
                  </div>

                  <div className="bg-[#1E1E1E] rounded-md p-1">
                    <span className="text-[9px] uppercase tracking-wider text-[#8A8F98] block">
                      Carga
                    </span>
                    <span className="text-xs font-bold text-[#F06A2A] truncate block">
                      {block.load || '—'}
                    </span>
                  </div>

                  <div className="bg-[#1E1E1E] rounded-md p-1">
                    <span className="text-[9px] uppercase tracking-wider text-[#8A8F98] block">
                      Pausa
                    </span>
                    <span className="text-xs font-bold text-white truncate block">
                      {block.time || '60s'}
                    </span>
                  </div>
                </div>

                {block.notes && (
                  <p className="mt-1.5 text-[11px] text-[#8A8F98] italic bg-[#1E1E1E]/50 px-2 py-0.5 rounded">
                    Obs: {block.notes}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* FOOTER DA COLUNA: Conclusão da Série e Ficha */}
      <div className="p-3 bg-[#171717] border-t border-[#2E2E2E] space-y-2">
        <Button
          onClick={onCompleteSeries}
          disabled={!sheet || currentExercises.length === 0}
          className={`w-full h-11 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
            isSeriesAllDone
              ? 'bg-[#2EA55B] hover:bg-[#289150] text-white shadow-lg shadow-[#2EA55B]/25'
              : 'bg-[#F06A2A] hover:bg-[#D95C1C] text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isSeriesAllDone
            ? `Finalizar Série ${activeSeries} (Pronta)`
            : `Concluir Série ${activeSeries}`}
        </Button>

        <button
          type="button"
          onClick={onCompleteSheet}
          disabled={!sheet}
          className="w-full text-center text-xs text-[#8A8F98] hover:text-white py-1 transition-colors"
        >
          Marcar toda a ficha como concluída
        </button>
      </div>
    </div>
  )
}
