import { describe, it, expect, vi } from 'vitest'
import { templateSheetsStorage, DEFAULT_MODEL_SHEETS } from '../services/templateSheets'
import { trainingSheetsService } from '../services/trainingSheets'

describe('Fichas Modelo e Cópias', () => {
  it('contém modelos pré-programados de fábrica por nível e gênero', () => {
    const templates = templateSheetsStorage.getAllTemplates()
    expect(templates.length).toBeGreaterThanOrEqual(6)

    const levels = templates.map((t) => t.template_level)
    expect(levels).toContain('Iniciante')
    expect(levels).toContain('Intermediário')
    expect(levels).toContain('Avançado')

    const genders = templates.map((t) => t.template_gender)
    expect(genders).toContain('Feminino')
    expect(genders).toContain('Masculino')
  })

  it('permite duplicar ficha modelo e vincular a um novo aluno', async () => {
    const template = DEFAULT_MODEL_SHEETS[0]
    expect(template).toBeDefined()

    // Mock pb.collection('training_sheets').create
    let capturedPayload: any = null
    const mockCreate = vi.fn().mockImplementation((payload) => {
      capturedPayload = payload
      return Promise.resolve({ id: 'new-cloned-sheet-123', ...payload })
    })

    const pb = (await import('../lib/pocketbase/client')).default
    vi.spyOn(pb, 'collection').mockReturnValue({
      create: mockCreate,
      getOne: vi.fn(),
    } as any)

    const cloned = await trainingSheetsService.duplicate(
      template.id,
      'aluno-avulso-456',
      'Ficha Aluno Avulso (base Iniciante Feminino)',
      template,
    )

    expect(cloned).toBeDefined()
    expect(capturedPayload.student).toBe('aluno-avulso-456')
    expect(capturedPayload.title).toBe('Ficha Aluno Avulso (base Iniciante Feminino)')
    expect(capturedPayload.series_data.A.length).toBeGreaterThan(0)
  })
})
