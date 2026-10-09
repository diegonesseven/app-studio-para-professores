migrate(
  (app) => {
    // Diagnosticar os 17 pares similares
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

    // Gravar os 17 pares compactamente no custom_css
    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set('custom_css', similarPairs.join('\n'))
    // E colocar no primary_color ou notes os pares 1 a 3
    diagRec.set('primary_color', (similarPairs[0] || '').substring(0, 50))
    diagRec.set('background_color', (similarPairs[1] || '').substring(0, 50))
    diagRec.set('surface_color', (similarPairs[2] || '').substring(0, 50))
    app.save(diagRec)
  },
  () => {},
)
