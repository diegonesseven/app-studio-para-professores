migrate(
  (app) => {
    // Teste de inserção com SQL direto usando 'A classificar'
    app
      .db()
      .newQuery(
        'INSERT INTO exercises (id, name, youtube_url, youtube_id, thumbnail_url, muscle_group, created, updated) VALUES ({:id}, {:name}, {:url}, {:vid}, {:thumb}, {:mg}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      )
      .bind({
        id: 'testsql12345678',
        name: 'Teste SQL A Classificar',
        url: 'https://vimeo.com/1234205917',
        vid: '1234205917',
        thumb: '',
        mg: 'A classificar',
      })
      .execute()
  },
  () => {},
)
