migrate(
  (app) => {
    // Diagnosticar todos os pares que diferem APENAS por acentos, pontuação, maiúsculas ou singular/plural
    // entre os 137 nomes únicos
    const exercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)
    const uniqueMap = new Map() // rawName -> exerciseId
    for (let i = 0; i < exercises.length; i++) {
      const name = exercises[i].getString('name')
      if (!uniqueMap.has(name)) {
        uniqueMap.set(name, exercises[i].id)
      }
    }
    const uniqueNames = Array.from(uniqueMap.keys())

    function normAccentsPunct(s) {
      return (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
    }

    // Agrupar por normAccentsPunct
    const groupsAcc = {}
    for (let i = 0; i < uniqueNames.length; i++) {
      const k = normAccentsPunct(uniqueNames[i])
      if (!groupsAcc[k]) groupsAcc[k] = []
      groupsAcc[k].push(uniqueNames[i])
    }

    const multiAcc = []
    for (const k in groupsAcc) {
      if (groupsAcc[k].length > 1) {
        multiAcc.push(groupsAcc[k].join(' <=> '))
      }
    }

    // Verificar se existe "Alongamento" vs "Alongamentos"
    function normSingular(s) {
      return (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .replace(/s$/, '') // remove 's' no fim
    }

    const groupsSing = {}
    for (let i = 0; i < uniqueNames.length; i++) {
      const k = normSingular(uniqueNames[i])
      if (!groupsSing[k]) groupsSing[k] = []
      groupsSing[k].push(uniqueNames[i])
    }

    const multiSing = []
    for (const k in groupsSing) {
      if (groupsSing[k].length > 1) {
        multiSing.push(groupsSing[k].join(' <=> '))
      }
    }

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set('studio_name', 'ACC:' + multiAcc.length + ' | SING:' + multiSing.length)
    diagRec.set('primary_color', (multiAcc.join(' ; ') || 'NENHUM').substring(0, 100))
    diagRec.set('background_color', (multiSing.join(' ; ') || 'NENHUM').substring(0, 100))
    app.save(diagRec)
  },
  () => {},
)
