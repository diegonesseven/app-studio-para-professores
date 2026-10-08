/**
 * Regras e Tabelas de Referência Omron Bioimpedância
 * Tabela de referência oficial Omron (Diretrizes de IMC OMS/NIH):
 * 1. IMC (kg/m²)
 * 2. % Gordura Corporal (por sexo e faixas etárias: 20-39, 40-59, 60-79)
 * 3. % Músculo Esquelético (por sexo e faixas etárias: 18-39, 40-59, 60-80)
 * 4. Gordura Visceral (índice 1-30)
 * 5. Relação Cintura-Quadril (níveis saudáveis: Fem <0,85 | Masc <0,90)
 */

export type ClassificationLevel = 'baixo' | 'normal' | 'alto' | 'muito_alto'

export interface ClassificationResult {
  label: string // Ex: "Normal", "Baixo", "Alto", "Muito Alto"
  level: ClassificationLevel
  statusColor: 'green' | 'yellow' | 'red'
  badgeBg: string
  badgeText: string
  badgeBorder: string
  rangeLabel?: string // Ex: "21,0 – 32,9%"
}

export function calculateAge(birthdateStr?: string, referenceDateStr?: string): number | null {
  if (!birthdateStr) return null

  // Suporte a formato PocketBase com espaço ou ISO com T ou apenas YYYY-MM-DD
  const birthClean =
    typeof birthdateStr === 'string' ? birthdateStr.trim().replace(' ', 'T') : birthdateStr
  const birth = new Date(birthClean)
  if (isNaN(birth.getTime())) {
    // Tenta extrair YYYY-MM-DD via regex
    const m = String(birthdateStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!m) return null
    const [_, y, mo, d] = m
    const fallbackDate = new Date(Number(y), Number(mo) - 1, Number(d))
    if (isNaN(fallbackDate.getTime())) return null
    const ref = referenceDateStr ? new Date(referenceDateStr.trim().replace(' ', 'T')) : new Date()
    let age = ref.getFullYear() - fallbackDate.getFullYear()
    const monthDiff = ref.getMonth() - fallbackDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < fallbackDate.getDate())) {
      age--
    }
    return age >= 0 ? age : null
  }

  const refClean = referenceDateStr ? referenceDateStr.trim().replace(' ', 'T') : undefined
  const ref = refClean ? new Date(refClean) : new Date()
  let age = ref.getFullYear() - birth.getFullYear()
  const m = ref.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

export function calculateImc(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null
  // Se a altura foi digitada em cm (ex: 170) ou metros (ex: 1.70)
  const heightM = heightCm > 3 ? heightCm / 100 : heightCm
  if (heightM <= 0) return null
  const imc = weightKg / (heightM * heightM)
  return Math.round(imc * 10) / 10
}

/**
 * 1. IMC (Índice de Massa Corporal)
 * < 18,5: Baixo peso (amarelo)
 * 18,5 - 24,9: Normal (verde)
 * 25,0 - 29,9: Sobrepeso (amarelo)
 * 30,0 - 34,9: Obesidade grau I (vermelho)
 * 35,0 - 39,9: Obesidade grau II (vermelho)
 * >= 40,0: Obesidade grau III (vermelho)
 */
