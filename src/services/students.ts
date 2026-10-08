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

  async create(data: Partial<Student>, options?: { photoFile?: File | null }): Promise<Student> {
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

    if (options?.photoFile) {
      const formData = new FormData()
      Object.entries(sanitized).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          if (Array.isArray(val)) {
            val.forEach((item) => formData.append(key, String(item)))
          } else {
            formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val))
          }
        }
      })
      formData.append('photo', options.photoFile)
      return pb.collection('students').create<Student>(formData)
    }

    return pb.collection('students').create<Student>(sanitized)
  },

  async update(
    id: string,
    data: Partial<Student>,
    options?: { photoFile?: File | null; removePhoto?: boolean },
  ): Promise<Student> {
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

    if (options?.photoFile || options?.removePhoto) {
      const formData = new FormData()
      Object.entries(sanitized).forEach(([key, val]) => {
        if (key === 'photo') return
        if (val !== undefined && val !== null) {
          if (Array.isArray(val)) {
            val.forEach((item) => formData.append(key, String(item)))
          } else {
            formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val))
          }
        }
      })

      if (options.photoFile) {
        formData.append('photo', options.photoFile)
      } else if (options.removePhoto) {
        formData.append('photo', '')
      }

      return pb.collection('students').update<Student>(id, formData)
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

  getAnamnesisPhotoUrl(student: Student, filename: string): string {
    return pb.files.getUrl(student, filename)
  },

  /**
   * Upload de fotos adicionais na anamnese do aluno
   */
  async uploadAnamnesisPhotos(id: string, files: File[]): Promise<Student> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('anamnesis_photos', file)
    })
    return pb.collection('students').update<Student>(id, formData)
  },

  /**
   * Remove uma foto específica da anamnese do aluno
   */
  async removeAnamnesisPhoto(
    id: string,
    filenameToRemove: string,
    currentPhotos: string[],
  ): Promise<Student> {
    const remaining = currentPhotos.filter((f) => f !== filenameToRemove)
    return pb.collection('students').update<Student>(id, {
      anamnesis_photos: remaining,
    })
  },
}
