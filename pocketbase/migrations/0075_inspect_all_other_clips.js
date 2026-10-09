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

    // Exact matches
    const exMapExact = new Map()
    for (let i = 0; i < allExercises.length; i++) {
      const e = allExercises[i]
      exMapExact.set(norm(e.getString('name')), e)
    }

    const exactClips = []
    const otherClips = []

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i]
      const title = (c.title || '').trim()
      const n = norm(title)
      if (exMapExact.has(n)) {
        exactClips.push({
          clipId: String(c.id),
          title,
          exName: exMapExact.get(n).getString('name'),
        })
      } else {
        otherClips.push({ clipId: String(c.id), title })
      }
    }

    // Let's inspect otherClips in details to see which ones are TRUE doubtful vs NO MATCH (genuinely new)
    // A clip is DOUBTFUL if:
    // It shares a movement with existing exercises, BUT does not specify equipment/variation OR specifies a variation that might match an ambiguous existing one.
    // For example:
    // "TRICEPS CORDA" vs "Tríceps Polia Corda" (is it the same? In French/gym language, corda is always on polia, but "Tríceps Corda" could be doubtful vs existing "Tríceps Polia Corda")
    // "STIFF HALTER" vs "Stiff Barra" (clearly different variation -> Stiff Halter is a new exercise!)
    // "SUMÔ" vs "Sumô Halter" / "Sumô Barra" (is SUMÔ halter, barra or bodyweight? Doubtful!)
    // "PULLEY CORDA" vs "Tríceps Polia Corda" vs "Pull Down Corda"? (Doubtful!)
    // "EXTENSORA SIMULTANEA" vs "Extensora"? (Is Extensora simultanea? Almost all extensora are simultanea, but could be separate or same -> Doubtful!)

    // Let's save a structured classification of otherClips
    function saveText(key, text) {
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

    // Save exact 41
    saveText('diag_all_exact', exactClips.map((e) => `${e.title} -> ${e.exName}`).join('\n'))

    // Save all others in 3 chunks: 0..65, 65..130, 130..196
    saveText(
      'diag_all_other_1',
      otherClips
        .slice(0, 65)
        .map((o) => o.title)
        .join('\n'),
    )
    saveText(
      'diag_all_other_2',
      otherClips
        .slice(65, 130)
        .map((o) => o.title)
        .join('\n'),
    )
    saveText(
      'diag_all_other_3',
      otherClips
        .slice(130)
        .map((o) => o.title)
        .join('\n'),
    )
  },
  () => {},
)
