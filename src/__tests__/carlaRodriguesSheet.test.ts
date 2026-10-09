import { describe, it, expect } from 'vitest'
import pb from '@/lib/pocketbase/client'
import { workoutProgressService } from '@/services/workoutProgress'
import { trainingSheetsService } from '@/services/trainingSheets'
import { studentsService } from '@/services/students'

describe('Cadastro e Ficha de Treino da aluna CARLA RODRIGUES', () => {
  it('deve encontrar a aluna CARLA RODRIGUES no banco', async () => {
    const students = await studentsService.getAll()
    const carla = students.find((s) => s.name.toUpperCase().includes('CARLA RODRIGUES'))
    expect(carla).toBeDefined()
    expect(carla?.name).toBe('CARLA RODRIGUES')
  })

  it('deve ter ficha ativa para CARLA RODRIGUES com data de início 27/07/2026 e séries A, B, C', async () => {
    const students = await studentsService.getAll()
    const carla = students.find((s) => s.name.toUpperCase().includes('CARLA RODRIGUES'))
    expect(carla).toBeDefined()

    const sheet = await trainingSheetsService.getByStudent(carla!.id)
    expect(sheet).toBeDefined()
    expect(sheet).not.toBeNull()

    // Data de início: 27/07/2026
    expect(sheet?.start_date).toContain('2026-07-27')

    // Observações com intervalo 30-40s
    expect(sheet?.notes).toContain('30–40 segundos')

    // Séries A, B, C cada uma com 8 exercícios
    const seriesData = sheet?.series_data
    expect(seriesData?.A).toHaveLength(8)
    expect(seriesData?.B).toHaveLength(8)
    expect(seriesData?.C).toHaveLength(8)

    // Série A item 1: Rest Pause 6 máx
    expect(seriesData?.A?.[0].reps).toBe('Rest Pause 6 máx')
    expect(seriesData?.A?.[0].notes).toBe('Rest Pause 6 máx')

    // Série B item 1: Rest Pause 6 máx
    expect(seriesData?.B?.[0].reps).toBe('Rest Pause 6 máx')

    // Série C item 1: Rest Pause 4 máx
    expect(seriesData?.C?.[0].reps).toBe('Rest Pause 4 máx')

    // Série A itens 2 a 7: 4x10
    expect(seriesData?.A?.[1].sets).toBe(4)
    expect(seriesData?.A?.[1].reps).toBe('10')
  })

  it('deve conter as cargas corretas da planilha oficial em cada item das séries A, B e C', async () => {
    const students = await studentsService.getAll()
    const carla = students.find((s) => s.name.toUpperCase().includes('CARLA RODRIGUES'))
    expect(carla).toBeDefined()

    const sheet = await trainingSheetsService.getByStudent(carla!.id)
    expect(sheet).toBeDefined()
    const seriesData = sheet?.series_data

    // Série A:
    // 1. Extensora Curtinho: 2
    // 2. Supino Reto Conjugado Halter: 5
    // 3. Flexão de Quadril N/AB Can.: 5
    // 4. Elevação Frontal Unilateral Halter: 4
    // 5. Flexão de Quadril 180º Polia: 2
    // 6. Tríceps Testa Simult. Solo Barra H: 4
    // 7. Adução em "V" Can.: 5 kg
    // 8. Alongamentos Revezar: ""
    expect(seriesData?.A?.[0].load).toBe('2')
    expect(seriesData?.A?.[1].load).toBe('5')
    expect(seriesData?.A?.[2].load).toBe('5')
    expect(seriesData?.A?.[3].load).toBe('4')
    expect(seriesData?.A?.[4].load).toBe('2')
    expect(seriesData?.A?.[5].load).toBe('4')
    expect(seriesData?.A?.[6].load).toBe('5 kg')
    expect(seriesData?.A?.[7].load).toBe('')

    // Série B:
    // 1. Flexora Simult.: 5
    // 2. Remada Curvada Pronado Aberto (Halter): "" (em branco na tabela)
    // 3. Stiff Smith: 15
    // 4. Pulley Frente Fechado Peg Sup. (Barra): 5
    // 5. Panturrilha Smith: 20
    // 6. Rosca Concentrada Halter: 6
    // 7. Pêndulo: 8
    // 8. Alongamentos Revezar: ""
    expect(seriesData?.B?.[0].load).toBe('5')
    expect(seriesData?.B?.[1].load).toBe('')
    expect(seriesData?.B?.[2].load).toBe('15')
    expect(seriesData?.B?.[3].load).toBe('5')
    expect(seriesData?.B?.[4].load).toBe('20')
    expect(seriesData?.B?.[5].load).toBe('6')
    expect(seriesData?.B?.[6].load).toBe('8')
    expect(seriesData?.B?.[7].load).toBe('')

    // Série C:
    // 1. Abdutora Inclinada: 6
    // 2. Tríceps Testa Polia Barra Step: 4
    // 3. Levantamento Terra Sumô: 10
    // 4. Tríceps Unilateral Polia: 2
    // 5. Abdução Polia Atrás: 2
    // 6. Glúteo 180º Polia: 3
    // 7. Remada Alta Polia Barra: 3
    // 8. Alongamentos Revezar: ""
    expect(seriesData?.C?.[0].load).toBe('6')
    expect(seriesData?.C?.[1].load).toBe('4')
    expect(seriesData?.C?.[2].load).toBe('10')
    expect(seriesData?.C?.[3].load).toBe('2')
    expect(seriesData?.C?.[4].load).toBe('2')
    expect(seriesData?.C?.[5].load).toBe('3')
    expect(seriesData?.C?.[6].load).toBe('3')
    expect(seriesData?.C?.[7].load).toBe('')
  })

  it('deve registrar exatamente 20 sessões concluídas no contador de histórico', async () => {
    const students = await studentsService.getAll()
    const carla = students.find((s) => s.name.toUpperCase().includes('CARLA RODRIGUES'))
    expect(carla).toBeDefined()

    const sheet = await trainingSheetsService.getByStudent(carla!.id)
    expect(sheet).toBeDefined()

    const count = await workoutProgressService.countCompletedSessions(carla!.id, sheet!.id)
    expect(count).toBe(20)

    // Verificar se as sessões estão distribuídas em A, B, C
    const sessions = await workoutProgressService.getAll(carla!.id, 50)
    expect(sessions.length).toBeGreaterThanOrEqual(20)
    const seriesA = sessions.filter((s) => s.series_completed === 'A')
    const seriesB = sessions.filter((s) => s.series_completed === 'B')
    const seriesC = sessions.filter((s) => s.series_completed === 'C')

    expect(seriesA.length).toBeGreaterThan(0)
    expect(seriesB.length).toBeGreaterThan(0)
    expect(seriesC.length).toBeGreaterThan(0)
  })
})
