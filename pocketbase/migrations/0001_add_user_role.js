migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Adicionar campo role se não existir
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: false,
          values: ['admin', 'professor'],
          maxSelect: 1,
        }),
      )
      app.save(users)
    }
  },
  (app) => {
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.fields.removeByName('role')
      app.save(users)
    } catch (_) {}
  },
)
