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

    function norm(str) {
      return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
    }

    const exMapExact = new Map()
    for (let i = 0; i < allExercises.length; i++) {
      const e = allExercises[i]
      exMapExact.set(norm(e.getString('name')), e)
    }

    const exactMatches = []
    const remainingClips = []

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i]
      const title = (c.title || '').trim()
      const n = norm(title)
      if (exMapExact.has(n)) {
        exactMatches.push({
          clipId: String(c.id),
          clipTitle: title,
          exId: exMapExact.get(n).id,
          exName: exMapExact.get(n).getString('name'),
        })
      } else {
        remainingClips.push({
          clipId: String(c.id),
          clipTitle: title,
        })
      }
    }

    // Save all exact matches (41) in diag_exact_41
    let rec1 = null
    try {
      rec1 = app.findFirstRecordByData('app_settings', 'key', 'diag_exact_41')
    } catch (_) {}
    if (!rec1) {
      rec1 = new Record(app.findCollectionByNameOrId('app_settings'))
      rec1.set('key', 'diag_exact_41')
    }
    rec1.set(
      'custom_css',
      exactMatches
        .map((m) => `${m.clipTitle} ===> ${m.exName}`)
        .join('\n')
        .substring(0, 4900),
    )
    app.save(rec1)

    // For the 196 remaining clips, let's see which ones have ANY word-root overlap with the 137 exercises
    // Let's inspect them in 4 chunks of ~50
    function saveChunk(key, items) {
      let rec = null
      try {
        rec = app.findFirstRecordByData('app_settings', 'key', key)
      } catch (_) {}
      if (!rec) {
        rec = new Record(app.findCollectionByNameOrId('app_settings'))
        rec.set('key', key)
      }
      rec.set('custom_css', items.join('\n').substring(0, 4900))
      app.save(rec)
    }

    const remTitles = remainingClips.map((r) => r.clipTitle)
    saveChunk('diag_rem_0', remTitles.slice(0, 50))
    saveChunk('diag_rem_1', remTitles.slice(50, 100))
    saveChunk('diag_rem_2', remTitles.slice(100, 150))
    saveChunk('diag_rem_3', remTitles.slice(150))
  },
  () => {},
)
