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
    // We only need id and name, keep it minimal: "id|name"
    const exLines = allExercises.map((e) => `${e.id}|${e.getString('name')}`)
    // Clip: "id|title"
    const clipLines = clips.map((c) => `${c.id}|${(c.title || '').trim()}`)

    function saveSetting(key, text) {
      let rec = null
      try {
        rec = app.findFirstRecordByData('app_settings', 'key', key)
      } catch (_) {}
      if (!rec) {
        const col = app.findCollectionByNameOrId('app_settings')
        rec = new Record(col)
        rec.set('key', key)
      }
      rec.set('custom_css', text)
      app.save(rec)
    }

    // Split exLines (137 lines) into 2 parts
    saveSetting('diag_ex_a', exLines.slice(0, 70).join('\n'))
    saveSetting('diag_ex_b', exLines.slice(70).join('\n'))

    // Split clipLines (237 lines) into 6 parts (~40 lines each ~ 1500 chars)
    saveSetting('diag_v_1', clipLines.slice(0, 40).join('\n'))
    saveSetting('diag_v_2', clipLines.slice(40, 80).join('\n'))
    saveSetting('diag_v_3', clipLines.slice(80, 120).join('\n'))
    saveSetting('diag_v_4', clipLines.slice(120, 160).join('\n'))
    saveSetting('diag_v_5', clipLines.slice(160, 200).join('\n'))
    saveSetting('diag_v_6', clipLines.slice(200).join('\n'))
  },
  () => {},
)
