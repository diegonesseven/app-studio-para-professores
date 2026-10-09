migrate(
  (app) => {
    // Diagnosticar quais são os 4 pares que diferem apenas por singular/plural
    const exercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)
    const uniqueMap = new Map()
    for (let i = 0; i < exercises.length; i++) {
      const name = exercises[i].getString('name')
      if (!uniqueMap.has(name)) {
        uniqueMap.set(name, exercises[i].id)
      }
    }
    const uniqueNames = Array.from(uniqueMap.keys())

    function normSingular(s) {
      return (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .replace(/s$/, '')
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
    diagRec.set('studio_name', 'SING_LIST')
    diagRec.set('primary_color', (multiSing[0] || 'none').substring(0, 80))
    diagRec.set('background_color', (multiSing[1] || 'none').substring(0, 80))
    diagRec.set('surface_color', (multiSing.slice(2).join(' ; ') || 'none').substring(0, 80))
    app.save(diagRec)
  },
  () => {},
)
