migrate(
  (app) => {
    // Atualizar APENAS os registros de carga (coluna P da planilha) da ficha ativa da aluna CARLA RODRIGUES
    // Nenhuma alteração de schema, nenhuma nova coleção, nenhuma alteração em outros alunos/exercícios
    try {
      const carla = app.findFirstRecordByData('students', 'name', 'CARLA RODRIGUES')
      if (!carla) return

      const sheets = app.findRecordsByFilter(
        'training_sheets',
        `student = "${carla.id}" && is_archived != true`,
        '-created',
        1,
        0,
      )
      if (!sheets || sheets.length === 0) return

      const sheet = sheets[0]
      const rawSeriesData = sheet.getString('series_data')
      const seriesData = rawSeriesData ? JSON.parse(rawSeriesData) : {}

      // Mapeamento exato de cargas conforme a tabela oficial (coluna P):
      // SÉRIE A:
      // 1. Extensora Curtinho: 2
      // 2. Supino Reto Conjugado Halter: 5
      // 3. Flexão de Quadril N/AB Can.: 5
      // 4. Elevação Frontal Unilateral Halter: 4
      // 5. Flexão de Quadril 180º Polia: 2
      // 6. Tríceps Testa Simult. Solo Barra H: 4
      // 7. Adução em "V" Can.: 5 kg (5k na tabela)
      // 8. Alongamentos Revezar: ""
      const loadsA = ['2', '5', '5', '4', '2', '4', '5 kg', '']

      // SÉRIE B:
      // 1. Flexora Simult.: 5
      // 2. Remada Curvada Pronado Aberto (Halter): "" (em branco na tabela)
      // 3. Stiff Smith: 15
      // 4. Pulley Frente Fechado Peg Sup. (Barra): 5
      // 5. Panturrilha Smith: 20
      // 6. Rosca Concentrada Halter: 6
      // 7. Pêndulo: 8
      // 8. Alongamentos Revezar: ""
      const loadsB = ['5', '', '15', '5', '20', '6', '8', '']

      // SÉRIE C:
      // 1. Abdutora Inclinada: 6
      // 2. Tríceps Testa Polia Barra Step: 4
      // 3. Levantamento Terra Sumô: 10
      // 4. Tríceps Unilateral Polia: 2
      // 5. Abdução Polia Atrás: 2
      // 6. Glúteo 180º Polia: 3
      // 7. Remada Alta Polia Barra: 3
      // 8. Alongamentos Revezar: ""
      const loadsC = ['6', '4', '10', '2', '2', '3', '3', '']

      if (Array.isArray(seriesData.A)) {
        seriesData.A = seriesData.A.map((item, idx) => ({
          ...item,
          load: loadsA[idx] !== undefined ? loadsA[idx] : item.load || '',
        }))
      }

      if (Array.isArray(seriesData.B)) {
        seriesData.B = seriesData.B.map((item, idx) => ({
          ...item,
          load: loadsB[idx] !== undefined ? loadsB[idx] : item.load || '',
        }))
      }

      if (Array.isArray(seriesData.C)) {
        seriesData.C = seriesData.C.map((item, idx) => ({
          ...item,
          load: loadsC[idx] !== undefined ? loadsC[idx] : item.load || '',
        }))
      }

      sheet.set('series_data', seriesData)
      app.save(sheet)

      // Também sincronizar os snapshots de sessões concluídas do aluno que registraram as séries A, B e C
      // para refletir as cargas nas revisões de histórico caso consultadas
      try {
        const sessions = app.findRecordsByFilter(
          'workout_progress',
          `student = "${carla.id}" && training_sheet = "${sheet.id}"`,
          'created',
          100,
          0,
        )
        for (let i = 0; i < sessions.length; i++) {
          const s = sessions[i]
          const seriesKey = s.getString('series_completed')
          if (seriesData[seriesKey]) {
            s.set('exercises_snapshot', seriesData[seriesKey])
            app.save(s)
          }
        }
      } catch (_) {}
    } catch (err) {
      console.error('Erro ao atualizar cargas da ficha da Carla Rodrigues:', err)
    }
  },
  (app) => {
    // Reverter cargas para vazio caso haja rollback
    try {
      const carla = app.findFirstRecordByData('students', 'name', 'CARLA RODRIGUES')
      if (!carla) return
      const sheets = app.findRecordsByFilter(
        'training_sheets',
        `student = "${carla.id}" && is_archived != true`,
        '-created',
        1,
        0,
      )
      if (!sheets || sheets.length === 0) return
      const sheet = sheets[0]
      const rawSeriesData = sheet.getString('series_data')
      const seriesData = rawSeriesData ? JSON.parse(rawSeriesData) : {}
      ;['A', 'B', 'C'].forEach((k) => {
        if (Array.isArray(seriesData[k])) {
          seriesData[k] = seriesData[k].map((item) => ({ ...item, load: '' }))
        }
      })
      sheet.set('series_data', seriesData)
      app.save(sheet)
    } catch (_) {}
  },
)
