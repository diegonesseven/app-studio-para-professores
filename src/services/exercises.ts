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
export type ExerciseVideoPlatform = 'youtube' | 'vimeo' | 'none'

export interface ParsedVideoInfo {
  platform: ExerciseVideoPlatform
  id: string | null
  originalUrl: string
  embedUrl: string | null
  thumbnailUrl: string | null
}

/**
 * Extrai o ID do vídeo do YouTube a partir de múltiplos formatos:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - ou apenas o ID puro (11 caracteres alfanuméricos com hífen e sublinhado)
 */
export function extractYoutubeId(urlOrId: string | null | undefined): string | null {
  if (!urlOrId) return null
  const trimmed = urlOrId.trim()
  if (!trimmed) return null

  // Não confundir ID numérico do Vimeo ou links do Vimeo com YouTube
  if (/^https?:\/\/(?:www\.|player\.)?vimeo\.com\b/i.test(trimmed)) {
    return null
  }

  // Padrão regex para URLs do YouTube
  const regExp =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  const match = trimmed.match(regExp)
  if (match && match[1]) {
    return match[1]
  }

  // Se já for um ID puro de 11 caracteres do YouTube (exceto se for só números de Vimeo)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed) && !/^\d{11}$/.test(trimmed)) {
    return trimmed
  }

  return null
}

/**
 * Extrai o ID do vídeo do Vimeo a partir de múltiplos formatos:
 * - https://vimeo.com/123456789
 * - https://www.vimeo.com/123456789
 * - https://player.vimeo.com/video/123456789
 * - https://vimeo.com/channels/staffpicks/123456789
 * - ou apenas o ID numérico puro (geralmente entre 6 e 12 dígitos)
 */
export function extractVimeoId(urlOrId: string | null | undefined): string | null {
  if (!urlOrId) return null
  const trimmed = urlOrId.trim()
  if (!trimmed) return null

  // Não confundir com YouTube
  if (/youtu\.be|youtube\.com/i.test(trimmed)) {
    return null
  }

  // Se for apenas o ID numérico
  if (/^\d{6,12}$/.test(trimmed)) {
    return trimmed
  }

  // player.vimeo.com/video/{ID}
  const playerMatch = trimmed.match(/player\.vimeo\.com\/video\/(\d+)/i)
  if (playerMatch && playerMatch[1]) {
    return playerMatch[1]
  }

  // vimeo.com/{ID} ou vimeo.com/.../{ID}
  const generalMatch = trimmed.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^/]+\/videos\/|album\/(?:\d+\/)?video\/|video\/|)(\d+)/i,
  )
  if (generalMatch && generalMatch[1]) {
    return generalMatch[1]
  }

  return null
}

/**
 * Detecta a plataforma de vídeo e extrai suas informações
 */
export function parseVideoUrl(urlOrId: string | null | undefined): ParsedVideoInfo {
  const empty: ParsedVideoInfo = {
    platform: 'none',
    id: null,
    originalUrl: '',
    embedUrl: null,
    thumbnailUrl: null,
  }

  if (!urlOrId) return empty
  const trimmed = urlOrId.trim()
  if (!trimmed) return empty

  // 1. Testa Vimeo primeiro se houver 'vimeo' na URL ou se for numérico
  const vimeoId = extractVimeoId(trimmed)
  if (vimeoId) {
    return {
      platform: 'vimeo',
      id: vimeoId,
      originalUrl: trimmed.startsWith('http') ? trimmed : `https://vimeo.com/${vimeoId}`,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=0`,
      thumbnailUrl: null, // Vimeo precisa de requisição oEmbed ou SVG fallback
    }
  }

  // 2. Testa YouTube
  const ytId = extractYoutubeId(trimmed)
  if (ytId) {
    return {
      platform: 'youtube',
      id: ytId,
      originalUrl: trimmed.startsWith('http') ? trimmed : `https://www.youtube.com/watch?v=${ytId}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
    }
  }

  return {
    ...empty,
    originalUrl: trimmed,
  }
}

export function getYoutubeThumbnail(id: string | null | undefined): string | null {
  if (!id) return null
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

export interface VideoDimensions {
  width: number
  height: number
  aspectRatio: number // width / height
  isPortrait: boolean
}

// Cache em memória para dimensões oEmbed de vídeos para evitar chamadas repetidas
const vimeoDimensionsCache = new Map<string, VideoDimensions>()

export async function fetchVimeoDimensions(
  vimeoUrlOrId: string,
  signal?: AbortSignal,
): Promise<VideoDimensions | null> {
  const id = extractVimeoId(vimeoUrlOrId)
  if (!id) return null

  if (vimeoDimensionsCache.has(id)) {
    return vimeoDimensionsCache.get(id)!
  }

  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=https%3A%2F%2Fvimeo.com%2F${id}`
    const res = await fetch(oembedUrl, { signal })
    if (!res.ok) return null
    const data = await res.json()
    if (
      data &&
      typeof data.width === 'number' &&
      typeof data.height === 'number' &&
      data.height > 0
    ) {
      const result: VideoDimensions = {
        width: data.width,
        height: data.height,
        aspectRatio: data.width / data.height,
        isPortrait: data.height > data.width,
      }
      vimeoDimensionsCache.set(id, result)
      return result
    }
  } catch {
    // Falha de rede, timeout ou abort — ignorar silenciosamente
  }

  return null
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
    const rawUrl = data.youtube_url?.trim() || ''
    const parsed = rawUrl ? parseVideoUrl(rawUrl) : null

    // Preservamos o campo youtube_id para YouTube e guardamos o ID do Vimeo se for Vimeo
    const video_id = parsed?.id || undefined
    const thumbnail_url = parsed?.thumbnailUrl || undefined

    return pb.collection('exercises').create<Exercise>({
      ...data,
      youtube_url: rawUrl || undefined,
      youtube_id: video_id,
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
    const payload: Record<string, unknown> = { ...data }

    if (data.youtube_url !== undefined) {
      const rawUrl = data.youtube_url ? data.youtube_url.trim() : ''
      if (rawUrl) {
        const parsed = parseVideoUrl(rawUrl)
        payload.youtube_url = rawUrl
        payload.youtube_id = parsed.id || ''
        payload.thumbnail_url = parsed.thumbnailUrl || ''
      } else {
        payload.youtube_url = ''
        payload.youtube_id = ''
        payload.thumbnail_url = ''
      }
    }

    return pb.collection('exercises').update<Exercise>(id, payload)
  },

  /**
   * Atualização rápida do agrupamento muscular de um exercício
   */
  async updateMuscleGroup(id: string, muscle_group: MuscleGroup): Promise<Exercise> {
    return pb.collection('exercises').update<Exercise>(id, { muscle_group })
  },

  async delete(id: string): Promise<boolean> {
    return pb.collection('exercises').delete(id)
  },

  async count(): Promise<number> {
    const res = await pb.collection('exercises').getList(1, 1)
    return res.totalItems
  },
}
