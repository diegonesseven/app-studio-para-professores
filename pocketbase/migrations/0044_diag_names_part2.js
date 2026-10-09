migrate(
  (app) => {
    // Diagnosticar parte 2 dos nomes únicos e testar variações
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
    const out = {
      names50to100: uniqueNames.slice(50, 100),
      names100to137: uniqueNames.slice(100),
    }
    diagRec.set('custom_css', JSON.stringify(out).substring(0, 4900))
    app.save(diagRec)
  },
  () => {},
)
