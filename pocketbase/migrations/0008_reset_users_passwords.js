migrate(
  (app) => {
    // Garantir que as senhas padrão estejam sincronizadas caso tenham sido alteradas ou corrompidas
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'moreiradiego.seven@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('role', 'admin')
      admin.set('name', 'Diego Moreira')
      app.save(admin)
    } catch (_) {}

    try {
      const prof = app.findAuthRecordByEmail('_pb_users_auth_', 'professor@studiobru.com.br')
      prof.setPassword('Skip@Pass')
      prof.setVerified(true)
      prof.set('role', 'professor')
      prof.set('name', 'Professor Bru')
      app.save(prof)
    } catch (_) {}
  },
  (app) => {},
)
