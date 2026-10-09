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

    // Normalização que expande abreviações óbvias
    // "can." / "caneleiras" -> "caneleira"
    // "bco" -> "banco"
    // "peg" -> "pegada"
    // "simult." -> "simultaneo"
    // "unil." -> "unilateral"
    // "alt." -> "alternado"
    // "paturrilha" -> "panturrilha"
    // "flexona" -> "flexora"
    // "sup." -> "supinada"
    // "pron." -> "pronada"
    function expandAbbreviations(str) {
      let s = (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')

      const words = s
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => {
          if (w === 'can' || w === 'caneleiras') return 'caneleira'
          if (w === 'bco') return 'banco'
          if (w === 'peg') return 'pegada'
          if (w === 'simult' || w === 'simutaneo') return 'simultaneo'
          if (w === 'unil') return 'unilateral'
          if (w === 'alt') return 'alternado'
          if (w === 'paturrilha') return 'panturrilha'
          if (w === 'flexona') return 'flexora'
          if (w === 'sup') return 'supinada'
          if (w === 'pron') return 'pronada'
          return w
        })
      return words.join(' ')
    }

    const exList = allExercises.map((e) => ({
      id: e.id,
      name: e.getString('name'),
      norm: norm(e.getString('name')),
      expanded: expandAbbreviations(e.getString('name')),
      tokens: expandAbbreviations(e.getString('name')).split(' '),
    }))

    // Index by norm and expanded
    const byNorm = new Map()
    const byExpanded = new Map()

    for (let i = 0; i < exList.length; i++) {
      const item = exList[i]
      byNorm.set(item.norm, item)
      byExpanded.set(norm(item.expanded), item)
    }

    // Now for each clip:
    const exactMatches = []
    const expandedMatches = []
    const doubtfulPairs = []
    const noCandidates = []

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i]
      const title = (c.title || '').trim()
      const n = norm(title)
      const exp = expandAbbreviations(title)
      const expNorm = norm(exp)

      if (byNorm.has(n)) {
        const match = byNorm.get(n)
        exactMatches.push({
          clipId: String(c.id),
          clipTitle: title,
          exId: match.id,
          exName: match.name,
        })
      } else if (byExpanded.has(expNorm)) {
        const match = byExpanded.get(expNorm)
        expandedMatches.push({
          clipId: String(c.id),
          clipTitle: title,
          exId: match.id,
          exName: match.name,
        })
      } else {
        // Let's find candidates in exList that share key movement words
        const cTokens = exp.split(' ')
        // candidate scoring
        const cands = []
        for (let j = 0; j < exList.length; j++) {
          const ex = exList[j]
          // how many tokens of ex are in cTokens?
          let common = 0
          for (let k = 0; k < ex.tokens.length; k++) {
            if (cTokens.indexOf(ex.tokens[k]) !== -1) common++
          }
          // If first token (main movement name, e.g. "agachamento", "supino", "triceps", "rosca", "gluteo", "abdominal") matches
          if (cTokens[0] === ex.tokens[0] && common >= 2) {
            cands.push({
              name: ex.name,
              score: common,
              totalEx: ex.tokens.length,
              totalClip: cTokens.length,
            })
          }
        }

        cands.sort((a, b) => b.score - a.score)

        if (cands.length > 0) {
          doubtfulPairs.push({
            clipId: String(c.id),
            clipTitle: title,
            cands: cands.slice(0, 3).map((cd) => cd.name),
          })
        } else {
          noCandidates.push({
            clipId: String(c.id),
            clipTitle: title,
          })
        }
      }
    }

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

    let summaryRec = null
    try {
      summaryRec = app.findFirstRecordByData('app_settings', 'key', 'diag_deep_match')
    } catch (_) {}
    if (!summaryRec) {
      summaryRec = new Record(app.findCollectionByNameOrId('app_settings'))
      summaryRec.set('key', 'diag_deep_match')
    }
    summaryRec.set(
      'studio_name',
      `Exact: ${exactMatches.length} | Expanded: ${expandedMatches.length} | Doubtful: ${doubtfulPairs.length} | NoCand: ${noCandidates.length}`,
    )
    app.save(summaryRec)

    // Save exact list (41)
    saveText(
      'diag_deep_exact',
      exactMatches.map((m) => `${m.clipTitle} -> ${m.exName}`).join(';; '),
    )
    // Save expanded list
    saveText(
      'diag_deep_exp',
      expandedMatches.map((m) => `${m.clipTitle} -> ${m.exName}`).join(';; '),
    )
    // Save doubtful list
    saveText(
      'diag_deep_doubt_1',
      doubtfulPairs
        .slice(0, 40)
        .map((d) => `${d.clipTitle} => [${d.cands.join(' | ')}]`)
        .join(';; '),
    )
    saveText(
      'diag_deep_doubt_2',
      doubtfulPairs
        .slice(40, 80)
        .map((d) => `${d.clipTitle} => [${d.cands.join(' | ')}]`)
        .join(';; '),
    )
    saveText(
      'diag_deep_doubt_3',
      doubtfulPairs
        .slice(80)
        .map((d) => `${d.clipTitle} => [${d.cands.join(' | ')}]`)
        .join(';; '),
    )
    // Save no candidates list
    saveText('diag_deep_nocand', noCandidates.map((n) => n.clipTitle).join(';; '))
  },
  () => {},
)
