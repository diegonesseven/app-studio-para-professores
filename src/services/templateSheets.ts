import type { TrainingSheet, TemplateLevel, TemplateGender } from '@/types'

const LOCAL_STORAGE_KEY = 'studio_bru_model_sheets_v1'

export interface ModelSheetMeta {
  is_template: boolean
  template_level?: TemplateLevel
  template_gender?: TemplateGender
}

// 6 Modelos Oficiais de Fábrica do Studio Bru Oliveira (Camada de Modelos)
// Conforme mapeamento e regras estabelecidas: IDs do acervo de exercícios e notas nos casos adaptados
export const DEFAULT_MODEL_SHEETS: TrainingSheet[] = [
  // 1) INICIANTE · MASCULINO
  {
    id: 'modelo-iniciante-masculino',
    collectionId: 'local_templates',
    collectionName: 'training_sheets',
    student: '',
    title: 'Ficha Modelo - Iniciante Masculino',
    notes:
      "AQUECIMENTO 5' no topo das Séries A e B. Séries 3x15 sem cargas iniciais. Intervalo de recuperação entre séries.",
    is_template: true,
    template_level: 'Iniciante',
    template_gender: 'Masculino',
    start_date: '2026-01-01T00:00:00.000Z',
    is_archived: false,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    series_data: {
      A: [
        {
          exercise_id: 'J6D8irzAtoGJ6YP', // Voador
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 1,
        },
        {
          exercise_id: 'mQLChSNqA16BIWn', // Extensora Simultanea
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 2,
        },
        {
          exercise_id: 'r3wVL97L321FLsa', // Rosca Direta Halter
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 3,
        },
        {
          exercise_id: '8thk19uRFFFCxIN', // Adutora
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 4,
        },
        {
          exercise_id: 'qZhnDMxKPmVCcad', // Elevação Frontal Halter
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 5,
        },
        {
          exercise_id: 'MUxTpYtRFbKkXPA', // Abdominal Supra Curtinho
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 6,
        },
      ],
      B: [
        {
          exercise_id: 'g9UNEzt5uTUX8TR', // Remada Baixa Triângulo
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 1,
        },
        {
          exercise_id: 'zzOmYfhlbYzdPCE', // Flexora Simult.
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 2,
        },
        {
          exercise_id: 'X7enZrQh0maq6lZ', // Tríceps Pulley
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 3,
        },
        {
          exercise_id: 'NZ4wHOyXwJrkisZ', // Panturrilha Livre Simultâneo
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 4,
        },
        {
          exercise_id: '4ZPKCGiQz6qZ7eo', // Remada Alta Polia Barra
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 5,
        },
        {
          exercise_id: 'DsUq0SgcxQCDqhi', // Abdominal Infra Joelhos Dobrados Solo
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 6,
        },
      ],
    },
  },

  // 2) INICIANTE · FEMININO
  {
    id: 'modelo-iniciante-feminino',
    collectionId: 'local_templates',
    collectionName: 'training_sheets',
    student: '',
    title: 'Ficha Modelo - Iniciante Feminino',
    notes:
      "AQUECIMENTO 5' no topo das Séries A e B. Tudo 3x15. Série A com cargas indicadas; Série B sem cargas iniciais.",
    is_template: true,
    template_level: 'Iniciante',
    template_gender: 'Feminino',
    start_date: '2026-01-01T00:00:00.000Z',
    is_archived: false,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    series_data: {
      A: [
        {
          exercise_id: 'mQLChSNqA16BIWn', // Extensora Simultanea
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '4',
          notes: '',
          order: 1,
        },
        {
          exercise_id: 'J6D8irzAtoGJ6YP', // Voador
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '2',
          notes: '',
          order: 2,
        },
        {
          exercise_id: '8thk19uRFFFCxIN', // Adutora
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '3',
          notes: '',
          order: 3,
        },
        {
          exercise_id: 'r3wVL97L321FLsa', // Rosca Direta Halter
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '4',
          notes: '',
          order: 4,
        },
        {
          exercise_id: 'qZhnDMxKPmVCcad', // Elevação Frontal Halter
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '3',
          notes: '',
          order: 5,
        },
        {
          exercise_id: 'MUxTpYtRFbKkXPA', // Abdominal Supra Curtinho
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 6,
        },
      ],
      B: [
        {
          exercise_id: 'zzOmYfhlbYzdPCE', // Flexora Simult.
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 1,
        },
        {
          exercise_id: 'g9UNEzt5uTUX8TR', // Remada Baixa Triângulo
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 2,
        },
        {
          exercise_id: 'NZ4wHOyXwJrkisZ', // Panturrilha Livre Simultâneo
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 3,
        },
        {
          exercise_id: 'X7enZrQh0maq6lZ', // Tríceps Pulley
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 4,
        },
        {
          exercise_id: '8IOQONKbyHHiMLR', // Elevação Pélvica Máquina
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: 'Cinta',
          order: 5,
        },
        {
          exercise_id: 'DsUq0SgcxQCDqhi', // Abdominal Infra Joelhos Dobrados Solo
          sets: 3,
          reps: '15',
          time: '45-60s',
          load: '',
          notes: '',
          order: 6,
        },
      ],
    },
  },

  // 3) INTERMEDIÁRIO · MASCULINO
  {
    id: 'modelo-intermediario-masculino',
    collectionId: 'local_templates',
    collectionName: 'training_sheets',
    student: '',
    title: 'Ficha Modelo - Intermediário Masculino',
    notes:
      'Tudo 3x12 (abdominais 3x12-15). Sem aquecimento/cardio pré-definido. Séries A e B estruturadas.',
    is_template: true,
    template_level: 'Intermediário',
    template_gender: 'Masculino',
    start_date: '2026-01-01T00:00:00.000Z',
    is_archived: false,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    series_data: {
      A: [
        {
          exercise_id: 'p0RnIafG9dVwGF3', // Flexão de Braço Smith
          sets: 3,
          reps: '12',
          time: '60s',
          load: '',
          notes: 'Aberto',
          order: 1,
        },
        {
          exercise_id: 'KOiZBzDqS0hUeBD', // Supino 45º Barra
          sets: 3,
          reps: '12',
          time: '60s',
          load: '7',
          notes: '',
          order: 2,
        },
        {
          exercise_id: 'zLTeVy8hkIZhwei', // Supino Reto Halter
          sets: 3,
          reps: '12',
          time: '60s',
          load: '7',
          notes: 'Declinado',
          order: 3,
        },
        {
          exercise_id: 'GDZvshWyeD15fn8', // Tríceps Francês Simultâneo Halter
          sets: 3,
          reps: '12',
          time: '60s',
          load: '5',
          notes: '',
          order: 4,
        },
        {
          exercise_id: 'Oxh9MmokxaQ6QWe', // Desenvolvimento Halter
          sets: 3,
          reps: '12',
          time: '60s',
          load: '4',
          notes: '',
          order: 5,
        },
        {
          exercise_id: 'rf9WjIK9uvAjIuU', // Flexão de Quadril 90º Can.
          sets: 3,
          reps: '12',
          time: '60s',
          load: '5',
          notes: '',
          order: 6,
        },
        {
          exercise_id: 'Mvi80NUVatYRubr', // Abdutora
          sets: 3,
          reps: '12',
          time: '60s',
          load: '7',
          notes: '',
          order: 7,
        },
        {
          exercise_id: 'JGt11Xtf9Gdi7yM', // Abdominal Supra Total com AP
          sets: 3,
          reps: '12-15',
          time: '60s',
          load: '5',
          notes: '',
          order: 8,
        },
      ],
      B: [
        {
          exercise_id: '4AHnHz8WKmSKxMu', // Puxada Frente Pronada
          sets: 3,
          reps: '12',
          time: '60s',
          load: '',
          notes: 'Pulley Costas',
          order: 1,
        },
        {
          exercise_id: 'PwVDt68rJ1svs2l', // Voador Dorsal
          sets: 3,
          reps: '12',
          time: '60s',
          load: '0+2',
          notes: '',
          order: 2,
        },
        {
          exercise_id: '1sbmgamLEMDEFsO', // Elevação Lateral Halter
          sets: 3,
          reps: '12',
          time: '60s',
          load: '3',
          notes: '',
          order: 3,
        },
        {
          exercise_id: '8RKeY63T0b75Quz', // Rosca Direta Barra
          sets: 3,
          reps: '12',
          time: '60s',
          load: '3',
          notes: '',
          order: 4,
        },
        {
          exercise_id: 'oM4CsUFGIA7caRl', // Rosca Alternada Halter
          sets: 3,
          reps: '12',
          time: '60s',
          load: '4',
          notes: '',
          order: 5,
        },
        {
          exercise_id: 'nqVXpcqZJ8Gt2dq', // Flexora Unilateral
          sets: 3,
          reps: '12',
          time: '60s',
          load: '2',
          notes: '',
          order: 6,
        },
        {
          exercise_id: 'Tu5EnHLjRrrnYwM', // Panturrilha Sentado Curtinho
          sets: 3,
          reps: '12',
          time: '60s',
          load: '15',
          notes: '',
          order: 7,
        },
        {
          exercise_id: 'e6NELEnOyUVONoo', // Abdominal Infra Joelhos Esticados Solo
          sets: 3,
          reps: '12-15',
          time: '60s',
          load: '',
          notes: '',
          order: 8,
        },
      ],
    },
  },

  // 4) INTERMEDIÁRIO · FEMININO
  {
    id: 'modelo-intermediario-feminino',
    collectionId: 'local_templates',
    collectionName: 'training_sheets',
    student: '',
    title: 'Ficha Modelo - Intermediário Feminino',
    notes:
      'Tudo 3x12 (abdominais/prancha 3x12-15). Sem aquecimento/cardio pré-definido. Série A com cargas indicadas; Série B sem cargas.',
    is_template: true,
    template_level: 'Intermediário',
    template_gender: 'Feminino',
    start_date: '2026-01-01T00:00:00.000Z',
    is_archived: false,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    series_data: {
      A: [
        {
          exercise_id: 'eMYiXlSgwyOA04L', // Agachamento Smith
          sets: 3,
          reps: '12',
          time: '60s',
          load: '10',
          notes: '',
          order: 1,
        },
        {
          exercise_id: 'mQLChSNqA16BIWn', // Extensora Simultanea
          sets: 3,
          reps: '12',
          time: '60s',
          load: '0',
          notes: '',
          order: 2,
        },
        {
          exercise_id: 'rf9WjIK9uvAjIuU', // Flexão de Quadril 90º Can.
          sets: 3,
          reps: '12',
          time: '60s',
          load: '3',
          notes: '',
          order: 3,
        },
        {
          exercise_id: '8thk19uRFFFCxIN', // Adutora
          sets: 3,
          reps: '12',
          time: '60s',
          load: '',
          notes: '10" Final',
          order: 4,
        },
        {
          exercise_id: 'bUwjPrc0HSFDUaS', // Supino Reto Barra
          sets: 3,
          reps: '12',
          time: '60s',
          load: '',
          notes: '',
          order: 5,
        },
        {
          exercise_id: '3orBGIRaD6M6dWD', // Tríceps Polia Corda
          sets: 3,
          reps: '12',
          time: '60s',
          load: '2',
          notes: '',
          order: 6,
        },
        {
          exercise_id: 'Oxh9MmokxaQ6QWe', // Desenvolvimento Halter
          sets: 3,
          reps: '12',
          time: '60s',
          load: '2',
          notes: '',
          order: 7,
        },
        {
          exercise_id: 'JGt11Xtf9Gdi7yM', // Abdominal Supra Total com AP
          sets: 3,
          reps: '12-15',
          time: '60s',
          load: '',
          notes: '',
          order: 8,
        },
      ],
      B: [
        {
          exercise_id: 'nqVXpcqZJ8Gt2dq', // Flexora Unilateral
          sets: 3,
          reps: '12',
          time: '60s',
          load: '',
          notes: '',
          order: 1,
        },
        {
          exercise_id: '0vmvev4dIu8InvO', // Abdutora Inclinada
          sets: 3,
          reps: '12',
          time: '60s',
          load: '',
          notes: '',
          order: 2,
        },
        {
          exercise_id: 'Mvi80NUVatYRubr', // Abdutora
          sets: 3,
          reps: '12',
          time: '60s',
          load: '',
          notes: '',
          order: 3,
        },
        {
          exercise_id: 'Tu5EnHLjRrrnYwM', // Panturrilha Sentado Curtinho
          sets: 3,
          reps: '12',
          time: '60s',
          load: '',
          notes: '',
          order: 4,
        },
        {
          exercise_id: 'MhGtryeV1znVtlw', // Pulley Frente Triângulo
          sets: 3,
          reps: '12',
          time: '60s',
          load: '',
          notes: '',
          order: 5,
        },
        {
          exercise_id: 'actwJx5ypdZrxNw', // Rosca Polia
          sets: 3,
          reps: '12',
          time: '60s',
          load: '',
          notes: '',
          order: 6,
        },
        {
          exercise_id: 'e6NELEnOyUVONoo', // Abdominal Infra Joelhos Esticados Solo
          sets: 3,
          reps: '12-15',
          time: '60s',
          load: '',
          notes: '',
          order: 7,
        },
        {
          exercise_id: 'ugHuHTuS2XKyTEF', // Prancha Ventral
          sets: 3,
          reps: '12-15',
          time: '60s',
          load: '',
          notes: '',
          order: 8,
        },
      ],
    },
  },

  // 5) AVANÇADO · MASCULINO
  {
    id: 'modelo-avancado-masculino',
    collectionId: 'local_templates',
    collectionName: 'training_sheets',
    student: '',
    title: 'Ficha Modelo - Avançado Masculino',
    notes:
      'Tudo 3x12 exceto indicados. Rodapé #CARDIO/ALONG# nas três séries. Frequência sugerida: A B C A.',
    is_template: true,
    template_level: 'Avançado',
    template_gender: 'Masculino',
    start_date: '2026-01-01T00:00:00.000Z',
    is_archived: false,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    series_data: {
      A: [
        {
          exercise_id: 'YksaislsjSEaaTd', // Cross Over Polia Alta
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '',
          notes: '',
          order: 1,
        },
        {
          exercise_id: '2ujrgYD9PpNT9q3', // Crucifixo Halter
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '8',
          notes: '',
          order: 2,
        },
        {
          exercise_id: 'zTlaHlni8D4ru5W', // Voador Unilateral
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '2+1',
          notes: '',
          order: 3,
        },
        {
          exercise_id: 'qpzVFQIffXKbNHL', // Tríceps Mergulho
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '',
          notes: '',
          order: 4,
        },
        {
          exercise_id: 'D0K3U65JRukWlvA', // Tríceps Polia Barra V
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '6',
          notes: '',
          order: 5,
        },
        {
          exercise_id: 'Lq8hMM96oTj4Wg1', // Tríceps Unilateral Polia
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '2',
          notes: 'Externo',
          order: 6,
        },
        {
          exercise_id: 'ugHuHTuS2XKyTEF', // Prancha Ventral
          sets: 3,
          reps: 'MÁX',
          time: '60s',
          load: '',
          notes: '3xMÁX',
          order: 7,
        },
      ],
      B: [
        {
          exercise_id: 'MhGtryeV1znVtlw', // Pulley Frente Triângulo
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '7',
          notes: '',
          order: 1,
        },
        {
          exercise_id: 'bDiShrYbQkt4iic', // Remada Curvada Pronada Barra Livre
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '12',
          notes: '',
          order: 2,
        },
        {
          exercise_id: '2ujrgYD9PpNT9q3', // Crucifixo Halter
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '5',
          notes: '',
          order: 3,
        },
        {
          exercise_id: 'L15oUve21E8cIpE', // Rosca Polia Corda
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '5',
          notes: '',
          order: 4,
        },
        {
          exercise_id: 'Zqq5WqGEUFqJXww', // Rosca Direta Bco 45º Halter
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '6',
          notes: '',
          order: 5,
        },
        {
          exercise_id: 'OOox4jnAN4DkDlO', // Rosca Martelo Halter
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '5',
          notes: '',
          order: 6,
        },
        {
          exercise_id: 'iy9gTMAKrL1WuzU', // Abdominal Supra Banco Declinado
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '6',
          notes: '',
          order: 7,
        },
      ],
      C: [
        {
          exercise_id: 'X9Gi9ET1QbKvINn', // Desenvolvimento Barra Livre
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '6',
          notes: '',
          order: 1,
        },
        {
          exercise_id: 'mTKl1mXW871brPg', // Encolhimento Halter
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '30',
          notes: '',
          order: 2,
        },
        {
          exercise_id: '9VNCbz4BpN2dbsQ', // Leg Simultaneo
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '60',
          notes: '',
          order: 3,
        },
        {
          exercise_id: 'lvZR86t3c9oWEBr', // Panturrilha Leg 45º
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '60',
          notes: '',
          order: 4,
        },
        {
          exercise_id: 'zFaweXgd3rUJtHL', // Afundo Halter
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '9',
          notes: '',
          order: 5,
        },
        {
          exercise_id: '8thk19uRFFFCxIN', // Adutora
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '6',
          notes: '',
          order: 6,
        },
        {
          exercise_id: 'kkwxyC9bfAX69QA', // Abdução Vertical Can.
          sets: 3,
          reps: '12',
          time: '60-75s',
          load: '7',
          notes: '',
          order: 7,
        },
      ],
    },
  },

  // 6) AVANÇADO · FEMININO
  {
    id: 'modelo-avancado-feminino',
    collectionId: 'local_templates',
    collectionName: 'training_sheets',
    student: '',
    title: 'Ficha Modelo - Avançado Feminino',
    notes:
      'Tudo 3x12 exceto indicados. Frequência: A B C A B A. Imagem original de referência veio cortada — pode haver mais exercícios a complementar.',
    is_template: true,
    template_level: 'Avançado',
    template_gender: 'Feminino',
    start_date: '2026-01-01T00:00:00.000Z',
    is_archived: false,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    series_data: {
      A: [
        {
          exercise_id: '9VNCbz4BpN2dbsQ', // Leg Simultaneo
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '30',
          notes: '',
          order: 1,
        },
        {
          exercise_id: '76fjx3vNmMxfe1r', // Agachamento Pés Anilha
          sets: 3,
          reps: '20',
          time: '45-60s',
          load: '5',
          notes: '10" 10"',
          order: 2,
        },
        {
          exercise_id: 'FDlBl8QLtIuPgE8', // Flexão de Quadril 180º Polia
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '0',
          notes: '',
          order: 3,
        },
        {
          exercise_id: '8thk19uRFFFCxIN', // Adutora
          sets: 3,
          reps: '20',
          time: '45-60s',
          load: '2',
          notes: '10"10"',
          order: 4,
        },
        {
          exercise_id: '2ujrgYD9PpNT9q3', // Crucifixo Halter
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '3',
          notes: 'No Step',
          order: 5,
        },
        {
          exercise_id: 'X7enZrQh0maq6lZ', // Tríceps Pulley
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '2+2',
          notes: '',
          order: 6,
        },
        {
          exercise_id: 'MEzonP0Zyy1DWyU', // Abdominal Infra Banco Declinado
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '',
          notes: '',
          order: 7,
        },
      ],
      B: [
        {
          exercise_id: 'vaavuXGfIJMzrcO', // Stiff Smith
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '',
          notes: '',
          order: 1,
        },
        {
          exercise_id: 'u0TS48sLfta8jfp', // Flexão de Joelho Polia
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '11/10/9',
          notes: '',
          order: 2,
        },
        {
          exercise_id: 'Tu5EnHLjRrrnYwM', // Panturrilha Sentado Curtinho
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '30',
          notes: '',
          order: 3,
        },
        {
          exercise_id: 'g9UNEzt5uTUX8TR', // Remada Baixa Triângulo
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '5',
          notes: '',
          order: 4,
        },
        {
          exercise_id: 'P2vpv8uNHKTv0zw', // Rosca com Giro Halter
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '6',
          notes: '',
          order: 5,
        },
        {
          exercise_id: 'nBU0kDPMIjFOCJq', // Abdominal Remador
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '',
          notes: '',
          order: 6,
        },
        {
          exercise_id: 'HiFzhnOLxgkrEg7', // Abdominal Supra Total com Rotação Solo
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '',
          notes: 'Com Carga',
          order: 7,
        },
      ],
      C: [
        {
          exercise_id: 'Dndmvwg7vUMkbsy', // Glúteo Coice Polia
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '',
          notes: '',
          order: 1,
        },
        {
          exercise_id: 'fzl6eSfmnnLhJXy', // Elevação Pélvica Barra
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '4/6/8',
          notes: '',
          order: 2,
        },
        {
          exercise_id: 'GlsUAoGmY2pIvAB', // Glúteo 180º Cruzado Solo Can.
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '',
          notes: '',
          order: 3,
        },
        {
          exercise_id: '8thk19uRFFFCxIN', // Adutora
          sets: 3,
          reps: '20',
          time: '45-60s',
          load: '',
          notes: '10"10"',
          order: 4,
        },
        {
          exercise_id: 'VtX8sZu0qdBRlkM', // Abdominal Supra Cruzado Solo
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '',
          notes: '',
          order: 5,
        },
        {
          exercise_id: 'sQkL9BI5euiV1TU', // Abdominal Canivete Alternado
          sets: 3,
          reps: '12',
          time: '45-60s',
          load: '',
          notes: '',
          order: 6,
        },
      ],
    },
  },
]

export const templateSheetsStorage = {
  getCustomTemplates(): TrainingSheet[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (!raw) return []
      return JSON.parse(raw)
    } catch {
      return []
    }
  },

  saveCustomTemplate(template: TrainingSheet): void {
    const list = this.getCustomTemplates()
    const existingIdx = list.findIndex((t) => t.id === template.id)
    if (existingIdx >= 0) {
      list[existingIdx] = template
    } else {
      list.unshift(template)
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  },

  deleteCustomTemplate(id: string): void {
    const list = this.getCustomTemplates().filter((t) => t.id !== id)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list))
  },

  getAllTemplates(): TrainingSheet[] {
    const custom = this.getCustomTemplates()
    // Retorna customizados primeiro e depois os 6 oficiais de fábrica
    return [...custom, ...DEFAULT_MODEL_SHEETS]
  },

  getTemplateById(id: string): TrainingSheet | undefined {
    return this.getAllTemplates().find((t) => t.id === id)
  },
}
