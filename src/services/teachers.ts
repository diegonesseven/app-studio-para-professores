import pb from '@/lib/pocketbase/client'
import type { User, UserRole } from '@/types'
import { sanitizeText } from '@/lib/validation'

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
  oldPassword?: string
}

export function parseTeacherErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (
      err as {
        response?: {
          message?: string
          data?: Record<string, { code?: string; message?: string } | string>
        }
      }
    ).response
    if (response?.data && Object.keys(response.data).length > 0) {
      const getFieldMsg = (val: { code?: string; message?: string } | string | undefined) => {
        if (!val) return ''
        if (typeof val === 'string') return val
        return val.message || ''
      }

      const oldPasswordMsg = getFieldMsg(response.data.oldPassword)
      if (oldPasswordMsg) {
        return 'Senha atual incorreta. Por favor, verifique a senha digitada.'
      }

      const emailMsg = getFieldMsg(response.data.email)
      if (emailMsg) {
        const msg = emailMsg.toLowerCase()
        if (msg.includes('unique') || msg.includes('exists') || msg.includes('já')) {
          return 'Este e-mail já está cadastrado no sistema.'
        }
        return `E-mail: ${emailMsg}`
      }

      const passwordMsg = getFieldMsg(response.data.password)
      if (passwordMsg) {
        if (
          passwordMsg.toLowerCase().includes('least') ||
          passwordMsg.toLowerCase().includes('min')
        ) {
          return 'A nova senha deve ter no mínimo 8 caracteres.'
        }
        return `Senha: ${passwordMsg}`
      }

      const passwordConfirmMsg = getFieldMsg(response.data.passwordConfirm)
      if (passwordConfirmMsg) {
        return 'A confirmação de senha não confere.'
      }

      const nameMsg = getFieldMsg(response.data.name)
      if (nameMsg) {
        return `Nome: ${nameMsg}`
      }

      // Retornar a primeira mensagem de erro de campo encontrada
      const firstField = Object.values(response.data)[0]
      const firstMsg = getFieldMsg(firstField)
      if (firstMsg) {
        return firstMsg
      }
    }
    if (response?.message) {
      const lower = response.message.toLowerCase()
      if (
        lower.includes('old password') ||
        lower.includes('oldpassword') ||
        lower.includes('cannot set password without oldpassword')
      ) {
        return 'Senha atual incorreta. Por favor, verifique a senha digitada.'
      }
      return response.message
    }
  }
  if (err instanceof Error) {
    const lower = err.message.toLowerCase()
    if (
      lower.includes('old password') ||
      lower.includes('oldpassword') ||
      lower.includes('cannot set password without oldpassword')
    ) {
      return 'Senha atual incorreta. Por favor, verifique a senha digitada.'
    }
    if (lower.includes('unique') || lower.includes('already')) {
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
   * Cadastra um novo professor com senha definida pelo admin
   */
  async create(data: CreateTeacherDTO): Promise<User> {
    const payload = {
      name: sanitizeText(data.name),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      passwordConfirm: data.passwordConfirm,
      role: data.role || 'professor',
      emailVisibility: false,
    }
    return pb.collection('users').create<User>(payload)
  },

  /**
   * Atualiza dados de um professor (nome, email, papel ou redefinição de senha)
   */
  async update(id: string, data: UpdateTeacherDTO): Promise<User> {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = sanitizeText(data.name)
    if (data.email !== undefined) payload.email = data.email.trim().toLowerCase()
    if (data.role !== undefined) payload.role = data.role
    if (data.password) {
      payload.password = data.password
      payload.passwordConfirm = data.passwordConfirm || data.password
      if (data.oldPassword) {
        payload.oldPassword = data.oldPassword
      }
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
