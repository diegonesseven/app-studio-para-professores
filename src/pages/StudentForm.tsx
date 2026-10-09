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
  type WorkoutProgress,
  type Exercise,
  type Student,
  type TrainingSheet,
  type AnamnesisData,
  SERIES_KEYS,
} from '@/types'
import { maskPhone, validatePhone, sanitizeText } from '@/lib/validation'
import { trainingSheetsService } from '@/services/trainingSheets'
import { shareOrExportSheet } from '@/services/trainingSheetPdf'
import { useTheme } from '@/contexts/ThemeContext'
import pb from '@/lib/pocketbase/client'
import { PhysicalAssessmentTab } from '@/components/PhysicalAssessmentTab'
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
  Camera,
  X,
  Layers,
  Plus,
  Maximize2,
  Activity,
} from 'lucide-react'

export default function StudentForm() {
  const { id } = useParams<{ id: string }>()
  const { appearance } = useTheme()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  // Navegação entre abas no topo do cadastro
  const [activeMainTab, setActiveMainTab] = useState<'cadastro' | 'avaliacao'>('cadastro')

  // Dados Básicos
  const [name, setName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [generalObservations, setGeneralObservations] = useState('')

  // Anamnese - Restrições médicas (permanece intacto)
  const [restrictions, setRestrictions] = useState('')
  const [anamneseOpen, setAnamneseOpen] = useState(false)

  // Novo modelo exato de Anamnese (Itens 5 e 6)
  const [treinouPersonalAntes, setTreinouPersonalAntes] = useState('')
  const [profissao, setProfissao] = useState('')
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([])
  const [enfaseMusculatura, setEnfaseMusculatura] = useState('')
  const [praticouExercicio, setPraticouExercicio] = useState<'SIM' | 'NAO' | ''>('')
  const [praticouExercicioQuais, setPraticouExercicioQuais] = useState('')
  const [tempoSemPraticar, setTempoSemPraticar] = useState('')
  const [restricaoExercicio, setRestricaoExercicio] = useState<'SIM' | 'NAO' | ''>('')
  const [restricaoExercicioQuais, setRestricaoExercicioQuais] = useState('')
  const [doencasSelecionadas, setDoencasSelecionadas] = useState<string[]>([])
  const [doencasOutros, setDoencasOutros] = useState('')
  const [possuiLesao, setPossuiLesao] = useState('')
  const [doresCorpo, setDoresCorpo] = useState<'SIM' | 'NAO' | ''>('')
  const [doresCorpoQuais, setDoresCorpoQuais] = useState('')
  const [fazDieta, setFazDieta] = useState<'SIM' | 'NAO' | ''>('')
  const [fazNutricionista, setFazNutricionista] = useState<'SIM' | 'NAO' | ''>('')
  const [usoSubstancias, setUsoSubstancias] = useState<string[]>([])

  // Fotos na Anamnese (Item 5)
  const [existingAnamnesisPhotos, setExistingAnamnesisPhotos] = useState<string[]>([])
  const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([])
  const [previewEnlargedPhoto, setPreviewEnlargedPhoto] = useState<string | null>(null)

  // Preservação de dados antigos para não perder histórico anterior
  const [legacyHealthHistory, setLegacyHealthHistory] = useState('')
  const [legacySurgeries, setLegacySurgeries] = useState('')
  const [legacyTeacherObs, setLegacyTeacherObs] = useState('')

  // Histórico de Fichas Anteriores do aluno (Item 4)
  const [allStudentSheets, setAllStudentSheets] = useState<TrainingSheet[]>([])
  const [viewingArchivedSheet, setViewingArchivedSheet] = useState<TrainingSheet | null>(null)

  // Histórico de treinos do aluno com o professor
  const [studentHistory, setStudentHistory] = useState<WorkoutProgress[]>([])
  const [exercisesMap, setExercisesMap] = useState<Record<string, Exercise>>({})
  const [selectedHistorySession, setSelectedHistorySession] = useState<WorkoutProgress | null>(null)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

          lastError = err
          const errMsg = err instanceof Error ? err.message : String(err)
          const is429 = errMsg.includes('429') || errMsg.toLowerCase().includes('too many requests')
          if (is429 && attempt < maxRetries) {
            await new Promise((res) => setTimeout(res, 600 * attempt))
            continue
          }
          break
        }
      }

      if (isMounted) {
        toast({
          title: 'Erro ao carregar aluno',
          description: lastError instanceof Error ? lastError.message : 'Não encontrado',
          variant: 'destructive',
        })
        navigate('/alunos')
        setLoading(false)
      }
    }

    fetchStudentDataWithRetry()

    return () => {
      isMounted = false
    }
  }, [id, navigate])
=======
      if (isMounted) {
        toast({
          title: 'Erro ao carregar aluno',
          description: lastError instanceof Error ? lastError.message : 'Não encontrado',
          variant: 'destructive',
        })
        navigate('/alunos')
        setLoading(false)
      }
    }

    fetchStudentDataWithRetry()

    return () => {
      isMounted = false
    }
  }, [id, navigate])
=======
          setName(st.name)
          setBirthdate(st.birthdate ? st.birthdate.split('T')[0] : '')
          setPhone(st.phone ? maskPhone(st.phone) : '')
          if (st.photo) {
            setPhotoPreview(pb.files.getURL(st as any, st.photo))
          } else {
            setPhotoPreview(null)
          }
          setRemovePhoto(false)
          setGeneralObservations(st.general_observations || '')
          setRestrictions(st.restrictions || '')

          // Fotos da anamnese
          setExistingAnamnesisPhotos(st.anamnesis_photos || [])

          // Dados estruturados da nova anamnese ou mapeamento/preservação dos dados legados
          const anData = st.anamnesis_data || {}
          setTreinouPersonalAntes(anData.treinou_personal_antes || '')
          setProfissao(anData.profissao || '')

          // Se já tem objetivos estruturados usa eles; se não, mapeia dos goals legados
          if (anData.objetivos && anData.objetivos.length > 0) {
            setObjetivosSelecionados(anData.objetivos)
          } else if (st.goals && st.goals.length > 0) {
            setObjetivosSelecionados(st.goals as string[])
          }

          setEnfaseMusculatura(anData.enfase_musculatura || '')
          setPraticouExercicio(anData.praticou_exercicio || '')
          setPraticouExercicioQuais(anData.praticou_exercicio_quais || '')
          setTempoSemPraticar(anData.tempo_sem_praticar || '')
          setRestricaoExercicio(anData.restricao_exercicio || (st.restrictions ? 'SIM' : ''))
          setRestricaoExercicioQuais(anData.restricao_exercicio_quais || '')

          setDoencasSelecionadas(anData.possui_doenca || [])
          setDoencasOutros(anData.possui_doenca_outros || '')

          // Lesão: se não estiver na anData, usa o campo legacy injuries
          setPossuiLesao(anData.possui_lesao || st.injuries || '')

          setDoresCorpo(anData.dores_corpo || '')
          setDoresCorpoQuais(anData.dores_corpo_quais || '')
          setFazDieta(anData.faz_dieta || '')
          setFazNutricionista(anData.faz_nutricionista || '')
          setUsoSubstancias(anData.uso_substancias || [])

          // Campos legados preservados
          setLegacyHealthHistory(st.health_history || '')
          setLegacySurgeries(st.surgeries || '')
          setLegacyTeacherObs(st.teacher_observations || '')

          setAllStudentSheets(sheets)
          setStudentHistory(history)
          const map: Record<string, Exercise> = {}
          exList.forEach((e) => {
            map[e.id] = e
          })
          setExercisesMap(map)

          if (
            st.restrictions ||
            st.anamnesis_data ||
            st.injuries ||
            st.health_history ||
            (st.anamnesis_photos && st.anamnesis_photos.length > 0)
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
=======
          lastError = err
          const errMsg = err instanceof Error ? err.message : String(err)
          const is429 = errMsg.includes('429') || errMsg.toLowerCase().includes('too many requests')
          if (is429 && attempt < maxRetries) {
            await new Promise((res) => setTimeout(res, 600 * attempt))
            continue
          }
          break
        }
      }

      if (isMounted) {
        toast({
          title: 'Erro ao carregar aluno',
          description: lastError instanceof Error ? lastError.message : 'Não encontrado',
          variant: 'destructive',
        })
        navigate('/alunos')
        setLoading(false)
      }
    }

    fetchStudentDataWithRetry()

    return () => {
      isMounted = false
    }
  }, [id, navigate])
