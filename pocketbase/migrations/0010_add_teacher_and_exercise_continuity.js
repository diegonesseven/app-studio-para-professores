migrate(
  (app) => {
    const workoutCol = app.findCollectionByNameOrId('workout_progress')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Adicionar campo 'teacher' (relation para users)
    if (!workoutCol.fields.getByName('teacher')) {
      workoutCol.fields.add(
        new RelationField({
          name: 'teacher',
          type: 'relation',
          required: false,
          collectionId: usersCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    // 2. Adicionar campo 'completed_indices' (json: array de índices concluídos na série, ex: [0, 1])
    if (!workoutCol.fields.getByName('completed_indices')) {
      workoutCol.fields.add(
        new JSONField({
          name: 'completed_indices',
          type: 'json',
          required: false,
        }),
      )
    }

    // 3. Adicionar campo 'is_completed' (bool: indica se a série inteira foi terminada)
    if (!workoutCol.fields.getByName('is_completed')) {
      workoutCol.fields.add(
        new BoolField({
          name: 'is_completed',
          type: 'bool',
          required: false,
        }),
      )
    }

    app.save(workoutCol)

    // 4. Atualizar registro de aparência padrão com a nova identidade oficial do Studio Bru Oliveira
    try {
      const appSettingsCol = app.findCollectionByNameOrId('app_settings')
      let settingRecord
      try {
        settingRecord = app.findFirstRecordByData('app_settings', 'key', 'appearance')
      } catch (_) {
        settingRecord = new Record(appSettingsCol)
        settingRecord.set('key', 'appearance')
      }

      settingRecord.set('primary_color', '#4B4FA0')
      settingRecord.set('background_color', '#0E111D')
      settingRecord.set('surface_color', '#181C2E')
      settingRecord.set('studio_name', 'Studio Bru Oliveira')
      settingRecord.set('logo_url', '/logo-studio.png')
      app.save(settingRecord)
    } catch (e) {
      console.log('Aviso ao atualizar app_settings na migração:', e)
    }
  },
  (app) => {
    try {
      const workoutCol = app.findCollectionByNameOrId('workout_progress')
      if (workoutCol.fields.getByName('teacher')) {
        workoutCol.fields.removeByName('teacher')
      }
      if (workoutCol.fields.getByName('completed_indices')) {
        workoutCol.fields.removeByName('completed_indices')
      }
      if (workoutCol.fields.getByName('is_completed')) {
        workoutCol.fields.removeByName('is_completed')
      }
      app.save(workoutCol)
    } catch (_) {}
  },
)
