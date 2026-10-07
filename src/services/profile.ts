import pb from '@/lib/pocketbase/client'
import type { User } from '@/types'

export interface UpdateProfileDTO {
  name: string
  avatar?: File | null
}

export interface ChangePasswordDTO {
  oldPassword: string
  password: string
  passwordConfirm: string
}

export function parseProfileErrorMessage(err: unknown): string {
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
        return 'Senha atual incorreta. Verifique a senha informada e tente novamente.'
      }

      const passwordMsg = getFieldMsg(response.data.password)
      if (passwordMsg) {
        if (
          passwordMsg.toLowerCase().includes('least') ||
          passwordMsg.toLowerCase().includes('min')
        ) {
          return 'A nova senha deve ter no mínimo 8 caracteres.'
        }
        return `Nova senha: ${passwordMsg}`
      }

      const passwordConfirmMsg = getFieldMsg(response.data.passwordConfirm)
      if (passwordConfirmMsg) {
        return 'A confirmação de senha não confere. Digite a mesma senha nos dois campos.'
      }

      const emailMsg = getFieldMsg(response.data.email)
      if (emailMsg) {
        const lower = emailMsg.toLowerCase()
        if (lower.includes('unique') || lower.includes('exists') || lower.includes('já')) {
          return 'Este e-mail já está em uso por outro usuário.'
        }
        return `E-mail: ${emailMsg}`
      }

      const nameMsg = getFieldMsg(response.data.name)
      if (nameMsg) {
        return `Nome: ${nameMsg}`
      }

      const firstVal = Object.values(response.data)[0]
      const firstMsg = getFieldMsg(firstVal)
      if (firstMsg) {
        return firstMsg
      }
    }

    if (response?.message) {
      const lower = response.message.toLowerCase()
      if (lower.includes('old password') || lower.includes('oldpassword')) {
        return 'Senha atual incorreta. Verifique a senha informada e tente novamente.'
      }
      if (lower.includes('failed to update record')) {
        return 'Falha ao alterar senha. Verifique se sua senha atual está correta.'
      }
      if (lower.includes('fail') && lower.includes('authenticate')) {
        return 'Senha atual incorreta.'
      }
      return response.message
    }
  }

  if (err instanceof Error) {
    const lower = err.message.toLowerCase()
    if (lower.includes('old password') || lower.includes('oldpassword')) {
      return 'Senha atual incorreta. Verifique a senha informada e tente novamente.'
    }
    if (lower.includes('failed to update record')) {
      return 'Falha ao alterar senha. Verifique se sua senha atual está correta.'
    }
    return err.message
  }

  return 'Ocorreu um erro ao atualizar os dados do perfil.'
}

export const profileService = {
  /**
   * Atualiza informações básicas do perfil (nome, avatar) do usuário logado
   */
  async updateProfile(userId: string, data: UpdateProfileDTO): Promise<User> {
    const formData = new FormData()
    formData.append('name', data.name.trim())
    if (data.avatar) {
      formData.append('avatar', data.avatar)
    }

    const record = await pb.collection('users').update<User>(userId, formData)
    return record
  },

  /**
   * Solicita alteração de e-mail (PocketBase envia e-mail de confirmação para o novo endereço)
   */
  async requestEmailChange(newEmail: string): Promise<boolean> {
    await pb.collection('users').requestEmailChange(newEmail.trim().toLowerCase())
    return true
  },

  /**
   * Valida as credenciais atuais do usuário antes da alteração
   */
  async verifyCurrentPassword(email: string, currentPass: string): Promise<boolean> {
    // Tenta autenticar temporariamente para confirmar se a senha atual está correta
    // Usa uma instância limpa sem alterar o authStore principal da sessão do app
    const tempPb = new (pb.constructor as any)(pb.baseUrl)
    tempPb.autoCancellation(false)
    try {
      await tempPb.collection('users').authWithPassword(email.trim().toLowerCase(), currentPass)
      return true
    } catch {
      return false
    }
  },

  /**
   * Altera a própria senha exigindo a confirmação da senha atual (oldPassword)
   */
  async changePassword(userId: string, data: ChangePasswordDTO, userEmail?: string): Promise<User> {
    // 1. Se o email estiver disponível (ou no authStore atual), valida a senha atual previamente
    // para fornecer mensagem clara e amigável em português caso o usuário tenha errado a senha
    const targetEmail = userEmail || (pb.authStore.record?.email as string | undefined)
    if (targetEmail) {
      const isValid = await this.verifyCurrentPassword(targetEmail, data.oldPassword)
      if (!isValid) {
        throw new Error('Senha atual incorreta. Por favor, verifique a senha digitada.')
      }
    }

    // 2. Realiza o update no PocketBase enviando oldPassword, password e passwordConfirm
    const payload = {
      oldPassword: data.oldPassword,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
    }

    const record = await pb.collection('users').update<User>(userId, payload)
    return record
  },
}
