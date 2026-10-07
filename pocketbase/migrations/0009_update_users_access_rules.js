migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Permitir que admins listem todos os usuários ou o próprio usuário veja a si mesmo
    users.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || id = @request.auth.id)"
    users.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || id = @request.auth.id)"

    // Permitir criação se for admin logado (ou público/vazio se necessário para cadastro, mas aqui apenas admin cadastra novos professores)
    users.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"

    // Permitir atualização se for o próprio usuário ou um admin
    users.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || id = @request.auth.id)"

    // Permitir exclusão apenas se for admin e não for ele mesmo
    users.deleteRule =
      "@request.auth.id != '' && @request.auth.role = 'admin' && id != @request.auth.id"

    app.save(users)
  },
  (app) => {
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.listRule = 'id = @request.auth.id'
      users.viewRule = 'id = @request.auth.id'
      users.createRule = ''
      users.updateRule = 'id = @request.auth.id'
      users.deleteRule = 'id = @request.auth.id'
      app.save(users)
    } catch (_) {}
  },
)
