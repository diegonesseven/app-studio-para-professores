migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('app_settings')

    // 1. Adiciona o campo logo_file (tipo file) para upload real de imagens com armazenamento nativo
    if (!col.fields.getByName('logo_file')) {
      col.fields.add(
        new FileField({
          name: 'logo_file',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760, // 10MB
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'],
        }),
      )
    }

    app.save(col)

    // 2. Atualizar o registro appearance padrão com a identidade oficial ROXO (#8B5CF6 / #7C3AED)
    try {
      let record
      try {
        record = app.findFirstRecordByData('app_settings', 'key', 'appearance')
      } catch (_) {
        record = new Record(col)
        record.set('key', 'appearance')
      }

      // Definir paleta roxa predominante solicitada
      record.set('primary_color', '#8B5CF6')
      record.set('background_color', '#0F0E17')
      record.set('surface_color', '#1A1829')
      record.set('studio_name', 'Studio Bru Oliveira')
      app.save(record)
    } catch (e) {
      console.log('Aviso ao inicializar configurações de aparência em 0011:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('app_settings')
      if (col.fields.getByName('logo_file')) {
        col.fields.removeByName('logo_file')
      }
      app.save(col)
    } catch (_) {}
  },
)
