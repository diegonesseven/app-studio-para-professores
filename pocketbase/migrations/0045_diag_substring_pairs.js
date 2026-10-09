migrate(
  (app) => {
    // Diagnosticar cluster analítico entre os 137 nomes
    const exercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)

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

    // Encontrar pares com distância ou similaridade alta
    // e verificar possíveis abreviações/variações não capturadas
    // ex: "Alongamento" vs "Alongamentos", "Agach Pés Anilha" vs "Agachamento Pés Anilha"?
    const pairs = []
    for (let i = 0; i < uniqueNames.length; i++) {
      for (let j = i + 1; j < uniqueNames.length; j++) {
        const a = uniqueNames[i].toLowerCase()
        const b = uniqueNames[j].toLowerCase()
        if (a === b || a.includes(b) || b.includes(a)) {
          pairs.push([uniqueNames[i], uniqueNames[j]])
        }
      }
    }

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set('custom_css', JSON.stringify({ pairs: pairs.slice(0, 30) }).substring(0, 4900))
    app.save(diagRec)
  },
  () => {},
)
