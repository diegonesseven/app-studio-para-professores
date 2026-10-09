migrate(
  (app) => {
    // Diagnosticar nomes únicos e testar normalizações adicionais
    const exercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)

    // Obter todos os 137 nomes distintos
    const uniqueNames = []
    const seen = {}
    for (let i = 0; i < exercises.length; i++) {
      const name = exercises[i].getString('name')
      if (!seen[name]) {
        seen[name] = true
        uniqueNames.push(name)
      }
    }
    uniqueNames.sort()

    // Testar normalizador mais abrangente
    function superNorm(str) {
      let s = (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/º|ª|°/g, ' graus ')
        .replace(/[\.\,\;\:\(\)\/\-\_\"\']/g, ' ')

      const tokens = s.split(/\s+/).filter(Boolean)
      const map = {
        can: 'caneleira',
        caneleiras: 'caneleira',
        bco: 'banco',
        simult: 'simultaneo',
        simul: 'simultaneo',
        simultanea: 'simultaneo',
        unil: 'unilateral',
        unilat: 'unilateral',
        halter: 'halter',
        halteres: 'halter',
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
        flex: 'flexao',
        ext: 'extensao',
        abduc: 'abducao',
        aduc: 'aducao',
      }

      return tokens.map((t) => map[t] || t).join(' ')
    }

    const superGroups = {}
    for (let i = 0; i < uniqueNames.length; i++) {
      const k = superNorm(uniqueNames[i])
      if (!superGroups[k]) superGroups[k] = []
      superGroups[k].push(uniqueNames[i])
    }

    const clusters = []
    for (const k in superGroups) {
      if (superGroups[k].length > 1) {
        clusters.push(superGroups[k])
      }
    }

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    const out = {
      distinctNamesCount: uniqueNames.length,
      superNormUnique: Object.keys(superGroups).length,
      clustersFound: clusters,
      sampleNames: uniqueNames.slice(0, 50),
    }
    diagRec.set('custom_css', JSON.stringify(out).substring(0, 4900))
    app.save(diagRec)
  },
  () => {},
)
