import pb from '@/lib/pocketbase/client'
import type { WorkoutProgress, SeriesKey, ExerciseBlock } from '@/types'

export const workoutProgressService = {
  async getAll(studentId?: string, limit = 50): Promise<WorkoutProgress[]> {
    const filters: string[] = []
    if (studentId) {
      filters.push(`student = "${studentId}"`)
    }

    return pb.collection('workout_progress').getFullList<WorkoutProgress>({
      filter: filters.length ? filters.join(' && ') : undefined,
      sort: '-completed_at',
      expand: 'student,training_sheet,teacher',
      batch: limit,
    })
  },

  async getLatestByStudent(studentId: string): Promise<WorkoutProgress | null> {
    try {
      const records = await pb.collection('workout_progress').getList<WorkoutProgress>(1, 1, {
        filter: `student = "${studentId}"`,
        sort: '-completed_at',
        expand: 'teacher,training_sheet',
      })
      return records.items.length ? records.items[0] : null
    } catch (_) {
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
      is_completed: data.is_completed,
      exercises_snapshot: data.exercises_snapshot,
      teacher: data.teacher || pb.authStore.record?.id || undefined,
      notes: data.notes ?? '',
      completed_at: new Date().toISOString(),
    }

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
    return pb.collection('workout_progress').delete(id)
  },
}
