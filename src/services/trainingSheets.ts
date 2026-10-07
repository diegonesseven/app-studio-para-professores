import pb from '@/lib/pocketbase/client'
import type { TrainingSheet, SeriesData } from '@/types'

export const trainingSheetsService = {
  async getAll(): Promise<TrainingSheet[]> {
    return pb.collection('training_sheets').getFullList<TrainingSheet>({
      sort: '-updated',
      expand: 'student',
    })
  },

  async getById(id: string): Promise<TrainingSheet> {
    return pb.collection('training_sheets').getOne<TrainingSheet>(id, {
      expand: 'student',
    })
  },

  async getByStudent(studentId: string): Promise<TrainingSheet | null> {
    try {
      const records = await pb.collection('training_sheets').getFullList<TrainingSheet>({
        filter: `student = "${studentId}"`,
        sort: '-updated',
        expand: 'student',
      })
      return records.length ? records[0] : null
    } catch (_) {
      return null
    }
  },

  async create(data: {
    student: string
    title?: string
    notes?: string
    series_data?: SeriesData
  }): Promise<TrainingSheet> {
    return pb.collection('training_sheets').create<TrainingSheet>(data)
  },

  async update(
    id: string,
    data: Partial<{
      title?: string
      notes?: string
      series_data?: SeriesData
    }>,
  ): Promise<TrainingSheet> {
    return pb.collection('training_sheets').update<TrainingSheet>(id, data)
  },

  async duplicate(id: string, targetStudentId?: string): Promise<TrainingSheet> {
    const original = await this.getById(id)
    const newStudentId = targetStudentId || original.student
    const title = original.title ? `${original.title} (cópia)` : 'Ficha de Treino (cópia)'

    return pb.collection('training_sheets').create<TrainingSheet>({
      student: newStudentId,
      title: title,
      notes: original.notes || '',
      series_data: original.series_data || { A: [], B: [], C: [], D: [], E: [] },
    })
  },

  async delete(id: string): Promise<boolean> {
    return pb.collection('training_sheets').delete(id)
  },

  async count(): Promise<number> {
    const res = await pb.collection('training_sheets').getList(1, 1)
    return res.totalItems
  },
}
