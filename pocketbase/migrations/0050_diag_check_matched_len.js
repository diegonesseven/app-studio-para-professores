migrate(
  (app) => {
    // Diagnosticar se matched tem itens
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

    const matched = []
    for (let i = 0; i < uniqueNames.length; i++) {
      const orig = uniqueNames[i]
      let expanded = orig
        .replace(/\bAgach\b/gi, 'Agachamento')
        .replace(/\bCan\b\.?/gi, 'Caneleira')
        .replace(/\bSimult\b\.?/gi, 'Simultâneo')
        .replace(/\bBco\b\.?/gi, 'Banco')
        .replace(/\bUnil\b\.?/gi, 'Unilateral')
        .replace(/\bPeg\b\.?/gi, 'Pegada')
        .replace(/\bSup\b\.?/gi, 'Supinada')
        .replace(/\bPron\b\.?/gi, 'Pronada')

      const match = uniqueNames.find(
        (u) => u !== orig && u.toLowerCase() === expanded.toLowerCase(),
      )
      if (match) {
        matched.push([orig, match])
      }
    }

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set(
      'studio_name',
      'M:' + matched.length + '|E:' + exercises.length + '|U:' + uniqueNames.length,
    )
    app.save(diagRec)
  },
  () => {},
)
