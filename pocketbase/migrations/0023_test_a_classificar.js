migrate(
  (app) => {
    // Limpar registro de teste anterior
    app.db().newQuery('DELETE FROM exercises').execute()
  },
  () => {},
)