export function classifyImc(imc?: number | null): ClassificationResult | null {
  if (imc === null || imc === undefined || isNaN(imc) || imc <= 0) return null

  // Tabela Omron IMC:
  // Abaixo do peso: <18,5
  // Normal: 18,5 – 24,9 (ou <25)
  // Sobrepeso: 25 – 29,9 (ou 25 - 30)
  // Obesidade: >= 30,0
  if (imc < 18.5) {
    return {
      label: 'Abaixo do peso',
      level: 'baixo',
      statusColor: 'yellow',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30',
      rangeLabel: '< 18,5',
    }
  }
  if (imc < 25.0) {
    return {
      label: 'Normal',
      level: 'normal',
      statusColor: 'green',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
      rangeLabel: '18,5 – 24,9',
    }
  }
  if (imc < 30.0) {
    return {
      label: 'Sobrepeso',
      level: 'alto',
      statusColor: 'yellow',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30',
      rangeLabel: '25,0 – 29,9',
    }
  }
  if (imc < 35.0) {
    return {
      label: 'Obesidade grau I',
      level: 'muito_alto',
      statusColor: 'red',
      badgeBg: 'bg-rose-500/15',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/30',
      rangeLabel: '30,0 – 34,9',
    }
  }
  if (imc < 40.0) {
    return {
      label: 'Obesidade grau II',
      level: 'muito_alto',
      statusColor: 'red',
      badgeBg: 'bg-rose-500/15',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/30',
      rangeLabel: '35,0 – 39,9',
    }
  }
  return {
    label: 'Obesidade grau III',
    level: 'muito_alto',
    statusColor: 'red',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
    rangeLabel: '≥ 40,0',
  }
}

/**
 * 2. % Gordura Corporal (por sexo e faixa etária)
 * NOVA TABELA OMRON:
 * FEMININO:
 *   20-39: BAIXO <21,0 | NORMAL 21,0–32,9 | ALTO 33,0–38,9 (38,09) | MUITO ALTO >=39,0
 *   40-59: BAIXO <23,0 | NORMAL 23,0–33,9 | ALTO 34,0–39,9 | MUITO ALTO >=40,0
 *   60-79: BAIXO <24,0 | NORMAL 24,0–35,9 | ALTO 36,0–41,9 | MUITO ALTO >=42,0
 * MASCULINO:
 *   20-39: BAIXO <8,0  | NORMAL 8,0–19,9  | ALTO 20,0–24,9 | MUITO ALTO >=25,0
 *   40-59: BAIXO <11,0 | NORMAL 11,0–21,9 | ALTO 22,0–27,9 | MUITO ALTO >=28,0
 *   60-79: BAIXO <13,0 | NORMAL 13,0–24,9 | ALTO 25,0–29,9 | MUITO ALTO >=30,0
 */
export interface BodyFatThresholds {
  ageRange: string
  normalMin: number
  altoMin: number
  muitoAltoMin: number
}

export function getBodyFatThresholds(sex: 'M' | 'F' = 'F', age?: number | null): BodyFatThresholds {
  const currentAge = age && age > 0 ? age : 30

  if (sex === 'M') {
    if (currentAge >= 60) {
      return { ageRange: '60–79', normalMin: 13.0, altoMin: 25.0, muitoAltoMin: 30.0 }
    }
    if (currentAge >= 40) {
      return { ageRange: '40–59', normalMin: 11.0, altoMin: 22.0, muitoAltoMin: 28.0 }
    }
    return { ageRange: '20–39', normalMin: 8.0, altoMin: 20.0, muitoAltoMin: 25.0 }
  }

  // Mulheres
  if (currentAge >= 60) {
    return { ageRange: '60–79', normalMin: 24.0, altoMin: 36.0, muitoAltoMin: 42.0 }
  }
  if (currentAge >= 40) {
    return { ageRange: '40–59', normalMin: 23.0, altoMin: 34.0, muitoAltoMin: 40.0 }
  }
  return { ageRange: '20–39', normalMin: 21.0, altoMin: 33.0, muitoAltoMin: 39.0 }
}

