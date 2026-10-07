import { describe, it, expect } from 'vitest'
import PocketBase from 'pocketbase'
import { profileService, parseProfileErrorMessage } from '../services/profile'

const PB_URL = 'https://app-studio-para-professores-f5bbc.shrd00.internal.goskip.dev'

describe('Meu Perfil - Validação Completa de Alteração de Senha', () => {
  const ADMIN_EMAIL = 'moreiradiego.seven@gmail.com'
  const ADMIN_ORIGINAL_PASSWORD = 'Bru@Studio2026!'
  const ADMIN_TEMP_PASSWORD = 'TempAdminPassword2026!'

  it('valida mensagem amigável com senha atual errada e preserva a sessão intacta', async () => {
    const pbInstance = new PocketBase(PB_URL)
    pbInstance.autoCancellation(false)

    // 1. Log in as admin
    const auth = await pbInstance
      .collection('users')
      .authWithPassword(ADMIN_EMAIL, ADMIN_ORIGINAL_PASSWORD)

    expect(auth.token).toBeTruthy()
    expect(auth.record.email).toBe(ADMIN_EMAIL)
    expect(auth.record.role).toBe('admin')

    const originalToken = pbInstance.authStore.token
    expect(pbInstance.authStore.isValid).toBe(true)

    // 2. Tenta trocar com senha errada
    let caughtError: unknown = null
    try {
      await profileService.changePassword(
        auth.record.id,
        {
          oldPassword: 'SenhaCompletamenteIncorreta123!',
          password: 'NovaSenhaTesteValida2026!',
          passwordConfirm: 'NovaSenhaTesteValida2026!',
        },
        ADMIN_EMAIL,
      )
    } catch (err) {
      caughtError = err
    }

    expect(caughtError).not.toBeNull()
    const friendlyMessage = parseProfileErrorMessage(caughtError)
    expect(friendlyMessage).toBe('Senha atual incorreta. Por favor, verifique a senha digitada.')

    // 3. A sessão do usuário continua 100% válida (nunca redireciona / desloga)
    expect(pbInstance.authStore.isValid).toBe(true)
    expect(pbInstance.authStore.token).toBe(originalToken)
    expect(pbInstance.authStore.record?.email).toBe(ADMIN_EMAIL)
  })

  it('executa a troca de senha ponta a ponta para admin, reautentica e restaura Bru@Studio2026!', async () => {
    const pbInstance = new PocketBase(PB_URL)
    pbInstance.autoCancellation(false)

    // 1. Autentica inicialmente com a senha padrão
    const initialAuth = await pbInstance
      .collection('users')
      .authWithPassword(ADMIN_EMAIL, ADMIN_ORIGINAL_PASSWORD)

    expect(initialAuth.token).toBeTruthy()
    const userId = initialAuth.record.id

    try {
      // 2. Altera a senha para ADMIN_TEMP_PASSWORD
      const updateResult = await profileService.changePassword(
        userId,
        {
          oldPassword: ADMIN_ORIGINAL_PASSWORD,
          password: ADMIN_TEMP_PASSWORD,
          passwordConfirm: ADMIN_TEMP_PASSWORD,
        },
        ADMIN_EMAIL,
      )
      expect(updateResult.id).toBe(userId)

      // 3. Simula o comportamento do ProfilePage: reautentica no authStore para atualizar token
      const reauthResult = await pbInstance
        .collection('users')
        .authWithPassword(ADMIN_EMAIL, ADMIN_TEMP_PASSWORD)

      expect(reauthResult.token).toBeTruthy()
      expect(pbInstance.authStore.isValid).toBe(true)
      expect(pbInstance.authStore.record?.email).toBe(ADMIN_EMAIL)
    } finally {
      // 4. SEMPRE restaura a senha original Bru@Studio2026! para o admin
      const restoreClient = new PocketBase(PB_URL)
      restoreClient.autoCancellation(false)

      // Identifica com qual senha o admin está no momento (se temp ou original)
      let currentPass = ADMIN_TEMP_PASSWORD
      try {
        await restoreClient.collection('users').authWithPassword(ADMIN_EMAIL, ADMIN_TEMP_PASSWORD)
      } catch {
        currentPass = ADMIN_ORIGINAL_PASSWORD
        await restoreClient
          .collection('users')
          .authWithPassword(ADMIN_EMAIL, ADMIN_ORIGINAL_PASSWORD)
      }

      if (currentPass !== ADMIN_ORIGINAL_PASSWORD) {
        await profileService.changePassword(
          userId,
          {
            oldPassword: ADMIN_TEMP_PASSWORD,
            password: ADMIN_ORIGINAL_PASSWORD,
            passwordConfirm: ADMIN_ORIGINAL_PASSWORD,
          },
          ADMIN_EMAIL,
        )
      }
    }

    // 5. Confirmação final definitiva: login com Bru@Studio2026! funciona perfeitamente
    const finalVerification = new PocketBase(PB_URL)
    finalVerification.autoCancellation(false)
    const finalAuth = await finalVerification
      .collection('users')
      .authWithPassword(ADMIN_EMAIL, ADMIN_ORIGINAL_PASSWORD)

    expect(finalAuth.token).toBeTruthy()
    expect(finalAuth.record.email).toBe(ADMIN_EMAIL)
    expect(finalAuth.record.role).toBe('admin')
  })
})
