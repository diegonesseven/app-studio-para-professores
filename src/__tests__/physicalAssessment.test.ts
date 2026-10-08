import { describe, it, expect } from 'vitest'
import {
  calculateImc,
  calculateAge,
  classifyImc,
  classifyBodyFat,
  classifySkeletalMuscle,
  classifyVisceralFat,
} from '../lib/omronClassification'

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
    it('classifica IMC < 18,5 como Baixo peso (amarelo)', () => {
      const res = classifyImc(18.0)
      expect(res?.label).toBe('Baixo peso')
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

  describe('2. Classificação % Gordura Corporal (Homens e Mulheres)', () => {
    it('Homem: 20% gordura = Alto (amarelo) conforme pedido do usuário', () => {
      const res = classifyBodyFat(20.0, 'M')
      expect(res?.label).toBe('Alto')
      expect(res?.statusColor).toBe('yellow')
    })

    it('Homem: faixas normais (10,0 a 19,9%) e muito alto (>=25%)', () => {
      expect(classifyBodyFat(8.5, 'M')?.label).toBe('Baixo')
      expect(classifyBodyFat(8.5, 'M')?.statusColor).toBe('yellow')

      expect(classifyBodyFat(15.0, 'M')?.label).toBe('Normal')
      expect(classifyBodyFat(15.0, 'M')?.statusColor).toBe('green')

      expect(classifyBodyFat(26.0, 'M')?.label).toBe('Muito alto')
      expect(classifyBodyFat(26.0, 'M')?.statusColor).toBe('red')
    })

    it('Mulher: faixas baixo (<20%), normal (20-29.9%), alto (30-34.9%), muito alto (>=35%)', () => {
      expect(classifyBodyFat(18.0, 'F')?.label).toBe('Baixo')
      expect(classifyBodyFat(25.0, 'F')?.label).toBe('Normal')
      expect(classifyBodyFat(25.0, 'F')?.statusColor).toBe('green')

      expect(classifyBodyFat(32.0, 'F')?.label).toBe('Alto')
      expect(classifyBodyFat(32.0, 'F')?.statusColor).toBe('yellow')

      expect(classifyBodyFat(36.0, 'F')?.label).toBe('Muito alto')
      expect(classifyBodyFat(36.0, 'F')?.statusColor).toBe('red')
    })
  })

  describe('3. Classificação % Músculo Esquelético (sexo e idade)', () => {
    it('Mulher 18-39: 25% músculo = Normal (verde) conforme pedido do usuário', () => {
      // 18-39: Baixo <24,3%, Normal 24,3-30,3%, Alto >=30,4%
      const res = classifySkeletalMuscle(25.0, 'F', 28)
      expect(res?.label).toBe('Normal')
      expect(res?.statusColor).toBe('green')
    })

    it('Mulher 18-39: <24,3% = Baixo (amarelo) e >=30,4% = Alto (verde/excelente)', () => {
      const low = classifySkeletalMuscle(22.0, 'F', 25)
      expect(low?.label).toBe('Baixo')
      expect(low?.statusColor).toBe('yellow')

      const high = classifySkeletalMuscle(32.0, 'F', 25)
      expect(high?.label).toContain('Alto')
      expect(high?.statusColor).toBe('green')
    })

    it('Homens 40-59: Baixo <33,1%, Normal 33,1-39,1%, Alto >=39,2%', () => {
      const normal = classifySkeletalMuscle(35.0, 'M', 45)
      expect(normal?.label).toBe('Normal')
      expect(normal?.statusColor).toBe('green')

      const low = classifySkeletalMuscle(31.0, 'M', 50)
      expect(low?.label).toBe('Baixo')
      expect(low?.statusColor).toBe('yellow')
    })
  })

  describe('4. Classificação Gordura Visceral', () => {
    it('Gordura visceral 12 = Alto (amarelo) conforme pedido do usuário', () => {
      // 1-9 Normal, 10-14 Alto, 15-30 Muito alto
      const res = classifyVisceralFat(12)
      expect(res?.label).toBe('Alto')
      expect(res?.statusColor).toBe('yellow')
    })

    it('Gordura visceral 1-9 = Normal (verde)', () => {
      const res = classifyVisceralFat(5)
      expect(res?.label).toBe('Normal')
      expect(res?.statusColor).toBe('green')
    })

    it('Gordura visceral >= 15 = Muito alto (vermelho)', () => {
      const res = classifyVisceralFat(18)
      expect(res?.label).toBe('Muito alto')
      expect(res?.statusColor).toBe('red')
    })
  })
})
