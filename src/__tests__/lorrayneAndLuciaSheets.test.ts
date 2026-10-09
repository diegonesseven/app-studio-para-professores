import { describe, it, expect } from 'vitest'
import { workoutProgressService } from '@/services/workoutProgress'
import { trainingSheetsService } from '@/services/trainingSheets'
import { studentsService } from '@/services/students'
import { exercisesService } from '@/services/exercises'

describe('Cadastro e Fichas de Treino: LORRAYNE CAMPANHARO e LUCIA DE FARIAS', () => {
  describe('Aluna LORRAYNE CAMPANHARO', () => {
    it('deve encontrar a aluna LORRAYNE CAMPANHARO no banco com campos pessoais em branco', async () => {
      const students = await studentsService.getAll()
      const lorrayne = students.find((s) => s.name.toUpperCase().includes('LORRAYNE CAMPANHARO'))
      expect(lorrayne).toBeDefined()
      expect(lorrayne?.name).toBe('LORRAYNE CAMPANHARO')
      expect(lorrayne?.phone || '').toBe('')
      expect(lorrayne?.birthdate || '').toBe('')
      expect(lorrayne?.general_observations || '').toBe('')
    })

    it('deve ter ficha ativa para LORRAYNE CAMPANHARO com start_date 01/09/2026 e séries A, B, C', async () => {
      const students = await studentsService.getAll()
      const lorrayne = students.find((s) => s.name.toUpperCase().includes('LORRAYNE CAMPANHARO'))
      expect(lorrayne).toBeDefined()

      const sheet = await trainingSheetsService.getByStudent(lorrayne!.id)
      expect(sheet).toBeDefined()
      expect(sheet).not.toBeNull()

      expect(sheet?.start_date).toContain('2026-09-01')
      expect(sheet?.notes).toContain('30–40 segundos')

      const seriesData = sheet?.series_data
      expect(seriesData?.A).toHaveLength(6)
      expect(seriesData?.B).toHaveLength(6)
      expect(seriesData?.C).toHaveLength(6)
    })

    it('deve conter as cargas e séries exatas da ficha de LORRAYNE CAMPANHARO', async () => {
      const students = await studentsService.getAll()
      const lorrayne = students.find((s) => s.name.toUpperCase().includes('LORRAYNE CAMPANHARO'))
      const sheet = await trainingSheetsService.getByStudent(lorrayne!.id)
      const seriesData = sheet?.series_data
      const exercises = await exercisesService.getAll()
      const exMap = Object.fromEntries(exercises.map((e) => [e.id, e.name]))

      // SÉRIE A:
      // 1. SUMÔ 2 TEMPOS — P: 20 — S: 4 — R: 10
      // 2. TRÍCEPS FRANCÊS UNILATERAL HALTER — P: 4 — S: 4 — R: 10
      // 3. AGACHAMENTO SMITH ABDUZIDO — P: 12 — S: 4 — R: 10
      // 4. TRÍCEPS POLIA BARRA V — P: 4+2 — S: 4 — R: 10
      // 5. ABDUTORA INCLINADA — P: 8 — S: 4 — R: 10
      // 6. ABDOMINAL SANFONA — P: (em branco) — S: 4 — R: 10-15
      expect(seriesData?.A?.[0].load).toBe('20')
      expect(seriesData?.A?.[0].sets).toBe(4)
      expect(seriesData?.A?.[0].reps).toBe('10')
      expect(seriesData?.A?.[0].time).toBe('30-40s')

      expect(seriesData?.A?.[1].load).toBe('4')
      expect(seriesData?.A?.[1].sets).toBe(4)
      expect(seriesData?.A?.[1].reps).toBe('10')

      expect(seriesData?.A?.[2].load).toBe('12')
      expect(seriesData?.A?.[2].sets).toBe(4)

      expect(seriesData?.A?.[3].load).toBe('4+2')
      expect(seriesData?.A?.[3].sets).toBe(4)

      expect(seriesData?.A?.[4].load).toBe('8')
      expect(seriesData?.A?.[4].sets).toBe(4)

      expect(seriesData?.A?.[5].load).toBe('')
      expect(seriesData?.A?.[5].sets).toBe(4)
      expect(seriesData?.A?.[5].reps).toBe('10-15')

      // SÉRIE B:
      // 1. FLEXORA SIMUL 2 TEMPOS — P: 4 — S: 4 — R: 10
      // 2. REMADA CURVADA POLIA PEG PRONADA BARRA G — P: 6 — S: 4 — R: 10
      // 3. BOM DIA (ANILHA NA MÃO) — P: 15 — S: 4 — R: 10
      // 4. VOADOR DORSAL SIMULTANEO — P: 0+2 — S: 4 — R: 10
      // 5. PANTURRILHA LEG 45° — P: 40 — S: 4 — R: 10
      // 6. ROSCA MARTELO HALTER — P: 4 — S: 4 — R: 10
      expect(seriesData?.B?.[0].load).toBe('4')
      expect(seriesData?.B?.[1].load).toBe('6')
      expect(seriesData?.B?.[2].load).toBe('15')
      expect(seriesData?.B?.[3].load).toBe('0+2')
      expect(seriesData?.B?.[4].load).toBe('40')
      expect(seriesData?.B?.[5].load).toBe('4')

      // SÉRIE C:
      // 1. EXTENSORA 2 TEMPOS — P: (em branco) — S: 3 — R: 10
      // 2. PERDIGUEIRO UNILATERAL — P: (em branco) — S: 3 — R: 10
      // 3. AGACHAMENTO BOLA — P: 9 — S: 3 — R: 10
      // 4. VOADOR — P: 2 — S: 3 — R: 10
      // 5. FLEXÃO DE QUADRIL 180° SENTADO (CANELEIRA) — P: 4 — S: 4 — R: 10
      // 6. ELEVAÇÃO LATERAL SIMULTANEO HALTER — P: 4 — S: 4 — R: 10
      expect(seriesData?.C?.[0].load).toBe('')
      expect(seriesData?.C?.[0].sets).toBe(3)
      expect(seriesData?.C?.[1].load).toBe('')
      expect(seriesData?.C?.[1].sets).toBe(3)
      expect(seriesData?.C?.[2].load).toBe('9')
      expect(seriesData?.C?.[2].sets).toBe(3)
      expect(seriesData?.C?.[3].load).toBe('2')
      expect(seriesData?.C?.[3].sets).toBe(3)
      expect(seriesData?.C?.[4].load).toBe('4')
      expect(seriesData?.C?.[4].sets).toBe(4)
      expect(seriesData?.C?.[5].load).toBe('4')
      expect(seriesData?.C?.[5].sets).toBe(4)

      // Checar que o nome do exercício 1 de A é 'Sumô 2 Tempos'
      const exA1 = exMap[seriesData?.A?.[0].exercise_id || '']
      expect(exA1?.toLowerCase()).toContain('sumô 2 tempos')
    })

    it('deve registrar exatamente 14 sessões concluídas no histórico na sequência A,B,C,A,B,C,A,B,C,A,B,C,A,B', async () => {
      const students = await studentsService.getAll()
      const lorrayne = students.find((s) => s.name.toUpperCase().includes('LORRAYNE CAMPANHARO'))
      const sheet = await trainingSheetsService.getByStudent(lorrayne!.id)

      const count = await workoutProgressService.countCompletedSessions(lorrayne!.id, sheet!.id)
      expect(count).toBe(14)

      const sessions = await workoutProgressService.getAll(lorrayne!.id, 50)
      expect(sessions).toHaveLength(14)

      // As sessões retornadas do getAll são ordenadas decrescentes por completed_at, ou verificar a sequência invertida
      const chronological = [...sessions].sort(
        (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime(),
      )
      const expectedSequence = [
        'A',
        'B',
        'C',
        'A',
        'B',
        'C',
        'A',
        'B',
        'C',
        'A',
        'B',
        'C',
        'A',
        'B',
      ]
      const actualSequence = chronological.map((s) => s.series_completed)
      expect(actualSequence).toEqual(expectedSequence)

      // Cargas sincronizadas no snapshot
      chronological.forEach((s) => {
        expect(s.exercises_snapshot).toBeDefined()
        expect(s.exercises_snapshot?.length).toBe(6)
      })
    })
  })

  describe('Aluna LUCIA DE FARIAS', () => {
    it('deve encontrar a aluna LUCIA DE FARIAS no banco com campos pessoais em branco', async () => {
      const students = await studentsService.getAll()
      const lucia = students.find((s) => s.name.toUpperCase().includes('LUCIA DE FARIAS'))
      expect(lucia).toBeDefined()
      expect(lucia?.name).toBe('LUCIA DE FARIAS')
      expect(lucia?.phone || '').toBe('')
      expect(lucia?.birthdate || '').toBe('')
      expect(lucia?.general_observations || '').toBe('')
    })

    it('deve ter ficha ativa para LUCIA DE FARIAS com start_date 10/08/2026 e séries A, B (apenas 2 séries)', async () => {
      const students = await studentsService.getAll()
      const lucia = students.find((s) => s.name.toUpperCase().includes('LUCIA DE FARIAS'))
      expect(lucia).toBeDefined()

      const sheet = await trainingSheetsService.getByStudent(lucia!.id)
      expect(sheet).toBeDefined()
      expect(sheet).not.toBeNull()

      expect(sheet?.start_date).toContain('2026-08-10')
      expect(sheet?.notes).toContain('30–40 segundos')

      const seriesData = sheet?.series_data
      expect(seriesData?.A).toHaveLength(9)
      expect(seriesData?.B).toHaveLength(9)
      expect(seriesData?.C || []).toHaveLength(0)
    })

    it('deve conter as cargas e séries exatas da ficha de LUCIA DE FARIAS', async () => {
      const students = await studentsService.getAll()
      const lucia = students.find((s) => s.name.toUpperCase().includes('LUCIA DE FARIAS'))
      const sheet = await trainingSheetsService.getByStudent(lucia!.id)
      const seriesData = sheet?.series_data

      // SÉRIE A:
      // 1. AGACH PÉS ANILHA — P: 5 — S: 3 — R: 10
      // 2. AGACHAMENTO POLIA (BRAÇOS ESTENDIDOS) — P: 4 — S: 3 — R: 10
      // 3. FLEXÃO DE QUADRIL 180° SOLO (CANELEIRA) — P: 2 — S: 3 — R: 10
      // 4. ADUÇÃO EM "V" CAN. — P: 2 — S: 3 — R: 10
      // 5. PANTURRILHA 3 FASES — P: (em branco) — S: 3 — R: 8/8/8
      // 6. FLEXÃO DE BRAÇO SMITH — P: (em branco) — S: 3 — R: 10
      // 7. ELEVAÇÃO LATERAL SIMULTANEO HALTER — P: 2 — S: 3 — R: 10
      // 8. ABDOMINAL SUPRA TOTAL — P: (em branco) — S: 3 — R: 10-15
      // 9. ALONGAMENTOS — P: (em branco)
      expect(seriesData?.A?.[0].load).toBe('5')
      expect(seriesData?.A?.[1].load).toBe('4')
      expect(seriesData?.A?.[2].load).toBe('2')
      expect(seriesData?.A?.[3].load).toBe('2')
      expect(seriesData?.A?.[4].load).toBe('')
      expect(seriesData?.A?.[4].reps).toBe('8/8/8')
      expect(seriesData?.A?.[5].load).toBe('')
      expect(seriesData?.A?.[6].load).toBe('2')
      expect(seriesData?.A?.[7].load).toBe('')
      expect(seriesData?.A?.[7].reps).toBe('10-15')
      expect(seriesData?.A?.[8].load).toBe('')

      // SÉRIE B:
      // 1. GLÚTEO 180° POLIA — P: 2 — S: 3 — R: 10
      // 2. SUMÔ — P: 7 — S: 3 — R: 10
      // 3. FLEXORA SIMUL — P: 4 — S: 3 — R: 10
      // 4. ABDUÇÃO VERTICAL CAN. — P: 2 — S: 3 — R: 10
      // 5. REMADA CURVADA POLIA PEG SUPINADA BARRA P — P: 4 — S: 3 — R: 10
      // 6. ROSCA DIRETA HALTER — P: 3 — S: 3 — R: 10
      // 7. ABDOMINAL SANFONA — P: (em branco) — S: 3 — R: 10
      // 8. ABDOMINAL INFRA BOLA PEQUENA — P: (em branco) — S: 3 — R: 10-15
      // 9. ALONGAMENTOS — P: (em branco)
      expect(seriesData?.B?.[0].load).toBe('2')
      expect(seriesData?.B?.[1].load).toBe('7')
      expect(seriesData?.B?.[2].load).toBe('4')
      expect(seriesData?.B?.[3].load).toBe('2')
      expect(seriesData?.B?.[4].load).toBe('4')
      expect(seriesData?.B?.[5].load).toBe('3')
      expect(seriesData?.B?.[6].load).toBe('')
      expect(seriesData?.B?.[7].load).toBe('')
      expect(seriesData?.B?.[7].reps).toBe('10-15')
      expect(seriesData?.B?.[8].load).toBe('')
    })

    it('deve registrar exatamente 12 sessões concluídas no histórico na sequência alternada A,B,A,B...', async () => {
      const students = await studentsService.getAll()
      const lucia = students.find((s) => s.name.toUpperCase().includes('LUCIA DE FARIAS'))
      const sheet = await trainingSheetsService.getByStudent(lucia!.id)

      const count = await workoutProgressService.countCompletedSessions(lucia!.id, sheet!.id)
      expect(count).toBe(12)

      const sessions = await workoutProgressService.getAll(lucia!.id, 50)
      expect(sessions).toHaveLength(12)

      const chronological = [...sessions].sort(
        (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime(),
      )
      const expectedSequence = ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B']
      const actualSequence = chronological.map((s) => s.series_completed)
      expect(actualSequence).toEqual(expectedSequence)

      chronological.forEach((s) => {
        expect(s.exercises_snapshot).toBeDefined()
        expect(s.exercises_snapshot?.length).toBe(9)
      })
    })
  })
})
