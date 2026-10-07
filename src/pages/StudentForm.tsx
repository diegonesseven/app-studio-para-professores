import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { studentsService } from '@/services/students'
import { type ExperienceLevel, type GoalOption, GOAL_OPTIONS } from '@/types'
import {
  ArrowLeft,
  User,
  HeartPulse,
  Save,
  Trash2,
  Calendar,
  Phone,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function StudentForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

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

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (id) {
      setLoading(true)
      studentsService
        .getById(id)
        .then((st) => {
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

          // Abre a seção de anamnese se houver dados
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

      // Conforme especificação: "A successful save shows a toast 'Aluno salvo com sucesso' and navigates to the student's training screen."
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
        <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#2E2E2E]">
            <div className="w-10 h-10 rounded-xl bg-[#F06A2A]/15 border border-[#F06A2A]/30 text-[#F06A2A] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
              </h2>
              <p className="text-xs text-[#8A8F98]">
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
              className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 focus-visible:ring-[#F06A2A]"
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
                  className="bg-[#121212] border-[#2E2E2E] text-white h-12 focus-visible:ring-[#F06A2A]"
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
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 focus-visible:ring-[#F06A2A]"
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
              className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] resize-none focus-visible:ring-[#F06A2A]"
            />
          </div>
        </div>

        {/* Bloco 2: Anamnese (Colapsável / Opcional) */}
        <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl shadow-xl overflow-hidden">
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
                            ? 'bg-[#F06A2A] border-[#F06A2A] text-white shadow-md shadow-[#F06A2A]/20'
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
                            ? 'bg-[#F06A2A]/20 border-[#F06A2A] text-[#F06A2A]'
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
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] resize-none focus-visible:ring-[#F06A2A]"
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
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] resize-none focus-visible:ring-[#F06A2A]"
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
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] resize-none focus-visible:ring-[#F06A2A]"
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
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] resize-none focus-visible:ring-[#F06A2A]"
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
            className="bg-[#F06A2A] hover:bg-[#D95C1C] text-white font-bold h-12 px-8 shadow-lg text-base"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Aluno'}
          </Button>
        </div>
      </form>

      {/* Confirmação de Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              Excluir cadastro de aluno?
            </DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              Esta ação removerá permanentemente o aluno &quot;{name}&quot; e suas fichas associadas
              do sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
