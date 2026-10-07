import { describe, it } from 'vitest'
import pb from '../lib/pocketbase/client'

describe('Direct PATCH reproduction with admin', () => {
  it('authenticates and captures exact response on PATCH /api/collections/users/records/d449r1r4wnzlcvp', async () => {
    const authData = await pb
      .collection('users')
      .authWithPassword('moreiradiego.seven@gmail.com', 'Bru@Studio2026!')
    console.log('AUTH OK:', authData.record.id, authData.record.email, authData.record.role)

    try {
      const res = await pb.collection('users').update(authData.record.id, {
        oldPassword: 'Bru@Studio2026!',
        password: 'Bru@Studio2026!Test',
        passwordConfirm: 'Bru@Studio2026!Test',
      })
      console.log('PATCH SUCCEEDED?!', res)
    } catch (err: any) {
      const errDetail = {
        status: err?.status,
        message: err?.message,
        data: err?.data,
        response: err?.response,
      }
      throw new Error(`PATCH_FAILED: ${JSON.stringify(errDetail)}`)
    }
  })
})
