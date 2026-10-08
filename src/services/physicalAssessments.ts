import pb from '@/lib/pocketbase/client'
import { type PhysicalAssessment, type PhysicalAssessmentData } from '@/types'

export interface CreateAssessmentDTO {
  student: string
  date: string
  sex?: 'M' | 'F'
  data: PhysicalAssessmentData
}

export interface UpdateAssessmentDTO {
  date?: string
  sex?: 'M' | 'F'
  data?: PhysicalAssessmentData
}

export const physicalAssessmentsService = {
  /**
   * Lista todas as avaliações de um aluno, ordenadas cronologicamente
   */
  async getByStudent(studentId: string): Promise<PhysicalAssessment[]> {
    if (!studentId) return []
    try {
      const records = await pb.collection('physical_assessments').getFullList<PhysicalAssessment>({
        filter: `student = "${studentId}"`,
        sort: 'date,created',
        requestKey: null,
      })
      return records
    } catch (err) {
      console.error('Erro ao buscar avaliações físicas do aluno:', err)
      return []
    }
  },

  /**
   * Busca uma avaliação física específica
   */
  async getById(id: string): Promise<PhysicalAssessment> {
    return pb.collection('physical_assessments').getOne<PhysicalAssessment>(id, {
      requestKey: null,
    })
  },

  /**
   * Cria uma nova avaliação física para o aluno
   */
  async create(dto: CreateAssessmentDTO): Promise<PhysicalAssessment> {
    return pb.collection('physical_assessments').create<PhysicalAssessment>(dto)
  },

  /**
   * Atualiza uma avaliação física existente
   */
  async update(id: string, dto: UpdateAssessmentDTO): Promise<PhysicalAssessment> {
    return pb.collection('physical_assessments').update<PhysicalAssessment>(id, dto)
  },

  /**
   * Exclui uma avaliação física
   */
  async delete(id: string): Promise<boolean> {
    await pb.collection('physical_assessments').delete(id)
    return true
  },
}
