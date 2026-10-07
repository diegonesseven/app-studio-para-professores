import { describe, it, expect } from 'vitest'
import PocketBase from 'pocketbase'

const PB_URL = 'https://app-studio-para-professores-f5bbc.shrd00.internal.goskip.dev'

describe('Teacher lifecycle and teacher profile password update', () => {
  it('creates teacher as admin, verifies teacher login, tests teacher password update with oldPassword, and cleans up', async () => {
    const adminPb = new PocketBase(PB_URL)
    adminPb.autoCancellation(false)

    // 1. Admin login
    const adminAuth = await adminPb
      .collection('users')
      .authWithPassword('moreiradiego.seven@gmail.com', 'Bru@Studio2026!')

    expect(adminAuth.record.role).toBe('admin')

    // 2. Admin creates teacher
    const testTeacherEmail = `prof_flow_${Date.now()}@studiobru.com.br`
    const initialPassword = 'InitialPass@2026!'
    const newPassword = 'NewSecretPass@2026!'

    const createdTeacher = await adminPb.collection('users').create({
      name: 'Professor Teste Fluxo',
      email: testTeacherEmail,
      password: initialPassword,
      passwordConfirm: initialPassword,
      role: 'professor',
      emailVisibility: false,
    })

    expect(createdTeacher.id).toBeTruthy()
    expect(createdTeacher.email).toBe(testTeacherEmail)
    expect(createdTeacher.role).toBe('professor')

    try {
      // 3. Teacher logs in with initial password
      const teacherPb = new PocketBase(PB_URL)
      teacherPb.autoCancellation(false)

      const teacherAuth = await teacherPb
        .collection('users')
        .authWithPassword(testTeacherEmail, initialPassword)

      expect(teacherAuth.token).toBeTruthy()
      expect(teacherAuth.record.role).toBe('professor')

      // 4. Teacher tries to change password with WRONG oldPassword -> should fail
      await expect(
        teacherPb.collection('users').update(teacherAuth.record.id, {
          oldPassword: 'WrongPassword123!',
          password: newPassword,
          passwordConfirm: newPassword,
        }),
      ).rejects.toThrow()

      // 5. Teacher changes password with CORRECT oldPassword -> succeeds
      const updatedUser = await teacherPb.collection('users').update(teacherAuth.record.id, {
        oldPassword: initialPassword,
        password: newPassword,
        passwordConfirm: newPassword,
      })
      expect(updatedUser.id).toBe(createdTeacher.id)

      // 6. Verify teacher can now log in with NEW password
      const teacherPb2 = new PocketBase(PB_URL)
      teacherPb2.autoCancellation(false)

      const reauth = await teacherPb2
        .collection('users')
        .authWithPassword(testTeacherEmail, newPassword)

      expect(reauth.token).toBeTruthy()
      expect(reauth.record.email).toBe(testTeacherEmail)

      // 7. Old password no longer works
      const teacherPb3 = new PocketBase(PB_URL)
      teacherPb3.autoCancellation(false)
      await expect(
        teacherPb3.collection('users').authWithPassword(testTeacherEmail, initialPassword),
      ).rejects.toThrow()

      // 8. Test admin updating admin own password
      // First with wrong old password
      try {
        await adminPb.collection('users').update(adminAuth.record.id, {
          oldPassword: 'WrongAdminPassword123!',
          password: 'Bru@Studio2026!',
          passwordConfirm: 'Bru@Studio2026!',
        })
        expect.fail('Should have failed with wrong oldPassword')
      } catch (err: any) {
        expect(err.status).toBe(400)
      }

      // Now test with correct old password (keeping same password Bru@Studio2026!)
      const adminUpdated = await adminPb.collection('users').update(adminAuth.record.id, {
        oldPassword: 'Bru@Studio2026!',
        password: 'Bru@Studio2026!',
        passwordConfirm: 'Bru@Studio2026!',
      })
      expect(adminUpdated.id).toBe(adminAuth.record.id)
    } finally {
      // 9. Cleanup teacher created during test
      await adminPb.collection('users').delete(createdTeacher.id)
    }  })
})
