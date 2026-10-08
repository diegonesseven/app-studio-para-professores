/**
 * Helpers para formatação de medidas, cálculo de evolução e comparação
 * entre a avaliação atual e a avaliação anterior do aluno.
 */

export interface EvolutionIndicator {
  diff: number
  diffFormatted: string
  percentDiff?: number
  // 'better': evolução positiva (verde)
  // 'worse': evolução negativa (vermelho)
  // 'neutral': sem alteração ou indiferente (cinza/amarelo)
  trend: 'better' | 'worse' | 'neutral'
  arrow: 'up' | 'down' | 'equal'
  label: string
}

export type DesiredDirection = 'higher' | 'lower' | 'neutral'

/**
 * Formata um valor numérico para exibição simples (ex: 68.5 -> "68,5", 1420 -> "1420")
 */
export function formatMetricValue(val: number | null | undefined, unit = ''): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '—'
  }
  const formatted = Number.isInteger(val)
    ? String(val)
    : val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  return unit ? `${formatted} ${unit}`.trim() : formatted
}

/**
 * Calcula a evolução entre a avaliação atual e a anterior.
 *
 * @param currentVal Valor numérico da avaliação atual
 * @param previousVal Valor numérico da avaliação anterior
 * @param desired 'higher' se maior for melhor (% músculos), 'lower' se menor for melhor (gordura, peso, etc), ou 'neutral' (perimetria padrão)
 * @param unit Unidade de medida (kg, %, cm, kcal)
 */
export function calculateEvolution(
  currentVal: number | null | undefined,
  previousVal: number | null | undefined,
  desired: DesiredDirection = 'neutral',
  unit = '',
): EvolutionIndicator | null {
  if (
    currentVal === null ||
    currentVal === undefined ||
    isNaN(currentVal) ||
    previousVal === null ||
    previousVal === undefined ||
    isNaN(previousVal)
  ) {
    return null
  }

  const rawDiff = currentVal - previousVal
  // Arredonda para 1 casa decimal para evitar ruídos de ponto flutuante
  const diff = Math.round(rawDiff * 10) / 10

  if (Math.abs(diff) < 0.05) {
    return {
      diff: 0,
      diffFormatted: `0${unit ? ` ${unit}` : ''}`,
      trend: 'neutral',
      arrow: 'equal',
      label: 'Estável',
    }
  }

  const sign = diff > 0 ? '+' : ''
  const formattedVal = Number.isInteger(diff)
    ? `${sign}${diff}`
    : `${sign}${diff.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`

  const diffFormatted = unit ? `${formattedVal} ${unit}` : formattedVal
  const arrow: 'up' | 'down' = diff > 0 ? 'up' : 'down'

  let trend: 'better' | 'worse' | 'neutral' = 'neutral'
  if (desired === 'higher') {
    trend = diff > 0 ? 'better' : 'worse'
  } else if (desired === 'lower') {
    trend = diff < 0 ? 'better' : 'worse'
  } else {
    trend = 'neutral'
  }

  return {
    diff,
    diffFormatted,
    trend,
    arrow,
    label: diff > 0 ? `Subiu ${diffFormatted}` : `Caiu ${diffFormatted}`,
  }
}
