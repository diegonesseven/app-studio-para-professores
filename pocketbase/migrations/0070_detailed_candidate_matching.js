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

    // Token normalize: remove accents, lowercase, remove punctuation, split into tokens
    function tokenize(str) {
      const clean = (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
      return clean.trim().split(/\s+/).filter(Boolean)
    }

    const exList = allExercises.map((e) => ({
      id: e.id,
      name: e.getString('name'),
      norm: norm(e.getString('name')),
      tokens: tokenize(e.getString('name')),
    }))

    // Common abbreviations in Portuguese fitness
    // Can. -> Caneleira
    // AP -> ?
    // Peg -> Pegada
    // Sup. / Supinada -> Supinada
    // Pron. / Pronada -> Pronada
    // Bco -> Banco
    // Simult. / Simultaneo -> Simultaneo
    // Unil. / Unilateral -> Unilateral
    // Alt. / Alternado -> Alternado
    // G -> ?

    // For each clip, let's find potential matches in exList
    const analysis = []

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i]
      const title = (c.title || '').trim()
      const cNorm = norm(title)
      const cTokens = tokenize(title)

      // 1. Exact norm match
      const exact = exList.filter((e) => e.norm === cNorm)
      if (exact.length === 1) {
        analysis.push({
          clipId: String(c.id),
          clipTitle: title,
          type: 'EXACT',
          matchId: exact[0].id,
          matchName: exact[0].name,
        })
        continue
      }

      // 2. Check candidate matches by token overlap
      // e.g. how many tokens in common?
      const candidates = []
      for (let j = 0; j < exList.length; j++) {
        const e = exList[j]
        // check common tokens
        const common = e.tokens.filter((t) => cTokens.includes(t))
        // also check if tokens are expanded forms (e.g. can vs caneleira, peg vs pegada, bco vs banco)
        if (common.length >= 2 || (cTokens.length === 1 && common.length === 1)) {
          candidates.push({
            id: e.id,
            name: e.name,
            commonCount: common.length,
            totalExTokens: e.tokens.length,
            totalClipTokens: cTokens.length,
          })
        }
      }

      // Sort candidates by commonCount desc
      candidates.sort((a, b) => b.commonCount - a.commonCount)

      if (candidates.length === 0) {
        analysis.push({
          clipId: String(c.id),
          clipTitle: title,
          type: 'NO_CANDIDATE', // New exercise
        })
      } else {
        analysis.push({
          clipId: String(c.id),
          clipTitle: title,
          type: 'CANDIDATES',
          candidates: candidates.slice(0, 3).map((cand) => cand.name),
        })
      }
    }

    // Save summary counts
    const exactList = analysis.filter((a) => a.type === 'EXACT')
    const noCandList = analysis.filter((a) => a.type === 'NO_CANDIDATE')
    const withCandList = analysis.filter((a) => a.type === 'CANDIDATES')

    let rec = null
    try {
      rec = app.findFirstRecordByData('app_settings', 'key', 'diag_cand_stat')
    } catch (_) {}
    if (!rec) {
      rec = new Record(app.findCollectionByNameOrId('app_settings'))
      rec.set('key', 'diag_cand_stat')
    }
    rec.set(
      'studio_name',
      `Exact: ${exactList.length} | NoCand: ${noCandList.length} | WithCand: ${withCandList.length}`,
    )
    rec.set(
      'custom_css',
      JSON.stringify({
        exactCount: exactList.length,
        noCandCount: noCandList.length,
        withCandCount: withCandList.length,
        withCandSample: withCandList.slice(0, 25),
      }).substring(0, 4900),
    )
    app.save(rec)
  },
  () => {},
)
