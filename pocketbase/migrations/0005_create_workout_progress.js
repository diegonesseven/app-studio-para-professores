migrate(
  (app) => {
    const studentsCol = app.findCollectionByNameOrId('students')
    const sheetsCol = app.findCollectionByNameOrId('training_sheets')

    const collection = new Collection({
      name: 'workout_progress',
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
          name: 'training_sheet',
          type: 'relation',
          required: true,
          collectionId: sheetsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'series_completed',
          type: 'select',
          required: true,
          values: ['A', 'B', 'C', 'D', 'E'],
          maxSelect: 1,
        },
        {
          name: 'completed_at',
          type: 'date',
          required: false,
        },
        {
          name: 'exercises_snapshot',
          type: 'json',
          required: false,
        },
        {
          name: 'notes',
          type: 'text',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_workout_progress_student ON workout_progress (student)',
        'CREATE INDEX idx_workout_progress_completed ON workout_progress (completed_at DESC)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('workout_progress')
      app.delete(col)
    } catch (_) {}
  },
)
