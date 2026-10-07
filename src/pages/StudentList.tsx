import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { studentsService } from '@/services/students'
import { workoutProgressService } from '@/services/workoutProgress'
import type { Student, SeriesKey } from '@/types'
import {
  Users,
  Search,
  Plus,
  PlaySquare,
  Edit2,
  Calendar,
  Phone,
  HeartPulse,
  Sparkles,
  Loader2,
  Trash2,
  ArrowUpDown,
  Printer,
  Share2,
} from 'lucide-react'
import { trainingSheetsService } from '@/services/trainingSheets'
import { exercisesService } from '@/services/exercises'
import { shareOrExportSheet, openSheetPrintWindow } from '@/services/trainingSheetPdf'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import AnamneseModal from '@/components/AnamneseModal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

export default function StudentList() {
  const navigate = useNavigate()
  const { appearance } = useTheme()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | '-updated'>('name')
  const [nextSeriesMap, setNextSeriesMap] = useState<Record<string, SeriesKey>>({})

  // Anamnese Modal
  const [selectedStudentForAnamnese, setSelectedStudentForAnamnese] = useState<Student | null>(null)

  // Delete Dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState<string>('')
  const [deleting, setDeleting] = useState(false)
  const [exportingStudentId, setExportingStudentId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await studentsService.getAll(search, sortBy)
      setStudents(data)

      // Descobrir última série concluída para determinar a próxima
      const map: Record<string, SeriesKey> = {}
      await Promise.all(
        data.map(async (st) => {
          const latest = await workoutProgressService.getLatestByStudent(st.id)
          if (latest) {
            const seriesOrder: SeriesKey[] = ['A', 'B', 'C', 'D', 'E']
            const idx = seriesOrder.indexOf(latest.series_completed)
            const nextIdx = (idx + 1) % seriesOrder.length
            map[st.id] = seriesOrder[nextIdx]
          } else {
            map[st.id] = 'A'
          }
        }),
      )
      setNextSeriesMap(map)
    } catch (err: unknown) {
      toast({
        title: 'Erro ao listar alunos',
        description: err instanceof Error ? err.message : 'Falha na conexão',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search, sortBy])

  // Exportar/Baixar ficha do aluno diretamente da lista de alunos
  const handleExportStudentSheet = async (student: Student) => {
    try {
      setExportingStudentId(student.id)
      const [sheet, exList] = await Promise.all([
        trainingSheetsService.getByStudent(student.id),
        exercisesService.getAll(),
      ])

      if (!sheet) {
        toast({
          title: 'Aluno sem ficha',
          description: `Monte uma ficha para ${student.name} antes de exportar.`,
          variant: 'destructive',
        })
        return
      }

      const map: Record<string, any> = {}
      exList.forEach((e) => {
        map[e.id] = e
      })

      const res = await shareOrExportSheet({
        student,
        sheet,
        exercisesMap: map,
        studioName: appearance.studio_name,
        primaryColor: appearance.primary_color,
        logoUrl: appearance.logo_url,
      })

      if (res === 'opened') {
        toast({
          title: 'Ficha Pronta para Exportação / PDF',
          description: 'A janela foi aberta para salvar como PDF ou imprimir.',
        })
      }
    } catch (err: unknown) {
      toast({
        title: 'Erro ao gerar PDF',
        description: err instanceof Error ? err.message : 'Falha na exportação',
        variant: 'destructive',
      })
    } finally {
      setExportingStudentId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setDeleting(true)
      await studentsService.delete(deleteId)
      toast({
        title: 'Aluno excluído',
        description: 'Cadastro removido com sucesso.',
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

  const calculateAge = (birthdate?: string) => {
    if (!birthdate) return null
    const bDate = new Date(birthdate)
    const diff = Date.now() - bDate.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" /> Gestão de Alunos
          </h1>
          <p className="text-sm text-[#8A8F98] mt-1">
            Cadastros, fichas de saúde, anamnese e atalhos rápidos para conduzir aulas
          </p>
        </div>

        <Link to="/alunos/novo">
          <Button className="bg-primary hover:opacity-90 text-primary-foreground font-medium h-11 px-5 shadow-md flex items-center gap-2">
            <Plus className="w-4 h-4" /> Cadastrar Aluno
          </Button>
        </Link>
      </div>

      {/* Barra de Busca e Ordenação */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-3">
          <Input
            placeholder="Pesquisar aluno por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1E1E1E] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 pl-11 pr-4 focus-visible:ring-primary"
          />
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
        </div>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | '-updated')}
            className="w-full h-12 bg-[#1E1E1E] border border-[#2E2E2E] text-white rounded-md px-3.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="name">Ordem Alfabética</option>
            <option value="-updated">Atividade Recente</option>
          </select>
          <ArrowUpDown className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98] pointer-events-none" />
        </div>
      </div>

      {/* Lista de Alunos */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#8A8F98] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Carregando alunos do Studio Bru Oliveira...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2A2A2A] flex items-center justify-center text-[#8A8F98] mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Nenhum aluno encontrado</h3>
          <p className="text-sm text-[#8A8F98] max-w-sm mb-6">
            Não há registros com os critérios informados. Comece adicionando um novo aluno.
          </p>
          <Link to="/alunos/novo">
            <Button className="bg-primary hover:opacity-90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-1.5" /> Cadastrar Novo Aluno
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => {
            const age = calculateAge(student.birthdate)
            const nextSeries = nextSeriesMap[student.id] || 'A'
            const initials = student.name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0].toUpperCase())
              .join('')

            return (
              <div
                key={student.id}
                className="bg-[#1E1E1E] border border-[#2E2E2E] hover:border-primary/40 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl flex flex-col justify-between group"
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#2A2A2A] to-[#3A3A3A] border border-primary/30 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors truncate">
                          {student.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#8A8F98]">
                          {age !== null ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {age} anos
                            </span>
                          ) : null}
                          {student.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {student.phone}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <Badge className="bg-primary/15 text-primary border border-primary/30 text-xs px-2.5 py-0.5 font-semibold shrink-0">
                      Treino {nextSeries}
                    </Badge>
                  </div>

                  {/* Restrições / Alerta */}
                  {student.restrictions && (
                    <div className="mb-3 p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 font-medium line-clamp-1">
                      ⚠️ {student.restrictions}
                    </div>
                  )}

                  {/* Objetivos */}
                  {student.goals && student.goals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {student.goals.slice(0, 3).map((goal) => (
                        <span
                          key={goal}
                          className="text-[10px] bg-[#2A2A2A] text-[#8A8F98] px-2 py-0.5 rounded-full"
                        >
                          {goal}
                        </span>
                      ))}
                      {student.goals.length > 3 && (
                        <span className="text-[10px] text-[#8A8F98] py-0.5">
                          +{student.goals.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Ações inferiores */}
                <div className="pt-3 border-t border-[#2A2A2A] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Exportar PDF rápido do aluno */}
                    <button
                      type="button"
                      disabled={exportingStudentId === student.id}
                      onClick={() => handleExportStudentSheet(student)}
                      className="p-2 rounded-lg text-[#8A8F98] hover:text-secondary hover:bg-[#2A2A2A] transition-colors"
                      title="Exportar / Compartilhar Ficha (PDF/Impressão)"
                      aria-label={`Exportar ficha de ${student.name}`}
                    >
                      {exportingStudentId === student.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedStudentForAnamnese(student)}
                      className="p-2 rounded-lg text-[#8A8F98] hover:text-primary hover:bg-[#2A2A2A] transition-colors"
                      title="Ver Anamnese"
                      aria-label={`Ver anamnese de ${student.name}`}
                    >
                      <HeartPulse className="w-4 h-4" />
                    </button>

                    <Link to={`/alunos/${student.id}/editar`}>
                      <button
                        className="p-2 rounded-lg text-[#8A8F98] hover:text-white hover:bg-[#2A2A2A] transition-colors"
                        title="Editar aluno"
                        aria-label={`Editar ${student.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </Link>

                    <button
                      onClick={() => {
                        setDeleteId(student.id)
                        setDeleteName(student.name)
                      }}
                      className="p-2 rounded-lg text-[#8A8F98] hover:text-red-400 hover:bg-[#2A2A2A] transition-colors"
                      title="Excluir aluno"
                      aria-label={`Excluir ${student.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Iniciar Treino */}
                  <Button
                    onClick={() => navigate(`/treino?students=${student.id}`)}
                    className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold h-9 px-3.5 flex items-center gap-1.5 shadow-sm"
                  >
                    <PlaySquare className="w-3.5 h-3.5 text-secondary" /> Abrir Treino
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Anamnese */}
      <AnamneseModal
        isOpen={Boolean(selectedStudentForAnamnese)}
        onClose={() => setSelectedStudentForAnamnese(null)}
        student={selectedStudentForAnamnese}
      />

      {/* Confirmação de Exclusão */}
      <Dialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Excluir aluno?</DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              Tem certeza que deseja excluir o cadastro de &quot;{deleteName}&quot;? As fichas de
              treino vinculadas a este aluno também serão removidas.
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
