migrate(
  (app) => {
    // Diagnosticar exercícios salvando estatísticas em app_settings key='diag_exercises'
    const settingsCol = app.findCollectionByNameOrId('app_settings')
    const exercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)

    function normalizeKey(str) {
      return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
    }

    const groups = {}
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      const nName = ex.getString('name')
      const k = normalizeKey(nName)
      if (!groups[k]) groups[k] = []
      groups[k].push({ id: ex.id, name: nName })
    }

    const dupGroups = []
    let totalDupRecords = 0
    for (const k in groups) {
      if (groups[k].length > 1) {
        dupGroups.push({
          key: k,
          count: groups[k].length,
          sample: groups[k].map((g) => g.name).join(' | '),
          ids: groups[k].map((g) => g.id),
        })
        totalDupRecords += groups[k].length - 1
      }
    }

    const summary = {
      totalExercises: exercises.length,
      uniqueKeys: Object.keys(groups).length,
      duplicateGroupsCount: dupGroups.length,
      excessRecordsToRemove: totalDupRecords,
      groups: dupGroups.slice(0, 30), // apenas os primeiros 30 para caber no limite
    }

    let diagRec = null
    try {
      diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    } catch (_) {}

    if (!diagRec) {
      diagRec = new Record(settingsCol)
      diagRec.set('key', 'diag_exercises')
      diagRec.set('studio_name', 'DIAG')
    }
    diagRec.set('custom_css', JSON.stringify(summary).substring(0, 4900))
    app.save(diagRec)
  },
  (app) => {
    try {
      const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
      app.delete(diagRec)
    } catch (_) {}
  },
)