export function classifyBodyFat(
  fat?: number | null,
  sex: 'M' | 'F' = 'F',
  age?: number | null,
): ClassificationResult | null {
  if (fat === null || fat === undefined || isNaN(fat) || fat <= 0) return null

  const th = getBodyFatThresholds(sex, age)
  const normalRangeText = `${th.normalMin.toString().replace('.', ',')} – ${(th.altoMin - 0.1).toFixed(1).replace('.', ',')}%`

  if (fat < th.normalMin) {
    return {
      label: 'Baixo',
      level: 'baixo',
      statusColor: 'yellow',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30',
      rangeLabel: `< ${th.normalMin.toString().replace('.', ',')}% (Ref: ${th.ageRange} anos)`,
    }
  }

  if (fat < th.altoMin) {
    return {
      label: 'Normal',
      level: 'normal',
      statusColor: 'green',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
      rangeLabel: `${normalRangeText} (Ref: ${th.ageRange} anos)`,
    }
  }

  if (fat < th.muitoAltoMin) {
    return {
      label: 'Alto',
      level: 'alto',
      statusColor: 'yellow',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30',
      rangeLabel: `${th.altoMin.toString().replace('.', ',')} – ${(th.muitoAltoMin - 0.1).toFixed(1).replace('.', ',')}% (Ref: ${th.ageRange} anos)`,
    }
  }

  return {
    label: 'Muito alto',
    level: 'muito_alto',
    statusColor: 'red',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
    rangeLabel: `≥ ${th.muitoAltoMin.toString().replace('.', ',')}% (Ref: ${th.ageRange} anos)`,
  }
}

/**
 * 3. % Músculo Esquelético (por sexo e faixa etária)
 * NOVA TABELA OMRON:
 * (Para % Músculos, quanto MAIOR melhor: MUITO ALTO é o melhor resultado / verde excelente, ALTO é verde excelente, NORMAL é verde, BAIXO é vermelho/atenção)
 * FEMININO:
 *   18-39: BAIXO <24,3 | NORMAL 24,3–30,3 | ALTO 30,4–35,3 | MUITO ALTO >35,4 (>=35,4)
 *   40-59: BAIXO <24,1 | NORMAL 24,1–30,1 | ALTO 30,2–35,1 | MUITO ALTO >35,2 (>=35,2)
 *   60-80: BAIXO <23,9 | NORMAL 23,9–29,9 | ALTO 30,0–34,9 | MUITO ALTO >35,0 (>=35,0)
 * MASCULINO:
 *   18-39: BAIXO <33,0 (ou <33,3) | NORMAL 33,3–39,3 | ALTO 39,4–44,0 | MUITO ALTO >44,1 (>=44,1)
 *   40-59: BAIXO <33,1            | NORMAL 33,1–39,1 | ALTO 39,2–43,8 | MUITO ALTO >43,9 (>=43,9)
 *   60-80: BAIXO <32,9            | NORMAL 32,9–38,9 | ALTO 39,0–43,6 | MUITO ALTO >43,7 (>=43,7)
 */
export interface MuscleThresholds {
  ageRange: string
  normalMin: number
  altoMin: number
  muitoAltoMin: number
}

export function getMuscleThresholds(sex: 'M' | 'F' = 'F', age?: number | null): MuscleThresholds {
  const currentAge = age && age > 0 ? age : 30

  if (sex === 'M') {
    if (currentAge >= 60) {
      return { ageRange: '60–80', normalMin: 32.9, altoMin: 39.0, muitoAltoMin: 43.7 }
    }
    if (currentAge >= 40) {
      return { ageRange: '40–59', normalMin: 33.1, altoMin: 39.2, muitoAltoMin: 43.9 }
    }
    return { ageRange: '18–39', normalMin: 33.3, altoMin: 39.4, muitoAltoMin: 44.1 }
  }

  // Mulheres
  if (currentAge >= 60) {
    return { ageRange: '60–80', normalMin: 23.9, altoMin: 30.0, muitoAltoMin: 35.0 }
  }
  if (currentAge >= 40) {
    return { ageRange: '40–59', normalMin: 24.1, altoMin: 30.2, muitoAltoMin: 35.2 }
  }
  return { ageRange: '18–39', normalMin: 24.3, altoMin: 30.4, muitoAltoMin: 35.4 }
}

