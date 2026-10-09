migrate(
  (app) => {
    // ══════════════════════════════════════════════════════════════════════════
    // MIGRAÇÃO 0037 - SEED LOTE 3 (Alunas 43 a 63 de 83)
    // 43. Alvaro Freitas (17, A–D, "Cardio 3 min", Superman no lugar da Rosca Concentrada riscada, "Smith" no lugar da Panturrilha Máquina riscada)
    // 44. Carol Pacheco (5)
    // 45. Stephane (0 sessões, C vazia)
    // 46. Juliana Vieira (1, "TREINO C FAZER NA SEMANA QUE VIER 3X")
    // 47. Lucio Rufino (1, "5 CADA LADO" no Superman)
    // 48. Monica Lacerda (0, "AQUECIMENTO 5 MIN")
    // 49. Joyce Pimentel (4, só Série A, "2+2 Adutora", "Tríceps barra v" manuscrito)
    // 50. Hebert (22, "5"5"5"", "Rosca 21 7/7/7", nota "Glúteo 180 polia substituição do levantamento terra")
    // 51. Anna Julia Santos (4, C vazia)
    // 52. Valdiana (21, "2/2", "Remador" manuscrito, Superman Dinâmico "5 cada lado")
    // 53. Franey Karla (13, A–E, "3L 3R 3L 3R", "REVEZAR OS ABDOMINAIS")
    // 54. Marlon (4, "2+1" no Voador Unilateral)
    // 55. Jose Cipriano (2)
    // 56. Marcos Belmiro (2, "CARDIO 10 MIN", Rosca 21 "7/7/7")
    // 57. Ederson de Figueiredo (12, FST-7 em 3 exercícios, "ALONGAMENTOS PARA POSTERIOR")
    // 58. Marcos Dalton (0, C vazia, sem cargas)
    // 59. Thanmara F. Ribeiro (10, "ABD oblíquo polia" manuscrito)
    // 60. Geovana Souza (14, AQUECIMENTO 3 MIN/CARDIO 5 MIN, correção manuscrita no Abd Supra)
    // 61. Danielle Santos (21, FST-7, MASSAGEM na C, "REVEZAR OS COLORIDOS")
    // 62. Alexsandra Rodrigues (4, Voador carga 0, Adutora "0+2")
    // 63. Roger Meireles (13, Prancha 3xMÁX, "Voador unil. 0+2" manuscrito)
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
    // 43. ALVARO FREITAS (17, A–D, "Cardio 3 min", Superman no lugar da Rosca Concentrada riscada, "Smith" no lugar da Panturrilha Máquina riscada)
    // ──────────────────────────────────────────────────────────────────────────
    createStudentSheetAndProgress({
      name: 'ALVARO FREITAS',
      title: 'Ficha Alvaro Freitas - Séries A/B/C/D',
      notes:
        'Intervalo 30–40 segundos. 17 sessões. Cardio 3 min. Superman substitui Rosca Concentrada riscada; Smith substitui Panturrilha Máquina riscada.',
      startDate: '2026-07-22 12:00:00.000Z',
      series: {
        A: [
          { name: 'Cardio 3 min', sets: 1, reps: '3 min', load: '', notes: 'Cardio 3 min' },
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '18', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Crucifixo Máquina', sets: 3, reps: '12', load: '35', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '18', notes: '' },
          {
            name: 'Superman',
            sets: 3,
            reps: '12',
            load: '',
            notes: 'Substituição manuscrita da Rosca Concentrada riscada',
          },
        ],
        B: [
          { name: 'Cardio 3 min', sets: 1, reps: '3 min', load: '', notes: 'Cardio 3 min' },
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '10', load: '35', notes: '' },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        C: [
          { name: 'Cardio 3 min', sets: 1, reps: '3 min', load: '', notes: 'Cardio 3 min' },
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '80', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '12', load: '5', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '5', notes: '' },
          {
            name: 'Panturrilha Smith',
            sets: 4,
            reps: '15',
            load: '30',
            notes: 'Smith no lugar de Panturrilha Máquina riscada',
          },
        ],
        D: [
          { name: 'Cardio 3 min', sets: 1, reps: '3 min', load: '', notes: 'Cardio 3 min' },
          { name: 'Desenvolvimento Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Elevação Lateral Halter', sets: 3, reps: '12', load: '5', notes: '' },
          { name: 'Encolhimento Halter', sets: 3, reps: '12', load: '16', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
      },
      frequency: [
        'A',
        'B',
        'C',
        'D',
        'A',
        'B',
        'C',
        'D',
        'A',
        'B',
        'C',
        'D',
        'A',
        'B',
        'C',
        'D',
        'A',
      ],
    })

    // 44. CAROL PACHECO (5)
    createStudentSheetAndProgress({
      name: 'CAROL PACHECO',
      title: 'Ficha Carol Pacheco - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 5 sessões realizadas.',
      startDate: '2026-08-15 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Leg Press 45º', sets: 3, reps: '10', load: '30', notes: '' },
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
        C: [
          { name: 'Sumô 2 Tempos', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Abdutora Inclinada', sets: 3, reps: '12', load: '20', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B'],
    })

    // 45. STEPHANE (0 sessões, C vazia)
    createStudentSheetAndProgress({
      name: 'STEPHANE',
      title: 'Ficha Stephane - Séries A/B (Série C vazia)',
      notes: 'Intervalo 30–40 segundos. 0 sessões registradas. Série C vazia.',
      startDate: '2026-08-25 12:00:00.000Z',
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
      frequency: [],
    })

    // 46. JULIANA VIEIRA (1, "TREINO C FAZER NA SEMANA QUE VIER 3X")
    createStudentSheetAndProgress({
      name: 'JULIANA VIEIRA',
      title: 'Ficha Juliana Vieira - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 1 sessão realizada. Nota manuscrita: TREINO C FAZER NA SEMANA QUE VIER 3X.',
      startDate: '2026-08-22 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Leg Press 45º', sets: 3, reps: '10', load: '35', notes: '' },
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
        C: [
          {
            name: 'Sumô 2 Tempos',
            sets: 3,
            reps: '10',
            load: '10',
            notes: 'TREINO C FAZER NA SEMANA QUE VIER 3X',
          },
          {
            name: 'Abdutora Inclinada',
            sets: 3,
            reps: '12',
            load: '20',
            notes: 'TREINO C FAZER NA SEMANA QUE VIER 3X',
          },
          {
            name: 'Elevação Lateral Simultaneo Halter',
            sets: 3,
            reps: '10',
            load: '2',
            notes: 'TREINO C FAZER NA SEMANA QUE VIER 3X',
          },
          {
            name: 'Alongamentos',
            sets: 1,
            reps: '',
            load: '',
            notes: 'TREINO C FAZER NA SEMANA QUE VIER 3X',
          },
        ],
      },
      frequency: ['A'],
    })

    // 47. LUCIO RUFINO (1, "5 CADA LADO" no Superman)
    createStudentSheetAndProgress({
      name: 'LUCIO RUFINO',
      title: 'Ficha Lucio Rufino - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 1 sessão. Manuscrito no Superman: 5 CADA LADO.',
      startDate: '2026-08-20 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 3, reps: '10', load: '15', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '12', notes: '' },
          {
            name: 'Superman Dinâmico',
            sets: 3,
            reps: '5 cada lado',
            load: '',
            notes: '5 CADA LADO',
          },
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
      },
      frequency: ['A'],
    })

    // 48. MONICA LACERDA (0, "AQUECIMENTO 5 MIN")
    createStudentSheetAndProgress({
      name: 'MONICA LACERDA',
      title: 'Ficha Monica Lacerda - Séries A/B',
      notes: 'Intervalo 30–40 segundos. 0 sessões. AQUECIMENTO 5 MIN.',
      startDate: '2026-08-26 12:00:00.000Z',
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
      frequency: [],
    })

    // 49. JOYCE PIMENTEL (4, só Série A, "2+2 Adutora", "Tríceps barra v" manuscrito)
    createStudentSheetAndProgress({
      name: 'JOYCE PIMENTEL',
      title: 'Ficha Joyce Pimentel - Série A única',
      notes:
        'Intervalo 30–40 segundos. 4 sessões (apenas Série A prescrita). Manuscritos: 2+2 Adutora e Tríceps barra v.',
      startDate: '2026-08-15 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          {
            name: 'Adutora Máquina',
            sets: 3,
            reps: '10',
            load: '2+2',
            notes: '2+2 Adutora manuscrito',
          },
          {
            name: 'Tríceps Polia Barra V',
            sets: 3,
            reps: '10',
            load: '3',
            notes: 'Tríceps barra v manuscrito',
          },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Abdominal Sanfona', sets: 3, reps: '15', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'A', 'A', 'A'],
    })

    // 50. HEBERT (22, "5"5"5"", "Rosca 21 7/7/7", nota "Glúteo 180 polia substituição do levantamento terra")
    createStudentSheetAndProgress({
      name: 'HEBERT',
      title: 'Ficha Hebert - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 22 sessões. Técnicas 5"5"5" e Rosca 21 (7/7/7). Glúteo 180 polia substituição do levantamento terra.',
      startDate: '2026-07-10 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '5"5"5"', load: '20', notes: '5"5"5"' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '14', notes: '' },
          { name: 'Voador', sets: 3, reps: '12', load: '40', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 4, reps: '5"5"5"', load: '20', notes: '5"5"5"' },
          { name: 'Tríceps Francês Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '5"5"5"', load: '45', notes: '5"5"5"' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '14', notes: '' },
          {
            name: 'Glúteo 180º Polia',
            sets: 4,
            reps: '10',
            load: '5',
            notes: 'Glúteo 180 polia substituição do levantamento terra',
          },
          { name: 'Rosca 21 Barra W', sets: 3, reps: '7/7/7', load: '8', notes: 'Rosca 21 7/7/7' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          { name: 'Agachamento Smith', sets: 4, reps: '5"5"5"', load: '25', notes: '5"5"5"' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '100', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '12', load: '6', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Desenvolvimento Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '35', notes: '' },
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

    // 51. ANNA JULIA SANTOS (4, C vazia)
    createStudentSheetAndProgress({
      name: 'ANNA JULIA SANTOS',
      title: 'Ficha Anna Julia Santos - Séries A/B (Série C vazia)',
      notes: 'Intervalo 30–40 segundos. 4 sessões (Série C vazia).',
      startDate: '2026-08-16 12:00:00.000Z',
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

    // 52. VALDIANA (21, "2/2", "Remador" manuscrito, Superman Dinâmico "5 cada lado")
    createStudentSheetAndProgress({
      name: 'VALDIANA',
      title: 'Ficha Valdiana - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 21 sessões. Cargas 2/2, Abdominal Remador manuscrito e Superman Dinâmico 5 cada lado.',
      startDate: '2026-07-15 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Extensora Curtinho', sets: 4, reps: '10', load: '2/2', notes: '2/2' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Abdominal Remador', sets: 3, reps: '15', load: '', notes: 'Remador manuscrito' },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Flexora Simult.', sets: 4, reps: '10', load: '3', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 4, reps: '10', load: '2', notes: '' },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '4',
            notes: '',
          },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Superman Dinâmico',
            sets: 3,
            reps: '5 cada lado',
            load: '',
            notes: '5 cada lado',
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
        'C',
        'A',
        'B',
        'C',
      ],
    })

    // 53. FRANEY KARLA (13, A–E, "3L 3R 3L 3R", "REVEZAR OS ABDOMINAIS")
    createStudentSheetAndProgress({
      name: 'FRANEY KARLA',
      title: 'Ficha Franey Karla - Séries A/B/C/D/E',
      notes:
        'Intervalo 30–40 segundos. 13 sessões. 5 séries A–E. Prescrição: 3L 3R 3L 3R e REVEZAR OS ABDOMINAIS.',
      startDate: '2026-07-28 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Supino Reto Barra',
            sets: 3,
            reps: '10',
            load: '12',
            notes: 'REVEZAR OS ABDOMINAIS',
          },
          { name: 'Crucifixo 35º Halter', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '12', notes: '' },
          {
            name: 'Abdominal Supra Solo',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'REVEZAR OS ABDOMINAIS',
          },
        ],
        B: [
          {
            name: 'Puxada Frente Pronada',
            sets: 3,
            reps: '10',
            load: '30',
            notes: 'REVEZAR OS ABDOMINAIS',
          },
          { name: 'Remada Curvada Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '6', notes: '' },
          {
            name: 'Abdominal Sanfona',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'REVEZAR OS ABDOMINAIS',
          },
        ],
        C: [
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '15', notes: '3L 3R 3L 3R' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '50', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          {
            name: 'Abdominal Infra Solo',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'REVEZAR OS ABDOMINAIS',
          },
        ],
        D: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Glúteo 180º Polia', sets: 3, reps: '10', load: '2', notes: '3L 3R 3L 3R' },
          {
            name: 'Prancha Ventral',
            sets: 3,
            reps: '30s',
            load: '',
            notes: 'REVEZAR OS ABDOMINAIS',
          },
        ],
        E: [
          { name: 'Desenvolvimento Halter', sets: 3, reps: '10', load: '6', notes: '' },
          { name: 'Elevação Lateral Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '20', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'D', 'E', 'A', 'B', 'C', 'D', 'E', 'A', 'B', 'C'],
    })

    // 54. MARLON (4, "2+1" no Voador Unilateral)
    createStudentSheetAndProgress({
      name: 'MARLON',
      title: 'Ficha Marlon - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 4 sessões. Voador Unilateral com carga 2+1.',
      startDate: '2026-08-18 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '16', notes: '' },
          { name: 'Voador Unilateral', sets: 3, reps: '10', load: '2+1', notes: '2+1' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '18', notes: '' },
          { name: 'Tríceps Testa Polia Barra Step', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
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
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '30', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A'],
    })

    // 55. JOSE CIPRIANO (2)
    createStudentSheetAndProgress({
      name: 'JOSE CIPRIANO',
      title: 'Ficha Jose Cipriano - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 2 sessões registradas.',
      startDate: '2026-08-20 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 3, reps: '10', load: '30', notes: '' },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '10', load: '25', notes: '' },
          { name: 'Rosca Direta Halter', sets: 3, reps: '10', load: '5', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '25s', load: '', notes: '' },
        ],
        C: [
          { name: 'Leg Press 45º', sets: 3, reps: '10', load: '40', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Flexora Simult.', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Panturrilha Smith', sets: 3, reps: '15', load: '15', notes: '' },
        ],
      },
      frequency: ['A', 'B'],
    })

    // 56. MARCOS BELMIRO (2, "CARDIO 10 MIN", Rosca 21 "7/7/7")
    createStudentSheetAndProgress({
      name: 'MARCOS BELMIRO',
      title: 'Ficha Marcos Belmiro - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 2 sessões. CARDIO 10 MIN e Rosca 21 (7/7/7).',
      startDate: '2026-08-18 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Cardio Esteira/Bike 10min',
            sets: 1,
            reps: '10 min',
            load: '',
            notes: 'CARDIO 10 MIN',
          },
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '18', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '12', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '18', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          {
            name: 'Cardio Esteira/Bike 10min',
            sets: 1,
            reps: '10 min',
            load: '',
            notes: 'CARDIO 10 MIN',
          },
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Rosca 21 Barra W', sets: 3, reps: '7/7/7', load: '8', notes: 'Rosca 21 7/7/7' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [
          {
            name: 'Cardio Esteira/Bike 10min',
            sets: 1,
            reps: '10 min',
            load: '',
            notes: 'CARDIO 10 MIN',
          },
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '80', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '30', notes: '' },
        ],
      },
      frequency: ['A', 'B'],
    })

    // 57. EDERSON DE FIGUEIREDO (12, FST-7 em 3 exercícios, "ALONGAMENTOS PARA POSTERIOR")
    createStudentSheetAndProgress({
      name: 'EDERSON DE FIGUEIREDO',
      title: 'Ficha Ederson de Figueiredo - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 12 sessões. FST-7 em 3 exercícios e ALONGAMENTOS PARA POSTERIOR.',
      startDate: '2026-07-25 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '20', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 4, reps: '10', load: '14', notes: '' },
          { name: 'Voador', sets: 7, reps: '10-12', load: '35', notes: 'FST-7' },
          { name: 'Tríceps Polia Barra V', sets: 4, reps: '12', load: '20', notes: '' },
          { name: 'Tríceps Francês Halter', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '45', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '14', notes: '' },
          { name: 'Remada Baixa Triângulo', sets: 7, reps: '10-12', load: '35', notes: 'FST-7' },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
          {
            name: 'Alongamentos para Posterior',
            sets: 1,
            reps: '',
            load: '',
            notes: 'ALONGAMENTOS PARA POSTERIOR',
          },
        ],
        C: [
          { name: 'Agachamento Smith', sets: 4, reps: '10', load: '25', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '100', notes: '' },
          { name: 'Extensora Máquina', sets: 7, reps: '10-12', load: '40', notes: 'FST-7' },
          { name: 'Flexora Simult.', sets: 4, reps: '10', load: '6', notes: '' },
          { name: 'Panturrilha Smith', sets: 4, reps: '15', load: '35', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
    })

    // 58. MARCOS DALTON (0, C vazia, sem cargas)
    createStudentSheetAndProgress({
      name: 'MARCOS DALTON',
      title: 'Ficha Marcos Dalton - Séries A/B (Série C vazia, sem cargas)',
      notes:
        'Intervalo 30–40 segundos. 0 sessões. Série C vazia e sem cargas anotadas na ficha original.',
      startDate: '2026-08-25 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 3, reps: '10', load: '', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 3, reps: '10', load: '', notes: '' },
          { name: 'Remada Curvada Halter', sets: 3, reps: '10', load: '', notes: '' },
          { name: 'Rosca Direta Halter', sets: 3, reps: '10', load: '', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: '30s', load: '', notes: '' },
        ],
        C: [],
      },
      frequency: [],
    })

    // 59. THANMARA F. RIBEIRO (10, "ABD oblíquo polia" manuscrito)
    createStudentSheetAndProgress({
      name: 'THANMARA F. RIBEIRO',
      title: 'Ficha Thanmara F. Ribeiro - Séries A/B/C',
      notes: 'Intervalo 30–40 segundos. 10 sessões. Manuscrito: ABD oblíquo polia.',
      startDate: '2026-08-05 12:00:00.000Z',
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
            name: 'ABD oblíquo polia',
            sets: 3,
            reps: '12',
            load: '10',
            notes: 'ABD oblíquo polia manuscrito',
          },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'],
    })

    // 60. GEOVANA SOUZA (14, AQUECIMENTO 3 MIN/CARDIO 5 MIN, correção manuscrita no Abd Supra)
    createStudentSheetAndProgress({
      name: 'GEOVANA SOUZA',
      title: 'Ficha Geovana Souza - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 14 sessões. AQUECIMENTO 3 MIN / CARDIO 5 MIN. Correção manuscrita no Abd Supra.',
      startDate: '2026-07-20 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Aquecimento Esteira/Bike 3min',
            sets: 1,
            reps: '3 min',
            load: '',
            notes: 'AQUECIMENTO 3 MIN',
          },
          { name: 'Agachamento Smith Abduzido', sets: 4, reps: '10', load: '10', notes: '' },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Supino Reto Halter', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '10', load: '4', notes: '' },
          {
            name: 'Abdominal Supra com Peso',
            sets: 3,
            reps: '15',
            load: '3',
            notes: 'Correção manuscrita no Abd Supra',
          },
          { name: 'Cardio Final 5min', sets: 1, reps: '5 min', load: '', notes: 'CARDIO 5 MIN' },
        ],
        B: [
          {
            name: 'Aquecimento Esteira/Bike 3min',
            sets: 1,
            reps: '3 min',
            load: '',
            notes: 'AQUECIMENTO 3 MIN',
          },
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
          { name: 'Cardio Final 5min', sets: 1, reps: '5 min', load: '', notes: 'CARDIO 5 MIN' },
        ],
        C: [
          {
            name: 'Aquecimento Esteira/Bike 3min',
            sets: 1,
            reps: '3 min',
            load: '',
            notes: 'AQUECIMENTO 3 MIN',
          },
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Abdutora Inclinada', sets: 4, reps: '12', load: '25', notes: '' },
          { name: 'Elevação Lateral Simultaneo Halter', sets: 3, reps: '10', load: '3', notes: '' },
          { name: 'Alongamentos', sets: 1, reps: '', load: '', notes: '' },
          { name: 'Cardio Final 5min', sets: 1, reps: '5 min', load: '', notes: 'CARDIO 5 MIN' },
        ],
      },
      frequency: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B'],
    })

    // 61. DANIELLE SANTOS (21, FST-7, MASSAGEM na C, "REVEZAR OS COLORIDOS")
    createStudentSheetAndProgress({
      name: 'DANIELLE SANTOS',
      title: 'Ficha Danielle Santos - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 21 sessões. FST-7, MASSAGEM na Série C e REVEZAR OS COLORIDOS.',
      startDate: '2026-07-15 12:00:00.000Z',
      series: {
        A: [
          {
            name: 'Agachamento Smith Abduzido',
            sets: 4,
            reps: '10',
            load: '12',
            notes: 'REVEZAR OS COLORIDOS',
          },
          { name: 'Leg Press 45º', sets: 4, reps: '10', load: '50', notes: 'REVEZAR OS COLORIDOS' },
          { name: 'Extensora Máquina', sets: 7, reps: '10-12', load: '4', notes: 'FST-7' },
          {
            name: 'Supino Reto Halter',
            sets: 3,
            reps: '10',
            load: '5',
            notes: 'REVEZAR OS COLORIDOS',
          },
          {
            name: 'Tríceps Polia Barra V',
            sets: 3,
            reps: '12',
            load: '5',
            notes: 'REVEZAR OS COLORIDOS',
          },
          {
            name: 'Abdominal Sanfona',
            sets: 3,
            reps: '15',
            load: '',
            notes: 'REVEZAR OS COLORIDOS',
          },
        ],
        B: [
          { name: 'Stiff Smith', sets: 4, reps: '10', load: '15', notes: 'REVEZAR OS COLORIDOS' },
          {
            name: 'Flexora Simul 2 Tempos',
            sets: 4,
            reps: '10',
            load: '4',
            notes: 'REVEZAR OS COLORIDOS',
          },
          {
            name: 'Glúteo 180º Polia',
            sets: 4,
            reps: '10',
            load: '2',
            notes: 'REVEZAR OS COLORIDOS',
          },
          {
            name: 'Remada Curvada Pronado Aberto (Halter)',
            sets: 3,
            reps: '10',
            load: '5',
            notes: 'REVEZAR OS COLORIDOS',
          },
          {
            name: 'Rosca Martelo Halter',
            sets: 3,
            reps: '10',
            load: '4',
            notes: 'REVEZAR OS COLORIDOS',
          },
          {
            name: 'Prancha Ventral',
            sets: 3,
            reps: '30s',
            load: '',
            notes: 'REVEZAR OS COLORIDOS',
          },
        ],
        C: [
          { name: 'Sumô 2 Tempos', sets: 4, reps: '10', load: '16', notes: 'REVEZAR OS COLORIDOS' },
          { name: 'Abdutora Inclinada', sets: 7, reps: '10-12', load: '30', notes: 'FST-7' },
          {
            name: 'Elevação Lateral Simultaneo Halter',
            sets: 3,
            reps: '10',
            load: '3',
            notes: 'REVEZAR OS COLORIDOS',
          },
          {
            name: 'Massagem / Liberação Miofascial',
            sets: 1,
            reps: '10 min',
            load: '',
            notes: 'MASSAGEM na Série C',
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
      ],
    })

    // 62. ALEXSANDRA RODRIGUES (4, Voador carga 0, Adutora "0+2")
    createStudentSheetAndProgress({
      name: 'ALEXSANDRA RODRIGUES',
      title: 'Ficha Alexsandra Rodrigues - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 4 sessões. Voador carga 0 e Adutora carga 0+2 conforme anotação.',
      startDate: '2026-08-16 12:00:00.000Z',
      series: {
        A: [
          { name: 'Agach Pés Anilha', sets: 3, reps: '10', load: '4', notes: '' },
          { name: 'Extensora Curtinho', sets: 3, reps: '10', load: '2', notes: '' },
          { name: 'Adutora Máquina', sets: 3, reps: '10', load: '0+2', notes: '0+2 Adutora' },
          { name: 'Voador', sets: 3, reps: '10', load: '0', notes: 'Voador carga 0' },
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
      frequency: ['A', 'B', 'C', 'A'],
    })

    // 63. ROGER MEIRELES (13, Prancha 3xMÁX, "Voador unil. 0+2" manuscrito)
    createStudentSheetAndProgress({
      name: 'ROGER MEIRELES',
      title: 'Ficha Roger Meireles - Séries A/B/C',
      notes:
        'Intervalo 30–40 segundos. 13 sessões. Prancha 3xMÁX e Voador Unilateral carga 0+2 manuscrito.',
      startDate: '2026-07-28 12:00:00.000Z',
      series: {
        A: [
          { name: 'Supino Reto Barra', sets: 4, reps: '10', load: '18', notes: '' },
          { name: 'Supino Inclinado Halter', sets: 3, reps: '10', load: '12', notes: '' },
          {
            name: 'Voador Unilateral',
            sets: 3,
            reps: '10',
            load: '0+2',
            notes: 'Voador unil. 0+2 manuscrito',
          },
          { name: 'Tríceps Polia Barra V', sets: 3, reps: '12', load: '18', notes: '' },
          { name: 'Abdominal Supra Solo', sets: 3, reps: '15', load: '', notes: '' },
        ],
        B: [
          { name: 'Puxada Frente Pronada', sets: 4, reps: '10', load: '40', notes: '' },
          { name: 'Remada Curvada Halter', sets: 4, reps: '10', load: '12', notes: '' },
          { name: 'Remada Baixa Triângulo', sets: 3, reps: '10', load: '35', notes: '' },
          { name: 'Rosca Direta Barra', sets: 3, reps: '10', load: '8', notes: '' },
          { name: 'Rosca Martelo Halter', sets: 3, reps: '10', load: '10', notes: '' },
          { name: 'Prancha Ventral', sets: 3, reps: 'MÁX', load: '', notes: 'Prancha 3xMÁX' },
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

    console.log('MIGRAÇÃO_0037_CONCLUÍDA: Alunas 43 a 63 cadastradas com sucesso.')
  },
  (app) => {
    const list = [
      'ALVARO FREITAS',
      'CAROL PACHECO',
      'STEPHANE',
      'JULIANA VIEIRA',
      'LUCIO RUFINO',
      'MONICA LACERDA',
      'JOYCE PIMENTEL',
      'HEBERT',
      'ANNA JULIA SANTOS',
      'VALDIANA',
      'FRANEY KARLA',
      'MARLON',
      'JOSE CIPRIANO',
      'MARCOS BELMIRO',
      'EDERSON DE FIGUEIREDO',
      'MARCOS DALTON',
      'THANMARA F. RIBEIRO',
      'GEOVANA SOUZA',
      'DANIELLE SANTOS',
      'ALEXSANDRA RODRIGUES',
      'ROGER MEIRELES',
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
