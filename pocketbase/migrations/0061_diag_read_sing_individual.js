migrate(
  (app) => {
    // Diagnosticar nomes de diag_sing_0 a 3
    const names = []
    for (let i = 0; i < 4; i++) {
      try {
        const r = app.findFirstRecordByData('app_settings', 'key', 'diag_sing_' + i)
        names.push(r.getString('studio_name'))
      } catch (_) {}
    }
    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set('studio_name', 'S0:' + (names[0] || ''))
    diagRec.set('primary_color', 'S1:' + (names[1] || ''))
    diagRec.set('background_color', 'S2:' + (names[2] || ''))
    diagRec.set('surface_color', 'S3:' + (names[3] || ''))
    app.save(diagRec)
  },
  () => {},
)
