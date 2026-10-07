import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { studentsService } from '@/services/students'
import { exercisesService } from '@/services/exercises'
import { trainingSheetsService } from '@/services/trainingSheets'
import { workoutProgressService } from '@/services/workoutProgress'
import type { Student, SeriesKey } from '@/types'
import {
  Users,
  Search,
  UserPlus,
  Dumbbell,
  ClipboardList,
  PlaySquare,
  ChevronRight,
  TrendingUp,
  History,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
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

export default function Index() {
  const navigate = useNavigate()
  const { user, role, isAdmin } = useAuth()

  // Estados dos dados do dashboard
  const [students, setStudents] = useState<Student[]>([])
  const [recentStudents, setRecentStudents] = useState<Student[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalExercises, setTotalExercises] = useState(0)
  const [totalSheets, setTotalSheets] = useState(0)

  // Busca rápida de alunos
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Próxima série de cada aluno recente
  const [nextSeriesMap, setNextSeriesMap] = useState<Record<string, SeriesKey>>({})

  // Modal para atalho rápido "Nova Ficha"
  const [sheetModalOpen, setSheetModalOpen] = useState(false)
  const [selectedStudentForSheet, setSelectedStudentForSheet] = useState<string>('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [allSt, recSt, cSt, cEx, cSh] = await Promise.all([
          studentsService.getAll(),
          studentsService.getRecent(5),
          studentsService.count(),
          exercisesService.count(),
          trainingSheetsService.count(),
        ])

        setStudents(allSt)
        setRecentStudents(recSt)
        setTotalStudents(cSt)
        setTotalExercises(cEx)
        setTotalSheets(cSh)

        if (allSt.length > 0) {
          setSelectedStudentForSheet(allSt[0].id)
        }

        // Buscar próxima série dos 5 alunos recentes
        const map: Record<string, SeriesKey> = {}
        await Promise.all(
          recSt.map(async (st) => {
            const latest = await workoutProgressService.getLatestByStudent(st.id)
            if (latest) {
              const keys: SeriesKey[] = ['A', 'B', 'C', 'D', 'E']
              const idx = keys.indexOf(latest.series_completed)
              map[st.id] = keys[(idx + 1) % keys.length]
            } else {
              map[st.id] = 'A'
            }
          }),
        )
        setNextSeriesMap(map)
      } catch (err) {
        console.error(err)
      }
    }

    loadDashboard()
  }, [])

  // Formatação de data em português brasileiro (ex: "Segunda-feira, 17 de junho")
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())

  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1)

  const firstName = user?.name ? user.name.split(' ')[0] : 'Professor'

  // Alunos filtrados na busca rápida
  const filteredStudents = students.filter((st) => {
    if (!searchQuery.trim()) return false
    return st.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleSelectStudentForTraining = (studentId: string) => {
    setSearchQuery('')
    setDropdownOpen(false)
    navigate(`/treino?students=${studentId}`)
  }

  const handleStartNewSheet = () => {
    if (!selectedStudentForSheet) return
    setSheetModalOpen(false)
    navigate(`/fichas/nova?student=${selectedStudentForSheet}`)
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* HEADER: Saudação e Data */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#252525]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider text-primary font-bold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {capitalizedDate}
            </span>
            <span className="text-xs text-[#8A8F98]">•</span>
            <span className="text-xs text-[#8A8F98] flex items-center gap-1">
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Perfil Administrador
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Perfil Professor
                </>
              )}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Olá, {firstName} 👋
          </h1>
          <p className="text-sm text-[#8A8F98] mt-1">
            Pronto para conduzir as aulas de hoje no Studio Bru Oliveira?
          </p>
        </div>

        {/* Botão de Destaque Treino ao Vivo */}
        <Button
          onClick={() => navigate('/treino')}
          className="bg-primary hover:opacity-90 text-primary-foreground font-bold h-12 px-6 shadow-xl shadow-primary/20 flex items-center gap-2 rounded-xl"
        >
          <PlaySquare className="w-5 h-5" /> Abrir Tela de Treino
        </Button>
      </div>

      {/* STUDENT SEARCH PROMINENTE */}
      <div className="relative">
        <div className="relative">
          <Input
            placeholder="Pesquisar aluno pelo nome para iniciar o treino agora..."
            value={searchQuery}
            onFocus={() => setDropdownOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setDropdownOpen(true)
            }}
            className="w-full h-14 bg-[#1E1E1E] border-[#2E2E2E] hover:border-primary/50 text-white placeholder:text-[#8A8F98] pl-12 pr-4 text-base rounded-2xl shadow-lg focus-visible:ring-2 focus-visible:ring-primary"
          />
          <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
        </div>

        {/* Dropdown de Alunos Encontrados */}
        {dropdownOpen && filteredStudents.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl shadow-2xl z-30 max-h-72 overflow-y-auto p-2 space-y-1 animate-fade-in">
            <span className="text-[11px] font-bold text-[#8A8F98] px-3 py-1 block uppercase tracking-wider">
              Selecione para abrir o treino:
            </span>
            {filteredStudents.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleSelectStudentForTraining(st.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#2A2A2A] text-left transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#2A2A2A] border border-primary/40 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {st.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors block truncate">
                      {st.name}
                    </span>
                    <span className="text-xs text-[#8A8F98] truncate block">
                      {st.phone || 'Sem telefone'} • {st.experience_level || 'Iniciante'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge className="bg-primary/20 text-primary border border-primary/40 text-xs">
                    Abrir Treino
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-[#8A8F98] group-hover:text-white" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* QUICK ACTIONS ROW (Ações Rápidas em Cards Grandes) */}
      <div>
        <h2 className="text-sm font-bold text-[#8A8F98] uppercase tracking-wider mb-3">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Cadastrar Aluno */}
          <Link
            to="/alunos/novo"
            className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#2E2E2E] hover:border-primary/50 transition-all hover:-translate-y-0.5 hover:shadow-xl flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                Cadastrar Aluno
              </h3>
              <p className="text-xs text-[#8A8F98]">Dados básicos e anamnese completa</p>
            </div>
          </Link>

          {/* Card 2: Novo Exercício */}
          <Link
            to="/acervo/novo"
            className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#2E2E2E] hover:border-primary/50 transition-all hover:-translate-y-0.5 hover:shadow-xl flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                Novo Exercício
              </h3>
              <p className="text-xs text-[#8A8F98]">Cadastrar movimento com vídeo do YouTube</p>
            </div>
          </Link>

          {/* Card 3: Nova Ficha de Treino */}
          <div
            onClick={() => setSheetModalOpen(true)}
            className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#2E2E2E] hover:border-primary/50 transition-all hover:-translate-y-0.5 hover:shadow-xl flex items-center gap-4 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                Nova Ficha de Treino
              </h3>
              <p className="text-xs text-[#8A8F98]">Montar séries A–E com cargas e repetições</p>
            </div>
          </div>
        </div>
      </div>

      {/* STATS ROW (Estatísticas do Studio Bru Oliveira) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#171717] border border-[#2A2A2A] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8A8F98] uppercase tracking-wider font-semibold">
              Alunos Ativos
            </span>
            <div className="text-3xl font-extrabold text-white mt-1">{totalStudents}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] text-primary flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#171717] border border-[#2A2A2A] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8A8F98] uppercase tracking-wider font-semibold">
              Fichas Montadas
            </span>
            <div className="text-3xl font-extrabold text-white mt-1">{totalSheets}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] text-emerald-400 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#171717] border border-[#2A2A2A] flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8A8F98] uppercase tracking-wider font-semibold">
              Exercícios no Acervo
            </span>
            <div className="text-3xl font-extrabold text-white mt-1">{totalExercises}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] text-purple-400 flex items-center justify-center">
            <Dumbbell className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* STUDENT QUICK LIST (Últimos alunos com chevron e próxima série) */}
      <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Alunos com Atividade Recente
            </h2>
            <p className="text-xs text-[#8A8F98]">
              Toque no aluno para abrir a tela de treino imediatamente de onde ele parou
            </p>
          </div>
          <Link
            to="/alunos"
            className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
          >
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentStudents.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8A8F98]">
            Nenhum aluno cadastrado no momento.
          </div>
        ) : (
          <div className="divide-y divide-[#2A2A2A]">
            {recentStudents.map((st) => {
              const initials = st.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0].toUpperCase())
                .join('')

              const nextSeries = nextSeriesMap[st.id] || 'A'

              return (
                <div
                  key={st.id}
                  onClick={() => navigate(`/treino?students=${st.id}`)}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-[#252525] px-3 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#2A2A2A] border border-primary/40 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-white group-hover:text-primary transition-colors block truncate">
                        {st.name}
                      </span>
                      <span className="text-xs text-[#8A8F98] truncate block">
                        {st.phone || 'Sem contato'} • {st.experience_level || 'Personal'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className="bg-primary/15 text-primary border border-primary/30 text-xs px-2.5 py-0.5 font-semibold">
                      Próximo: Treino {nextSeries}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-[#8A8F98] group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL SELETOR DE ALUNO PARA NOVA FICHA */}
      <Dialog open={sheetModalOpen} onOpenChange={setSheetModalOpen}>
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Nova Ficha de Treino</DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              Selecione o aluno para montar o planejamento das séries A, B, C, D e E:
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <select
              value={selectedStudentForSheet}
              onChange={(e) => setSelectedStudentForSheet(e.target.value)}
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
              onClick={() => setSheetModalOpen(false)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleStartNewSheet}
              className="bg-primary hover:opacity-90 text-primary-foreground"
            >
              Avançar para Montagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
