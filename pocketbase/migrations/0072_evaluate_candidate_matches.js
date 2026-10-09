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

    // Normalização semântica de sinônimos/abreviações frequentes
    // Ex: "can." -> "caneleira", "bco" -> "banco", "peg" -> "pegada", "simult." -> "simultaneo"
    function superNorm(str) {
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
          if (w === 'extensao') return 'extensora'
          if (w === 'abducao') return 'abdutora'
          if (w === 'aducao') return 'adutora'
          return w
        })
      return words.join('')
    }

    const exMapExact = new Map() // norm -> ex
    const exMapSuper = new Map() // superNorm -> ex

    for (let i = 0; i < allExercises.length; i++) {
      const e = allExercises[i]
      const n = norm(e.getString('name'))
      const sn = superNorm(e.getString('name'))
      exMapExact.set(n, e)
      exMapSuper.set(sn, e)
    }

    const clearMatches = [] // { clipId, clipTitle, exId, exName, rule }
    const doubtfulCases = [] // { clipId, clipTitle, candidates: [] }
    const noMatches = [] // { clipId, clipTitle }

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i]
      const title = (c.title || '').trim()
      const n = norm(title)
      const sn = superNorm(title)

      if (exMapExact.has(n)) {
        const e = exMapExact.get(n)
        clearMatches.push({
          clipId: String(c.id),
          clipTitle: title,
          exId: e.id,
          exName: e.getString('name'),
          rule: 'EXACT_NORM',
        })
      } else if (exMapSuper.has(sn)) {
        const e = exMapSuper.get(sn)
        clearMatches.push({
          clipId: String(c.id),
          clipTitle: title,
          exId: e.id,
          exName: e.getString('name'),
          rule: 'SUPER_NORM_EXPANSION',
        })
      } else {
        // Let's find partial matches / candidate overlaps
        // e.g. does it contain core movement words?
        const cWords = title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, ' ')
          .trim()
          .split(/\s+/)
          .filter(Boolean)

        const cands = []
        for (let j = 0; j < allExercises.length; j++) {
          const e = allExercises[j]
          const eName = e.getString('name')
          const eWords = eName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .trim()
            .split(/\s+/)
            .filter(Boolean)

          // count overlapping words
          let common = 0
          for (let w = 0; w < cWords.length; w++) {
            if (eWords.indexOf(cWords[w]) !== -1) common++
          }

          // If movement type matches (e.g. both start with "triceps", "remada", "rosca", "agachamento")
          if (cWords[0] === eWords[0] && common >= 2) {
            cands.push({
              name: eName,
              score: common,
            })
          }
        }

        cands.sort((a, b) => b.score - a.score)

        if (cands.length > 0 && cands[0].score >= 2) {
          // If top candidate is very close or multiple candidates exist:
          doubtfulCases.push({
            clipId: String(c.id),
            clipTitle: title,
            candidates: cands.slice(0, 4).map((cd) => cd.name),
          })
        } else {
          noMatches.push({
            clipId: String(c.id),
            clipTitle: title,
          })
        }
      }
    }

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

    // Save summary
    let sumRec = null
    try {
      sumRec = app.findFirstRecordByData('app_settings', 'key', 'diag_matches_eval')
    } catch (_) {}
    if (!sumRec) {
      sumRec = new Record(app.findCollectionByNameOrId('app_settings'))
      sumRec.set('key', 'diag_matches_eval')
    }
    sumRec.set(
      'studio_name',
      `Clear: ${clearMatches.length} | Doubtful: ${doubtfulCases.length} | NoMatch: ${noMatches.length}`,
    )
    app.save(sumRec)

    // Save clear matches sample
    saveSetting(
      'diag_clear_sample',
      clearMatches
        .map((m) => `${m.clipTitle} ===> ${m.exName} (${m.rule})`)
        .slice(0, 60)
        .join('\n'),
    )
    // Save doubtful sample
    saveSetting(
      'diag_doubt_sample',
      doubtfulCases
        .map((d) => `${d.clipTitle} ??? [${d.candidates.join(' / ')}]`)
        .slice(0, 60)
        .join('\n'),
    )
    // Save doubtful sample part 2
    saveSetting(
      'diag_doubt_sample_2',
      doubtfulCases
        .map((d) => `${d.clipTitle} ??? [${d.candidates.join(' / ')}]`)
        .slice(60)
        .join('\n'),
    )
  },
  () => {},
)
