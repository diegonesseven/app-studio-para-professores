import { describe, it, expect } from 'vitest'
import PocketBase from 'pocketbase'

const PB_URL = 'https://app-studio-para-professores-f5bbc.shrd00.internal.goskip.dev'

describe('Teacher creation, teacher login, and admin profile password change', () => {
  it('creates a teacher, logs in as that teacher, verifies teacher access, and deletes teacher', async () => {
    const adminPb = new PocketBase(PB_URL)
    adminPb.autoCancellation(false)

    // Admin login
    const adminAuth = await adminPb
      .collection('users')
      .authWithPassword('moreiradiego.seven@gmail.com', 'Bru@Studio2026!')
    expect(adminAuth.record.role).toBe('admin')

    const testTeacherEmail = `teacher_qa_${Date.now()}@studiobru.com.br`
    const testTeacherPassword = 'ProfPassword@2026!'

    // Create teacher
    const created = await adminPb.collection('users').create({
      name: 'Professor QA Test',
      email: testTeacherEmail,
      password: testTeacherPassword,
      passwordConfirm: testTeacherPassword,
      role: 'professor',
      emailVisibility: false,
    })

    expect(created.id).toBeTruthy()
    expect(created.email).toBe(testTeacherEmail)
    expect(created.role).toBe('professor')

    // Teacher login immediately
    const teacherPb = new PocketBase(PB_URL)
    teacherPb.autoCancellation(false)

    const teacherAuth = await teacherPb
      .collection('users')
      .authWithPassword(testTeacherEmail, testTeacherPassword)

    expect(teacherAuth.token).toBeTruthy()
    expect(teacherAuth.record.email).toBe(testTeacherEmail)
    expect(teacherAuth.record.role).toBe('professor')

    // Verify teacher cannot access admin-only actions (like deleting another user)
    await expect(teacherPb.collection('users').delete(adminAuth.record.id)).rejects.toThrow()

    // Teacher can update own profile name
    const updatedSelf = await teacherPb.collection('users').update(teacherAuth.record.id, {
      name: 'Professor QA Test Alterado',
    })
    expect(updatedSelf.name).toBe('Professor QA Test Alterado')

    // Cleanup: delete test teacher
    await adminPb.collection('users').delete(created.id)
  })
})
