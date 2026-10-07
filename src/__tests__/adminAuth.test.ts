import { describe, it, expect } from 'vitest'
import PocketBase from 'pocketbase'

describe('Admin Authentication', () => {
  it('should authenticate successfully with the new password', async () => {
    const pbUrl = 'https://app-studio-para-professores-f5bbc.shrd00.internal.goskip.dev'
    const pb = new PocketBase(pbUrl)
    pb.autoCancellation(false)

    const authData = await pb
      .collection('users')
      .authWithPassword('moreiradiego.seven@gmail.com', 'Bru@Studio2026!')

    expect(authData.token).toBeTruthy()
    expect(authData.record.email).toBe('moreiradiego.seven@gmail.com')
    expect(authData.record.role).toBe('admin')
    expect(authData.record.verified).toBe(true)
  })

  it('should reject authentication with the old password', async () => {
    const pbUrl = 'https://app-studio-para-professores-f5bbc.shrd00.internal.goskip.dev'
    const pb = new PocketBase(pbUrl)
    pb.autoCancellation(false)

    await expect(
      pb.collection('users').authWithPassword('moreiradiego.seven@gmail.com', 'Skip@Pass'),
    ).rejects.toThrow()
  })
})
