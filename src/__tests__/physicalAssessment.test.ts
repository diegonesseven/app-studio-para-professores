import { describe, it, expect } from 'vitest'
import {
  calculateImc,
  calculateAge,
  classifyImc,
  classifyBodyFat,
  classifySkeletalMuscle,
  classifyVisceralFat,
  calculateWaistHipRatio,
  classifyWaistHipRatio,
} from '../lib/omronClassification'
import { calculateEvolution, formatMetricValue } from '../lib/assessmentComparison'

describe('Omron Bioimpedância e Avaliação Física', () => {
  describe('Cálculo de Idade e IMC', () => {
    it('calcula IMC corretamente a partir de peso e altura em cm', () => {
      // 70kg e 175cm -> 70 / (1.75^2) = 22.86 -> 22.9
      const imc = calculateImc(70, 175)
      expect(imc).toBe(22.9)
    })

    it('calcula IMC quando altura é passada em metros', () => {
      const imc = calculateImc(70, 1.75)
      expect(imc).toBe(22.9)
    })

    it('retorna null se peso ou altura inválidos', () => {
      expect(calculateImc(0, 170)).toBeNull()
      expect(calculateImc(70, 0)).toBeNull()
      expect(calculateImc(null, 170)).toBeNull()
    })

    it('calcula idade corretamente', () => {
      const age = calculateAge('1990-05-15', '2025-05-15')
      expect(age).toBe(35)
    })
  })

  describe('1. Classificação IMC Omron', () => {
    it('classifica IMC < 18,5 como Abaixo do peso (amarelo)', () => {
      const res = classifyImc(18.0)
      expect(res?.label).toBe('Abaixo do peso')
      expect(res?.statusColor).toBe('yellow')
    })

    it('classifica IMC 18,5 a 24,9 como Normal (verde)', () => {
      const res = classifyImc(22.5)
      expect(res?.label).toBe('Normal')
      expect(res?.statusColor).toBe('green')
    })

    it('classifica IMC 25,0 a 29,9 como Sobrepeso (amarelo)', () => {
      const res = classifyImc(27.4)
      expect(res?.label).toBe('Sobrepeso')
      expect(res?.statusColor).toBe('yellow')
    })

    it('classifica IMC >= 30,0 como Obesidade (vermelho)', () => {
      const g1 = classifyImc(32.0)
      expect(g1?.label).toBe('Obesidade grau I')
      expect(g1?.statusColor).toBe('red')

      const g2 = classifyImc(37.5)
      expect(g2?.label).toBe('Obesidade grau II')
      expect(g2?.statusColor).toBe('red')

      const g3 = classifyImc(42.0)
      expect(g3?.label).toBe('Obesidade grau III')
      expect(g3?.statusColor).toBe('red')
    })
  })

  describe('2. Classificação % Gordura Corporal (Nova Tabela Omron por Sexo e Faixa Etária)', () => {
    it('Mulher 35 anos: 33% gordura = Alto conforme pedido do usuário', () => {
      const res = classifyBodyFat(33.0, 'F', 35)
      expect(res?.label).toBe('Alto')
      expect(res?.statusColor).toBe('yellow')
    })

    it('Mulher 20-39 anos: faixas <21 baixo, 21-32.9 normal, 33-38.9 alto, >39 muito alto', () => {
      expect(classifyBodyFat(19.5, 'F', 30)?.label).toBe('Baixo')
      expect(classifyBodyFat(25.0, 'F', 30)?.label).toBe('Normal')
      expect(classifyBodyFat(25.0, 'F', 30)?.statusColor).toBe('green')
      expect(classifyBodyFat(35.0, 'F', 30)?.label).toBe('Alto')
      expect(classifyBodyFat(40.0, 'F', 30)?.label).toBe('Muito alto')
      expect(classifyBodyFat(40.0, 'F', 30)?.statusColor).toBe('red')
    })

    it('Homem 20-39 anos: faixas <8 baixo, 8-19.9 normal, 20-24.9 alto, >25 muito alto', () => {
      expect(classifyBodyFat(7.0, 'M', 25)?.label).toBe('Baixo')
      expect(classifyBodyFat(15.0, 'M', 25)?.label).toBe('Normal')
      expect(classifyBodyFat(15.0, 'M', 25)?.statusColor).toBe('green')
      expect(classifyBodyFat(22.0, 'M', 25)?.label).toBe('Alto')
      expect(classifyBodyFat(26.0, 'M', 25)?.label).toBe('Muito alto')
      expect(classifyBodyFat(26.0, 'M', 25)?.statusColor).toBe('red')
    })

    it('Homem 40-59 anos: faixas <11 baixo, 11-21.9 normal, 22-27.9 alto, >28 muito alto', () => {
      expect(classifyBodyFat(10.0, 'M', 50)?.label).toBe('Baixo')
      expect(classifyBodyFat(18.0, 'M', 50)?.label).toBe('Normal')
      expect(classifyBodyFat(24.0, 'M', 50)?.label).toBe('Alto')
      expect(classifyBodyFat(29.0, 'M', 50)?.label).toBe('Muito alto')
    })
  })

  describe('3. Classificação % Músculo Esquelético (Nova Tabela Omron por Sexo e Idade)', () => {
    it('Homem 45 anos: 40% músculo = Alto (Excelente) conforme pedido do usuário', () => {
      // 40-59: Baixo <33,1 | Normal 33,1–39,1 | Alto 39,2–43,8 | Muito Alto >43,9
      const res = classifySkeletalMuscle(40.0, 'M', 45)
      expect(res?.label).toContain('Alto')
      expect(res?.statusColor).toBe('green') // Alto é desejável/verde
    })

    it('Homem 45 anos: >43,9% músculo = Muito Alto (Excelente) verde', () => {
      const res = classifySkeletalMuscle(44.5, 'M', 45)
      expect(res?.label).toContain('Muito Alto')
      expect(res?.statusColor).toBe('green')
    })

    it('Mulher 18-39: Baixo <24,3% (vermelho), Normal 24,3-30,3%, Alto 30,4-35,3%, Muito Alto >35,4%', () => {
      const low = classifySkeletalMuscle(22.0, 'F', 28)
      expect(low?.label).toBe('Baixo')
      expect(low?.statusColor).toBe('red')

      const normal = classifySkeletalMuscle(27.0, 'F', 28)
      expect(normal?.label).toBe('Normal')
      expect(normal?.statusColor).toBe('green')

      const high = classifySkeletalMuscle(32.0, 'F', 28)
      expect(high?.label).toContain('Alto')
      expect(high?.statusColor).toBe('green')

      const veryHigh = classifySkeletalMuscle(36.0, 'F', 28)
      expect(veryHigh?.label).toContain('Muito Alto')
      expect(veryHigh?.statusColor).toBe('green')
    })
  })

  describe('4. Classificação Gordura Visceral', () => {
    it('Gordura visceral 12 = Alto (amarelo) conforme pedido do usuário', () => {
      // <9 Normal, 10 a 14 Alto, >15 Muito alto
      const res = classifyVisceralFat(12)
      expect(res?.label).toBe('Alto')
      expect(res?.statusColor).toBe('yellow')
    })

    it('Gordura visceral < 9 (1 a 9) = Normal (verde)', () => {
      const res = classifyVisceralFat(5)
      expect(res?.label).toBe('Normal')
      expect(res?.statusColor).toBe('green')
    })

    it('Gordura visceral >= 15 = Muito alto (vermelho)', () => {
      const res = classifyVisceralFat(16)
      expect(res?.label).toBe('Muito alto')
      expect(res?.statusColor).toBe('red')
    })
  })

  describe('5. Relação Cintura-Quadril (RCQ)', () => {
    it('calcula RCQ e classifica limites saudáveis (Fem <0,85 | Masc <0,90)', () => {
      // Mulher cintura 70 quadril 100 => 0.70 (Saudável)
      const rcqF = calculateWaistHipRatio(70, 100)
      expect(rcqF).toBe(0.7)
      expect(classifyWaistHipRatio(rcqF, 'F')?.label).toBe('Saudável')
      expect(classifyWaistHipRatio(rcqF, 'F')?.statusColor).toBe('green')

      // Mulher cintura 90 quadril 100 => 0.90 (Risco Elevado)
      const rcqFHigh = calculateWaistHipRatio(90, 100)
      expect(rcqFHigh).toBe(0.9)
      expect(classifyWaistHipRatio(rcqFHigh, 'F')?.label).toBe('Risco Elevado')

      // Homem cintura 85 quadril 100 => 0.85 (Saudável)
      const rcqM = calculateWaistHipRatio(85, 100)
      expect(classifyWaistHipRatio(rcqM, 'M')?.label).toBe('Saudável')

      // Homem cintura 95 quadril 100 => 0.95 (Risco Elevado)
      const rcqMHigh = calculateWaistHipRatio(95, 100)
      expect(classifyWaistHipRatio(rcqMHigh, 'M')?.label).toBe('Risco Elevado')
    })
  })

  describe('5. Comparativo Automático de Avaliação Física', () => {
    it('formata valores métricos com ou sem unidade', () => {
      expect(formatMetricValue(68.5, 'kg')).toBe('68,5 kg')
      expect(formatMetricValue(1420, 'kcal')).toBe('1420 kcal')
      expect(formatMetricValue(null)).toBe('—')
      expect(formatMetricValue(undefined)).toBe('—')
    })

    it('calcula evolução positiva quando o percentual de músculos sobe (desired: higher)', () => {
      // Anterior: 25.0%, Atual: 26.5% -> +1.5% (better)
      const evo = calculateEvolution(26.5, 25.0, 'higher', '%')
      expect(evo).not.toBeNull()
      expect(evo?.diff).toBe(1.5)
      expect(evo?.diffFormatted).toBe('+1,5 %')
      expect(evo?.trend).toBe('better')
      expect(evo?.arrow).toBe('up')
    })

    it('calcula evolução negativa quando o percentual de músculos cai (desired: higher)', () => {
      // Anterior: 28.0%, Atual: 26.0% -> -2.0% (worse)
      const evo = calculateEvolution(26.0, 28.0, 'higher', '%')
      expect(evo).not.toBeNull()
      expect(evo?.diff).toBe(-2)
      expect(evo?.diffFormatted).toBe('-2 %')
      expect(evo?.trend).toBe('worse')
      expect(evo?.arrow).toBe('down')
    })

    it('calcula evolução positiva quando gordura/peso/cintura reduzem (desired: lower)', () => {
      // Anterior: 30.0%, Atual: 27.5% -> -2.5% (better)
      const evoFat = calculateEvolution(27.5, 30.0, 'lower', '%')
      expect(evoFat?.trend).toBe('better')
      expect(evoFat?.arrow).toBe('down')
      expect(evoFat?.diffFormatted).toBe('-2,5 %')

      // Peso: Anterior 72.0kg, Atual 70.0kg -> -2kg (better)
      const evoWeight = calculateEvolution(70.0, 72.0, 'lower', 'kg')
      expect(evoWeight?.trend).toBe('better')
      expect(evoWeight?.arrow).toBe('down')
    })

    it('calcula evolução negativa quando gordura aumenta (desired: lower)', () => {
      // Anterior: 22.0%, Atual: 25.0% -> +3.0% (worse)
      const evo = calculateEvolution(25.0, 22.0, 'lower', '%')
      expect(evo?.trend).toBe('worse')
      expect(evo?.arrow).toBe('up')
      expect(evo?.diffFormatted).toBe('+3 %')
    })

    it('reconhece estabilidade quando a diferença é zero ou menor que 0.05', () => {
      const evo = calculateEvolution(30.0, 30.0, 'higher', '%')
      expect(evo?.diff).toBe(0)
      expect(evo?.trend).toBe('neutral')
      expect(evo?.arrow).toBe('equal')
      expect(evo?.label).toBe('Estável')
    })

    it('retorna null se qualquer um dos valores não estiver preenchido', () => {
      expect(calculateEvolution(null, 30.0, 'lower')).toBeNull()
      expect(calculateEvolution(25.0, null, 'lower')).toBeNull()
      expect(calculateEvolution(undefined, undefined, 'lower')).toBeNull()
    })
  })
})
