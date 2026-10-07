import pb from '@/lib/pocketbase/client'
import type { Exercise, MuscleGroup } from '@/types'

/**
 * Extrai o ID do vídeo do YouTube a partir de múltiplos formatos:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - ou apenas o ID puro (11 caracteres)
 */
export function extractYoutubeId(urlOrId: string): string | null {
  if (!urlOrId) return null
  const trimmed = urlOrId.trim()

  // Se já for um ID de 11 caracteres alfanuméricos com - e _
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }

  // Padrão regex para URLs do YouTube
  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  const match = trimmed.match(regExp)
  return match && match[1] ? match[1] : null
}

export function getYoutubeThumbnail(id: string | null | undefined): string | null {
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

export const exercisesService = {
  async getAll(search?: string, muscleGroup?: string): Promise<Exercise[]> {
    const filters: string[] = []
    if (search && search.trim()) {
      filters.push(`name ~ "${search.trim()}"`)
    }
    if (muscleGroup && muscleGroup !== 'all') {
      filters.push(`muscle_group = "${muscleGroup}"`)
    }

    return pb.collection('exercises').getFullList<Exercise>({
      sort: 'name',
      filter: filters.length ? filters.join(' && ') : undefined,
    })
  },

  async getById(id: string): Promise<Exercise> {
    return pb.collection('exercises').getOne<Exercise>(id)
  },

  async create(data: {
    name: string
    youtube_url?: string
    muscle_group: MuscleGroup
  }): Promise<Exercise> {
    const youtube_id = data.youtube_url
      ? extractYoutubeId(data.youtube_url) || undefined
      : undefined
    const thumbnail_url = youtube_id ? getYoutubeThumbnail(youtube_id) || undefined : undefined

    return pb.collection('exercises').create<Exercise>({
      ...data,
      youtube_id,
      thumbnail_url,
    })
  },

  async update(
    id: string,
    data: Partial<{
      name: string
      youtube_url?: string
      muscle_group: MuscleGroup
    }>,
  ): Promise<Exercise> {
    const youtube_id =
      data.youtube_url !== undefined ? extractYoutubeId(data.youtube_url || '') || '' : undefined
    const thumbnail_url = youtube_id ? getYoutubeThumbnail(youtube_id) : undefined

    const payload: Record<string, unknown> = { ...data }
    if (youtube_id !== undefined) payload.youtube_id = youtube_id
    if (thumbnail_url !== undefined) payload.thumbnail_url = thumbnail_url

    return pb.collection('exercises').update<Exercise>(id, payload)
  },

  async delete(id: string): Promise<boolean> {
    return pb.collection('exercises').delete(id)
  },

  async count(): Promise<number> {
    const res = await pb.collection('exercises').getList(1, 1)
    return res.totalItems
  },
}
