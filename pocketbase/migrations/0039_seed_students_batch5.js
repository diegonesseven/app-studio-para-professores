migrate(
  (app) => {
    // ══════════════════════════════════════════════════════════════════════════
    // MIGRAÇÃO 0039 - SEED LOTE 5 (Alunas 84 a 92 de 92)
    // 84. Lucilene (9, Abd Supra Total com AP, Prancha Ventral 3xMÁX)
    // 85. Catia de Fatima (2, correções "4"→"3" e "4"→"5")
    // 86. Rayllany Silva (2, "Sentado Curtinho" manuscrito, carga 20)
    // 87. Adriana Prates (5 séries A–E, 3 sessões, "5"5"5"" em 6 exercícios, Rosca 21 "7/7/7")
    // 88. Rosangela Marcelino (30 sessões, Prancha Ventral 3xMÁX, Abd Supra Curtinho 3x30, Perdigueiro Isometria 3x30 SEG)
    // 89. Cristina Coan (3)
    // 90. Denner G Silva (4, Prancha 3xMÁX)
    // 91. Jaqueline Rodrigues (17, "Supra pernas elevadas" manuscrito no lugar do "Abd Can. Alternado" riscado)
    // 92. Jose Carlos Delunardo (20, Crucifixo Halter Invertido)
    // 93. Bruno Marques (6, "3L 3R 3L 3R", cargas 5/20/9/9/10/3/8 | 5/16/25/13.5/9/10/80/11.5 | 10/5/10/10/11/4/13.5/30/40)
    // 94. Vanzita (15, "Flexão de Joelho POETA"→Can, "ABD Remador" e "ABD Can. Alternado" riscados, Agachamento 10"10" carga 10, Adutora 10" Isso Final 2, "8 CADA")
    // 95. Rodrigo da Silva (4, A–D, "Supino Fechado Halter Bco"→Supino unilateral bco 35, "Remada Alta Unilateral Halter" com Altera, "INVER..." riscado, "10 DE CADA", Pranchas 3xMÁX, Extensora Isometria 3xMÁX, "Esteira 12min" manuscrito)
    // ══════════════════════════════════════════════════════════════════════════
    const studentsCol = app.findCollectionByNameOrId('students')
    const sheetsCol = app.findCollectionByNameOrId('training_sheets')
    const workoutCol = app.findCollectionByNameOrId('workout_progress')

    let defaultUserId = ''
    try {
      const teacher = app.findFirstRecordByData('users', 'email', 'brunella-oliveira@hotmail.com')
      defaultUserId = teacher.id
    } catch (_) {
      try {
        const admin = app.findFirstRecordByData('users', 'role', 'admin')
        defaultUserId = admin.id
      } catch (_) {}
    }

    function normalizeKey(str) {
      return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
    }

    const exerciseCache = new Map()
    try {
      const existing = app.db().newQuery('SELECT id, name FROM exercises').all()
      if (existing) {
        for (let i = 0; i < existing.length; i++) {
          exerciseCache.set(normalizeKey(existing[i].name), existing[i].id)
        }
      }
    } catch (_) {}

    function ensureExercise(canonicalName) {
      const key = normalizeKey(canonicalName)
      if (exerciseCache.has(key)) return exerciseCache.get(key)
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
          'INSERT INTO exercises (id, name, youtube_url, youtube_id, thumbnail_url, muscle_group, created, updated) VALUES ({:id}, {:name}, "", "", "", "A classificar", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        )
        .bind({ id: newId, name: canonicalName })
        .execute()
      exerciseCache.set(key, newId)
      return newId
    }

    function createStudentSheetAndProgress(data) {
      let st = null
      try {
        st = app.findFirstRecordByData('students', 'name', data.name)
      } catch (_) {}
      if (!st) {
        st = new Record(studentsCol)
        st.set('name', data.name)
        if (defaultUserId) st.set('criado_por', defaultUserId)
        app.save(st)
      }

      const seriesData = { A: [], B: [], C: [], D: [], E: [] }
      const keys = ['A', 'B', 'C', 'D', 'E']
      for (let k = 0; k < keys.length; k++) {
        const letter = keys[k]
        const list = data.series[letter] || []
        for (let j = 0; j < list.length; j++) {
          const item = list[j]
          const exId = ensureExercise(item.name)
          seriesData[letter].push({
            exercise_id: exId,
            sets: item.sets || 3,
            reps: String(item.reps || '10'),
            time: item.time || '30-40s',
            load: String(item.load || ''),
            notes: item.notes || '',
            order: j + 1,
          })
        }
      }

      const sheet = new Record(sheetsCol)
      sheet.set('student', st.id)
      sheet.set('title', data.title || `Ficha ${data.name}`)
      sheet.set('notes', data.notes || 'Intervalo / Descanso entre séries: 30–40 segundos')
      sheet.set('series_data', seriesData)
      sheet.set('start_date', data.startDate || '2026-08-01 12:00:00.000Z')
      sheet.set('is_archived', false)
      app.save(sheet)

      const seq = data.frequency || []
      const baseMs = 1785585600000
      let curMs = baseMs
      for (let s = 0; s < seq.length; s++) {
        const sKey = seq[s]
        const sess = new Record(workoutCol)
        sess.set('student', st.id)
        sess.set('training_sheet', sheet.id)
        sess.set('series_completed', sKey)
        sess.set('is_completed', true)
        const countEx = (seriesData[sKey] || []).length
        const indices = []
        for (let idx = 0; idx < countEx; idx++) indices.push(idx)
        sess.set('completed_indices', indices)
        sess.set('in_progress_indices', [])
        sess.set('notes', `Sessão ${s + 1} concluída - Série ${sKey}`)
        if (defaultUserId) sess.set('teacher', defaultUserId)
        sess.set('exercises_snapshot', seriesData[sKey] || [])

        const d = new Date(curMs)
        const yr = d.getUTCFullYear()
        const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
        const da = String(d.getUTCDate()).padStart(2, '0')
        const mins = String(10 + ((s * 3) % 45)).padStart(2, '0')
        sess.set('completed_at', `${yr}-${mo}-${da} 14:${mins}:00.000Z`)
        app.save(sess)

        curMs += (s % 3 === 2 ? 3 : 2) * 24 * 60 * 60 * 1000
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 84. LUCILENE (9, Abd Supra Total com AP, Prancha Ventral 3xMÁX)
    // ──────────────────────────────────────────────────────────────────────────
    createStudentSheetAndProgress({
      name: 'LUCILENE',
      title: 'Ficha Lucilene - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 9 sessões. Abd Supra Total com AP e Prancha Ventral 3xMÁX.',
      startDate: '2026-08-05 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: '' },
          {
            name: 'Abdominal Supra Total com AP',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'Abd Supra Total com AP',
          },
        ],
        B: [
          { name: 'Stiff Smith', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '4',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Prancha Ventral',
            sets: 3,
            reps: 'MÁX',
            load: '',
            notes: 'Prancha Ventral 3xMÁX',
          },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 85. CATIA DE FATIMA (2, correções "4"→"3" e "4"→"5")
    createStudentSheetAndProgress({
      name: 'CATIA DE FATIMA',
      title: 'Ficha Catia de Fatima - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 2 sessões. Correções manuscritas de carga: 4 corrigido para 3 e 4 corrigido para 5.',
      startDate: '2026-08-20 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Agach Pés Anilha',
            sets: 3,
            reps: '10',
            load: '5',
            notes: 'Carga corrigida de 4 para 5',
          },
          {
            name: 'Extensora Curtinho',
            sets: 3,
            reps: '10',
            load: '3',
            notes: 'Carga corrigida de 4 para 3',
          },
          { name: 'Adução em "V" Can.', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '12', load: '', notes: '' },
        ],
        B: [
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Sumô', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Remada Curvada Polia Peg Supinada Barra P',
            sets: 3,
            reps: '10',
            load: '3',
            notes: '',
          },
          { name: 'Rosca Direta Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '12', load: '', notes: '' },
        ],
        C: [
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '15', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B'],
    })

    // 86. RAYLLANY SILVA (2, "Sentado Curtinho" manuscrito, carga 20)
    createStudentSheetAndProgress({
      name: 'RAYLLANY SILVA',
      title: 'Ficha Rayllany Silva - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 2 sessões. Manuscrito Sentado Curtinho e carga 20 na panturrilha.',
      startDate: '2026-08-18 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Leg Press 45º', sets: 3, reps: '10', load: '40', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '4',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '25', notes: '' },
          {
            name: 'Panturrilha Sentado Curtinho',
            sets: 3,
            reps: '15',
            load: '20',
            notes: 'Sentado Curtinho manuscrito, carga 20',
          },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B'],
    })

    // 87. ADRIANA PRATES (5 séries A–E, 3 sessões, "5"5"5"" em 6 exercícios, Rosca 21 "7/7/7")
    createStudentSheetAndProgress({
      name: 'ADRIANA PRATES',
      title: 'Ficha Adriana Prates - Séries A/B/C/D/E',
      notes:
        'Intervalo 30–40 segundos. 3 sessões (Séries A–E). Técnica 5"5"5" aplicada em 6 exercícios e Rosca 21 (7/7/7).',
      startDate: '2026-08-15 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Agachamento Smith Abduzido',
            sets: 4,
            reps: '5"5"5"',
            load: '10',
            notes: '5"5"5"',
          },
          { name: 'Leg Press 45º', sets: 4, reps: '5"5"5"', load: '40', notes: '5"5"5"' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '5"5"5"', load: '12', notes: '5"5"5"' },
          { name: 'Flexora Simul 2 Tempos', sets: 3, reps: '5"5"5"', load: '4', notes: '5"5"5"' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '5',
            notes: '',
          },
          { name: 'Rosca 21 Barra W', sets: 3, reps: '7/7/7', load: '6', notes: 'Rosca 21 7/7/7' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '5"5"5"', load: '12', notes: '5"5"5"' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '5"5"5"', load: '25', notes: '5"5"5"' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
        ],
        D: [
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        E: [
          { name: 'Cardio Livre', sets: 1, reps: '25 min', load: '', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C'],
    })

    // 88. ROSANGELA MARCELINO (30 sessões, Prancha Ventral 3xMÁX, Abd Supra Curtinho 3x30, Perdigueiro Isometria 3x30 SEG)
    createStudentSheetAndProgress({
      name: 'ROSANGELA MARCELINO',
      title: 'Ficha Rosangela Marcelino - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 30 sessões. Prancha Ventral 3xMÁX, Abd Supra Curtinho 3x30 e Perdigueiro Isometria 3x30 SEG.',
      startDate: '2026-07-01 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 4, reps: '10', load: '5', notes: '' },
          { name: 'Extensora Curtinho', sets: 4, reps: '10', load: '3', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '12', load: '3', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: '' },
          {
            name: 'Abdominal Supra Curtinho',
            sets: 3,
            reps: '30',
            load: '',
            notes: 'Abd Supra Curtinho 3x30',
          },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '4',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Perdigueiro Isometria',
            sets: 3,
            reps: '30s',
            load: '',
            notes: 'Perdigueiro Isometria 3x30 SEG',
          },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Prancha Ventral',
            sets: 3,
            reps: 'MÁX',
            load: '',
            notes: 'Prancha Ventral 3xMÁX',
          },
        ],
      },
      frequency: [
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
      ],
    })

    // 89. CRISTINA COAN (3)
    createStudentSheetAndProgress({
      name: 'CRISTINA COAN',
      title: 'Ficha Cristina Coan - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 3 sessões registradas.',
      startDate: '2026-08-20 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '12', load: '', notes: '' },
        ],
        B: [
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Sumô', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Remada Curvada Polia Peg Supinada Barra P',
            sets: 3,
            reps: '10',
            load: '3',
            notes: '',
          },
          { name: 'Rosca Direta Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '12', load: '', notes: '' },
        ],
        C: [
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '15', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C'],
    })

    // 90. DENNER G SILVA (4, Prancha 3xMÁX)
    createStudentSheetAndProgress({
      name: 'DENNER G SILVA',
      title: 'Ficha Denner G Silva - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 4 sessões. Prancha 3xMÁX.',
      startDate: '2026-08-15 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '16', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '15', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '35', notes: '' },
          { name: 'Remada Curvada Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '7', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: 'MÁX', load: '', notes: 'Prancha 3xMÁX' },
        ],
        C: [
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '60', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '25', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A'],
    })

    // 91. JAQUELINE RODRIGUES (17, "Supra pernas elevadas" manuscrito no lugar do "Abd Can. Alternado" riscado)
    createStudentSheetAndProgress({
      name: 'JAQUELINE RODRIGUES',
      title: 'Ficha Jaqueline Rodrigues - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 17 sessões. Supra pernas elevadas manuscrito no lugar de Abd Can. Alternado riscado.',
      startDate: '2026-07-20 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Flexora Simul 2 Tempos', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '4',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Abdominal Supra Pernas Elevadas',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'Supra pernas elevadas substitui Abd Can. Alternado riscado',
          },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: [
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
      ],
    })

    // 92. JOSE CARLOS DELUNARDO (20, Crucifixo Halter Invertido)
    createStudentSheetAndProgress({
      name: 'JOSE CARLOS DELUNARDO',
      title: 'Ficha Jose Carlos Delunardo - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 20 sessões. Exercício Crucifixo Invertido Halter presente na Série B.',
      startDate: '2026-07-15 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '18', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Voador', sets: 3, reps: '12', load: '35', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 4, reps: '12', load: '20', notes: '' },
          { name: 'Tríceps Francês Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '10', load: '35', notes: '' },
          {
            name: 'Crucifixo Invertido Halter',
            sets: 3,
            reps: '12',
            load: '6',
            notes: 'Crucifixo Halter Invertido',
          },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
        ],
        C: [
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '80', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '12', load: '5', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Desenvolvimento Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '30', notes: '' },
        ],
      },
      frequency: [
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
        'C',
        'A',
        'B',
      ],
    })

    // 93. BRUNO MARQUES (6, "3L 3R 3L 3R", cargas manuscritas detalhadas)
    createStudentSheetAndProgress({
      name: 'BRUNO MARQUES',
      title: 'Ficha Bruno Marques - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 6 sessões. 3L 3R 3L 3R. Cargas exatas extraídas da ficha: Série A (5/20/9/9/10/3/8), Série B (5/16/25/13.5/9/10/80/11.5), Série C (10/5/10/10/11/4/13.5/30/40).',
      startDate: '2026-08-10 12:00:00.000Z',
      series: {
        A: [
          { name: 'Mobilidade Articular', sets: 3, reps: '10', load: '5', notes: '3L 3R 3L 3R' },
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '9', notes: '' },
          { name: 'Voador', sets: 3, reps: '12', load: '9', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 4, reps: '12', load: '10', notes: '' },
          { name: 'Tríceps Francês Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '8', notes: '' },
        ],
        B: [
          { name: 'Mobilidade Articular', sets: 3, reps: '10', load: '5', notes: '3L 3R 3L 3R' },
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '16', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '25', notes: '' },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '10', load: '13.5', notes: '' },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '9', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '80', notes: '' },
          { name: 'Extensão Lombar Banco', sets: 3, reps: '12', load: '11.5', notes: '' },
        ],
        C: [
          { name: 'Mobilidade Articular', sets: 3, reps: '10', load: '10', notes: '3L 3R 3L 3R' },
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '5', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '12', load: '10', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '11', notes: '' },
          { name: 'Desenvolvimento Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Elevação Lateral Halter', sets: 3, reps: '12', load: '13.5', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '30', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '40', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 94. VANZITA (15, "Flexão de Joelho POETA"→Can, "ABD Remador" e "ABD Can. Alternado" riscados, Agachamento 10"10" carga 10, Adutora 10" Isso Final 2, "8 CADA")
    createStudentSheetAndProgress({
      name: 'VANZITA',
      title: 'Ficha Vanzita - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 15 sessões. Flexão de joelho POETA corrigida para caneleira, ABD Remador e ABD Can. Alternado riscados a mão, Agachamento 10"10" (carga 10), Adutora 10" Iso Final (carga 2), 8 CADA.',
      startDate: '2026-07-20 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Agach Pés Anilha',
            sets: 4,
            reps: '10"10"',
            load: '10',
            notes: 'Agachamento 10"10" carga 10',
          },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Adutora Máquina',
            sets: 3,
            reps: '10" iso final',
            load: '2',
            notes: 'Adutora 10" Iso Final carga 2',
          },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Abdominal Supra Total',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'Remador e Can. Alternado riscados',
          },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '12', notes: '' },
          {
            name: 'Flexão de Joelho Caneleira Solo',
            sets: 3,
            reps: '10',
            load: '3',
            notes: 'Flexão de Joelho POETA corrigido para Caneleira',
          },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '8 cada', load: '2', notes: '8 CADA' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '4',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          {
            name: 'Elevação Lateral Simultaneo Halter',
            sets: 3,
            reps: '8 cada',
            load: '3',
            notes: '8 CADA',
          },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 95. RODRIGO DA SILVA (4, A–D, "Supino Fechado Halter Bco"→Supino unilateral bco 35, "Remada Alta Unilateral Halter" com Altera, "INVER..." riscado, "10 DE CADA", Pranchas 3xMÁX, Extensora Isometria 3xMÁX, "Esteira 12min" manuscrito)
    createStudentSheetAndProgress({
      name: 'RODRIGO DA SILVA',
      title: 'Ficha Rodrigo da Silva - Séries A/B/C/D',
      notes:
        'Intervalo 30–40 segundos. 4 sessões (Séries A–D). Correções manuscritas: Supino unilateral banco 35, Remada Alta Unilateral Halter (10 DE CADA), INVER... riscado, Pranchas 3xMÁX, Extensora Isometria 3xMÁX e Esteira 12min.',
      startDate: '2026-08-15 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Esteira 12min',
            sets: 1,
            reps: '12 min',
            load: '',
            notes: 'Esteira 12min manuscrito',
          },
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '18', notes: '' },
          {
            name: 'Supino Unilateral Banco 35º Halter',
            sets: 3,
            reps: '10 de cada',
            load: '12',
            notes: 'Supino Fechado corrigido a mão para unilateral bco 35 (10 DE CADA)',
          },
          { name: 'Crucifixo Máquina', sets: 3, reps: '12', load: '35', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '18', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: 'MÁX', load: '', notes: 'Pranchas 3xMÁX' },
        ],
        B: [
          {
            name: 'Esteira 12min',
            sets: 1,
            reps: '12 min',
            load: '',
            notes: 'Esteira 12min manuscrito',
          },
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '12', notes: '' },
          {
            name: 'Remada Alta Unilateral Halter',
            sets: 3,
            reps: '10 de cada',
            load: '8',
            notes: 'Remada Alta Unilateral com Altera (10 DE CADA, INVER... riscado)',
          },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
        ],
        C: [
          {
            name: 'Esteira 12min',
            sets: 1,
            reps: '12 min',
            load: '',
            notes: 'Esteira 12min manuscrito',
          },
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '80', notes: '' },
          {
            name: 'Extensora Isometria',
            sets: 3,
            reps: 'MÁX',
            load: '5',
            notes: 'Extensora Isometria 3xMÁX',
          },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '30', notes: '' },
        ],
        D: [
          {
            name: 'Esteira 12min',
            sets: 1,
            reps: '12 min',
            load: '',
            notes: 'Esteira 12min manuscrito',
          },
          { name: 'Desenvolvimento Halter', sets: 3, reps: '10', load: '8', notes: '' },
          {
            name: 'Elevação Lateral Halter',
            sets: 3,
            reps: '10 de cada',
            load: '5',
            notes: '10 DE CADA',
          },
          { name: 'Prancha Lateral', sets: 3, reps: 'MÁX', load: '', notes: 'Pranchas 3xMÁX' },
        ],
      },
      frequency: ['A', 'B', 'C', 'D'],
    })

    console.log('MIGRAÇÃO_0039_CONCLUÍDA: Alunas 84 a 95 cadastradas com sucesso.')
  },
  (app) => {
    const list = [
      'LUCILENE',
      'CATIA DE FATIMA',
      'RAYLLANY SILVA',
      'ADRIANA PRATES',
      'ROSANGELA MARCELINO',
      'CRISTINA COAN',
      'DENNER G SILVA',
      'JAQUELINE RODRIGUES',
      'JOSE CARLOS DELUNARDO',
      'BRUNO MARQUES',
      'VANZITA',
      'RODRIGO DA SILVA',
    ]
    for (let i = 0; i < list.length; i++) {
      try {
        const s = app.findFirstRecordByData('students', 'name', list[i])
        app
          .db()
          .newQuery('DELETE FROM workout_progress WHERE student = {:id}')
          .bind({ id: s.id })
          .execute()
        app
          .db()
          .newQuery('DELETE FROM training_sheets WHERE student = {:id}')
          .bind({ id: s.id })
          .execute()
        app.delete(s)
      } catch (_) {}
    }
  },
)
