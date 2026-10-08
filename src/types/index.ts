export type UserRole = 'admin' | 'professor'

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  role?: UserRole
  created: string
  updated: string
}

export type MuscleGroup =
  | 'Peito'
  | 'Costas'
  | 'Pernas'
  | 'Ombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Abdômen'
  | 'Glúteos'
  | 'Cardio'
  | 'Alongamento'
  | 'A classificar'

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdômen',
  'Glúteos',
  'Cardio',
  'Alongamento',
]

/**
 * Grupos musculares alvo para classificação do exercício
 */
export const TARGET_MUSCLE_GROUPS: MuscleGroup[] = [
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdômen',
  'Glúteos',
  'Cardio',
  'Alongamento',
]

export type VideoPlatform = 'youtube' | 'vimeo' | 'none'

export interface Exercise {
  id: string
  name: string
  youtube_url?: string
  youtube_id?: string
  thumbnail_url?: string
  muscle_group: MuscleGroup
  created: string
  updated: string
}

export type ExperienceLevel = 'Iniciante' | 'Intermediário' | 'Avançado'

export const GOAL_OPTIONS = [
  'Reabilitação',
  'Condicionamento',
  'Emagrecimento',
  'Hipertrofia',
  'Outro',
] as const

export type GoalOption = (typeof GOAL_OPTIONS)[number]

export interface AnamnesisData {
  treinou_personal_antes?: string // "Já treinou com Personal antes?"
  profissao?: string // "Profissão"
  objetivos?: string[] // "Objetivo: ( ) Emagrecimento ( ) Condicionamento ..."
  enfase_musculatura?: string // "Você deseja dar ênfase em alguma musculatura? Qual?"
  praticou_exercicio?: 'SIM' | 'NAO' | '' // "Já praticou algum exercício físico?"
  praticou_exercicio_quais?: string // "... Quais?"
  tempo_sem_praticar?: string // "Há quanto tempo não pratica um exercício físico?"
  restricao_exercicio?: 'SIM' | 'NAO' | '' // "Possui alguma restrição à exercício físico?"
  restricao_exercicio_quais?: string // "... Quais?"
  possui_doenca?: string[] // "Possui alguma doença? ( ) Diabetes ( ) Hipertensão ( ) Outros"
  possui_doenca_outros?: string
  possui_lesao?: string // "Possui alguma lesão?"
  dores_corpo?: 'SIM' | 'NAO' | '' // "Dores em alguma parte do corpo?"
  dores_corpo_quais?: string // "... Quais?"
  faz_dieta?: 'SIM' | 'NAO' | '' // "Faz dieta?"
  faz_nutricionista?: 'SIM' | 'NAO' | '' // "Faz acompanhamento com nutricionista?"
  uso_substancias?: string[] // "Faz uso de ( ) Álcool ( ) Tabaco"
}

export interface Student {
  id: string
  name: string
  birthdate?: string
  phone?: string
  photo?: string
  anamnesis_photos?: string[]
  anamnesis_data?: AnamnesisData
  general_observations?: string
  health_history?: string
  injuries?: string
  surgeries?: string
  restrictions?: string
  goals?: GoalOption[]
  experience_level?: ExperienceLevel
  teacher_observations?: string
  criado_por?: string
  created: string
  updated: string
}

export type SeriesKey = 'A' | 'B' | 'C' | 'D' | 'E'

export const SERIES_KEYS: SeriesKey[] = ['A', 'B', 'C', 'D', 'E']

export interface ExerciseBlock {
  exercise_id: string
  exercise?: Exercise // Expandido opcionalmente
  sets: number
  reps: string
  time: string
  load: string
  notes: string
  order: number
}

export type SeriesData = {
  [key in SeriesKey]?: ExerciseBlock[]
}

export interface TrainingSheet {
  id: string
  collectionId: string
  collectionName: string
  student: string
  expand?: {
    student?: Student
  }
  title?: string
  notes?: string
  series_data?: SeriesData
  start_date?: string
  is_archived?: boolean
  created: string
  updated: string
}

export interface WorkoutProgress {
  id: string
  collectionId: string
  collectionName: string
  student: string
  training_sheet: string
  series_completed: SeriesKey
  completed_at: string
  exercises_snapshot?: ExerciseBlock[]
  notes?: string
  teacher?: string
  completed_indices?: number[]
  in_progress_indices?: number[]
  is_completed?: boolean
  created: string
  updated: string
  expand?: {
    student?: Student
    training_sheet?: TrainingSheet
    teacher?: User
  }
}

export interface BilateralMeasure {
  direito?: number | null
  esquerdo?: number | null
}

export interface PhysicalAssessmentData {
  // Dados de Composição Corporal
  peso?: number | null // kg
  imc?: number | null // kg/m² (calculado ou manual)
  gordura?: number | null // %
  musculos?: number | null // %
  mr?: number | null // kcal (metabolismo basal)
  idade_biologica?: number | null // anos
  gordura_visceral?: number | null // índice 1-30

  // Perimetria (cm)
  antebraco?: BilateralMeasure
  biceps?: BilateralMeasure
  torax?: number | null
  ombro?: number | null
  cintura?: number | null
  abdomen?: number | null
  quadril?: number | null
  coxa?: BilateralMeasure
  panturrilha?: BilateralMeasure
}

export interface PhysicalAssessment {
  id: string
  collectionId: string
  collectionName: string
  student: string
  date: string
  sex?: 'M' | 'F'
  data: PhysicalAssessmentData
  created: string
  updated: string
  expand?: {
    student?: Student
  }
}

export interface AppAppearanceSettings {
  id: string
  collectionId: string
  collectionName: string
  key: string
  primary_color: string
  background_color: string
  surface_color: string
  logo_url: string
  logo_file?: string
  studio_name: string
  custom_css?: string
  created: string
  updated: string
}
