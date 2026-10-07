import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { studentsService } from '@/services/students'
import { workoutProgressService } from '@/services/workoutProgress'
import { exercisesService } from '@/services/exercises'
import {
  type ExperienceLevel,
  type GoalOption,
  GOAL_OPTIONS,
  type WorkoutProgress,
  type Exercise,
  type Student,
} from '@/types'
import { trainingSheetsService } from '@/services/trainingSheets'
import { shareOrExportSheet } from '@/services/trainingSheetPdf'
import {
  ArrowLeft,
  User,
  HeartPulse,
  Save,
  Trash2,
  Calendar,
  Phone,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  History,
  GraduationCap,
  Clock,
  Dumbbell,
  CheckCircle2,
  Eye,
  Share2,
} from 'lucide-react'

export default function StudentForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  // Dados Básicos
  const [name, setName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [phone, setPhone] = useState('')
  const [generalObservations, setGeneralObservations] = useState('')

  // Anamnese (opcional)
  const [anamneseOpen, setAnamneseOpen] = useState(false)
  const [healthHistory, setHealthHistory] = useState('')
  const [injuries, setInjuries] = useState('')
  const [surgeries, setSurgeries] = useState('')
  const [restrictions, setRestrictions] = useState('')
  const [goals, setGoals] = useState<GoalOption[]>([])
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Iniciante')
  const [teacherObservations, setTeacherObservations] = useState('')

  // Histórico de treinos do aluno com o professor
  const [studentHistory, setStudentHistory] = useState<WorkoutProgress[]>([])
  const [exercisesMap, setExercisesMap] = useState<Record<string, Exercise>>({})
  const [selectedHistorySession, setSelectedHistorySession] = useState<WorkoutProgress | null>(null)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (id) {
      setLoading(true)
      Promise.all([
        studentsService.getById(id),
        workoutProgressService.getAll(id, 50),
        exercisesService.getAll(),
      ])
        .then(([st, history, exList]) => {
          setName(st.name)
          setBirthdate(st.birthdate ? st.birthdate.split('T')[0] : '')
          setPhone(st.phone || '')
          setGeneralObservations(st.general_observations || '')

          setHealthHistory(st.health_history || '')
          setInjuries(st.injuries || '')
          setSurgeries(st.surgeries || '')
          setRestrictions(st.restrictions || '')
          setGoals(st.goals || [])
          setExperienceLevel(st.experience_level || 'Iniciante')
          setTeacherObservations(st.teacher_observations || '')

          setStudentHistory(history)
          const map: Record<string, Exercise> = {}
          exList.forEach((e) => {
            map[e.id] = e
          })
          setExercisesMap(map)

          if (
            st.health_history ||
            st.injuries ||
            st.surgeries ||
            st.restrictions ||
            (st.goals && st.goals.length > 0) ||
            st.teacher_observations
          ) {
            setAnamneseOpen(true)
          }
        })
        .catch((err) => {
          toast({
            title: 'Erro ao carregar aluno',
            description: err instanceof Error ? err.message : 'Não encontrado',
            variant: 'destructive',
          })
          navigate('/alunos')
        })
        .finally(() => setLoading(false))
    }
  }, [id, navigate])

  const toggleGoal = (goal: GoalOption) => {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome completo do aluno.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        birthdate: birthdate ? new Date(birthdate).toISOString() : undefined,
        phone: phone.trim() || undefined,
        general_observations: generalObservations.trim() || undefined,
        health_history: healthHistory.trim() || undefined,
        injuries: injuries.trim() || undefined,
        surgeries: surgeries.trim() || undefined,
        restrictions: restrictions.trim() || undefined,
        goals: goals.length ? goals : undefined,
        experience_level: experienceLevel,
        teacher_observations: teacherObservations.trim() || undefined,
      }

      let savedId = id
      if (isEditing && id) {
        await studentsService.update(id, payload)
        toast({
          title: 'Aluno salvo com sucesso',
          description: 'Cadastro atualizado.',
        })
      } else {
        const created = await studentsService.create(payload)
        savedId = created.id
        toast({
          title: 'Aluno salvo com sucesso',
          description: 'Novo aluno cadastrado no Studio Bru Oliveira.',
        })
      }

      navigate(`/treino?students=${savedId}`)
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar aluno',
        description: err instanceof Error ? err.message : 'Falha na gravação',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await studentsService.delete(id)
      toast({
        title: 'Aluno excluído',
        description: 'Cadastro removido com sucesso.',
      })
      navigate('/alunos')
    } catch (err: unknown) {
      toast({
        title: 'Erro ao excluir',
        description: err instanceof Error ? err.message : 'Falha na exclusão',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-[#8A8F98]">Carregando dados do aluno...</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-16">
      <div className="flex items-center justify-between">
        <Link
          to="/alunos"
          className="inline-flex items-center gap-1.5 text-sm text-[#8A8F98] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Alunos
        </Link>
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs h-9"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Excluir Cadastro
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bloco 1: Dados Básicos */}
        <div className="bg-[#181C2E] border border-[#252B3E] rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#252B3E]">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 text-secondary flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
              </h2>
              <p className="text-xs text-[#9CA5B8]">
                Informações de contato e dados pessoais básicos
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm text-white font-medium">
              Nome Completo *
            </Label>
            <Input
              id="name"
              required
              placeholder="Ex: Mariana Costa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 focus-visible:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="birthdate" className="text-sm text-white font-medium">
                Data de Nascimento
              </Label>
              <div className="relative">
                <Input
                  id="birthdate"
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="bg-[#121212] border-[#2E2E2E] text-white h-12 focus-visible:ring-primary"
                />
                <Calendar className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98] pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm text-white font-medium">
                Telefone de Contato / WhatsApp
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 focus-visible:ring-primary"
                />
                <Phone className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98] pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs" className="text-sm text-white font-medium">
              Observações Gerais
            </Label>
            <Textarea
              id="obs"
              rows={2}
              placeholder="Ex: Dias e horários de preferência, metas pessoais, profissão..."
              value={generalObservations}
              onChange={(e) => setGeneralObservations(e.target.value)}
              className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] resize-none focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Bloco 2: Histórico de Treinos e Professor (Exibido na edição do aluno) */}
        {isEditing && (
          <div className="bg-[#181C2E] border border-[#252B3E] rounded-2xl shadow-xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#252B3E] gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-secondary/40 text-secondary flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Histórico de Treinos com Professor
                    <span className="text-xs bg-primary/30 text-white font-semibold px-2 py-0.5 rounded-full">
                      {studentHistory.length} sessões
                    </span>
                  </h3>
                  <p className="text-xs text-[#9CA5B8]">
                    Séries treinadas (A–E), dias, horários e professores responsáveis que
                    acompanharam o aluno
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const sheet = await trainingSheetsService.getByStudent(id)
                      if (!sheet) {
                        toast({
                          title: 'Sem ficha cadastrada',
                          description: 'Monte a ficha deste aluno antes de exportar.',
                          variant: 'destructive',
                        })
                        return
                      }
                      const st: Student = {
                        id,
                        name,
                        phone,
                        birthdate,
                        experience_level: experienceLevel,
                        restrictions,
                        goals,
                        created: '',
                        updated: '',
                      }
                      const res = await shareOrExportSheet({
                        student: st,
                        sheet,
                        exercisesMap,
                      })
                      if (res === 'opened') {
                        toast({
                          title: 'Ficha Pronta para Exportação / PDF',
                          description: 'Janela aberta para impressão e salvamento como PDF.',
                        })
                      }
                    } catch {
                      toast({
                        title: 'Erro ao gerar PDF',
                        description: 'Falha ao processar os dados da ficha.',
                        variant: 'destructive',
                      })
                    }
                  }}
                  className="border-secondary/40 bg-secondary/15 hover:bg-secondary/25 text-white font-bold text-xs h-9 px-3 flex items-center gap-1.5"
                  title="Exportar / Compartilhar ficha deste aluno em PDF"
                >
                  <Share2 className="w-3.5 h-3.5 text-secondary" /> Exportar Ficha (PDF)
                </Button>

                <Link to={`/treino?students=${id}`}>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs h-9 px-3.5"
                  >
                    Abrir Treino Deste Aluno
                  </Button>
                </Link>
              </div>
            </div>

            {studentHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#9CA5B8] bg-[#121522] rounded-xl border border-[#252B3E] p-6 space-y-1">
                <History className="w-8 h-8 text-[#9CA5B8] opacity-40 mx-auto mb-2" />
                <p className="font-semibold text-white text-sm">Nenhum treino registrado ainda</p>
                <p>
                  Assim que o professor iniciar as séries na Tela de Treino, o histórico detalhado
                  aparecerá aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {studentHistory.map((sess) => {
                  const dateObj = new Date(sess.completed_at || sess.created)
                  const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                  const timeFormatted = dateObj.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const teacherName = sess.expand?.teacher?.name || 'Professor'
                  const totalExercises = sess.exercises_snapshot?.length || 0
                  const completedIndices = sess.completed_indices || []
                  const countDone =
                    completedIndices.length > 0
                      ? completedIndices.length
                      : sess.is_completed !== false && totalExercises > 0
                        ? totalExercises
                        : 0

                  return (
                    <div
                      key={sess.id}
                      className="bg-[#121522] border border-[#252B3E] hover:border-primary/50 rounded-xl p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 text-primary font-black text-sm flex items-center justify-center shrink-0">
                          {sess.series_completed}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">
                              Série {sess.series_completed}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                sess.is_completed
                                  ? 'bg-secondary/20 text-secondary border border-secondary/40'
                                  : 'bg-primary/20 text-primary border border-primary/30'
                              }`}
                            >
                              {sess.is_completed ? 'Concluída' : 'Em andamento'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#9CA5B8] mt-1 flex-wrap">
                            <span className="flex items-center gap-1 capitalize">
                              <Calendar className="w-3.5 h-3.5" /> {dateFormatted}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {timeFormatted}
                            </span>
                            <span className="flex items-center gap-1">
                              <Dumbbell className="w-3.5 h-3.5" /> {countDone}/{totalExercises}{' '}
                              exercícios
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-secondary">
                              <GraduationCap className="w-3.5 h-3.5" /> Prof. {teacherName}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedHistorySession(sess)}
                          className="border-[#2E2E2E] bg-[#171717] hover:bg-[#252525] text-white text-xs h-8 px-2.5 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-secondary" /> Ver Exercícios
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Bloco 3: Anamnese (Colapsável / Opcional) */}
        <div className="bg-[#181C2E] border border-[#252B3E] rounded-2xl shadow-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setAnamneseOpen(!anamneseOpen)}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#252525] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Anamnese (opcional)
                  <span className="text-xs bg-[#2A2A2A] text-[#8A8F98] font-normal px-2 py-0.5 rounded-full">
                    Não impede criação de fichas
                  </span>
                </h3>
                <p className="text-xs text-[#8A8F98]">
                  Histórico médico, lesões, cirurgias, restrições e objetivos
                </p>
              </div>
            </div>

            {anamneseOpen ? (
              <ChevronUp className="w-5 h-5 text-[#8A8F98]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#8A8F98]" />
            )}
          </button>

          {anamneseOpen && (
            <div className="p-6 sm:p-8 pt-0 border-t border-[#2E2E2E] space-y-5 animate-fade-in">
              {/* Nível de Experiência */}
              <div className="space-y-2 pt-4">
                <Label className="text-sm text-white font-medium">
                  Nível de Experiência do Aluno
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Iniciante', 'Intermediário', 'Avançado'] as ExperienceLevel[]).map(
                    (level) => (
                      <button
                        type="button"
                        key={level}
                        onClick={() => setExperienceLevel(level)}
                        className={`h-11 rounded-lg text-xs sm:text-sm font-semibold transition-all border ${
                          experienceLevel === level
                            ? 'bg-primary border-primary text-primary-foreground shadow-md'
                            : 'bg-[#121212] border-[#2E2E2E] text-[#8A8F98] hover:text-white'
                        }`}
                      >
                        {level}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Objetivos */}
              <div className="space-y-2">
                <Label className="text-sm text-white font-medium">Objetivos Principais</Label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map((goal) => {
                    const isSelected = goals.includes(goal)
                    return (
                      <button
                        type="button"
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-primary/20 border-primary text-secondary font-bold'
                            : 'bg-[#121212] border-[#2E2E2E] text-[#8A8F98] hover:text-white'
                        }`}
                      >
                        {goal}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Restrições (Importante) */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="restr"
                  className="text-sm text-amber-300 font-medium flex items-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4" /> Restrições Médicas / Cuidados em Aula
                </Label>
                <Textarea
                  id="restr"
                  rows={2}
                  placeholder="Ex: Não pode correr, joelho sensível, hipertensão controlada..."
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  className="bg-[#121212] border-amber-900/50 text-white placeholder:text-[#8A8F98] resize-none focus-visible:ring-amber-500"
                />
              </div>

              {/* Lesões */}
              <div className="space-y-1.5">
                <Label htmlFor="inj" className="text-sm text-white font-medium">
                  Lesões Anteriores ou Dores Crônicas
                </Label>
                <Textarea
                  id="inj"
                  rows={2}
                  placeholder="Ex: Hérnia de disco L4-L5 em 2021, tendinite no ombro..."
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] resize-none focus-visible:ring-primary"
                />
              </div>

              {/* Cirurgias */}
              <div className="space-y-1.5">
                <Label htmlFor="surg" className="text-sm text-white font-medium">
                  Cirurgias Realizadas
                </Label>
                <Textarea
                  id="surg"
                  rows={2}
                  placeholder="Ex: Artroscopia joelho esquerdo, apendicectomia..."
                  value={surgeries}
                  onChange={(e) => setSurgeries(e.target.value)}
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] resize-none focus-visible:ring-primary"
                />
              </div>

              {/* Histórico Clínico */}
              <div className="space-y-1.5">
                <Label htmlFor="health" className="text-sm text-white font-medium">
                  Histórico de Saúde Geral
                </Label>
                <Textarea
                  id="health"
                  rows={2}
                  placeholder="Ex: Histórico familiar de cardiopatias, diabetes, medicamentos de uso contínuo..."
                  value={healthHistory}
                  onChange={(e) => setHealthHistory(e.target.value)}
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] resize-none focus-visible:ring-primary"
                />
              </div>

              {/* Observações do Professor */}
              <div className="space-y-1.5">
                <Label htmlFor="profObs" className="text-sm text-white font-medium">
                  Observações e Avaliação do Professor
                </Label>
                <Textarea
                  id="profObs"
                  rows={2}
                  placeholder="Ex: Avaliação postural inicial, testes de mobilidade de quadril e tornozelo..."
                  value={teacherObservations}
                  onChange={(e) => setTeacherObservations(e.target.value)}
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] resize-none focus-visible:ring-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Botão de Salvar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/alunos">
            <Button
              type="button"
              variant="outline"
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white h-12 px-5"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-primary hover:opacity-90 text-primary-foreground font-bold h-12 px-8 shadow-lg text-base"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Aluno'}
          </Button>
        </div>
      </form>

      {/* Modal de Detalhes dos Exercícios Concluídos no Treino */}
      <Dialog
        open={Boolean(selectedHistorySession)}
        onOpenChange={(open) => !open && setSelectedHistorySession(null)}
      >
        <DialogContent className="bg-[#181C2E] border-[#252B3E] text-white sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader className="border-b border-[#252B3E] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-secondary font-bold">
                Detalhes da Aula
              </span>
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Série {selectedHistorySession?.series_completed}
              </span>
            </div>
            <DialogTitle className="text-lg font-bold text-white">{name || 'Aluno'}</DialogTitle>
            <DialogDescription className="text-xs text-[#9CA5B8] flex items-center gap-2 flex-wrap pt-0.5">
              <span>
                {selectedHistorySession &&
                  new Date(
                    selectedHistorySession.completed_at || selectedHistorySession.created,
                  ).toLocaleString('pt-BR')}
              </span>
              <span className="text-secondary font-semibold">
                • Professor: {selectedHistorySession?.expand?.teacher?.name || 'Professor'}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 overflow-y-auto space-y-2.5 flex-1 pr-1">
            <span className="text-xs font-semibold text-[#9CA5B8] uppercase tracking-wider block">
              Exercícios da Série {selectedHistorySession?.series_completed}:
            </span>

            {selectedHistorySession?.exercises_snapshot &&
            selectedHistorySession.exercises_snapshot.length > 0 ? (
              selectedHistorySession.exercises_snapshot.map((block, i) => {
                const ex = exercisesMap[block.exercise_id]
                const exName = ex?.name || 'Exercício'
                const muscle = ex?.muscle_group || 'Geral'
                const isMarkedDone = selectedHistorySession.completed_indices
                  ? selectedHistorySession.completed_indices.includes(i)
                  : Boolean(selectedHistorySession.is_completed)

                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isMarkedDone
                        ? 'bg-secondary/10 border-secondary/40'
                        : 'bg-[#121522] border-[#252B3E] opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isMarkedDone
                            ? 'bg-secondary text-secondary-foreground font-bold'
                            : 'border border-[#454545] text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">{exName}</span>
                        <span className="text-[11px] text-[#9CA5B8]">{muscle}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-semibold text-white block">
                        {block.sets}x {block.reps || '10'}
                      </span>
                      <span className="text-[11px] text-secondary font-medium">
                        {block.load ? `Carga: ${block.load}` : 'Carga padrão'}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-[#9CA5B8] italic">
                Nenhum detalhe de exercício registrado para esta sessão.
              </p>
            )}

            {selectedHistorySession?.notes && (
              <div className="p-3 rounded-xl bg-[#121522] border border-[#252B3E] text-xs">
                <span className="font-bold text-[#9CA5B8] block mb-1">Anotações:</span>
                <p className="text-white">{selectedHistorySession.notes}</p>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-[#252B3E] pt-3">
            <Button
              type="button"
              onClick={() => setSelectedHistorySession(null)}
              className="w-full sm:w-auto bg-primary hover:opacity-90 text-primary-foreground text-xs h-9 font-semibold"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#181C2E] border-[#252B3E] text-white">
          <DialogHeader>
            <DialogTitle>Excluir Aluno?</DialogTitle>
            <DialogDescription className="text-[#9CA5B8]">
              Esta ação removerá o aluno "{name}" do sistema. Fichas vinculadas também poderão ser
              afetadas. Deseja prosseguir?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { StudentForm }
