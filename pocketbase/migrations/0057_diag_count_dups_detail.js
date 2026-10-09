migrate(
  (app) => {
    // Diagnosticar duplicados exatos (mesmo nome normalizado)
    // Listar todos os 67 grupos duplicados
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
      groups[k].push({ id: ex.id, name: nName, created: ex.getString('created') })
    }

    const dups = []
    let totalDups = 0
    for (const k in groups) {
      if (groups[k].length > 1) {
        dups.push({
          name: groups[k][0].name,
          count: groups[k].length,
        })
        totalDups += groups[k].length - 1
      }
    }
    dups.sort((a, b) => b.count - a.count)

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set(
      'studio_name',
      'DUPS: ' + dups.length + ' grupos, ' + totalDups + ' cópias a remover',
    )
    // Salvar top 5 grupos no primary_color
    diagRec.set(
      'primary_color',
      dups
        .slice(0, 5)
        .map((d) => d.name + ' (' + d.count + ')')
        .join(', '),
    )
    diagRec.set(
      'background_color',
      dups
        .slice(5, 10)
        .map((d) => d.name + ' (' + d.count + ')')
        .join(', '),
    )
    diagRec.set(
      'surface_color',
      dups
        .slice(10, 15)
        .map((d) => d.name + ' (' + d.count + ')')
        .join(', '),
    )
    app.save(diagRec)
  },
  () => {},
)
