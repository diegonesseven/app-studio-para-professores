migrate(
  (app) => {
    // 1. Fetch showcase embed HTML
    const res = $http.send({
      url: 'https://vimeo.com/showcase/12445893/embed',
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30,
    })

    const html = res.raw
    const idx = html.indexOf('dataForPlayer')
    if (idx === -1) throw new Error('dataForPlayer not found')
    const startIdx = html.indexOf('{', idx)
    const nextVarIdx = html.indexOf('var entityData', startIdx)
    let jsonStr = html.substring(startIdx, nextVarIdx).trim()
    if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1).trim()
    const data = JSON.parse(jsonStr)
    const clips = data.clips || []

    const allExercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)
    const exNames = allExercises.map((e) => e.getString('name'))

    // Save all 137 exercises into diag_all_137_ex
    let recEx = null
    try {
      recEx = app.findFirstRecordByData('app_settings', 'key', 'diag_all_137_ex')
    } catch (_) {}
    if (!recEx) {
      recEx = new Record(app.findCollectionByNameOrId('app_settings'))
      recEx.set('key', 'diag_all_137_ex')
    }
    recEx.set('custom_css', exNames.join('\n').substring(0, 4900))
    app.save(recEx)

    // Save all clips into 2 settings: diag_all_clips_1, diag_all_clips_2
    const clipTitles = clips.map((c) => `${c.id}|${(c.title || '').trim()}`)

    function saveSetting(key, text) {
      let rec = null
      try {
        rec = app.findFirstRecordByData('app_settings', 'key', key)
      } catch (_) {}
      if (!rec) {
        rec = new Record(app.findCollectionByNameOrId('app_settings'))
        rec.set('key', key)
      }
      rec.set('custom_css', text.substring(0, 4900))
      app.save(rec)
    }

    saveSetting('diag_all_clips_1', clipTitles.slice(0, 120).join('\n'))
    saveSetting('diag_all_clips_2', clipTitles.slice(120).join('\n'))
  },
  () => {},
)
