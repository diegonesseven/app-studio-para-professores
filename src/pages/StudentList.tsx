import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { studentsService } from '@/services/students'
import { workoutProgressService } from '@/services/workoutProgress'
import { getAvailableSeriesKeys, getNextSeriesKey } from '@/lib/seriesCycle'
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
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import AnamneseModal from '@/components/AnamneseModal'
import { StudentAvatar } from '@/components/StudentAvatar'
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
  const [searchParams] = useSearchParams()
  const initialStudentId = searchParams.get('studentId') || ''
  const initialSearch = searchParams.get('search') || ''

  const { appearance } = useTheme()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialSearch)
  const [sortBy, setSortBy] = useState<'name' | '-updated'>('name')
  const [nextSeriesMap, setNextSeriesMap] = useState<Record<string, SeriesKey>>({})
  const [highlightedStudentId, setHighlightedStudentId] = useState<string>(initialStudentId)

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

      const studentIds = data.map((s) => s.id)

      // Carrega em BATCH (apenas 2 requisições no total para todos os 95+ alunos)
      // eliminando completamente o padrão N+1 que causava HTTP 429 (Too Many Requests)
      const [sheetsMap, progressMap] = await Promise.all([
        trainingSheetsService.getActiveMapForStudents(studentIds),
        workoutProgressService.getLatestMapForStudents(studentIds),
      ])

      const map: Record<string, SeriesKey> = {}
      for (const st of data) {
        const sheet = sheetsMap.get(st.id) || null
        const latest = progressMap.get(st.id) || null
        const available = getAvailableSeriesKeys(sheet?.series_data)
        if (latest) {
          map[st.id] = getNextSeriesKey(latest.series_completed, available)
        } else {
          map[st.id] = available[0] || 'A'
        }
      }
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

  // Scroll e destaque suave para o aluno vindo de parâmetro de URL (ex: clique na ficha)
  useEffect(() => {
    if (initialStudentId && !loading && students.length > 0) {
      setHighlightedStudentId(initialStudentId)
      const element = document.getElementById(`student-card-${initialStudentId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [initialStudentId, loading, students])

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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" /> Gestão de Alunos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
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
            className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 pl-11 pr-4 focus-visible:ring-primary shadow-sm"
          />
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | '-updated')}
            className="w-full h-12 bg-card border border-border text-foreground rounded-md px-3.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          >
            <option value="name">Ordem Alfabética</option>
            <option value="-updated">Atividade Recente</option>
          </select>
          <ArrowUpDown className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Lista de Alunos */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Carregando alunos do Studio Bru Oliveira...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-10 text-center flex flex-col items-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Nenhum aluno encontrado</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
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

            const isHighlighted = highlightedStudentId === student.id

            return (
              <div
                key={student.id}
                id={`student-card-${student.id}`}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/alunos/${student.id}/editar`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/alunos/${student.id}/editar`)
                  }
                }}
                className={`rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
                  isHighlighted
                    ? 'bg-primary/5 border-2 border-primary ring-4 ring-primary/20 shadow-lg scale-[1.01]'
                    : 'bg-card border border-border hover:border-primary/60 shadow-sm'
                }`}
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <StudentAvatar student={student} className="w-11 h-11" alt={student.name} />
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {student.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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

                    <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 font-semibold shrink-0">
                      Treino {nextSeries}
                    </Badge>
                  </div>

                  {/* Restrições / Alerta */}
                  {student.restrictions && (
                    <div className="mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-medium line-clamp-1">
                      ⚠️ {student.restrictions}
                    </div>
                  )}

                  {/* Objetivos */}
                  {student.goals && student.goals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {student.goals.slice(0, 3).map((goal) => (
                        <span
                          key={goal}
                          className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border"
                        >
                          {goal}
                        </span>
                      ))}
                      {student.goals.length > 3 && (
                        <span className="text-[10px] text-muted-foreground py-0.5">
                          +{student.goals.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Ações inferiores */}
                <div
                  className="pt-3 border-t border-border flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1">
                    {/* Exportar PDF rápido do aluno */}
                    <button
                      type="button"
                      disabled={exportingStudentId === student.id}
                      onClick={() => handleExportStudentSheet(student)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                      title="Exportar / Compartilhar Ficha (PDF/Impressão)"
                      aria-label={`Exportar ficha de ${student.name}`}
                    >
                      {exportingStudentId === student.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedStudentForAnamnese(student)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                      title="Ver Anamnese"
                      aria-label={`Ver anamnese de ${student.name}`}
                    >
                      <HeartPulse className="w-4 h-4" />
                    </button>

                    <Link to={`/alunos/${student.id}/editar`} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Editar cadastro do aluno"
                        aria-label={`Editar ${student.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteId(student.id)
                        setDeleteName(student.name)
                      }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors"
                      title="Excluir aluno"
                      aria-label={`Excluir ${student.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Iniciar Treino */}
                  <Button
                    type="button"
                    onClick={() => navigate(`/treino?students=${student.id}`)}
                    className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold h-9 px-3.5 flex items-center gap-1.5 shadow-sm"
                  >
                    <PlaySquare className="w-3.5 h-3.5 text-primary-foreground" /> Abrir Treino
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
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Excluir aluno?</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Tem certeza que deseja excluir o cadastro de &quot;{deleteName}&quot;? As fichas de
              treino vinculadas a este aluno também serão removidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="border-border bg-card hover:bg-muted text-foreground"
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
