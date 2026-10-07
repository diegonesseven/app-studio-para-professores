migrate(
  (app) => {
    const collection = new Collection({
      name: 'app_settings',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
        },
        {
          name: 'primary_color',
          type: 'text',
          required: false,
        },
        {
          name: 'background_color',
          type: 'text',
          required: false,
        },
        {
          name: 'surface_color',
          type: 'text',
          required: false,
        },
        {
          name: 'logo_url',
          type: 'text',
          required: false,
        },
        {
          name: 'studio_name',
          type: 'text',
          required: false,
        },
        {
          name: 'custom_css',
          type: 'text',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_app_settings_key ON app_settings (key)'],
    })

    app.save(collection)

    // Seed das configurações padrão iniciais
    try {
      const record = new Record(collection)
      record.set('key', 'appearance')
      record.set('primary_color', '#F06A2A')
      record.set('background_color', '#121212')
      record.set('surface_color', '#1E1E1E')
      record.set('studio_name', 'Studio Bru Oliveira')
      record.set('logo_url', '')
      app.save(record)
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('app_settings')
      app.delete(col)
    } catch (_) {}
  },
)
