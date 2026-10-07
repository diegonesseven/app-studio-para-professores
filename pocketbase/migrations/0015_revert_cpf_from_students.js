migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('students')
      const cpfField = col.fields.getByName('cpf')
      if (cpfField) {
        col.fields.removeByName('cpf')
        app.save(col)
      }
    } catch (e) {
      console.log('Erro ao remover campo cpf:', e)
    }
  },
  (app) => {
    // down migration
    try {
      const col = app.findCollectionByNameOrId('students')
      if (!col.fields.getByName('cpf')) {
        col.fields.add(
          new TextField({
            name: 'cpf',
            required: false,
          }),
        )
        app.save(col)
      }
    } catch (_) {}
  },
)
