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
      // Prioriza a ficha ativa mais recente (não arquivada)
      const records = await pb.collection('training_sheets').getFullList<TrainingSheet>({
        filter: `student = "${studentId}" && is_archived != true`,
        sort: '-created',
        expand: 'student',
      })
      if (records.length > 0) return records[0]

      // Fallback para qualquer ficha caso não haja distinção
      const fallback = await pb.collection('training_sheets').getFullList<TrainingSheet>({
        filter: `student = "${studentId}"`,
        sort: '-created',
        expand: 'student',
      })
      return fallback[0] || null
    } catch {
      return null
    }
  },

  /**
   * Retorna todo o histórico de fichas de um aluno (ativas e arquivadas), da mais recente para a mais antiga
   */
  async getHistoryByStudent(studentId: string): Promise<TrainingSheet[]> {
    try {
      return await pb.collection('training_sheets').getFullList<TrainingSheet>({
        filter: `student = "${studentId}"`,
        sort: '-created',
        expand: 'student',
      })
    } catch {
      return []
    }
  },

  /**
   * Arquiva todas as fichas ativas anteriores do aluno ao criar uma nova
   */
  async archivePreviousSheets(studentId: string): Promise<void> {
    try {
      const activeSheets = await pb.collection('training_sheets').getFullList<TrainingSheet>({
        filter: `student = "${studentId}" && is_archived != true`,
      })

      for (const s of activeSheets) {
        await pb.collection('training_sheets').update(s.id, { is_archived: true })
      }
    } catch (e) {
      console.warn('Erro ao arquivar fichas anteriores:', e)
    }
  },
  async create(data: {
    student: string
    title?: string
    notes?: string
    series_data: SeriesData
    start_date?: string
    is_archived?: boolean
  }): Promise<TrainingSheet> {
    const payload = {
      ...data,
      title: data.title ? sanitizeText(data.title) : undefined,
      notes: data.notes ? sanitizeText(data.notes) : undefined,
      start_date: data.start_date || new Date().toISOString(),
      is_archived: data.is_archived ?? false,
    }
    return pb.collection('training_sheets').create<TrainingSheet>(payload)
  },

  async update(
    id: string,
    data: {
      title?: string
      notes?: string
      series_data?: SeriesData
      start_date?: string
      is_archived?: boolean
    },
  ): Promise<TrainingSheet> {
    const payload: Record<string, unknown> = {
      ...data,
      title: data.title !== undefined ? sanitizeText(data.title) : undefined,
      notes: data.notes !== undefined ? sanitizeText(data.notes) : undefined,
    }
    if (data.start_date !== undefined) {
      payload.start_date = data.start_date
    }
    if (data.is_archived !== undefined) {
      payload.is_archived = data.is_archived
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
