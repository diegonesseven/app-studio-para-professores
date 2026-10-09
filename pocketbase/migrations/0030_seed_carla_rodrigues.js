migrate(
  (app) => {
    // 1. Obter coleções necessárias
    const studentsCol = app.findCollectionByNameOrId('students')
    const sheetsCol = app.findCollectionByNameOrId('training_sheets')
    const workoutCol = app.findCollectionByNameOrId('workout_progress')

    // Obter um professor/usuário padrão se houver
    let defaultUserId = ''
    try {
      const teacherRecord = app.findFirstRecordByData(
        'users',
        'email',
        'brunella-oliveira@hotmail.com',
      )
      defaultUserId = teacherRecord.id
    } catch (_) {
      try {
        const adminRecord = app.findFirstRecordByData('users', 'role', 'admin')
        defaultUserId = adminRecord.id
      } catch (_) {}
    }

    // Helper para achar exercício pelo nome via SQL direto
    function findExerciseByName(name) {
      try {
        const rows = app
          .db()
          .newQuery(
            'SELECT id, name FROM exercises WHERE name = {:name} OR LOWER(name) = LOWER({:name}) LIMIT 1',
          )
          .bind({ name: name })
          .all()
        if (rows && rows.length > 0) {
          return rows[0].id
        }
      } catch (_) {}
      return null
    }

    // Helper para garantir criação de exercício do acervo se não existir
    // Inserção via raw SQL para manter a convenção do acervo ("A classificar" inserido via SQL em 0027)
    function ensureExercise(name) {
      const existingId = findExerciseByName(name)
      if (existingId) return existingId

      const newId = $security.randomString(15)
      app
        .db()
        .newQuery(
          'INSERT INTO exercises (id, name, youtube_url, youtube_id, thumbnail_url, muscle_group, created, updated) ' +
            'VALUES ({:id}, {:name}, {:url}, {:vid}, {:thumb}, {:mg}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        )
        .bind({
          id: newId,
          name: name,
          url: '',
          vid: '',
          thumb: '',
          mg: 'A classificar',
        })
        .execute()

      return newId
    }

    // Mapear exercícios das 3 séries A, B, C
    // Série A
    const idA1 = ensureExercise('Extensora Curtinho')
    const idA2 = ensureExercise('Supino Reto Conjugado Halter')
    const idA3 = ensureExercise('Flexão de Quadril N/AB Can.')
    const idA4 = ensureExercise('Elevação Frontal Unilateral Halter')
    const idA5 = ensureExercise('Flexão de Quadril 180º Polia')
    const idA6 = ensureExercise('Tríceps Testa Simult. Solo Barra H')
    const idA7 = ensureExercise('Adução em "V" Can.')
    const idA8 = ensureExercise('Alongamentos Revezar')

    // Série B
    const idB1 = ensureExercise('Flexora Simult.')
    const idB2 = ensureExercise('Remada Curvada Pronado Aberto (Halter)')
    const idB3 = ensureExercise('Stiff Smith')
    const idB4 = ensureExercise('Pulley Frente Fechado Peg Sup. (Barra)')
    const idB5 = ensureExercise('Panturrilha Smith')
    const idB6 = ensureExercise('Rosca Concentrada Halter')
    const idB7 = ensureExercise('Pêndulo')
    const idB8 = idA8 // Alongamentos Revezar

    // Série C
    const idC1 = ensureExercise('Abdutora Inclinada')
    const idC2 = ensureExercise('Tríceps Testa Polia Barra Step')
    const idC3 = ensureExercise('Levantamento Terra Sumô')
    const idC4 = ensureExercise('Tríceps Unilateral Polia')
    const idC5 = ensureExercise('Abdução Polia Atrás')
    const idC6 = ensureExercise('Glúteo 180º Polia')
    const idC7 = ensureExercise('Remada Alta Polia Barra')
    const idC8 = idA8 // Alongamentos Revezar

    // 2. Garantir aluna CARLA RODRIGUES
    let carlaRecord = null
    try {
      carlaRecord = app.findFirstRecordByData('students', 'name', 'CARLA RODRIGUES')
    } catch (_) {
      try {
        const studentRows = app
          .db()
          .newQuery('SELECT id FROM students WHERE name = "CARLA RODRIGUES" LIMIT 1')
          .all()
        if (studentRows && studentRows.length > 0) {
          carlaRecord = app.findFirstRecordByData('students', 'id', studentRows[0].id)
        }
      } catch (_) {}
    }

    if (!carlaRecord) {
      carlaRecord = new Record(studentsCol)
      carlaRecord.set('name', 'CARLA RODRIGUES')
      if (defaultUserId) {
        carlaRecord.set('criado_por', defaultUserId)
      }
      app.save(carlaRecord)
    }

    const studentId = carlaRecord.id

    // 3. Montar dados da ficha de treino
    const seriesA = [
      {
        exercise_id: idA1,
        sets: 1,
        reps: 'Rest Pause 6 máx',
        time: '30-40s',
        load: '',
        notes: 'Rest Pause 6 máx',
        order: 1,
      },
      { exercise_id: idA2, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 2 },
      { exercise_id: idA3, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 3 },
      { exercise_id: idA4, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 4 },
      { exercise_id: idA5, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 5 },
      { exercise_id: idA6, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 6 },
      { exercise_id: idA7, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 7 },
      {
        exercise_id: idA8,
        sets: 1,
        reps: '',
        time: '30-40s',
        load: '',
        notes: 'Alongamento / Revezar',
        order: 8,
      },
    ]

    const seriesB = [
      {
        exercise_id: idB1,
        sets: 1,
        reps: 'Rest Pause 6 máx',
        time: '30-40s',
        load: '',
        notes: 'Rest Pause 6 máx',
        order: 1,
      },
      { exercise_id: idB2, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 2 },
      { exercise_id: idB3, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 3 },
      { exercise_id: idB4, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 4 },
      { exercise_id: idB5, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 5 },
      { exercise_id: idB6, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 6 },
      { exercise_id: idB7, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 7 },
      {
        exercise_id: idB8,
        sets: 1,
        reps: '',
        time: '30-40s',
        load: '',
        notes: 'Alongamento / Revezar',
        order: 8,
      },
    ]

    const seriesC = [
      {
        exercise_id: idC1,
        sets: 1,
        reps: 'Rest Pause 4 máx',
        time: '30-40s',
        load: '',
        notes: 'Rest Pause 4 máx',
        order: 1,
      },
      { exercise_id: idC2, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 2 },
      { exercise_id: idC3, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 3 },
      { exercise_id: idC4, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 4 },
      { exercise_id: idC5, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 5 },
      { exercise_id: idC6, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 6 },
      { exercise_id: idC7, sets: 4, reps: '10', time: '30-40s', load: '', notes: '', order: 7 },
      {
        exercise_id: idC8,
        sets: 1,
        reps: '',
        time: '30-40s',
        load: '',
        notes: 'Alongamento / Revezar',
        order: 8,
      },
    ]

    const seriesData = {
      A: seriesA,
      B: seriesB,
      C: seriesC,
      D: [],
      E: [],
    }

    const startDateIso = '2026-07-27 12:00:00.000Z'

    // Buscar ficha ativa existente de Carla
    let sheetRecord = null
    try {
      const existingSheets = app.findRecordsByFilter(
        'training_sheets',
        `student = "${studentId}" && is_archived != true`,
        '-created',
        1,
        0,
      )
      if (existingSheets.length > 0) {
        sheetRecord = existingSheets[0]
      }
    } catch (_) {}

    if (!sheetRecord) {
      sheetRecord = new Record(sheetsCol)
      sheetRecord.set('student', studentId)
      sheetRecord.set('title', 'Ficha Carla Rodrigues - Séries A/B/C')
      sheetRecord.set('notes', 'Intervalo / Descanso entre séries: 30–40 segundos')
      sheetRecord.set('series_data', seriesData)
      sheetRecord.set('start_date', startDateIso)
      sheetRecord.set('is_archived', false)
      app.save(sheetRecord)
    } else {
      sheetRecord.set('title', 'Ficha Carla Rodrigues - Séries A/B/C')
      sheetRecord.set('notes', 'Intervalo / Descanso entre séries: 30–40 segundos')
      sheetRecord.set('series_data', seriesData)
      sheetRecord.set('start_date', startDateIso)
      sheetRecord.set('is_archived', false)
      app.save(sheetRecord)
    }

    const sheetId = sheetRecord.id

    // 4. Registrar 20 sessões concluídas no histórico da ficha
    let existingSessionsCount = 0
    try {
      const countRows = app
        .db()
        .newQuery(
          'SELECT COUNT(*) as count FROM workout_progress WHERE student = {:st} AND training_sheet = {:sh} AND is_completed = 1',
        )
        .bind({ st: studentId, sh: sheetId })
        .all()
      if (countRows && countRows.length > 0) {
        existingSessionsCount = Number(countRows[0].count) || 0
      }
    } catch (_) {}

    const targetSessions = 20
    if (existingSessionsCount < targetSessions) {
      const seriesSequence = ['A', 'B', 'C']

      // Base: 27/07/2026
      const baseTimestamp = 1785153600000 // 2026-07-27 12:00:00 UTC
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000

      let currentMs = baseTimestamp
      for (let i = existingSessionsCount; i < targetSessions; i++) {
        const seriesKey = seriesSequence[i % 3]
        const sessionRecord = new Record(workoutCol)
        sessionRecord.set('student', studentId)
        sessionRecord.set('training_sheet', sheetId)
        sessionRecord.set('series_completed', seriesKey)
        sessionRecord.set('is_completed', true)
        sessionRecord.set('completed_indices', [0, 1, 2, 3, 4, 5, 6, 7])
        sessionRecord.set('in_progress_indices', [])
        sessionRecord.set('notes', `Sessão ${i + 1} concluída - Série ${seriesKey}`)
        if (defaultUserId) {
          sessionRecord.set('teacher', defaultUserId)
        }

        // Snapshot dos exercícios da série
        sessionRecord.set('exercises_snapshot', seriesData[seriesKey] || [])

        // Gerar data no formato SQLite/Pocketbase UTC: "YYYY-MM-DD HH:mm:ss.000Z"
        const d = new Date(currentMs)
        const year = d.getUTCFullYear()
        const month = String(d.getUTCMonth() + 1).padStart(2, '0')
        const day = String(d.getUTCDate()).padStart(2, '0')
        const hours = '14'
        const mins = String(10 + ((i * 2) % 45)).padStart(2, '0')
        const dateStr = `${year}-${month}-${day} ${hours}:${mins}:00.000Z`

        sessionRecord.set('completed_at', dateStr)
        app.save(sessionRecord)

        // Incrementa data: alterna entre 2 dias e 3 dias (seg, qua, sex...)
        if (i % 3 === 2) {
          currentMs += threeDaysMs
        } else {
          currentMs += twoDaysMs
        }
      }
    }
  },
  (app) => {
    // Reversão limpa apenas a aluna Carla e registros associados
    try {
      const carla = app.findFirstRecordByData('students', 'name', 'CARLA RODRIGUES')
      if (carla) {
        app
          .db()
          .newQuery('DELETE FROM workout_progress WHERE student = {:st}')
          .bind({ st: carla.id })
          .execute()
        app
          .db()
          .newQuery('DELETE FROM training_sheets WHERE student = {:st}')
          .bind({ st: carla.id })
          .execute()
        app.delete(carla)
      }
    } catch (_) {}
  },
)
