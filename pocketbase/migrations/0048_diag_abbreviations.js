migrate(
  (app) => {
    // Diagnosticar se há variações além do nome idêntico
    // Ex: "Alongamentos" vs "Alongamentos / Revezar" vs "Alongamento / Revezar"?
    // "Agach Pés Anilha" vs "Agachamento Pés Anilha"?
    // "Agachamento Bola" vs "Agachamento com Bola"?
    // "Flexora Simult." vs "Flexora Deitado"? (Diferente!)
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

    // Testar se algum nome tem abreviação óbvia: "Agach " -> "Agachamento "
    // "Can." -> "Caneleira"
    // "Simult." -> "Simultâneo"
    // "Bco" -> "Banco"
    const expansions = []
    for (let i = 0; i < uniqueNames.length; i++) {
      const orig = uniqueNames[i]
      let expanded = orig
        .replace(/\bAgach\b/gi, 'Agachamento')
        .replace(/\bCan\b\.?/gi, 'Caneleira')
        .replace(/\bSimult\b\.?/gi, 'Simultâneo')
        .replace(/\bBco\b\.?/gi, 'Banco')
        .replace(/\bUnil\b\.?/gi, 'Unilateral')
        .replace(/\bPeg\b\.?/gi, 'Pegada')
        .replace(/\bSup\b\.?/gi, 'Supinada')
        .replace(/\bPron\b\.?/gi, 'Pronada')

      if (expanded !== orig) {
        // Verificar se a versão expandida existe entre os uniqueNames
        const match = uniqueNames.find((u) => u.toLowerCase() === expanded.toLowerCase())
        expansions.push({
          original: orig,
          expanded: expanded,
          hasMatch: !!match,
          matchWith: match || null,
        })
      }
    }

    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set(
      'custom_css',
      JSON.stringify({
        expansions: expansions,
      }).substring(0, 4900),
    )
    app.save(diagRec)
  },
  () => {},
)
