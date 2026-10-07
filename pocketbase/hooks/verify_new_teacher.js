onRecordCreate((e) => {
  // Garantir que novos usuários (professores cadastrados pelo admin) fiquem verificados
  e.record.setVerified(true)
  e.next()
}, 'users')
