routerAdd(
  'POST',
  '/backend/v1/custom/admin/users/{id}/password',
  (e) => {
    if (!e.auth) {
      throw new UnauthorizedError('Autenticação necessária.')
    }
    if (e.auth.getString('role') !== 'admin') {
      throw new ForbiddenError(
        'Apenas administradores podem redefinir a senha de outros professores.',
      )
    }

    const id = e.request.pathValue('id')
    if (!id) {
      throw new BadRequestError('ID do usuário não informado.')
    }

    const body = e.requestInfo().body || {}
    const password = body.password ? String(body.password) : ''
    const passwordConfirm = body.passwordConfirm ? String(body.passwordConfirm) : password

    if (password) {
      if (password.length < 8) {
        throw new BadRequestError('A nova senha deve ter no mínimo 8 caracteres.')
      }
      if (password !== passwordConfirm) {
        throw new BadRequestError('A confirmação de senha não confere.')
      }
    }

    let record
    try {
      record = e.app.findRecordById('users', id)
    } catch (_) {
      throw new NotFoundError('Usuário não encontrado.')
    }

    if (body.email && typeof body.email === 'string') {
      const nextEmail = body.email.trim().toLowerCase()
      if (nextEmail !== record.getString('email')) {
        record.setEmail(nextEmail)
      }
    }

    if (body.name && typeof body.name === 'string') {
      record.set('name', body.name.trim())
    }
    if (body.role && typeof body.role === 'string') {
      record.set('role', body.role)
    }

    if (password) {
      record.setPassword(password)
    }
    try {
      e.app.save(record)
    } catch (saveErr) {
      var errMsg = saveErr ? String(saveErr) : 'Erro ao salvar professor.'
      if (
        errMsg.indexOf('UNIQUE') !== -1 ||
        errMsg.indexOf('unique') !== -1 ||
        errMsg.indexOf('already') !== -1
      ) {
        throw new BadRequestError('Este e-mail já está em uso por outro usuário.')
      }
      throw new BadRequestError(errMsg)
    }

    return e.json(200, {
      id: record.id,
      email: record.getString('email'),
      name: record.getString('name'),
      role: record.getString('role'),
      updated: record.getString('updated'),
    })
  },
  $apis.requireAuth('users'),
)
