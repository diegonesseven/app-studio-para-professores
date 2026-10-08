/**
 * Regras e Tabelas de Referência Omron Bioimpedância
 * Imagem 2 do pedido do usuário:
 * 1. IMC (kg/m²)
 * 2. % Gordura Corporal (Homens e Mulheres)
 * 3. % Músculo Esquelético (por sexo e faixas etárias: 18-39, 40-59, 60-80)
 * 4. Gordura Visceral (índice 1-30)
 */

export type ClassificationLevel = 'baixo' | 'normal' | 'alto' | 'muito_alto'

export interface ClassificationResult {
  label: string // Ex: "Normal", "Baixo peso", "Sobrepeso", "Alto"
  level: ClassificationLevel
  statusColor: 'green' | 'yellow' | 'red'
  badgeBg: string
  badgeText: string
  badgeBorder: string
}

export function calculateAge(birthdateStr?: string, referenceDateStr?: string): number | null {
  if (!birthdateStr) return null
  const birth = new Date(birthdateStr)
  if (isNaN(birth.getTime())) return null

  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date()
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

  if (imc < 18.5) {
    return {
      label: 'Baixo peso',
      level: 'baixo',
      statusColor: 'yellow',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30',
    }
  }
  if (imc <= 24.9) {
    return {
      label: 'Normal',
      level: 'normal',
      statusColor: 'green',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
    }
  }
  if (imc <= 29.9) {
    return {
      label: 'Sobrepeso',
      level: 'alto',
      statusColor: 'yellow',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30',
    }
  }
  if (imc <= 34.9) {
    return {
      label: 'Obesidade grau I',
      level: 'muito_alto',
      statusColor: 'red',
      badgeBg: 'bg-rose-500/15',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/30',
    }
  }
  if (imc <= 39.9) {
    return {
      label: 'Obesidade grau II',
      level: 'muito_alto',
      statusColor: 'red',
      badgeBg: 'bg-rose-500/15',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/30',
    }
  }
  return {
    label: 'Obesidade grau III',
    level: 'muito_alto',
    statusColor: 'red',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
  }
}

/**
 * 2. % Gordura Corporal
 * Homens:
 *   Baixo: 5,0 - 9,9% (amarelo)
 *   Normal: 10,0 - 19,9% (verde)
 *   Alto: 20,0 - 24,9% (amarelo)
 *   Muito alto: >= 25,0% (vermelho)
 * Mulheres:
 *   Baixo: 5,0 - 19,9% (amarelo)
 *   Normal: 20,0 - 29,9% (verde)
 *   Alto: 30,0 - 34,9% (amarelo)
 *   Muito alto: >= 35,0% (vermelho)
 */
export function classifyBodyFat(
  fat?: number | null,
  sex: 'M' | 'F' = 'F',
): ClassificationResult | null {
  if (fat === null || fat === undefined || isNaN(fat) || fat <= 0) return null

  if (sex === 'M') {
    if (fat < 10.0) {
      return {
        label: 'Baixo',
        level: 'baixo',
        statusColor: 'yellow',
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-400',
        badgeBorder: 'border-amber-500/30',
      }
    }
    if (fat <= 19.9) {
      return {
        label: 'Normal',
        level: 'normal',
        statusColor: 'green',
        badgeBg: 'bg-emerald-500/15',
        badgeText: 'text-emerald-400',
        badgeBorder: 'border-emerald-500/30',
      }
    }
    if (fat <= 24.9) {
      return {
        label: 'Alto',
        level: 'alto',
        statusColor: 'yellow',
        badgeBg: 'bg-amber-500/15',
        badgeText: 'text-amber-400',
        badgeBorder: 'border-amber-500/30',
      }
    }
    return {
      label: 'Muito alto',
      level: 'muito_alto',
      statusColor: 'red',
      badgeBg: 'bg-rose-500/15',
      badgeText: 'text-rose-400',
      badgeBorder: 'border-rose-500/30',
    }
  }

  // Mulheres
  if (fat < 20.0) {
    return {
      label: 'Baixo',
      level: 'baixo',
      statusColor: 'yellow',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30',
    }
  }
  if (fat <= 29.9) {
    return {
      label: 'Normal',
      level: 'normal',
      statusColor: 'green',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
    }
  }
  if (fat <= 34.9) {
    return {
      label: 'Alto',
      level: 'alto',
      statusColor: 'yellow',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30',
    }
  }
  return {
    label: 'Muito alto',
    level: 'muito_alto',
    statusColor: 'red',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
  }
}

/**
 * 3. % Músculo Esquelético (quanto maior melhor: Alto é VERDE)
 * Homens:
 *   18 - 39: Baixo <33,3% | Normal 33,3 - 39,3% | Alto >=39,4%
 *   40 - 59: Baixo <33,1% | Normal 33,1 - 39,1% | Alto >=39,2%
 *   60 - 80: Baixo <32,9% | Normal 32,9 - 38,9% | Alto >=39,0%
 * Mulheres:
 *   18 - 39: Baixo <24,3% | Normal 24,3 - 30,3% | Alto >=30,4%
 *   40 - 59: Baixo <24,1% | Normal 24,1 - 30,1% | Alto >=30,2%
 *   60 - 80: Baixo <23,9% | Normal 23,9 - 29,9% | Alto >=30,0%
 */
export function classifySkeletalMuscle(
  muscle?: number | null,
  sex: 'M' | 'F' = 'F',
  age?: number | null,
): ClassificationResult | null {
  if (muscle === null || muscle === undefined || isNaN(muscle) || muscle <= 0) return null

  // Faixa etária padrão se não informada: 18-39
  const currentAge = age && age > 0 ? age : 30

  let thresholds = { low: 24.3, high: 30.4 }

  if (sex === 'M') {
    if (currentAge >= 60) {
      thresholds = { low: 32.9, high: 39.0 }
    } else if (currentAge >= 40) {
      thresholds = { low: 33.1, high: 39.2 }
    } else {
      thresholds = { low: 33.3, high: 39.4 }
    }
  } else {
    // Mulheres
    if (currentAge >= 60) {
      thresholds = { low: 23.9, high: 30.0 }
    } else if (currentAge >= 40) {
      thresholds = { low: 24.1, high: 30.2 }
    } else {
      thresholds = { low: 24.3, high: 30.4 }
    }
  }

  if (muscle < thresholds.low) {
    return {
      label: 'Baixo',
      level: 'baixo',
      statusColor: 'yellow',
      badgeBg: 'bg-amber-500/15',
      badgeText: 'text-amber-400',
      badgeBorder: 'border-amber-500/30',
    }
  }
  if (muscle < thresholds.high) {
    return {
      label: 'Normal',
      level: 'normal',
      statusColor: 'green',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
    }
  }
  return {
    label: 'Alto (Excelente)',
    level: 'alto',
    statusColor: 'green', // Para músculos esqueléticos, ter alto é desejável e positivo!
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300 font-bold',
    badgeBorder: 'border-emerald-500/40',
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

  if (visceral <= 9) {
    return {
      label: 'Normal',
      level: 'normal',
      statusColor: 'green',
      badgeBg: 'bg-emerald-500/15',
      badgeText: 'text-emerald-400',
      badgeBorder: 'border-emerald-500/30',
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
    }
  }
  return {
    label: 'Muito alto',
    level: 'muito_alto',
    statusColor: 'red',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
  }
}
