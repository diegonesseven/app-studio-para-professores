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
            <div className="w-11 h-11 rounded-full bg-[#2A2A2A] border border-primary/40 text-primary font-bold text-sm flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h2
                className="text-base sm:text-lg font-extrabold text-white truncate"
                title={student.name}
              >
                {student.name}
              </h2>
              <span className="text-xs text-[#8A8F98] truncate block font-medium">
                {student.experience_level || 'Personal'} •{' '}
                <strong className="text-white">
                  {completedCount}/{totalCount}
                </strong>{' '}
                feitos
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Botão rápido Anamnese com min 44px */}
            <button
              type="button"
              onClick={onOpenAnamnese}
              className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-all flex items-center justify-center ${
                student.restrictions
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                  : 'text-[#8A8F98] hover:text-primary hover:bg-[#2A2A2A]'
              }`}
              title="Consultar Anamnese / Restrições"
              aria-label={`Anamnese de ${student.name}`}
            >
              <HeartPulse className="w-5 h-5" />
            </button>

            {/* Editar cadastro do aluno com min 44px */}
            <button
              type="button"
              onClick={onEditStudent}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-[#8A8F98] hover:text-white hover:bg-[#2A2A2A] transition-all flex items-center justify-center"
              title="Editar Aluno"
              aria-label={`Editar ${student.name}`}
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerta de Restrição rápida se existir */}
        {student.restrictions && (
          <div className="mt-2.5 px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center gap-2 text-xs text-amber-300 font-medium leading-tight">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="line-clamp-2">{student.restrictions}</span>
          </div>
        )}

        {/* Seletor de Séries A, B, C, D, E */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#252525]">
          {SERIES_KEYS.map((key) => {
            const hasItems = (sheet?.series_data?.[key]?.length || 0) > 0
            const isCurrent = activeSeries === key

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectSeries(key)}
                className={`flex-1 min-h-[40px] py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all relative ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-2 ring-primary/40'
                    : hasItems
                      ? 'bg-[#252525] text-white hover:bg-[#303030]'
                      : 'bg-[#141414] text-[#8A8F98] hover:text-white opacity-60'
                }`}
              >
                <span>Série {key}</span>
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
                    {/* Botão de Checkmark da sessão - alvo de toque mínimo de 44px */}
                    <button
                      type="button"
                      onClick={() => onToggleExercise(idx)}
                      className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 animate-check-pop'
                          : 'border-2 border-[#3E3E3E] bg-[#1A1A1A] text-transparent hover:border-primary hover:text-primary/40'
                      }`}
                      aria-label={isDone ? 'Desmarcar exercício' : 'Marcar como concluído'}
                    >
                      <Check className="w-5 h-5 stroke-[3]" />
                    </button>

                    {/* Nome do exercício com quebra elegante, sem cortar e legível à distância */}
                    <div
                      onClick={() => ex && onOpenVideo(ex)}
                      className="min-w-0 flex-1 cursor-pointer group/name py-0.5"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#252525] text-primary shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-[11px] text-[#8A8F98] font-medium">{muscle}</span>
                      </div>
                      <h3
                        className={`text-sm sm:text-base font-bold leading-snug transition-colors break-words mt-0.5 ${
                          isDone
                            ? 'line-through text-[#8A8F98]'
                            : 'text-white group-hover/name:text-primary'
                        }`}
                        title={name}
                      >
                        {name}
                      </h3>
                    </div>
                  </div>

                  {/* Botão de vídeo bem visível e com alvo de toque adequado */}
                  {ex && (
                    <button
                      type="button"
                      onClick={() => onOpenVideo(ex)}
                      className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3 py-2 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 active:scale-95 transition-all shrink-0 flex items-center justify-center gap-1.5 font-bold border border-primary/30"
                      title="Ver demonstração em vídeo"
                      aria-label={`Ver vídeo de ${name}`}
                    >
                      <Play className="w-4 h-4 fill-current shrink-0" />
                      <span className="text-xs hidden sm:inline">Vídeo</span>
                    </button>
                  )}
                </div>

                {/* Parâmetros em Linha com alto contraste, fontes nítidas e legíveis à distância */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-3 pt-2.5 border-t border-[#252525] text-center">
                  <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg py-1.5 px-1">
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8A8F98] font-semibold block">
                      Séries
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">
                      {block.sets}x
                    </span>
                  </div>

                  <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg py-1.5 px-1">
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8A8F98] font-semibold block">
                      Reps
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-white truncate block">
                      {block.reps || '10'}
                    </span>
                  </div>

                  <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg py-1.5 px-1">
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8A8F98] font-semibold block">
                      Carga
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-primary truncate block">
                      {block.load || '—'}
                    </span>
                  </div>

                  <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg py-1.5 px-1">
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8A8F98] font-semibold block">
                      Descanso
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-white truncate block">
                      {block.time || '60s'}
                    </span>
                  </div>
                </div>

                {block.notes && (
                  <p className="mt-2 text-xs text-[#A0A5AF] bg-[#181818] px-2.5 py-1.5 rounded-lg border border-[#262626] leading-relaxed">
                    <strong className="text-primary font-semibold">Obs:</strong> {block.notes}
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
          className={`w-full h-12 text-sm font-extrabold transition-all flex items-center justify-center gap-2 rounded-xl shadow-lg ${
            isSeriesAllDone
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              : 'bg-primary hover:opacity-90 text-primary-foreground shadow-primary/25'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          {isSeriesAllDone
            ? `Finalizar Série ${activeSeries} (Pronta)`
            : `Concluir Série ${activeSeries}`}
        </Button>

        <button
          type="button"
          onClick={onCompleteSheet}
          disabled={!sheet}
          className="w-full min-h-[36px] text-center text-xs text-[#8A8F98] hover:text-white py-1.5 transition-colors font-medium"
        >
          Marcar toda a ficha como concluída
        </button>
      </div>
    </div>
  )
}
