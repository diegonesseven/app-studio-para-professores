migrate(
  (app) => {
    // Diagnosticar variações nos 137 nomes
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

    // Procurar por nomes muito similares
    // Dividir em palavras normalizadas e ver sobreposição de >75%
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
          similarPairs.push({
            a: uniqueNames[i],
            b: uniqueNames[j],
            sim: Math.round(similarity * 100),
          })
        }
      }
    }

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set('studio_name', 'SIM:' + similarPairs.length)
    diagRec.set(
      'custom_css',
      JSON.stringify({ pairs: similarPairs.slice(0, 25) }).substring(0, 4900),
    )
    app.save(diagRec)
  },
  () => {},
)
