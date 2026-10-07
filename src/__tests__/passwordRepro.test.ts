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
    const adminId = authData.record.id

    // 2. Attempt password change with wrong old password
    try {
      await profileService.changePassword(
        adminId,
        {
          oldPassword: 'IncorrectOldPassword123!',
          password: TEMP_PASSWORD,
          passwordConfirm: TEMP_PASSWORD,
        },
        ADMIN_EMAIL,
      )
      expect.fail('Should have failed with wrong current password')
    } catch (err: any) {
      const msg = parseProfileErrorMessage(err)
      expect(msg).toBe('Senha atual incorreta. Por favor, verifique a senha digitada.')
    }

    // 3. Change to temporary password with valid current password
    try {
      const updateResult = await profileService.changePassword(
        adminId,
        {
          oldPassword: ORIGINAL_PASSWORD,
          password: TEMP_PASSWORD,
          passwordConfirm: TEMP_PASSWORD,
        },
        ADMIN_EMAIL,
      )
      expect(updateResult.id).toBe(adminId)

      // 4. Verify login works with the new temporary password
      const tempAuth = await pb.collection('users').authWithPassword(ADMIN_EMAIL, TEMP_PASSWORD)
      expect(tempAuth.token).toBeTruthy()
      expect(tempAuth.record.email).toBe(ADMIN_EMAIL)

      // 5. Verify old password no longer works while temporary is active
      await expect(
        pb.collection('users').authWithPassword(ADMIN_EMAIL, ORIGINAL_PASSWORD),
      ).rejects.toThrow()
    } finally {
      // 6. ALWAYS restore original password Bru@Studio2026!
      // Authenticate with temp password if needed
      try {
        await pb.collection('users').authWithPassword(ADMIN_EMAIL, TEMP_PASSWORD)
      } catch (_) {
        // If already original password, keep moving
      }

      const restoreResult = await profileService.changePassword(
        adminId,
        {
          oldPassword: TEMP_PASSWORD,
          password: ORIGINAL_PASSWORD,
          passwordConfirm: ORIGINAL_PASSWORD,
        },
        ADMIN_EMAIL,
      )
      expect(restoreResult.id).toBe(adminId)

      // 7. Verify login with original password Bru@Studio2026! succeeds
      const finalAuth = await pb
        .collection('users')
        .authWithPassword(ADMIN_EMAIL, ORIGINAL_PASSWORD)
      expect(finalAuth.token).toBeTruthy()
      expect(finalAuth.record.email).toBe(ADMIN_EMAIL)
      expect(finalAuth.record.role).toBe('admin')
    }
  })
})
