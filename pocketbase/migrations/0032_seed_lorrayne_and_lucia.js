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

    // Helper para achar exercício pelo nome exato ou sem case
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
    // Inserção em "A classificar" sem vídeo
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

    // ═════════════════════════════════════════════════════════════════
    // 1. ALUNA 1: LORRAYNE CAMPANHARO
    // ═════════════════════════════════════════════════════════════════

    // Exercícios Série A:
    // 1. SUMÔ 2 TEMPOS — P: 20 — S: 4 — R: 10
    // 2. TRÍCEPS FRANCÊS UNILATERAL HALTER — P: 4 — S: 4 — R: 10
    // 3. AGACHAMENTO SMITH ABDUZIDO — P: 12 — S: 4 — R: 10
    // 4. TRÍCEPS POLIA BARRA V — P: 4+2 — S: 4 — R: 10
    // 5. ABDUTORA INCLINADA — P: 8 — S: 4 — R: 10
    // 6. ABDOMINAL SANFONA — P: (em branco) — S: 4 — R: 10-15
    const idLorrayne_A1 = ensureExercise('Sumô 2 Tempos')
    const idLorrayne_A2 = ensureExercise('Triceps Frances Unilateral Halter')
    const idLorrayne_A3 = ensureExercise('Agachamento Smith Abduzido')
    const idLorrayne_A4 = ensureExercise('Tríceps Polia Barra V')
    const idLorrayne_A5 = ensureExercise('Abdutora Inclinada')
    const idLorrayne_A6 = ensureExercise('Abdominal Sanfona')

    // Exercícios Série B:
    // 1. FLEXORA SIMUL 2 TEMPOS — P: 4 — S: 4 — R: 10
    // 2. REMADA CURVADA POLIA PEG PRONADA BARRA G — P: 6 — S: 4 — R: 10
    // 3. BOM DIA (ANILHA NA MÃO) — P: 15 — S: 4 — R: 10
    // 4. VOADOR DORSAL SIMULTANEO — P: 0+2 — S: 4 — R: 10
    // 5. PANTURRILHA LEG 45° — P: 40 — S: 4 — R: 10
    // 6. ROSCA MARTELO HALTER — P: 4 — S: 4 — R: 10
    const idLorrayne_B1 = ensureExercise('Flexora Simul 2 Tempos')
    const idLorrayne_B2 = ensureExercise('Remada Curvada Polia Peg Pronada Barra G')
    const idLorrayne_B3 = ensureExercise('Bom Dia (Anilha na Mão)')
    const idLorrayne_B4 = ensureExercise('Voador Dorsal Simultaneo')
    const idLorrayne_B5 = ensureExercise('Panturrilha Leg 45°')
    const idLorrayne_B6 = ensureExercise('Rosca Martelo Halter')

    // Exercícios Série C:
    // 1. EXTENSORA 2 TEMPOS — P: (em branco) — S: 3 — R: 10
    // 2. PERDIGUEIRO UNILATERAL — P: (em branco) — S: 3 — R: 10
    // 3. AGACHAMENTO BOLA — P: 9 — S: 3 — R: 10
    // 4. VOADOR — P: 2 — S: 3 — R: 10
    // 5. FLEXÃO DE QUADRIL 180° SENTADO (CANELEIRA) — P: 4 — S: 4 — R: 10
    // 6. ELEVAÇÃO LATERAL SIMULTANEO HALTER — P: 4 — S: 4 — R: 10
    const idLorrayne_C1 = ensureExercise('Extensora 2 Tempos')
    const idLorrayne_C2 = ensureExercise('Perdigueiro Unilateral')
    const idLorrayne_C3 = ensureExercise('Agachamento Bola')
    const idLorrayne_C4 = ensureExercise('Voador')
    const idLorrayne_C5 = ensureExercise('Flexão de Quadril 180º Sentado (Caneleira)')
    const idLorrayne_C6 = ensureExercise('Elevação Lateral Simultaneo Halter')

    // Checar duplicidade da aluna LORRAYNE CAMPANHARO
    let lorrayneRecord = null
    try {
      lorrayneRecord = app.findFirstRecordByData('students', 'name', 'LORRAYNE CAMPANHARO')
    } catch (_) {
      try {
        const studentRows = app
          .db()
          .newQuery('SELECT id FROM students WHERE UPPER(name) = "LORRAYNE CAMPANHARO" LIMIT 1')
          .all()
        if (studentRows && studentRows.length > 0) {
          lorrayneRecord = app.findFirstRecordByData('students', 'id', studentRows[0].id)
        }
      } catch (_) {}
    }

    if (!lorrayneRecord) {
      lorrayneRecord = new Record(studentsCol)
      lorrayneRecord.set('name', 'LORRAYNE CAMPANHARO')
      if (defaultUserId) {
        lorrayneRecord.set('criado_por', defaultUserId)
      }
      app.save(lorrayneRecord)
    }

    const lorrayneId = lorrayneRecord.id

    // Montar blocos da ficha da Lorrayne
    // Intervalo 30–40 segundos (time: '30-40s')
    const lorrayneSeriesA = [
      {
        exercise_id: idLorrayne_A1,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '20',
        notes: 'REVEZAR OS COLORIDOS',
        order: 1,
      },
      {
        exercise_id: idLorrayne_A2,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '4',
        notes: 'REVEZAR OS COLORIDOS',
        order: 2,
      },
      {
        exercise_id: idLorrayne_A3,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '12',
        notes: 'REVEZAR OS COLORIDOS',
        order: 3,
      },
      {
        exercise_id: idLorrayne_A4,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '4+2',
        notes: 'REVEZAR OS COLORIDOS',
        order: 4,
      },
      {
        exercise_id: idLorrayne_A5,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '8',
        notes: 'REVEZAR OS COLORIDOS',
        order: 5,
      },
      {
        exercise_id: idLorrayne_A6,
        sets: 4,
        reps: '10-15',
        time: '30-40s',
        load: '',
        notes: 'REVEZAR OS COLORIDOS',
        order: 6,
      },
    ]

    const lorrayneSeriesB = [
      {
        exercise_id: idLorrayne_B1,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '4',
        notes: 'REVEZAR OS COLORIDOS',
        order: 1,
      },
      {
        exercise_id: idLorrayne_B2,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '6',
        notes: 'REVEZAR OS COLORIDOS',
        order: 2,
      },
      {
        exercise_id: idLorrayne_B3,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '15',
        notes: 'REVEZAR OS COLORIDOS',
        order: 3,
      },
      {
        exercise_id: idLorrayne_B4,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '0+2',
        notes: 'REVEZAR OS COLORIDOS',
        order: 4,
      },
      {
        exercise_id: idLorrayne_B5,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '40',
        notes: 'REVEZAR OS COLORIDOS',
        order: 5,
      },
      {
        exercise_id: idLorrayne_B6,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '4',
        notes: 'REVEZAR OS COLORIDOS',
        order: 6,
      },
    ]

    const lorrayneSeriesC = [
      {
        exercise_id: idLorrayne_C1,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '',
        notes: 'REVEZAR OS COLORIDOS',
        order: 1,
      },
      {
        exercise_id: idLorrayne_C2,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '',
        notes: 'REVEZAR OS COLORIDOS',
        order: 2,
      },
      {
        exercise_id: idLorrayne_C3,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '9',
        notes: 'REVEZAR OS COLORIDOS',
        order: 3,
      },
      {
        exercise_id: idLorrayne_C4,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '2',
        notes: 'REVEZAR OS COLORIDOS',
        order: 4,
      },
      {
        exercise_id: idLorrayne_C5,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '4',
        notes: 'REVEZAR OS COLORIDOS',
        order: 5,
      },
      {
        exercise_id: idLorrayne_C6,
        sets: 4,
        reps: '10',
        time: '30-40s',
        load: '4',
        notes: 'REVEZAR OS COLORIDOS',
        order: 6,
      },
    ]

    const lorrayneSeriesData = {
      A: lorrayneSeriesA,
      B: lorrayneSeriesB,
      C: lorrayneSeriesC,
      D: [],
      E: [],
    }

    const lorrayneStartDateIso = '2026-09-01 12:00:00.000Z'

    // Buscar ficha ativa de Lorrayne
    let lorrayneSheetRecord = null
    try {
      const existingSheets = app.findRecordsByFilter(
        'training_sheets',
        `student = "${lorrayneId}" && is_archived != true`,
        '-created',
        1,
        0,
      )
      if (existingSheets.length > 0) {
        lorrayneSheetRecord = existingSheets[0]
      }
    } catch (_) {}

    if (!lorrayneSheetRecord) {
      lorrayneSheetRecord = new Record(sheetsCol)
      lorrayneSheetRecord.set('student', lorrayneId)
      lorrayneSheetRecord.set('title', 'Ficha Lorrayne Campanharo - Séries A/B/C')
      lorrayneSheetRecord.set(
        'notes',
        'Intervalo / Descanso entre séries: 30–40 segundos. REVEZAR OS COLORIDOS',
      )
      lorrayneSheetRecord.set('series_data', lorrayneSeriesData)
      lorrayneSheetRecord.set('start_date', lorrayneStartDateIso)
      lorrayneSheetRecord.set('is_archived', false)
      app.save(lorrayneSheetRecord)
    } else {
      lorrayneSheetRecord.set('title', 'Ficha Lorrayne Campanharo - Séries A/B/C')
      lorrayneSheetRecord.set(
        'notes',
        'Intervalo / Descanso entre séries: 30–40 segundos. REVEZAR OS COLORIDOS',
      )
      lorrayneSheetRecord.set('series_data', lorrayneSeriesData)
      lorrayneSheetRecord.set('start_date', lorrayneStartDateIso)
      lorrayneSheetRecord.set('is_archived', false)
      app.save(lorrayneSheetRecord)
    }

    const lorrayneSheetId = lorrayneSheetRecord.id

    // Registrar 14 sessões de Lorrayne: A, B, C, A, B, C, A, B, C, A, B, C, A, B
    const lorrayneSequence = ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B']
    let lorrayneExistingCount = 0
    try {
      const cRows = app
        .db()
        .newQuery(
          'SELECT COUNT(*) as count FROM workout_progress WHERE student = {:st} AND training_sheet = {:sh} AND is_completed = 1',
        )
        .bind({ st: lorrayneId, sh: lorrayneSheetId })
        .all()
      if (cRows && cRows.length > 0) {
        lorrayneExistingCount = Number(cRows[0].count) || 0
      }
    } catch (_) {}

    if (lorrayneExistingCount < lorrayneSequence.length) {
      // 01/09/2026 12:00 UTC
      const baseMsLorrayne = 1788264000000 // 2026-09-01 12:00:00 UTC
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000

      let currentMs = baseMsLorrayne
      for (let i = lorrayneExistingCount; i < lorrayneSequence.length; i++) {
        const seriesKey = lorrayneSequence[i]
        const sessionRecord = new Record(workoutCol)
        sessionRecord.set('student', lorrayneId)
        sessionRecord.set('training_sheet', lorrayneSheetId)
        sessionRecord.set('series_completed', seriesKey)
        sessionRecord.set('is_completed', true)
        sessionRecord.set('completed_indices', [0, 1, 2, 3, 4, 5])
        sessionRecord.set('in_progress_indices', [])
        sessionRecord.set('notes', `Sessão ${i + 1} concluída - Série ${seriesKey}`)
        if (defaultUserId) {
          sessionRecord.set('teacher', defaultUserId)
        }
        sessionRecord.set('exercises_snapshot', lorrayneSeriesData[seriesKey] || [])

        const d = new Date(currentMs)
        const year = d.getUTCFullYear()
        const month = String(d.getUTCMonth() + 1).padStart(2, '0')
        const day = String(d.getUTCDate()).padStart(2, '0')
        const hours = '14'
        const mins = String(10 + ((i * 3) % 40)).padStart(2, '0')
        const dateStr = `${year}-${month}-${day} ${hours}:${mins}:00.000Z`
        sessionRecord.set('completed_at', dateStr)

        app.save(sessionRecord)

        if (i % 3 === 2) {
          currentMs += threeDaysMs
        } else {
          currentMs += twoDaysMs
        }
      }
    }

    // ═════════════════════════════════════════════════════════════════
    // 2. ALUNA 2: LUCIA DE FARIAS
    // ═════════════════════════════════════════════════════════════════

    // Exercícios Série A:
    // 1. AGACH PÉS ANILHA — P: 5 — S: 3 — R: 10
    // 2. AGACHAMENTO POLIA (BRAÇOS ESTENDIDOS) — P: 4 — S: 3 — R: 10
    // 3. FLEXÃO DE QUADRIL 180° SOLO (CANELEIRA) — P: 2 — S: 3 — R: 10
    // 4. ADUÇÃO EM "V" CAN. — P: 2 — S: 3 — R: 10
    // 5. PANTURRILHA 3 FASES — P: (em branco) — S: 3 — R: 8/8/8
    // 6. FLEXÃO DE BRAÇO SMITH — P: (em branco) — S: 3 — R: 10
    // 7. ELEVAÇÃO LATERAL SIMULTANEO HALTER — P: 2 — S: 3 — R: 10
    // 8. ABDOMINAL SUPRA TOTAL — P: (em branco) — S: 3 — R: 10-15
    // 9. ALONGAMENTOS — P: (em branco)
    const idLucia_A1 = ensureExercise('Agach Pés Anilha')
    const idLucia_A2 = ensureExercise('Agachamento Frontal Polia Braços Esticados') // acervo existente de braços estendidos/esticados
    const idLucia_A3 = ensureExercise('Flexão de Quadril 180º Solo (Caneleira)')
    const idLucia_A4 = ensureExercise('Adução em "V" Can.')
    const idLucia_A5 = ensureExercise('Panturrilha 3 Fases')
    const idLucia_A6 = ensureExercise('Flexão de Braço Smith')
    const idLucia_A7 = ensureExercise('Elevação Lateral Simultaneo Halter')
    const idLucia_A8 = ensureExercise('Abdominal Supra Total')
    const idLucia_A9 = ensureExercise('Alongamentos')

    // Exercícios Série B:
    // 1. GLÚTEO 180° POLIA — P: 2 — S: 3 — R: 10
    // 2. SUMÔ — P: 7 — S: 3 — R: 10
    // 3. FLEXORA SIMUL — P: 4 — S: 3 — R: 10
    // 4. ABDUÇÃO VERTICAL CAN. — P: 2 — S: 3 — R: 10
    // 5. REMADA CURVADA POLIA PEG SUPINADA BARRA P — P: 4 — S: 3 — R: 10
    // 6. ROSCA DIRETA HALTER — P: 3 — S: 3 — R: 10
    // 7. ABDOMINAL SANFONA — P: (em branco) — S: 3 — R: 10
    // 8. ABDOMINAL INFRA BOLA PEQUENA — P: (em branco) — S: 3 — R: 10-15
    // 9. ALONGAMENTOS — P: (em branco)
    const idLucia_B1 = ensureExercise('Glúteo 180º Polia')
    const idLucia_B2 = ensureExercise('Sumô')
    const idLucia_B3 = ensureExercise('Flexora Simult.')
    const idLucia_B4 = ensureExercise('Abdução Vertical Caneleira')
    const idLucia_B5 = ensureExercise('Remada Curvada Polia Peg Supinada Barra P')
    const idLucia_B6 = ensureExercise('Rosca Direta Halter')
    const idLucia_B7 = ensureExercise('Abdominal Sanfona')
    const idLucia_B8 = ensureExercise('Abdominal Infra Bola Pequena')
    const idLucia_B9 = idLucia_A9 // Alongamentos

    // Checar duplicidade da aluna LUCIA DE FARIAS
    let luciaRecord = null
    try {
      luciaRecord = app.findFirstRecordByData('students', 'name', 'LUCIA DE FARIAS')
    } catch (_) {
      try {
        const studentRows = app
          .db()
          .newQuery('SELECT id FROM students WHERE UPPER(name) = "LUCIA DE FARIAS" LIMIT 1')
          .all()
        if (studentRows && studentRows.length > 0) {
          luciaRecord = app.findFirstRecordByData('students', 'id', studentRows[0].id)
        }
      } catch (_) {}
    }

    if (!luciaRecord) {
      luciaRecord = new Record(studentsCol)
      luciaRecord.set('name', 'LUCIA DE FARIAS')
      if (defaultUserId) {
        luciaRecord.set('criado_por', defaultUserId)
      }
      app.save(luciaRecord)
    }

    const luciaId = luciaRecord.id

    // Montar blocos da ficha de Lucia (Séries A e B)
    const luciaSeriesA = [
      {
        exercise_id: idLucia_A1,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '5',
        notes: '',
        order: 1,
      },
      {
        exercise_id: idLucia_A2,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '4',
        notes: 'Braços estendidos',
        order: 2,
      },
      {
        exercise_id: idLucia_A3,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '2',
        notes: '',
        order: 3,
      },
      {
        exercise_id: idLucia_A4,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '2',
        notes: '',
        order: 4,
      },
      {
        exercise_id: idLucia_A5,
        sets: 3,
        reps: '8/8/8',
        time: '30-40s',
        load: '',
        notes: '3 fases',
        order: 5,
      },
      {
        exercise_id: idLucia_A6,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '',
        notes: '',
        order: 6,
      },
      {
        exercise_id: idLucia_A7,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '2',
        notes: '',
        order: 7,
      },
      {
        exercise_id: idLucia_A8,
        sets: 3,
        reps: '10-15',
        time: '30-40s',
        load: '',
        notes: '',
        order: 8,
      },
      {
        exercise_id: idLucia_A9,
        sets: 1,
        reps: '',
        time: '30-40s',
        load: '',
        notes: 'Alongamentos',
        order: 9,
      },
    ]

    const luciaSeriesB = [
      {
        exercise_id: idLucia_B1,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '2',
        notes: '',
        order: 1,
      },
      {
        exercise_id: idLucia_B2,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '7',
        notes: '',
        order: 2,
      },
      {
        exercise_id: idLucia_B3,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '4',
        notes: '',
        order: 3,
      },
      {
        exercise_id: idLucia_B4,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '2',
        notes: '',
        order: 4,
      },
      {
        exercise_id: idLucia_B5,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '4',
        notes: 'Peg Supinada Barra P',
        order: 5,
      },
      {
        exercise_id: idLucia_B6,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '3',
        notes: '',
        order: 6,
      },
      {
        exercise_id: idLucia_B7,
        sets: 3,
        reps: '10',
        time: '30-40s',
        load: '',
        notes: '',
        order: 7,
      },
      {
        exercise_id: idLucia_B8,
        sets: 3,
        reps: '10-15',
        time: '30-40s',
        load: '',
        notes: '',
        order: 8,
      },
      {
        exercise_id: idLucia_B9,
        sets: 1,
        reps: '',
        time: '30-40s',
        load: '',
        notes: 'Alongamentos',
        order: 9,
      },
    ]

    const luciaSeriesData = {
      A: luciaSeriesA,
      B: luciaSeriesB,
      C: [],
      D: [],
      E: [],
    }

    const luciaStartDateIso = '2026-08-10 12:00:00.000Z'

    // Buscar ficha ativa de Lucia
    let luciaSheetRecord = null
    try {
      const existingSheets = app.findRecordsByFilter(
        'training_sheets',
        `student = "${luciaId}" && is_archived != true`,
        '-created',
        1,
        0,
      )
      if (existingSheets.length > 0) {
        luciaSheetRecord = existingSheets[0]
      }
    } catch (_) {}

    if (!luciaSheetRecord) {
      luciaSheetRecord = new Record(sheetsCol)
      luciaSheetRecord.set('student', luciaId)
      luciaSheetRecord.set('title', 'Ficha Lucia de Farias - Séries A/B')
      luciaSheetRecord.set('notes', 'Intervalo / Descanso entre séries: 30–40 segundos')
      luciaSheetRecord.set('series_data', luciaSeriesData)
      luciaSheetRecord.set('start_date', luciaStartDateIso)
      luciaSheetRecord.set('is_archived', false)
      app.save(luciaSheetRecord)
    } else {
      luciaSheetRecord.set('title', 'Ficha Lucia de Farias - Séries A/B')
      luciaSheetRecord.set('notes', 'Intervalo / Descanso entre séries: 30–40 segundos')
      luciaSheetRecord.set('series_data', luciaSeriesData)
      luciaSheetRecord.set('start_date', luciaStartDateIso)
      luciaSheetRecord.set('is_archived', false)
      app.save(luciaSheetRecord)
    }

    const luciaSheetId = luciaSheetRecord.id

    // Registrar 12 sessões de Lucia: A, B, A, B, A, B, A, B, A, B, A, B
    const luciaSequence = ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B']
    let luciaExistingCount = 0
    try {
      const cRows = app
        .db()
        .newQuery(
          'SELECT COUNT(*) as count FROM workout_progress WHERE student = {:st} AND training_sheet = {:sh} AND is_completed = 1',
        )
        .bind({ st: luciaId, sh: luciaSheetId })
        .all()
      if (cRows && cRows.length > 0) {
        luciaExistingCount = Number(cRows[0].count) || 0
      }
    } catch (_) {}

    if (luciaExistingCount < luciaSequence.length) {
      // 10/08/2026 12:00 UTC
      const baseMsLucia = 1786363200000 // 2026-08-10 12:00:00 UTC
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000

      let currentMs = baseMsLucia
      for (let i = luciaExistingCount; i < luciaSequence.length; i++) {
        const seriesKey = luciaSequence[i]
        const sessionRecord = new Record(workoutCol)
        sessionRecord.set('student', luciaId)
        sessionRecord.set('training_sheet', luciaSheetId)
        sessionRecord.set('series_completed', seriesKey)
        sessionRecord.set('is_completed', true)
        sessionRecord.set('completed_indices', [0, 1, 2, 3, 4, 5, 6, 7, 8])
        sessionRecord.set('in_progress_indices', [])
        sessionRecord.set('notes', `Sessão ${i + 1} concluída - Série ${seriesKey}`)
        if (defaultUserId) {
          sessionRecord.set('teacher', defaultUserId)
        }
        sessionRecord.set('exercises_snapshot', luciaSeriesData[seriesKey] || [])

        const d = new Date(currentMs)
        const year = d.getUTCFullYear()
        const month = String(d.getUTCMonth() + 1).padStart(2, '0')
        const day = String(d.getUTCDate()).padStart(2, '0')
        const hours = '15'
        const mins = String(15 + ((i * 3) % 40)).padStart(2, '0')
        const dateStr = `${year}-${month}-${day} ${hours}:${mins}:00.000Z`
        sessionRecord.set('completed_at', dateStr)

        app.save(sessionRecord)

        if (i % 2 === 1) {
          currentMs += threeDaysMs
        } else {
          currentMs += twoDaysMs
        }
      }
    }
  },
  (app) => {
    // Reversão das duas alunas criadas
    try {
      const lorrayne = app.findFirstRecordByData('students', 'name', 'LORRAYNE CAMPANHARO')
      if (lorrayne) {
        app
          .db()
          .newQuery('DELETE FROM workout_progress WHERE student = {:st}')
          .bind({ st: lorrayne.id })
          .execute()
        app
          .db()
          .newQuery('DELETE FROM training_sheets WHERE student = {:st}')
          .bind({ st: lorrayne.id })
          .execute()
        app.delete(lorrayne)
      }
    } catch (_) {}

    try {
      const lucia = app.findFirstRecordByData('students', 'name', 'LUCIA DE FARIAS')
      if (lucia) {
        app
          .db()
          .newQuery('DELETE FROM workout_progress WHERE student = {:st}')
          .bind({ st: lucia.id })
          .execute()
        app
          .db()
          .newQuery('DELETE FROM training_sheets WHERE student = {:st}')
          .bind({ st: lucia.id })
          .execute()
        app.delete(lucia)
      }
    } catch (_) {}
  },
)
