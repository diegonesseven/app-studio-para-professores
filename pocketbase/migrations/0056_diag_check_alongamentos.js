migrate(
  (app) => {
    // Diagnosticar se "Alongamento / Revezar" e "Alongamentos / Revezar" existem
    const alongamentos = app.findRecordsByFilter('exercises', 'name ~ "Along"', 'name', 100, 0)
    const alongNames = []
    for (let i = 0; i < alongamentos.length; i++) {
      alongNames.push(alongamentos[i].getString('name'))
    }

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set('studio_name', 'ALONG: ' + Array.from(new Set(alongNames)).join(' | '))
    app.save(diagRec)
  },
  () => {},
)
