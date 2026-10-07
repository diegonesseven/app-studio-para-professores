migrate(
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'moreiradiego.seven@gmail.com')
      admin.setPassword('Bru@Studio2026!')
      admin.setVerified(true)
      admin.set('role', 'admin')
      app.save(admin)
    } catch (err) {
      console.log('Erro ao atualizar senha do admin:', err)
    }
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'moreiradiego.seven@gmail.com')
      admin.setPassword('Skip@Pass')
      app.save(admin)
    } catch (_) {}
  },
)
