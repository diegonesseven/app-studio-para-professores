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

    // Index exercises by normalized name
    const exMap = new Map() // normName -> [ex]
    for (let i = 0; i < allExercises.length; i++) {
      const e = allExercises[i]
      const k = norm(e.getString('name'))
      if (!exMap.has(k)) exMap.set(k, [])
      exMap.get(k).push(e)
    }

    const exactMatches = [] // { clipTitle, clipId, exId, exName }
    const noExactMatches = [] // { clipTitle, clipId }

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i]
      const title = (c.title || '').trim()
      const k = norm(title)
      if (exMap.has(k)) {
        const matches = exMap.get(k)
        if (matches.length === 1) {
          exactMatches.push({
            clipTitle: title,
            clipId: String(c.id),
            exId: matches[0].id,
            exName: matches[0].getString('name'),
          })
        } else {
          noExactMatches.push({ clipTitle: title, clipId: String(c.id), reason: 'multiple_exact' })
        }
      } else {
        noExactMatches.push({ clipTitle: title, clipId: String(c.id), reason: 'not_exact' })
      }
    }

    function saveSetting(key, obj) {
      let rec = null
      try {
        rec = app.findFirstRecordByData('app_settings', 'key', key)
      } catch (_) {}
      if (!rec) {
        const col = app.findCollectionByNameOrId('app_settings')
        rec = new Record(col)
        rec.set('key', key)
      }
      rec.set('studio_name', `Exact: ${exactMatches.length} | NonExact: ${noExactMatches.length}`)
      // store summary
      const str = JSON.stringify(obj)
      rec.set('custom_css', str.substring(0, 4900))
      app.save(rec)
    }

    // Save summary of exact matches and non exact count
    saveSetting('diag_match_stat', {
      totalClips: clips.length,
      exactCount: exactMatches.length,
      nonExactCount: noExactMatches.length,
      exactSample: exactMatches.slice(0, 10),
      nonExactSample: noExactMatches.slice(0, 20),
    })

    // Store non-exact titles in chunks so we can inspect all of them
    const nonExactTitles = noExactMatches.map((m) => `${m.clipId}|${m.clipTitle}`)
    for (let chunk = 0; chunk < 4; chunk++) {
      const slice = nonExactTitles.slice(chunk * 40, (chunk + 1) * 40)
      if (slice.length > 0) {
        let rec = null
        const k = `diag_nex_${chunk}`
        try {
          rec = app.findFirstRecordByData('app_settings', 'key', k)
        } catch (_) {}
        if (!rec) {
          rec = new Record(app.findCollectionByNameOrId('app_settings'))
          rec.set('key', k)
        }
        rec.set('custom_css', slice.join('\n'))
        app.save(rec)
      }
    }
  },
  () => {},
)
