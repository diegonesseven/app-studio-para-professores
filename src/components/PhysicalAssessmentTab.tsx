import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { physicalAssessmentsService } from '@/services/physicalAssessments'
import {
  type PhysicalAssessment,
  type PhysicalAssessmentData,
  type BilateralMeasure,
} from '@/types'
import {
  calculateAge,
  calculateImc,
  classifyImc,
  classifyBodyFat,
  classifySkeletalMuscle,
  classifyVisceralFat,
  type ClassificationResult,
} from '@/lib/omronClassification'
import { OmronReferenceModal } from '@/components/OmronReferenceModal'
import pb from '@/lib/pocketbase/client'
import {
  Activity,
  Plus,
  Trash2,
  Calendar,
  BookOpen,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowDown,
  ArrowUp,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'

interface PhysicalAssessmentTabProps {
  studentId: string
  studentName?: string
  studentBirthdate?: string
}

export function PhysicalAssessmentTab({
  studentId,
  studentName,
  studentBirthdate,
}: PhysicalAssessmentTabProps) {
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [referenceModalOpen, setReferenceModalOpen] = useState(false)

  // Altura fixa (armazenada/lembrada na avaliação mais recente ou localmente)
  const [fixedHeight, setFixedHeight] = useState<string>('')
  // Idade calculada
  const studentAge = useMemo(() => calculateAge(studentBirthdate), [studentBirthdate])

  // Diálogo para adicionar avaliação
  const [newDateDialogOpen, setNewDateDialogOpen] = useState(false)
  const [newAssessmentDate, setNewAssessmentDate] = useState(new Date().toISOString().split('T')[0])
  const [newAssessmentSex, setNewAssessmentSex] = useState<'M' | 'F'>('F')
  const [creating, setCreating] = useState(false)

  // Diálogo para deletar avaliação
  const [deleteCandidate, setDeleteCandidate] = useState<PhysicalAssessment | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Estado para inline edit
  const [savingCellKey, setSavingCellKey] = useState<string | null>(null)

  // Carregar avaliações do aluno
  const loadAssessments = useCallback(async () => {
    if (!studentId) return
    try {
      setLoading(true)
      const list = await physicalAssessmentsService.getByStudent(studentId)
      setAssessments(list)

      // Se já existe alguma avaliação com altura armazenada na chave local ou em alguma das avaliações
      const storedHeight = localStorage.getItem(`student_height_${studentId}`)
      if (storedHeight) {
        setFixedHeight(storedHeight)
      }
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar avaliações',
        description: 'Não foi possível buscar as avaliações físicas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    loadAssessments()
  }, [loadAssessments])

  // Inscrição Realtime no PocketBase para sincronizar avaliações físicas em tempo real
  useEffect(() => {
    if (!studentId) return

    const unsubscribePromise = pb.collection('physical_assessments').subscribe('*', (e) => {
      if (e.record && (e.record as any).student === studentId) {
        if (e.action === 'create') {
          setAssessments((prev) => {
            if (prev.some((x) => x.id === e.record.id)) return prev
            const updated = [...prev, e.record as unknown as PhysicalAssessment]
            return updated.sort((a, b) => a.date.localeCompare(b.date))
          })
        } else if (e.action === 'update') {
          setAssessments((prev) =>
            prev.map((x) =>
              x.id === e.record.id ? (e.record as unknown as PhysicalAssessment) : x,
            ),
          )
        } else if (e.action === 'delete') {
          setAssessments((prev) => prev.filter((x) => x.id !== e.record.id))
        }
      }
    })

    return () => {
      unsubscribePromise.then((unsub) => {
        try {
          unsub()
        } catch {
          /* intentionally ignored */
        }
      })
    }
  }, [studentId])

  // Salvar altura fixa
  const handleHeightChange = (val: string) => {
    setFixedHeight(val)
    localStorage.setItem(`student_height_${studentId}`, val)
  }

  // Criar nova avaliação
  const handleCreateAssessment = async () => {
    if (!studentId) return
    setCreating(true)
    try {
      const created = await physicalAssessmentsService.create({
        student: studentId,
        date: newAssessmentDate,
        sex: newAssessmentSex,
        data: {},
      })
      setAssessments((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)))
      setNewDateDialogOpen(false)
      toast({
        title: 'Avaliação física criada',
        description: `Coluna com a data ${new Date(newAssessmentDate + 'T00:00:00').toLocaleDateString('pt-BR')} adicionada com sucesso.`,
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao criar avaliação',
        description: err instanceof Error ? err.message : 'Falha na gravação',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  // Excluir avaliação
  const handleDeleteAssessment = async () => {
    if (!deleteCandidate) return
    setDeleting(true)
    try {
      await physicalAssessmentsService.delete(deleteCandidate.id)
      setAssessments((prev) => prev.filter((a) => a.id !== deleteCandidate.id))
      setDeleteCandidate(null)
      toast({
        title: 'Avaliação excluída',
        description: 'A coluna da avaliação foi removida.',
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao excluir avaliação',
        description: err instanceof Error ? err.message : 'Falha ao remover',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  // Atualizar campo de composição corporal ou perimetria
  const handleUpdateField = async (
    assessment: PhysicalAssessment,
    path: string,
    rawVal: string,
    subKey?: 'direito' | 'esquerdo',
  ) => {
    const cellKey = `${assessment.id}-${path}-${subKey || ''}`
    setSavingCellKey(cellKey)

    const numVal = rawVal.trim() === '' ? null : parseFloat(rawVal.replace(',', '.'))
    const currentData = { ...(assessment.data || {}) }

    if (subKey) {
      const currentBilateral: BilateralMeasure = (currentData as any)[path] || {}
      ;(currentData as any)[path] = {
        ...currentBilateral,
        [subKey]: isNaN(numVal as number) ? null : numVal,
      }
    } else {
      ;(currentData as any)[path] = isNaN(numVal as number) ? null : numVal

      // Se mudou o peso e temos altura definida, recalcula IMC se IMC estiver vazio ou for automático
      if (path === 'peso' && numVal && fixedHeight) {
        const heightNum = parseFloat(fixedHeight.replace(',', '.'))
        if (heightNum > 0) {
          const autoImc = calculateImc(numVal, heightNum)
          if (autoImc) {
            currentData.imc = autoImc
          }
        }
      }
    }

    // Atualização otimista local
    setAssessments((prev) =>
      prev.map((a) => (a.id === assessment.id ? { ...a, data: currentData } : a)),
    )

    try {
      await physicalAssessmentsService.update(assessment.id, {
        data: currentData,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao salvar valor',
        description: 'Não foi possível persistir a alteração.',
        variant: 'destructive',
      })
    } finally {
      setSavingCellKey(null)
    }
  }

  // Atualizar data da avaliação inline
  const handleUpdateDate = async (assessment: PhysicalAssessment, newDate: string) => {
    if (!newDate || newDate === assessment.date) return
    try {
      await physicalAssessmentsService.update(assessment.id, { date: newDate })
      setAssessments((prev) =>
        prev
          .map((a) => (a.id === assessment.id ? { ...a, date: newDate } : a))
          .sort((a, b) => a.date.localeCompare(b.date)),
      )
      toast({
        title: 'Data atualizada',
        description: 'A data da avaliação foi salva.',
      })
    } catch {
      toast({
        title: 'Erro ao alterar data',
        variant: 'destructive',
      })
    }
  }

  // Atualizar sexo da avaliação inline (para cálculo Omron)
  const handleUpdateSex = async (assessment: PhysicalAssessment, sex: 'M' | 'F') => {
    try {
      await physicalAssessmentsService.update(assessment.id, { sex })
      setAssessments((prev) => prev.map((a) => (a.id === assessment.id ? { ...a, sex } : a)))
    } catch {
      toast({
        title: 'Erro ao alterar sexo',
        variant: 'destructive',
      })
    }
  }

  // Helper para badge de classificação
  const renderBadge = (res: ClassificationResult | null) => {
    if (!res) return null
    return (
      <span
        title={res.label}
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${res.badgeBg} ${res.badgeText} ${res.badgeBorder} whitespace-nowrap`}
      >
        {res.statusColor === 'green' && <CheckCircle2 className="w-2.5 h-2.5" />}
        {res.statusColor === 'yellow' && <AlertTriangle className="w-2.5 h-2.5" />}
        {res.statusColor === 'red' && <Flame className="w-2.5 h-2.5" />}
        <span>{res.label}</span>
      </span>
    )
  }

  return (
    <div className="bg-[#181C2E] border border-[#252B3E] rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
      {/* Cabeçalho da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#252B3E] gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-white">Avaliação Física e Perimetria</h3>
              <span className="text-xs bg-primary/30 text-white font-semibold px-2 py-0.5 rounded-full">
                {assessments.length} {assessments.length === 1 ? 'avaliação' : 'avaliações'}
              </span>
            </div>
            <p className="text-xs text-[#9CA5B8]">
              Composição corporal por bioimpedância (Omron) e perimetria bilateral ao longo do tempo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReferenceModalOpen(true)}
            className="border-primary/40 bg-primary/10 hover:bg-primary/20 text-white text-xs h-9 px-3 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-secondary" /> Tabelas Omron
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              setNewAssessmentDate(new Date().toISOString().split('T')[0])
              setNewDateDialogOpen(true)
            }}
            className="bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs h-9 px-3 flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" /> + Nova Avaliação
          </Button>
        </div>
      </div>

      {/* Bloco Cinza do Topo (Idade e Altura - Fixos conforme Imagem 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[#121522] border border-[#252B3E] p-4 rounded-xl">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" /> IDADE
          </span>
          <div className="text-sm font-black text-white flex items-center gap-2">
            {studentAge !== null ? `${studentAge} anos` : 'Não informada'}
            {studentBirthdate && (
              <span className="text-[11px] text-[#8A8F98] font-normal">
                ({new Date(studentBirthdate).toLocaleDateString('pt-BR')})
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="fixed-height"
            className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-primary" /> ALTURA (cm ou m)
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="fixed-height"
              placeholder="Ex: 170 ou 1.70"
              value={fixedHeight}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="bg-[#181C2E] border-[#252B3E] text-white h-9 text-xs w-32 focus-visible:ring-primary"
            />
            <span className="text-xs text-[#8A8F98]">cm</span>
          </div>
        </div>

        <div className="space-y-1 sm:col-span-2 flex items-center gap-2 text-xs text-[#9CA5B8] bg-[#181C2E]/60 p-2.5 rounded-lg border border-[#252B3E]/60">
          <Info className="w-4 h-4 text-secondary shrink-0" />
          <span>
            Os valores preenchidos abaixo calculam o IMC e classificam automaticamente % Gordura, %
            Músculo e Gordura Visceral conforme as tabelas Omron. Edição inline direta nas células.
          </span>
        </div>
      </div>

      {/* Tabela de Avaliação Física estilo Planilha da Imagem 1 */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#8A8F98]">
          Carregando avaliações físicas...
        </div>
      ) : assessments.length === 0 ? (
        <div className="py-12 text-center bg-[#121522] rounded-xl border border-[#252B3E] p-8 space-y-3">
          <Activity className="w-10 h-10 text-primary/40 mx-auto" />
          <h4 className="text-base font-bold text-white">Nenhuma avaliação física registrada</h4>
          <p className="text-xs text-[#9CA5B8] max-w-md mx-auto">
            Clique no botão <strong>"+ Nova Avaliação"</strong> para criar a primeira coluna datada
            e preencher os dados de bioimpedância e perimetria do aluno.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => setNewDateDialogOpen(true)}
            className="bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs h-9 px-4"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Adicionar Primeira Avaliação
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Dica de scroll horizontal em telas estreitas */}
          <div className="flex items-center justify-between text-xs text-[#8A8F98]">
            <span className="flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Role horizontalmente para ver todas as
              avaliações <ChevronRight className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-secondary">
              Valores salvos automaticamente na nuvem
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#252B3E] bg-[#121522] shadow-inner max-w-full">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              {/* CABEÇALHO COM DATAS */}
              <thead>
                {/* Linha 1: DATA: */}
                <tr className="bg-[#1A2138] border-b border-[#252B3E]">
                  <th className="p-3 font-bold text-white uppercase tracking-wider w-56 sticky left-0 bg-[#1A2138] z-20 border-r border-[#252B3E]">
                    PARÂMETRO / MEDIDA
                  </th>
                  {assessments.map((ass) => {
                    const rawDate = ass.date ? ass.date.split('T')[0] : ''
                    return (
                      <th
                        key={ass.id}
                        colSpan={2}
                        className="p-2.5 text-center font-bold text-white border-r border-[#252B3E] bg-[#181C2E]"
                      >
                        <div className="flex items-center justify-between gap-1 px-1">
                          <span className="text-[11px] text-primary font-bold">DATA:</span>
                          <input
                            type="date"
                            value={rawDate}
                            onChange={(e) => handleUpdateDate(ass, e.target.value)}
                            className="bg-[#121522] border border-[#252B3E] text-white text-xs px-1.5 py-0.5 rounded font-mono"
                            title="Clique para alterar a data"
                          />
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(ass)}
                            className="p-1 rounded hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-colors"
                            title="Excluir coluna desta avaliação"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {/* Seletor de sexo específico para esta avaliação */}
                        <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-[#9CA5B8]">
                          <span>Sexo:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateSex(ass, 'F')}
                            className={`px-1.5 py-0.5 rounded ${
                              ass.sex === 'F' || !ass.sex
                                ? 'bg-pink-500/20 text-pink-300 font-bold border border-pink-500/40'
                                : 'hover:text-white'
                            }`}
                          >
                            Fem (F)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateSex(ass, 'M')}
                            className={`px-1.5 py-0.5 rounded ${
                              ass.sex === 'M'
                                ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                                : 'hover:text-white'
                            }`}
                          >
                            Masc (M)
                          </button>
                        </div>
                      </th>
                    )
                  })}
                </tr>

                {/* Linha 2: Subcolunas DIREITO / ESQUERDO */}
                <tr className="bg-[#141828] border-b border-[#252B3E] text-[11px] text-[#9CA5B8]">
                  <th className="p-2 font-semibold text-white sticky left-0 bg-[#141828] z-20 border-r border-[#252B3E]">
                    SUBDIVISÃO BILATERAL
                  </th>
                  {assessments.map((ass) => (
                    <div key={ass.id} style={{ display: 'contents' }}>
                      <th className="p-2 text-center font-semibold text-[#9CA5B8] border-r border-[#252B3E]/60 w-28 bg-[#15192A]">
                        DIREITO
                      </th>
                      <th className="p-2 text-center font-semibold text-[#9CA5B8] border-r border-[#252B3E] w-28 bg-[#15192A]">
                        ESQUERDO
                      </th>
                    </div>
                  ))}
                </tr>
              </thead>

              {/* CORPO DA TABELA */}
              <tbody className="divide-y divide-[#252B3E] text-white">
                {/* SEÇÃO 1: COMPOSIÇÃO CORPORAL */}
                <tr className="bg-primary/10 border-b border-primary/20">
                  <td
                    colSpan={1 + assessments.length * 2}
                    className="p-2 text-xs font-bold text-secondary uppercase tracking-wider sticky left-0"
                  >
                    1. Composição Corporal (Bioimpedância)
                  </td>
                </tr>

                {/* 1.1 PESO (↓) */}
                <tr className="hover:bg-[#1A2035] transition-colors">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        PESO (kg) <ArrowDown className="w-3 h-3 text-[#9CA5B8]" />
                      </span>
                    </div>
                  </td>
                  {assessments.map((ass) => {
                    const val = ass.data?.peso ?? ''
                    return (
                      <td
                        key={ass.id}
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center"
                      >
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 68.5"
                          defaultValue={val !== '' ? String(val) : ''}
                          onBlur={(e) => handleUpdateField(ass, 'peso', e.target.value)}
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-semibold focus-visible:ring-primary mx-auto max-w-[130px]"
                        />
                      </td>
                    )
                  })}
                </tr>

                {/* 1.2 IMC (↓) */}
                <tr className="hover:bg-[#1A2035] transition-colors bg-[#141828]/50">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        IMC (kg/m²) <ArrowDown className="w-3 h-3 text-[#9CA5B8]" />
                      </span>
                    </div>
                  </td>
                  {assessments.map((ass) => {
                    const imcVal = ass.data?.imc ?? null
                    const classif = classifyImc(imcVal)
                    return (
                      <td
                        key={ass.id}
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Ex: 23.4"
                            defaultValue={imcVal !== null ? String(imcVal) : ''}
                            onBlur={(e) => handleUpdateField(ass, 'imc', e.target.value)}
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-bold focus-visible:ring-primary mx-auto max-w-[130px]"
                          />
                          {renderBadge(classif)}
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* 1.3 % GORDURA (↓) */}
                <tr className="hover:bg-[#1A2035] transition-colors">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">% GORDURA (↓)</span>
                    </div>
                  </td>
                  {assessments.map((ass) => {
                    const fatVal = ass.data?.gordura ?? null
                    const sex = ass.sex || 'F'
                    const classif = classifyBodyFat(fatVal, sex)
                    return (
                      <td
                        key={ass.id}
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Ex: 24.5"
                            defaultValue={fatVal !== null ? String(fatVal) : ''}
                            onBlur={(e) => handleUpdateField(ass, 'gordura', e.target.value)}
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-semibold focus-visible:ring-primary mx-auto max-w-[130px]"
                          />
                          {renderBadge(classif)}
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* 1.4 % MÚSCULOS (↑) - Vermelho/Destacado na Planilha = quanto maior melhor */}
                <tr className="hover:bg-[#1A2035] transition-colors bg-rose-950/15">
                  <td className="p-2.5 font-black text-rose-400 sticky left-0 bg-[#14121A] z-10 border-r border-[#252B3E]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-bold">% MÚSCULOS (↑)</span>
                      <span className="text-[10px] text-rose-300 font-normal">(maior melhor)</span>
                    </div>
                  </td>
                  {assessments.map((ass) => {
                    const musVal = ass.data?.musculos ?? null
                    const sex = ass.sex || 'F'
                    const classif = classifySkeletalMuscle(musVal, sex, studentAge)
                    return (
                      <td
                        key={ass.id}
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center bg-rose-950/10"
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Ex: 28.5"
                            defaultValue={musVal !== null ? String(musVal) : ''}
                            onBlur={(e) => handleUpdateField(ass, 'musculos', e.target.value)}
                            className="bg-[#181C2E] border-rose-900/60 text-white text-xs h-8 text-center font-bold focus-visible:ring-rose-500 mx-auto max-w-[130px]"
                          />
                          {renderBadge(classif)}
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* 1.5 MR (↓) - Metabolismo Basal */}
                <tr className="hover:bg-[#1A2035] transition-colors">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        MR (↓) <span className="text-[10px] text-[#9CA5B8]">(kcal)</span>
                      </span>
                    </div>
                  </td>
                  {assessments.map((ass) => {
                    const val = ass.data?.mr ?? ''
                    return (
                      <td
                        key={ass.id}
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center"
                      >
                        <Input
                          type="number"
                          placeholder="Ex: 1420"
                          defaultValue={val !== '' ? String(val) : ''}
                          onBlur={(e) => handleUpdateField(ass, 'mr', e.target.value)}
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-semibold focus-visible:ring-primary mx-auto max-w-[130px]"
                        />
                      </td>
                    )
                  })}
                </tr>

                {/* 1.6 IDADE BIOLÓGICA (↓) */}
                <tr className="hover:bg-[#1A2035] transition-colors bg-[#141828]/50">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">IDADE BIOLÓGICA (↓)</span>
                    </div>
                  </td>
                  {assessments.map((ass) => {
                    const val = ass.data?.idade_biologica ?? ''
                    return (
                      <td
                        key={ass.id}
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center"
                      >
                        <Input
                          type="number"
                          placeholder="Ex: 27"
                          defaultValue={val !== '' ? String(val) : ''}
                          onBlur={(e) => handleUpdateField(ass, 'idade_biologica', e.target.value)}
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-semibold focus-visible:ring-primary mx-auto max-w-[130px]"
                        />
                      </td>
                    )
                  })}
                </tr>

                {/* 1.7 GORDURA VISCERAL (↓) */}
                <tr className="hover:bg-[#1A2035] transition-colors">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">GORDURA VISCERAL (↓)</span>
                    </div>
                  </td>
                  {assessments.map((ass) => {
                    const viscVal = ass.data?.gordura_visceral ?? null
                    const classif = classifyVisceralFat(viscVal)
                    return (
                      <td
                        key={ass.id}
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Input
                            type="number"
                            placeholder="Ex: 4"
                            defaultValue={viscVal !== null ? String(viscVal) : ''}
                            onBlur={(e) =>
                              handleUpdateField(ass, 'gordura_visceral', e.target.value)
                            }
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-semibold focus-visible:ring-primary mx-auto max-w-[130px]"
                          />
                          {renderBadge(classif)}
                        </div>
                      </td>
                    )
                  })}
                </tr>

                {/* SEÇÃO 2: PERIMETRIA (cm) */}
                <tr className="bg-primary/10 border-b border-primary/20">
                  <td
                    colSpan={1 + assessments.length * 2}
                    className="p-2 text-xs font-bold text-secondary uppercase tracking-wider sticky left-0"
                  >
                    2. Perimetria Corporal (cm)
                  </td>
                </tr>

                {/* 2.1 ANTEBRAÇO (D/E) */}
                <tr className="hover:bg-[#1A2035] transition-colors">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    ANTEBRAÇO
                  </td>
                  {assessments.map((ass) => {
                    const d = ass.data?.antebraco?.direito ?? ''
                    const e = ass.data?.antebraco?.esquerdo ?? ''
                    return (
                      <div key={ass.id} style={{ display: 'contents' }}>
                        <td className="p-1.5 border-r border-[#252B3E]/60 text-center">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Dir"
                            defaultValue={d !== '' ? String(d) : ''}
                            onBlur={(ev) =>
                              handleUpdateField(ass, 'antebraco', ev.target.value, 'direito')
                            }
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                          />
                        </td>
                        <td className="p-1.5 border-r border-[#252B3E] text-center">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Esq"
                            defaultValue={e !== '' ? String(e) : ''}
                            onBlur={(ev) =>
                              handleUpdateField(ass, 'antebraco', ev.target.value, 'esquerdo')
                            }
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                          />
                        </td>
                      </div>
                    )
                  })}
                </tr>

                {/* 2.2 BÍCEPS (D/E) */}
                <tr className="hover:bg-[#1A2035] transition-colors bg-[#141828]/50">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    BÍCEPS
                  </td>
                  {assessments.map((ass) => {
                    const d = ass.data?.biceps?.direito ?? ''
                    const e = ass.data?.biceps?.esquerdo ?? ''
                    return (
                      <div key={ass.id} style={{ display: 'contents' }}>
                        <td className="p-1.5 border-r border-[#252B3E]/60 text-center">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Dir"
                            defaultValue={d !== '' ? String(d) : ''}
                            onBlur={(ev) =>
                              handleUpdateField(ass, 'biceps', ev.target.value, 'direito')
                            }
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                          />
                        </td>
                        <td className="p-1.5 border-r border-[#252B3E] text-center">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Esq"
                            defaultValue={e !== '' ? String(e) : ''}
                            onBlur={(ev) =>
                              handleUpdateField(ass, 'biceps', ev.target.value, 'esquerdo')
                            }
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                          />
                        </td>
                      </div>
                    )
                  })}
                </tr>

                {/* 2.3 TÓRAX (único) */}
                <tr className="hover:bg-[#1A2035] transition-colors">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    TÓRAX
                  </td>
                  {assessments.map((ass) => {
                    const val = ass.data?.torax ?? ''
                    return (
                      <td
                        key={ass.id}
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center"
                      >
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="cm"
                          defaultValue={val !== '' ? String(val) : ''}
                          onBlur={(e) => handleUpdateField(ass, 'torax', e.target.value)}
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary mx-auto max-w-[130px]"
                        />
                      </td>
                    )
                  })}
                </tr>

                {/* 2.4 OMBRO (único) */}
                <tr className="hover:bg-[#1A2035] transition-colors bg-[#141828]/50">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    OMBRO
                  </td>
                  {assessments.map((ass) => {
                    const val = ass.data?.ombro ?? ''
                    return (
                      <td
                        key={ass.id}
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center"
                      >
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="cm"
                          defaultValue={val !== '' ? String(val) : ''}
                          onBlur={(e) => handleUpdateField(ass, 'ombro', e.target.value)}
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary mx-auto max-w-[130px]"
                        />
                      </td>
                    )
                  })}
                </tr>

                {/* 2.5 CINTURA (único) */}
                <tr className="hover:bg-[#1A2035] transition-colors">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    CINTURA
                  </td>
                  {assessments.map((ass) => {
                    const val = ass.data?.cintura ?? ''
                    return (
                      <td
                        key={ass.id}
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center"
                      >
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="cm"
                          defaultValue={val !== '' ? String(val) : ''}
                          onBlur={(e) => handleUpdateField(ass, 'cintura', e.target.value)}
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary mx-auto max-w-[130px]"
                        />
                      </td>
                    )
                  })}
                </tr>

                {/* 2.6 ABDÔMEN (único) */}
                <tr className="hover:bg-[#1A2035] transition-colors bg-[#141828]/50">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    ABDÔMEN
                  </td>
                  {assessments.map((ass) => {
                    const val = ass.data?.abdomen ?? ''
                    return (
                      <td
                        key={ass.id}
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center"
                      >
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="cm"
                          defaultValue={val !== '' ? String(val) : ''}
                          onBlur={(e) => handleUpdateField(ass, 'abdomen', e.target.value)}
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary mx-auto max-w-[130px]"
                        />
                      </td>
                    )
                  })}
                </tr>

                {/* 2.7 QUADRIL (único) */}
                <tr className="hover:bg-[#1A2035] transition-colors">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    QUADRIL
                  </td>
                  {assessments.map((ass) => {
                    const val = ass.data?.quadril ?? ''
                    return (
                      <td
                        key={ass.id}
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center"
                      >
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="cm"
                          defaultValue={val !== '' ? String(val) : ''}
                          onBlur={(e) => handleUpdateField(ass, 'quadril', e.target.value)}
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary mx-auto max-w-[130px]"
                        />
                      </td>
                    )
                  })}
                </tr>

                {/* 2.8 COXA (D/E) */}
                <tr className="hover:bg-[#1A2035] transition-colors bg-[#141828]/50">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    COXA
                  </td>
                  {assessments.map((ass) => {
                    const d = ass.data?.coxa?.direito ?? ''
                    const e = ass.data?.coxa?.esquerdo ?? ''
                    return (
                      <div key={ass.id} style={{ display: 'contents' }}>
                        <td className="p-1.5 border-r border-[#252B3E]/60 text-center">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Dir"
                            defaultValue={d !== '' ? String(d) : ''}
                            onBlur={(ev) =>
                              handleUpdateField(ass, 'coxa', ev.target.value, 'direito')
                            }
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                          />
                        </td>
                        <td className="p-1.5 border-r border-[#252B3E] text-center">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Esq"
                            defaultValue={e !== '' ? String(e) : ''}
                            onBlur={(ev) =>
                              handleUpdateField(ass, 'coxa', ev.target.value, 'esquerdo')
                            }
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                          />
                        </td>
                      </div>
                    )
                  })}
                </tr>

                {/* 2.9 PANTURRILHA (D/E) */}
                <tr className="hover:bg-[#1A2035] transition-colors">
                  <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                    PANTURRILHA
                  </td>
                  {assessments.map((ass) => {
                    const d = ass.data?.panturrilha?.direito ?? ''
                    const e = ass.data?.panturrilha?.esquerdo ?? ''
                    return (
                      <div key={ass.id} style={{ display: 'contents' }}>
                        <td className="p-1.5 border-r border-[#252B3E]/60 text-center">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Dir"
                            defaultValue={d !== '' ? String(d) : ''}
                            onBlur={(ev) =>
                              handleUpdateField(ass, 'panturrilha', ev.target.value, 'direito')
                            }
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                          />
                        </td>
                        <td className="p-1.5 border-r border-[#252B3E] text-center">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Esq"
                            defaultValue={e !== '' ? String(e) : ''}
                            onBlur={(ev) =>
                              handleUpdateField(ass, 'panturrilha', ev.target.value, 'esquerdo')
                            }
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                          />
                        </td>
                      </div>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIÁLOGO: NOVA AVALIAÇÃO FÍSICA */}
      <Dialog open={newDateDialogOpen} onOpenChange={setNewDateDialogOpen}>
        <DialogContent className="bg-[#181C2E] border-[#252B3E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Nova Coluna de Avaliação
            </DialogTitle>
            <DialogDescription className="text-xs text-[#9CA5B8]">
              Adicione uma nova data de avaliação para o aluno {studentName || ''}. Uma nova coluna
              será criada na planilha para inserção das medidas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="new-ass-date" className="text-xs text-[#9CA5B8] uppercase font-bold">
                Data da Avaliação
              </label>
              <Input
                id="new-ass-date"
                type="date"
                value={newAssessmentDate}
                onChange={(e) => setNewAssessmentDate(e.target.value)}
                className="bg-[#121522] border-[#252B3E] text-white h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#9CA5B8] uppercase font-bold">
                Sexo para Classificação Omron
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewAssessmentSex('F')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    newAssessmentSex === 'F'
                      ? 'bg-pink-500/20 border-pink-500 text-pink-300 font-bold shadow'
                      : 'bg-[#121522] border-[#252B3E] text-[#9CA5B8] hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" /> Feminino (F)
                </button>
                <button
                  type="button"
                  onClick={() => setNewAssessmentSex('M')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    newAssessmentSex === 'M'
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold shadow'
                      : 'bg-[#121522] border-[#252B3E] text-[#9CA5B8] hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" /> Masculino (M)
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewDateDialogOpen(false)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={creating || !newAssessmentDate}
              onClick={handleCreateAssessment}
              className="bg-primary hover:opacity-90 text-primary-foreground font-bold"
            >
              {creating ? 'Adicionando...' : 'Adicionar Coluna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: CONFIRMAÇÃO DE EXCLUSÃO DE COLUNA */}
      <Dialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
      >
        <DialogContent className="bg-[#181C2E] border-[#252B3E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" /> Excluir Avaliação?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#9CA5B8]">
              Esta ação removerá permanentemente a coluna da avaliação do dia{' '}
              <strong className="text-white">
                {deleteCandidate?.date
                  ? new Date(deleteCandidate.date.split('T')[0] + 'T00:00:00').toLocaleDateString(
                      'pt-BR',
                    )
                  : ''}
              </strong>{' '}
              e todas as suas medidas registradas.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteCandidate(null)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleDeleteAssessment}
            >
              {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DAS TABELAS DE REFERÊNCIA OMRON */}
      <OmronReferenceModal open={referenceModalOpen} onOpenChange={setReferenceModalOpen} />
    </div>
  )
}
