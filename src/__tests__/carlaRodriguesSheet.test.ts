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
