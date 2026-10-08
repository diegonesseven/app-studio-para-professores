migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('students')
    if (!col.fields.getByName('photo')) {
      col.fields.add(
        new FileField({
          name: 'photo',
          maxSelect: 1,
          maxSize: 5242880, // 5MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('students')
      const photoField = col.fields.getByName('photo')
      if (photoField) {
        col.fields.removeByName('photo')
        app.save(col)
      }
    } catch (_) {}
  },
)
