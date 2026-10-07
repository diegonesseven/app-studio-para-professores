import pb from '@/lib/pocketbase/client'
import type { Student } from '@/types'
import { sanitizeText } from '@/lib/validation'

export const studentsService = {
  async getAll(search?: string, sort = 'name'): Promise<Student[]> {
    const filters: string[] = []
    if (search && search.trim()) {
      filters.push(`name ~ "${search.trim()}"`)
    }

    const records = await pb.collection('students').getFullList<Student>({
      sort: sort,
      filter: filters.length ? filters.join(' && ') : undefined,
    })
    return records
  },

  async getRecent(limit = 5): Promise<Student[]> {
    const records = await pb.collection('students').getList<Student>(1, limit, {
      sort: '-updated',
    })
    return records.items
  },

  async getById(id: string): Promise<Student> {
    return pb.collection('students').getOne<Student>(id)
  },

  async create(data: Partial<Student>): Promise<Student> {
    const sanitized: Record<string, unknown> = {
      ...data,
      criado_por: pb.authStore.record?.id || undefined,
    }
    if (typeof data.name === 'string') sanitized.name = sanitizeText(data.name)
    if (typeof data.phone === 'string') sanitized.phone = sanitizeText(data.phone)
    if (typeof data.general_observations === 'string') {
      sanitized.general_observations = sanitizeText(data.general_observations)
    }
    if (typeof data.health_history === 'string') {
      sanitized.health_history = sanitizeText(data.health_history)
    }
    if (typeof data.injuries === 'string') sanitized.injuries = sanitizeText(data.injuries)
    if (typeof data.surgeries === 'string') sanitized.surgeries = sanitizeText(data.surgeries)
    if (typeof data.restrictions === 'string') {
      sanitized.restrictions = sanitizeText(data.restrictions)
    }
    if (typeof data.teacher_observations === 'string') {
      sanitized.teacher_observations = sanitizeText(data.teacher_observations)
    }

    return pb.collection('students').create<Student>(sanitized)
  },

  async update(id: string, data: Partial<Student>): Promise<Student> {
    const sanitized: Record<string, unknown> = { ...data }
    if (typeof data.name === 'string') sanitized.name = sanitizeText(data.name)
    if (typeof data.phone === 'string') sanitized.phone = sanitizeText(data.phone)
    if (typeof data.general_observations === 'string') {
      sanitized.general_observations = sanitizeText(data.general_observations)
    }
    if (typeof data.health_history === 'string') {
      sanitized.health_history = sanitizeText(data.health_history)
    }
    if (typeof data.injuries === 'string') sanitized.injuries = sanitizeText(data.injuries)
    if (typeof data.surgeries === 'string') sanitized.surgeries = sanitizeText(data.surgeries)
    if (typeof data.restrictions === 'string') {
      sanitized.restrictions = sanitizeText(data.restrictions)
    }
    if (typeof data.teacher_observations === 'string') {
      sanitized.teacher_observations = sanitizeText(data.teacher_observations)
    }

    return pb.collection('students').update<Student>(id, sanitized)
  },

  async delete(id: string): Promise<boolean> {
    return pb.collection('students').delete(id)
  },

  async count(): Promise<number> {
    const res = await pb.collection('students').getList(1, 1)
    return res.totalItems
  },
}
