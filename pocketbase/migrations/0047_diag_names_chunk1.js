migrate(
  (app) => {
    // Diagnosticar todos os 137 nomes de 20 em 20
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

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set(
      'custom_css',
      JSON.stringify({
        chunk0_40: uniqueNames.slice(0, 40),
      }).substring(0, 4900),
    )
    app.save(diagRec)
  },
  () => {},
)
