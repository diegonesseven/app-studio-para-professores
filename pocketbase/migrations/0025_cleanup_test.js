migrate(
  (app) => {
    app.db().newQuery('DELETE FROM exercises').execute()
  },
  () => {},
)
