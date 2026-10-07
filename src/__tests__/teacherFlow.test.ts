import { describe, it, expect } from 'vitest'
import PocketBase from 'pocketbase'

const PB_URL = 'https://app-studio-para-professores-f5bbc.shrd00.internal.goskip.dev'

describe('Teacher lifecycle and login', () => {
  it('creates a teacher as admin, verifies teacher can login immediately with role professor, then cleans up', async () => {
    const adminPb = new PocketBase(PB_URL)
    adminPb.autoCancellation(false)

    // 1. Admin login
    await adminPb
      .collection('users')
      .authWithPassword('moreiradiego.seven@gmail.com', 'Bru@Studio2026!')

    expect(adminPb.authStore.record?.role).toBe('admin')

    // 2. Admin creates teacher without 'verified' in payload
    const testTeacherEmail = `prof_test_${Date.now()}@studiobru.com.br`
    const testTeacherPassword = 'Professor@2026!'

    const createdRecord = await adminPb.collection('users').create({
      name: 'Professor Teste Automatizado',
      email: testTeacherEmail,
      password: testTeacherPassword,
      passwordConfirm: testTeacherPassword,
      role: 'professor',
      emailVisibility: false,
    })

    expect(createdRecord.id).toBeTruthy()
    expect(createdRecord.email).toBe(testTeacherEmail)
    expect(createdRecord.role).toBe('professor')

    // 3. New teacher logs in immediately
    const teacherPb = new PocketBase(PB_URL)
    teacherPb.autoCancellation(false)

    const teacherAuth = await teacherPb
      .collection('users')
      .authWithPassword(testTeacherEmail, testTeacherPassword)

    expect(teacherAuth.token).toBeTruthy()
    expect(teacherAuth.record.email).toBe(testTeacherEmail)
    expect(teacherAuth.record.role).toBe('professor')

    // 4. Verify teacher can query students collection
    const students = await teacherPb.collection('students').getList(1, 5)
    expect(Array.isArray(students.items)).toBe(true)

    // 5. Cleanup as admin
    await adminPb.collection('users').delete(createdRecord.id)
  })
})
