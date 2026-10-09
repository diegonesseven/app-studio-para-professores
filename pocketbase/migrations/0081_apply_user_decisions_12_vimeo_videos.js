migrate(
  (app) => {
    // ══════════════════════════════════════════════════════════════════════════
    // MIGRAÇÃO 0081 - EXECUÇÃO DAS DECISÕES CONFIRMADAS DOS 12 VÍDEOS VIMEO
    // ══════════════════════════════════════════════════════════════════════════
    // Resumo das 12 decisões confirmadas pelo usuário:
    //
    // CASOS DE UNIFICAÇÃO (1, 3, 4):
    // 1. SUMÔ (clip 1234205223) -> é o MESMO exercício que "Sumô Halter".
    //    Unificar mantendo o registro "Sumô" (h3gCdf7No8WsjiI) ou atualizando o nome para "Sumô",
    //    anexar vídeo Vimeo 1234205223, reescrever referências nas fichas/histórico do registro
    //    redundante "Sumô Halter" (LlOzzhIwA9eqwsq) para o mantido, e remover o redundante.
    //
    // 3. EXTENSORA SIMULTANEA (clip 1234204314) -> é o MESMO exercício que "Extensora".
    //    Unificar no registro existente (mQLChSNqA16BIWn), nome vira "Extensora Simultanea" (nomenclatura do vídeo),
    //    vídeo Vimeo 1234204314 anexado, referências mantidas/atualizadas, zero redundantes.
    //
    // 4. LEG SIMULTANEO (clip 1234204621) -> é o MESMO exercício que "Leg Press 45º".
    //    Unificar no registro existente (9VNCbz4BpN2dbsQ), nome vira "Leg Simultaneo",
    //    vídeo Vimeo 1234204621 anexado, referências mantidas/atualizadas, zero redundantes.
    //
    // CASO DE VÍNCULO EM EXISTENTE (9):
    // 9. PANTURRILHA MÁQUINA (clip 1234204702) -> "é máquina sentada".
    //    Vincular vídeo no registro existente de máquina sentada: "Panturrilha Sentado Curtinho" (Tu5EnHLjRrrnYwM).
    //    Não criar duplicado.
    //
    // CASOS DE CRIAÇÃO SEPARADA (2, 5, 6, 7, 8, 10, 11, 12):
    // 2. LEVANTAMENTO TERRA (clip 1234204657) -> Criar separado como "Levantamento Terra", A classificar.
    // 5. SUPINO RETO BARRA-HALTER (clip 1234205243) -> Criar separado como "Supino Reto Barra-Halter", A classificar.
    // 6. PULLEY CORDA (clip 1234204860) -> Criar separado como "Pulley Corda", grupo "Costas" / "A classificar".
    //    (usuário confirmou: "pulley corda é dorsal, mas não é o mesmo exercício que Pull Down Corda", grupo de costas/dorsal).
    // 7. TRICEPS TESTA SIMULTANEO HALTER (clip 1234205419) -> Criar separado como "Tríceps Testa Simultâneo Halter", A classificar.
    // 8. PANTURRILHA SMITH UNILATERAL (clip 1234204730) -> Criar separado como "Panturrilha Smith Unilateral", A classificar.
    // 10. PANTURRILHA LIVRE SIMULTÂNEO (clip 1234204697) -> Criar separado como "Panturrilha Livre Simultâneo", A classificar.
    // 11. ABDUÇÃO EM V CANELEIRA (clip 1234203672) -> Criar separado como "Abdução em V Caneleira", A classificar.
    // 12. FLEXÃO DE QUADRIL 180º EM PÉ (CANELEIRA) (clip 1234204404) -> Criar separado como "Flexão de Quadril 180º Em Pé (Caneleira)", A classificar.
    // ══════════════════════════════════════════════════════════════════════════

    function norm(str) {
      return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
    }

    // Carregar todos os exercícios
    const allExercises = app.findRecordsByFilter('exercises', '', 'created,id', 1000, 0)
    const initialExerciseCount = allExercises.length

    // Mapeamento de reescrita de IDs para training_sheets e workout_progress
    const idMap = new Map() // oldId -> newId

    // ──────────────────────────────────────────────────────────────────────────
    // 1. SUMÔ (clip 1234205223)
    // ──────────────────────────────────────────────────────────────────────────
    // No acervo existem:
    // - id "h3gCdf7No8WsjiI", nome: "Sumô" (usado em 15 fichas)
    // - id "LlOzzhIwA9eqwsq", nome: "Sumô Halter" (usado em 1 ficha)
    // AÇÃO: O exercício mantido passa a se chamar "Sumô", com vídeo do Vimeo (1234205223).
    // Reescrita: LlOzzhIwA9eqwsq -> h3gCdf7No8WsjiI
    const sumoKeepId = 'h3gCdf7No8WsjiI'
    const sumoDeleteId = 'LlOzzhIwA9eqwsq'

    app
      .db()
      .newQuery(
        'UPDATE exercises SET name = {:name}, youtube_url = {:url}, youtube_id = {:vid}, updated = CURRENT_TIMESTAMP WHERE id = {:id}',
      )
      .bind({
        id: sumoKeepId,
        name: 'Sumô',
        url: 'https://vimeo.com/1234205223',
        vid: '1234205223',
      })
      .execute()

    idMap.set(sumoDeleteId, sumoKeepId)

    // ──────────────────────────────────────────────────────────────────────────
    // 3. EXTENSORA SIMULTANEA (clip 1234204314)
    // ──────────────────────────────────────────────────────────────────────────
    // No acervo existe "Extensora" (id "mQLChSNqA16BIWn").
    // AÇÃO: unificar, nome do exercício mantido vira "Extensora Simultanea" (nomenclatura do vídeo),
    // vídeo anexado (1234204314). Não havia duplicado novo criado na 0078.
    const extensoraId = 'mQLChSNqA16BIWn'
    app
      .db()
      .newQuery(
        'UPDATE exercises SET name = {:name}, youtube_url = {:url}, youtube_id = {:vid}, updated = CURRENT_TIMESTAMP WHERE id = {:id}',
      )
      .bind({
        id: extensoraId,
        name: 'Extensora Simultanea',
        url: 'https://vimeo.com/1234204314',
        vid: '1234204314',
      })
      .execute()

    // ──────────────────────────────────────────────────────────────────────────
    // 4. LEG SIMULTANEO (clip 1234204621)
    // ──────────────────────────────────────────────────────────────────────────
    // No acervo existe "Leg Press 45º" (id "9VNCbz4BpN2dbsQ").
    // AÇÃO: unificar, nome vira "Leg Simultaneo", vídeo anexado (1234204621).
    const legId = '9VNCbz4BpN2dbsQ'
    app
      .db()
      .newQuery(
        'UPDATE exercises SET name = {:name}, youtube_url = {:url}, youtube_id = {:vid}, updated = CURRENT_TIMESTAMP WHERE id = {:id}',
      )
      .bind({
        id: legId,
        name: 'Leg Simultaneo',
        url: 'https://vimeo.com/1234204621',
        vid: '1234204621',
      })
      .execute()

    // ──────────────────────────────────────────────────────────────────────────
    // 9. PANTURRILHA MÁQUINA (clip 1234204702)
    // ──────────────────────────────────────────────────────────────────────────
    // Usuário: "é máquina sentada".
    // AÇÃO: vincular o vídeo no exercício existente de panturrilha máquina SENTADA do acervo.
    // Registro: "Panturrilha Sentado Curtinho" (id "Tu5EnHLjRrrnYwM").
    // Não criar duplicado. Anexar vídeo.
    const pantMaqSentadaId = 'Tu5EnHLjRrrnYwM'
    app
      .db()
      .newQuery(
        'UPDATE exercises SET youtube_url = {:url}, youtube_id = {:vid}, updated = CURRENT_TIMESTAMP WHERE id = {:id}',
      )
      .bind({
        id: pantMaqSentadaId,
        url: 'https://vimeo.com/1234204702',
        vid: '1234204702',
      })
      .execute()

    // ──────────────────────────────────────────────────────────────────────────
    // REESCRITA DE REFERÊNCIAS NAS TRAINING_SHEETS E WORKOUT_PROGRESS
    // ──────────────────────────────────────────────────────────────────────────
    const sheets = app.findRecordsByFilter('training_sheets', '', 'id', 1000, 0)
    let sheetsUpdatedCount = 0
    let sheetItemsUpdatedCount = 0

    for (let i = 0; i < sheets.length; i++) {
      const sheet = sheets[i]
      let isSheetModified = false
      let sd = null
      try {
        const raw = sheet.getString('series_data')
        sd = raw ? JSON.parse(raw) : null
      } catch (_) {
        sd = null
      }

      if (sd) {
        const keys = ['A', 'B', 'C', 'D', 'E']
        for (let k = 0; k < keys.length; k++) {
          const list = sd[keys[k]] || []
          for (let j = 0; j < list.length; j++) {
            const item = list[j]
            if (item && item.exercise_id && idMap.has(item.exercise_id)) {
              item.exercise_id = idMap.get(item.exercise_id)
              isSheetModified = true
              sheetItemsUpdatedCount++
            }
          }
        }

        if (isSheetModified) {
          sheet.set('series_data', sd)
          app.save(sheet)
          sheetsUpdatedCount++
        }
      }
    }

    const progresses = app.findRecordsByFilter('workout_progress', '', 'id', 5000, 0)
    let progressUpdatedCount = 0
    let progressItemsUpdatedCount = 0

    for (let i = 0; i < progresses.length; i++) {
      const prog = progresses[i]
      let isProgModified = false
      let list = null
      try {
        const raw = prog.getString('exercises_snapshot')
        list = raw ? JSON.parse(raw) : null
      } catch (_) {
        list = null
      }

      if (Array.isArray(list)) {
        for (let j = 0; j < list.length; j++) {
          const item = list[j]
          if (item && item.exercise_id && idMap.has(item.exercise_id)) {
            item.exercise_id = idMap.get(item.exercise_id)
            isProgModified = true
            progressItemsUpdatedCount++
          }
        }

        if (isProgModified) {
          prog.set('exercises_snapshot', list)
          app.save(prog)
          progressUpdatedCount++
        }
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // REMOÇÃO DO REGISTRO REDUNDANTE DE SUMÔ HALTER
    // ──────────────────────────────────────────────────────────────────────────
    try {
      const recToDelete = app.findFirstRecordByData('exercises', 'id', sumoDeleteId)
      app.delete(recToDelete)
    } catch (_) {}

    // ──────────────────────────────────────────────────────────────────────────
    // CASOS DE CRIAÇÃO SEPARADA (8 exercícios novos com vídeos)
    // 2. Levantamento Terra (1234204657)
    // 5. Supino Reto Barra-Halter (1234205243)
    // 6. Pulley Corda (1234204860) - costas / dorsal
    // 7. Tríceps Testa Simultâneo Halter (1234205419)
    // 8. Panturrilha Smith Unilateral (1234204730)
    // 10. Panturrilha Livre Simultâneo (1234204697)
    // 11. Abdução em V Caneleira (1234203672)
    // 12. Flexão de Quadril 180º Em Pé (Caneleira) (1234204404)
    // ──────────────────────────────────────────────────────────────────────────
    const newExercisesToCreate = [
      {
        name: 'Levantamento Terra',
        vid: '1234204657',
        mg: 'A classificar',
      },
      {
        name: 'Supino Reto Barra-Halter',
        vid: '1234205243',
        mg: 'A classificar',
      },
      {
        name: 'Pulley Corda',
        vid: '1234204860',
        mg: 'Costas',
      },
      {
        name: 'Tríceps Testa Simultâneo Halter',
        vid: '1234205419',
        mg: 'A classificar',
      },
      {
        name: 'Panturrilha Smith Unilateral',
        vid: '1234204730',
        mg: 'A classificar',
      },
      {
        name: 'Panturrilha Livre Simultâneo',
        vid: '1234204697',
        mg: 'A classificar',
      },
      {
        name: 'Abdução em V Caneleira',
        vid: '1234203672',
        mg: 'A classificar',
      },
      {
        name: 'Flexão de Quadril 180º Em Pé (Caneleira)',
        vid: '1234204404',
        mg: 'A classificar',
      },
    ]

    let createdCount = 0
    const createdReport = []

    for (let i = 0; i < newExercisesToCreate.length; i++) {
      const item = newExercisesToCreate[i]
      const nItem = norm(item.name)

      // Verificar se já existe por nome normalizado
      let exists = false
      const checkAll = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)
      for (let c = 0; c < checkAll.length; c++) {
        if (norm(checkAll[c].getString('name')) === nItem) {
          exists = true
          // Se já existisse, atualizaria o vídeo
          app
            .db()
            .newQuery(
              'UPDATE exercises SET youtube_url = {:url}, youtube_id = {:vid}, updated = CURRENT_TIMESTAMP WHERE id = {:id}',
            )
            .bind({
              id: checkAll[c].id,
              url: 'https://vimeo.com/' + item.vid,
              vid: item.vid,
            })
            .execute()
          break
        }
      }

      if (!exists) {
        const newId = $security.randomString(15)
        app
          .db()
          .newQuery(
            'INSERT INTO exercises (id, name, youtube_url, youtube_id, thumbnail_url, muscle_group, created, updated) ' +
              'VALUES ({:id}, {:name}, {:url}, {:vid}, {:thumb}, {:mg}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          )
          .bind({
            id: newId,
            name: item.name,
            url: 'https://vimeo.com/' + item.vid,
            vid: item.vid,
            thumb: '',
            mg: item.mg,
          })
          .execute()

        createdCount++
        createdReport.push({
          id: newId,
          name: item.name,
          vid: item.vid,
          mg: item.mg,
        })
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // VALIDAÇÃO PROGRAMÁTICA ESTRITA PÓS-MIGRAÇÃO
    // ──────────────────────────────────────────────────────────────────────────
    const finalExercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)
    const finalExerciseCount = finalExercises.length
    // Contagem esperada: 318 - 1 (Sumô Halter removido) + 8 (novos) = 325 exercícios!
    const expectedCount = initialExerciseCount - 1 + createdCount
    if (finalExerciseCount !== expectedCount) {
      throw new Error(
        `Inconsistência de contagem: esperado ${expectedCount}, obtido ${finalExerciseCount}`,
      )
    }

    // 1. Zero duplicatas por nome normalizado
    const seenNames = new Map()
    for (let i = 0; i < finalExercises.length; i++) {
      const ex = finalExercises[i]
      const n = norm(ex.getString('name'))
      if (seenNames.has(n)) {
        throw new Error(
          `ERRO CRÍTICO: Duplicação detectada para "${ex.getString('name')}" (id: ${ex.id}) e "${seenNames.get(n)}"`,
        )
      }
      seenNames.set(n, ex.getString('name'))
    }

    // 2. Zero referências órfãs em training_sheets
    const finalExIdSet = new Set(finalExercises.map((e) => e.id))
    const allSheetsAfter = app.findRecordsByFilter('training_sheets', '', 'id', 1000, 0)
    for (let i = 0; i < allSheetsAfter.length; i++) {
      const s = allSheetsAfter[i]
      let sd = null
      try {
        const raw = s.getString('series_data')
        sd = raw ? JSON.parse(raw) : null
      } catch (_) {}
      if (sd) {
        const keys = ['A', 'B', 'C', 'D', 'E']
        for (let k = 0; k < keys.length; k++) {
          const list = sd[keys[k]] || []
          for (let j = 0; j < list.length; j++) {
            const exId = list[j].exercise_id
            if (exId && !finalExIdSet.has(exId)) {
              throw new Error(
                `ERRO DE INTEGRIDADE: Ficha ${s.id} série ${keys[k]} item ${j} aponta para exercise_id órfão ${exId}!`,
              )
            }
          }
        }
      }
    }

    // 3. Zero referências órfãs em workout_progress
    const allProgressAfter = app.findRecordsByFilter('workout_progress', '', 'id', 5000, 0)
    for (let i = 0; i < allProgressAfter.length; i++) {
      const p = allProgressAfter[i]
      let list = null
      try {
        const raw = p.getString('exercises_snapshot')
        list = raw ? JSON.parse(raw) : null
      } catch (_) {}
      if (Array.isArray(list)) {
        for (let j = 0; j < list.length; j++) {
          const exId = list[j].exercise_id
          if (exId && !finalExIdSet.has(exId)) {
            throw new Error(
              `ERRO DE INTEGRIDADE: Workout_progress ${p.id} snapshot item ${j} aponta para exercise_id órfão ${exId}!`,
            )
          }
        }
      }
    }

    // 4. Salvar relatório final em app_settings
    let repRec = null
    try {
      repRec = app.findFirstRecordByData('app_settings', 'key', 'vimeo_12_doubtful_report')
    } catch (_) {}
    if (!repRec) {
      repRec = new Record(app.findCollectionByNameOrId('app_settings'))
      repRec.set('key', 'vimeo_12_doubtful_report')
    }

    const withVideoCount = finalExercises.filter((e) => Boolean(e.getString('youtube_url'))).length

    const summary = {
      initialExercisesCount: initialExerciseCount,
      finalExercisesCount: finalExerciseCount,
      unifiedCount: 3, // Sumô, Extensora Simultanea, Leg Simultaneo
      linkedToExistingCount: 1, // Panturrilha Máquina em Panturrilha Sentado Curtinho
      newExercisesCreatedCount: createdCount, // 8 novos
      sheetsUpdatedCount: sheetsUpdatedCount,
      sheetItemsUpdatedCount: sheetItemsUpdatedCount,
      progressUpdatedCount: progressUpdatedCount,
      progressItemsUpdatedCount: progressItemsUpdatedCount,
      exercisesWithVideoCount: withVideoCount,
      zeroDuplicates: true,
      zeroOrphans: true,
      createdExercises: createdReport,
    }

    repRec.set(
      'studio_name',
      `DECISÕES 12 VÍDEOS: Unificados: 3 | Vinculados: 1 | Novos: ${createdCount} | Total: ${finalExerciseCount}`,
    )
    repRec.set(
      'primary_color',
      `Fichas alteradas: ${sheetsUpdatedCount} (${sheetItemsUpdatedCount} itens) | Progresso: ${progressUpdatedCount} | Vídeos: ${withVideoCount}`,
    )
    repRec.set('custom_css', JSON.stringify(summary).substring(0, 4900))
    app.save(repRec)

    console.log(
      `MIGRAÇÃO 0081 SUCESSO: ` +
        `Acervo: ${initialExerciseCount} -> ${finalExerciseCount}. ` +
        `Unificados: 3 (Sumô, Extensora Simultanea, Leg Simultaneo). ` +
        `Vinculados em existente: 1 (Panturrilha Máquina). ` +
        `Novos criados: ${createdCount}. ` +
        `Fichas atualizadas: ${sheetsUpdatedCount} (${sheetItemsUpdatedCount} itens). ` +
        `Progresso atualizado: ${progressUpdatedCount} (${progressItemsUpdatedCount} itens). ` +
        `Total com vídeo: ${withVideoCount}. ` +
        `Zero duplicatas. Zero referências órfãs.`,
    )
  },
  () => {},
)
