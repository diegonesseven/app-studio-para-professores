import { useEffect, useState } from 'react'
import { workoutProgressService } from '@/services/workoutProgress'
import { studentsService } from '@/services/students'
import { exercisesService } from '@/services/exercises'
import type { WorkoutProgress, Student, Exercise } from '@/types'
import {
  History,
  Search,
  Calendar,
  CheckCircle2,
  User,
  Clock,
  Dumbbell,
  Loader2,
  Eye,
  X,
  Filter,
  GraduationCap,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

export default function HistoryPage() {
  const [historyList, setHistoryList] = useState<WorkoutProgress[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [exercisesMap, setExercisesMap] = useState<Record<string, Exercise>>({})
  const [loading, setLoading] = useState(true)

  // Filtros
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Detalhes da Sessão Modal
  const [selectedSession, setSelectedSession] = useState<WorkoutProgress | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [allProgress, allStudents, allExercises] = await Promise.all([
        workoutProgressService.getAll(
          selectedStudentFilter !== 'all' ? selectedStudentFilter : undefined,
        ),
        studentsService.getAll(),
        exercisesService.getAll(),
      ])

      setHistoryList(allProgress)
      setStudents(allStudents)

      const map: Record<string, Exercise> = {}
      allExercises.forEach((e) => {
        map[e.id] = e
      })
      setExercisesMap(map)
    } catch (err: unknown) {
      toast({
        title: 'Erro ao carregar histórico',
        description: err instanceof Error ? err.message : 'Falha na conexão',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedStudentFilter])

  // Filtragem combinada por busca de texto
  const filteredList = historyList.filter((item) => {
    const sName = item.expand?.student?.name || ''
    return sName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History className="w-7 h-7 text-primary" /> Histórico de Treinos
          </h1>
          <p className="text-sm text-[#8A8F98] mt-1">
            Registro cronológico das séries realizadas pelos alunos em aula no Studio Bru Oliveira
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Input
            placeholder="Pesquisar por nome do aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#1E1E1E] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 pl-11 pr-4 focus-visible:ring-primary"
          />
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
        </div>

        <div className="relative">
          <select
            value={selectedStudentFilter}
            onChange={(e) => setSelectedStudentFilter(e.target.value)}
            className="w-full h-12 bg-[#1E1E1E] border border-[#2E2E2E] text-white rounded-md px-3.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos os Alunos</option>
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
          <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98] pointer-events-none" />
        </div>
      </div>

      {/* Lista de Registros */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#8A8F98] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Carregando histórico do estúdio...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2A2A2A] flex items-center justify-center text-[#8A8F98] mb-4">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Nenhum registro de treino encontrado
          </h3>
          <p className="text-sm text-[#8A8F98] max-w-sm">
            Conforme as aulas forem conduzidas na Tela de Treino e as séries concluídas, o histórico
            será preenchido automaticamente aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((entry) => {
            const studentName = entry.expand?.student?.name || 'Aluno'
            const dateObj = new Date(entry.completed_at || entry.created)
            const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })
            const timeFormatted = dateObj.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })

            const exerciseCount = entry.exercises_snapshot?.length || 0

            return (
              <div
                key={entry.id}
                className="bg-[#1E1E1E] border border-[#2E2E2E] hover:border-primary/40 rounded-xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors truncate">
                        {studentName}
                      </h3>
                      <Badge className="bg-primary text-primary-foreground font-bold text-xs px-2.5">
                        Treino {entry.series_completed}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#8A8F98] mt-1 flex-wrap">
                      <span className="flex items-center gap-1 capitalize">
                        <Calendar className="w-3.5 h-3.5" /> {dateFormatted}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {timeFormatted}
                      </span>
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5" /> {exerciseCount} exercícios
                      </span>
                      {entry.expand?.teacher?.name && (
                        <span className="flex items-center gap-1 text-secondary font-medium">
                          <GraduationCap className="w-3.5 h-3.5" /> Prof.{' '}
                          {entry.expand.teacher.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSession(entry)}
                    className="border-[#2E2E2E] bg-[#141414] hover:bg-[#2A2A2A] text-white text-xs h-9 px-3.5 flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-primary" /> Ver Detalhes
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Detalhes da Sessão */}
      <Dialog
        open={Boolean(selectedSession)}
        onOpenChange={(open) => !open && setSelectedSession(null)}
      >
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-xl max-h-[85vh] flex flex-col">
          <DialogHeader className="border-b border-[#2E2E2E] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-primary font-bold">
                Resumo da Aula
              </span>
              <Badge className="bg-primary text-primary-foreground text-xs font-bold">
                Treino {selectedSession?.series_completed}
              </Badge>{' '}
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              {selectedSession?.expand?.student?.name || 'Aluno'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8A8F98] flex items-center gap-2 flex-wrap pt-0.5">
              <span>
                Finalizado em{' '}
                {selectedSession &&
                  new Date(selectedSession.completed_at || selectedSession.created).toLocaleString(
                    'pt-BR',
                  )}
              </span>
              {selectedSession?.expand?.teacher?.name && (
                <span className="text-secondary font-semibold flex items-center gap-1">
                  • Professor responsável: {selectedSession.expand.teacher.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 overflow-y-auto space-y-3 flex-1 pr-1">
            <span className="text-xs font-semibold text-[#8A8F98] uppercase tracking-wider block">
              Exercícios Executados na Sessão:
            </span>

            {selectedSession?.exercises_snapshot &&
            selectedSession.exercises_snapshot.length > 0 ? (
              selectedSession.exercises_snapshot.map((block, i) => {
                const ex = exercisesMap[block.exercise_id]
                const name = ex?.name || 'Exercício'
                const muscle = ex?.muscle_group || 'Geral'

                return (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[#2EA55B]/20 text-[#2EA55B] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">{name}</span>
                        <span className="text-[11px] text-[#8A8F98]">{muscle}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-semibold text-white block">
                        {block.sets}x {block.reps || '10'}
                      </span>
                      <span className="text-[11px] text-primary">
                        {block.load ? `Carga: ${block.load}` : 'Carga padrão'}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-[#8A8F98] italic">
                Nenhum detalhe individual de exercício arquivado neste registro.
              </p>
            )}

            {selectedSession?.notes && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="font-bold text-[#8A8F98] block mb-1">Anotações da aula:</span>
                <p className="text-white">{selectedSession.notes}</p>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-[#2E2E2E] pt-3">
            <Button
              type="button"
              onClick={() => setSelectedSession(null)}
              className="w-full sm:w-auto bg-primary hover:opacity-90 text-primary-foreground text-xs h-9"
            >
              Fechar Detalhes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
