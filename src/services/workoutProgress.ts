import pb from '@/lib/pocketbase/client'
import type { WorkoutProgress, SeriesKey, ExerciseBlock } from '@/types'
import { queuedRequest } from '@/lib/requestQueue'

// Cache leve em memória para sessões recentes por aluno
let latestProgressCache: {
  timestamp: number
  map: Map<string, WorkoutProgress>
} | null = null

const WORKOUT_CACHE_TTL_MS = 30 * 1000 // 30 segundos

export const workoutProgressService = {
  clearCache() {
    latestProgressCache = null
  },

  /**
   * Obtém as sessões mais recentes de todos os alunos em no máximo 1 ou 2 requisições paginadas (batch)
   * ao invés de N requisições (uma por aluno)
   */
  async getLatestMapForStudents(studentIds?: string[]): Promise<Map<string, WorkoutProgress>> {
    const now = Date.now()
    if (latestProgressCache && now - latestProgressCache.timestamp < WORKOUT_CACHE_TTL_MS) {
      if (!studentIds) return latestProgressCache.map
      const subMap = new Map<string, WorkoutProgress>()
      for (const id of studentIds) {
        const item = latestProgressCache.map.get(id)
        if (item) subMap.set(id, item)
      }
      return subMap
    }

    const map = new Map<string, WorkoutProgress>()
    const targetSet = studentIds ? new Set(studentIds) : null

    try {
      // Busca as últimas 200 sessões completadas no estúdio ordenadas por -completed_at
      // Isso tipicamente cobre os treinos recentes da grande maioria dos alunos
      const recentSessions = await pb
        .collection('workout_progress')
        .getList<WorkoutProgress>(1, 200, {
          sort: '-completed_at',
          expand: 'teacher,training_sheet',
        })

      for (const s of recentSessions.items) {
        if (!s.student) continue
        if (targetSet && !targetSet.has(s.student)) continue
        if (!map.has(s.student)) {
          map.set(s.student, s)
        }
      }

      // Se temos alunos do targetSet que não foram encontrados nas últimas 200 sessões
      // mas precisamos saber se eles têm algum histórico antigo, podemos buscar sob demanda
      // apenas para os que faltam (geralmente poucos ou nenhum)
      latestProgressCache = {
        timestamp: now,
        map,
      }
    } catch (e) {
      console.warn('Erro ao carregar mapa recente de workout_progress:', e)
    }

    return map
  },

  async getAll(studentId?: string, limit = 50): Promise<WorkoutProgress[]> {
    const filters: string[] = []
    if (studentId) {
      filters.push(`student = "${studentId}"`)
    }

    return queuedRequest(() =>
      pb.collection('workout_progress').getFullList<WorkoutProgress>({
        filter: filters.length ? filters.join(' && ') : undefined,
        sort: '-completed_at',
        expand: 'student,training_sheet,teacher',
        batch: limit,
      }),
    )
  },

  async countCompletedSessions(studentId: string, sheetId: string): Promise<number> {
    try {
      const res = await queuedRequest(() =>
        pb.collection('workout_progress').getList(1, 1, {
          filter: `student = "${studentId}" && training_sheet = "${sheetId}" && is_completed = true`,
        }),
      )
      return res.totalItems
    } catch {
      return 0
    }
  },

  async getLatestByStudent(studentId: string): Promise<WorkoutProgress | null> {
    if (latestProgressCache && latestProgressCache.map.has(studentId)) {
      return latestProgressCache.map.get(studentId) || null
    }

    try {
      const records = await queuedRequest(() =>
        pb.collection('workout_progress').getList<WorkoutProgress>(1, 1, {
          filter: `student = "${studentId}"`,
          sort: '-completed_at',
          expand: 'teacher,training_sheet',
        }),
      )
      const found = records.items.length ? records.items[0] : null
      if (latestProgressCache && found) {
        latestProgressCache.map.set(studentId, found)
      }
      return found
    } catch {
      return null
    }
  },

  /**
   * Busca o registro em andamento da série para o aluno (ou o mais recente)
   */
  async getActiveSession(
    studentId: string,
    trainingSheetId: string,
    seriesKey: SeriesKey,
  ): Promise<WorkoutProgress | null> {
    try {
      const records = await pb.collection('workout_progress').getList<WorkoutProgress>(1, 1, {
        filter: `student = "${studentId}" && training_sheet = "${trainingSheetId}" && series_completed = "${seriesKey}"`,
        sort: '-updated',
        expand: 'teacher',
      })
      return records.items.length ? records.items[0] : null
    } catch (_) {
      return null
    }
  },

  /**
   * Salva progresso por exercício ou conclusão total da série
   */
  async saveExerciseProgress(data: {
    id?: string
    student: string
    training_sheet: string
    series_completed: SeriesKey
    completed_indices: number[]
    in_progress_indices?: number[]
    is_completed: boolean
    exercises_snapshot?: ExerciseBlock[]
    teacher?: string
    notes?: string
  }): Promise<WorkoutProgress> {
    const payload = {
      student: data.student,
      training_sheet: data.training_sheet,
      series_completed: data.series_completed,
      completed_indices: data.completed_indices,
      in_progress_indices: data.in_progress_indices || [],
      is_completed: data.is_completed,
      exercises_snapshot: data.exercises_snapshot,
      teacher: data.teacher || pb.authStore.record?.id || undefined,
      notes: data.notes ?? '',
      completed_at: new Date().toISOString(),
    }

    this.clearCache()
    if (data.id) {
      return pb.collection('workout_progress').update<WorkoutProgress>(data.id, payload)
    }

    return pb.collection('workout_progress').create<WorkoutProgress>(payload)
  },

  async recordCompletion(data: {
    student: string
    training_sheet: string
    series_completed: SeriesKey
    exercises_snapshot?: ExerciseBlock[]
    teacher?: string
    notes?: string
    completed_indices?: number[]
  }): Promise<WorkoutProgress> {
    const payload = {
      ...data,
      is_completed: true,
      teacher: data.teacher || pb.authStore.record?.id || undefined,
      completed_at: new Date().toISOString(),
    }
    return pb.collection('workout_progress').create<WorkoutProgress>(payload)
  },

  async delete(id: string): Promise<boolean> {
    this.clearCache()
    return pb.collection('workout_progress').delete(id)
  },
}
