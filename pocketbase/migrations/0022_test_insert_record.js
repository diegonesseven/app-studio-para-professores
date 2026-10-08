migrate(
  (app) => {
    // Teste de inserção de 1 exercício com muscle_group = "Peito"
    const col = app.findCollectionByNameOrId('exercises')
    const rec = new Record(col)
    rec.set('name', 'Teste Insercao Inicial')
    rec.set('youtube_url', 'https://vimeo.com/1234205917')
    rec.set('youtube_id', '1234205917')
    rec.set('muscle_group', 'Peito')
    app.save(rec)
  },
  () => {},
)