=======
      if (isMounted) {
        toast({
          title: 'Erro ao carregar aluno',
          description: lastError instanceof Error ? lastError.message : 'Não encontrado',
          variant: 'destructive',
        })
        navigate('/alunos')
        setLoading(false)
      }
    }

    fetchStudentDataWithRetry()

    return () => {
      isMounted = false
    }
  }, [id, navigate])
=======
          setName(st.name)
          setBirthdate(st.birthdate ? st.birthdate.split('T')[0] : '')
          setPhone(st.phone ? maskPhone(st.phone) : '')
          if (st.photo) {
            setPhotoPreview(pb.files.getURL(st as any, st.photo))
          } else {
            setPhotoPreview(null)
          }
          setRemovePhoto(false)
          setGeneralObservations(st.general_observations || '')
          setRestrictions(st.restrictions || '')

          // Fotos da anamnese
          setExistingAnamnesisPhotos(st.anamnesis_photos || [])

          // Dados estruturados da nova anamnese ou mapeamento/preservação dos dados legados
          const anData = st.anamnesis_data || {}
          setTreinouPersonalAntes(anData.treinou_personal_antes || '')
          setProfissao(anData.profissao || '')

          // Se já tem objetivos estruturados usa eles; se não, mapeia dos goals legados
          if (anData.objetivos && anData.objetivos.length > 0) {
            setObjetivosSelecionados(anData.objetivos)
          } else if (st.goals && st.goals.length > 0) {
            setObjetivosSelecionados(st.goals as string[])
          }

          setEnfaseMusculatura(anData.enfase_musculatura || '')
          setPraticouExercicio(anData.praticou_exercicio || '')
          setPraticouExercicioQuais(anData.praticou_exercicio_quais || '')
          setTempoSemPraticar(anData.tempo_sem_praticar || '')
          setRestricaoExercicio(anData.restricao_exercicio || (st.restrictions ? 'SIM' : ''))
          setRestricaoExercicioQuais(anData.restricao_exercicio_quais || '')

          setDoencasSelecionadas(anData.possui_doenca || [])
          setDoencasOutros(anData.possui_doenca_outros || '')

          // Lesão: se não estiver na anData, usa o campo legacy injuries
          setPossuiLesao(anData.possui_lesao || st.injuries || '')

          setDoresCorpo(anData.dores_corpo || '')
          setDoresCorpoQuais(anData.dores_corpo_quais || '')
          setFazDieta(anData.faz_dieta || '')
          setFazNutricionista(anData.faz_nutricionista || '')
          setUsoSubstancias(anData.uso_substancias || [])

          // Campos legados preservados
          setLegacyHealthHistory(st.health_history || '')
          setLegacySurgeries(st.surgeries || '')
          setLegacyTeacherObs(st.teacher_observations || '')

          setAllStudentSheets(sheets)
          setStudentHistory(history)
          const map: Record<string, Exercise> = {}
          exList.forEach((e) => {
            map[e.id] = e
          })
          setExercisesMap(map)

          if (
            st.restrictions ||
            st.anamnesis_data ||
            st.injuries ||
            st.health_history ||
            (st.anamnesis_photos && st.anamnesis_photos.length > 0)
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
=======
  useEffect(() => {
    let isMounted = true

    const fetchStudentDataWithRetry = async () => {
      if (!id) return
      setLoading(true)

      const maxRetries = 3
      let attempt = 0
      let lastError: unknown = null

      while (attempt < maxRetries && isMounted) {
        attempt++
        try {
          const [st, history, sheets, exList] = await Promise.all([
            studentsService.getById(id),
            workoutProgressService.getAll(id, 50),
            trainingSheetsService.getHistoryByStudent(id),
            exercisesService.getAll(),
          ])

          if (!isMounted) return

          setName(st.name)
          setBirthdate(st.birthdate ? st.birthdate.split('T')[0] : '')
          setPhone(st.phone ? maskPhone(st.phone) : '')
          if (st.photo) {
            setPhotoPreview(pb.files.getURL(st as any, st.photo))
          } else {
            setPhotoPreview(null)
          }
          setRemovePhoto(false)
          setGeneralObservations(st.general_observations || '')
          setRestrictions(st.restrictions || '')

          // Fotos da anamnese
          setExistingAnamnesisPhotos(st.anamnesis_photos || [])

          // Dados estruturados da nova anamnese ou mapeamento/preservação dos dados legados
          const anData = st.anamnesis_data || {}
          setTreinouPersonalAntes(anData.treinou_personal_antes || '')
          setProfissao(anData.profissao || '')

          // Se já tem objetivos estruturados usa eles; se não, mapeia dos goals legados
          if (anData.objetivos && anData.objetivos.length > 0) {
            setObjetivosSelecionados(anData.objetivos)
          } else if (st.goals && st.goals.length > 0) {
            setObjetivosSelecionados(st.goals as string[])
          }

          setEnfaseMusculatura(anData.enfase_musculatura || '')
          setPraticouExercicio(anData.praticou_exercicio || '')
          setPraticouExercicioQuais(anData.praticou_exercicio_quais || '')
          setTempoSemPraticar(anData.tempo_sem_praticar || '')
          setRestricaoExercicio(anData.restricao_exercicio || (st.restrictions ? 'SIM' : ''))
          setRestricaoExercicioQuais(anData.restricao_exercicio_quais || '')

          setDoencasSelecionadas(anData.possui_doenca || [])
          setDoencasOutros(anData.possui_doenca_outros || '')

          // Lesão: se não estiver na anData, usa o campo legacy injuries
          setPossuiLesao(anData.possui_lesao || st.injuries || '')

          setDoresCorpo(anData.dores_corpo || '')
          setDoresCorpoQuais(anData.dores_corpo_quais || '')
          setFazDieta(anData.faz_dieta || '')
          setFazNutricionista(anData.faz_nutricionista || '')
          setUsoSubstancias(anData.uso_substancias || [])

          // Campos legados preservados
          setLegacyHealthHistory(st.health_history || '')
          setLegacySurgeries(st.surgeries || '')
          setLegacyTeacherObs(st.teacher_observations || '')

          setAllStudentSheets(sheets)
          setStudentHistory(history)
          const map: Record<string, Exercise> = {}
          exList.forEach((e) => {
            map[e.id] = e
          })
          setExercisesMap(map)

          if (
            st.restrictions ||
            st.anamnesis_data ||
            st.injuries ||
            st.health_history ||
            (st.anamnesis_photos && st.anamnesis_photos.length > 0)
          ) {
            setAnamneseOpen(true)
          }

          setLoading(false)
          return
        } catch (err: unknown) {
          lastError = err
          const errMsg = err instanceof Error ? err.message : String(err)
          const is429 = errMsg.includes('429') || errMsg.toLowerCase().includes('too many requests')
          if (is429 && attempt < maxRetries) {
            await new Promise((res) => setTimeout(res, 600 * attempt))
            continue
          }
          break
        }
      }

      if (isMounted) {
        toast({
          title: 'Erro ao carregar aluno',
          description: lastError instanceof Error ? lastError.message : 'Não encontrado',
          variant: 'destructive',
        })
        navigate('/alunos')
        setLoading(false)
      }
    }

    fetchStudentDataWithRetry()

    return () => {
      isMounted = false
    }
  }, [id, navigate])
=======
          lastError = err
          const errMsg = err instanceof Error ? err.message : String(err)
          const is429 = errMsg.includes('429') || errMsg.toLowerCase().includes('too many requests')
          if (is429 && attempt < maxRetries) {
            await new Promise((res) => setTimeout(res, 600 * attempt))
            continue
          }
          break
        }
      }

      if (isMounted) {
        toast({
          title: 'Erro ao carregar aluno',
          description: lastError instanceof Error ? lastError.message : 'Não encontrado',
          variant: 'destructive',
        })
        navigate('/alunos')
        setLoading(false)
      }
    }

    fetchStudentDataWithRetry()

    return () => {
      isMounted = false
    }
  }, [id, navigate])
