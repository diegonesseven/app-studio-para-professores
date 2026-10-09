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

    const exList = allExercises.map((e) => ({
      id: e.id,
      name: e.getString('name'),
      norm: norm(e.getString('name')),
    }))

    const exMap = new Map()
    for (let i = 0; i < exList.length; i++) {
      exMap.set(exList[i].norm, exList[i])
    }

    // List of unambiguous abbreviations or spelling variants that mean the exact same exercise:
    // e.g. "PATURRILHA SMITH" -> "Panturrilha Smith" (typo)
    // "FLEXORA SIMULTANEO" -> "Flexora Simult."
    // "GLÚTEO 90º SOLO CAN." -> "Glúteo 90º Solo Caneleira"
    // "FLEXÃO DE JOELHO CAN SOLO" -> "Flexão de Joelho Caneleira Solo"
    // "ABDUÇÃO EM V CANELEIRA" -> "Adução em \"V\" Can." -- wait, abdução != adução! That is different!
    // So ABDUÇÃO EM V CANELEIRA is NOT the same as Adução em "V" Can! It's abdução, not adução!

    // Let's test which clips from the 196 remaining are:
    // A) DOUBTFUL: The video title is ambiguous, could refer to an existing exercise or multiple ones
    // B) CLEAR NEW: The exercise is distinctly new (e.g. CAMINHADA DO PATO, AGACHAMENTO COM ROTACAO..., VOADOR DORSAL, etc.)
    // C) CLEAR MATCH: Unequivocally the same exercise as an existing one, just minor spelling/abbrev.

    // Let's check candidate relations for every clip:
    const categorized = []

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i]
      const title = (c.title || '').trim()
      const n = norm(title)

      if (exMap.has(n)) {
        categorized.push({
          clipId: String(c.id),
          title: title,
          status: 'CLEAR_MATCH',
          targetId: exMap.get(n).id,
          targetName: exMap.get(n).name,
          reason: 'Exact normalized match',
        })
        continue
      }

      // Check specific unambiguous spelling/typo match
      if (n === 'paturrilhasmith' && exMap.has(norm('Panturrilha Smith'))) {
        categorized.push({
          clipId: String(c.id),
          title: title,
          status: 'CLEAR_MATCH',
          targetId: exMap.get(norm('Panturrilha Smith')).id,
          targetName: 'Panturrilha Smith',
          reason: 'Typo paturrilha -> panturrilha',
        })
        continue
      }
      if (n === 'flexorasimultaneo' && exMap.has(norm('Flexora Simult.'))) {
        categorized.push({
          clipId: String(c.id),
          title: title,
          status: 'CLEAR_MATCH',
          targetId: exMap.get(norm('Flexora Simult.')).id,
          targetName: 'Flexora Simult.',
          reason: 'Abbreviation Simult. -> Simultaneo',
        })
        continue
      }
      if (n === 'gluteo90solocan' && exMap.has(norm('Glúteo 90º Solo Caneleira'))) {
        categorized.push({
          clipId: String(c.id),
          title: title,
          status: 'CLEAR_MATCH',
          targetId: exMap.get(norm('Glúteo 90º Solo Caneleira')).id,
          targetName: 'Glúteo 90º Solo Caneleira',
          reason: 'Abbreviation Can. -> Caneleira',
        })
        continue
      }
      if (n === 'flexaodejoelhocansolo' && exMap.has(norm('Flexão de Joelho Caneleira Solo'))) {
        categorized.push({
          clipId: String(c.id),
          title: title,
          status: 'CLEAR_MATCH',
          targetId: exMap.get(norm('Flexão de Joelho Caneleira Solo')).id,
          targetName: 'Flexão de Joelho Caneleira Solo',
          reason: 'Abbreviation Can -> Caneleira',
        })
        continue
      }

      // Now check candidate overlap for DOUBTFUL vs NEW:
      // Find all existing exercises that share the base movement
      const cWords = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)

      const cands = []
      for (let j = 0; j < exList.length; j++) {
        const ex = exList[j]
        const eWords = ex.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, ' ')
          .trim()
          .split(/\s+/)
          .filter(Boolean)

        let common = 0
        for (let w = 0; w < cWords.length; w++) {
          if (eWords.indexOf(cWords[w]) !== -1) common++
        }

        // If movement root matches
        if (cWords[0] === eWords[0] && common >= 2) {
          cands.push({ name: ex.name, common })
        }
      }

      cands.sort((a, b) => b.common - a.common)

      // An exercise is DOUBTFUL if:
      // The video title omits equipment or method that the acervo exercises specify, e.g.:
      // "EXTENSORA" vs "Extensora" is already matched. But what if video is "EXTENSORA SIMULTANEA" and acervo has "Extensora"?
      // What if video is "SUMÔ" and acervo has "Sumô Halter"?
      // What if video is "TRICEPS CORDA" and acervo has "Tríceps Polia Corda"?
      // What if video is "TRICEPS PULLEY" and acervo has "Tríceps Pulley" (already matched) vs "TRICEPS PULLEY INVERTIDO"?
      // What if video is "PULLEY CORDA" vs "Tríceps Polia Corda" or "Pull Down Corda"?
      // What if video is "SUPINO RETO BARRA-HALTER" vs "Supino Reto Halter", "Supino Reto Barra", etc.?

      // Let's store all potential ambiguous cases into a diagnostic table
      categorized.push({
        clipId: String(c.id),
        title: title,
        status: cands.length > 0 ? 'HAS_CANDS' : 'NO_CANDS',
        cands: cands.slice(0, 3).map((cd) => cd.name),
      })
    }

    const clearList = categorized.filter((x) => x.status === 'CLEAR_MATCH')
    const hasCandsList = categorized.filter((x) => x.status === 'HAS_CANDS')
    const noCandsList = categorized.filter((x) => x.status === 'NO_CANDS')

    let rec = null
    try {
      rec = app.findFirstRecordByData('app_settings', 'key', 'diag_final_eval')
    } catch (_) {}
    if (!rec) {
      rec = new Record(app.findCollectionByNameOrId('app_settings'))
      rec.set('key', 'diag_final_eval')
    }
    rec.set(
      'studio_name',
      `Clear: ${clearList.length} | HasCands: ${hasCandsList.length} | NoCands: ${noCandsList.length}`,
    )
    rec.set(
      'primary_color',
      clearList
        .map((c) => c.title)
        .slice(0, 20)
        .join(', '),
    )
    app.save(rec)

    function saveText(key, text) {
      let r = null
      try {
        r = app.findFirstRecordByData('app_settings', 'key', key)
      } catch (_) {}
      if (!r) {
        r = new Record(app.findCollectionByNameOrId('app_settings'))
        r.set('key', key)
      }
      r.set('custom_css', text.substring(0, 4900))
      app.save(r)
    }

    saveText('diag_clear_all_45', clearList.map((c) => `${c.title} -> ${c.targetName}`).join('\n'))
  },
  () => {},
)
