import type { TrainingSheet, TemplateLevel, TemplateGender } from '@/types'

const LOCAL_STORAGE_KEY = 'studio_bru_model_sheets_v1'

export interface ModelSheetMeta {
  is_template: boolean
  template_level?: TemplateLevel
  template_gender?: TemplateGender
}

// Modelos pré-programados de fábrica organizados por nível e gênero (Iniciante, Intermediário, Avançado x Masculino / Feminino)
export const DEFAULT_MODEL_SHEETS: TrainingSheet[] = [
  {
    id: 'modelo-iniciante-feminino',
    collectionId: 'local_templates',
    collectionName: 'training_sheets',
    student: '',
    title: 'Ficha Modelo - Adaptação & Fortalecimento',
    notes: 'Intervalo de 45-60s. Foco em aprendizado motor, postura e ativação glútea.',
    is_template: true,
    template_level: 'Iniciante',
    template_gender: 'Feminino',
    start_date: new Date().toISOString(),
    is_archived: false,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    series_data: {
      A: [
        {
          exercise_id: 'bUwjPrc0HSFDUaS',
          sets: 3,
          reps: '12 a 15',
          time: '45-60s',
          load: 'Leve / Confortável',
          notes: 'Aquecimento e mobilidade articular',
          order: 1,
        },
        {
          exercise_id: '76fjx3vNmMxfe1r',
          sets: 3,
          reps: '10 a 12',
          time: '60s',
          load: 'Corporal',
          notes: 'Foco na postura e cadência controlada',
          order: 2,
        },
        {
          exercise_id: 'iQd0EsXVIYCXcNX',
          sets: 3,
          reps: '12',
          time: '45s',
          load: 'Caneleira leve',
          notes: 'Glúteo 4 apoios com foco em contração de pico',
          order: 3,
        },
      ],
      B: [
        {
          exercise_id: '5bKGKjVwTG1pue4',
          sets: 3,
          reps: '12 a 15',
          time: '45s',
          load: 'Leve',
          notes: 'Puxada ou remada para estabilização escapular',
          order: 1,
        },
        {
          exercise_id: 'h9cZDV7cNP0yQmd',
          sets: 3,
          reps: '15',
          time: '45s',
          load: 'Corporal',
          notes: 'Abdominal supra com respiração coordenada',
          order: 2,
        },
      ],
    },
  },
  {
    id: 'modelo-iniciante-masculino',
    collectionId: 'local_templates',
    collectionName: 'training_sheets',
    student: '',
    title: 'Ficha Modelo - Condicionamento & Base Geral',
    notes: 'Descanso 60s. Foco em técnica, estabilidade do core e respiração.',
    is_template: true,
    template_level: 'Iniciante',
    template_gender: 'Masculino',
    start_date: new Date().toISOString(),
    is_archived: false,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    series_data: {
      A: [
        {
          exercise_id: 'bUwjPrc0HSFDUaS',
          sets: 3,
          reps: '12',
          time: '60s',
          load: 'Leve',
          notes: 'Movimento controlado',
          order: 1,
        },
        {
          exercise_id: 'cTPSqmTKR36OdNr',
          sets: 3,
          reps: '10 a 12',
          time: '60s',
          load: 'Halber 6-8kg',
          notes: 'Supino com foco em alinhamento de cotovelos',
          order: 2,
        },
      ],
      B: [
        {
          exercise_id: '76fjx3vNmMxfe1r',
          sets: 3,
          reps: '12',
          time: '60s',
          load: 'Corporal / Halter',
          notes: 'Agachamento com amplitude segura',
          order: 1,
        },
        {
          exercise_id: 'h9cZDV7cNP0yQmd',
          sets: 3,
          reps: '15',
          time: '45s',
          load: 'Corporal',
          notes: 'Fortalecimento de abdômen',
          order: 2,
        },
      ],
    },
  },
  {
    id: 'modelo-intermediario-feminino',
    collectionId: 'local_templates',
    collectionName: 'training_sheets',
    student: '',
    title: 'Ficha Modelo - Hipertrofia & Glúteos/Pernas',
    notes: 'Descanso 45s a 60s. Progressão de carga e cadência 2-0-2.',
    is_template: true,
    template_level: 'Intermediário',
    template_gender: 'Feminino',
    start_date: new Date().toISOString(),
    is_archived: false,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    series_data: {
      A: [
        {
          exercise_id: '76fjx3vNmMxfe1r',
          sets: 4,
          reps: '10 a 12',
          time: '60s',
          load: 'Moderada / Pesada',
          notes: 'Agachamento livre ou guiado',
          order: 1,
        },
        {
          exercise_id: 'iQd0EsXVIYCXcNX',
          sets: 4,
          reps: '10 a 12',
          time: '45s',
          load: 'Moderada',
          notes: 'Elevação pélvica ou 4 apoios com isometria de 2s',
          order: 2,
        },
        {
          exercise_id: 'bUwjPrc0HSFDUaS',
          sets: 3,
          reps: '12',
          time: '45s',
          load: 'Moderada',
          notes: 'Cadeira extensora',
          order: 3,
        },
      ],
      B: [
        {
          exercise_id: '5bKGKjVwTG1pue4',
          sets: 4,
          reps: '10 a 12',
          time: '45s',
          load: 'Moderada',
          notes: 'Remada fechada ou puxador',
          order: 1,
        },
        {
          exercise_id: 'h9cZDV7cNP0yQmd',
          sets: 3,
          reps: '20',
          time: '30s',
          load: 'Corporal',
          notes: 'Abdominal infra e prancha isométrica',
          order: 2,
        },
      ],
    },
  },
  {
    id: 'modelo-intermediario-masculino',
    collectionId: 'local_templates',
    collectionName: 'training_sheets',
    student: '',
    title: 'Ficha Modelo - Hipertrofia & Força Muscular',
    notes: 'Descanso 60-75s. Carga progressiva buscando falha entre 8 e 12 repetições.',
    is_template: true,
    template_level: 'Intermediário',
    template_gender: 'Masculino',
    start_date: new Date().toISOString(),
    is_archived: false,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    series_data: {
      A: [
        {
          exercise_id: 'cTPSqmTKR36OdNr',
          sets: 4,
          reps: '8 a 10',
          time: '60s',
          load: 'Moderada/Pesada',
          notes: 'Supino reto halteres ou barra',
          order: 1,
        },
        {
          exercise_id: 'bUwjPrc0HSFDUaS',
          sets: 4,
          reps: '10 a 12',
          time: '60s',
          load: 'Moderada',
          notes: 'Desenvolvimento ombros ou elevação lateral',
          order: 2,
        },
      ],
      B: [
        {
          exercise_id: '5bKGKjVwTG1pue4',
          sets: 4,
          reps: '8 a 10',
          time: '60s',
          load: 'Moderada/Pesada',
          notes: 'Puxador frente pegada aberta',
          order: 1,
        },
        {
          exercise_id: '76fjx3vNmMxfe1r',
          sets: 4,
          reps: '10',
          time: '60s',
          load: 'Pesada',
          notes: 'Leg press ou agachamento',
          order: 2,
        },
      ],
    },
  },
  {
    id: 'modelo-avancado-feminino',
    collectionId: 'local_templates',
    collectionName: 'training_sheets',
    student: '',
    title: 'Ficha Modelo - Alta Intensidade & Definição',
    notes: 'Descanso 45s. Métodos intensivos (Drop-set / Rest Pause na última série).',
    is_template: true,
    template_level: 'Avançado',
    template_gender: 'Feminino',
    start_date: new Date().toISOString(),
    is_archived: false,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    series_data: {
      A: [
        {
          exercise_id: '76fjx3vNmMxfe1r',
          sets: 4,
          reps: '8 a 10 + Rest Pause',
          time: '45-60s',
          load: 'Pesada',
          notes: 'Agachamento com controle de profundidade',
          order: 1,
        },
        {
          exercise_id: 'iQd0EsXVIYCXcNX',
          sets: 4,
          reps: '10 + 10 curtas',
          time: '45s',
          load: 'Pesada',
          notes: 'Elevação pélvica com pico de contração',
          order: 2,
        },
        {
          exercise_id: 'bUwjPrc0HSFDUaS',
          sets: 4,
          reps: '12 + Drop',
          time: '45s',
          load: 'Moderada',
          notes: 'Cadeira flexora ou extensora',
          order: 3,
        },
      ],
      B: [
        {
          exercise_id: '5bKGKjVwTG1pue4',
          sets: 4,
          reps: '10',
          time: '45s',
          load: 'Pesada',
          notes: 'Remada curvada halteres',
          order: 1,
        },
        {
          exercise_id: 'h9cZDV7cNP0yQmd',
          sets: 4,
          reps: '25',
          time: '30s',
          load: 'Com peso',
          notes: 'Abdominal infra declinado',
          order: 2,
        },
      ],
    },
  },
  {
    id: 'modelo-avancado-masculino',
    collectionId: 'local_templates',
    collectionName: 'training_sheets',
    student: '',
    title: 'Ficha Modelo - Força Máxima & Volume Alto',
    notes: 'Descanso 75-90s nos compostos. Foco em sobrecarga progressiva e técnica estrita.',
    is_template: true,
    template_level: 'Avançado',
    template_gender: 'Masculino',
    start_date: new Date().toISOString(),
    is_archived: false,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    series_data: {
      A: [
        {
          exercise_id: 'cTPSqmTKR36OdNr',
          sets: 5,
          reps: '6 a 8',
          time: '75s',
          load: 'Pesada',
          notes: 'Supino reto pesado',
          order: 1,
        },
        {
          exercise_id: '5bKGKjVwTG1pue4',
          sets: 5,
          reps: '6 a 8',
          time: '75s',
          load: 'Pesada',
          notes: 'Remada cavalinho ou curvada',
          order: 2,
        },
      ],
      B: [
        {
          exercise_id: '76fjx3vNmMxfe1r',
          sets: 5,
          reps: '6 a 8',
          time: '90s',
          load: 'Pesada',
          notes: 'Agachamento com alta intensidade',
          order: 1,
        },
        {
          exercise_id: 'bUwjPrc0HSFDUaS',
          sets: 4,
          reps: '10 a 12',
          time: '60s',
          load: 'Moderada',
          notes: 'Desenvolvimento militar',
          order: 2,
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
    // Retorna customizados primeiro e depois os padrão de fábrica
    return [...custom, ...DEFAULT_MODEL_SHEETS]
  },

  getTemplateById(id: string): TrainingSheet | undefined {
    return this.getAllTemplates().find((t) => t.id === id)
  },
}