=======
      if (isMounted) {
        toast({
          title: 'Erro ao carregar aluno',
          description: lastError instanceof Error ? lastError.message : 'Não encontrado',
          variant: 'destructive',
        })
        navigate('/alunos')
        setLoading(false)
      }
    }

    fetchStudentDataWithRetry()

    return () => {
      isMounted = false
    }
  }, [id, navigate])
=======
          setName(st.name)
          setBirthdate(st.birthdate ? st.birthdate.split('T')[0] : '')
          setPhone(st.phone ? maskPhone(st.phone) : '')
          if (st.photo) {
            setPhotoPreview(pb.files.getURL(st as any, st.photo))
          } else {
            setPhotoPreview(null)
          }
          setRemovePhoto(false)
          setGeneralObservations(st.general_observations || '')
          setRestrictions(st.restrictions || '')

          // Fotos da anamnese
          setExistingAnamnesisPhotos(st.anamnesis_photos || [])

          // Dados estruturados da nova anamnese ou mapeamento/preservação dos dados legados
          const anData = st.anamnesis_data || {}
          setTreinouPersonalAntes(anData.treinou_personal_antes || '')
          setProfissao(anData.profissao || '')

          // Se já tem objetivos estruturados usa eles; se não, mapeia dos goals legados
          if (anData.objetivos && anData.objetivos.length > 0) {
            setObjetivosSelecionados(anData.objetivos)
          } else if (st.goals && st.goals.length > 0) {
            setObjetivosSelecionados(st.goals as string[])
          }

          setEnfaseMusculatura(anData.enfase_musculatura || '')
          setPraticouExercicio(anData.praticou_exercicio || '')
          setPraticouExercicioQuais(anData.praticou_exercicio_quais || '')
          setTempoSemPraticar(anData.tempo_sem_praticar || '')
          setRestricaoExercicio(anData.restricao_exercicio || (st.restrictions ? 'SIM' : ''))
          setRestricaoExercicioQuais(anData.restricao_exercicio_quais || '')

          setDoencasSelecionadas(anData.possui_doenca || [])
          setDoencasOutros(anData.possui_doenca_outros || '')

          // Lesão: se não estiver na anData, usa o campo legacy injuries
          setPossuiLesao(anData.possui_lesao || st.injuries || '')

          setDoresCorpo(anData.dores_corpo || '')
          setDoresCorpoQuais(anData.dores_corpo_quais || '')
          setFazDieta(anData.faz_dieta || '')
          setFazNutricionista(anData.faz_nutricionista || '')
          setUsoSubstancias(anData.uso_substancias || [])

          // Campos legados preservados
          setLegacyHealthHistory(st.health_history || '')
          setLegacySurgeries(st.surgeries || '')
          setLegacyTeacherObs(st.teacher_observations || '')

          setAllStudentSheets(sheets)
          setStudentHistory(history)
          const map: Record<string, Exercise> = {}
          exList.forEach((e) => {
            map[e.id] = e
          })
          setExercisesMap(map)

          if (
            st.restrictions ||
            st.anamnesis_data ||
            st.injuries ||
            st.health_history ||
            (st.anamnesis_photos && st.anamnesis_photos.length > 0)
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
=======
          lastError = err
          const errMsg = err instanceof Error ? err.message : String(err)
          const is429 = errMsg.includes('429') || errMsg.toLowerCase().includes('too many requests')
          if (is429 && attempt < maxRetries) {
            await new Promise((res) => setTimeout(res, 600 * attempt))
            continue
          }
          break
        }
      }

      if (isMounted) {
        toast({
          title: 'Erro ao carregar aluno',
          description: lastError instanceof Error ? lastError.message : 'Não encontrado',
          variant: 'destructive',
        })
        navigate('/alunos')
        setLoading(false)
      }
    }

    fetchStudentDataWithRetry()

    return () => {
      isMounted = false
    }
  }, [id, navigate])
