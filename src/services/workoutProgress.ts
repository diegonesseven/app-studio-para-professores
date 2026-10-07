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
      expand: 'student,training_sheet',
      batch: limit,
    })
  },

  async getLatestByStudent(studentId: string): Promise<WorkoutProgress | null> {
    try {
      const records = await pb.collection('workout_progress').getList<WorkoutProgress>(1, 1, {
        filter: `student = "${studentId}"`,
        sort: '-completed_at',
      })
      return records.items.length ? records.items[0] : null
    } catch (_) {
      return null
    }
  },

  async recordCompletion(data: {
    student: string
    training_sheet: string
    series_completed: SeriesKey
    exercises_snapshot?: ExerciseBlock[]
    notes?: string
  }): Promise<WorkoutProgress> {
    const payload = {
      ...data,
      completed_at: new Date().toISOString(),
    }
    return pb.collection('workout_progress').create<WorkoutProgress>(payload)
  },

  async delete(id: string): Promise<boolean> {
    return pb.collection('workout_progress').delete(id)
  },
}
