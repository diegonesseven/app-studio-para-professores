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
    if (idx === -1) {
      throw new Error('dataForPlayer not found in showcase embed HTML')
    }
    const startIdx = html.indexOf('{', idx)
    const nextVarIdx = html.indexOf('var entityData', startIdx)
    let jsonStr = html.substring(startIdx, nextVarIdx).trim()
    if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1).trim()
    const data = JSON.parse(jsonStr)
    const clips = data.clips || []

    // 2. Fetch all current exercises
    const allExercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)

    const exList = allExercises.map((e) => ({
      id: e.id,
      name: e.getString('name'),
      url: e.getString('youtube_url'),
      vid: e.getString('youtube_id'),
    }))

    const clipList = clips.map((c) => {
      let thumb = ''
      if (c.thumbs && typeof c.thumbs === 'object') {
        thumb = c.thumbs['640'] || c.thumbs['1280'] || c.thumbs['960'] || c.thumbs['base'] || ''
      }
      return {
        id: String(c.id),
        title: c.title || '',
        thumb: thumb,
      }
    })

    // Store in app_settings diag_vimeo
    let diag = null
    try {
      diag = app.findFirstRecordByData('app_settings', 'key', 'diag_vimeo')
    } catch (_) {}
    if (!diag) {
      const col = app.findCollectionByNameOrId('app_settings')
      diag = new Record(col)
      diag.set('key', 'diag_vimeo')
    }

    diag.set('studio_name', `VIMEO_CLIPS: ${clipList.length} | EXERCISES: ${exList.length}`)
    diag.set('custom_css', JSON.stringify({ clipsCount: clipList.length, exCount: exList.length }))
    app.save(diag)

    console.log(`DIAG_VIMEO_OK: clips=${clipList.length}, exercises=${exList.length}`)
  },
  () => {},
)
