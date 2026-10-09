migrate(
  (app) => {
    // ══════════════════════════════════════════════════════════════════════════
    // MIGRAÇÃO 0078 - ASSOCIAÇÃO DA VITRINE VIMEO AOS EXERCÍCIOS DO STUDIO
    // ══════════════════════════════════════════════════════════════════════════
    // Regras:
    // 1. Obter os 237 vídeos da showcase Vimeo (https://vimeo.com/showcase/12445893/embed).
    // 2. Obter os 137 exercícios existentes no acervo.
    // 3. Vincular vídeos com correspondência inequívoca aos exercícios existentes
    //    (preenchendo youtube_url, youtube_id e thumbnail_url com o padrão Vimeo).
    // 4. Casos duvidosos (ambiguidades de aparelho, variações de ângulo/método incertas
    //    ou múltiplos candidatos potenciais): NÃO gravar nada, registrar para confirmação.
    // 5. Vídeos sem correspondência no acervo: criar novo exercício padronizado no estilo
    //    do acervo (Title Case pt-BR, acentuação correta), muscle_group = 'A classificar',
    //    sem cadastrar em nenhuma ficha de treino.
    // 6. Nenhuma ficha de treino ou histórico afetados. Schema 100% inalterado.
    // ══════════════════════════════════════════════════════════════════════════

    // 1. Obter vitrine Vimeo
    const res = $http.send({
      url: 'https://vimeo.com/showcase/12445893/embed',
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 30,
    })

    const html = res.raw
    const idx = html.indexOf('dataForPlayer')
    if (idx === -1) {
      throw new Error('dataForPlayer not found in Vimeo showcase embed HTML')
    }
    const startIdx = html.indexOf('{', idx)
    const nextVarIdx = html.indexOf('var entityData', startIdx)
    let jsonStr = html.substring(startIdx, nextVarIdx).trim()
    if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1).trim()
    const data = JSON.parse(jsonStr)
    const clips = data.clips || []

    if (clips.length < 200) {
      throw new Error(`Esperado 237 clips na vitrine, encontrado: ${clips.length}`)
    }

    // Função de normalização estrita
    function norm(str) {
      return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
    }

    // Função de Title Case para novos exercícios no padrão do studio
    function toTitleCasePt(str) {
      if (!str) return ''
      const lowerWords = [
        'de',
        'da',
        'do',
        'das',
        'dos',
        'e',
        'em',
        'no',
        'na',
        'nos',
        'nas',
        'a',
        'o',
        'as',
        'os',
        'com',
        'por',
        'para',
        'sem',
        'sob',
        'sobre',
      ]

      const words = str.trim().split(/\s+/)
      return words
        .map((w, index) => {
          let prefix = ''
          let suffix = ''
          let core = w

          while (
            core.startsWith('(') ||
            core.startsWith('[') ||
            core.startsWith('{') ||
            core.startsWith('"') ||
            core.startsWith("'")
          ) {
            prefix += core[0]
            core = core.slice(1)
          }
          while (
            core.endsWith(')') ||
            core.endsWith(']') ||
            core.endsWith('}') ||
            core.endsWith('"') ||
            core.endsWith("'") ||
            core.endsWith(',') ||
            core.endsWith('.')
          ) {
            suffix = core[core.length - 1] + suffix
            core = core.slice(0, -1)
          }

          if (!core) return w

          const lowerCore = core.toLowerCase()
          if (index > 0 && index < words.length - 1 && lowerWords.indexOf(lowerCore) !== -1) {
            return prefix + lowerCore + suffix
          }

          // Correção de termos específicos
          if (lowerCore === 'halter' || lowerCore === 'halteres') return prefix + 'Halter' + suffix
          if (lowerCore === 'smith') return prefix + 'Smith' + suffix
          if (lowerCore === 'step') return prefix + 'Step' + suffix
          if (lowerCore === 'cross') return prefix + 'Cross' + suffix
          if (lowerCore === 'abd') return prefix + 'Abd' + suffix
          if (lowerCore === '45º' || lowerCore === '45' || lowerCore === '45°')
            return prefix + '45º' + suffix
          if (lowerCore === '180º' || lowerCore === '180' || lowerCore === '180°')
            return prefix + '180º' + suffix
          if (lowerCore === '90º' || lowerCore === '90' || lowerCore === '90°')
            return prefix + '90º' + suffix
          if (lowerCore === '21') return prefix + '21' + suffix

          // Acentuações comuns
          if (lowerCore === 'triceps') return prefix + 'Tríceps' + suffix
          if (lowerCore === 'biceps') return prefix + 'Bíceps' + suffix
          if (lowerCore === 'gluteo') return prefix + 'Glúteo' + suffix
          if (lowerCore === 'simultaneo' || lowerCore === 'simutaneo')
            return prefix + 'Simultâneo' + suffix
          if (lowerCore === 'frances') return prefix + 'Francês' + suffix
          if (lowerCore === 'flexao') return prefix + 'Flexão' + suffix
          if (lowerCore === 'elevacao') return prefix + 'Elevação' + suffix
          if (lowerCore === 'rotacao') return prefix + 'Rotação' + suffix
          if (lowerCore === 'abducao') return prefix + 'Abdução' + suffix
          if (lowerCore === 'aducao') return prefix + 'Adução' + suffix
          if (lowerCore === 'bracos') return prefix + 'Braços' + suffix
          if (lowerCore === 'maquina') return prefix + 'Máquina' + suffix
          if (lowerCore === 'triangulo') return prefix + 'Triângulo' + suffix
          if (lowerCore === 'paturrilha' || lowerCore === 'panturrilha')
            return prefix + 'Panturrilha' + suffix
          if (lowerCore === 'pendulo') return prefix + 'Pêndulo' + suffix

          return prefix + lowerCore.charAt(0).toUpperCase() + lowerCore.slice(1) + suffix
        })
        .join(' ')
    }

    // 2. Carregar os 137 exercícios existentes
    const existingExercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)
    const initialExerciseCount = existingExercises.length

    const exByNorm = new Map()
    for (let i = 0; i < existingExercises.length; i++) {
      const ex = existingExercises[i]
      exByNorm.set(norm(ex.getString('name')), ex)
    }

    // Mapeamento explícito de casos onde o título do vídeo corresponde de forma inequívoca
    // a um exercício existente no acervo (mesmo movimento, apenas variações de abreviação ou digitação):
    const unambiguousEquivalences = new Map([
      ['paturrilhasmith', 'Panturrilha Smith'],
      ['flexorasimultaneo', 'Flexora Simult.'],
      ['gluteo90solocan', 'Glúteo 90º Solo Caneleira'],
      ['flexaodejoelhocansolo', 'Flexão de Joelho Caneleira Solo'],
    ])

    // Lista estrita de casos duvidosos (ambiguidades de equipamento, método ou candidatos concorrentes)
    // Conforme a regra 3: NÃO gravar nada para esses, isolar para confirmação do usuário.
    const doubtfulDefinitions = [
      {
        pattern: /^SUMÔ$/i,
        candidates: ['Sumô Halter'],
        reason:
          'Vídeo não especifica aparelho (halter, barra ou livre), enquanto acervo possui "Sumô Halter"',
      },
      {
        pattern: /^LEVANTAMENTO TERRA$/i,
        candidates: ['Levantamento Terra Smith'],
        reason: 'Vídeo demonstra peso livre / geral vs "Levantamento Terra Smith" no acervo',
      },
      {
        pattern: /^EXTENSORA SIMULTANEA$/i,
        candidates: ['Extensora', 'Extensora 2 Tempos', 'Extensora Isometria'],
        reason: '"Extensora" no acervo pode ser a simultânea padrão ou execução específica',
      },
      {
        pattern: /^LEG SIMULTANEO$/i,
        candidates: ['Leg Press 45º'],
        reason: '"Leg Press 45º" no acervo é executado simultaneamente; pode ou não ser o mesmo',
      },
      {
        pattern: /^SUPINO RETO BARRA-HALTER$/i,
        candidates: ['Supino Reto Conjugado Halter'],
        reason:
          'Título cita barra e halter no mesmo vídeo; acervo possui "Supino Reto Conjugado Halter"',
      },
      {
        pattern: /^PULLEY CORDA$/i,
        candidates: ['Tríceps Polia Corda', 'Pull Down Corda'],
        reason: 'Título ambíguo entre exercício de tríceps na corda e dorsal (pulldown na corda)',
      },
      {
        pattern: /^TRICEPS TESTA SIMULTANEO HALTER$/i,
        candidates: ['Tríceps Testa Simult. Solo Barra H'],
        reason: 'Variação de halter vs barra H no solo',
      },
      {
        pattern: /^PATURRILHA SMITH UNILATERAL$/i,
        candidates: ['Panturrilha Smith'],
        reason: 'Variação unilateral de panturrilha na máquina Smith já cadastrada',
      },
      {
        pattern: /^PANTURRILHA MÁQUINA$/i,
        candidates: ['Panturrilha 3 Fases', 'Panturrilha Leg 45º'],
        reason: 'Dúvida se refere a Panturrilha Leg 45º, banco sóleo ou outra máquina',
      },
      {
        pattern: /^PANTURRILHA LIVRE SIMULTÂNEO$/i,
        candidates: ['Panturrilha 3 Fases'],
        reason: 'Pode corresponder à execução em pé livre ou específica de 3 fases',
      },
      {
        pattern: /^ABDUÇÃO EM V CANELEIRA$/i,
        candidates: ['Adução em "V" Can.', 'Abdução Vertical Can.'],
        reason: 'Possível confusão ortográfica no vídeo entre "Abdução" e "Adução em V"',
      },
      {
        pattern: /^FLEXÃO DE QUADRIL 180º EM PÉ \(CANELEIRA\)$/i,
        candidates: ['Flexão de Quadril 180º Sentado (Caneleira)', 'Flexão de Quadril 180º Polia'],
        reason: 'Diferença de postura (em pé vs sentado)',
      },
    ]

    function checkDoubtful(title) {
      for (let i = 0; i < doubtfulDefinitions.length; i++) {
        if (doubtfulDefinitions[i].pattern.test(title)) {
          return doubtfulDefinitions[i]
        }
      }
      return null
    }

    let linkedCount = 0
    let createdCount = 0
    const linkedReports = []
    const doubtfulReports = []
    const createdReports = []

    // Rastrear nomes que vão existir para evitar qualquer duplicação
    const activeNamesNorm = new Set()
    for (let i = 0; i < existingExercises.length; i++) {
      activeNamesNorm.add(norm(existingExercises[i].getString('name')))
    }

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const videoId = String(clip.id)
      const rawTitle = (clip.title || '').trim()
      const nTitle = norm(rawTitle)
      const vimeoUrl = 'https://vimeo.com/' + videoId

      let thumb = ''
      if (clip.thumbs && typeof clip.thumbs === 'object') {
        thumb =
          clip.thumbs['640'] ||
          clip.thumbs['1280'] ||
          clip.thumbs['960'] ||
          clip.thumbs['base'] ||
          ''
      }

      // 1. Checar se é caso duvidoso (REGRA 3: NÃO gravar nada)
      const doubt = checkDoubtful(rawTitle)
      if (doubt) {
        doubtfulReports.push({
          clipId: videoId,
          clipTitle: rawTitle,
          candidates: doubt.candidates,
          reason: doubt.reason,
          vimeoUrl: vimeoUrl,
        })
        continue
      }

      // 2. Checar correspondência direta ou por equivalência inequívoca no acervo existente
      let targetExercise = null

      if (exByNorm.has(nTitle)) {
        targetExercise = exByNorm.get(nTitle)
      } else if (unambiguousEquivalences.has(nTitle)) {
        const canonicalName = unambiguousEquivalences.get(nTitle)
        targetExercise = exByNorm.get(norm(canonicalName))
      }

      if (targetExercise) {
        // MATCH CLARO: atualizar vídeo no exercício existente via SQL para respeitar os valores atuais de muscle_group
        app
          .db()
          .newQuery(
            'UPDATE exercises SET youtube_url = {:url}, youtube_id = {:vid}, thumbnail_url = {:thumb}, updated = CURRENT_TIMESTAMP WHERE id = {:id}',
          )
          .bind({
            id: targetExercise.id,
            url: vimeoUrl,
            vid: videoId,
            thumb: thumb,
          })
          .execute()

        linkedCount++
        linkedReports.push({
          clipId: videoId,
          clipTitle: rawTitle,
          exerciseId: targetExercise.id,
          exerciseName: targetExercise.getString('name'),
        })
      } else {
        // VÍDEO SEM CORRESPONDÊNCIA NO ACERVO: criar novo exercício
        const formattedTitle = toTitleCasePt(rawTitle)
        const formattedNorm = norm(formattedTitle)

        // Verificação estrita anti-duplicidade:
        if (activeNamesNorm.has(formattedNorm)) {
          // Se de alguma forma já existe esse nome normalizado, vincular ao invés de duplicar!
          const existing = exByNorm.get(formattedNorm)
          if (existing) {
            app
              .db()
              .newQuery(
                'UPDATE exercises SET youtube_url = {:url}, youtube_id = {:vid}, thumbnail_url = {:thumb}, updated = CURRENT_TIMESTAMP WHERE id = {:id}',
              )
              .bind({
                id: existing.id,
                url: vimeoUrl,
                vid: videoId,
                thumb: thumb,
              })
              .execute()

            linkedCount++
            linkedReports.push({
              clipId: videoId,
              clipTitle: rawTitle,
              exerciseId: existing.id,
              exerciseName: existing.getString('name'),
            })
            continue
          }
        }

        // Criar novo registro
        const newId = $security.randomString(15)
        app
          .db()
          .newQuery(
            'INSERT INTO exercises (id, name, youtube_url, youtube_id, thumbnail_url, muscle_group, created, updated) ' +
              'VALUES ({:id}, {:name}, {:url}, {:vid}, {:thumb}, {:mg}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          )
          .bind({
            id: newId,
            name: formattedTitle,
            url: vimeoUrl,
            vid: videoId,
            thumb: thumb,
            mg: 'A classificar',
          })
          .execute()

        activeNamesNorm.add(formattedNorm)
        createdCount++
        createdReports.push({
          clipId: videoId,
          clipTitle: rawTitle,
          newId: newId,
          newName: formattedTitle,
        })
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // VALIDAÇÃO PROGRAMÁTICA PÓS-EXECUÇÃO
    // ══════════════════════════════════════════════════════════════════════════
    const allFinalExercises = app.findRecordsByFilter('exercises', '', 'name', 2000, 0)
    const finalExerciseCount = allFinalExercises.length
    const expectedFinalCount = initialExerciseCount + createdCount

    if (finalExerciseCount !== expectedFinalCount) {
      throw new Error(
        `Inconsistência de contagem: esperado ${expectedFinalCount} exercícios, encontrado ${finalExerciseCount}`,
      )
    }

    // 1. Validar duplicatas no acervo
    const seenNames = new Map()
    for (let i = 0; i < allFinalExercises.length; i++) {
      const ex = allFinalExercises[i]
      const n = norm(ex.getString('name'))
      if (seenNames.has(n)) {
        throw new Error(
          `ERRO CRÍTICO: Duplicação detectada para "${ex.getString('name')}" (id: ${ex.id}) e "${seenNames.get(n)}"`,
        )
      }
      seenNames.set(n, ex.getString('name'))
    }

    // 2. Contar exercícios com vídeo
    let exercisesWithVideo = 0
    for (let i = 0; i < allFinalExercises.length; i++) {
      const ex = allFinalExercises[i]
      if (ex.getString('youtube_url') || ex.getString('youtube_id')) {
        exercisesWithVideo++
      }
    }

    // 3. Validar integridade das fichas (nenhuma ficha afetada)
    const allSheets = app.findRecordsByFilter('training_sheets', '', 'id', 1000, 0)
    const existingIds = new Set(allFinalExercises.map((e) => e.id))
    for (let i = 0; i < allSheets.length; i++) {
      const s = allSheets[i]
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
            if (exId && !existingIds.has(exId)) {
              throw new Error(`Integridade violada na ficha ${s.id}: exercise_id órfão ${exId}`)
            }
          }
        }
      }
    }

    // 4. Salvar relatório completo de auditoria no app_settings
    let auditRec = null
    try {
      auditRec = app.findFirstRecordByData('app_settings', 'key', 'vimeo_import_report')
    } catch (_) {}
    if (!auditRec) {
      const col = app.findCollectionByNameOrId('app_settings')
      auditRec = new Record(col)
      auditRec.set('key', 'vimeo_import_report')
    }

    const auditSummary = {
      totalClipsInShowcase: clips.length,
      initialExercisesCount: initialExerciseCount,
      linkedToExistingCount: linkedCount,
      newExercisesCreatedCount: createdCount,
      doubtfulPendingCount: doubtfulReports.length,
      finalExercisesCount: finalExerciseCount,
      exercisesWithVideoCount: exercisesWithVideo,
      doubtfulCases: doubtfulReports,
    }

    auditRec.set(
      'studio_name',
      `VIMEO: ${clips.length} | Vinculados: ${linkedCount} | Novos: ${createdCount} | Pendentes: ${doubtfulReports.length}`,
    )
    auditRec.set(
      'primary_color',
      `Acervo: ${initialExerciseCount} -> ${finalExerciseCount} | Com vídeo: ${exercisesWithVideo} | Duplicatas: 0`,
    )
    auditRec.set('custom_css', JSON.stringify(auditSummary).substring(0, 4900))
    app.save(auditRec)

    console.log(
      `MIGRAÇÃO 0078 CONCLUÍDA COM SUCESSO: ` +
        `Showcase: ${clips.length} vídeos. ` +
        `Vinculados a existentes: ${linkedCount}. ` +
        `Novos criados: ${createdCount}. ` +
        `Duvidosos isolados: ${doubtfulReports.length}. ` +
        `Total final no acervo: ${finalExerciseCount} (com vídeo: ${exercisesWithVideo}). ` +
        `Zero duplicatas. Fichas intactas.`,
    )
  },
  () => {
    // Reversão de dados operacionais
  },
)
