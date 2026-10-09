import { describe, it, expect, vi } from 'vitest'
import { templateSheetsStorage, DEFAULT_MODEL_SHEETS } from '../services/templateSheets'
import { trainingSheetsService } from '../services/trainingSheets'

describe('Catálogo de Fichas Modelo do Studio Bru Oliveira', () => {
  it('contém exatamente os 6 modelos oficiais de fábrica', () => {
    expect(DEFAULT_MODEL_SHEETS).toHaveLength(6)

    const ids = DEFAULT_MODEL_SHEETS.map((t) => t.id)
    expect(ids).toEqual([
      'modelo-iniciante-masculino',
      'modelo-iniciante-feminino',
      'modelo-intermediario-masculino',
      'modelo-intermediario-feminino',
      'modelo-avancado-masculino',
      'modelo-avancado-feminino',
    ])
  })

  it('todos os modelos são do tipo is_template e não possuem aluno vinculado (student vazio)', () => {
    for (const t of DEFAULT_MODEL_SHEETS) {
      expect(t.is_template).toBe(true)
      expect(t.student).toBe('')
    }
  })

  it('cobre todos os 3 níveis (Iniciante, Intermediário, Avançado) e ambos os gêneros (Feminino, Masculino)', () => {
    const templates = templateSheetsStorage.getAllTemplates()
    expect(templates.length).toBeGreaterThanOrEqual(6)

    const levels = templates.map((t) => t.template_level)
    expect(levels).toContain('Iniciante')
    expect(levels).toContain('Intermediário')
    expect(levels).toContain('Avançado')

    const genders = templates.map((t) => t.template_gender)
    expect(genders).toContain('Feminino')
    expect(genders).toContain('Masculino')

    // Combinações 3 x 2 = 6 modelos únicos
    const combos = templates.map((t) => `${t.template_level}-${t.template_gender}`)
    expect(combos).toContain('Iniciante-Masculino')
    expect(combos).toContain('Iniciante-Feminino')
    expect(combos).toContain('Intermediário-Masculino')
    expect(combos).toContain('Intermediário-Feminino')
    expect(combos).toContain('Avançado-Masculino')
    expect(combos).toContain('Avançado-Feminino')
  })

  it('1) INICIANTE · MASCULINO possui estrutura correta (3x15, A e B com 6 exercícios cada, sem série C)', () => {
    const sheet = DEFAULT_MODEL_SHEETS.find((s) => s.id === 'modelo-iniciante-masculino')!
    expect(sheet).toBeDefined()
    expect(sheet.series_data?.A).toHaveLength(6)
    expect(sheet.series_data?.B).toHaveLength(6)
    expect(sheet.series_data?.C || []).toHaveLength(0)

    // Série A: Voador, Extensora Simultanea, Rosca Direta Halter, Adutora, Elevação Frontal Halter, Abd Supra Curtinho
    const exA = sheet.series_data?.A || []
    expect(exA.map((b) => b.exercise_id)).toEqual([
      'J6D8irzAtoGJ6YP',
      'mQLChSNqA16BIWn',
      'r3wVL97L321FLsa',
      '8thk19uRFFFCxIN',
      'qZhnDMxKPmVCcad',
      'MUxTpYtRFbKkXPA',
    ])
    // Tudo 3x15 sem carga
    for (const b of exA) {
      expect(b.sets).toBe(3)
      expect(b.reps).toBe('15')
      expect(b.load).toBe('')
    }

    // Série B: Remada Baixa Triângulo, Flexora Simult., Tríceps Pulley, Panturrilha Livre Simultâneo, Remada Alta Polia Barra, Abd Infra Joelhos Flexionados
    const exB = sheet.series_data?.B || []
    expect(exB.map((b) => b.exercise_id)).toEqual([
      'g9UNEzt5uTUX8TR',
      'zzOmYfhlbYzdPCE',
      'X7enZrQh0maq6lZ',
      'NZ4wHOyXwJrkisZ',
      '4ZPKCGiQz6qZ7eo',
      'DsUq0SgcxQCDqhi',
    ])
  })

  it('2) INICIANTE · FEMININO possui cargas na Série A, Série B sem cargas e adaptação da Elevação Pélvica Máquina (nota Cinta)', () => {
    const sheet = DEFAULT_MODEL_SHEETS.find((s) => s.id === 'modelo-iniciante-feminino')!
    expect(sheet).toBeDefined()
    expect(sheet.series_data?.A).toHaveLength(6)
    expect(sheet.series_data?.B).toHaveLength(6)

    // Série A com cargas: Extensora: 4, Voador: 2, Adutora: 3, Rosca: 4, Elevação Frontal: 3, Abd: sem carga
    const exA = sheet.series_data?.A || []
    expect(exA[0].exercise_id).toBe('mQLChSNqA16BIWn')
    expect(exA[0].load).toBe('4')
    expect(exA[1].exercise_id).toBe('J6D8irzAtoGJ6YP')
    expect(exA[1].load).toBe('2')
    expect(exA[2].exercise_id).toBe('8thk19uRFFFCxIN')
    expect(exA[2].load).toBe('3')
    expect(exA[3].exercise_id).toBe('r3wVL97L321FLsa')
    expect(exA[3].load).toBe('4')
    expect(exA[4].exercise_id).toBe('qZhnDMxKPmVCcad')
    expect(exA[4].load).toBe('3')
    expect(exA[5].load).toBe('')

    // Série B: Elevação Pélvica Máquina com nota 'Cinta'
    const exB = sheet.series_data?.B || []
    const elevPelv = exB.find((b) => b.exercise_id === '8IOQONKbyHHiMLR')
    expect(elevPelv).toBeDefined()
    expect(elevPelv?.notes).toBe('Cinta')
  })

  it('3) INTERMEDIÁRIO · MASCULINO possui notas de mapeamento corretas (Aberto, Declinado, Pulley Costas)', () => {
    const sheet = DEFAULT_MODEL_SHEETS.find((s) => s.id === 'modelo-intermediario-masculino')!
    expect(sheet).toBeDefined()
    expect(sheet.series_data?.A).toHaveLength(8)
    expect(sheet.series_data?.B).toHaveLength(8)

    // Flexão Smith nota 'Aberto'
    const flexSmith = sheet.series_data?.A?.[0]
    expect(flexSmith?.exercise_id).toBe('p0RnIafG9dVwGF3')
    expect(flexSmith?.notes).toBe('Aberto')

    // Supino Reto Halter nota 'Declinado'
    const supDec = sheet.series_data?.A?.[2]
    expect(supDec?.exercise_id).toBe('zLTeVy8hkIZhwei')
    expect(supDec?.notes).toBe('Declinado')
    expect(supDec?.load).toBe('7')

    // Puxada Frente Pronada nota 'Pulley Costas'
    const pulleyCostas = sheet.series_data?.B?.[0]
    expect(pulleyCostas?.exercise_id).toBe('4AHnHz8WKmSKxMu')
    expect(pulleyCostas?.notes).toBe('Pulley Costas')
  })

  it('4) INTERMEDIÁRIO · FEMININO possui 8 exercícios em A e B com notas e cargas correspondentes', () => {
    const sheet = DEFAULT_MODEL_SHEETS.find((s) => s.id === 'modelo-intermediario-feminino')!
    expect(sheet).toBeDefined()
    expect(sheet.series_data?.A).toHaveLength(8)
    expect(sheet.series_data?.B).toHaveLength(8)

    // Adutora 10" Final
    const adutora = sheet.series_data?.A?.[3]
    expect(adutora?.exercise_id).toBe('8thk19uRFFFCxIN')
    expect(adutora?.notes).toBe('10" Final')

    // Prancha Ventral em B
    const prancha = sheet.series_data?.B?.[7]
    expect(prancha?.exercise_id).toBe('ugHuHTuS2XKyTEF')
  })

  it('5) AVANÇADO · MASCULINO possui 3 séries (A, B, C) de 7 exercícios cada, Tríceps Unilateral nota Externo e Prancha 3xMÁX', () => {
    const sheet = DEFAULT_MODEL_SHEETS.find((s) => s.id === 'modelo-avancado-masculino')!
    expect(sheet).toBeDefined()
    expect(sheet.series_data?.A).toHaveLength(7)
    expect(sheet.series_data?.B).toHaveLength(7)
    expect(sheet.series_data?.C).toHaveLength(7)

    // Tríceps Externo Polia -> Tríceps Unilateral Polia nota "Externo"
    const tricepsExt = sheet.series_data?.A?.[5]
    expect(tricepsExt?.exercise_id).toBe('Lq8hMM96oTj4Wg1')
    expect(tricepsExt?.notes).toBe('Externo')

    // Prancha 3xMÁX
    const prancha = sheet.series_data?.A?.[6]
    expect(prancha?.exercise_id).toBe('ugHuHTuS2XKyTEF')
    expect(prancha?.reps).toBe('MÁX')
    expect(prancha?.notes).toBe('3xMÁX')
  })

  it('6) AVANÇADO · FEMININO registra a nota de imagem cortada nas observações e Crucifixo nota No Step', () => {
    const sheet = DEFAULT_MODEL_SHEETS.find((s) => s.id === 'modelo-avancado-feminino')!
    expect(sheet).toBeDefined()
    expect(sheet.notes).toContain('cortada')

    expect(sheet.series_data?.A).toHaveLength(7)
    expect(sheet.series_data?.B).toHaveLength(7)
    expect(sheet.series_data?.C).toHaveLength(6)

    // Crucifixo Halter Step -> Crucifixo Halter nota "No Step"
    const crucifixo = sheet.series_data?.A?.[4]
    expect(crucifixo?.exercise_id).toBe('2ujrgYD9PpNT9q3')
    expect(crucifixo?.notes).toBe('No Step')

    // Abd Supra Total com Rotação nota 'Com Carga'
    const abdRot = sheet.series_data?.B?.[6]
    expect(abdRot?.exercise_id).toBe('HiFzhnOLxgkrEg7')
    expect(abdRot?.notes).toBe('Com Carga')
  })

  it('permite duplicar qualquer um dos 6 modelos e vincular a um novo aluno', async () => {
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

    for (const template of DEFAULT_MODEL_SHEETS) {
      const cloned = await trainingSheetsService.duplicate(
        template.id,
        'aluno-teste-123',
        `Ficha Aluno Teste (${template.title})`,
        template,
      )

      expect(cloned).toBeDefined()
      expect(capturedPayload.student).toBe('aluno-teste-123')
      expect(capturedPayload.title).toBe(`Ficha Aluno Teste (${template.title})`)
      expect(capturedPayload.series_data.A.length).toBeGreaterThan(0)
    }
  })

  it('suporta abertura direta no treino e ciclo de séries para modelos', () => {
    // Modelos abrem em /treino?template=ID e não gravam histórico no banco
    const template = templateSheetsStorage.getTemplateById('modelo-avancado-masculino')
    expect(template).toBeDefined()

    // O modelo possui séries A, B e C
    const availableKeys = Object.keys(template?.series_data || {}).filter(
      (k) => (template?.series_data as Record<string, unknown[]>)?.[k]?.length > 0,
    )
    expect(availableKeys).toEqual(['A', 'B', 'C'])
    expect(availableKeys[0]).toBe('A')
  })
})
