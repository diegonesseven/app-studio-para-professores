migrate(
  (app) => {
    // Diagnosticar se "Elevação Lateral Halter" e "Elevação Lateral Simultaneo Halter"
    // ou "Tríceps Testa Simult. Solo Barra H" vs outro
    const list = app.findRecordsByFilter('exercises', 'name ~ "Elevação Lateral"', 'name', 50, 0)
    const names = Array.from(new Set(list.map((e) => e.getString('name'))))
    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set('studio_name', 'ELEV_LAT: ' + names.join(' <=> '))
    app.save(diagRec)
  },
  () => {},
)
