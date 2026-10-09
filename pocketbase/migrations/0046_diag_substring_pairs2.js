migrate(
  (app) => {
    // Diagnosticar pares substring parte 2
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

    const pairs = []
    for (let i = 0; i < uniqueNames.length; i++) {
      for (let j = i + 1; j < uniqueNames.length; j++) {
        const a = uniqueNames[i].toLowerCase()
        const b = uniqueNames[j].toLowerCase()
        if (a === b || a.includes(b) || b.includes(a)) {
          pairs.push([uniqueNames[i], uniqueNames[j]])
        }
      }
    }

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set(
      'custom_css',
      JSON.stringify({
        totalPairs: pairs.length,
        pairs30to60: pairs.slice(30, 60),
        pairs60to90: pairs.slice(60, 90),
      }).substring(0, 4900),
    )
    app.save(diagRec)
  },
  () => {},
)
