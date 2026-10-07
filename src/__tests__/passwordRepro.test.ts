import { describe, it, expect } from 'vitest'
import pb from '../lib/pocketbase/client'
import { profileService, parseProfileErrorMessage } from '../services/profile'

describe('Admin Password Change End-to-End Verification', () => {
  const ADMIN_EMAIL = 'moreiradiego.seven@gmail.com'
  const ORIGINAL_PASSWORD = 'Bru@Studio2026!'
  const TEMP_PASSWORD = 'TemporaryBruPass2026!'

  it('verifies rejection on wrong password, changes to temporary password, logs in with temporary, and restores Bru@Studio2026!', async () => {
    // 1. Authenticate as admin with original password
    const authData = await pb.collection('users').authWithPassword(ADMIN_EMAIL, ORIGINAL_PASSWORD)

    expect(authData.token).toBeTruthy()
    expect(authData.record.role).toBe('admin')
    expect(authData.record.email).toBe(ADMIN_EMAIL)

    // Test invalid old password through profileService
    await expect(
      profileService.changePassword(
        authData.record.id,
        {
          oldPassword: 'WrongPassword123!',
          password: TEMP_PASSWORD,
          passwordConfirm: TEMP_PASSWORD,
        },
        ADMIN_EMAIL,
      ),
    ).rejects.toThrow('Senha atual incorreta. Por favor, verifique a senha digitada.')

    // Ensure session is STILL valid after rejection
    expect(pb.authStore.isValid).toBe(true)
    expect(pb.authStore.record?.email).toBe(ADMIN_EMAIL)

    // Agora testa a troca COMPLETA de senha no perfil:
    // 1. Troca para TEMP_PASSWORD
    const changed = await profileService.changePassword(
      authData.record.id,
      {
        oldPassword: ORIGINAL_PASSWORD,
        password: TEMP_PASSWORD,
        passwordConfirm: TEMP_PASSWORD,
      },
      ADMIN_EMAIL,
    )
    expect(changed.id).toBe(authData.record.id)

    // 2. Re-autentica com TEMP_PASSWORD
    const reauthTemp = await pb.collection('users').authWithPassword(ADMIN_EMAIL, TEMP_PASSWORD)
    expect(reauthTemp.token).toBeTruthy()
    expect(reauthTemp.record.email).toBe(ADMIN_EMAIL)

    // 3. Imediatamente restaura a senha ORIGINAL (Bru@Studio2026!)
    const restored = await profileService.changePassword(
      authData.record.id,
      {
        oldPassword: TEMP_PASSWORD,
        password: ORIGINAL_PASSWORD,
        passwordConfirm: ORIGINAL_PASSWORD,
      },
      ADMIN_EMAIL,
    )
    expect(restored.id).toBe(authData.record.id)

    // 4. Confirma que a senha original Bru@Studio2026! funciona perfeitamente
    const finalAuth = await pb.collection('users').authWithPassword(ADMIN_EMAIL, ORIGINAL_PASSWORD)
    expect(finalAuth.token).toBeTruthy()
    expect(finalAuth.record.email).toBe(ADMIN_EMAIL)
    expect(finalAuth.record.role).toBe('admin')
  })
})
