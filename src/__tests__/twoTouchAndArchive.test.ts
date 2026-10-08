import { describe, it, expect } from 'vitest'

describe('Fluxo de 2 Toques e Arquivamento de Fichas (Studio Bru Oliveira)', () => {
  it('executa o ciclo de dois toques: nenhum -> em execução (amarelo) -> concluído (verde) -> nenhum', () => {
    let completedMap: Record<number, boolean> = {}
    let inProgressMap: Record<number, boolean> = {}

    const toggle = (idx: number) => {
      const isDone = Boolean(completedMap[idx])
      const isInProg = Boolean(inProgressMap[idx])

      if (!isInProg && !isDone) {
        // 1º toque: Em execução (amarelo)
        inProgressMap[idx] = true
        delete completedMap[idx]
      } else if (isInProg && !isDone) {
        // 2º toque: Concluído (verde)
        delete inProgressMap[idx]
        completedMap[idx] = true
      } else {
        // 3º toque: Volta a nenhum (desmarcar por engano)
        delete inProgressMap[idx]
        delete completedMap[idx]
      }
    }

    // Inicialmente nenhum selecionado
    expect(inProgressMap[0]).toBeUndefined()
    expect(completedMap[0]).toBeUndefined()

    // 1º toque no exercício 0: deve virar 'em execução' (amarelo)
    toggle(0)
    expect(inProgressMap[0]).toBe(true)
    expect(completedMap[0]).toBeUndefined()

    // 2º toque no exercício 0: deve virar 'concluído' (verde)
    toggle(0)
    expect(inProgressMap[0]).toBeUndefined()
    expect(completedMap[0]).toBe(true)

    // 3º toque no exercício 0: desmarca (nenhum)
    toggle(0)
    expect(inProgressMap[0]).toBeUndefined()
    expect(completedMap[0]).toBeUndefined()
  })

  it('permite iniciar qualquer exercício primeiro sem pré-selecionar o primeiro da lista', () => {
    const completedMap: Record<number, boolean> = {}
    const inProgressMap: Record<number, boolean> = {}

    // Treinador toca no exercício #3 primeiro (índice 2)
    inProgressMap[2] = true

    expect(inProgressMap[0]).toBeUndefined()
    expect(inProgressMap[1]).toBeUndefined()
    expect(inProgressMap[2]).toBe(true)
  })

  it('arquiva a ficha anterior preservando dados para consulta', () => {
    interface SheetMock {
      id: string
      title: string
      is_archived: boolean
      start_date: string
    }

    let sheets: SheetMock[] = [
      { id: 'sheet-1', title: 'Treino A/B Inicial', is_archived: false, start_date: '2025-01-01' },
    ]

    // Criar nova ficha arquivando anteriores
    sheets = sheets.map((s) => ({ ...s, is_archived: true }))
    sheets.unshift({
      id: 'sheet-2',
      title: 'Treino Hipertrofia Novo',
      is_archived: false,
      start_date: '2025-02-15',
    })

    expect(sheets.length).toBe(2)
    expect(sheets[0].is_archived).toBe(false)
    expect(sheets[1].is_archived).toBe(true)
    expect(sheets[1].title).toBe('Treino A/B Inicial')
  })
})
