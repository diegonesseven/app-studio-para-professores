migrate(
  (app) => {
    // ══════════════════════════════════════════════════════════════════════════
    // MIGRAÇÃO 0035 - SEED LOTE 1 (Alunas 1 a 20 de 83)
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
    // DADOS DAS ALUNAS 1 A 20
    // ──────────────────────────────────────────────────────────────────────────

    // 1. ANDRESSA ZERMAN
    createStudentSheetAndProgress({
      name: 'ANDRESSA ZERMAN',
      title: 'Ficha Andressa Zerman - Séries A/B/C',
      notes: 'Intervalo: 30–40 segundos. Treino focado em condicionamento e fortalecimento.',
      startDate: '2026-08-03 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Extensora', sets: 4, reps: '12', load: '4', notes: '' },
          { name: 'Elevação Lateral Halter', sets: 3, reps: '12', load: '3', notes: '' },
          { name: 'Tríceps Polia Corda', sets: 3, reps: '12', load: '4', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Barra', sets: 4, reps: '10', load: '15', notes: '' },
          { name: 'Flexora Deitado', sets: 4, reps: '12', load: '5', notes: '' },
          { name: 'Elevação Pélvica Solo', sets: 4, reps: '15', load: '10', notes: '' },
          { name: 'Puxada Frente Pronada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Rosca Direta Polia', sets: 3, reps: '12', load: '4', notes: '' },
          { name: 'Prancha Isométrica', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô Halter', sets: 4, reps: '12', load: '12', notes: '' },
          { name: 'Abdutora Máquina', sets: 4, reps: '15', load: '30', notes: '' },
          { name: 'Adutora Máquina', sets: 4, reps: '15', load: '25', notes: '' },
          { name: 'Desenvolvimento Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Abdominal Infra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'],
    })

    // 2. PATRICIA ROKFELLER
    createStudentSheetAndProgress({
      name: 'PATRICIA ROKFELLER',
      title: 'Ficha Patricia Rokfeller - Séries A/B/C',
      notes: 'Intervalo: 30–40 segundos.',
      startDate: '2026-08-05 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Goblet Halter', sets: 4, reps: '10', load: '8', notes: '' },
          { name: 'Afundo Halter', sets: 3, reps: '10', load: '5', notes: 'cada perna' },
          { name: 'Extensora Curtinho', sets: 4, reps: '12', load: '3', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Tríceps Banco', sets: 3, reps: '12', load: '', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Levantamento Terra Smith', sets: 4, reps: '10', load: '15', notes: '' },
          { name: 'Flexora Simult.', sets: 4, reps: '10', load: '4', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 4, reps: '12', load: '2', notes: '' },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Leg 45 Unilateral', sets: 3, reps: '10', load: '20', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '35', notes: '' },
          { name: 'Elevação Frontal Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'],
    })

    // 3. ELANDIA RODRIGUES
    createStudentSheetAndProgress({
      name: 'ELANDIA RODRIGUES',
      title: 'Ficha Elandia Rodrigues - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos.',
      startDate: '2026-08-10 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Extensora 2 Tempos', sets: 4, reps: '10', load: '3', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '12', load: '3', notes: '' },
          { name: 'Supino Reto Conjugado Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '4', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Flexora Simul 2 Tempos', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Pêndulo', sets: 3, reps: '10', load: '5', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '4',
            notes: '',
          },
          { name: 'Rosca Concentrada Halter', sets: 3, reps: '10', load: '4', notes: '' },
        ],
        C: [
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '15', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 4. VANDERLUCIA
    createStudentSheetAndProgress({
      name: 'VANDERLUCIA',
      title: 'Ficha Vanderlucia - Séries A/B',
      notes: 'Intervalo 30–40 segundos.',
      startDate: '2026-08-12 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Bola', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Flexão de Braço Smith', sets: 3, reps: '10', load: '', notes: '' },
          { name: 'Elevação Lateral Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
        B: [
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Remada Curvada Polia Peg Supinada Barra P',
            sets: 3,
            reps: '10',
            load: '4',
            notes: '',
          },
          { name: 'Rosca Direta Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Infra Bola Pequena', sets: 3, reps: '15', load: '', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A'],
    })

    // 5. TAINÁ OLIVEIRA
    createStudentSheetAndProgress({
      name: 'TAINÁ OLIVEIRA',
      title: 'Ficha Tainá Oliveira - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos.',
      startDate: '2026-08-15 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '50', notes: '' },
          { name: 'Extensora', sets: 4, reps: '12', load: '5', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '5', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '15', notes: '' },
          { name: 'Flexora Deitado', sets: 4, reps: '10', load: '6', notes: '' },
          { name: 'Elevação Pélvica Máquina', sets: 4, reps: '12', load: '40', notes: '' },
          { name: 'Puxada Frente Pronada', sets: 3, reps: '10', load: '25', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '16', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '15', load: '35', notes: '' },
          { name: 'Desenvolvimento Halter', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 6. ANA PAULA MARTINS
    createStudentSheetAndProgress({
      name: 'ANA PAULA MARTINS',
      title: 'Ficha Ana Paula Martins - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos.',
      startDate: '2026-08-17 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Livre Barra', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Extensora Curtinho', sets: 4, reps: '10', load: '3', notes: '' },
          { name: 'Adução em "V" Can.', sets: 4, reps: '12', load: '3', notes: '' },
          { name: 'Supino Reto Conjugado Halter', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Tríceps Testa Polia Barra Step', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Levantamento Terra Sumô', sets: 4, reps: '10', load: '15', notes: '' },
          { name: 'Flexora Simult.', sets: 4, reps: '10', load: '4', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 4, reps: '10', load: '2', notes: '' },
          {
            name: 'Remada Curvada Polia Peg Pronada Barra G',
            sets: 3,
            reps: '10',
            load: '5',
            notes: '',
          },
          { name: 'Rosca Concentrada Halter', sets: 3, reps: '10', load: '4', notes: '' },
        ],
        C: [
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '30', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '20', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'],
    })

    // 7. VALERIA
    createStudentSheetAndProgress({
      name: 'VALERIA',
      title: 'Ficha Valeria - Séries A/B',
      notes: 'Intervalo 30–40 segundos.',
      startDate: '2026-08-18 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '4', notes: '' },
          {
            name: 'Agachamento Polia (Braços Estendidos)',
            sets: 3,
            reps: '10',
            load: '3',
            notes: 'Braços estendidos',
          },
          {
            name: 'Flexão de Quadril 180º Solo (Caneleira)',
            sets: 3,
            reps: '10',
            load: '2',
            notes: '',
          },
          { name: 'Flexão de Braço Smith', sets: 3, reps: '10', load: '', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '12', load: '', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
        B: [
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
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'],
    })

    // 8. CHARLES RAMON (4 séries)
    createStudentSheetAndProgress({
      name: 'CHARLES RAMON',
      title: 'Ficha Charles Ramon - Séries A/B/C/D (4 séries)',
      notes: 'Intervalo 30–40 segundos. 4 séries por exercício.',
      startDate: '2026-08-20 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 4, reps: '10', load: '14', notes: '' },
          { name: 'Crucifixo Máquina', sets: 4, reps: '12', load: '40', notes: '' },
          { name: 'Tríceps Polia Barra Reta', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Tríceps Francês Halter', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Abdominal Infra Paralela', sets: 4, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada Aberta', sets: 4, reps: '10', load: '45', notes: '' },
          { name: 'Remada Baixa Pegada Neutra', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '16', notes: '' },
          { name: 'Rosca Direta Barra W', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdominal Supra Polia', sets: 4, reps: '15', load: '30', notes: '' },
        ],
        C: [
          { name: 'Desenvolvimento Militar Barra', sets: 4, reps: '10', load: '15', notes: '' },
          { name: 'Elevação Lateral Halter', sets: 4, reps: '12', load: '8', notes: '' },
          { name: 'Crucifixo Invertido Halter', sets: 4, reps: '12', load: '6', notes: '' },
          { name: 'Encolhimento Halter', sets: 4, reps: '12', load: '20', notes: '' },
          { name: 'Prancha Ventral', sets: 4, reps: '40s', load: '', notes: '' },
        ],
        D: [
          { name: 'Agachamento Livre Barra', sets: 4, reps: '10', load: '30', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '120', notes: '' },
          { name: 'Extensora Máquina', sets: 4, reps: '12', load: '45', notes: '' },
          { name: 'Mesa Flexora', sets: 4, reps: '10', load: '35', notes: '' },
          { name: 'Panturrilha Em Pé Smith', sets: 4, reps: '15', load: '40', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D'],
    })

    // 9. GABRIEL CASTILHO
    createStudentSheetAndProgress({
      name: 'GABRIEL CASTILHO',
      title: 'Ficha Gabriel Castilho - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos.',
      startDate: '2026-08-22 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Conjugado Halter', sets: 4, reps: '10', load: '14', notes: '' },
          { name: 'Crucifixo 35º Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Voador', sets: 3, reps: '12', load: '35', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Tríceps Francês Unilateral Halter', sets: 3, reps: '10', load: '8', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Fechada Barra', sets: 4, reps: '10', load: '40', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 4,
            reps: '10',
            load: '12',
            notes: '',
          },
          {
            name: 'Pulley Frente Fechado Peg Sup. (Barra)',
            sets: 3,
            reps: '10',
            load: '35',
            notes: '',
          },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
        ],
        C: [
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '80', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '12', load: '6', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '30', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 10. MARIA CREPALDE
    createStudentSheetAndProgress({
      name: 'MARIA CREPALDE',
      title: 'Ficha Maria Crepalde - Séries A/B',
      notes: 'Intervalo 30–40 segundos.',
      startDate: '2026-08-24 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Extensora 2 Tempos', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Flexão de Braço Smith', sets: 3, reps: '10', load: '', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '12', load: '', notes: '' },
        ],
        B: [
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
          { name: 'Abdominal Infra Bola Pequena', sets: 3, reps: '12', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'],
    })

    // 11. RANUZA MENEZES
    createStudentSheetAndProgress({
      name: 'RANUZA MENEZES',
      title: 'Ficha Ranuza Menezes - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos.',
      startDate: '2026-08-25 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '50', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '12', load: '3', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4+2', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '15', notes: '' },
          { name: 'Flexora Simul 2 Tempos', sets: 4, reps: '10', load: '4', notes: '' },
          { name: 'Bom Dia (Anilha na Mão)', sets: 3, reps: '10', load: '10', notes: '' },
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
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '16', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '30', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'],
    })

    // 12. FRANCISCO GAVA (16 sessões)
    createStudentSheetAndProgress({
      name: 'FRANCISCO GAVA',
      title: 'Ficha Francisco Gava - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 16 sessões registradas no controle de frequência.',
      startDate: '2026-07-20 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Conjugado Halter', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Crucifixo Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Voador', sets: 3, reps: '12', load: '30', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '15', notes: '' },
          { name: 'Tríceps Francês Halter', sets: 3, reps: '10', load: '7', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '35', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 4,
            reps: '10',
            load: '10',
            notes: '',
          },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '12', load: '30', notes: '' },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '7', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        C: [
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '15', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '60', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '12', load: '5', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Desenvolvimento Halter', sets: 3, reps: '10', load: '7', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '25', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'],
    })

    // 13. JOAQUIM C FILHO (9 sessões)
    createStudentSheetAndProgress({
      name: 'JOAQUIM C FILHO',
      title: 'Ficha Joaquim C Filho - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 9 sessões realizadas.',
      startDate: '2026-08-01 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Supino Inclinado Smith', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Elevação Frontal Halter', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Fechada Barra', sets: 3, reps: '10', load: '30', notes: '' },
          { name: 'Remada Curvada Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Rosca Direta Halter', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '50', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '20', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 14. MIGUEL G. MARQUES
    createStudentSheetAndProgress({
      name: 'MIGUEL G. MARQUES',
      title: 'Ficha Miguel G. Marques - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos.',
      startDate: '2026-08-08 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '15', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Voador', sets: 3, reps: '12', load: '35', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '18', notes: '' },
          { name: 'Tríceps Testa Polia Barra Step', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '10', load: '35', notes: '' },
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
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'],
    })

    // 15. AGATA GAVA (11)
    createStudentSheetAndProgress({
      name: 'AGATA GAVA',
      title: 'Ficha Agata Gava - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 11 sessões realizadas.',
      startDate: '2026-08-01 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '12', load: '3', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
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
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'],
    })

    // 16. CELIA SANTOS (frequência começa em C)
    createStudentSheetAndProgress({
      name: 'CELIA SANTOS',
      title: 'Ficha Celia Santos - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. Frequência inicia na Série C.',
      startDate: '2026-08-05 12:00:00.000Z',
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
          { name: 'Sumô', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Abdução Vertical Can.', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Adução em "V" Can.', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 17. EMILLY OLIVEIRA GONÇALVES (4)
    createStudentSheetAndProgress({
      name: 'EMILLY OLIVEIRA GONÇALVES',
      title: 'Ficha Emilly Oliveira Gonçalves - Séries A/B',
      notes: 'Intervalo 30–40 segundos. 4 sessões realizadas.',
      startDate: '2026-08-15 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Leg Press 45º', sets: 3, reps: '10', load: '30', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Puxada Frente Pronada', sets: 3, reps: '10', load: '15', notes: '' },
          { name: 'Rosca Direta Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '25s', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'A', 'B'],
    })

    // 18. MANOEL MONTEBELER (29)
    createStudentSheetAndProgress({
      name: 'MANOEL MONTEBELER',
      title: 'Ficha Manoel Montebeler - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 29 sessões concluídas.',
      startDate: '2026-07-01 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Crucifixo Máquina', sets: 3, reps: '12', load: '35', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 4, reps: '12', load: '20', notes: '' },
          { name: 'Tríceps Francês Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 4, reps: '15', load: '', notes: '' },
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

    // 19. ELIZIA ALMEIDA (28)
    createStudentSheetAndProgress({
      name: 'ELIZIA ALMEIDA',
      title: 'Ficha Elizia Almeida - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 28 sessões concluídas.',
      startDate: '2026-07-05 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Extensora 2 Tempos', sets: 4, reps: '10', load: '3', notes: '' },
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

    // 20. RAQUEL PEREIRA DE ASSIS (18)
    createStudentSheetAndProgress({
      name: 'RAQUEL PEREIRA DE ASSIS',
      title: 'Ficha Raquel Pereira de Assis - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 18 sessões realizadas.',
      startDate: '2026-07-25 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 4, reps: '10', load: '6', notes: '' },
          { name: 'Extensora Curtinho', sets: 4, reps: '10', load: '3', notes: '' },
          { name: 'Adução em "V" Can.', sets: 4, reps: '10', load: '3', notes: '' },
          { name: 'Supino Reto Conjugado Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Testa Polia Barra Step', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Supra Total', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Levantamento Terra Sumô', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Flexora Simult.', sets: 4, reps: '10', load: '4', notes: '' },
          { name: 'Pêndulo', sets: 4, reps: '10', load: '6', notes: '' },
          {
            name: 'Remada Curvada Polia Peg Supinada Barra P',
            sets: 3,
            reps: '10',
            load: '4',
            notes: '',
          },
          { name: 'Rosca Concentrada Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Abdominal Infra Bola Pequena', sets: 3, reps: '15', load: '', notes: '' },
        ],
        C: [
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 4, reps: '10', load: '2', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '15', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
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

    console.log('MIGRAÇÃO_0035_CONCLUÍDA: Alunas 1 a 20 cadastradas com sucesso.')
  },
  (app) => {
    // Reversão limpa dados das alunas 1 a 20
    const list = [
      'ANDRESSA ZERMAN',
      'PATRICIA ROKFELLER',
      'ELANDIA RODRIGUES',
      'VANDERLUCIA',
      'TAINÁ OLIVEIRA',
      'ANA PAULA MARTINS',
      'VALERIA',
      'CHARLES RAMON',
      'GABRIEL CASTILHO',
      'MARIA CREPALDE',
      'RANUZA MENEZES',
      'FRANCISCO GAVA',
      'JOAQUIM C FILHO',
      'MIGUEL G. MARQUES',
      'AGATA GAVA',
      'CELIA SANTOS',
      'EMILLY OLIVEIRA GONÇALVES',
      'MANOEL MONTEBELER',
      'ELIZIA ALMEIDA',
      'RAQUEL PEREIRA DE ASSIS',
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