=======
          setName(st.name)
          setBirthdate(st.birthdate ? st.birthdate.split('T')[0] : '')
          setPhone(st.phone ? maskPhone(st.phone) : '')
          if (st.photo) {
            setPhotoPreview(pb.files.getURL(st as any, st.photo))
          } else {
            setPhotoPreview(null)
          }
          setRemovePhoto(false)
          setGeneralObservations(st.general_observations || '')
          setRestrictions(st.restrictions || '')

          // Fotos da anamnese
          setExistingAnamnesisPhotos(st.anamnesis_photos || [])

          // Dados estruturados da nova anamnese ou mapeamento/preservação dos dados legados
          const anData = st.anamnesis_data || {}
          setTreinouPersonalAntes(anData.treinou_personal_antes || '')
          setProfissao(anData.profissao || '')

          // Se já tem objetivos estruturados usa eles; se não, mapeia dos goals legados
          if (anData.objetivos && anData.objetivos.length > 0) {
            setObjetivosSelecionados(anData.objetivos)
          } else if (st.goals && st.goals.length > 0) {
            setObjetivosSelecionados(st.goals as string[])
          }

          setEnfaseMusculatura(anData.enfase_musculatura || '')
          setPraticouExercicio(anData.praticou_exercicio || '')
          setPraticouExercicioQuais(anData.praticou_exercicio_quais || '')
          setTempoSemPraticar(anData.tempo_sem_praticar || '')
          setRestricaoExercicio(anData.restricao_exercicio || (st.restrictions ? 'SIM' : ''))
          setRestricaoExercicioQuais(anData.restricao_exercicio_quais || '')

          setDoencasSelecionadas(anData.possui_doenca || [])
          setDoencasOutros(anData.possui_doenca_outros || '')

          // Lesão: se não estiver na anData, usa o campo legacy injuries
          setPossuiLesao(anData.possui_lesao || st.injuries || '')

          setDoresCorpo(anData.dores_corpo || '')
          setDoresCorpoQuais(anData.dores_corpo_quais || '')
          setFazDieta(anData.faz_dieta || '')
          setFazNutricionista(anData.faz_nutricionista || '')
          setUsoSubstancias(anData.uso_substancias || [])

          // Campos legados preservados
          setLegacyHealthHistory(st.health_history || '')
          setLegacySurgeries(st.surgeries || '')
          setLegacyTeacherObs(st.teacher_observations || '')

          setAllStudentSheets(sheets)
          setStudentHistory(history)
          const map: Record<string, Exercise> = {}
          exList.forEach((e) => {
            map[e.id] = e
          })
          setExercisesMap(map)

          if (
            st.restrictions ||
            st.anamnesis_data ||
            st.injuries ||
            st.health_history ||
            (st.anamnesis_photos && st.anamnesis_photos.length > 0)
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
=======
          lastError = err
          const errMsg = err instanceof Error ? err.message : String(err)
          const is429 = errMsg.includes('429') || errMsg.toLowerCase().includes('too many requests')
          if (is429 && attempt < maxRetries) {
            await new Promise((res) => setTimeout(res, 600 * attempt))
            continue
          }
          break
        }
      }

      if (isMounted) {
        toast({
          title: 'Erro ao carregar aluno',
          description: lastError instanceof Error ? lastError.message : 'Não encontrado',
          variant: 'destructive',
        })
        navigate('/alunos')
        setLoading(false)
      }
    }

    fetchStudentDataWithRetry()

    return () => {
      isMounted = false
    }
  }, [id, navigate])
=======
      if (isMounted) {
        toast({
          title: 'Erro ao carregar aluno',
          description: lastError instanceof Error ? lastError.message : 'Não encontrado',
          variant: 'destructive',
        })
        navigate('/alunos')
        setLoading(false)
      }
    }

    fetchStudentDataWithRetry()

    return () => {
      isMounted = false
    }
  }, [id, navigate])
