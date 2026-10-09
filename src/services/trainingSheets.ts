import pb from '@/lib/pocketbase/client'
import type { TrainingSheet, SeriesData } from '@/types'
import { sanitizeText } from '@/lib/validation'
import { queuedRequest } from '@/lib/requestQueue'

// Cache leve em memória para fichas ativas indexadas por studentId
// (usado para mitigar rajadas de requisições simultâneas)
let activeSheetsCache: {
  timestamp: number
  map: Map<string, TrainingSheet>
  allSheets: TrainingSheet[]
} | null = null

const CACHE_TTL_MS = 60 * 1000 // 1 minuto de cache em memória

export const trainingSheetsService = {
  clearCache() {
    activeSheetsCache = null
  },

  async getAll(options?: { forceRefresh?: boolean }): Promise<TrainingSheet[]> {
    const now = Date.now()
    if (
      !options?.forceRefresh &&
      activeSheetsCache &&
      now - activeSheetsCache.timestamp < CACHE_TTL_MS
    ) {
      return activeSheetsCache.allSheets
    }

    const records = await queuedRequest(() =>
      pb.collection('training_sheets').getFullList<TrainingSheet>({
        sort: '-updated',
        expand: 'student',
      }),
    )

    const map = new Map<string, TrainingSheet>()
    // Itera ordenado por created desc ou updated desc para priorizar mais recentes não-arquivadas
    for (const sh of records) {
      if (!sh.student) continue
      if (!sh.is_archived && !map.has(sh.student)) {
        map.set(sh.student, sh)
      }
    }
    // Fallback: se algum aluno só tiver ficha arquivada
    for (const sh of records) {
      if (!sh.student) continue
      if (!map.has(sh.student)) {
        map.set(sh.student, sh)
      }
    }

    activeSheetsCache = {
      timestamp: now,
      map,
      allSheets: records,
    }

    return records
  },

  /**
   * Retorna um mapa de studentId -> TrainingSheet ativa em UMA única requisição
   */
  async getActiveMapForStudents(studentIds?: string[]): Promise<Map<string, TrainingSheet>> {
    const all = await this.getAll()
    const map = new Map<string, TrainingSheet>()
    const targetSet = studentIds ? new Set(studentIds) : null

    for (const sh of all) {
      if (!sh.student) continue
      if (targetSet && !targetSet.has(sh.student)) continue
      if (!sh.is_archived && !map.has(sh.student)) {
        map.set(sh.student, sh)
      }
    }
    // Fallback para arquivadas se o aluno não tiver ativa
    for (const sh of all) {
      if (!sh.student) continue
      if (targetSet && !targetSet.has(sh.student)) continue
      if (!map.has(sh.student)) {
        map.set(sh.student, sh)
      }
    }

    return map
  },

  async getById(id: string): Promise<TrainingSheet> {
    return queuedRequest(() =>
      pb.collection('training_sheets').getOne<TrainingSheet>(id, {
        expand: 'student',
      }),
    )
  },

  async getByStudent(studentId: string): Promise<TrainingSheet | null> {
    // Se temos no cache recente, usa imediatamente
    if (activeSheetsCache && activeSheetsCache.map.has(studentId)) {
      return activeSheetsCache.map.get(studentId) || null
    }

    try {
      // Prioriza a ficha ativa mais recente (não arquivada)
      const records = await queuedRequest(() =>
        pb.collection('training_sheets').getFullList<TrainingSheet>({
          filter: `student = "${studentId}" && is_archived != true`,
          sort: '-created',
          expand: 'student',
        }),
      )
      if (records.length > 0) return records[0]

      // Fallback para qualquer ficha caso não haja distinção
      const fallback = await queuedRequest(() =>
        pb.collection('training_sheets').getFullList<TrainingSheet>({
          filter: `student = "${studentId}"`,
          sort: '-created',
          expand: 'student',
        }),
      )
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
      return await queuedRequest(() =>
        pb.collection('training_sheets').getFullList<TrainingSheet>({
          filter: `student = "${studentId}"`,
          sort: '-created',
          expand: 'student',
        }),
      )
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
      this.clearCache()
    } catch (e) {
      console.warn('Erro ao arquivar fichas anteriores:', e)
    }
  },
  async create(data: {
    student?: string
    title?: string
    notes?: string
    series_data: SeriesData
    start_date?: string
    is_archived?: boolean
  }): Promise<TrainingSheet> {
    this.clearCache()
    const payload: Record<string, unknown> = {
      ...data,
      title: data.title ? sanitizeText(data.title) : undefined,
      notes: data.notes ? sanitizeText(data.notes) : undefined,
      start_date: data.start_date || new Date().toISOString(),
      is_archived: data.is_archived ?? false,
    }
    if (!data.student) {
      delete payload.student
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
    this.clearCache()
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
    fallbackSheet?: TrainingSheet,
  ): Promise<TrainingSheet> {
    this.clearCache()
    let original: TrainingSheet
    try {
      original = await this.getById(id)
    } catch {
      if (fallbackSheet) {
        original = fallbackSheet
      } else {
        throw new Error('Ficha original não encontrada para cópia')
      }
    }
    const newStudentId = targetStudentId || original.student || ''
    const title =
      customTitle || (original.title ? `${original.title} (cópia)` : 'Ficha de Treino (cópia)')

    // Clona em profundidade as séries para garantir isolamento completo entre alunos
    const clonedSeries = original.series_data
      ? JSON.parse(JSON.stringify(original.series_data))
      : { A: [], B: [], C: [], D: [], E: [] }

    const payload: Record<string, unknown> = {
      title,
      notes: original.notes || '',
      series_data: clonedSeries,
      start_date: new Date().toISOString(),
      is_archived: false,
    }
    if (newStudentId) {
      payload.student = newStudentId
    }

    return pb.collection('training_sheets').create<TrainingSheet>(payload)
  },

  async delete(id: string): Promise<boolean> {
    this.clearCache()
    return pb.collection('training_sheets').delete(id)
  },

  async count(): Promise<number> {
    const res = await queuedRequest(() => pb.collection('training_sheets').getList(1, 1))
    return res.totalItems
  },
}
