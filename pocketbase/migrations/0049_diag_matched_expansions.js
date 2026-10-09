migrate(
  (app) => {
    // Diagnosticar matches de expansão
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

    // Verificar se existe "Alongamentos" vs "Alongamentos / Revezar" ou similar
    const along = uniqueNames.filter((u) => u.toLowerCase().includes('along'))
    // Verificar se existe "Agach"
    const agach = uniqueNames.filter((u) => u.toLowerCase().includes('agach'))
    // Verificar "Flexora"
    const flexora = uniqueNames.filter((u) => u.toLowerCase().includes('flexora'))

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set(
      'custom_css',
      JSON.stringify({
        matched: matched,
        along: along,
        agach: agach,
        flexora: flexora,
      }).substring(0, 4900),
    )
    app.save(diagRec)
  },
  () => {},
)
