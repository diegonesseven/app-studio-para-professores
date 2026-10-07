migrate(
  (app) => {
    // Carregar coleção de usuários para garantir regras e campos
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Regras de acesso completas
    users.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || id = @request.auth.id)"
    users.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || id = @request.auth.id)"
    users.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    users.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || id = @request.auth.id)"
    users.deleteRule =
      "@request.auth.id != '' && @request.auth.role = 'admin' && id != @request.auth.id"

    app.save(users)
  },
  (app) => {
    // Reverter (no-op)
  },
)
