import type { SeriesData, SeriesKey } from '@/types'
import { SERIES_KEYS } from '@/types'

/**
 * Retorna as chaves das séries que realmente possuem exercícios cadastrados na ficha.
 * Se nenhuma série tiver exercícios, retorna ['A'] por padrão.
 */
export function getAvailableSeriesKeys(seriesData?: SeriesData | null): SeriesKey[] {
  if (!seriesData) return ['A']

  const active = SERIES_KEYS.filter((key) => {
    const blocks = seriesData[key]
    return Array.isArray(blocks) && blocks.length > 0
  })

  return active.length > 0 ? active : ['A']
}

/**
 * Determina a próxima série respeitando estritamente o ciclo das séries que a ficha realmente possui.
 * Exemplo:
 * - Ficha tem A e B: A -> B, B -> A (ao terminar B, volta para A).
 * - Ficha tem A, B e C: A -> B, B -> C, C -> A.
 * - Ficha só tem A: A -> A.
 * Nunca tenta série que não existe na ficha.
 */
export function getNextSeriesKey(
  currentCompletedSeries: SeriesKey | string | undefined | null,
  availableKeys: SeriesKey[],
): SeriesKey {
  if (!availableKeys || availableKeys.length === 0) {
    return 'A'
  }

  const currentIdx = availableKeys.indexOf(currentCompletedSeries as SeriesKey)

  // Se a série atual concluída for a última ou não for encontrada, volta para a primeira (série A)
  if (currentIdx === -1 || currentIdx >= availableKeys.length - 1) {
    return availableKeys[0]
  }

  return availableKeys[currentIdx + 1]
}
