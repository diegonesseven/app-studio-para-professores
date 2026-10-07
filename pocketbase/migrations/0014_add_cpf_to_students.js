migrate(
  (app) => {
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
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('students')
      const cpfField = col.fields.getByName('cpf')
      if (cpfField) {
        col.fields.removeByName('cpf')
        app.save(col)
      }
    } catch (_) {}
  },
)
