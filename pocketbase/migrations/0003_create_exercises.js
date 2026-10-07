migrate(
  (app) => {
    const collection = new Collection({
      name: 'exercises',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'youtube_url', type: 'text', required: false },
        { name: 'youtube_id', type: 'text', required: false },
        { name: 'thumbnail_url', type: 'text', required: false },
        {
          name: 'muscle_group',
          type: 'select',
          required: true,
          values: [
            'Peito',
            'Costas',
            'Pernas',
            'Ombros',
            'Bíceps',
            'Tríceps',
            'Abdômen',
            'Glúteos',
            'Cardio',
            'Alongamento',
          ],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_exercises_name ON exercises (name)',
        'CREATE INDEX idx_exercises_muscle_group ON exercises (muscle_group)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('exercises')
      app.delete(col)
    } catch (_) {}
  },
)
