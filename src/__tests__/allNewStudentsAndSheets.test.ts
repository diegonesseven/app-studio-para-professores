import { describe, it, expect } from 'vitest'
import pb from '../lib/pocketbase/client'

describe('Validação do lote completo de fichas do Studio Bru Oliveira', () => {
  it('garante que Carla Rodrigues, Lucia de Farias e Lorrayne Campanharo continuam íntegras e sem duplicidade', async () => {
    const carlaRes = await pb
      .collection('students')
      .getList(1, 10, { filter: 'name = "CARLA RODRIGUES"' })
    expect(carlaRes.items.length).toBe(1)

    const luciaRes = await pb
      .collection('students')
      .getList(1, 10, { filter: 'name = "LUCIA DE FARIAS"' })
    expect(luciaRes.items.length).toBe(1)

    const lorrayneRes = await pb
      .collection('students')
      .getList(1, 10, { filter: 'name = "LORRAYNE CAMPANHARO"' })
    expect(lorrayneRes.items.length).toBe(1)

    // Carla deve ter exatamente 1 ficha ativa
    const carlaSheets = await pb.collection('training_sheets').getList(1, 10, {
      filter: `student = "${carlaRes.items[0].id}"`,
    })
    expect(carlaSheets.items.length).toBe(1)
  })

  it('verifica que todas as alunas das imagens foram cadastradas e possuem fichas ativas', async () => {
    const sampleNames = [
      'ANDRESSA ZERMAN',
      'PATRICIA ROKFELLER',
      'FRANCISCO GAVA',
      'VITOR BRASILEIRO',
      'TANIA CALLEGARIO',
      'ALVARO FREITAS',
      'HEBERT',
      'DANIELLE SANTOS',
      'CAROLINE HERMOGENES',
      'ISMALIA',
      'BRUNO MARQUES',
      'VANZITA',
      'RODRIGO DA SILVA',
    ]

    for (const name of sampleNames) {
      const stRes = await pb.collection('students').getList(1, 5, { filter: `name = "${name}"` })
      expect(stRes.items.length).toBe(1)
      const sheetRes = await pb
        .collection('training_sheets')
        .getList(1, 5, { filter: `student = "${stRes.items[0].id}"` })
      expect(sheetRes.items.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('verifica deduplicação e integridade do acervo de exercícios', async () => {
    const list = await pb.collection('exercises').getFullList({ sort: 'name' })
    const seen = new Set<string>()
    for (const item of list) {
      const normalized = item.name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      expect(seen.has(normalized)).toBe(false)
      seen.add(normalized)
    }
    expect(list.length).toBeGreaterThanOrEqual(37)
  })
})
