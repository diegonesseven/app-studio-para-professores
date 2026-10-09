migrate(
  (app) => {
    // Diagnosticar todos os pares que contêm "Simult"
    const exercises = app.findRecordsByFilter('exercises', 'name ~ "Simult"', 'name', 50, 0)
    const list = []
    for (let i = 0; i < exercises.length; i++) {
      list.push(exercises[i].getString('name'))
    }
    const unique = Array.from(new Set(list))
    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set('studio_name', 'SIMULT:' + unique.length)
    diagRec.set('primary_color', unique.slice(0, 3).join(' | ').substring(0, 100))
    diagRec.set('background_color', unique.slice(3, 6).join(' | ').substring(0, 100))
    diagRec.set('surface_color', unique.slice(6).join(' | ').substring(0, 100))
    app.save(diagRec)
  },
  () => {},
)
