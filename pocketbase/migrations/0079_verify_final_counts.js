migrate(
  (app) => {
    const total = app.countRecords('exercises')
    const withVid = app.findRecordsByFilter('exercises', 'youtube_url != ""', '', 1000, 0).length
    const sheets = app.findRecordsByFilter('training_sheets', '', '', 1000, 0).length

    // Audit report
    let auditRec = null
    try {
      auditRec = app.findFirstRecordByData('app_settings', 'key', 'vimeo_import_report')
    } catch (_) {}

    console.log(
      `STATUS_0079: totalExercises=${total}, withVideo=${withVid}, sheets=${sheets}, auditReport=${auditRec ? auditRec.getString('studio_name') : 'none'}`,
    )

    // Save check in app_settings check_0079
    let checkRec = null
    try {
      checkRec = app.findFirstRecordByData('app_settings', 'key', 'check_0079')
    } catch (_) {}
    if (!checkRec) {
      checkRec = new Record(app.findCollectionByNameOrId('app_settings'))
      checkRec.set('key', 'check_0079')
    }
    checkRec.set('studio_name', `EXERCISES: ${total} | WITH_VIDEO: ${withVid} | SHEETS: ${sheets}`)
    if (auditRec) {
      checkRec.set('primary_color', auditRec.getString('studio_name'))
      checkRec.set('background_color', auditRec.getString('primary_color'))
      checkRec.set('custom_css', auditRec.getString('custom_css'))
    }
    app.save(checkRec)
  },
  () => {},
)