export function classifySkeletalMuscle(
  muscle?: number | null,
  sex: 'M' | 'F' = 'F',
  age?: number | null,
): ClassificationResult | null {
  if (muscle === null || muscle === undefined || isNaN(muscle) || muscle <= 0) return null

  const th = getMuscleThresholds(sex, age)

  if (muscle < th.normalMin) {
    return {
      label: 'Baixo',
      level: 'baixo',
      statusColor: 'red', // Quanto maior melhor, portanto baixo é vermelho
      badgeBg: 'bg-rose-500/15',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/30',
      rangeLabel: `< ${th.normalMin.toString().replace('.', ',')}% (Ref: ${th.ageRange} anos)`,
    }
  }

  if (muscle < th.altoMin) {
    return {
      label: 'Normal',
      level: 'normal',
      statusColor: 'green',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
      rangeLabel: `${th.normalMin.toString().replace('.', ',')} – ${(th.altoMin - 0.1).toFixed(1).replace('.', ',')}% (Ref: ${th.ageRange} anos)`,
    }
  }

  if (muscle < th.muitoAltoMin) {
    return {
      label: 'Alto (Excelente)',
      level: 'alto',
      statusColor: 'green', // Desejável
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-300 font-bold',
      badgeBorder: 'border-emerald-500/40',
      rangeLabel: `${th.altoMin.toString().replace('.', ',')} – ${(th.muitoAltoMin - 0.1).toFixed(1).replace('.', ',')}% (Ref: ${th.ageRange} anos)`,
    }
  }

  return {
    label: 'Muito Alto (Excelente)',
    level: 'muito_alto',
    statusColor: 'green', // Melhor resultado!
    badgeBg: 'bg-emerald-500/25',
    badgeText: 'text-emerald-200 font-black',
    badgeBorder: 'border-emerald-400/50',
    rangeLabel: `≥ ${th.muitoAltoMin.toString().replace('.', ',')}% (Ref: ${th.ageRange} anos)`,
  }
}

/**
 * 4. Gordura Visceral (Índice)
 * 1 - 9: Normal (verde)
 * 10 - 14: Alto (amarelo)
 * 15 - 30: Muito alto (vermelho)
 */
export function classifyVisceralFat(visceral?: number | null): ClassificationResult | null {
  if (visceral === null || visceral === undefined || isNaN(visceral) || visceral <= 0) return null

  // Tabela Omron:
  // NORMAL: <9 (1 a 9)
  // ALTO: 10 a 14
  // MUITO ALTO: >15 (ou >=15)
  if (visceral < 10) {
    return {
      label: 'Normal',
      level: 'normal',
      statusColor: 'green',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
      rangeLabel: '< 9 (1–9)',
    }
  }
  if (visceral <= 14) {
    return {
      label: 'Alto',
      level: 'alto',
      statusColor: 'yellow',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30',
      rangeLabel: '10 a 14',
    }
  }
  return {
    label: 'Muito alto',
    level: 'muito_alto',
    statusColor: 'red',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
    rangeLabel: '> 15',
  }
}

/**
 * 5. Relação Cintura-Quadril (RCQ)
 * Níveis saudáveis:
 * FEMININO: < 0,85 (Saudável) | >= 0,85 (Risco aumentado)
 * MASCULINO: < 0,90 (Saudável) | >= 0,90 (Risco aumentado)
 */
export function calculateWaistHipRatio(
  waistCm?: number | null,
  hipCm?: number | null,
): number | null {
  if (!waistCm || !hipCm || waistCm <= 0 || hipCm <= 0) return null
  const ratio = waistCm / hipCm
  return Math.round(ratio * 100) / 100
}

export function classifyWaistHipRatio(
  ratio?: number | null,
  sex: 'M' | 'F' = 'F',
): ClassificationResult | null {
  if (ratio === null || ratio === undefined || isNaN(ratio) || ratio <= 0) return null

  const threshold = sex === 'M' ? 0.9 : 0.85
  const thresholdStr = sex === 'M' ? '< 0,90' : '< 0,85'

  if (ratio < threshold) {
    return {
      label: 'Saudável',
      level: 'normal',
      statusColor: 'green',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
      rangeLabel: `${thresholdStr} (Nível saudável)`,
    }
  }

  return {
    label: 'Risco Elevado',
    level: 'alto',
    statusColor: 'yellow',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    rangeLabel: `≥ ${threshold.toFixed(2).replace('.', ',')}`,
  }
}
