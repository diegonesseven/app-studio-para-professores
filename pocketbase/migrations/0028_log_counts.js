migrate(
  (app) => {
    const count = app.countRecords('exercises')
    console.log('EXERCISES_TOTAL_COUNT: ' + count)
  },
  () => {},
)