=======
          setName(st.name)
          setBirthdate(st.birthdate ? st.birthdate.split('T')[0] : '')
          setPhone(st.phone ? maskPhone(st.phone) : '')
          if (st.photo) {
            setPhotoPreview(pb.files.getURL(st as any, st.photo))
          } else {
            setPhotoPreview(null)
          }
          setRemovePhoto(false)
          setGeneralObservations(st.general_observations || '')
          setRestrictions(st.restrictions || '')

          // Fotos da anamnese
          setExistingAnamnesisPhotos(st.anamnesis_photos || [])

          // Dados estruturados da nova anamnese ou mapeamento/preservação dos dados legados
          const anData = st.anamnesis_data || {}
          setTreinouPersonalAntes(anData.treinou_personal_antes || '')
          setProfissao(anData.profissao || '')

          // Se já tem objetivos estruturados usa eles; se não, mapeia dos goals legados
          if (anData.objetivos && anData.objetivos.length > 0) {
            setObjetivosSelecionados(anData.objetivos)
          } else if (st.goals && st.goals.length > 0) {
            setObjetivosSelecionados(st.goals as string[])
          }

          setEnfaseMusculatura(anData.enfase_musculatura || '')
          setPraticouExercicio(anData.praticou_exercicio || '')
          setPraticouExercicioQuais(anData.praticou_exercicio_quais || '')
          setTempoSemPraticar(anData.tempo_sem_praticar || '')
          setRestricaoExercicio(anData.restricao_exercicio || (st.restrictions ? 'SIM' : ''))
          setRestricaoExercicioQuais(anData.restricao_exercicio_quais || '')

          setDoencasSelecionadas(anData.possui_doenca || [])
          setDoencasOutros(anData.possui_doenca_outros || '')

          // Lesão: se não estiver na anData, usa o campo legacy injuries
          setPossuiLesao(anData.possui_lesao || st.injuries || '')

          setDoresCorpo(anData.dores_corpo || '')
          setDoresCorpoQuais(anData.dores_corpo_quais || '')
          setFazDieta(anData.faz_dieta || '')
          setFazNutricionista(anData.faz_nutricionista || '')
          setUsoSubstancias(anData.uso_substancias || [])

          // Campos legados preservados
          setLegacyHealthHistory(st.health_history || '')
          setLegacySurgeries(st.surgeries || '')
          setLegacyTeacherObs(st.teacher_observations || '')

          setAllStudentSheets(sheets)
          setStudentHistory(history)
          const map: Record<string, Exercise> = {}
          exList.forEach((e) => {
            map[e.id] = e
          })
          setExercisesMap(map)

          if (
            st.restrictions ||
            st.anamnesis_data ||
            st.injuries ||
            st.health_history ||
            (st.anamnesis_photos && st.anamnesis_photos.length > 0)
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

  const toggleObjetivo = (item: string) => {
    setObjetivosSelecionados((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    )
  }

  const toggleDoenca = (item: string) => {
    setDoencasSelecionadas((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    )
  }

  const toggleUsoSubstancia = (item: string) => {
    setUsoSubstancias((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    )
  }

  const handleAnamnesisPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validFiles: File[] = []
    const allowed = ['image/jpeg', 'image/png', 'image/webp']

    for (const f of files) {
      if (!allowed.includes(f.type)) {
        toast({
          title: 'Formato inválido',
          description: `O arquivo ${f.name} não é JPG, PNG ou WebP.`,
          variant: 'destructive',
        })
        continue
      }
      if (f.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: `A foto ${f.name} excede o limite de 5MB.`,
          variant: 'destructive',
        })
        continue
      }
      validFiles.push(f)
    }

    setNewPhotoFiles((prev) => [...prev, ...validFiles])
    e.target.value = ''
  }

  const handleRemoveExistingPhoto = async (filename: string) => {
    if (!id) {
      setExistingAnamnesisPhotos((prev) => prev.filter((f) => f !== filename))
      return
    }
    try {
      await studentsService.removeAnamnesisPhoto(id, filename, existingAnamnesisPhotos)
      setExistingAnamnesisPhotos((prev) => prev.filter((f) => f !== filename))
      toast({
        title: 'Foto removida',
        description: 'A foto foi excluída da anamnese do aluno.',
      })
    } catch {
      toast({
        title: 'Erro ao remover foto',
        description: 'Não foi possível excluir a imagem.',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveNewPhoto = (index: number) => {
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePhoneChange = (val: string) => {
    const masked = maskPhone(val)
    setPhone(masked)
    if (phoneError) {
      if (validatePhone(masked, false)) {
        setPhoneError(null)
      }
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'A foto deve ser uma imagem JPG, PNG, WebP ou GIF.',
        variant: 'destructive',
      })
      e.target.value = ''
      return
    }

    const maxBytes = 5 * 1024 * 1024 // 5MB
    if (file.size > maxBytes) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      })
      e.target.value = ''
      return
    }

    setPhotoFile(file)
    setRemovePhoto(false)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setRemovePhoto(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneError(null)

    const sanitizedName = sanitizeText(name)
    if (!sanitizedName) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome completo do aluno.',
        variant: 'destructive',
      })
      return
    }

    if (phone.trim() && !validatePhone(phone, false)) {
      setPhoneError('Telefone inválido. Utilize o formato (00) 00000-0000.')
      toast({
        title: 'Telefone inválido',
        description: 'Verifique o número informado.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const anamnesisDataObj: AnamnesisData = {
        treinou_personal_antes: sanitizeText(treinouPersonalAntes),
        profissao: sanitizeText(profissao),
        objetivos: objetivosSelecionados,
        enfase_musculatura: sanitizeText(enfaseMusculatura),
        praticou_exercicio: praticouExercicio,
        praticou_exercicio_quais: sanitizeText(praticouExercicioQuais),
        tempo_sem_praticar: sanitizeText(tempoSemPraticar),
        restricao_exercicio: restricaoExercicio,
        restricao_exercicio_quais: sanitizeText(restricaoExercicioQuais),
        possui_doenca: doencasSelecionadas,
        possui_doenca_outros: sanitizeText(doencasOutros),
        possui_lesao: sanitizeText(possuiLesao),
        dores_corpo: doresCorpo,
        dores_corpo_quais: sanitizeText(doresCorpoQuais),
        faz_dieta: fazDieta,
        faz_nutricionista: fazNutricionista,
        uso_substancias: usoSubstancias,
      }

      const payload = {
        name: sanitizedName,
        birthdate: birthdate ? new Date(birthdate).toISOString() : undefined,
        phone: phone.trim() ? sanitizeText(phone.trim()) : undefined,
        general_observations: sanitizeText(generalObservations) || undefined,
        restrictions: sanitizeText(restrictions) || undefined,
        anamnesis_data: anamnesisDataObj,
        // Mantém campos legados mapeados / preservados
        injuries: sanitizeText(possuiLesao) || legacyHealthHistory,
        health_history: legacyHealthHistory || undefined,
        surgeries: legacySurgeries || undefined,
        teacher_observations: legacyTeacherObs || undefined,
      }

      let savedId = id
      if (isEditing && id) {
        await studentsService.update(id, payload, {
          photoFile,
          removePhoto,
        })
        if (newPhotoFiles.length > 0) {
          await studentsService.uploadAnamnesisPhotos(id, newPhotoFiles)
        }
        toast({
          title: 'Aluno salvo com sucesso',
          description: 'Cadastro e anamnese atualizados.',
        })
      } else {
        const created = await studentsService.create(payload, {
          photoFile,
        })
        savedId = created.id
        if (newPhotoFiles.length > 0 && created.id) {
          await studentsService.uploadAnamnesisPhotos(created.id, newPhotoFiles)
        }
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

      {/* ABAS DO CADASTRO DO ALUNO: Dados / Anamnese vs Avaliação Física */}
      <div className="flex items-center gap-2 border-b border-[#252B3E] pb-2">
        <button
          type="button"
          onClick={() => setActiveMainTab('cadastro')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeMainTab === 'cadastro'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'bg-[#181C2E] text-[#9CA5B8] hover:text-white border border-[#252B3E]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Dados & Anamnese</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('avaliacao')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeMainTab === 'avaliacao'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'bg-[#181C2E] text-[#9CA5B8] hover:text-white border border-[#252B3E]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Avaliação Física</span>
          <span className="text-[10px] bg-secondary/30 text-secondary border border-secondary/40 font-black px-1.5 py-0.2 rounded uppercase">
            Novo
          </span>
        </button>
      </div>

      {/* SEÇÃO DA ABA DE AVALIAÇÃO FÍSICA */}
      {activeMainTab === 'avaliacao' &&
        (isEditing && id ? (
          <PhysicalAssessmentTab studentId={id} studentName={name} studentBirthdate={birthdate} />
        ) : (
          <div className="bg-[#181C2E] border border-[#252B3E] rounded-2xl p-8 text-center space-y-3">
            <Activity className="w-12 h-12 text-primary/40 mx-auto" />
            <h3 className="text-base font-bold text-white">Salve o aluno primeiro</h3>
            <p className="text-xs text-[#9CA5B8] max-w-sm mx-auto">
              Preencha o nome do aluno na aba "Dados & Anamnese" e clique em "Salvar Aluno" para
              habilitar o registro de avaliações físicas e bioimpedância.
            </p>
            <Button
              type="button"
              onClick={() => setActiveMainTab('cadastro')}
              className="bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs"
            >
              Voltar para Dados do Aluno
            </Button>
          </div>
        ))}

      {/* SEÇÃO DA ABA DE DADOS & ANAMNESE */}
      {activeMainTab === 'cadastro' && (
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

            {/* Foto do Aluno */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-2">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#2A2A2A] to-[#3A3A3A] border-2 border-primary/40 flex items-center justify-center overflow-hidden shadow-inner">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={name || 'Aluno'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-primary font-black text-2xl flex items-center justify-center">
                      {name ? (
                        name
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((n) => n[0].toUpperCase())
                          .join('')
                      ) : (
                        <User className="w-10 h-10 text-primary/60" />
                      )}
                    </div>
                  )}
                </div>

                <label
                  htmlFor="student-photo-upload"
                  className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-primary text-primary-foreground shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                  title="Adicionar ou trocar foto do aluno"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    id="student-photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </label>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-sm font-semibold text-white">Foto do Aluno</span>
                  <span className="text-[11px] text-[#8A8F98]">(opcional, máx 5MB)</span>
                </div>
                <p className="text-xs text-[#9CA5B8]">
                  Aparece no cabeçalho dos treinos e na lista de alunos para identificação visual
                  imediata.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <label
                    htmlFor="student-photo-upload"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#252B3E] hover:bg-[#30374E] text-white border border-[#3A4363] cursor-pointer transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-primary" />
                    {photoPreview ? 'Trocar foto' : 'Selecionar foto'}
                  </label>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg hover:bg-red-950/30 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Remover
                    </button>
                  )}
                </div>
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
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`bg-[#121212] ${
                      phoneError
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : 'border-[#2E2E2E] focus-visible:ring-primary'
                    } text-white placeholder:text-[#8A8F98] h-12 pr-10`}
                  />
                  <Phone className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98] pointer-events-none" />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-400 font-medium mt-1">{phoneError}</p>
                )}
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
                          restrictions,
                          created: '',
                          updated: '',
                        }
                        const res = await shareOrExportSheet({
                          student: st,
                          sheet,
                          exercisesMap,
                          studioName: appearance.studio_name,
                          primaryColor: appearance.primary_color,
                          logoUrl: appearance.logo_url,
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

          {/* Bloco 3: Histórico de Fichas do Aluno (Item 4) */}
          {isEditing && (
            <div className="bg-[#181C2E] border border-[#252B3E] rounded-2xl shadow-xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#252B3E] gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      Fichas Anteriores e Histórico
                      <span className="text-xs bg-primary/30 text-white font-semibold px-2 py-0.5 rounded-full">
                        {allStudentSheets.length} ficha(s)
                      </span>
                    </h3>
                    <p className="text-xs text-[#9CA5B8]">
                      Todas as fichas criadas para este aluno ficam arquivadas aqui para consulta
                    </p>
                  </div>
                </div>

                <Link to={`/fichas/nova?student=${id}`}>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs h-9 px-3 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Criar Nova Ficha
                  </Button>
                </Link>
              </div>

              {allStudentSheets.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#9CA5B8] bg-[#121522] rounded-xl border border-[#252B3E] p-4">
                  Nenhuma ficha montada para este aluno ainda.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allStudentSheets.map((sh, idx) => {
                    const isCurrentActive = idx === 0 && !sh.is_archived
                    const rawDate = sh.start_date || sh.created
                    const dateStr = rawDate
                      ? new Date(rawDate).toLocaleDateString('pt-BR')
                      : 'Data não informada'

                    const totalExercises = Object.values(sh.series_data || {}).reduce(
                      (acc, list) => acc + (list?.length || 0),
                      0,
                    )

                    return (
                      <div
                        key={sh.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                          isCurrentActive
                            ? 'bg-[#1A2138] border-primary/60 shadow-md ring-1 ring-primary/40'
                            : 'bg-[#121522] border-[#252B3E] hover:border-[#384260]'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isCurrentActive
                                  ? 'bg-secondary/20 text-secondary border border-secondary/40'
                                  : 'bg-[#252B3E] text-[#9CA5B8]'
                              }`}
                            >
                              {isCurrentActive ? 'Ficha Atual Ativa' : 'Ficha Anterior / Arquivada'}
                            </span>
                            <span className="text-[11px] text-[#9CA5B8] flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-primary" /> {dateStr}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-sm truncate">
                            {sh.title || `Ficha de Treino - ${name}`}
                          </h4>
                          <p className="text-xs text-[#9CA5B8]">
                            {totalExercises} exercícios no total • Séries{' '}
                            {Object.keys(sh.series_data || {})
                              .filter((k) => (sh.series_data as any)?.[k]?.length > 0)
                              .join(', ') || 'Nenhuma'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-[#252B3E]">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingArchivedSheet(sh)}
                            className="flex-1 border-[#2E2E2E] bg-[#171717] hover:bg-[#252525] text-white text-xs h-8 flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-secondary" /> Visualizar Ficha
                          </Button>

                          <Link to={`/fichas/${sh.id}`} className="shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-primary/40 bg-primary/10 hover:bg-primary/20 text-white text-xs h-8 px-2.5"
                              title="Editar ficha"
                            >
                              Editar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bloco 4: Anamnese (Itens 5 e 6 - Modelo Exato Solicitado) */}
          <div className="bg-[#181C2E] border border-[#252B3E] rounded-2xl shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setAnamneseOpen(!anamneseOpen)}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#20263B] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Anamnese Completa do Aluno
                    <span className="text-xs bg-[#252B3E] text-[#9CA5B8] font-normal px-2 py-0.5 rounded-full">
                      Opcional
                    </span>
                  </h3>
                  <p className="text-xs text-[#9CA5B8]">
                    Histórico médico, fotos de laudos/evolução, restrições e questionário de saúde
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
              <div className="p-6 sm:p-8 pt-0 border-t border-[#252B3E] space-y-6 animate-fade-in">
                {/* CAMPO FIXO: Restrições médicas / Cuidado em aula (permanece intacto) */}
                <div className="space-y-1.5 pt-4">
                  <Label
                    htmlFor="restr"
                    className="text-sm text-amber-300 font-bold flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400" /> Restrições médicas / Cuidado
                    em aula
                  </Label>
                  <Textarea
                    id="restr"
                    rows={2}
                    placeholder="Ex: Não pode correr, joelho sensível, hipertensão controlada..."
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    className="bg-[#121522] border-amber-900/60 text-white placeholder:text-[#8A8F98] resize-none focus-visible:ring-amber-500"
                  />
                </div>

                {/* FOTOS NA ANAMNESE (Item 5) */}
                <div className="space-y-3 p-4 rounded-xl bg-[#121522] border border-[#252B3E]">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <Label className="text-sm text-white font-bold flex items-center gap-2">
                        <Camera className="w-4 h-4 text-primary" /> Fotos na Anamnese
                      </Label>
                      <p className="text-xs text-[#9CA5B8]">
                        Anexe laudos médicos entregues pelo aluno, fotos de postura ou evolução
                        antes/depois (máx 5MB cada)
                      </p>
                    </div>
                    <label
                      htmlFor="anamnesis-photos-input"
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Fotos
                      <input
                        id="anamnesis-photos-input"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAnamnesisPhotoSelect}
                      />
                    </label>
                  </div>

                  {/* Grid de Fotos Existentes e Novas */}
                  {existingAnamnesisPhotos.length === 0 && newPhotoFiles.length === 0 ? (
                    <p className="text-xs text-[#8A8F98] italic py-2">
                      Nenhuma foto anexada à anamnese até o momento.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                      {/* Fotos salvas no servidor */}
                      {existingAnamnesisPhotos.map((photoName) => {
                        const url = id
                          ? studentsService.getAnamnesisPhotoUrl(
                              { id, collectionId: 'students' } as any,
                              photoName,
                            )
                          : ''
                        return (
                          <div
                            key={photoName}
                            className="relative group rounded-xl overflow-hidden border border-[#252B3E] bg-black aspect-square"
                          >
                            <img
                              src={url}
                              alt="Foto da anamnese"
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => setPreviewEnlargedPhoto(url)}
                            />
                            <button
                              type="button"
                              onClick={() => setPreviewEnlargedPhoto(url)}
                              className="absolute top-1 left-1 p-1 rounded-md bg-black/60 text-white hover:bg-black"
                              title="Ampliar foto"
                            >
                              <Maximize2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingPhoto(photoName)}
                              className="absolute top-1 right-1 p-1 rounded-md bg-red-600/80 text-white hover:bg-red-600"
                              title="Remover foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      })}

                      {/* Novas fotos selecionadas para envio */}
                      {newPhotoFiles.map((file, idx) => {
                        const tempUrl = URL.createObjectURL(file)
                        return (
                          <div
                            key={`${file.name}-${idx}`}
                            className="relative group rounded-xl overflow-hidden border-2 border-primary/60 bg-black aspect-square"
                          >
                            <img
                              src={tempUrl}
                              alt={file.name}
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => setPreviewEnlargedPhoto(tempUrl)}
                            />
                            <span className="absolute bottom-1 left-1 right-1 bg-primary text-primary-foreground text-[9px] font-bold text-center rounded py-0.5">
                              Nova
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveNewPhoto(idx)}
                              className="absolute top-1 right-1 p-1 rounded-md bg-red-600/80 text-white hover:bg-red-600"
                              title="Remover"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* MODELO EXATO DE CAMPOS DA ANAMNESE (Item 6) */}
                <div className="space-y-4 pt-2">
                  {/* 1. Já treinou com Personal antes? */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="treinouPersonal"
                      className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold"
                    >
                      Já treinou com Personal antes?
                    </Label>
                    <Input
                      id="treinouPersonal"
                      placeholder="Ex: Sim, durante 6 meses em 2022..."
                      value={treinouPersonalAntes}
                      onChange={(e) => setTreinouPersonalAntes(e.target.value)}
                      className="bg-[#121522] border-[#252B3E] text-white h-11"
                    />
                  </div>

                  {/* 2. Profissão */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="profissao"
                      className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold"
                    >
                      Profissão
                    </Label>
                    <Input
                      id="profissao"
                      placeholder="Ex: Arquiteta, Advogado, Desenvolvedor..."
                      value={profissao}
                      onChange={(e) => setProfissao(e.target.value)}
                      className="bg-[#121522] border-[#252B3E] text-white h-11"
                    />
                  </div>

                  {/* 3. Objetivo */}
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold">
                      Objetivo:
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        'Emagrecimento',
                        'Condicionamento',
                        'Hipertrofia',
                        'Alívio de estresse',
                        'Fortalecimento',
                        'Lazer',
                        'Recomendação médica',
                        'Outros',
                      ].map((item) => {
                        const isSel = objetivosSelecionados.includes(item)
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => toggleObjetivo(item)}
                            className={`p-2.5 rounded-lg text-xs font-semibold border text-left flex items-center gap-2 transition-all ${
                              isSel
                                ? 'bg-primary/20 border-primary text-secondary font-bold shadow-sm'
                                : 'bg-[#121522] border-[#252B3E] text-[#9CA5B8] hover:text-white'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSel
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-[#4A5578]'
                              }`}
                            >
                              {isSel && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </span>
                            <span>( ) {item}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 4. Você deseja dar ênfase em alguma musculatura? Qual? */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="enfase"
                      className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold"
                    >
                      Você deseja dar ênfase em alguma musculatura? Qual?
                    </Label>
                    <Input
                      id="enfase"
                      placeholder="Ex: Glúteos e posteriores de coxa, dorsais..."
                      value={enfaseMusculatura}
                      onChange={(e) => setEnfaseMusculatura(e.target.value)}
                      className="bg-[#121522] border-[#252B3E] text-white h-11"
                    />
                  </div>

                  {/* 5. Já praticou algum exercício físico? ( ) NÃO ( ) SIM. Quais? */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-[#121522] border border-[#252B3E]">
                    <Label className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold">
                      Já praticou algum exercício físico?
                    </Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="praticouExercicio"
                          value="NAO"
                          checked={praticouExercicio === 'NAO'}
                          onChange={() => setPraticouExercicio('NAO')}
                          className="accent-primary"
                        />
                        <span>( ) NÃO</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="praticouExercicio"
                          value="SIM"
                          checked={praticouExercicio === 'SIM'}
                          onChange={() => setPraticouExercicio('SIM')}
                          className="accent-primary"
                        />
                        <span>( ) SIM. Quais?</span>
                      </label>
                    </div>
                    {praticouExercicio === 'SIM' && (
                      <Input
                        placeholder="Quais exercícios já praticou? Ex: Musculação, natação, corrida..."
                        value={praticouExercicioQuais}
                        onChange={(e) => setPraticouExercicioQuais(e.target.value)}
                        className="bg-[#181C2E] border-[#252B3E] text-white h-10 mt-1"
                      />
                    )}
                  </div>

                  {/* 6. Há quanto tempo não pratica um exercício físico? */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="tempoSem"
                      className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold"
                    >
                      Há quanto tempo não pratica um exercício físico?
                    </Label>
                    <Input
                      id="tempoSem"
                      placeholder="Ex: Parado há 1 ano, nunca treinou regularmente..."
                      value={tempoSemPraticar}
                      onChange={(e) => setTempoSemPraticar(e.target.value)}
                      className="bg-[#121522] border-[#252B3E] text-white h-11"
                    />
                  </div>

                  {/* 7. Possui alguma restrição à exercício físico? ( ) NÃO ( ) SIM. Quais? */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-[#121522] border border-[#252B3E]">
                    <Label className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold">
                      Possui alguma restrição à exercício físico?
                    </Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="restricaoExercicio"
                          value="NAO"
                          checked={restricaoExercicio === 'NAO'}
                          onChange={() => setRestricaoExercicio('NAO')}
                          className="accent-primary"
                        />
                        <span>( ) NÃO</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="restricaoExercicio"
                          value="SIM"
                          checked={restricaoExercicio === 'SIM'}
                          onChange={() => setRestricaoExercicio('SIM')}
                          className="accent-primary"
                        />
                        <span>( ) SIM. Quais?</span>
                      </label>
                    </div>
                    {restricaoExercicio === 'SIM' && (
                      <Input
                        placeholder="Quais restrições? Ex: Cargas axiais na coluna, impactos..."
                        value={restricaoExercicioQuais}
                        onChange={(e) => setRestricaoExercicioQuais(e.target.value)}
                        className="bg-[#181C2E] border-[#252B3E] text-white h-10 mt-1"
                      />
                    )}
                  </div>

                  {/* 8. Possui alguma doença? ( ) Diabetes ( ) Hipertensão ( ) Outros */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-[#121522] border border-[#252B3E]">
                    <Label className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold">
                      Possui alguma doença?
                    </Label>
                    <div className="flex items-center gap-4 flex-wrap">
                      {['Diabetes', 'Hipertensão', 'Outros'].map((d) => {
                        const isSel = doencasSelecionadas.includes(d)
                        return (
                          <button
                            type="button"
                            key={d}
                            onClick={() => toggleDoenca(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-all ${
                              isSel
                                ? 'bg-primary/20 border-primary text-secondary font-bold'
                                : 'bg-[#181C2E] border-[#252B3E] text-[#9CA5B8] hover:text-white'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                isSel
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-[#4A5578]'
                              }`}
                            >
                              {isSel && <CheckCircle2 className="w-3 h-3" />}
                            </span>
                            <span>( ) {d}</span>
                          </button>
                        )
                      })}
                    </div>
                    {doencasSelecionadas.includes('Outros') && (
                      <Input
                        placeholder="Especifique outras doenças..."
                        value={doencasOutros}
                        onChange={(e) => setDoencasOutros(e.target.value)}
                        className="bg-[#181C2E] border-[#252B3E] text-white h-10 mt-1"
                      />
                    )}
                  </div>

                  {/* 9. Possui alguma lesão? */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="lesao"
                      className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold"
                    >
                      Possui alguma lesão?
                    </Label>
                    <Input
                      id="lesao"
                      placeholder="Ex: Menisco no joelho direito, tendinopatia patelar..."
                      value={possuiLesao}
                      onChange={(e) => setPossuiLesao(e.target.value)}
                      className="bg-[#121522] border-[#252B3E] text-white h-11"
                    />
                  </div>

                  {/* 10. Dores em alguma parte do corpo? ( ) NÃO ( ) SIM. Quais? */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-[#121522] border border-[#252B3E]">
                    <Label className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold">
                      Dores em alguma parte do corpo?
                    </Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="doresCorpo"
                          value="NAO"
                          checked={doresCorpo === 'NAO'}
                          onChange={() => setDoresCorpo('NAO')}
                          className="accent-primary"
                        />
                        <span>( ) NÃO</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="doresCorpo"
                          value="SIM"
                          checked={doresCorpo === 'SIM'}
                          onChange={() => setDoresCorpo('SIM')}
                          className="accent-primary"
                        />
                        <span>( ) SIM. Quais?</span>
                      </label>
                    </div>
                    {doresCorpo === 'SIM' && (
                      <Input
                        placeholder="Quais partes do corpo? Ex: Lombar ao final do dia, ombro..."
                        value={doresCorpoQuais}
                        onChange={(e) => setDoresCorpoQuais(e.target.value)}
                        className="bg-[#181C2E] border-[#252B3E] text-white h-10 mt-1"
                      />
                    )}
                  </div>

                  {/* 11. Faz dieta? ( ) SIM ( ) NÃO */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-[#121522] border border-[#252B3E]">
                    <Label className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold">
                      Faz dieta?
                    </Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="fazDieta"
                          value="SIM"
                          checked={fazDieta === 'SIM'}
                          onChange={() => setFazDieta('SIM')}
                          className="accent-primary"
                        />
                        <span>( ) SIM</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="fazDieta"
                          value="NAO"
                          checked={fazDieta === 'NAO'}
                          onChange={() => setFazDieta('NAO')}
                          className="accent-primary"
                        />
                        <span>( ) NÃO</span>
                      </label>
                    </div>
                  </div>

                  {/* 12. Faz acompanhamento com nutricionista? ( ) SIM ( ) NÃO */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-[#121522] border border-[#252B3E]">
                    <Label className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold">
                      Faz acompanhamento com nutricionista?
                    </Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="fazNutricionista"
                          value="SIM"
                          checked={fazNutricionista === 'SIM'}
                          onChange={() => setFazNutricionista('SIM')}
                          className="accent-primary"
                        />
                        <span>( ) SIM</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="fazNutricionista"
                          value="NAO"
                          checked={fazNutricionista === 'NAO'}
                          onChange={() => setFazNutricionista('NAO')}
                          className="accent-primary"
                        />
                        <span>( ) NÃO</span>
                      </label>
                    </div>
                  </div>

                  {/* 13. Faz uso de ( ) Álcool ( ) Tabaco */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-[#121522] border border-[#252B3E]">
                    <Label className="text-xs uppercase tracking-wider text-[#9CA5B8] font-bold">
                      Faz uso de
                    </Label>
                    <div className="flex items-center gap-4">
                      {['Álcool', 'Tabaco'].map((sub) => {
                        const isSel = usoSubstancias.includes(sub)
                        return (
                          <button
                            type="button"
                            key={sub}
                            onClick={() => toggleUsoSubstancia(sub)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-all ${
                              isSel
                                ? 'bg-primary/20 border-primary text-secondary font-bold'
                                : 'bg-[#181C2E] border-[#252B3E] text-[#9CA5B8] hover:text-white'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                isSel
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-[#4A5578]'
                              }`}
                            >
                              {isSel && <CheckCircle2 className="w-3 h-3" />}
                            </span>
                            <span>( ) {sub}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
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
      )}

      {/* MODAL DE FOTO AMPLIADA DA ANAMNESE */}
      <Dialog
        open={Boolean(previewEnlargedPhoto)}
        onOpenChange={(open) => !open && setPreviewEnlargedPhoto(null)}
      >
        <DialogContent className="bg-black/95 border-[#252B3E] text-white sm:max-w-3xl p-3 flex flex-col items-center">
          <div className="w-full flex justify-end">
            <button
              type="button"
              onClick={() => setPreviewEnlargedPhoto(null)}
              className="p-1 rounded-lg text-[#9CA5B8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {previewEnlargedPhoto && (
            <img
              src={previewEnlargedPhoto}
              alt="Visualização ampliada"
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONSULTA DE FICHA ANTERIOR ARQUIVADA (Item 4) */}
      <Dialog
        open={Boolean(viewingArchivedSheet)}
        onOpenChange={(open) => !open && setViewingArchivedSheet(null)}
      >
        <DialogContent className="bg-[#181C2E] border-[#252B3E] text-white sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="border-b border-[#252B3E] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-secondary font-bold">
                Consulta de Ficha Arquivada
              </span>
              <span className="bg-[#252B3E] text-[#9CA5B8] text-xs font-bold px-2 py-0.5 rounded-full">
                {viewingArchivedSheet?.start_date || viewingArchivedSheet?.created
                  ? new Date(
                      viewingArchivedSheet.start_date || viewingArchivedSheet.created,
                    ).toLocaleDateString('pt-BR')
                  : 'Histórico'}
              </span>
            </div>
            <DialogTitle className="text-lg font-bold text-white">
              {viewingArchivedSheet?.title || `Ficha de Treino - ${name}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#9CA5B8]">
              {viewingArchivedSheet?.notes || 'Sem observações adicionais.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 overflow-y-auto space-y-4 flex-1 pr-1">
            {SERIES_KEYS.map((k) => {
              const blocks = viewingArchivedSheet?.series_data?.[k] || []
              if (blocks.length === 0) return null

              return (
                <div key={k} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
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
                            <span className="text-secondary font-bold block">
                              {b.sets}x {b.reps || '10-12'}
                            </span>
                            <span className="text-[11px] text-[#9CA5B8]">
                              {b.load ? `Carga: ${b.load}` : 'Carga padrão'}
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
            {viewingArchivedSheet && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const st: Student = {
                      id: id || '',
                      name,
                      phone,
                      birthdate,
                      restrictions,
                      created: '',
                      updated: '',
                    }
                    await shareOrExportSheet({
                      student: st,
                      sheet: viewingArchivedSheet,
                      exercisesMap,
                      studioName: appearance.studio_name,
                      primaryColor: appearance.primary_color,
                      logoUrl: appearance.logo_url,
                    })
                  } catch {
                    toast({
                      title: 'Erro ao gerar PDF',
                      variant: 'destructive',
                    })
                  }
                }}
                className="border-secondary/40 bg-secondary/15 hover:bg-secondary/25 text-white font-bold text-xs h-9 px-3 flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-secondary" /> Exportar PDF Desta Ficha
              </Button>
            )}

            <Button
              type="button"
              onClick={() => setViewingArchivedSheet(null)}
              className="bg-primary hover:opacity-90 text-primary-foreground text-xs h-9 font-semibold"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
