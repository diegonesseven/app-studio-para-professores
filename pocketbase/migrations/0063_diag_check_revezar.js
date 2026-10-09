migrate(
  (app) => {
    // Diagnosticar todos os pares que contêm barras/revezar
    const exercises = app.findRecordsByFilter('exercises', 'name ~ "Revezar"', 'name', 50, 0)
    const list = []
    for (let i = 0; i < exercises.length; i++) {
      list.push(exercises[i].getString('name'))
    }
    const unique = Array.from(new Set(list))
    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set('studio_name', 'REV:' + unique.join(' | '))
    app.save(diagRec)
  },
  () => {},
)
