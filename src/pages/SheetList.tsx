import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { trainingSheetsService } from '@/services/trainingSheets'
import { studentsService } from '@/services/students'
import type { TrainingSheet, Student } from '@/types'
import {
  ClipboardList,
  Plus,
  Copy,
  Edit2,
  Trash2,
  PlaySquare,
  Search,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  Share2,
  Sparkles,
} from 'lucide-react'
import { SERIES_KEYS } from '@/types'
import { exercisesService } from '@/services/exercises'
import { templateSheetsStorage } from '@/services/templateSheets'
import { shareOrExportSheet, openSheetPrintWindow } from '@/services/trainingSheetPdf'
import { useTheme } from '@/contexts/ThemeContext'
import { StudentCombobox } from '@/components/StudentCombobox'
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

export default function SheetList() {
  const navigate = useNavigate()
  const { appearance } = useTheme()
  const [sheets, setSheets] = useState<TrainingSheet[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [exercisesMap, setExercisesMap] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Abas de visualização e filtros de modelos
  const [viewTab, setViewTab] = useState<'all' | 'templates' | 'students'>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')

  // Modal para selecionar aluno antes de criar nova ficha
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedStudentForNew, setSelectedStudentForNew] = useState<string>('')

  // Duplicação simples (mesmo aluno)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  // Visualização/Inspeção de Modelo
  const [viewingTemplateSheet, setViewingTemplateSheet] = useState<TrainingSheet | null>(null)

  // Cópia para outro aluno (Item 3)
  const [copyModalSheet, setCopyModalSheet] = useState<TrainingSheet | null>(null)
  const [copyTargetStudentId, setCopyTargetStudentId] = useState<string>('')
  const [copyingToOther, setCopyingToOther] = useState(false)

  // Exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [sheetsData, studentsData, exercisesData] = await Promise.all([
        trainingSheetsService.getAll(),
        studentsService.getAll(),
        exercisesService.getAll(),
      ])
      const templates = templateSheetsStorage.getAllTemplates()
      setSheets([...templates, ...sheetsData])
      setStudents(studentsData)

      const map: Record<string, any> = {}
      exercisesData.forEach((e) => {
        map[e.id] = e
      })
      setExercisesMap(map)
    } catch (err: unknown) {
      toast({
        title: 'Erro ao carregar fichas',
        description: err instanceof Error ? err.message : 'Falha na conexão',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Exportação/Compartilhamento em PDF de uma ficha da lista
  const handleExportSheet = async (sheet: TrainingSheet) => {
    const student = sheet.expand?.student || students.find((s) => s.id === sheet.student)
    const exportStudent: Student = student || {
      id: 'modelo',
      name: sheet.title || 'Ficha Modelo',
      experience_level: (sheet.template_level as any) || 'Iniciante',
      created: '',
      updated: '',
    }

    try {
      const res = await shareOrExportSheet({
        student: exportStudent,
        sheet,
        exercisesMap,
        studioName: appearance.studio_name,
        primaryColor: appearance.primary_color,
        logoUrl: appearance.logo_url,
      })
      if (res === 'opened') {
        toast({
          title: 'Ficha Pronta para Exportação / PDF',
          description: 'A janela de impressão foi aberta. Escolha "Salvar como PDF" ou imprima.',
        })
      }
    } catch {
      openSheetPrintWindow({
        student: exportStudent,
        sheet,
        exercisesMap,
        studioName: appearance.studio_name,
        primaryColor: appearance.primary_color,
        logoUrl: appearance.logo_url,
      })
    }
  }

  const handleDuplicate = async (sheetId: string) => {
    try {
      setDuplicatingId(sheetId)
      const duplicated = await trainingSheetsService.duplicate(sheetId)
      toast({
        title: 'Ficha duplicada!',
        description: 'Redirecionando para a edição da nova ficha duplicada...',
      })
      navigate(`/fichas/${duplicated.id}/editar`)
    } catch (err: unknown) {
      toast({
        title: 'Erro ao duplicar',
        description: err instanceof Error ? err.message : 'Falha ao duplicar ficha',
        variant: 'destructive',
      })
    } finally {
      setDuplicatingId(null)
    }
  }

  const handleOpenCopyModal = (sheet: TrainingSheet) => {
    setCopyModalSheet(sheet)
    // Selecionar por padrão o primeiro aluno diferente do atual (ou o primeiro da lista se for modelo)
    const target = students.find((s) => s.id !== sheet.student) || students[0]
    setCopyTargetStudentId(target?.id || '')
  }

  const handleConfirmCopyToOtherStudent = async () => {
    if (!copyModalSheet || !copyTargetStudentId) {
      toast({
        title: 'Selecione o aluno destino',
        description: 'Escolha para qual aluno a ficha será copiada.',
        variant: 'destructive',
      })
      return
    }

    const sourceStudent =
      copyModalSheet.expand?.student || students.find((s) => s.id === copyModalSheet.student)
    const targetStudent = students.find((s) => s.id === copyTargetStudentId)

    if (!targetStudent) {
      toast({
        title: 'Aluno destino não encontrado',
        variant: 'destructive',
      })
      return
    }

    try {
      setCopyingToOther(true)
      const isTemplate = copyModalSheet.is_template || !copyModalSheet.student
      const baseName = isTemplate
        ? copyModalSheet.title || 'Modelo'
        : sourceStudent?.name || 'aluno'
      const newTitle = `Ficha - ${targetStudent.name} (${baseName})`

      const duplicated = await trainingSheetsService.duplicate(
        copyModalSheet.id,
        targetStudent.id,
        newTitle,
        copyModalSheet,
      )

      toast({
        title: 'Ficha copiada com sucesso!',
        description: `Nova ficha criada e vinculada a ${targetStudent.name}. Redirecionando para edição...`,
      })

      setCopyModalSheet(null)
      navigate(`/fichas/${duplicated.id}/editar`)
    } catch (err: unknown) {
      toast({
        title: 'Erro ao copiar ficha',
        description: err instanceof Error ? err.message : 'Falha na cópia da ficha',
        variant: 'destructive',
      })
    } finally {
      setCopyingToOther(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setDeleting(true)
      const isTemplate = deleteId.startsWith('modelo-')
      if (isTemplate) {
        templateSheetsStorage.deleteCustomTemplate(deleteId)
        toast({
          title: 'Modelo removido',
          description: 'A ficha modelo personalizada foi removida.',
        })
      } else {
        await trainingSheetsService.delete(deleteId)
        toast({
          title: 'Ficha excluída',
          description: 'A ficha de treino foi removida.',
        })
      }
      setDeleteId(null)
      loadData()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao excluir',
        description: err instanceof Error ? err.message : 'Falha na exclusão',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleStartNewSheet = () => {
    if (!selectedStudentForNew) {
      setCreateModalOpen(false)
      navigate('/fichas/nova')
      return
    }
    setCreateModalOpen(false)
    navigate(`/fichas/nova?student=${selectedStudentForNew}`)
  }

  // Filtragem
  const filteredSheets = sheets.filter((sheet) => {
    const isTemplate = Boolean(sheet.is_template || !sheet.student)

    if (viewTab === 'templates' && !isTemplate) return false
    if (viewTab === 'students' && isTemplate) return false

    if (isTemplate) {
      if (levelFilter !== 'all' && sheet.template_level !== levelFilter) return false
      if (genderFilter !== 'all' && sheet.template_gender !== genderFilter) return false
    }

    const sName = sheet.expand?.student?.name || ''
    const title = sheet.title || ''
    const lvl = sheet.template_level || ''
    const gen = sheet.template_gender || ''
    const term = search.toLowerCase()

    if (!term) return true

    return (
      sName.toLowerCase().includes(term) ||
      title.toLowerCase().includes(term) ||
      lvl.toLowerCase().includes(term) ||
      gen.toLowerCase().includes(term)
    )
  })

  const templateCount = sheets.filter((s) => s.is_template || !s.student).length
  const studentCount = sheets.filter((s) => !s.is_template && s.student).length

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-primary" /> Fichas de Treino
          </h1>
          <p className="text-sm text-[#8A8F98] mt-1">
            Planejamento das séries A, B, C, D e E com cargas, repetições e observações
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/fichas/nova')}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold h-11 px-4 shadow-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Criar Ficha Modelo
          </Button>

          <Button
            onClick={() => {
              setSelectedStudentForNew(students[0]?.id || '')
              setCreateModalOpen(true)
            }}
            className="bg-primary hover:opacity-90 text-primary-foreground font-semibold h-11 px-5 shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nova Ficha para Aluno
          </Button>
        </div>
      </div>

      {/* Abas e Filtros de Fichas Modelo vs Fichas de Aluno */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-[#141414] border border-[#2A2A2A] rounded-xl">
          <button
            type="button"
            onClick={() => setViewTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewTab === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-[#8A8F98] hover:text-white'
            }`}
          >
            Todas ({sheets.length})
          </button>
          <button
            type="button"
            onClick={() => setViewTab('templates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewTab === 'templates'
                ? 'bg-amber-500 text-black shadow-sm font-extrabold'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fichas Modelo ({templateCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab('students')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewTab === 'students'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-[#8A8F98] hover:text-white'
            }`}
          >
            Fichas de Alunos ({studentCount})
          </button>
        </div>

        {viewTab === 'templates' && (
          <div className="flex items-center gap-2">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-[#181C2E] border border-amber-600/40 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Todos os Níveis</option>
              <option value="Iniciante">Iniciante</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </select>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-[#181C2E] border border-amber-600/40 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Todos os Gêneros</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Unissex">Unissex</option>
            </select>
          </div>
        )}
      </div>

      {/* Busca */}
      <div className="relative">
        <Input
          placeholder={
            viewTab === 'templates'
              ? 'Buscar fichas modelo por nível, gênero ou objetivo...'
              : 'Pesquisar ficha por aluno, modelo ou título...'
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#181C2E] border-[#252B3E] text-white placeholder:text-[#9CA5B8] h-12 pl-11 pr-4 focus-visible:ring-primary"
        />
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA5B8]" />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#9CA5B8] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Carregando fichas do Studio Bru Oliveira...</p>
        </div>
      ) : filteredSheets.length === 0 ? (
        <div className="bg-[#181C2E] border border-[#252B3E] rounded-2xl p-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#121522] flex items-center justify-center text-[#9CA5B8] mb-4">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Nenhuma ficha encontrada</h3>
          <p className="text-sm text-[#9CA5B8] max-w-sm mb-6">
            Crie a primeira ficha estruturada para seus alunos ou duplique uma ficha existente como
            base.
          </p>
          <Button
            onClick={() => {
              setSelectedStudentForNew(students[0]?.id || '')
              setCreateModalOpen(true)
            }}
            className="bg-primary hover:opacity-90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Criar Primeira Ficha
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSheets.map((sheet) => {
            const isTemplate = Boolean(sheet.is_template || !sheet.student)
            const studentName =
              sheet.expand?.student?.name ||
              (isTemplate ? 'Ficha Modelo Pré-Programada' : 'Aluno não vinculado')
            const updatedDate = new Date(sheet.updated || sheet.created).toLocaleDateString('pt-BR')
            const seriesKeys = Object.keys(sheet.series_data || {}).filter(
              (k) => (sheet.series_data as Record<string, unknown[]>)?.[k]?.length > 0,
            )

            // REQUISITO: Clicar no cartão → direto na tela de treino (/treino),
            // sem telas intermediárias, respeitando o ciclo de séries
            const handleCardClick = () => {
              if (isTemplate) {
                navigate(`/treino?template=${encodeURIComponent(sheet.id)}`)
              } else if (sheet.student) {
                navigate(`/treino?students=${sheet.student}&sheet=${sheet.id}`)
              } else {
                navigate(`/fichas/${sheet.id}/editar`)
              }
            }

            return (
              <div
                key={sheet.id}
                role="button"
                tabIndex={0}
                onClick={handleCardClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCardClick()
                  }
                }}
                className={`border rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl flex flex-col justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                  isTemplate
                    ? 'bg-gradient-to-br from-[#1A1813] to-[#141414] border-amber-500/40 hover:border-amber-400 shadow-md shadow-amber-950/20 focus:ring-amber-400'
                    : 'bg-[#181C2E] border-[#252B3E] hover:border-primary/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {isTemplate ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className="bg-amber-500 text-black font-extrabold text-[11px] px-2.5 py-0.5 tracking-wider shadow-sm flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          MODELO
                        </Badge>
                        {sheet.template_level && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 text-amber-300 text-[10px] font-semibold bg-amber-950/30"
                          >
                            {sheet.template_level}
                          </Badge>
                        )}
                        {sheet.template_gender && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 text-amber-200 text-[10px] font-semibold bg-amber-950/30"
                          >
                            {sheet.template_gender}
                          </Badge>
                        )}
                      </div>
                    ) : sheet.student && sheet.expand?.student ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(
                            `/alunos?studentId=${sheet.student}&search=${encodeURIComponent(studentName)}`,
                          )
                        }}
                        className="text-xs uppercase tracking-wider text-secondary hover:text-white font-bold flex items-center gap-1.5 hover:underline underline-offset-2 transition-colors cursor-pointer text-left"
                        title={`Abrir cadastro completo de ${studentName} na aba Alunos`}
                      >
                        <User className="w-3.5 h-3.5 text-primary" /> {studentName}
                      </button>
                    ) : (
                      <span className="text-xs uppercase tracking-wider text-secondary font-bold flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> {studentName}
                      </span>
                    )}
                    <span className="text-[11px] text-[#9CA5B8] flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" /> {updatedDate}
                    </span>
                  </div>

                  <h3
                    className={`text-base font-bold transition-colors mb-2 line-clamp-1 ${
                      isTemplate
                        ? 'text-white group-hover:text-amber-300'
                        : 'text-white group-hover:text-secondary'
                    }`}
                  >
                    {sheet.title || 'Ficha de Treino Personalizada'}
                  </h3>

                  {sheet.notes && (
                    <p className="text-xs text-[#8A8F98] line-clamp-2 mb-3">{sheet.notes}</p>
                  )}

                  {/* Séries ativas */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="text-[11px] text-[#8A8F98]">Séries configuradas:</span>
                    {seriesKeys.length > 0 ? (
                      seriesKeys.map((s) => (
                        <span
                          key={s}
                          className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center ${
                            isTemplate
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-[#2A2A2A] text-white'
                          }`}
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#8A8F98] italic">Vazia (em montagem)</span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-3 border-t border-[#2A2A2A] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExportSheet(sheet)
                      }}
                      className="p-2 rounded-lg text-[#8A8F98] hover:text-secondary hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                      title="Exportar / Compartilhar Ficha (PDF/Impressão)"
                      aria-label={`Exportar ficha de ${studentName}`}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <Link to={`/fichas/${sheet.id}/editar`} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="p-2 rounded-lg text-[#8A8F98] hover:text-white hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                        title="Editar ficha"
                        aria-label={`Editar ficha de ${studentName}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </Link>

                    {/* Botão Copiar / Vincular Aluno */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenCopyModal(sheet)
                      }}
                      className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                        isTemplate
                          ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black'
                          : 'text-[#8A8F98] hover:text-secondary hover:bg-[#2A2A2A]'
                      }`}
                      title={
                        isTemplate
                          ? 'Copiar ficha modelo e vincular a um aluno'
                          : 'Copiar ficha para outro aluno...'
                      }
                      aria-label={`Copiar ficha de ${studentName}`}
                    >
                      <Copy className="w-4 h-4" />
                      {isTemplate && <span className="text-[11px]">Usar Modelo</span>}
                    </button>

                    {!sheet.id.startsWith('modelo-') || sheet.id.startsWith('modelo-custom-') ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteId(sheet.id)
                        }}
                        className="p-2 rounded-lg text-[#8A8F98] hover:text-red-400 hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                        title="Excluir ficha"
                        aria-label={`Excluir ficha de ${studentName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>

                  {sheet.student ? (
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/treino?students=${sheet.student}&sheet=${sheet.id}`)
                      }}
                      className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold h-9 px-3.5 flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <PlaySquare className="w-3.5 h-3.5 text-secondary" /> Treinar Agora
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/treino?template=${encodeURIComponent(sheet.id)}`)
                      }}
                      className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold h-9 px-3.5 flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <PlaySquare className="w-3.5 h-3.5 text-secondary" /> Treinar Agora
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Visualização / Inspeção de Ficha Modelo */}
      <Dialog
        open={Boolean(viewingTemplateSheet)}
        onOpenChange={(open) => !open && setViewingTemplateSheet(null)}
      >
        <DialogContent className="bg-[#181C2E] border-[#252B3E] text-white sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="border-b border-[#252B3E] pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-amber-500 text-black font-extrabold text-[11px] px-2.5 py-0.5 tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                MODELO
              </Badge>
              {viewingTemplateSheet?.template_level && (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-300 text-[10px] font-semibold bg-amber-950/30"
                >
                  {viewingTemplateSheet.template_level}
                </Badge>
              )}
              {viewingTemplateSheet?.template_gender && (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-200 text-[10px] font-semibold bg-amber-950/30"
                >
                  {viewingTemplateSheet.template_gender}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-lg font-bold text-white mt-1">
              {viewingTemplateSheet?.title || 'Ficha Modelo'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#9CA5B8]">
              {viewingTemplateSheet?.notes ||
                'Estrutura pré-definida com séries, repetições e exercícios selecionados.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 overflow-y-auto space-y-4 flex-1 pr-1">
            {SERIES_KEYS.map((k) => {
              const blocks = viewingTemplateSheet?.series_data?.[k] || []
              if (blocks.length === 0) return null

              return (
                <div key={k} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-500 text-black font-black text-xs flex items-center justify-center">
                      {k}
                    </span>
                    <span className="font-bold text-sm text-white">Série {k}</span>
                    <span className="text-xs text-[#9CA5B8]">({blocks.length} exercícios)</span>
                  </div>

                  <div className="space-y-1.5 pl-2">
                    {blocks.map((b, i) => {
                      const ex = exercisesMap[b.exercise_id]
                      return (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-[#121522] border border-[#252B3E] flex items-center justify-between text-xs gap-2"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">
                              #{i + 1} {ex?.name || 'Exercício'}
                            </span>
                            <span className="text-[11px] text-[#9CA5B8]">
                              {ex?.muscle_group || 'Geral'} {b.notes ? `• ${b.notes}` : ''}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-amber-300 font-bold block">
                              {b.sets}x {b.reps || '12'}
                            </span>
                            <span className="text-[11px] text-[#9CA5B8]">
                              {b.load ? `Carga: ${b.load}` : 'Carga padrão'}
                              {b.time ? ` • ${b.time}` : ''}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter className="border-t border-[#252B3E] pt-3 flex sm:justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              {viewingTemplateSheet && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportSheet(viewingTemplateSheet)}
                  className="border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 font-bold text-xs h-9 px-3 flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" /> Exportar PDF
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewingTemplateSheet(null)}
                className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white text-xs h-9"
              >
                Fechar
              </Button>
              {viewingTemplateSheet && (
                <Button
                  type="button"
                  onClick={() => {
                    const templateToCopy = viewingTemplateSheet
                    setViewingTemplateSheet(null)
                    handleOpenCopyModal(templateToCopy)
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 px-3.5 flex items-center gap-1.5 shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar / Usar Modelo
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Copiar Ficha para Outro Aluno (Item 3) */}
      <Dialog
        open={Boolean(copyModalSheet)}
        onOpenChange={(open) => !open && setCopyModalSheet(null)}
      >
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Copy className="w-5 h-5 text-secondary" /> Copiar ficha para outro aluno
            </DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              Use esta ficha já estruturada como base para outro aluno. Todas as séries (A–E),
              exercícios, séries/reps, cargas, descanso e observações serão copiados para uma nova
              ficha independente, sem alterar o treino do aluno original.
            </DialogDescription>
          </DialogHeader>

          {copyModalSheet && (
            <div className="space-y-4 py-2">
              {/* Origem */}
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-3 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8F98]">
                  Ficha de Origem:
                </span>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">
                    {copyModalSheet.title || 'Ficha de Treino'}
                  </p>
                  {(copyModalSheet.is_template || !copyModalSheet.student) && (
                    <Badge className="bg-amber-500 text-black text-[10px] font-extrabold">
                      {copyModalSheet.template_level || 'Modelo'} •{' '}
                      {copyModalSheet.template_gender || 'Geral'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-secondary flex items-center gap-1 font-medium">
                  <User className="w-3.5 h-3.5" /> Origem:{' '}
                  <strong className="text-white">
                    {copyModalSheet.is_template || !copyModalSheet.student
                      ? 'Ficha Modelo Pré-Programada'
                      : copyModalSheet.expand?.student?.name ||
                        students.find((s) => s.id === copyModalSheet.student)?.name ||
                        'Aluno'}
                  </strong>
                </p>
              </div>

              {/* Destino */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8A8F98]">
                  Copiar para qual aluno? (Destino):
                </label>
                <StudentCombobox
                  students={students.filter((st) => st.id !== copyModalSheet.student)}
                  value={copyTargetStudentId}
                  placeholder="Selecione ou busque o aluno destino..."
                  onChange={(id) => setCopyTargetStudentId(id)}
                />
                <p className="text-[11px] text-[#8A8F98]">
                  Ao confirmar, uma cópia nova será criada e você será levado à tela de edição para
                  fazer os ajustes finos.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={copyingToOther}
              onClick={() => setCopyModalSheet(null)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={copyingToOther || !copyTargetStudentId}
              onClick={handleConfirmCopyToOtherStudent}
              className="bg-primary hover:opacity-90 text-primary-foreground font-bold"
            >
              {copyingToOther ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Copiando...
                </>
              ) : (
                'Confirmar e Criar Cópia'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Selecionar Aluno para Nova Ficha */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Nova Ficha de Treino</DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              Selecione o aluno do Studio Bru Oliveira para o qual deseja montar a ficha, ou opte
              por criar uma Ficha Modelo sem aluno:
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8A8F98] uppercase tracking-wider">
                Vincular Aluno:
              </label>
              <StudentCombobox
                students={students}
                value={selectedStudentForNew}
                placeholder="Selecione ou busque o aluno..."
                onChange={(id) => setSelectedStudentForNew(id)}
              />
            </div>

            <div className="pt-2 border-t border-[#2A2A2A]">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateModalOpen(false)
                  navigate('/fichas/nova')
                }}
                className="w-full border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold text-xs h-10"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Criar como Ficha Modelo (sem aluno vinculado)
              </Button>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleStartNewSheet}
              className="bg-primary hover:opacity-90 text-primary-foreground font-bold"
            >
              Continuar com Aluno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> Excluir esta ficha?
            </DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              Esta ação excluirá permanentemente esta ficha de treino do aluno.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              disabled={deleting}
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
