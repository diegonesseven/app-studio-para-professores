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
  Printer,
} from 'lucide-react'
import { exercisesService } from '@/services/exercises'
import { shareOrExportSheet, openSheetPrintWindow } from '@/services/trainingSheetPdf'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  // Modal para selecionar aluno antes de criar nova ficha
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedStudentForNew, setSelectedStudentForNew] = useState<string>('')

  // Duplicação simples (mesmo aluno)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

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
      setSheets(sheetsData)
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
    if (!student) {
      toast({
        title: 'Aluno não encontrado',
        description: 'Não foi possível localizar os dados do aluno para o PDF.',
        variant: 'destructive',
      })
      return
    }

    try {
      const res = await shareOrExportSheet({
        student,
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
        student,
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
    // Selecionar por padrão o primeiro aluno diferente do atual
    const otherStudent = students.find((s) => s.id !== sheet.student)
    setCopyTargetStudentId(otherStudent?.id || '')
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
      const newTitle = copyModalSheet.title
        ? `${copyModalSheet.title} (base: ${sourceStudent?.name || 'aluno'})`
        : `Ficha de Treino - ${targetStudent.name}`

      const duplicated = await trainingSheetsService.duplicate(
        copyModalSheet.id,
        targetStudent.id,
        newTitle,
      )

      toast({
        title: 'Ficha copiada com sucesso!',
        description: `Nova ficha criada para ${targetStudent.name} a partir de ${sourceStudent?.name || 'outro aluno'}. Redirecionando para ajuste...`,
      })

      setCopyModalSheet(null)
      navigate(`/fichas/${duplicated.id}/editar`)
    } catch (err: unknown) {
      toast({
        title: 'Erro ao copiar ficha',
        description: err instanceof Error ? err.message : 'Falha na cópia entre alunos',
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
      await trainingSheetsService.delete(deleteId)
      toast({
        title: 'Ficha excluída',
        description: 'A ficha de treino foi removida.',
      })
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
      toast({
        title: 'Selecione um aluno',
        description: 'Escolha para qual aluno a ficha será montada.',
        variant: 'destructive',
      })
      return
    }
    setCreateModalOpen(false)
    navigate(`/fichas/nova?student=${selectedStudentForNew}`)
  }

  // Filtragem
  const filteredSheets = sheets.filter((sheet) => {
    const sName = sheet.expand?.student?.name || ''
    const title = sheet.title || ''
    const term = search.toLowerCase()
    return sName.toLowerCase().includes(term) || title.toLowerCase().includes(term)
  })

  return (
    <div className="space-y-6 animate-fade-in pb-12">
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

        <Button
          onClick={() => {
            setSelectedStudentForNew(students[0]?.id || '')
            setCreateModalOpen(true)
          }}
          className="bg-primary hover:opacity-90 text-primary-foreground font-semibold h-11 px-5 shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nova Ficha
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Input
          placeholder="Pesquisar ficha por aluno ou título..."
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
            const studentName = sheet.expand?.student?.name || 'Aluno não vinculado'
            const updatedDate = new Date(sheet.updated || sheet.created).toLocaleDateString('pt-BR')
            const seriesKeys = Object.keys(sheet.series_data || {}).filter(
              (k) => (sheet.series_data as Record<string, unknown[]>)?.[k]?.length > 0,
            )

            return (
              <div
                key={sheet.id}
                className="bg-[#181C2E] border border-[#252B3E] hover:border-primary/50 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs uppercase tracking-wider text-secondary font-bold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> {studentName}
                    </span>
                    <span className="text-[11px] text-[#9CA5B8] flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {updatedDate}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-secondary transition-colors mb-2 line-clamp-1">
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
                          className="w-5 h-5 rounded-md bg-[#2A2A2A] text-white text-[11px] font-bold flex items-center justify-center"
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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleExportSheet(sheet)}
                      className="p-2 rounded-lg text-[#8A8F98] hover:text-secondary hover:bg-[#2A2A2A] transition-colors"
                      title="Exportar / Compartilhar Ficha (PDF/Impressão)"
                      aria-label={`Exportar ficha de ${studentName}`}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <Link to={`/fichas/${sheet.id}/editar`}>
                      <button
                        className="p-2 rounded-lg text-[#8A8F98] hover:text-white hover:bg-[#2A2A2A] transition-colors"
                        title="Editar ficha"
                        aria-label={`Editar ficha de ${studentName}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleOpenCopyModal(sheet)}
                      className="p-2 rounded-lg text-[#8A8F98] hover:text-secondary hover:bg-[#2A2A2A] transition-colors"
                      title="Copiar para outro aluno..."
                      aria-label={`Copiar ficha de ${studentName} para outro aluno`}
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteId(sheet.id)}
                      className="p-2 rounded-lg text-[#8A8F98] hover:text-red-400 hover:bg-[#2A2A2A] transition-colors"
                      title="Excluir ficha"
                      aria-label={`Excluir ficha de ${studentName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Button
                    onClick={() => navigate(`/treino?students=${sheet.student}`)}
                    className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold h-9 px-3.5 flex items-center gap-1.5 shadow-sm"
                  >
                    <PlaySquare className="w-3.5 h-3.5 text-secondary" /> Treinar Agora
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
                <p className="text-sm font-semibold text-white">
                  {copyModalSheet.title || 'Ficha de Treino'}
                </p>
                <p className="text-xs text-secondary flex items-center gap-1 font-medium">
                  <User className="w-3.5 h-3.5" /> Aluno de origem:{' '}
                  <strong className="text-white">
                    {copyModalSheet.expand?.student?.name ||
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
                <select
                  value={copyTargetStudentId}
                  onChange={(e) => setCopyTargetStudentId(e.target.value)}
                  className="w-full h-12 bg-[#121212] border border-[#2E2E2E] text-white rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione o aluno destino...</option>
                  {students
                    .filter((st) => st.id !== copyModalSheet.student)
                    .map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} {st.phone ? `(${st.phone})` : ''}
                      </option>
                    ))}
                </select>
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
              Selecione o aluno do Studio Bru Oliveira para o qual deseja montar o planejamento de
              séries:
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <select
              value={selectedStudentForNew}
              onChange={(e) => setSelectedStudentForNew(e.target.value)}
              className="w-full h-12 bg-[#121212] border border-[#2E2E2E] text-white rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} {st.phone ? `(${st.phone})` : ''}
                </option>
              ))}
            </select>
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
              Continuar para Montagem
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
