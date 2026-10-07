import pb from '@/lib/pocketbase/client'
import type { Student } from '@/types'

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
    const payload = {
      ...data,
      criado_por: pb.authStore.record?.id || undefined,
    }
    return pb.collection('students').create<Student>(payload)
  },

  async update(id: string, data: Partial<Student>): Promise<Student> {
    return pb.collection('students').update<Student>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    return pb.collection('students').delete(id)
  },

  async count(): Promise<number> {
    const res = await pb.collection('students').getList(1, 1)
    return res.totalItems
  },
}
