migrate(
  (app) => {
    // ══════════════════════════════════════════════════════════════════════════
    // MIGRAÇÃO 0066 - CONSOLIDAÇÃO DEFINITIVA DE EXERCÍCIOS DUPLICADOS
    // ══════════════════════════════════════════════════════════════════════════
    // Regra:
    // 1. Agrupar os exercícios pelo nome normalizado (exato mesmo movimento/nome).
    // 2. Variações distintas (ex: Elevação Frontal Unilateral Halter vs Elevação Lateral Simultaneo Halter,
    //    ou Flexão de Quadril 180º Polia vs Sentado Caneleira vs Solo Caneleira) permanecem grupos SEPARADOS.
    // 3. Para cada grupo com > 1 registro:
    //    - Eleger o canônico: mais antigo (menor created / id), preferindo quem já tem vínculos em sheets/progress,
    //      e preferindo nome com acentuação e grafia correta.
    //    - Mapear id_secundario -> id_canonico.
    // 4. Atualizar em training_sheets.series_data todas as ocorrências de id_secundario -> id_canonico,
    //    mantendo 100% dos outros campos intactos (load, reps, sets, notes, time, order).
    // 5. Atualizar em workout_progress.exercises_snapshot todas as ocorrências de id_secundario -> id_canonico.
    // 6. Excluir os registros de exercícios redundantes.
    // 7. Validação programática estrita: se qualquer item em training_sheets ou workout_progress
    //    apontar para um id que não existe na tabela exercises, lançar erro e abortar!
    // 8. Gravar resumo no app_settings (diag_exercises) para auditoria e relatório.
    // ══════════════════════════════════════════════════════════════════════════

    function normalizeKey(str) {
      return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
    }

    // 1. Buscar todos os exercícios
    const exercises = app.findRecordsByFilter('exercises', '', 'created,id', 1000, 0)
    const initialExerciseCount = exercises.length

    // Contar referências prévias em training_sheets e workout_progress para desempate do canônico
    const sheets = app.findRecordsByFilter('training_sheets', '', 'id', 1000, 0)
    const refCount = new Map() // exerciseId -> count

    function countRefsInSeries(seriesData) {
      if (!seriesData) return
      const keys = ['A', 'B', 'C', 'D', 'E']
      for (let k = 0; k < keys.length; k++) {
        const list = seriesData[keys[k]] || []
        for (let i = 0; i < list.length; i++) {
          const exId = list[i].exercise_id
          if (exId) {
            refCount.set(exId, (refCount.get(exId) || 0) + 1)
          }
        }
      }
    }

    for (let i = 0; i < sheets.length; i++) {
      try {
        const raw = sheets[i].getString('series_data')
        const sd = raw ? JSON.parse(raw) : null
        countRefsInSeries(sd)
      } catch (_) {}
    }

    const progresses = app.findRecordsByFilter('workout_progress', '', 'id', 5000, 0)
    for (let i = 0; i < progresses.length; i++) {
      try {
        const raw = progresses[i].getString('exercises_snapshot')
        const list = raw ? JSON.parse(raw) : null
        if (Array.isArray(list)) {
          for (let j = 0; j < list.length; j++) {
            const exId = list[j].exercise_id
            if (exId) {
              refCount.set(exId, (refCount.get(exId) || 0) + 1)
            }
          }
        }
      } catch (_) {}
    }

    // Agrupar por normalizeKey
    const groups = new Map() // key -> Array of exercise records
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      const key = normalizeKey(ex.getString('name'))
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push(ex)
    }

    // 2. Para cada grupo, eleger o canônico e mapear substituições
    const idMap = new Map() // secondaryId -> canonicalId
    const canonicalRecords = []
    const duplicateRecordsToDelete = []
    const groupReport = []

    let duplicateGroupsCount = 0

    groups.forEach((recs, key) => {
      if (recs.length === 1) {
        canonicalRecords.push(recs[0])
        return
      }

      duplicateGroupsCount++

      // Ordenar os candidatos para eleger o canônico:
      // Critério 1: tem vídeo cadastrado? (youtube_url / youtube_id preenchido)
      // Critério 2: quantidade de referências em sheets/progress (mais ativo)
      // Critério 3: qualidade do nome (tem acentuação se outros não têm, comprimento de nome razoável)
      // Critério 4: mais antigo (created asc, id asc)
      recs.sort((a, b) => {
        const aHasVideo = a.getString('youtube_url') || a.getString('youtube_id') ? 1 : 0
        const bHasVideo = b.getString('youtube_url') || b.getString('youtube_id') ? 1 : 0
        if (aHasVideo !== bHasVideo) return bHasVideo - aHasVideo

        const aRefs = refCount.get(a.id) || 0
        const bRefs = refCount.get(b.id) || 0
        if (aRefs !== bRefs) return bRefs - aRefs

        const aCreated = a.getString('created')
        const bCreated = b.getString('created')
        if (aCreated !== bCreated) return aCreated.localeCompare(bCreated)

        return a.id.localeCompare(b.id)
      })

      const canonical = recs[0]
      canonicalRecords.push(canonical)

      const secondaries = recs.slice(1)
      const secondaryNames = []
      for (let j = 0; j < secondaries.length; j++) {
        const sec = secondaries[j]
        idMap.set(sec.id, canonical.id)
        duplicateRecordsToDelete.push(sec)
        secondaryNames.push(`${sec.id} (${sec.getString('name')})`)
      }

      groupReport.push({
        canonicalId: canonical.id,
        canonicalName: canonical.getString('name'),
        mergedCount: secondaries.length,
        secondaries: secondaryNames,
      })
    })

    // 3. Atualizar training_sheets.series_data
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

    // 4. Atualizar workout_progress.exercises_snapshot
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

    // 5. Excluir os registros de exercícios duplicados
    let deletedCount = 0
    for (let i = 0; i < duplicateRecordsToDelete.length; i++) {
      app.delete(duplicateRecordsToDelete[i])
      deletedCount++
    }

    // 6. VALIDAÇÃO PROGRAMÁTICA ESTRITA PÓS-MIGRAÇÃO
    // Recarregar os exercícios ativos no banco
    const remainingExercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)
    const existingExerciseIds = new Set(remainingExercises.map((e) => e.id))

    // Validar todas as fichas (nenhum exercise_id órfão)
    const allSheetsAfter = app.findRecordsByFilter('training_sheets', '', 'id', 1000, 0)
    let totalSheetExerciseRefs = 0
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
            if (exId) {
              totalSheetExerciseRefs++
              if (!existingExerciseIds.has(exId)) {
                throw new Error(
                  `ERRO DE INTEGRIDADE: Ficha ${s.id} série ${keys[k]} item ${j} aponta para exercise_id órfão ${exId}! Operação abortada.`,
                )
              }
            }
          }
        }
      }
    }

    // Validar todo o histórico workout_progress
    const allProgressAfter = app.findRecordsByFilter('workout_progress', '', 'id', 5000, 0)
    let totalProgressExerciseRefs = 0
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
          if (exId) {
            totalProgressExerciseRefs++
            if (!existingExerciseIds.has(exId)) {
              throw new Error(
                `ERRO DE INTEGRIDADE: Workout_progress ${p.id} snapshot item ${j} aponta para exercise_id órfão ${exId}! Operação abortada.`,
              )
            }
          }
        }
      }
    }

    // Validar contagem final de exercícios
    const finalExerciseCount = remainingExercises.length

    // 7. Salvar relatório detalhado em app_settings para auditoria
    try {
      let diag = null
      try {
        diag = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
      } catch (_) {}
      if (!diag) {
        const col = app.findCollectionByNameOrId('app_settings')
        diag = new Record(col)
        diag.set('key', 'diag_exercises')
      }

      diag.set(
        'studio_name',
        `CONSOLIDADO: ${initialExerciseCount} -> ${finalExerciseCount} (removidos ${deletedCount})`,
      )
      diag.set(
        'primary_color',
        `GRUPOS: ${duplicateGroupsCount} | FICHAS_ALT: ${sheetsUpdatedCount} (${sheetItemsUpdatedCount} itens) | PROG_ALT: ${progressUpdatedCount} (${progressItemsUpdatedCount} itens)`,
      )
      diag.set(
        'background_color',
        `REFS_OK: Sheets=${totalSheetExerciseRefs}, Prog=${totalProgressExerciseRefs}, ZERO_ORFÃOS`,
      )
      diag.set(
        'surface_color',
        `MAP_SIZE: ${idMap.size} | CANONICAL_COUNT: ${canonicalRecords.length}`,
      )

      // Guardar amostra de grupos no custom_css
      const reportSummary = {
        initialCount: initialExerciseCount,
        finalCount: finalExerciseCount,
        deletedCount: deletedCount,
        duplicateGroupsCount: duplicateGroupsCount,
        sheetsUpdated: sheetsUpdatedCount,
        sheetItemsUpdated: sheetItemsUpdatedCount,
        progressUpdated: progressUpdatedCount,
        progressItemsUpdated: progressItemsUpdatedCount,
        totalSheetRefsValidated: totalSheetExerciseRefs,
        totalProgressRefsValidated: totalProgressExerciseRefs,
        groups: groupReport.slice(0, 30),
      }
      diag.set('custom_css', JSON.stringify(reportSummary).substring(0, 4900))
      app.save(diag)
    } catch (_) {}

    console.log(
      `MIGRAÇÃO 0066 SUCESSO: ${initialExerciseCount} -> ${finalExerciseCount} exercícios. ` +
        `Removidos: ${deletedCount}. Grupos mesclados: ${duplicateGroupsCount}. ` +
        `Fichas atualizadas: ${sheetsUpdatedCount} (${sheetItemsUpdatedCount} itens). ` +
        `Histórico atualizado: ${progressUpdatedCount} (${progressItemsUpdatedCount} itens). Zero órfãos.`,
    )
  },
  () => {
    // Reversão de dados operacionais irreversível automaticamente (backup / re-seed se necessário)
  },
)
