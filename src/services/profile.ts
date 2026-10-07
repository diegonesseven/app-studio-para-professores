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
      err as { response?: { message?: string; data?: Record<string, { message?: string }> } }
    ).response
    if (response?.data && Object.keys(response.data).length > 0) {
      if (response.data.oldPassword?.message) {
        return 'Senha atual incorreta. Verifique e tente novamente.'
      }
      if (response.data.password?.message) {
        return `Nova senha: ${response.data.password.message}`
      }
      if (response.data.passwordConfirm?.message) {
        return 'A confirmação de senha não confere.'
      }
      if (response.data.email?.message) {
        const msg = response.data.email.message.toLowerCase()
        if (msg.includes('unique') || msg.includes('exists') || msg.includes('já')) {
          return 'Este e-mail já está em uso por outro usuário.'
        }
        return `E-mail: ${response.data.email.message}`
      }
      if (response.data.name?.message) {
        return `Nome: ${response.data.name.message}`
      }
      const firstField = Object.values(response.data)[0]
      if (firstField?.message) {
        return firstField.message
      }
    }
    if (response?.message) {
      if (
        response.message.toLowerCase().includes('fail') &&
        response.message.toLowerCase().includes('authenticate')
      ) {
        return 'Senha atual incorreta.'
      }
      return response.message
    }
  }
  if (err instanceof Error) {
    if (
      err.message.toLowerCase().includes('old password') ||
      err.message.toLowerCase().includes('oldpassword')
    ) {
      return 'Senha atual incorreta. Verifique e tente novamente.'
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
   * Altera a própria senha exigindo a confirmação da senha atual (oldPassword)
   */
  async changePassword(userId: string, data: ChangePasswordDTO): Promise<User> {
    const payload = {
      oldPassword: data.oldPassword,
      password: data.password,
      passwordConfirm: data.passwordConfirm,
    }
    const record = await pb.collection('users').update<User>(userId, payload)
    return record
  },
}
