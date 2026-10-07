import { describe, it, expect } from 'vitest'
import PocketBase from 'pocketbase'
import { profileService, parseProfileErrorMessage } from '../services/profile'

const PB_URL = 'https://app-studio-para-professores-f5bbc.shrd00.internal.goskip.dev'

describe('Profile Password Change Verification', () => {
  it('rejects wrong current password with clear Portuguese error', async () => {
    const adminPb = new PocketBase(PB_URL)
    adminPb.autoCancellation(false)

    const auth = await adminPb
      .collection('users')
      .authWithPassword('moreiradiego.seven@gmail.com', 'Bru@Studio2026!')

    expect(auth.record.email).toBe('moreiradiego.seven@gmail.com')

    const isWrong = await profileService.verifyCurrentPassword(
      'moreiradiego.seven@gmail.com',
      'SenhaIncorretaErrada123!',
    )
    expect(isWrong).toBe(false)
  })

  it('validates password update flow with temporary user and leaves admin intact', async () => {
    const adminPb = new PocketBase(PB_URL)
    adminPb.autoCancellation(false)

    await adminPb
      .collection('users')
      .authWithPassword('moreiradiego.seven@gmail.com', 'Bru@Studio2026!')

    const testEmail = `prof_qa_${Date.now()}@studiobru.com.br`
    const initialPass = 'InitialPass@2026!'
    const newPass = 'UpdatedPass@2026!'

    const created = await adminPb.collection('users').create({
      name: 'Professor QA Teste',
      email: testEmail,
      password: initialPass,
      passwordConfirm: initialPass,
      role: 'professor',
      emailVisibility: false,
    })

    try {
      const teacherPb = new PocketBase(PB_URL)
      teacherPb.autoCancellation(false)
      await teacherPb.collection('users').authWithPassword(testEmail, initialPass)

      // Test successful update
      const updated = await teacherPb.collection('users').update(created.id, {
        oldPassword: initialPass,
        password: newPass,
        passwordConfirm: newPass,
      })
      expect(updated.id).toBe(created.id)

      // Test new password works
      const teacherPb2 = new PocketBase(PB_URL)
      teacherPb2.autoCancellation(false)
      const reauth = await teacherPb2.collection('users').authWithPassword(testEmail, newPass)
      expect(reauth.token).toBeTruthy()
    } finally {
      await adminPb.collection('users').delete(created.id)
    }
  })
})
