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

export interface Student {
  id: string
  name: string
  cpf?: string
  birthdate?: string
  phone?: string
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
  is_completed?: boolean
  created: string
  updated: string
  expand?: {
    student?: Student
    training_sheet?: TrainingSheet
    teacher?: User
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
