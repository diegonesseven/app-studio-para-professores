import { describe, it, expect } from 'vitest'
import PocketBase from 'pocketbase'

const PB_URL = 'https://app-studio-para-professores-f5bbc.shrd00.internal.goskip.dev'

describe('Verify teacher creation failure reason', () => {
  it('tries to create user with verified: true vs without verified', async () => {
    const adminPb = new PocketBase(PB_URL)
    adminPb.autoCancellation(false)

    // Login as admin
    await adminPb
      .collection('users')
      .authWithPassword('moreiradiego.seven@gmail.com', 'Bru@Studio2026!')

    // Try payload WITH verified: true (as currently in teachers.ts)
    const testEmail1 = `test_verified_${Date.now()}@example.com`
    let verifiedError: unknown = null
    try {
      await adminPb.collection('users').create({
        name: 'Test Verified',
        email: testEmail1,
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        role: 'professor',
        emailVisibility: false,
        verified: true,
      })
    } catch (err) {
      verifiedError = err
    }

    console.log(
      'Error with verified: true ->',
      JSON.stringify((verifiedError as any)?.response || verifiedError),
    )

    // Try payload WITHOUT verified (or what works)
    const testEmail2 = `test_noverified_${Date.now()}@example.com`
    let noVerifiedError: unknown = null
    let createdRecord: any = null
    try {
      createdRecord = await adminPb.collection('users').create({
        name: 'Test No Verified',
        email: testEmail2,
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        role: 'professor',
      })
    } catch (err) {
      noVerifiedError = err
    }

    console.log(
      'Error without verified ->',
      JSON.stringify((noVerifiedError as any)?.response || noVerifiedError),
    )
    console.log('Created record ->', createdRecord?.id, createdRecord?.email)

    // Cleanup created record if any
    if (createdRecord?.id) {
      await adminPb.collection('users').delete(createdRecord.id)
    }

    expect(createdRecord).toBeTruthy()
  })
})
