import pb from '@/lib/pocketbase/client'
import type { TrainingSheet, SeriesData } from '@/types'
import { sanitizeText } from '@/lib/validation'

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
    const payload = {
      ...data,
      title: data.title ? sanitizeText(data.title) : undefined,
      notes: data.notes ? sanitizeText(data.notes) : undefined,
    }
    return pb.collection('training_sheets').create<TrainingSheet>(payload)
  },

  async update(
    id: string,
    data: Partial<{
      title?: string
      notes?: string
      series_data?: SeriesData
    }>,
  ): Promise<TrainingSheet> {
    const payload = {
      ...data,
      title: data.title !== undefined ? sanitizeText(data.title) : undefined,
      notes: data.notes !== undefined ? sanitizeText(data.notes) : undefined,
    }
    return pb.collection('training_sheets').update<TrainingSheet>(id, payload)
  },

  async duplicate(
    id: string,
    targetStudentId?: string,
    customTitle?: string,
  ): Promise<TrainingSheet> {
    const original = await this.getById(id)
    const newStudentId = targetStudentId || original.student
    const title =
      customTitle || (original.title ? `${original.title} (cópia)` : 'Ficha de Treino (cópia)')

    // Clona em profundidade as séries para garantir isolamento completo entre alunos
    const clonedSeries = original.series_data
      ? JSON.parse(JSON.stringify(original.series_data))
      : { A: [], B: [], C: [], D: [], E: [] }

    return pb.collection('training_sheets').create<TrainingSheet>({
      student: newStudentId,
      title: title,
      notes: original.notes || '',
      series_data: clonedSeries,
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
