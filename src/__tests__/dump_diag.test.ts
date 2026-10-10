import { describe, it } from 'vitest'
import pb from '@/lib/pocketbase/client'
import fs from 'fs'

describe('dump exercises to file', () => {
  it('dumps all exercises', async () => {
    await pb.collection('users').authWithPassword('moreiradiego.seven@gmail.com', 'Bru@Studio2026!')
    const exList = await pb.collection('exercises').getFullList({ sort: 'name' })
    const data = exList.map((e) => ({
      id: e.id,
      name: e.name,
      current_mg: e.muscle_group,
    }))
    fs.writeFileSync('exercises_dump.json', JSON.stringify(data, null, 2))
    console.log('SAVED ' + data.length + ' EXERCISES')
  })
})
