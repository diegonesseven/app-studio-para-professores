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
import { type PhysicalAssessment, type BilateralMeasure } from '@/types'
import {
  calculateAge,
  calculateImc,
  classifyImc,
  classifyBodyFat,
  classifySkeletalMuscle,
  classifyVisceralFat,
  calculateWaistHipRatio,
  classifyWaistHipRatio,
  type ClassificationResult,
} from '@/lib/omronClassification'
import {
  downloadAssessmentImage,
  shareOrDownloadAssessmentImage,
} from '@/services/assessmentImageExport'
import {
  calculateEvolution,
  formatMetricValue,
  type DesiredDirection,
} from '@/lib/assessmentComparison'
import { OmronReferenceModal } from '@/components/OmronReferenceModal'
import pb from '@/lib/pocketbase/client'
import { extractDateInputVal, parseAndFormatDate } from '@/lib/dateUtils'
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
  Minus,
  Sparkles,
  History,
  Save,
  Download,
  Share2,
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

  // ID da avaliação atualmente selecionada para visualização/edição
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)

  // Altura fixa (armazenada/lembrada na avaliação ou localmente)
  const [fixedHeight, setFixedHeight] = useState<string>('')
  // Idade calculada
  const studentAge = useMemo(() => calculateAge(studentBirthdate), [studentBirthdate])

  // Diálogo para adicionar avaliação
  const [newDateDialogOpen, setNewDateDialogOpen] = useState(false)
  const [newAssessmentDate, setNewAssessmentDate] = useState(() => extractDateInputVal(new Date()))
  const [newAssessmentSex, setNewAssessmentSex] = useState<'M' | 'F'>('F')
  const [creating, setCreating] = useState(false)

  // Diálogo para deletar avaliação
  const [deleteCandidate, setDeleteCandidate] = useState<PhysicalAssessment | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Feedback do botão explícito "Salvar Avaliação"
  const [savingAssessment, setSavingAssessment] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Estado da exportação da imagem
  const [exportingImage, setExportingImage] = useState(false)

  // Carregar avaliações do aluno
  const loadAssessments = useCallback(async () => {
    if (!studentId) return
    try {
      setLoading(true)
      const list = await physicalAssessmentsService.getByStudent(studentId)
      // Ordena cronologicamente crescente (mais antiga primeiro, mais recente por último)
      const sorted = [...list].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      setAssessments(sorted)

      // Seleciona por padrão a mais recente (última da lista ordenada)
      if (sorted.length > 0) {
        setSelectedAssessmentId((prev) => {
          if (prev && sorted.some((a) => a.id === prev)) {
            return prev
          }
          return sorted[sorted.length - 1].id
        })
      } else {
        setSelectedAssessmentId(null)
      }

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
            const updated = [...prev, e.record as unknown as PhysicalAssessment].sort((a, b) =>
              (a.date || '').localeCompare(b.date || ''),
            )
            return updated
          })
          setSelectedAssessmentId(e.record.id)
        } else if (e.action === 'update') {
          setAssessments((prev) =>
            prev.map((x) =>
              x.id === e.record.id ? (e.record as unknown as PhysicalAssessment) : x,
            ),
          )
        } else if (e.action === 'delete') {
          setAssessments((prev) => {
            const next = prev.filter((x) => x.id !== e.record.id)
            setSelectedAssessmentId((curr) => {
              if (curr === e.record.id) {
                return next.length > 0 ? next[next.length - 1].id : null
              }
              return curr
            })
            return next
          })
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

  // Identifica a avaliação ativa e o índice dela
  const sortedAssessments = useMemo(() => {
    return [...assessments].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  }, [assessments])

  const currentIndex = useMemo(() => {
    if (!selectedAssessmentId) {
      return sortedAssessments.length > 0 ? sortedAssessments.length - 1 : -1
    }
    const idx = sortedAssessments.findIndex((a) => a.id === selectedAssessmentId)
    return idx >= 0 ? idx : sortedAssessments.length - 1
  }, [sortedAssessments, selectedAssessmentId])

  const currentAssessment: PhysicalAssessment | null = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < sortedAssessments.length) {
      return sortedAssessments[currentIndex]
    }
    return null
  }, [sortedAssessments, currentIndex])

  // Avaliação anterior automática (a imediatamente anterior pela data)
  const previousAssessment: PhysicalAssessment | null = useMemo(() => {
    if (currentIndex > 0) {
      return sortedAssessments[currentIndex - 1]
    }
    return null
  }, [sortedAssessments, currentIndex])

  // Salvar altura fixa
  const handleHeightChange = (val: string) => {
    setFixedHeight(val)
    localStorage.setItem(`student_height_${studentId}`, val)
  }

  // Navegar entre avaliações
  const handleSelectAssessment = (id: string) => {
    setSelectedAssessmentId(id)
  }

  const handleGoToPreviousAssessment = () => {
    if (currentIndex > 0) {
      setSelectedAssessmentId(sortedAssessments[currentIndex - 1].id)
    }
  }

  const handleGoToNextAssessment = () => {
    if (currentIndex < sortedAssessments.length - 1) {
      setSelectedAssessmentId(sortedAssessments[currentIndex + 1].id)
    }
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
      const updated = [...assessments, created].sort((a, b) =>
        (a.date || '').localeCompare(b.date || ''),
      )
      setAssessments(updated)
      setSelectedAssessmentId(created.id)
      setNewDateDialogOpen(false)
      toast({
        title: 'Nova avaliação criada',
        description: `Avaliação do dia ${parseAndFormatDate(newAssessmentDate)} aberta para preenchimento.`,
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
      const nextList = assessments.filter((a) => a.id !== deleteCandidate.id)
      setAssessments(nextList)
      if (selectedAssessmentId === deleteCandidate.id) {
        setSelectedAssessmentId(nextList.length > 0 ? nextList[nextList.length - 1].id : null)
      }
      setDeleteCandidate(null)
      toast({
        title: 'Avaliação excluída',
        description: 'A avaliação foi removida com sucesso.',
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

      // Se mudou o peso e temos altura definida, recalcula IMC se for coerente
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
    }
  }

  // Atualizar data da avaliação inline
  const handleUpdateDate = async (assessment: PhysicalAssessment, newDate: string) => {
    if (!newDate) return
    // Formatar como YYYY-MM-DD
    const cleanDate = extractDateInputVal(newDate)
    const currentDateClean = extractDateInputVal(assessment.date)
    if (cleanDate === currentDateClean) return

    try {
      const updated = await physicalAssessmentsService.update(assessment.id, { date: cleanDate })
      setAssessments((prev) =>
        prev
          .map((a) => (a.id === assessment.id ? { ...a, date: updated.date || cleanDate } : a))
          .sort((a, b) => (a.date || '').localeCompare(b.date || '')),
      )
      toast({
        title: 'Data da avaliação atualizada',
        description: 'A nova data foi salva com sucesso no registro.',
      })
    } catch (err) {
      console.error('Erro ao atualizar data da avaliação:', err)
      toast({
        title: 'Erro ao alterar data',
        description: 'Não foi possível gravar a nova data da avaliação.',
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

  // Helper para renderizar a coluna da avaliação anterior (somente leitura) com evolução
  const renderPreviousCell = (
    currentVal: number | null | undefined,
    prevVal: number | null | undefined,
    desired: DesiredDirection,
    unit = '',
    prevClassification?: ClassificationResult | null,
    subLabel?: string,
  ) => {
    if (!previousAssessment) {
      return (
        <td
          colSpan={subLabel ? 1 : 2}
          className="p-2 border-r border-[#252B3E] text-center text-xs text-[#5D667E] bg-[#0E111B]/60 italic font-mono"
        >
          —
        </td>
      )
    }

    const evo = calculateEvolution(currentVal, prevVal, desired, unit)
    const hasPrev = prevVal !== null && prevVal !== undefined && !isNaN(prevVal)

    return (
      <td
        colSpan={subLabel ? 1 : 2}
        className="p-1.5 border-r border-[#252B3E] text-center bg-[#0E111B]/80"
      >
        <div className="flex flex-col items-center justify-center gap-0.5">
          <div className="flex items-center justify-center gap-1">
            <span
              className={`font-semibold text-xs font-mono ${
                hasPrev ? 'text-[#C5CEE0]' : 'text-[#5D667E] italic'
              }`}
            >
              {hasPrev ? formatMetricValue(prevVal, unit) : '—'}
            </span>
          </div>

          {/* Badge de evolução quando ambos os valores estão presentes */}
          {evo && (
            <div
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                evo.trend === 'better'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : evo.trend === 'worse'
                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    : 'bg-[#181C2E] text-[#9CA5B8] border-[#252B3E]'
              }`}
              title={`Evolução em relação à avaliação anterior: ${evo.diffFormatted}`}
            >
              {evo.arrow === 'up' && <ArrowUp className="w-2.5 h-2.5" />}
              {evo.arrow === 'down' && <ArrowDown className="w-2.5 h-2.5" />}
              {evo.arrow === 'equal' && <Minus className="w-2.5 h-2.5" />}
              <span>{evo.diffFormatted}</span>
            </div>
          )}

          {prevClassification && <div className="mt-0.5">{renderBadge(prevClassification)}</div>}
        </div>
      </td>
    )
  }

  // Ação explícita de salvar a avaliação
  const handleSaveAssessmentExplicitly = async () => {
    if (!currentAssessment) return
    setSavingAssessment(true)
    try {
      const cleanDate = extractDateInputVal(currentAssessment.date)
      await physicalAssessmentsService.update(currentAssessment.id, {
        data: currentAssessment.data || {},
        date: cleanDate || undefined,
        sex: currentAssessment.sex || 'F',
      })
      setSaveSuccess(true)
      toast({
        title: 'Avaliação salva com sucesso!',
        description: 'Todas as medidas e dados da avaliação foram confirmados e gravados.',
      })
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      console.error('Erro ao salvar avaliação:', err)
      toast({
        title: 'Erro ao salvar avaliação',
        description: 'Não foi possível gravar os dados. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingAssessment(false)
    }
  }

  // Exportar imagem (Baixar PNG)
  const handleDownloadImage = async () => {
    if (!currentAssessment) return
    setExportingImage(true)
    try {
      const heightNum = fixedHeight ? parseFloat(fixedHeight.replace(',', '.')) : null
      const formattedDate = parseAndFormatDate(
        currentAssessment.date,
        parseAndFormatDate(new Date()),
      )

      await downloadAssessmentImage({
        studentName,
        studentAge,
        assessmentDate: formattedDate,
        sex: currentAssessment.sex || 'F',
        heightCm: heightNum && !isNaN(heightNum) ? heightNum : null,
        currentAssessment,
        previousAssessment,
      })
      toast({
        title: 'Imagem gerada com sucesso!',
        description: 'O arquivo PNG da avaliação foi baixado para o seu dispositivo.',
      })
    } catch (err) {
      console.error('Erro ao gerar imagem:', err)
      toast({
        title: 'Erro ao gerar imagem',
        description: 'Não foi possível renderizar a imagem da avaliação.',
        variant: 'destructive',
      })
    } finally {
      setExportingImage(false)
    }
  }

  // Compartilhar imagem (WhatsApp / Web Share API ou download)
  const handleShareImage = async () => {
    if (!currentAssessment) return
    setExportingImage(true)
    try {
      const heightNum = fixedHeight ? parseFloat(fixedHeight.replace(',', '.')) : null
      const formattedDate = parseAndFormatDate(
        currentAssessment.date,
        parseAndFormatDate(new Date()),
      )

      const result = await shareOrDownloadAssessmentImage({
        studentName,
        studentAge,
        assessmentDate: formattedDate,
        sex: currentAssessment.sex || 'F',
        heightCm: heightNum && !isNaN(heightNum) ? heightNum : null,
        currentAssessment,
        previousAssessment,
      })

      if (result === 'shared') {
        toast({
          title: 'Compartilhamento concluído!',
          description: 'A avaliação física foi compartilhada com sucesso.',
        })
      } else {
        toast({
          title: 'Imagem baixada com sucesso!',
          description: 'Pronta para envio pelo WhatsApp ou outros aplicativos.',
        })
      }
    } catch (err) {
      console.error('Erro ao compartilhar imagem:', err)
      toast({
        title: 'Erro no compartilhamento',
        description: 'Não foi possível compartilhar a imagem. Baixe-a pelo botão ao lado.',
        variant: 'destructive',
      })
    } finally {
      setExportingImage(false)
    }
  }

  // Formatador da data da avaliação selecionada
  const selectedDateFormatted = parseAndFormatDate(currentAssessment?.date, '')

  const previousDateFormatted = parseAndFormatDate(previousAssessment?.date, '')

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
              Uma avaliação por vez com comparativo automático da evolução com a avaliação anterior
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {currentAssessment && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadImage}
                disabled={exportingImage}
                className="border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs h-9 px-3 flex items-center gap-1.5"
                title="Baixar imagem (PNG) com parâmetros, referências e resultados para enviar ao aluno"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Baixar Imagem</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShareImage}
                disabled={exportingImage}
                className="border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs h-9 px-3 flex items-center gap-1.5"
                title="Compartilhar resultado da avaliação com o aluno via WhatsApp ou outro app"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compartilhar</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSaveAssessmentExplicitly}
                disabled={savingAssessment}
                className={`font-bold text-xs h-9 px-3.5 flex items-center gap-1.5 shadow transition-all ${
                  saveSuccess
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-primary hover:opacity-90 text-primary-foreground'
                }`}
                title="Salvar todas as alterações da avaliação e confirmar gravação"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Avaliação Salva!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingAssessment ? 'Salvando...' : 'Salvar Avaliação'}</span>
                  </>
                )}
              </Button>
            </>
          )}

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
              setNewAssessmentDate(extractDateInputVal(new Date()))
              setNewDateDialogOpen(true)
            }}
            className="bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs h-9 px-3 flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" /> + Nova Avaliação
          </Button>
        </div>
      </div>

      {/* Alerta quando faltar Idade no cadastro do Aluno */}
      {(!studentAge || studentAge <= 0) && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300 block">
              Atenção: Idade do aluno não identificada no cadastro
            </span>
            <p className="text-[#C5CEE0]">
              As tabelas de referência Omron para <strong>% de Gordura Corporal</strong> e{' '}
              <strong>% de Músculos Esqueléticos</strong> utilizam a idade e o sexo para definir as
              faixas corretas. Complete o campo de <strong>Data de Nascimento</strong> nos dados do
              aluno para que a classificação seja exata por faixa etária (20–39, 40–59 ou 60+ anos).
            </p>
          </div>
        </div>
      )}

      {/* Bloco Cinza do Topo (Idade e Altura - Fixos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[#121522] border border-[#252B3E] p-4 rounded-xl">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" /> IDADE
          </span>
          <div className="text-sm font-black text-white flex items-center gap-2">
            {studentAge !== null ? `${studentAge} anos` : 'Não informada'}
            {studentBirthdate && (
              <span className="text-[11px] text-[#8A8F98] font-normal">
                ({parseAndFormatDate(studentBirthdate)})
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
            Músculo e Gordura Visceral. A coluna <strong>Anterior</strong> compara a evolução lado a
            lado.
          </span>
        </div>
      </div>

      {/* Conteúdo principal */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#8A8F98]">
          Carregando avaliações físicas...
        </div>
      ) : assessments.length === 0 ? (
        <div className="py-12 text-center bg-[#121522] rounded-xl border border-[#252B3E] p-8 space-y-3">
          <Activity className="w-10 h-10 text-primary/40 mx-auto" />
          <h4 className="text-base font-bold text-white">Nenhuma avaliação física registrada</h4>
          <p className="text-xs text-[#9CA5B8] max-w-md mx-auto">
            Clique no botão <strong>"+ Nova Avaliação"</strong> para criar a primeira avaliação e
            preencher os dados de bioimpedância e perimetria do aluno.
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
      ) : currentAssessment ? (
        <div className="space-y-4">
          {/* BARRA DE NAVEGAÇÃO E SELEÇÃO DE AVALIAÇÃO (Uma por vez) */}
          <div className="bg-[#121522] border border-[#252B3E] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
              <span className="text-xs uppercase font-bold text-[#9CA5B8] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-primary" /> Avaliação em Exibição:
              </span>

              {/* Botões de seta para navegar entre avaliações */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentIndex <= 0}
                  onClick={handleGoToPreviousAssessment}
                  className="h-8 w-8 p-0 bg-[#181C2E] border-[#252B3E] text-white hover:bg-[#20263B] disabled:opacity-40"
                  title="Ir para avaliação mais antiga"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-mono text-[#9CA5B8] px-2 font-semibold">
                  {currentIndex + 1} de {sortedAssessments.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentIndex >= sortedAssessments.length - 1}
                  onClick={handleGoToNextAssessment}
                  className="h-8 w-8 p-0 bg-[#181C2E] border-[#252B3E] text-white hover:bg-[#20263B] disabled:opacity-40"
                  title="Ir para avaliação mais recente"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Dropdown seletor de avaliações */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <select
                aria-label="Selecionar avaliação física"
                value={currentAssessment.id}
                onChange={(e) => handleSelectAssessment(e.target.value)}
                className="bg-[#181C2E] border border-[#252B3E] text-white text-xs rounded-lg px-3 py-1.5 font-semibold focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-auto"
              >
                {sortedAssessments.map((ass, idx) => {
                  const d = parseAndFormatDate(ass.date, 'Sem data')
                  const isLatest = idx === sortedAssessments.length - 1
                  return (
                    <option key={ass.id} value={ass.id}>
                      {d} {isLatest ? '• (Mais Recente)' : ''}
                    </option>
                  )
                })}
              </select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteCandidate(currentAssessment)}
                className="h-8 px-2.5 border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:text-red-300 text-xs shrink-0 flex items-center gap-1"
                title="Excluir esta avaliação"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excluir</span>
              </Button>
            </div>
          </div>

          {/* Banner informativo de comparativo com a anterior */}
          {previousAssessment ? (
            <div className="bg-gradient-to-r from-primary/10 via-[#181C2E] to-secondary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <span className="font-bold text-white">Comparativo Automático Ativo: </span>
                  <span className="text-[#9CA5B8]">
                    Comparando a avaliação atual (<strong>{selectedDateFormatted}</strong>) com a
                    imediatamente anterior do dia{' '}
                    <strong className="text-secondary">{previousDateFormatted}</strong>.
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-[#9CA5B8] bg-[#121522] px-2.5 py-1 rounded-md border border-[#252B3E]">
                Coluna <strong>Anterior</strong> é somente leitura
              </span>
            </div>
          ) : (
            <div className="bg-[#121522] border border-[#252B3E] rounded-xl p-3 flex items-center gap-2 text-xs text-[#9CA5B8]">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>
                Esta é a primeira avaliação cadastrada do aluno (não há avaliação anterior para
                comparação). Ao adicionar a próxima avaliação, o comparativo aparecerá
                automaticamente ao lado.
              </span>
            </div>
          )}

          {/* TABELA DE AVALIAÇÃO FÍSICA: UMA COLUNA POR VEZ + COLUNA ANTERIOR (COMPARATIVO) */}
          <div className="overflow-x-auto rounded-xl border border-[#252B3E] bg-[#121522] shadow-inner max-w-full">
            <table className="w-full text-xs text-left border-collapse min-w-[620px]">
              {/* CABEÇALHO */}
              <thead>
                {/* Linha 1: Títulos das colunas */}
                <tr className="bg-[#1A2138] border-b border-[#252B3E]">
                  <th className="p-3 font-bold text-white uppercase tracking-wider w-64 sticky left-0 bg-[#1A2138] z-20 border-r border-[#252B3E]">
                    PARÂMETRO / MEDIDA
                  </th>

                  {/* Coluna da Avaliação Anterior (Comparativo) */}
                  {previousAssessment && (
                    <th
                      colSpan={2}
                      className="p-2.5 text-center font-bold text-white border-r border-[#252B3E] bg-[#0E111B] w-48 sm:w-56"
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-secondary font-black">
                          ANTERIOR
                        </span>
                        <span className="text-xs font-mono text-[#C5CEE0]">
                          {previousDateFormatted}
                        </span>
                        <span className="text-[10px] text-[#8A8F98] font-normal">
                          (somente leitura)
                        </span>
                      </div>
                    </th>
                  )}

                  {/* Coluna da Avaliação Atual (Edição Ativa) */}
                  <th
                    colSpan={2}
                    className="p-2.5 text-center font-bold text-white border-r border-[#252B3E] bg-[#181C2E] min-w-[240px]"
                  >
                    <div className="flex items-center justify-between gap-1 px-1">
                      <span className="text-[11px] text-primary font-bold">DATA ATUAL:</span>
                      <input
                        type="date"
                        value={extractDateInputVal(currentAssessment.date)}
                        onChange={(e) => handleUpdateDate(currentAssessment, e.target.value)}
                        className="bg-[#121522] border border-[#252B3E] text-white text-xs px-2 py-0.5 rounded font-mono"
                        title="Clique para alterar a data desta avaliação"
                      />
                    </div>
                    {/* Seletor de sexo específico para esta avaliação */}
                    <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-[#9CA5B8]">
                      <span>Sexo:</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateSex(currentAssessment, 'F')}
                        className={`px-1.5 py-0.5 rounded ${
                          currentAssessment.sex === 'F' || !currentAssessment.sex
                            ? 'bg-pink-500/20 text-pink-300 font-bold border border-pink-500/40'
                            : 'hover:text-white'
                        }`}
                      >
                        Fem (F)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateSex(currentAssessment, 'M')}
                        className={`px-1.5 py-0.5 rounded ${
                          currentAssessment.sex === 'M'
                            ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                            : 'hover:text-white'
                        }`}
                      >
                        Masc (M)
                      </button>
                    </div>
                  </th>
                </tr>

                {/* Linha 2: Subcolunas DIREITO / ESQUERDO (apenas na perimetria, o cabeçalho mostra orientação) */}
                <tr className="bg-[#141828] border-b border-[#252B3E] text-[11px] text-[#9CA5B8]">
                  <th className="p-2 font-semibold text-white sticky left-0 bg-[#141828] z-20 border-r border-[#252B3E]">
                    SUBDIVISÃO BILATERAL
                  </th>

                  {/* Subcolunas da Anterior se houver */}
                  {previousAssessment && (
                    <>
                      <th className="p-2 text-center font-semibold text-[#8A8F98] border-r border-[#252B3E]/60 w-24 sm:w-28 bg-[#0E111B]">
                        DIREITO
                      </th>
                      <th className="p-2 text-center font-semibold text-[#8A8F98] border-r border-[#252B3E] w-24 sm:w-28 bg-[#0E111B]">
                        ESQUERDO
                      </th>
                    </>
                  )}

                  {/* Subcolunas da Atual */}
                  <th className="p-2 text-center font-semibold text-primary border-r border-[#252B3E]/60 w-28 sm:w-32 bg-[#15192A]">
                    DIREITO
                  </th>
                  <th className="p-2 text-center font-semibold text-primary border-r border-[#252B3E] w-28 sm:w-32 bg-[#15192A]">
                    ESQUERDO
                  </th>
                </tr>
              </thead>

              {/* CORPO DA TABELA */}
              <tbody className="divide-y divide-[#252B3E] text-white">
                {/* ========================================================= */}
                {/* SEÇÃO 1: COMPOSIÇÃO CORPORAL */}
                {/* ========================================================= */}
                <tr className="bg-primary/10 border-b border-primary/20">
                  <td
                    colSpan={1 + (previousAssessment ? 2 : 0) + 2}
                    className="p-2 text-xs font-bold text-secondary uppercase tracking-wider sticky left-0"
                  >
                    1. Composição Corporal (Bioimpedância)
                  </td>
                </tr>

                {/* 1.1 PESO (↓) */}
                {(() => {
                  const curr = currentAssessment.data?.peso ?? null
                  const prev = previousAssessment?.data?.peso ?? null
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            PESO (kg) <ArrowDown className="w-3 h-3 text-[#9CA5B8]" />
                          </span>
                        </div>
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment && renderPreviousCell(curr, prev, 'lower', 'kg')}

                      {/* Coluna Atual (Editável) */}
                      <td colSpan={2} className="p-1.5 border-r border-[#252B3E] text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 68.5"
                          defaultValue={curr !== null ? String(curr) : ''}
                          key={`${currentAssessment.id}-peso-${curr}`}
                          onBlur={(e) =>
                            handleUpdateField(currentAssessment, 'peso', e.target.value)
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-semibold focus-visible:ring-primary mx-auto max-w-[140px]"
                        />
                      </td>
                    </tr>
                  )
                })()}

                {/* 1.2 IMC (↓) */}
                {(() => {
                  const curr = currentAssessment.data?.imc ?? null
                  const prev = previousAssessment?.data?.imc ?? null
                  const currClassif = classifyImc(curr)
                  const prevClassif = classifyImc(prev)
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors bg-[#141828]/50">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            IMC (kg/m²) <ArrowDown className="w-3 h-3 text-[#9CA5B8]" />
                          </span>
                        </div>
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment &&
                        renderPreviousCell(curr, prev, 'lower', '', prevClassif)}

                      {/* Coluna Atual (Editável) */}
                      <td colSpan={2} className="p-1.5 border-r border-[#252B3E] text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Ex: 23.4"
                            defaultValue={curr !== null ? String(curr) : ''}
                            key={`${currentAssessment.id}-imc-${curr}`}
                            onBlur={(e) =>
                              handleUpdateField(currentAssessment, 'imc', e.target.value)
                            }
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-bold focus-visible:ring-primary mx-auto max-w-[140px]"
                          />
                          {renderBadge(currClassif)}
                        </div>
                      </td>
                    </tr>
                  )
                })()}

                {/* 1.3 % GORDURA (↓) */}
                {(() => {
                  const curr = currentAssessment.data?.gordura ?? null
                  const prev = previousAssessment?.data?.gordura ?? null
                  const currSex = currentAssessment.sex || 'F'
                  const prevSex = previousAssessment?.sex || 'F'
                  const currClassif = classifyBodyFat(curr, currSex, studentAge)
                  const prevClassif = classifyBodyFat(prev, prevSex, studentAge)
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">% GORDURA (↓)</span>
                        </div>
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment &&
                        renderPreviousCell(curr, prev, 'lower', '%', prevClassif)}

                      {/* Coluna Atual (Editável) */}
                      <td colSpan={2} className="p-1.5 border-r border-[#252B3E] text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Ex: 24.5"
                            defaultValue={curr !== null ? String(curr) : ''}
                            key={`${currentAssessment.id}-gordura-${curr}`}
                            onBlur={(e) =>
                              handleUpdateField(currentAssessment, 'gordura', e.target.value)
                            }
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-semibold focus-visible:ring-primary mx-auto max-w-[140px]"
                          />
                          {renderBadge(currClassif)}
                        </div>
                      </td>
                    </tr>
                  )
                })()}

                {/* 1.4 % MÚSCULOS (↑) - Quanto maior melhor */}
                {(() => {
                  const curr = currentAssessment.data?.musculos ?? null
                  const prev = previousAssessment?.data?.musculos ?? null
                  const currSex = currentAssessment.sex || 'F'
                  const prevSex = previousAssessment?.sex || 'F'
                  const currClassif = classifySkeletalMuscle(curr, currSex, studentAge)
                  const prevClassif = classifySkeletalMuscle(prev, prevSex, studentAge)
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors bg-rose-950/15">
                      <td className="p-2.5 font-black text-rose-400 sticky left-0 bg-[#14121A] z-10 border-r border-[#252B3E]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-bold">% MÚSCULOS (↑)</span>
                          <span className="text-[10px] text-rose-300 font-normal">
                            (maior melhor)
                          </span>
                        </div>
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment &&
                        renderPreviousCell(curr, prev, 'higher', '%', prevClassif)}

                      {/* Coluna Atual (Editável) */}
                      <td
                        colSpan={2}
                        className="p-1.5 border-r border-[#252B3E] text-center bg-rose-950/10"
                      >
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Ex: 28.5"
                            defaultValue={curr !== null ? String(curr) : ''}
                            key={`${currentAssessment.id}-musculos-${curr}`}
                            onBlur={(e) =>
                              handleUpdateField(currentAssessment, 'musculos', e.target.value)
                            }
                            className="bg-[#181C2E] border-rose-900/60 text-white text-xs h-8 text-center font-bold focus-visible:ring-rose-500 mx-auto max-w-[140px]"
                          />
                          {renderBadge(currClassif)}
                        </div>
                      </td>
                    </tr>
                  )
                })()}

                {/* 1.5 MR (↓) - Metabolismo Basal */}
                {(() => {
                  const curr = currentAssessment.data?.mr ?? null
                  const prev = previousAssessment?.data?.mr ?? null
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            MR (↓) <span className="text-[10px] text-[#9CA5B8]">(kcal)</span>
                          </span>
                        </div>
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment && renderPreviousCell(curr, prev, 'neutral', 'kcal')}

                      {/* Coluna Atual (Editável) */}
                      <td colSpan={2} className="p-1.5 border-r border-[#252B3E] text-center">
                        <Input
                          type="number"
                          placeholder="Ex: 1420"
                          defaultValue={curr !== null ? String(curr) : ''}
                          key={`${currentAssessment.id}-mr-${curr}`}
                          onBlur={(e) => handleUpdateField(currentAssessment, 'mr', e.target.value)}
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-semibold focus-visible:ring-primary mx-auto max-w-[140px]"
                        />
                      </td>
                    </tr>
                  )
                })()}

                {/* 1.6 IDADE BIOLÓGICA (↓) */}
                {(() => {
                  const curr = currentAssessment.data?.idade_biologica ?? null
                  const prev = previousAssessment?.data?.idade_biologica ?? null
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors bg-[#141828]/50">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">IDADE BIOLÓGICA (↓)</span>
                        </div>
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment && renderPreviousCell(curr, prev, 'lower', 'anos')}

                      {/* Coluna Atual (Editável) */}
                      <td colSpan={2} className="p-1.5 border-r border-[#252B3E] text-center">
                        <Input
                          type="number"
                          placeholder="Ex: 27"
                          defaultValue={curr !== null ? String(curr) : ''}
                          key={`${currentAssessment.id}-idade_biologica-${curr}`}
                          onBlur={(e) =>
                            handleUpdateField(currentAssessment, 'idade_biologica', e.target.value)
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-semibold focus-visible:ring-primary mx-auto max-w-[140px]"
                        />
                      </td>
                    </tr>
                  )
                })()}

                {/* 1.7 GORDURA VISCERAL (↓) */}
                {(() => {
                  const curr = currentAssessment.data?.gordura_visceral ?? null
                  const prev = previousAssessment?.data?.gordura_visceral ?? null
                  const currClassif = classifyVisceralFat(curr)
                  const prevClassif = classifyVisceralFat(prev)
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">GORDURA VISCERAL (↓)</span>
                        </div>
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment &&
                        renderPreviousCell(curr, prev, 'lower', '', prevClassif)}

                      {/* Coluna Atual (Editável) */}
                      <td colSpan={2} className="p-1.5 border-r border-[#252B3E] text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <Input
                            type="number"
                            placeholder="Ex: 4"
                            defaultValue={curr !== null ? String(curr) : ''}
                            key={`${currentAssessment.id}-gordura_visceral-${curr}`}
                            onBlur={(e) =>
                              handleUpdateField(
                                currentAssessment,
                                'gordura_visceral',
                                e.target.value,
                              )
                            }
                            className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-semibold focus-visible:ring-primary mx-auto max-w-[140px]"
                          />
                          {renderBadge(currClassif)}
                        </div>
                      </td>
                    </tr>
                  )
                })()}

                {/* ========================================================= */}
                {/* SEÇÃO 2: PERIMETRIA (cm) */}
                {/* ========================================================= */}
                <tr className="bg-primary/10 border-b border-primary/20">
                  <td
                    colSpan={1 + (previousAssessment ? 2 : 0) + 2}
                    className="p-2 text-xs font-bold text-secondary uppercase tracking-wider sticky left-0"
                  >
                    2. Perimetria Corporal (cm)
                  </td>
                </tr>

                {/* 2.1 ANTEBRAÇO (D/E) */}
                {(() => {
                  const currD = currentAssessment.data?.antebraco?.direito ?? null
                  const currE = currentAssessment.data?.antebraco?.esquerdo ?? null
                  const prevD = previousAssessment?.data?.antebraco?.direito ?? null
                  const prevE = previousAssessment?.data?.antebraco?.esquerdo ?? null
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        ANTEBRAÇO
                      </td>

                      {/* Coluna Anterior (D e E) */}
                      {previousAssessment && (
                        <>
                          {renderPreviousCell(currD, prevD, 'neutral', 'cm', null, 'D')}
                          {renderPreviousCell(currE, prevE, 'neutral', 'cm', null, 'E')}
                        </>
                      )}

                      {/* Coluna Atual (D e E) */}
                      <td className="p-1.5 border-r border-[#252B3E]/60 text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Dir"
                          defaultValue={currD !== null ? String(currD) : ''}
                          key={`${currentAssessment.id}-antebraco-d-${currD}`}
                          onBlur={(ev) =>
                            handleUpdateField(
                              currentAssessment,
                              'antebraco',
                              ev.target.value,
                              'direito',
                            )
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                        />
                      </td>
                      <td className="p-1.5 border-r border-[#252B3E] text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Esq"
                          defaultValue={currE !== null ? String(currE) : ''}
                          key={`${currentAssessment.id}-antebraco-e-${currE}`}
                          onBlur={(ev) =>
                            handleUpdateField(
                              currentAssessment,
                              'antebraco',
                              ev.target.value,
                              'esquerdo',
                            )
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                        />
                      </td>
                    </tr>
                  )
                })()}

                {/* 2.2 BÍCEPS (D/E) */}
                {(() => {
                  const currD = currentAssessment.data?.biceps?.direito ?? null
                  const currE = currentAssessment.data?.biceps?.esquerdo ?? null
                  const prevD = previousAssessment?.data?.biceps?.direito ?? null
                  const prevE = previousAssessment?.data?.biceps?.esquerdo ?? null
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors bg-[#141828]/50">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        BÍCEPS
                      </td>

                      {/* Coluna Anterior (D e E) */}
                      {previousAssessment && (
                        <>
                          {renderPreviousCell(currD, prevD, 'neutral', 'cm', null, 'D')}
                          {renderPreviousCell(currE, prevE, 'neutral', 'cm', null, 'E')}
                        </>
                      )}

                      {/* Coluna Atual (D e E) */}
                      <td className="p-1.5 border-r border-[#252B3E]/60 text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Dir"
                          defaultValue={currD !== null ? String(currD) : ''}
                          key={`${currentAssessment.id}-biceps-d-${currD}`}
                          onBlur={(ev) =>
                            handleUpdateField(
                              currentAssessment,
                              'biceps',
                              ev.target.value,
                              'direito',
                            )
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                        />
                      </td>
                      <td className="p-1.5 border-r border-[#252B3E] text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Esq"
                          defaultValue={currE !== null ? String(currE) : ''}
                          key={`${currentAssessment.id}-biceps-e-${currE}`}
                          onBlur={(ev) =>
                            handleUpdateField(
                              currentAssessment,
                              'biceps',
                              ev.target.value,
                              'esquerdo',
                            )
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                        />
                      </td>
                    </tr>
                  )
                })()}

                {/* 2.3 TÓRAX (único) */}
                {(() => {
                  const curr = currentAssessment.data?.torax ?? null
                  const prev = previousAssessment?.data?.torax ?? null
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        TÓRAX
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment && renderPreviousCell(curr, prev, 'neutral', 'cm')}

                      {/* Coluna Atual */}
                      <td colSpan={2} className="p-1.5 border-r border-[#252B3E] text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="cm"
                          defaultValue={curr !== null ? String(curr) : ''}
                          key={`${currentAssessment.id}-torax-${curr}`}
                          onBlur={(e) =>
                            handleUpdateField(currentAssessment, 'torax', e.target.value)
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary mx-auto max-w-[140px]"
                        />
                      </td>
                    </tr>
                  )
                })()}

                {/* 2.4 OMBRO (único) */}
                {(() => {
                  const curr = currentAssessment.data?.ombro ?? null
                  const prev = previousAssessment?.data?.ombro ?? null
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors bg-[#141828]/50">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        OMBRO
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment && renderPreviousCell(curr, prev, 'neutral', 'cm')}

                      {/* Coluna Atual */}
                      <td colSpan={2} className="p-1.5 border-r border-[#252B3E] text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="cm"
                          defaultValue={curr !== null ? String(curr) : ''}
                          key={`${currentAssessment.id}-ombro-${curr}`}
                          onBlur={(e) =>
                            handleUpdateField(currentAssessment, 'ombro', e.target.value)
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary mx-auto max-w-[140px]"
                        />
                      </td>
                    </tr>
                  )
                })()}

                {/* 2.5 CINTURA (único) */}
                {(() => {
                  const curr = currentAssessment.data?.cintura ?? null
                  const prev = previousAssessment?.data?.cintura ?? null
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        CINTURA
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment && renderPreviousCell(curr, prev, 'lower', 'cm')}

                      {/* Coluna Atual */}
                      <td colSpan={2} className="p-1.5 border-r border-[#252B3E] text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="cm"
                          defaultValue={curr !== null ? String(curr) : ''}
                          key={`${currentAssessment.id}-cintura-${curr}`}
                          onBlur={(e) =>
                            handleUpdateField(currentAssessment, 'cintura', e.target.value)
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary mx-auto max-w-[140px]"
                        />
                      </td>
                    </tr>
                  )
                })()}

                {/* 2.6 ABDÔMEN (único) */}
                {(() => {
                  const curr = currentAssessment.data?.abdomen ?? null
                  const prev = previousAssessment?.data?.abdomen ?? null
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors bg-[#141828]/50">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        ABDÔMEN
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment && renderPreviousCell(curr, prev, 'lower', 'cm')}

                      {/* Coluna Atual */}
                      <td colSpan={2} className="p-1.5 border-r border-[#252B3E] text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="cm"
                          defaultValue={curr !== null ? String(curr) : ''}
                          key={`${currentAssessment.id}-abdomen-${curr}`}
                          onBlur={(e) =>
                            handleUpdateField(currentAssessment, 'abdomen', e.target.value)
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary mx-auto max-w-[140px]"
                        />
                      </td>
                    </tr>
                  )
                })()}

                {/* 2.7 QUADRIL (único) */}
                {(() => {
                  const curr = currentAssessment.data?.quadril ?? null
                  const prev = previousAssessment?.data?.quadril ?? null
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        QUADRIL
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment && renderPreviousCell(curr, prev, 'neutral', 'cm')}

                      {/* Coluna Atual */}
                      <td colSpan={2} className="p-1.5 border-r border-[#252B3E] text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="cm"
                          defaultValue={curr !== null ? String(curr) : ''}
                          key={`${currentAssessment.id}-quadril-${curr}`}
                          onBlur={(e) =>
                            handleUpdateField(currentAssessment, 'quadril', e.target.value)
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary mx-auto max-w-[140px]"
                        />
                      </td>
                    </tr>
                  )
                })()}

                {/* 2.7.1 RELAÇÃO CINTURA-QUADRIL (RCQ) - Calculada automaticamente */}
                {(() => {
                  const currCintura = currentAssessment.data?.cintura ?? null
                  const currQuadril = currentAssessment.data?.quadril ?? null
                  const prevCintura = previousAssessment?.data?.cintura ?? null
                  const prevQuadril = previousAssessment?.data?.quadril ?? null

                  const currRcq = calculateWaistHipRatio(currCintura, currQuadril)
                  const prevRcq = calculateWaistHipRatio(prevCintura, prevQuadril)

                  const currSex = currentAssessment.sex || 'F'
                  const prevSex = previousAssessment?.sex || 'F'

                  const currClassif = classifyWaistHipRatio(currRcq, currSex)
                  const prevClassif = classifyWaistHipRatio(prevRcq, prevSex)

                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors bg-primary/5">
                      <td className="p-2.5 font-bold text-primary sticky left-0 bg-[#151928] z-10 border-r border-[#252B3E]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            RELAÇÃO CINTURA-QUADRIL (RCQ)
                          </span>
                          <span className="text-[10px] text-[#9CA5B8] font-normal">
                            ({currSex === 'M' ? '< 0,90' : '< 0,85'})
                          </span>
                        </div>
                      </td>

                      {/* Coluna Anterior */}
                      {previousAssessment &&
                        renderPreviousCell(currRcq, prevRcq, 'lower', '', prevClassif)}

                      {/* Coluna Atual (Calculado automaticamente a partir de Cintura e Quadril) */}
                      <td colSpan={2} className="p-1.5 border-r border-[#252B3E] text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="text-xs font-mono font-bold text-white bg-[#181C2E] border border-[#252B3E] rounded h-8 px-3 flex items-center justify-center min-w-[100px]">
                            {currRcq !== null ? currRcq.toFixed(2).replace('.', ',') : '—'}
                          </div>
                          {renderBadge(currClassif)}
                        </div>
                      </td>
                    </tr>
                  )
                })()}

                {/* 2.8 COXA (D/E) */}
                {(() => {
                  const currD = currentAssessment.data?.coxa?.direito ?? null
                  const currE = currentAssessment.data?.coxa?.esquerdo ?? null
                  const prevD = previousAssessment?.data?.coxa?.direito ?? null
                  const prevE = previousAssessment?.data?.coxa?.esquerdo ?? null
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors bg-[#141828]/50">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        COXA
                      </td>

                      {/* Coluna Anterior (D e E) */}
                      {previousAssessment && (
                        <>
                          {renderPreviousCell(currD, prevD, 'neutral', 'cm', null, 'D')}
                          {renderPreviousCell(currE, prevE, 'neutral', 'cm', null, 'E')}
                        </>
                      )}

                      {/* Coluna Atual (D e E) */}
                      <td className="p-1.5 border-r border-[#252B3E]/60 text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Dir"
                          defaultValue={currD !== null ? String(currD) : ''}
                          key={`${currentAssessment.id}-coxa-d-${currD}`}
                          onBlur={(ev) =>
                            handleUpdateField(currentAssessment, 'coxa', ev.target.value, 'direito')
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                        />
                      </td>
                      <td className="p-1.5 border-r border-[#252B3E] text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Esq"
                          defaultValue={currE !== null ? String(currE) : ''}
                          key={`${currentAssessment.id}-coxa-e-${currE}`}
                          onBlur={(ev) =>
                            handleUpdateField(
                              currentAssessment,
                              'coxa',
                              ev.target.value,
                              'esquerdo',
                            )
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                        />
                      </td>
                    </tr>
                  )
                })()}

                {/* 2.9 PANTURRILHA (D/E) */}
                {(() => {
                  const currD = currentAssessment.data?.panturrilha?.direito ?? null
                  const currE = currentAssessment.data?.panturrilha?.esquerdo ?? null
                  const prevD = previousAssessment?.data?.panturrilha?.direito ?? null
                  const prevE = previousAssessment?.data?.panturrilha?.esquerdo ?? null
                  return (
                    <tr className="hover:bg-[#1A2035] transition-colors">
                      <td className="p-2.5 font-bold text-white sticky left-0 bg-[#121522] z-10 border-r border-[#252B3E]">
                        PANTURRILHA
                      </td>

                      {/* Coluna Anterior (D e E) */}
                      {previousAssessment && (
                        <>
                          {renderPreviousCell(currD, prevD, 'neutral', 'cm', null, 'D')}
                          {renderPreviousCell(currE, prevE, 'neutral', 'cm', null, 'E')}
                        </>
                      )}

                      {/* Coluna Atual (D e E) */}
                      <td className="p-1.5 border-r border-[#252B3E]/60 text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Dir"
                          defaultValue={currD !== null ? String(currD) : ''}
                          key={`${currentAssessment.id}-panturrilha-d-${currD}`}
                          onBlur={(ev) =>
                            handleUpdateField(
                              currentAssessment,
                              'panturrilha',
                              ev.target.value,
                              'direito',
                            )
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                        />
                      </td>
                      <td className="p-1.5 border-r border-[#252B3E] text-center">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Esq"
                          defaultValue={currE !== null ? String(currE) : ''}
                          key={`${currentAssessment.id}-panturrilha-e-${currE}`}
                          onBlur={(ev) =>
                            handleUpdateField(
                              currentAssessment,
                              'panturrilha',
                              ev.target.value,
                              'esquerdo',
                            )
                          }
                          className="bg-[#181C2E] border-[#252B3E] text-white text-xs h-8 text-center font-medium focus-visible:ring-primary"
                        />
                      </td>
                    </tr>
                  )
                })()}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* DIÁLOGO: NOVA AVALIAÇÃO FÍSICA */}
      <Dialog open={newDateDialogOpen} onOpenChange={setNewDateDialogOpen}>
        <DialogContent className="bg-[#181C2E] border-[#252B3E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Nova Avaliação Física
            </DialogTitle>
            <DialogDescription className="text-xs text-[#9CA5B8]">
              Inicie uma nova avaliação para o aluno {studentName || ''}. O comparativo com a
              avaliação anterior será gerado automaticamente.
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
              {creating ? 'Iniciando...' : 'Iniciar Avaliação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO: CONFIRMAÇÃO DE EXCLUSÃO */}
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
              Esta ação removerá permanentemente a avaliação do dia{' '}
              <strong className="text-white">
                {parseAndFormatDate(deleteCandidate?.date, '')}
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
