migrate(
  (app) => {
    const studentsCol = app.findCollectionByNameOrId('students')

    const collection = new Collection({
      name: 'physical_assessments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'student',
          type: 'relation',
          required: true,
          collectionId: studentsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'sex',
          type: 'select',
          required: false,
          values: ['M', 'F'],
          maxSelect: 1,
        },
        {
          name: 'data',
          type: 'json',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pa_student ON physical_assessments (student)',
        'CREATE INDEX idx_pa_student_date ON physical_assessments (student, date DESC)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('physical_assessments')
      app.delete(col)
    } catch (_) {}
  },
)
