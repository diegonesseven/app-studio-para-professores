migrate(
  (app) => {
    // 1. students: anamnesis_photos (múltiplas fotos na anamnese) e anamnesis_data (dados estruturados do novo modelo de anamnese)
    const studentsCol = app.findCollectionByNameOrId('students')
    if (!studentsCol.fields.getByName('anamnesis_photos')) {
      studentsCol.fields.add(
        new FileField({
          name: 'anamnesis_photos',
          maxSelect: 10,
          maxSize: 5242880, // 5MB por foto
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }),
      )
    }
    if (!studentsCol.fields.getByName('anamnesis_data')) {
      studentsCol.fields.add(
        new JSONField({
          name: 'anamnesis_data',
          required: false,
        }),
      )
    }
    app.save(studentsCol)

    // 2. training_sheets: start_date (data de início editável) e is_archived (arquivamento de fichas anteriores)
    const sheetsCol = app.findCollectionByNameOrId('training_sheets')
    if (!sheetsCol.fields.getByName('start_date')) {
      sheetsCol.fields.add(
        new DateField({
          name: 'start_date',
          required: false,
        }),
      )
    }
    if (!sheetsCol.fields.getByName('is_archived')) {
      sheetsCol.fields.add(
        new BoolField({
          name: 'is_archived',
          required: false,
        }),
      )
    }
    app.save(sheetsCol)

    // Inicializa start_date para fichas existentes usando sua data de criação (created)
    try {
      app
        .db()
        .newQuery(`
        UPDATE training_sheets
        SET start_date = created
        WHERE start_date IS NULL OR start_date = ''
      `)
        .execute()
    } catch (e) {
      console.log('Aviso ao inicializar start_date em training_sheets:', e)
    }

    // 3. workout_progress: in_progress_indices (índices de exercícios em execução / estado amarelo)
    const workoutCol = app.findCollectionByNameOrId('workout_progress')
    if (!workoutCol.fields.getByName('in_progress_indices')) {
      workoutCol.fields.add(
        new JSONField({
          name: 'in_progress_indices',
          required: false,
        }),
      )
    }
    app.save(workoutCol)
  },
  (app) => {
    try {
      const studentsCol = app.findCollectionByNameOrId('students')
      if (studentsCol.fields.getByName('anamnesis_photos')) {
        studentsCol.fields.removeByName('anamnesis_photos')
      }
      if (studentsCol.fields.getByName('anamnesis_data')) {
        studentsCol.fields.removeByName('anamnesis_data')
      }
      app.save(studentsCol)

      const sheetsCol = app.findCollectionByNameOrId('training_sheets')
      if (sheetsCol.fields.getByName('start_date')) {
        sheetsCol.fields.removeByName('start_date')
      }
      if (sheetsCol.fields.getByName('is_archived')) {
        sheetsCol.fields.removeByName('is_archived')
      }
      app.save(sheetsCol)

      const workoutCol = app.findCollectionByNameOrId('workout_progress')
      if (workoutCol.fields.getByName('in_progress_indices')) {
        workoutCol.fields.removeByName('in_progress_indices')
      }
      app.save(workoutCol)
    } catch (_) {}
  },
)
