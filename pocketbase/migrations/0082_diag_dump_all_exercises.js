migrate(
  (app) => {
    // We will build a migration helper that lists exercises in files or logs them
    // Let's create a temporary hook or endpoint or write to a text file?
    // In PB migration goja runtime, we don't have fs.
    // But we can store them in multiple app_settings records with small custom_css or primary_color!
    // app_settings fields:
    // primary_color: text (no limit specified, usually 255)
    // custom_css: text (max 5000)
    // Let's store 35 exercises per record, each record has custom_css under 2500 chars.
    const exercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)
    const settingsCol = app.findCollectionByNameOrId('app_settings')

    // Clean existing diag
    for (let i = 0; i < 20; i++) {
      try {
        const r = app.findFirstRecordByData('app_settings', 'key', 'ex_list_' + i)
        app.delete(r)
      } catch (_) {}
    }

    const pageSize = 25
    const totalPages = Math.ceil(exercises.length / pageSize)
    for (let p = 0; p < totalPages; p++) {
      const chunk = exercises.slice(p * pageSize, (p + 1) * pageSize)
      const data = chunk.map((e) => ({
        id: e.id,
        name: e.getString('name'),
        mg: e.getString('muscle_group'),
      }))
      const rec = new Record(settingsCol)
      rec.set('key', 'ex_list_' + p)
      rec.set('studio_name', 'PAGE ' + p + '/' + totalPages + ' (' + chunk.length + ')')
      rec.set('custom_css', JSON.stringify(data))
      app.save(rec)
    }
  },
  () => {},
)
