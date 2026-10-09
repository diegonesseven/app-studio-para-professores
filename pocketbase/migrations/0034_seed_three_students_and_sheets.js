migrate(
  (app) => {
    // ══════════════════════════════════════════════════════════════════════════
    // POPULAR 3 ALUNAS COM SUAS FICHAS DE TREINO E HISTÓRICO DE FREQUÊNCIA
    // Carla Rodrigues (29 sessões), Lucia de Farias (12 sessões), Lorrayne Campanharo (17 sessões)
    // Acervo de exercícios sem vídeo, grupo muscular "A classificar", dedup por nome normalizado
    // Nenhuma alteração de schema/migração estrutural.
    // ══════════════════════════════════════════════════════════════════════════

    const studentsCol = app.findCollectionByNameOrId('students')
    const sheetsCol = app.findCollectionByNameOrId('training_sheets')
    const workoutCol = app.findCollectionByNameOrId('workout_progress')

    // Identificar professor/usuário padrão para vínculo
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

    // Normalizador de nome para dedup seguro
    function normalizeKey(str) {
      return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/[^a-z0-9]/g, '') // remove pontuação e espaços
    }

    // Cache local em memória de exercícios para performance e dedup perfeito
    const exerciseCache = new Map() // key normalizada -> id

    // Carregar exercícios já existentes caso algum tenha sido inserido
    try {
      const existingRows = app.db().newQuery('SELECT id, name FROM exercises').all()
      if (existingRows) {
        for (let i = 0; i < existingRows.length; i++) {
          const row = existingRows[i]
          exerciseCache.set(normalizeKey(row.name), row.id)
        }
      }
    } catch (_) {}

    function ensureExercise(canonicalName) {
      const key = normalizeKey(canonicalName)
      if (exerciseCache.has(key)) {
        return exerciseCache.get(key)
      }

      // Consulta no banco caso não esteja em cache
      try {
        const rows = app
          .db()
          .newQuery(
            'SELECT id, name FROM exercises WHERE name = {:name} OR LOWER(name) = LOWER({:name}) LIMIT 1',
          )
          .bind({ name: canonicalName })
          .all()
        if (rows && rows.length > 0) {
          exerciseCache.set(key, rows[0].id)
          return rows[0].id
        }
      } catch (_) {}

      const newId = $security.randomString(15)
      app
        .db()
        .newQuery(
          'INSERT INTO exercises (id, name, youtube_url, youtube_id, thumbnail_url, muscle_group, created, updated) ' +
            'VALUES ({:id}, {:name}, {:url}, {:vid}, {:thumb}, {:mg}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        )
        .bind({
          id: newId,
          name: canonicalName,
          url: '',
          vid: '',
          thumb: '',
          mg: 'A classificar',
        })
        .execute()

      exerciseCache.set(key, newId)
      return newId
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. CARLA RODRIGUES
    // ──────────────────────────────────────────────────────────────────────────
    // Série A
    const idCarla_A1 = ensureExercise('Extensora Curtinho')
    const idCarla_A2 = ensureExercise('Supino Reto Conjugado Halter')
    const idCarla_A3 = ensureExercise('Flexão de Quadril N/AB Can.')
    const idCarla_A4 = ensureExercise('Elevação Frontal Unilateral Halter')
    const idCarla_A5 = ensureExercise('Flexão de Quadril 180º Polia')
    const idCarla_A6 = ensureExercise('Tríceps Testa Simult. Solo Barra H')
    const idCarla_A7 = ensureExercise('Adução em "V" Can.')
    const idCarla_A8 = ensureExercise('Alongamentos / Revezar')

    // Série B
    const idCarla_B1 = ensureExercise('Flexora Simult.')
    const idCarla_B2 = ensureExercise('Remada Curvada Pronado Aberto (Halter)')
    const idCarla_B3 = ensureExercise('Stiff Smith')
    const idCarla_B4 = ensureExercise('Pulley Frente Fechado Peg Sup. (Barra)')
    const idCarla_B5 = ensureExercise('Panturrilha Smith')
    const idCarla_B6 = ensureExercise('Rosca Concentrada Halter')
    const idCarla_B7 = ensureExercise('Pêndulo')
    const idCarla_B8 = idCarla_A8 // Alongamentos / Revezar

    // Série C
    const idCarla_C1 = ensureExercise('Abdutora Inclinada')
    const idCarla_C2 = ensureExercise('Tríceps Testa Polia Barra Step')
    const idCarla_C3 = ensureExercise('Levantamento Terra Sumô')
    const idCarla_C4 = ensureExercise('Tríceps Unilateral Polia')
    const idCarla_C5 = ensureExercise('Abdução Polia Atrás')
    const idCarla_C6 = ensureExercise('Glúteo 180º Polia')
    const idCarla_C7 = ensureExercise('Remada Alta Polia Barra')
    const idCarla_C8 = idCarla_A8 // Alongamentos / Revezar

    // Garantir aluna CARLA RODRIGUES
    let carlaStudent = null
    try {
      carlaStudent = app.findFirstRecordByData('students', 'name', 'CARLA RODRIGUES')
    } catch (_) {}
    if (!carlaStudent) {
      carlaStudent = new Record(studentsCol)
      carlaStudent.set('name', 'CARLA RODRIGUES')
      if (defaultUserId) carlaStudent.set('criado_por', defaultUserId)
      app.save(carlaStudent)
    }

    const carlaSeriesData = {
      A: [
        {
          exercise_id: idCarla_A1,
          sets: 6,
          reps: 'Rest Pause máx',
          time: '30-40s',
          load: '2',
          notes: 'Rest Pause máx',
          order: 1,
        },
        {
          exercise_id: idCarla_A2,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '5',
          notes: '',
          order: 2,
        },
        {
          exercise_id: idCarla_A3,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '5',
          notes: '',
          order: 3,
        },
        {
          exercise_id: idCarla_A4,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '4',
          notes: '',
          order: 4,
        },
        {
          exercise_id: idCarla_A5,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '2',
          notes: '',
          order: 5,
        },
        {
          exercise_id: idCarla_A6,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '4',
          notes: '',
          order: 6,
        },
        {
          exercise_id: idCarla_A7,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '5k',
          notes: '',
          order: 7,
        },
        {
          exercise_id: idCarla_A8,
          sets: 1,
          reps: '',
          time: '30-40s',
          load: '',
          notes: 'Alongamentos / Revezar',
          order: 8,
        },
      ],
      B: [
        {
          exercise_id: idCarla_B1,
          sets: 6,
          reps: 'Rest Pause máx',
          time: '30-40s',
          load: '5',
          notes: 'Rest Pause máx',
          order: 1,
        },
        {
          exercise_id: idCarla_B2,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '',
          notes: '',
          order: 2,
        },
        {
          exercise_id: idCarla_B3,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '15',
          notes: '',
          order: 3,
        },
        {
          exercise_id: idCarla_B4,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '5',
          notes: '',
          order: 4,
        },
        {
          exercise_id: idCarla_B5,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '20',
          notes: '',
          order: 5,
        },
        {
          exercise_id: idCarla_B6,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '6',
          notes: '',
          order: 6,
        },
        {
          exercise_id: idCarla_B7,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '8',
          notes: '',
          order: 7,
        },
        {
          exercise_id: idCarla_B8,
          sets: 1,
          reps: '',
          time: '30-40s',
          load: '',
          notes: 'Alongamentos / Revezar',
          order: 8,
        },
      ],
      C: [
        {
          exercise_id: idCarla_C1,
          sets: 4,
          reps: 'Rest Pause máx',
          time: '30-40s',
          load: '6',
          notes: 'Rest Pause máx',
          order: 1,
        },
        {
          exercise_id: idCarla_C2,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '4',
          notes: '',
          order: 2,
        },
        {
          exercise_id: idCarla_C3,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '10',
          notes: '',
          order: 3,
        },
        {
          exercise_id: idCarla_C4,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '2',
          notes: '',
          order: 4,
        },
        {
          exercise_id: idCarla_C5,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '2',
          notes: '',
          order: 5,
        },
        {
          exercise_id: idCarla_C6,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '3',
          notes: '',
          order: 6,
        },
        {
          exercise_id: idCarla_C7,
          sets: 4,
          reps: '10',
          time: '30-40s',
          load: '3',
          notes: '',
          order: 7,
        },
        {
          exercise_id: idCarla_C8,
          sets: 1,
          reps: '',
          time: '30-40s',
          load: '',
          notes: 'Alongamentos / Revezar',
          order: 8,
        },
      ],
      D: [],
      E: [],
    }

    const carlaSheet = new Record(sheetsCol)
    carlaSheet.set('student', carlaStudent.id)
    carlaSheet.set('title', 'Ficha Carla Rodrigues - Séries A/B/C')
    carlaSheet.set('notes', 'Intervalo / Descanso entre séries: 30–40 segundos')
    carlaSheet.set('series_data', carlaSeriesData)
    carlaSheet.set('start_date', '2026-07-27 12:00:00.000Z')
    carlaSheet.set('is_archived', false)
    app.save(carlaSheet)

    // Frequência de Carla: 29 sessões
    // Sequência exata: A B C A B C A B C A B A B C A B C A B A C A B C A B C A B
    const carlaSequence = [
      'A',
      'B',
      'C',
      'A',
      'B',
      'C',
      'A',
      'B',
      'C',
      'A',
      'B',
      'A',
      'B',
      'C',
      'A',
      'B',
      'C',
      'A',
      'B',
      'A',
      'C',
      'A',
      'B',
      'C',
      'A',
      'B',
      'C',
      'A',
      'B',
    ]

    // Distribuir 29 sessões entre 2026-07-27 e 2026-10-07
    // Intervalo de ~2 a 3 dias (dias úteis de treino)
    const carlaStartMs = 1785153600000 // 2026-07-27 12:00 UTC
    let currentCarlaMs = carlaStartMs
    for (let i = 0; i < carlaSequence.length; i++) {
      const seriesKey = carlaSequence[i]
      const sess = new Record(workoutCol)
      sess.set('student', carlaStudent.id)
      sess.set('training_sheet', carlaSheet.id)
      sess.set('series_completed', seriesKey)
      sess.set('is_completed', true)
      sess.set('completed_indices', [0, 1, 2, 3, 4, 5, 6, 7])
      sess.set('in_progress_indices', [])
      sess.set('notes', `Sessão ${i + 1} concluída - Série ${seriesKey}`)
      if (defaultUserId) sess.set('teacher', defaultUserId)
      sess.set('exercises_snapshot', carlaSeriesData[seriesKey] || [])

      const d = new Date(currentCarlaMs)
      const yr = d.getUTCFullYear()
      const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
      const da = String(d.getUTCDate()).padStart(2, '0')
      const mins = String(10 + ((i * 2) % 45)).padStart(2, '0')
      sess.set('completed_at', `${yr}-${mo}-${da} 14:${mins}:00.000Z`)
      app.save(sess)

      // Incrementa 2 ou 3 dias (ex: seg, qua, sex)
      if (i % 3 === 2) {
        currentCarlaMs += 3 * 24 * 60 * 60 * 1000
      } else {
        currentCarlaMs += 2 * 24 * 60 * 60 * 1000
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. LUCIA DE FARIAS
    // ──────────────────────────────────────────────────────────────────────────
    // Série A
    const idLucia_A1 = ensureExercise('Agach Pés Anilha')
    const idLucia_A2 = ensureExercise('Agachamento Polia (Braços Estendidos)')
    const idLucia_A3 = ensureExercise('Flexão de Quadril 180º Solo (Caneleira)')
    const idLucia_A4 = idCarla_A7 // Adução em "V" Can. (reaproveitado de Carla)
    const idLucia_A5 = ensureExercise('Panturrilha 3 Fases')
    const idLucia_A6 = ensureExercise('Flexão de Braço Smith')
    const idLucia_A7 = ensureExercise('Elevação Lateral Simultaneo Halter')
    const idLucia_A8 = ensureExercise('Abdominal Supra Total')
    const idLucia_A9 = ensureExercise('Alongamentos')

    // Série B
    const idLucia_B1 = idCarla_C6 // Glúteo 180º Polia (reaproveitado de Carla Série C)
    const idLucia_B2 = ensureExercise('Sumô')
    const idLucia_B3 = idCarla_B1 // Flexora Simult. (reaproveitado de Carla Série B)
    const idLucia_B4 = ensureExercise('Abdução Vertical Can.')
    const idLucia_B5 = ensureExercise('Remada Curvada Polia Peg Supinada Barra P')
    const idLucia_B6 = ensureExercise('Rosca Direta Halter')
    const idLucia_B7 = ensureExercise('Abdominal Sanfona')
    const idLucia_B8 = ensureExercise('Abdominal Infra Bola Pequena')
    const idLucia_B9 = idLucia_A9 // Alongamentos

    let luciaStudent = null
    try {
      luciaStudent = app.findFirstRecordByData('students', 'name', 'LUCIA DE FARIAS')
    } catch (_) {}
    if (!luciaStudent) {
      luciaStudent = new Record(studentsCol)
      luciaStudent.set('name', 'LUCIA DE FARIAS')
      if (defaultUserId) luciaStudent.set('criado_por', defaultUserId)
      app.save(luciaStudent)
    }

    const luciaSeriesData = {
      A: [
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
      ],
      B: [
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
      ],
      C: [],
      D: [],
      E: [],
    }

    const luciaSheet = new Record(sheetsCol)
    luciaSheet.set('student', luciaStudent.id)
    luciaSheet.set('title', 'Ficha Lucia de Farias - Séries A/B')
    luciaSheet.set('notes', 'Intervalo / Descanso entre séries: 30–40 segundos')
    luciaSheet.set('series_data', luciaSeriesData)
    luciaSheet.set('start_date', '2026-08-10 12:00:00.000Z')
    luciaSheet.set('is_archived', false)
    app.save(luciaSheet)

    // Frequência de Lucia: 12 sessões (A B A B A B A B A B A B)
    const luciaSequence = ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B']
    const luciaStartMs = 1786363200000 // 2026-08-10 12:00 UTC
    let currentLuciaMs = luciaStartMs
    for (let i = 0; i < luciaSequence.length; i++) {
      const seriesKey = luciaSequence[i]
      const sess = new Record(workoutCol)
      sess.set('student', luciaStudent.id)
      sess.set('training_sheet', luciaSheet.id)
      sess.set('series_completed', seriesKey)
      sess.set('is_completed', true)
      sess.set('completed_indices', [0, 1, 2, 3, 4, 5, 6, 7, 8])
      sess.set('in_progress_indices', [])
      sess.set('notes', `Sessão ${i + 1} concluída - Série ${seriesKey}`)
      if (defaultUserId) sess.set('teacher', defaultUserId)
      sess.set('exercises_snapshot', luciaSeriesData[seriesKey] || [])

      const d = new Date(currentLuciaMs)
      const yr = d.getUTCFullYear()
      const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
      const da = String(d.getUTCDate()).padStart(2, '0')
      const mins = String(15 + ((i * 3) % 40)).padStart(2, '0')
      sess.set('completed_at', `${yr}-${mo}-${da} 15:${mins}:00.000Z`)
      app.save(sess)

      if (i % 2 === 1) {
        currentLuciaMs += 3 * 24 * 60 * 60 * 1000
      } else {
        currentLuciaMs += 2 * 24 * 60 * 60 * 1000
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. LORRAYNE CAMPANHARO
    // ──────────────────────────────────────────────────────────────────────────
    // Série A (nota REVEZAR OS COLORIDOS)
    const idLorrayne_A1 = ensureExercise('Sumô 2 Tempos')
    const idLorrayne_A2 = ensureExercise('Tríceps Francês Unilateral Halter')
    const idLorrayne_A3 = ensureExercise('Agachamento Smith Abduzido')
    const idLorrayne_A4 = ensureExercise('Tríceps Polia Barra V')
    const idLorrayne_A5 = idCarla_C1 // Abdutora Inclinada (reaproveitado de Carla Série C)
    const idLorrayne_A6 = idLucia_B7 // Abdominal Sanfona (reaproveitado de Lucia)

    // Série B
    const idLorrayne_B1 = ensureExercise('Flexora Simul 2 Tempos')
    const idLorrayne_B2 = ensureExercise('Remada Curvada Polia Peg Pronada Barra G')
    const idLorrayne_B3 = ensureExercise('Bom Dia (Anilha na Mão)')
    const idLorrayne_B4 = ensureExercise('Voador Dorsal Simultaneo')
    const idLorrayne_B5 = ensureExercise('Panturrilha Leg 45º')
    const idLorrayne_B6 = ensureExercise('Rosca Martelo Halter')

    // Série C
    const idLorrayne_C1 = ensureExercise('Extensora 2 Tempos')
    const idLorrayne_C2 = ensureExercise('Perdigueiro Unilateral')
    const idLorrayne_C3 = ensureExercise('Agachamento Bola')
    const idLorrayne_C4 = ensureExercise('Voador')
    const idLorrayne_C5 = ensureExercise('Flexão de Quadril 180º Sentado (Caneleira)')
    const idLorrayne_C6 = idLucia_A7 // Elevação Lateral Simultaneo Halter (reaproveitado de Lucia)

    let lorrayneStudent = null
    try {
      lorrayneStudent = app.findFirstRecordByData('students', 'name', 'LORRAYNE CAMPANHARO')
    } catch (_) {}
    if (!lorrayneStudent) {
      lorrayneStudent = new Record(studentsCol)
      lorrayneStudent.set('name', 'LORRAYNE CAMPANHARO')
      if (defaultUserId) lorrayneStudent.set('criado_por', defaultUserId)
      app.save(lorrayneStudent)
    }

    const lorrayneSeriesData = {
      A: [
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
      ],
      B: [
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
      ],
      C: [
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
      ],
      D: [],
      E: [],
    }

    const lorrayneSheet = new Record(sheetsCol)
    lorrayneSheet.set('student', lorrayneStudent.id)
    lorrayneSheet.set('title', 'Ficha Lorrayne Campanharo - Séries A/B/C')
    lorrayneSheet.set(
      'notes',
      'Intervalo / Descanso entre séries: 30–40 segundos. REVEZAR OS COLORIDOS',
    )
    lorrayneSheet.set('series_data', lorrayneSeriesData)
    lorrayneSheet.set('start_date', '2026-09-01 12:00:00.000Z')
    lorrayneSheet.set('is_archived', false)
    app.save(lorrayneSheet)

    // Frequência de Lorrayne: 17 sessões
    // Sequência exata: A B C A B C A B C A B C A B C A B
    const lorrayneSequence = [
      'A',
      'B',
      'C',
      'A',
      'B',
      'C',
      'A',
      'B',
      'C',
      'A',
      'B',
      'C',
      'A',
      'B',
      'C',
      'A',
      'B',
    ]
    const lorrayneStartMs = 1788264000000 // 2026-09-01 12:00 UTC
    let currentLorrayneMs = lorrayneStartMs
    for (let i = 0; i < lorrayneSequence.length; i++) {
      const seriesKey = lorrayneSequence[i]
      const sess = new Record(workoutCol)
      sess.set('student', lorrayneStudent.id)
      sess.set('training_sheet', lorrayneSheet.id)
      sess.set('series_completed', seriesKey)
      sess.set('is_completed', true)
      sess.set('completed_indices', [0, 1, 2, 3, 4, 5])
      sess.set('in_progress_indices', [])
      sess.set('notes', `Sessão ${i + 1} concluída - Série ${seriesKey}`)
      if (defaultUserId) sess.set('teacher', defaultUserId)
      sess.set('exercises_snapshot', lorrayneSeriesData[seriesKey] || [])

      const d = new Date(currentLorrayneMs)
      const yr = d.getUTCFullYear()
      const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
      const da = String(d.getUTCDate()).padStart(2, '0')
      const mins = String(10 + ((i * 3) % 40)).padStart(2, '0')
      sess.set('completed_at', `${yr}-${mo}-${da} 14:${mins}:00.000Z`)
      app.save(sess)

      if (i % 3 === 2) {
        currentLorrayneMs += 3 * 24 * 60 * 60 * 1000
      } else {
        currentLorrayneMs += 2 * 24 * 60 * 60 * 1000
      }
    }

    console.log(
      'MIGRAÇÃO_0034_CONCLUÍDA: Alunas criadas: 3, Exercícios únicos criados: ' +
        exerciseCache.size +
        ', Sessões registradas: Carla=29, Lucia=12, Lorrayne=17',
    )
  },
  (app) => {
    // Reversão limpa as fichas e progresso criados
    try {
      app.db().newQuery('DELETE FROM workout_progress').execute()
      app.db().newQuery('DELETE FROM training_sheets').execute()
      app.db().newQuery('DELETE FROM students').execute()
      app.db().newQuery('DELETE FROM exercises').execute()
    } catch (_) {}
  },
)
