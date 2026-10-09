migrate(
  (app) => {
    // Diagnosticar todos os pares gravados
    const list = []
    for (let i = 0; i < 20; i++) {
      try {
        const r = app.findFirstRecordByData('app_settings', 'key', 'diag_p_' + i)
        list.push(i + ': ' + r.getString('studio_name'))
      } catch (_) {}
    }
    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    // gravar 0-5 no primary_color, 6-11 no bg, 12-16 no surface
    diagRec.set('primary_color', list.slice(0, 5).join(' || ').substring(0, 200))
    diagRec.set('background_color', list.slice(5, 10).join(' || ').substring(0, 200))
    diagRec.set('surface_color', list.slice(10).join(' || ').substring(0, 200))
    app.save(diagRec)
  },
  () => {},
)
