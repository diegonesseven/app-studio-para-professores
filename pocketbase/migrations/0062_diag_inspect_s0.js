migrate(
  (app) => {
    // Diagnosticar apenas o primeiro par sing: diag_sing_0
    let s0 = ''
    try {
      const r = app.findFirstRecordByData('app_settings', 'key', 'diag_sing_0')
      s0 = r.getString('studio_name')
    } catch (_) {}

    // studio_name suporta pelo menos 100 caracteres se não tiver limite curto
    // vamos ver o tamanho de s0
    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set('studio_name', 'LEN:' + s0.length)
    diagRec.set('primary_color', s0.substring(0, 30))
    diagRec.set('background_color', s0.substring(30, 60))
    diagRec.set('surface_color', s0.substring(60, 90))
    app.save(diagRec)
  },
  () => {},
)
