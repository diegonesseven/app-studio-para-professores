migrate(
  (app) => {
    // ══════════════════════════════════════════════════════════════════════════
    // MIGRAÇÃO 0038 - SEED LOTE 4 (Alunas 64 a 83 de 83)
    // 64. Elizabeth Gava (10, "Braços estendidos" manuscrito, cargas "3+2")
    // 65. Celiza Fonseca (0 sessões, DROP 3C)
    // 66. Ediana Alves (9, correção "90°" no Glúteo CAN. Solo)
    // 67. Kajsa Salles (2, "5"5"5"", repetições "4/6/8", "8 CADA")
    // 68. Pamella Ramos (16, "2+2" e "3+2")
    // 69. Angela Leal (8, "5 mao", "11.5")
    // 70. Jose Robson (4)
    // 71. Renata Campolina (11, "6+2"/"3+2", Prancha Ventral 3xMÁX)
    // 72. Mairon Subtil (8, DROP 3C, 8/10/12, "Pron" e "ABD infra bco declinado" manuscritos)
    // 73. Caroline Hermogenes (11, PIRÂMIDE 10/8/6/4, "15/20/25/30", "8/9/10/11+2", "20/30/35/40", "REVEZAR OS ABDOMINAIS")
    // 74. Geruza Gasparini (3, A–D)
    // 75. Gabriela Pertel (18, correção riscada na S da Leg 45°, "10"10" iso", "Cruzado", "8 CADA")
    // 76. Brenda Pereira (9, cargas "0+2")
    // 77. Nycolas Oliveira (5, A,B,A,A,B, Prancha 3xMÁX)
    // 78. Larissa Galote (frequência em branco, tudo 3x15, sem cargas)
    // 79. Dulcimar Muller (24, Rest Pause 6 MÁX, "2+2", "0+1")
    // 80. Polyana (7, correção "Triângulo"→"Barra Fechado")
    // 81. ISMALIA (22, duas correções riscadas na C, Mobilidade 3→2 x10, manuscritos "Abd supra polia"/"Abd bike banco pulley"/Abdução Atrás com Caneleira/Tríceps Francês)
    // 82. MARIA CAROLINA - GYMPASS (5, tudo 3x12)
    // 83. NATALIA C BRABO (19, começa em B)
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
    // 64. ELIZABETH GAVA (10, "Braços estendidos" manuscrito, cargas "3+2")
    // ──────────────────────────────────────────────────────────────────────────
    createStudentSheetAndProgress({
      name: 'ELIZABETH GAVA',
      title: 'Ficha Elizabeth Gava - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 10 sessões. Manuscrito: Braços estendidos no Agachamento Polia e carga 3+2.',
      startDate: '2026-08-01 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '5', notes: '' },
          {
            name: 'Agachamento Polia (Braços Estendidos)',
            sets: 3,
            reps: '10',
            load: '3+2',
            notes: 'Braços estendidos manuscrito',
          },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '3+2', notes: '3+2' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '15', load: '', notes: '' },
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
          { name: 'Abdominal Infra Bola Pequena', sets: 3, reps: '15', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'],
    })

    // 65. CELIZA FONSECA (0 sessões, DROP 3C)
    createStudentSheetAndProgress({
      name: 'CELIZA FONSECA',
      title: 'Ficha Celiza Fonseca - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 0 sessões registradas. Técnica DROP 3C indicada.',
      startDate: '2026-08-25 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: 'DROP 3C', load: '4', notes: 'DROP 3C' },
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
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: 'DROP 3C', load: '25', notes: 'DROP 3C' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: [],
    })

    // 66. EDIANA ALVES (9, correção "90°" no Glúteo CAN. Solo)
    createStudentSheetAndProgress({
      name: 'EDIANA ALVES',
      title: 'Ficha Ediana Alves - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 9 sessões. Correção manuscrita 90° no Glúteo CAN. Solo.',
      startDate: '2026-08-05 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          {
            name: 'Glúteo 90º Solo Caneleira',
            sets: 3,
            reps: '10',
            load: '2',
            notes: 'Correção 90° no Glúteo CAN. Solo',
          },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Remada Curvada Polia Peg Supinada Barra P',
            sets: 3,
            reps: '10',
            load: '3',
            notes: '',
          },
          { name: 'Rosca Direta Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '15', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 67. KAJSA SALLES (2, "5"5"5"", repetições "4/6/8", "8 CADA")
    createStudentSheetAndProgress({
      name: 'KAJSA SALLES',
      title: 'Ficha Kajsa Salles - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 2 sessões. Técnicas 5"5"5", repetições 4/6/8 e 8 CADA.',
      startDate: '2026-08-20 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Agachamento Smith Abduzido',
            sets: 3,
            reps: '5"5"5"',
            load: '10',
            notes: '5"5"5"',
          },
          { name: 'Leg Press 45º', sets: 3, reps: '4/6/8', load: '40', notes: '4/6/8' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 3, reps: '5"5"5"', load: '12', notes: '5"5"5"' },
          { name: 'Flexora Simul 2 Tempos', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '8 cada', load: '2', notes: '8 CADA' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '4',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '3', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          {
            name: 'Elevação Lateral Simultaneo Halter',
            sets: 3,
            reps: '8 cada',
            load: '2',
            notes: '8 CADA',
          },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B'],
    })

    // 68. PAMELLA RAMOS (16, "2+2" e "3+2")
    createStudentSheetAndProgress({
      name: 'PAMELLA RAMOS',
      title: 'Ficha Pamella Ramos - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 16 sessões. Cargas compostas 2+2 e 3+2.',
      startDate: '2026-07-22 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2+2', notes: '2+2' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '3+2', notes: '3+2' },
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
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'],
    })

    // 69. ANGELA LEAL (8, "5 mao", "11.5")
    createStudentSheetAndProgress({
      name: 'ANGELA LEAL',
      title: 'Ficha Angela Leal - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 8 sessões. Cargas anotadas: 5 mao e 11.5.',
      startDate: '2026-08-05 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '5 mao', notes: '5 mao' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '11.5', notes: '11.5' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '15', load: '', notes: '' },
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
          { name: 'Abdominal Infra Bola Pequena', sets: 3, reps: '15', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'],
    })

    // 70. JOSE ROBSON (4)
    createStudentSheetAndProgress({
      name: 'JOSE ROBSON',
      title: 'Ficha Jose Robson - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 4 sessões registradas.',
      startDate: '2026-08-15 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 3, reps: '10', load: '15', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '15', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 3, reps: '10', load: '35', notes: '' },
          { name: 'Remada Curvada Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Rosca Direta Halter', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Leg Press 45º', sets: 3, reps: '10', load: '50', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '20', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A'],
    })

    // 71. RENATA CAMPOLINA (11, "6+2"/"3+2", Prancha Ventral 3xMÁX)
    createStudentSheetAndProgress({
      name: 'RENATA CAMPOLINA',
      title: 'Ficha Renata Campolina - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 11 sessões. Cargas 6+2 e 3+2. Prancha Ventral 3xMÁX.',
      startDate: '2026-08-01 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3+2', notes: '3+2' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '3+2', notes: '3+2' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '15', notes: '' },
          { name: 'Flexora Simul 2 Tempos', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '6+2',
            notes: '6+2',
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
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'],
    })

    // 72. MAIRON SUBTIL (8, DROP 3C, 8/10/12, "Pron" e "ABD infra bco declinado" manuscritos)
    createStudentSheetAndProgress({
      name: 'MAIRON SUBTIL',
      title: 'Ficha Mairon Subtil - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 8 sessões. DROP 3C, repetições 8/10/12, pegada Pronada e ABD infra banco declinado manuscritos.',
      startDate: '2026-08-05 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 3, reps: '8/10/12', load: '20', notes: '8/10/12' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Voador', sets: 3, reps: 'DROP 3C', load: '35', notes: 'DROP 3C' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '18', notes: '' },
          {
            name: 'Abdominal Infra Banco Declinado',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'ABD infra bco declinado manuscrito',
          },
        ],
        B: [
          {
            name: 'Puxada Frente Pronada',
            sets: 3,
            reps: '8/10/12',
            load: '40',
            notes: 'Pron manuscrito',
          },
          { name: 'Remada Curvada Halter', sets: 3, reps: '10', load: '12', notes: '' },
          {
            name: 'Remada Baixa Triângulo',
            sets: 3,
            reps: 'DROP 3C',
            load: '35',
            notes: 'DROP 3C',
          },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
        ],
        C: [
          { name: 'Agachamento Smith', sets: 4, reps: '8/10/12', load: '20', notes: '8/10/12' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '80', notes: '' },
          { name: 'Extensora Máquina', sets: 3, reps: 'DROP 3C', load: '40', notes: 'DROP 3C' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '30', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'],
    })

    // 73. CAROLINE HERMOGENES (11, PIRÂMIDE 10/8/6/4, "15/20/25/30", "8/9/10/11+2", "20/30/35/40", "REVEZAR OS ABDOMINAIS")
    createStudentSheetAndProgress({
      name: 'CAROLINE HERMOGENES',
      title: 'Ficha Caroline Hermogenes - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 11 sessões. PIRÂMIDE 10/8/6/4 com progressão de cargas (15/20/25/30, 8/9/10/11+2, 20/30/35/40) e REVEZAR OS ABDOMINAIS.',
      startDate: '2026-08-01 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Agachamento Smith Abduzido',
            sets: 4,
            reps: '10/8/6/4',
            load: '15/20/25/30',
            notes: 'PIRÂMIDE 10/8/6/4 - 15/20/25/30',
          },
          {
            name: 'Leg Press 45º',
            sets: 4,
            reps: '10/8/6/4',
            load: '20/30/35/40',
            notes: 'PIRÂMIDE 10/8/6/4 - 20/30/35/40',
          },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Supino Reto Halter',
            sets: 3,
            reps: '10',
            load: '4',
            notes: 'REVEZAR OS ABDOMINAIS',
          },
          {
            name: 'Tríceps Polia Barra V',
            sets: 4,
            reps: '10/8/6/4',
            load: '8/9/10/11+2',
            notes: 'PIRÂMIDE 8/9/10/11+2',
          },
          {
            name: 'Abdominal Sanfona',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'REVEZAR OS ABDOMINAIS',
          },
        ],
        B: [
          {
            name: 'Stiff Smith',
            sets: 4,
            reps: '10/8/6/4',
            load: '15/20/25/30',
            notes: 'PIRÂMIDE 10/8/6/4',
          },
          { name: 'Flexora Simul 2 Tempos', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '5',
            notes: 'REVEZAR OS ABDOMINAIS',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '4', notes: '' },
          {
            name: 'Abdominal Supra Solo',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'REVEZAR OS ABDOMINAIS',
          },
        ],
        C: [
          {
            name: 'Sumô 2 Tempos',
            sets: 4,
            reps: '10/8/6/4',
            load: '16/20/24/28',
            notes: 'PIRÂMIDE 10/8/6/4',
          },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '30', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'],
    })

    // 74. GERUZA GASPARINI (3, A–D)
    createStudentSheetAndProgress({
      name: 'GERUZA GASPARINI',
      title: 'Ficha Geruza Gasparini - Séries A/B/C/D',
      notes: 'Intervalo 30–40 segundos. 3 sessões registradas (Séries A–D).',
      startDate: '2026-08-20 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '12', load: '', notes: '' },
        ],
        B: [
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Remada Curvada Polia Peg Supinada Barra P',
            sets: 3,
            reps: '10',
            load: '3',
            notes: '',
          },
          { name: 'Abdominal Sanfona', sets: 3, reps: '12', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Elevação Lateral Halter', sets: 3, reps: '10', load: '2', notes: '' },
        ],
        D: [
          { name: 'Cardio Livre', sets: 1, reps: '20 min', load: '', notes: 'Cardio' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C'],
    })

    // 75. GABRIELA PERTEL (18, correção riscada na S da Leg 45°, "10"10" iso", "Cruzado", "8 CADA")
    createStudentSheetAndProgress({
      name: 'GABRIELA PERTEL',
      title: 'Ficha Gabriela Pertel - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 18 sessões. Correção riscada na série da Leg 45°, técnicas 10"10" iso, Abdominal Cruzado e 8 CADA.',
      startDate: '2026-07-20 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Agachamento Smith Abduzido',
            sets: 4,
            reps: '10"10" iso',
            load: '10',
            notes: '10"10" iso',
          },
          {
            name: 'Leg Press 45º',
            sets: 4,
            reps: '10',
            load: '40',
            notes: 'Correção riscada na S da Leg 45°',
          },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Abdominal Cruzado', sets: 3, reps: '15', load: '', notes: 'Cruzado' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Flexora Simul 2 Tempos', sets: 3, reps: '10', load: '4', notes: '' },
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
      ],
    })

    // 76. BRENDA PEREIRA (9, cargas "0+2")
    createStudentSheetAndProgress({
      name: 'BRENDA PEREIRA',
      title: 'Ficha Brenda Pereira - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 9 sessões. Cargas anotadas como 0+2.',
      startDate: '2026-08-05 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '0+2', notes: '0+2' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '0+2', notes: '0+2' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '0+2', notes: '0+2' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '3',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Infra Bola Pequena', sets: 3, reps: '15', load: '', notes: '' },
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

    // 77. NYCOLAS OLIVEIRA (5, A,B,A,A,B, Prancha 3xMÁX)
    createStudentSheetAndProgress({
      name: 'NYCOLAS OLIVEIRA',
      title: 'Ficha Nycolas Oliveira - Séries A/B',
      notes: 'Intervalo 30–40 segundos. 5 sessões (sequência A, B, A, A, B). Prancha 3xMÁX.',
      startDate: '2026-08-15 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '16', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '15', notes: '' },
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '60', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '35', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Rosca Direta Halter', sets: 3, reps: '10', load: '7', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '25', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: 'MÁX', load: '', notes: 'Prancha 3xMÁX' },
        ],
      },
      frequency: ['A', 'B', 'A', 'A', 'B'],
    })

    // 78. LARISSA GALOTE (frequência em branco, tudo 3x15, sem cargas)
    createStudentSheetAndProgress({
      name: 'LARISSA GALOTE',
      title: 'Ficha Larissa Galote - Séries A/B/C (tudo 3x15, sem cargas)',
      notes:
        'Intervalo 30–40 segundos. Frequência em branco na imagem. Todas as séries com 3x15 e sem cargas prescritas.',
      startDate: '2026-08-25 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '15', load: '', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '15',
            load: '',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '15', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: [],
    })

    // 79. DULCIMAR MULLER (24, Rest Pause 6 MÁX, "2+2", "0+1")
    createStudentSheetAndProgress({
      name: 'DULCIMAR MULLER',
      title: 'Ficha Dulcimar Muller - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 24 sessões. Rest Pause 6 MÁX, cargas 2+2 e 0+1.',
      startDate: '2026-07-10 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Agachamento Smith Abduzido',
            sets: 6,
            reps: 'Rest Pause máx',
            load: '10',
            notes: 'Rest Pause 6 MÁX',
          },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2+2', notes: '2+2' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '0+1', notes: '0+1' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          {
            name: 'Stiff Smith',
            sets: 6,
            reps: 'Rest Pause máx',
            load: '12',
            notes: 'Rest Pause 6 MÁX',
          },
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
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          {
            name: 'Abdutora Inclinada',
            sets: 6,
            reps: 'Rest Pause máx',
            load: '25',
            notes: 'Rest Pause 6 MÁX',
          },
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
        'C',
        'A',
        'B',
        'C',
        'A',
        'B',
        'C',
      ],
    })

    // 80. POLYANA (7, correção "Triângulo"→"Barra Fechado")
    createStudentSheetAndProgress({
      name: 'POLYANA',
      title: 'Ficha Polyana - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 7 sessões. Correção manuscrita de Triângulo para Barra Fechado.',
      startDate: '2026-08-08 12:00:00.000Z',
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
            name: 'Pulley Frente Fechado Peg Sup. (Barra)',
            sets: 3,
            reps: '10',
            load: '20',
            notes: 'Correção Triângulo para Barra Fechado',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A'],
    })

    // 81. ISMALIA (22, duas correções riscadas na C, Mobilidade 3→2 x10, manuscritos "Abd supra polia"/"Abd bike banco pulley"/Abdução Atrás com Caneleira/Tríceps Francês)
    createStudentSheetAndProgress({
      name: 'ISMALIA',
      title: 'Ficha Ismalia - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 22 sessões. Manuscritos: Abd supra polia, Abd bike banco pulley, Abdução Atrás com Caneleira, Tríceps Francês e Mobilidade 2x10 (corrigida de 3x10). Duas correções riscadas na C.',
      startDate: '2026-07-12 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Mobilidade Articular',
            sets: 2,
            reps: '10',
            load: '',
            notes: 'Mobilidade corrigida de 3 para 2 x10',
          },
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '50', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Tríceps Francês Halter',
            sets: 3,
            reps: '10',
            load: '5',
            notes: 'Tríceps Francês manuscrito',
          },
          {
            name: 'Abdominal Supra Polia',
            sets: 3,
            reps: '15',
            load: '20',
            notes: 'Abd supra polia manuscrito',
          },
        ],
        B: [
          { name: 'Mobilidade Articular', sets: 2, reps: '10', load: '', notes: 'Mobilidade 2x10' },
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '15', notes: '' },
          { name: 'Flexora Simul 2 Tempos', sets: 3, reps: '10', load: '4', notes: '' },
          {
            name: 'Abdução Atrás com Caneleira',
            sets: 3,
            reps: '10',
            load: '3',
            notes: 'Abdução Atrás com Caneleira manuscrito',
          },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '5',
            notes: '',
          },
          {
            name: 'Abdominal Bike Banco Pulley',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'Abd bike banco pulley manuscrito',
          },
        ],
        C: [
          { name: 'Mobilidade Articular', sets: 2, reps: '10', load: '', notes: 'Mobilidade 2x10' },
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '14', notes: '' },
          {
            name: 'Abdutora Inclinada',
            sets: 4,
            reps: '12',
            load: '30',
            notes: 'Item corrigido a mão',
          },
          {
            name: 'Elevação Lateral Simultaneo Halter',
            sets: 3,
            reps: '10',
            load: '3',
            notes: 'Item corrigido a mão',
          },
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
        'C',
        'A',
        'B',
        'C',
        'A',
      ],
    })

    // 82. MARIA CAROLINA - GYMPASS (5, tudo 3x12)
    createStudentSheetAndProgress({
      name: 'MARIA CAROLINA - GYMPASS',
      title: 'Ficha Maria Carolina - Gympass - Séries A/B/C (tudo 3x12)',
      notes: 'Intervalo 30–40 segundos. 5 sessões. Todas as séries com prescrição 3x12.',
      startDate: '2026-08-15 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '12', load: '4', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '12', load: '2', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '12', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '12', load: '3', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '3', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '12', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 3, reps: '12', load: '10', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '12', load: '3', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '12', load: '2', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '12',
            load: '4',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '12', load: '3', notes: '' },
          { name: 'Abdominal Infra Bola Pequena', sets: 3, reps: '12', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 3, reps: '12', load: '10', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '12', load: '2', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B'],
    })

    // 83. NATALIA C BRABO (19, começa em B)
    createStudentSheetAndProgress({
      name: 'NATALIA C BRABO',
      title: 'Ficha Natalia C Brabo - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 19 sessões (frequência inicia em B).',
      startDate: '2026-07-20 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '50', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '15', notes: '' },
          { name: 'Flexora Simul 2 Tempos', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '5',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '14', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: [
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

    console.log('MIGRAÇÃO_0038_CONCLUÍDA: Alunas 64 a 83 cadastradas com sucesso.')
  },
  (app) => {
    const list = [
      'ELIZABETH GAVA',
      'CELIZA FONSECA',
      'EDIANA ALVES',
      'KAJSA SALLES',
      'PAMELLA RAMOS',
      'ANGELA LEAL',
      'JOSE ROBSON',
      'RENATA CAMPOLINA',
      'MAIRON SUBTIL',
      'CAROLINE HERMOGENES',
      'GERUZA GASPARINI',
      'GABRIELA PERTEL',
      'BRENDA PEREIRA',
      'NYCOLAS OLIVEIRA',
      'LARISSA GALOTE',
      'DULCIMAR MULLER',
      'POLYANA',
      'ISMALIA',
      'MARIA CAROLINA - GYMPASS',
      'NATALIA C BRABO',
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
