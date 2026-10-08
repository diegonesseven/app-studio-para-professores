migrate(
  (app) => {
    const count = app.countRecords('exercises')
    const idCol = app.findCollectionByNameOrId('exercises').id
    // Salvar a contagem em uma linha de log para termos certeza absoluta
    console.log('TOTAL_CONFIRMED: ' + count)
    if (count !== 237) {
      throw new Error('Count must be exactly 237, found: ' + count)
    }
  },
  () => {},
)
