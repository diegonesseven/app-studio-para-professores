migrate(
  (app) => {
    const list = app.findRecordsByFilter('exercises', '', 'name', 500, 0)
    console.log('DIAG_FIND_TOTAL_EXERCISES: ' + list.length)
    for (let i = 0; i < list.length; i++) {
      console.log('EX[' + i + ']: ' + list[i].id + ' | ' + list[i].getString('name'))
    }
  },
  () => {},
)
