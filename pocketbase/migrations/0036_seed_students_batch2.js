migrate(
  (app) => {
    // ══════════════════════════════════════════════════════════════════════════
    // MIGRAÇÃO 0036 - SEED LOTE 2 (Alunas 21 a 42 de 83)
    // 21. Hudson C. Pontes (2)
    // 22. Vitor Brasileiro (8, Remada Curvada Supinada e Crucifixo Halter riscados)
    // 23. Sabrina Souza (frequência em branco)
    // 24. Roberta Assis (10)
    // 25. Lucimar Mattos (15, "AQUECIMENTO 5'")
    // 26. Joao Azevedo (8, "Não fez abd")
    // 27. Livia Fiorot (4, A,C,B,A, "NÃO REVEZAR")
    // 28. Lucineia Martins (10, "Não fez stiff e abd inf")
    // 29. Tania Callegario (16, pulo B→B)
    // 30. Linyti Okamoto (5, B,C,A,B,C,A, "Tríceps corda" manuscrito)
    // 31. Ademir Santana Leal (21)
    // 32. Leandro Ferreira (5 séries A–E, A,B,C,D,A)
    // 33. Alessandra Alves-Gympass (3, começa em B)
    // 34. Caroline Perini (17, começa em B)
    // 35. Larissa Passos-Gympass (12, "REVEZAR"/"NÃO REVEZAR")
    // 36. Andre Massarim (13, "ABD total bola" manuscrito)
    // 37. Rosangela Delunardo (26, "35°" no Crucifixo, "Solo" no ABD Infra)
    // 38. Maria Santana (6, "AQUECIMENTO 5 MIN")
    // 39. Janiclis Nascimento (6, C vazia)
    // 40. Simone Quinup (4, C vazia)
    // 41. Arildo Arthur (5, D só "Cardio Livre")
    // 42. Claudia Batista (25, começa em B)
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
      const baseMs = 1785585600000 // Ago 2026
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
    // 21. HUDSON C. PONTES (2)
    // ──────────────────────────────────────────────────────────────────────────
    createStudentSheetAndProgress({
      name: 'HUDSON C. PONTES',
      title: 'Ficha Hudson C. Pontes - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 2 sessões registradas.',
      startDate: '2026-08-10 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 3, reps: '10', load: '15', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Voador', sets: 3, reps: '10', load: '30', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '15', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 3, reps: '10', load: '35', notes: '' },
          { name: 'Remada Curvada Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Rosca Direta Halter', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Leg Press 45º', sets: 3, reps: '10', load: '50', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Desenvolvimento Halter', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '20', notes: '' },
        ],
      },
      frequency: ['A', 'B'],
    })

    // 22. VITOR BRASILEIRO (8, Remada Curvada Supinada e Crucifixo Halter riscados)
    createStudentSheetAndProgress({
      name: 'VITOR BRASILEIRO',
      title: 'Ficha Vitor Brasileiro - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 8 sessões. Remada Curvada Supinada e Crucifixo Halter constavam riscados na prescrição original.',
      startDate: '2026-08-01 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Halter', sets: 4, reps: '10', load: '12', notes: '' },
          {
            name: 'Crucifixo Halter',
            sets: 3,
            reps: '10',
            load: '8',
            notes: 'Riscado a mão na ficha',
          },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '18', notes: '' },
          { name: 'Tríceps Testa Polia Barra Step', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '40', notes: '' },
          {
            name: 'Remada Curvada Supinada',
            sets: 3,
            reps: '10',
            load: '10',
            notes: 'Riscado a mão na ficha',
          },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '10', load: '35', notes: '' },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
        ],
        C: [
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '80', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Desenvolvimento Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '30', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'],
    })

    // 23. SABRINA SOUZA (frequência em branco)
    createStudentSheetAndProgress({
      name: 'SABRINA SOUZA',
      title: 'Ficha Sabrina Souza - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. Frequência em branco na ficha enviada.',
      startDate: '2026-08-20 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '3', notes: '' },
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
            load: '3',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: [],
    })

    // 24. ROBERTA ASSIS (10)
    createStudentSheetAndProgress({
      name: 'ROBERTA ASSIS',
      title: 'Ficha Roberta Assis - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 10 sessões registradas.',
      startDate: '2026-08-05 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '50', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '12', load: '3', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '4', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '15', notes: '' },
          { name: 'Flexora Simul 2 Tempos', sets: 4, reps: '10', load: '4', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 4, reps: '10', load: '2', notes: '' },
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
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '30', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'],
    })

    // 25. LUCIMAR MATTOS (15, "AQUECIMENTO 5'")
    createStudentSheetAndProgress({
      name: 'LUCIMAR MATTOS',
      title: 'Ficha Lucimar Mattos - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. AQUECIMENTO 5 MINUTOS antes do início. 15 sessões.',
      startDate: '2026-07-20 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Aquecimento Esteira/Bike 5min',
            sets: 1,
            reps: '5 min',
            load: '',
            notes: 'AQUECIMENTO 5 MIN',
          },
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Flexão de Braço Smith', sets: 3, reps: '10', load: '', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '12', load: '', notes: '' },
        ],
        B: [
          {
            name: 'Aquecimento Esteira/Bike 5min',
            sets: 1,
            reps: '5 min',
            load: '',
            notes: 'AQUECIMENTO 5 MIN',
          },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Sumô', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdução Vertical Can.', sets: 3, reps: '10', load: '2', notes: '' },
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
          {
            name: 'Aquecimento Esteira/Bike 5min',
            sets: 1,
            reps: '5 min',
            load: '',
            notes: 'AQUECIMENTO 5 MIN',
          },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '15', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 26. JOAO AZEVEDO (8, "Não fez abd")
    createStudentSheetAndProgress({
      name: 'JOAO AZEVEDO',
      title: 'Ficha Joao Azevedo - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 8 sessões. Nota manuscrita: Não fez abd.',
      startDate: '2026-08-01 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Halter', sets: 4, reps: '10', load: '14', notes: '' },
          { name: 'Supino Inclinado Smith', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Voador', sets: 3, reps: '10', load: '35', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '18', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: 'Não fez abd' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '10', load: '35', notes: '' },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: 'Não fez abd' },
        ],
        C: [
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '80', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '30', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'],
    })

    // 27. LIVIA FIOROT (4, A,C,B,A, "NÃO REVEZAR")
    createStudentSheetAndProgress({
      name: 'LIVIA FIOROT',
      title: 'Ficha Livia Fiorot - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 4 sessões (sequência A, C, B, A). Prescrição: NÃO REVEZAR.',
      startDate: '2026-08-15 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Agachamento Smith Abduzido',
            sets: 4,
            reps: '10',
            load: '10',
            notes: 'NÃO REVEZAR',
          },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '40', notes: 'NÃO REVEZAR' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: 'NÃO REVEZAR' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '3', notes: 'NÃO REVEZAR' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '3', notes: 'NÃO REVEZAR' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: 'NÃO REVEZAR' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '12', notes: 'NÃO REVEZAR' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '3', notes: 'NÃO REVEZAR' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: 'NÃO REVEZAR' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '4',
            notes: 'NÃO REVEZAR',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '3', notes: 'NÃO REVEZAR' },
          { name: 'Prancha Ventral', sets: 3, reps: '25s', load: '', notes: 'NÃO REVEZAR' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '10', notes: 'NÃO REVEZAR' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: 'NÃO REVEZAR' },
          {
            name: 'Elevação Lateral Simultaneo Halter',
            sets: 3,
            reps: '10',
            load: '2',
            notes: 'NÃO REVEZAR',
          },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: 'NÃO REVEZAR' },
        ],
      },
      frequency: ['A', 'C', 'B', 'A'],
    })

    // 28. LUCINEIA MARTINS (10, "Não fez stiff e abd inf")
    createStudentSheetAndProgress({
      name: 'LUCINEIA MARTINS',
      title: 'Ficha Lucineia Martins - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 10 sessões. Nota manuscrita: Não fez stiff e abd inf.',
      startDate: '2026-08-01 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          {
            name: 'Stiff Smith',
            sets: 3,
            reps: '10',
            load: '10',
            notes: 'Não fez stiff e abd inf',
          },
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
            name: 'Abdominal Infra Bola Pequena',
            sets: 3,
            reps: '12',
            load: '',
            notes: 'Não fez stiff e abd inf',
          },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '25', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'],
    })

    // 29. TANIA CALLEGARIO (16, pulo B→B)
    createStudentSheetAndProgress({
      name: 'TANIA CALLEGARIO',
      title: 'Ficha Tania Callegario - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 16 sessões com sequência contendo pulo B→B conforme manuscrito.',
      startDate: '2026-07-22 12:00:00.000Z',
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
            load: '5',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      // Pulo B -> B na frequência:
      frequency: ['A', 'B', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 30. LINYTI OKAMOTO (5, B,C,A,B,C,A, "Tríceps corda" manuscrito)
    createStudentSheetAndProgress({
      name: 'LINYTI OKAMOTO',
      title: 'Ficha Linyti Okamoto - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 5 sessões (sequência B, C, A, B, C, A). Manuscrito: Tríceps corda.',
      startDate: '2026-08-10 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Tríceps corda',
            sets: 3,
            reps: '10',
            load: '3',
            notes: 'Tríceps corda manuscrito',
          },
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
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['B', 'C', 'A', 'B', 'C', 'A'],
    })

    // 31. ADEMIR SANTANA LEAL (21)
    createStudentSheetAndProgress({
      name: 'ADEMIR SANTANA LEAL',
      title: 'Ficha Ademir Santana Leal - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 21 sessões concluídas.',
      startDate: '2026-07-15 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '18', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Voador', sets: 3, reps: '12', load: '35', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 4, reps: '12', load: '20', notes: '' },
          { name: 'Tríceps Testa Polia Barra Step', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '10', load: '35', notes: '' },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
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
        'C',
      ],
    })

    // 32. LEANDRO FERREIRA (5 séries A–E, A,B,C,D,A)
    createStudentSheetAndProgress({
      name: 'LEANDRO FERREIRA',
      title: 'Ficha Leandro Ferreira - Séries A/B/C/D/E',
      notes: 'Intervalo 30–40 segundos. 5 séries A–E. Frequência registrada: A, B, C, D, A.',
      startDate: '2026-08-15 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 4, reps: '10', load: '14', notes: '' },
          { name: 'Crucifixo 35º Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Voador', sets: 3, reps: '12', load: '35', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '45', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '14', notes: '' },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '10', load: '40', notes: '' },
          {
            name: 'Pulley Frente Fechado Peg Sup. (Barra)',
            sets: 3,
            reps: '10',
            load: '35',
            notes: '',
          },
        ],
        C: [
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '25', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '100', notes: '' },
          { name: 'Extensora Curtinho', sets: 4, reps: '12', load: '6', notes: '' },
          { name: 'Flexora Simult.', sets: 4, reps: '10', load: '6', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '35', notes: '' },
        ],
        D: [
          { name: 'Desenvolvimento Halter', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Elevação Lateral Halter', sets: 4, reps: '12', load: '6', notes: '' },
          { name: 'Crucifixo Invertido Halter', sets: 3, reps: '12', load: '5', notes: '' },
          { name: 'Encolhimento Halter', sets: 3, reps: '12', load: '16', notes: '' },
        ],
        E: [
          { name: 'Rosca Direta Barra', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 4, reps: '12', load: '20', notes: '' },
          { name: 'Tríceps Francês Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '35s', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'D', 'A'],
    })

    // 33. ALESSANDRA ALVES-GYMPASS (3, começa em B)
    createStudentSheetAndProgress({
      name: 'ALESSANDRA ALVES-GYMPASS',
      title: 'Ficha Alessandra Alves-Gympass - Séries A/B',
      notes: 'Intervalo 30–40 segundos. 3 sessões (começa em B).',
      startDate: '2026-08-20 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Flexão de Braço Smith', sets: 3, reps: '10', load: '', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
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
      },
      frequency: ['B', 'A', 'B'],
    })

    // 34. CAROLINE PERINI (17, começa em B)
    createStudentSheetAndProgress({
      name: 'CAROLINE PERINI',
      title: 'Ficha Caroline Perini - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 17 sessões (frequência inicia em B).',
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
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
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
      ],
    })

    // 35. LARISSA PASSOS-GYMPASS (12, "REVEZAR"/"NÃO REVEZAR")
    createStudentSheetAndProgress({
      name: 'LARISSA PASSOS-GYMPASS',
      title: 'Ficha Larissa Passos-Gympass - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 12 sessões. Técnicas REVEZAR e NÃO REVEZAR indicadas por exercício.',
      startDate: '2026-08-01 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '10', notes: 'REVEZAR' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '40', notes: 'NÃO REVEZAR' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: 'REVEZAR' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: 'NÃO REVEZAR' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: 'REVEZAR' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: 'NÃO REVEZAR' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '12', notes: 'REVEZAR' },
          { name: 'Flexora Simul 2 Tempos', sets: 3, reps: '10', load: '4', notes: 'NÃO REVEZAR' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: 'REVEZAR' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '4',
            notes: 'NÃO REVEZAR',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '3', notes: 'REVEZAR' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: 'NÃO REVEZAR' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: 'REVEZAR' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: 'NÃO REVEZAR' },
          {
            name: 'Elevação Lateral Simultaneo Halter',
            sets: 3,
            reps: '10',
            load: '3',
            notes: 'REVEZAR',
          },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 36. ANDRE MASSARIM (13, "ABD total bola" manuscrito)
    createStudentSheetAndProgress({
      name: 'ANDRE MASSARIM',
      title: 'Ficha Andre Massarim - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 13 sessões. Manuscrito: ABD total bola.',
      startDate: '2026-07-28 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '18', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Voador', sets: 3, reps: '10', load: '35', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '18', notes: '' },
          {
            name: 'ABD total bola',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'ABD total bola manuscrito',
          },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '10', load: '35', notes: '' },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
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
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'],
    })

    // 37. ROSANGELA DELUNARDO (26, "35°" no Crucifixo, "Solo" no ABD Infra)
    createStudentSheetAndProgress({
      name: 'ROSANGELA DELUNARDO',
      title: 'Ficha Rosangela Delunardo - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 26 sessões. Manuscrito: Crucifixo 35º e ABD Infra Solo.',
      startDate: '2026-07-08 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 4, reps: '10', load: '5', notes: '' },
          { name: 'Extensora Curtinho', sets: 4, reps: '10', load: '3', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '12', load: '3', notes: '' },
          {
            name: 'Crucifixo 35º Halter',
            sets: 3,
            reps: '10',
            load: '4',
            notes: '35° no Crucifixo',
          },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '15', load: '', notes: '' },
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
            name: 'Abdominal Infra Solo',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'Solo no ABD Infra',
          },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '20', notes: '' },
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
        'A',
        'B',
      ],
    })

    // 38. MARIA SANTANA (6, "AQUECIMENTO 5 MIN")
    createStudentSheetAndProgress({
      name: 'MARIA SANTANA',
      title: 'Ficha Maria Santana - Séries A/B',
      notes: 'Intervalo 30–40 segundos. 6 sessões. AQUECIMENTO 5 MIN.',
      startDate: '2026-08-10 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Aquecimento Esteira/Bike 5min',
            sets: 1,
            reps: '5 min',
            load: '',
            notes: 'AQUECIMENTO 5 MIN',
          },
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Flexão de Braço Smith', sets: 3, reps: '10', load: '', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '12', load: '', notes: '' },
        ],
        B: [
          {
            name: 'Aquecimento Esteira/Bike 5min',
            sets: 1,
            reps: '5 min',
            load: '',
            notes: 'AQUECIMENTO 5 MIN',
          },
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
      },
      frequency: ['A', 'B', 'A', 'B', 'A', 'B'],
    })

    // 39. JANICLIS NASCIMENTO (6, C vazia)
    createStudentSheetAndProgress({
      name: 'JANICLIS NASCIMENTO',
      title: 'Ficha Janiclis Nascimento - Séries A/B (Série C vazia)',
      notes:
        'Intervalo 30–40 segundos. 6 sessões realizadas (Série C cadastrada vazia conforme imagem).',
      startDate: '2026-08-12 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Leg Press 45º', sets: 3, reps: '10', load: '40', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
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
          { name: 'Prancha Ventral', sets: 3, reps: '25s', load: '', notes: '' },
        ],
        C: [],
      },
      frequency: ['A', 'B', 'A', 'B', 'A', 'B'],
    })

    // 40. SIMONE QUINUP (4, C vazia)
    createStudentSheetAndProgress({
      name: 'SIMONE QUINUP',
      title: 'Ficha Simone Quinup - Séries A/B (Série C vazia)',
      notes: 'Intervalo 30–40 segundos. 4 sessões (Série C vazia conforme imagem).',
      startDate: '2026-08-18 12:00:00.000Z',
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
        C: [],
      },
      frequency: ['A', 'B', 'A', 'B'],
    })

    // 41. ARILDO ARTHUR (5, D só "Cardio Livre")
    createStudentSheetAndProgress({
      name: 'ARILDO ARTHUR',
      title: 'Ficha Arildo Arthur - Séries A/B/C/D (D só Cardio Livre)',
      notes:
        'Intervalo 30–40 segundos. 5 sessões. Série D composta exclusivamente por Cardio Livre.',
      startDate: '2026-08-10 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 3, reps: '10', load: '15', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '15', notes: '' },
          { name: 'Elevação Frontal Halter', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 3, reps: '10', load: '35', notes: '' },
          { name: 'Remada Curvada Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Rosca Direta Halter', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Leg Press 45º', sets: 3, reps: '10', load: '50', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '20', notes: '' },
        ],
        D: [{ name: 'Cardio Livre', sets: 1, reps: '20-30 min', load: '', notes: 'Cardio Livre' }],
      },
      frequency: ['A', 'B', 'C', 'D', 'A'],
    })

    // 42. CLAUDIA BATISTA (25, começa em B)
    createStudentSheetAndProgress({
      name: 'CLAUDIA BATISTA',
      title: 'Ficha Claudia Batista - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 25 sessões concluídas (frequência inicia em B).',
      startDate: '2026-07-06 12:00:00.000Z',
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
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
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
        'C',
        'A',
        'B',
        'C',
        'A',
        'B',
      ],
    })

    console.log('MIGRAÇÃO_0036_CONCLUÍDA: Alunas 21 a 42 cadastradas com sucesso.')
  },
  (app) => {
    const list = [
      'HUDSON C. PONTES',
      'VITOR BRASILEIRO',
      'SABRINA SOUZA',
      'ROBERTA ASSIS',
      'LUCIMAR MATTOS',
      'JOAO AZEVEDO',
      'LIVIA FIOROT',
      'LUCINEIA MARTINS',
      'TANIA CALLEGARIO',
      'LINYTI OKAMOTO',
      'ADEMIR SANTANA LEAL',
      'LEANDRO FERREIRA',
      'ALESSANDRA ALVES-GYMPASS',
      'CAROLINE PERINI',
      'LARISSA PASSOS-GYMPASS',
      'ANDRE MASSARIM',
      'ROSANGELA DELUNARDO',
      'MARIA SANTANA',
      'JANICLIS NASCIMENTO',
      'SIMONE QUINUP',
      'ARILDO ARTHUR',
      'CLAUDIA BATISTA',
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
