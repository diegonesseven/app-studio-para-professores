import { describe, it, expect } from 'vitest'
import pb from '../lib/pocketbase/client'

describe('Validação do Acervo pós-associação Vimeo', () => {
  it('deve ter exatamente os exercícios criados e deduplicados', async () => {
    const list = await pb.collection('exercises').getFullList({
      sort: 'name',
    })

    // Deve haver 317 exercícios no acervo (137 originais + 180 novos da vitrine Vimeo)
    expect(list.length).toBe(317)

    // Validar ausência de nomes duplicados (case/accent insensitive)
    const norm = (s: string) =>
      (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')

    const seen = new Set<string>()
    const duplicates: string[] = []

    for (const ex of list) {
      const n = norm(ex.name)
      if (seen.has(n)) {
        duplicates.push(ex.name)
      }
      seen.add(n)
    }

    expect(duplicates).toEqual([])

    // Validar que os exercícios vinculados possuem URLs válidas do Vimeo
    const withVideo = list.filter((e) => Boolean(e.youtube_url))
    expect(withVideo.length).toBe(225) // 45 vinculados existentes + 180 novos

    for (const ex of withVideo) {
      expect(ex.youtube_url).toMatch(/^https:\/\/vimeo\.com\/\d+$/)
      expect(ex.youtube_id).toMatch(/^\d+$/)
    }

    // Validar que todas as fichas de treino continuam íntegras
    const sheets = await pb.collection('training_sheets').getFullList()
    expect(sheets.length).toBeGreaterThan(0)

    const exIdSet = new Set(list.map((e) => e.id))
    for (const sheet of sheets) {
      const sd = sheet.series_data as Record<string, Array<{ exercise_id?: string }>> | null
      if (sd) {
        for (const k of ['A', 'B', 'C', 'D', 'E']) {
          const items = sd[k] || []
          for (const item of items) {
            if (item.exercise_id) {
              expect(exIdSet.has(item.exercise_id)).toBe(true)
            }
          }
        }
      }
    }
  })
})
