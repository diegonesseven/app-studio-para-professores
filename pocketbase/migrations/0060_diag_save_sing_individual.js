migrate(
  (app) => {
    // Diagnosticar quais são os 4 pares multiSing um por um
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

    // Salvar no diag_p_0 ... diag_p_3
    const settingsCol = app.findCollectionByNameOrId('app_settings')
    for (let i = 0; i < multiSing.length; i++) {
      let r = null
      try {
        r = app.findFirstRecordByData('app_settings', 'key', 'diag_sing_' + i)
      } catch (_) {}
      if (!r) {
        r = new Record(settingsCol)
        r.set('key', 'diag_sing_' + i)
      }
      r.set('studio_name', multiSing[i])
      app.save(r)
    }

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set('studio_name', 'DONE_SING_SAVED')
    app.save(diagRec)
  },
  () => {},
)
