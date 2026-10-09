migrate(
  (app) => {
    // Diagnosticar exercícios e variações de escrita/abreviações
    const exercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)

    function normalizeStrict(str) {
      return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
    }

    // Normalização semântica com expansão de abreviações comuns de treino
    function normalizeSemantic(str) {
      let s = (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      // pontuações substituídas por espaços
      s = s.replace(/[\.\,\;\:\(\)\/\-\_\"\']/g, ' ')

      // tokenização
      let tokens = s.split(/\s+/).filter(Boolean)

      const mapTokens = {
        can: 'caneleira',
        caneleiras: 'caneleira',
        bco: 'banco',
        simult: 'simultaneo',
        simul: 'simultaneo',
        simultanea: 'simultaneo',
        simultaneos: 'simultaneo',
        unil: 'unilateral',
        unilat: 'unilateral',
        halter: 'halter',
        halteres: 'halter',
        haltere: 'halter',
        bar: 'barra',
        barras: 'barra',
        abd: 'abdominal',
        pol: 'polia',
        maq: 'maquina',
        peg: 'pegada',
        sup: 'supinada',
        pron: 'pronada',
        declin: 'declinado',
        inclin: 'inclinado',
        elev: 'elevacao',
      }

      tokens = tokens.map((t) => mapTokens[t] || t)
      return tokens.join(' ')
    }

    const strictGroups = {}
    const semanticGroups = {}

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      const rawName = ex.getString('name')
      const sk = normalizeStrict(rawName)
      const semk = normalizeSemantic(rawName)

      if (!strictGroups[sk]) strictGroups[sk] = []
      strictGroups[sk].push({ id: ex.id, name: rawName })

      if (!semanticGroups[semk]) semanticGroups[semk] = []
      semanticGroups[semk].push({ id: ex.id, name: rawName })
    }

    // Grupos semânticos que unificam itens além do estrito
    const semanticDifferences = []
    for (const semk in semanticGroups) {
      const names = Array.from(new Set(semanticGroups[semk].map((x) => x.name)))
      if (names.length > 1) {
        semanticDifferences.push({
          semKey: semk,
          distinctNames: names,
          count: semanticGroups[semk].length,
        })
      }
    }

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    const result = {
      total: exercises.length,
      strictUnique: Object.keys(strictGroups).length,
      semanticUnique: Object.keys(semanticGroups).length,
      semanticDiffs: semanticDifferences.slice(0, 20),
    }
    diagRec.set('custom_css', JSON.stringify(result).substring(0, 4900))
    app.save(diagRec)
  },
  () => {},
)
