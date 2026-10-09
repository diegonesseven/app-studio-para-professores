import { describe, it, expect } from 'vitest'
import pb from '../lib/pocketbase/client'

describe('Validação do Acervo pós-associação Vimeo', () => {
  it('deve ter exatamente os exercícios criados e deduplicados', async () => {
    const list = await pb.collection('exercises').getFullList({
      sort: 'name',
    })

    // Deve haver 325 exercícios no acervo (137 antigos deduplicados + 180 criados inicialmente + 8 novos dos casos duvidosos)
    expect(list.length).toBe(325)

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
    // 237 vídeos da showcase Vimeo 100% associados
    expect(withVideo.length).toBe(237)

    // Validar decisões específicas dos 12 vídeos
    const exMap = new Map(list.map((e) => [e.name, e]))

    // 1. Sumô existe, com vídeo 1234205223, e "Sumô Halter" foi unificado/removido
    expect(exMap.has('Sumô')).toBe(true)
    expect(exMap.get('Sumô')?.youtube_id).toBe('1234205223')
    expect(exMap.has('Sumô Halter')).toBe(false)

    // 2. Levantamento Terra existe como exercício próprio (não mesclado com Terra Smith)
    expect(exMap.has('Levantamento Terra')).toBe(true)
    expect(exMap.get('Levantamento Terra')?.youtube_id).toBe('1234204657')
    expect(exMap.has('Levantamento Terra Smith')).toBe(true)

    // 3. Extensora Simultanea existe com vídeo 1234204314 (antiga "Extensora")
    expect(exMap.has('Extensora Simultanea')).toBe(true)
    expect(exMap.get('Extensora Simultanea')?.youtube_id).toBe('1234204314')

    // 4. Leg Simultaneo existe com vídeo 1234204621 (antigo "Leg Press 45º")
    expect(exMap.has('Leg Simultaneo')).toBe(true)
    expect(exMap.get('Leg Simultaneo')?.youtube_id).toBe('1234204621')

    // 5. Supino Reto Barra-Halter existe separado com vídeo 1234205243
    expect(exMap.has('Supino Reto Barra-Halter')).toBe(true)
    expect(exMap.get('Supino Reto Barra-Halter')?.youtube_id).toBe('1234205243')
    expect(exMap.has('Supino Reto Conjugado Halter')).toBe(true)

    // 6. Pulley Corda existe separado (Costas) com vídeo 1234204860
    expect(exMap.has('Pulley Corda')).toBe(true)
    expect(exMap.get('Pulley Corda')?.youtube_id).toBe('1234204860')
    expect(exMap.get('Pulley Corda')?.muscle_group).toBe('Costas')
    expect(exMap.has('Pull Down Corda')).toBe(true)

    // 7. Tríceps Testa Simultâneo Halter existe separado com vídeo 1234205419
    expect(exMap.has('Tríceps Testa Simultâneo Halter')).toBe(true)
    expect(exMap.get('Tríceps Testa Simultâneo Halter')?.youtube_id).toBe('1234205419')

    // 8. Panturrilha Smith Unilateral existe separado com vídeo 1234204730
    expect(exMap.has('Panturrilha Smith Unilateral')).toBe(true)
    expect(exMap.get('Panturrilha Smith Unilateral')?.youtube_id).toBe('1234204730')
    expect(exMap.has('Panturrilha Smith')).toBe(true)

    // 9. Panturrilha Sentado Curtinho possui o vídeo de máquina sentada 1234204702
    expect(exMap.has('Panturrilha Sentado Curtinho')).toBe(true)
    expect(exMap.get('Panturrilha Sentado Curtinho')?.youtube_id).toBe('1234204702')

    // 10. Panturrilha Livre Simultâneo existe separado com vídeo 1234204697
    expect(exMap.has('Panturrilha Livre Simultâneo')).toBe(true)
    expect(exMap.get('Panturrilha Livre Simultâneo')?.youtube_id).toBe('1234204697')

    // 11. Abdução em V Caneleira existe separado com vídeo 1234203672
    expect(exMap.has('Abdução em V Caneleira')).toBe(true)
    expect(exMap.get('Abdução em V Caneleira')?.youtube_id).toBe('1234203672')
    expect(exMap.has('Adução em "V" Can.')).toBe(true)

    // 12. Flexão de Quadril 180º Em Pé (Caneleira) existe separado com vídeo 1234204404
    expect(exMap.has('Flexão de Quadril 180º Em Pé (Caneleira)')).toBe(true)
    expect(exMap.get('Flexão de Quadril 180º Em Pé (Caneleira)')?.youtube_id).toBe('1234204404')

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
