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

    // Let's identify CLEAR matches:
    // 1. Exact match (case/accent insensitive)
    // 2. Clear known typo: "PATURRILHA SMITH" -> "Panturrilha Smith"
    // 3. Clear abbrev expansion: "FLEXORA SIMULTANEO" -> "Flexora Simult."
    // 4. "GLÚTEO 90º SOLO CAN." -> "Glúteo 90º Solo Caneleira"
    // 5. "FLEXÃO DE JOELHO CAN SOLO" -> "Flexão de Joelho Caneleira Solo"

    const clearMatches = new Map() // clipId -> { exId, exName, clipTitle, clipId }

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i]
      const title = (c.title || '').trim()
      const n = norm(title)

      if (exMap.has(n)) {
        clearMatches.set(String(c.id), {
          clipId: String(c.id),
          clipTitle: title,
          exId: exMap.get(n).id,
          exName: exMap.get(n).name,
        })
      } else if (n === 'paturrilhasmith' && exMap.has(norm('Panturrilha Smith'))) {
        clearMatches.set(String(c.id), {
          clipId: String(c.id),
          clipTitle: title,
          exId: exMap.get(norm('Panturrilha Smith')).id,
          exName: 'Panturrilha Smith',
        })
      } else if (n === 'flexorasimultaneo' && exMap.has(norm('Flexora Simult.'))) {
        clearMatches.set(String(c.id), {
          clipId: String(c.id),
          clipTitle: title,
          exId: exMap.get(norm('Flexora Simult.')).id,
          exName: 'Flexora Simult.',
        })
      } else if (n === 'gluteo90solocan' && exMap.has(norm('Glúteo 90º Solo Caneleira'))) {
        clearMatches.set(String(c.id), {
          clipId: String(c.id),
          clipTitle: title,
          exId: exMap.get(norm('Glúteo 90º Solo Caneleira')).id,
          exName: 'Glúteo 90º Solo Caneleira',
        })
      } else if (
        n === 'flexaodejoelhocansolo' &&
        exMap.has(norm('Flexão de Joelho Caneleira Solo'))
      ) {
        clearMatches.set(String(c.id), {
          clipId: String(c.id),
          clipTitle: title,
          exId: exMap.get(norm('Flexão de Joelho Caneleira Solo')).id,
          exName: 'Flexão de Joelho Caneleira Solo',
        })
      }
    }

    // Now let's classify remaining clips (237 - clearMatches.size):
    // What defines a DOUBTFUL match vs a NEW exercise?
    // A doubtful match is when a video title:
    // a) Is generic and could match one or more specific exercises in the acervo (e.g., "TRICEPS TESTA SIMULTANEO HALTER" vs "Tríceps Testa Simult. Solo Barra H", "PULLEY CORDA" vs "Tríceps Polia Corda" / "Pulley Frente..." / "Pull Down Corda", "SUMÔ" vs "Sumô Halter", "SUPINO RETO BARRA-HALTER" vs "Supino Reto Conjugado Halter", "EXTENSORA SIMULTANEA" vs "Extensora", "PATURRILHA SMITH UNILATERAL" vs "Panturrilha Smith", "LEG SIMULTANEO" vs "Leg Press 45º" / "Leg 45 Unilateral", "LEVANTAMENTO TERRA" vs "Levantamento Terra Smith")
    // b) Or could refer to 2 or more candidate exercises in the acervo.
    //
    // On the other hand, if a video has a distinct specific variation that DOES NOT match any existing exercise (e.g. "CAMINHADA DO PATO", "AGACHAMENTO COM ROTACAO DO JOELHO COM ELASTICO", "AGACHAMENTO COM PASSO LATERAL COM HALTER ABD", "VOADOR DORSAL", "TRICEPS TESTA POLIA ALTA (CORDA)", "TRICEPS TESTA POLIA ALTA (BARRA)", "TRICEPS MERGULHO", "TRICEPS FRANCES INVERTIDO POLIA CORDA", "TRICEPS CONCENTRADO POLIA", "TRICEPS CONCENTRADO HALTER", "TRICEPS COICE UNILATERAL POLIA", "TRICEPS COICE UNILATERAL HALTER", "TRICEPS COICE SIMUTANEO CORDA AMARELA", "SUPINO VERTICAL CROSS PEGADA NEUTRA", "SUPINO 45º BARRA", "STIFF UNILATERAL HALTER", "STIFF POLIA", "STIFF INVERTIDO", "STIFF HALTER", "ROSCA UNILATERAL HALTER", "ROSCA POLIA UNILATERAL", "ROSCA POLIA INVERTIDA", "ROSCA POLIA CORDA", "ROSCA MARTELO SENTADO HALTER", "ROSCA POLIA ALTA SIMULTANEO BARRA", "ROSCA POLIA BARRA V", "ROSCA DIRETA BCO 45 HALTER", "ROSCA MARTELO BCO 45 HALTER", "ROSCA CONJUGADA HALTER", "ROSCA COM ISOMETRIA HALTER", "ROSCA COM GIRO HALTER", "ROSCA BARRA H", "ROSCA ALTERNADA HALTER", "ROSCA 21", "REMADA CURVADA SUPINADA POLIA", etc.) -> THAT IS CLEARLY A NEW EXERCISE!

    // Let's create an analysis function to find true ambiguous candidates
    function findAmbiguousCandidates(clipTitle) {
      const c = clipTitle.trim()
      const cn = norm(c)

      // Direct ambiguity list based on user rules and gym terminology:
      // 1. Video lacks apparatus or specifies multiple apparatuses
      // e.g. "SUPINO RETO BARRA-HALTER" -> exists "Supino Reto Conjugado Halter"?
      // 2. Video is base/generic term while acervo has specific variations:
      // e.g. "LEVANTAMENTO TERRA" -> acervo has "Levantamento Terra Smith"?
      // "EXTENSORA SIMULTANEA" -> acervo has "Extensora"?
      // "LEG SIMULTANEO" -> acervo has "Leg Press 45º", "Leg 45 Unilateral"?
      // "PULLEY CORDA" -> acervo has "Tríceps Polia Corda", "Pull Down Corda"?
      // "PASSADA" -> acervo has "Afundo Halter"? (Passada vs Afundo)
      // "PANTURRILHA MÁQUINA" -> acervo has "Panturrilha 3 Fases"?
      // "PULL OVER" -> acervo has "Pulley Frente..."?
      // "TRICEPS TESTA SIMULTANEO HALTER" -> acervo has "Tríceps Testa Simult. Solo Barra H"?

      const candidates = []
      for (let i = 0; i < exList.length; i++) {
        const ex = exList[i]
        // Compare words
        const cWords = cn.replace(/[^a-z0-9]/g, '')
        const eWords = ex.norm.replace(/[^a-z0-9]/g, '')

        // If one is substring of other or high similarity
        if (cWords.includes(eWords) || eWords.includes(cWords)) {
          candidates.push(ex.name)
        }
      }

      return candidates
    }

    const doubtful = []
    const definitelyNew = []

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i]
      const title = (c.title || '').trim()
      if (clearMatches.has(String(c.id))) continue

      const candidates = findAmbiguousCandidates(title)
      // If candidates found and not an exact variation distinction:
      // Let's see: if title is "STIFF HALTER" and candidate is "Stiff Barra", the user prompt explicitly said:
      // "Variações de aparelho/ângulo são exercícios DIFERENTES e continuam separados (Elevação Frontal ≠ Lateral; Crucifixo Halter ≠ 35º ≠ Invertido ≠ Máquina; Supino Reto Barra ≠ Halter)."
      // So "STIFF HALTER" is a DIFFERENT exercise from "Stiff Barra", NOT doubtful! It should be created as a new exercise!
      // But what IS doubtful?
      // Matches where:
      // 1. "o título pode corresponder a 2+ exercícios existentes, ex. 'TRICEPS PULLEY' vs 'TRICEPS PULLEY INVERTIDO'"
      // 2. "ou diferenças só de aparelho que você não tem certeza"
      // 3. O vídeo é genérico e não cita o aparelho (ex: "LEVANTAMENTO TERRA", "EXTENSORA SIMULTANEA", "SUMÔ", "LEG SIMULTANEO", "PATURRILHA SMITH UNILATERAL", "PULLEY CORDA", "SUPINO RETO BARRA-HALTER")

      // Check if title is generic / ambiguous:
      let isDoubt = false
      let doubtCands = []

      // Specific known ambiguous titles in this video showcase:
      const ambiguousCases = [
        {
          pattern: /^SUMÔ$/i,
          cands: ['Sumô Halter'],
          reason: 'Vídeo não especifica aparelho (halter, barra ou livre), acervo tem Sumô Halter',
        },
        {
          pattern: /^LEVANTAMENTO TERRA$/i,
          cands: ['Levantamento Terra Smith'],
          reason: 'Vídeo livre vs Smith no acervo',
        },
        {
          pattern: /^EXTENSORA SIMULTANEA$/i,
          cands: ['Extensora', 'Extensora 2 Tempos', 'Extensora Isometria'],
          reason: 'Extensora no acervo pode ser a simultânea padrão',
        },
        {
          pattern: /^LEG SIMULTANEO$/i,
          cands: ['Leg Press 45º'],
          reason: 'Leg Press 45º no acervo é executado de forma simultânea',
        },
        {
          pattern: /^SUPINO RETO BARRA-HALTER$/i,
          cands: ['Supino Reto Conjugado Halter'],
          reason: 'Título cita barra e halter; acervo possui Supino Reto Conjugado Halter',
        },
        {
          pattern: /^PULLEY CORDA$/i,
          cands: ['Tríceps Polia Corda', 'Pull Down Corda'],
          reason: 'Pode ser exercício de tríceps na corda ou dorsal (pulldown)',
        },
        {
          pattern: /^TRICEPS TESTA SIMULTANEO HALTER$/i,
          cands: ['Tríceps Testa Simult. Solo Barra H'],
          reason: 'Halter vs Barra H no solo',
        },
        {
          pattern: /^PATURRILHA SMITH UNILATERAL$/i,
          cands: ['Panturrilha Smith'],
          reason: 'Variação unilateral do exercício Panturrilha Smith existente',
        },
        {
          pattern: /^PANTURRILHA MÁQUINA$/i,
          cands: ['Panturrilha 3 Fases', 'Panturrilha Leg 45º'],
          reason: 'Acervo tem Panturrilha Leg 45º e Panturrilha 3 Fases',
        },
        {
          pattern: /^PANTURRILHA LIVRE SIMULTÂNEO$/i,
          cands: ['Panturrilha 3 Fases'],
          reason: 'Pode corresponder a execução simultânea livre',
        },
        {
          pattern: /^ABDUÇÃO EM V CANELEIRA$/i,
          cands: ['Adução em "V" Can.', 'Abdução Vertical Can.'],
          reason: 'Possível confusão entre Abdução e Adução em V',
        },
        {
          pattern: /^FLEXÃO DE QUADRIL 180º EM PÉ \(CANELEIRA\)$/i,
          cands: ['Flexão de Quadril 180º Sentado (Caneleira)', 'Flexão de Quadril 180º Polia'],
          reason: 'Variação de postura (em pé vs sentado)',
        },
        {
          pattern: /^PULL OVER$/i,
          cands: ['Pulley Frente Fechado Peg Sup. (Barra)'],
          reason: 'Possível correspondência de movimento dorsal/peitoral',
        },
      ]

      for (let a = 0; a < ambiguousCases.length; a++) {
        if (ambiguousCases[a].pattern.test(title)) {
          isDoubt = true
          doubtCands = ambiguousCases[a].cands
          break
        }
      }

      if (isDoubt) {
        doubtful.push({
          clipId: String(c.id),
          clipTitle: title,
          candidates: doubtCands,
        })
      } else {
        definitelyNew.push({
          clipId: String(c.id),
          clipTitle: title,
        })
      }
    }

    let diagRec = null
    try {
      diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_final_breakdown')
    } catch (_) {}
    if (!diagRec) {
      diagRec = new Record(app.findCollectionByNameOrId('app_settings'))
      diagRec.set('key', 'diag_final_breakdown')
    }
    diagRec.set(
      'studio_name',
      `ClearMatches: ${clearMatches.size} | Doubtful: ${doubtful.length} | DefinitelyNew: ${definitelyNew.length} | Total: ${clips.length}`,
    )
    app.save(diagRec)

    // Save full doubtful list
    let doubtRec = null
    try {
      doubtRec = app.findFirstRecordByData('app_settings', 'key', 'diag_doubt_list')
    } catch (_) {}
    if (!doubtRec) {
      doubtRec = new Record(app.findCollectionByNameOrId('app_settings'))
      doubtRec.set('key', 'diag_doubt_list')
    }
    doubtRec.set('custom_css', JSON.stringify(doubtful).substring(0, 4900))
    app.save(doubtRec)
  },
  () => {},
)
