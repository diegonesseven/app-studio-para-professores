migrate(
  (app) => {
    // Diagnosticar todos os pares similares de 3 em 3
    const exercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)
    const uniqueNames = []
    const seen = {}
    for (let i = 0; i < exercises.length; i++) {
      const name = exercises[i].getString('name')
      if (!seen[name]) {
        seen[name] = true
        uniqueNames.push(name)
      }
    }
    uniqueNames.sort()

    function wordSet(str) {
      return new Set(
        str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, ' ')
          .split(/\s+/)
          .filter(Boolean),
      )
    }

    const similarPairs = []
    for (let i = 0; i < uniqueNames.length; i++) {
      const w1 = wordSet(uniqueNames[i])
      for (let j = i + 1; j < uniqueNames.length; j++) {
        const w2 = wordSet(uniqueNames[j])
        let common = 0
        w1.forEach((w) => {
          if (w2.has(w)) common++
        })
        const similarity = (2 * common) / (w1.size + w2.size)
        if (similarity >= 0.75 && similarity < 1.0) {
          similarPairs.push(uniqueNames[i] + ' <===> ' + uniqueNames[j])
        }
      }
    }

    // Criar registros temporários para cada par em diagRecs ou colocar num array
    // Vamos usar app_settings com chaves diag_p_0, diag_p_1...
    const settingsCol = app.findCollectionByNameOrId('app_settings')
    for (let i = 0; i < similarPairs.length; i++) {
      let r = null
      try {
        r = app.findFirstRecordByData('app_settings', 'key', 'diag_p_' + i)
      } catch (_) {}
      if (!r) {
        r = new Record(settingsCol)
        r.set('key', 'diag_p_' + i)
      }
      r.set('studio_name', similarPairs[i])
      app.save(r)
    }
  },
  () => {},
)
