import pb from '@/lib/pocketbase/client'
import type { User, UserRole } from '@/types'

export interface CreateTeacherDTO {
  name: string
  email: string
  password: string
  passwordConfirm: string
  role?: UserRole
}

export interface UpdateTeacherDTO {
  name?: string
  email?: string
  role?: UserRole
  password?: string
  passwordConfirm?: string
}

export function parseTeacherErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: Record<string, { message?: string }> } })
      .response
    if (response?.data) {
      if (response.data.email?.message) {
        const msg = response.data.email.message.toLowerCase()
        if (msg.includes('unique') || msg.includes('exists') || msg.includes('já')) {
          return 'Este e-mail já está cadastrado no sistema.'
        }
        return `E-mail: ${response.data.email.message}`
      }
      if (response.data.password?.message) {
        return `Senha: ${response.data.password.message}`
      }
      if (response.data.passwordConfirm?.message) {
        return 'A confirmação de senha não confere.'
      }
      if (response.data.name?.message) {
        return `Nome: ${response.data.name.message}`
      }
    }
  }
  if (err instanceof Error) {
    if (
      err.message.toLowerCase().includes('unique') ||
      err.message.toLowerCase().includes('already')
    ) {
      return 'Este e-mail já está cadastrado no sistema.'
    }
    return err.message
  }
  return 'Ocorreu um erro inesperado ao salvar o professor.'
}

export const teachersService = {
  /**
   * Lista todos os professores (ou todos os usuários caso admin queira ver status)
   */
  async getAll(filterRole: 'all' | 'professor' | 'admin' = 'all'): Promise<User[]> {
    let filter = ''
    if (filterRole === 'professor') {
      filter = 'role = "professor"'
    } else if (filterRole === 'admin') {
      filter = 'role = "admin"'
    }

    const records = await pb.collection('users').getFullList<User>({
      sort: 'name',
      filter: filter || undefined,
    })
    return records
  },

  async getById(id: string): Promise<User> {
    return pb.collection('users').getOne<User>(id)
  },

  /**
   * Cadastra um novo professor com senha e email já verificado
   */
  async create(data: CreateTeacherDTO): Promise<User> {
    const payload = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      passwordConfirm: data.passwordConfirm,
      role: data.role || 'professor',
      emailVisibility: false,
      verified: true,
    }
    return pb.collection('users').create<User>(payload)
  },

  /**
   * Atualiza dados de um professor (nome, email, papel ou redefinição de senha)
   */
  async update(id: string, data: UpdateTeacherDTO): Promise<User> {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name.trim()
    if (data.email !== undefined) payload.email = data.email.trim().toLowerCase()
    if (data.role !== undefined) payload.role = data.role
    if (data.password) {
      payload.password = data.password
      payload.passwordConfirm = data.passwordConfirm || data.password
    }

    return pb.collection('users').update<User>(id, payload)
  },

  /**
   * Remove o acesso/exclui o professor
   */
  async delete(id: string): Promise<boolean> {
    return pb.collection('users').delete(id)
  },

  /**
   * Envia e-mail de redefinição de senha para o endereço do professor
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    return pb.collection('users').requestPasswordReset(email.trim().toLowerCase())
  },
}
