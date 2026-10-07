migrate(
  (app) => {
    const collection = new Collection({
      name: 'students',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'birthdate', type: 'date', required: false },
        { name: 'phone', type: 'text', required: false },
        { name: 'general_observations', type: 'text', required: false },
        { name: 'health_history', type: 'text', required: false },
        { name: 'injuries', type: 'text', required: false },
        { name: 'surgeries', type: 'text', required: false },
        { name: 'restrictions', type: 'text', required: false },
        {
          name: 'goals',
          type: 'select',
          required: false,
          values: ['Reabilitação', 'Condicionamento', 'Emagrecimento', 'Hipertrofia', 'Outro'],
          maxSelect: 5,
        },
        {
          name: 'experience_level',
          type: 'select',
          required: false,
          values: ['Iniciante', 'Intermediário', 'Avançado'],
          maxSelect: 1,
        },
        { name: 'teacher_observations', type: 'text', required: false },
        {
          name: 'criado_por',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_students_name ON students (name)',
        'CREATE INDEX idx_students_criado_por ON students (criado_por)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('students')
      app.delete(col)
    } catch (_) {}
  },
)
