import { describe, it, expect } from 'vitest'
import { getAvailableSeriesKeys, getNextSeriesKey } from '../lib/seriesCycle'
import type { SeriesData } from '../types'

describe('seriesCycle logic', () => {
  it('retorna apenas as séries com exercícios reais', () => {
    const seriesData: SeriesData = {
      A: [{ exercise_id: '1', sets: 3, reps: '10', time: '60s', load: '10', notes: '', order: 1 }],
      B: [{ exercise_id: '2', sets: 3, reps: '10', time: '60s', load: '10', notes: '', order: 1 }],
      C: [],
      D: [],
      E: [],
    }

    expect(getAvailableSeriesKeys(seriesData)).toEqual(['A', 'B'])
  })

  it('retorna fallback [A] se vazio', () => {
    expect(getAvailableSeriesKeys({})).toEqual(['A'])
    expect(getAvailableSeriesKeys(null)).toEqual(['A'])
  })

  it('ao terminar a última série disponível (B em ficha A e B), reinicia o ciclo na série A', () => {
    const available = ['A', 'B'] as const

    expect(getNextSeriesKey('A', [...available])).toBe('B')
    expect(getNextSeriesKey('B', [...available])).toBe('A')
  })

  it('em ficha com A, B e C, percorre A -> B -> C -> A', () => {
    const available = ['A', 'B', 'C'] as const

    expect(getNextSeriesKey('A', [...available])).toBe('B')
    expect(getNextSeriesKey('B', [...available])).toBe('C')
    expect(getNextSeriesKey('C', [...available])).toBe('A')
  })

  it('nunca tenta a série seguinte se ela não existir na ficha', () => {
    const available = ['A', 'B'] as const
    // se o histórico tiver 'C' ou desconhecido, volta para a primeira (A)
    expect(getNextSeriesKey('C', [...available])).toBe('A')
    expect(getNextSeriesKey('D', [...available])).toBe('A')
  })
})
