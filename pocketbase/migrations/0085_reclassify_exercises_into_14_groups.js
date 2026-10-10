migrate(
  (app) => {
    // ══════════════════════════════════════════════════════════════════════════
    // MIGRAÇÃO 0085 - REORGANIZAÇÃO DO ACERVO DE EXERCÍCIOS POR 14 GRUPOS
    // ══════════════════════════════════════════════════════════════════════════
    // Os 14 agrupamentos, na ordem exata e com os nomes exatos:
    // 1. Quadríceps
    // 2. Posterior
    // 3. Glúteo
    // 4. Adutores
    // 5. Abdutores
    // 6. Panturrilha
    // 7. Peito
    // 8. Costas
    // 9. Bíceps
    // 10. Tríceps
    // 11. Ombro
    // 12. Abdômen
    // 13. Mobilidades
    // 14. Outros
    // ══════════════════════════════════════════════════════════════════════════

    const EXACT_14_GROUPS = [
      'Quadríceps',
      'Posterior',
      'Glúteo',
      'Adutores',
      'Abdutores',
      'Panturrilha',
      'Peito',
      'Costas',
      'Bíceps',
      'Tríceps',
      'Ombro',
      'Abdômen',
      'Mobilidades',
      'Outros',
    ]

    function norm(str) {
      return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    }

    function classifyExercise(name, oldMg) {
      const n = norm(name)

      // 13. Mobilidades (ou Alongamentos / Liberação Miofascial)
      if (
        n.includes('mobilidade') ||
        n.includes('alongamento') ||
        n.includes('along') ||
        n.includes('liberacao miofascial') ||
        n.includes('massagem') ||
        oldMg === 'Alongamento'
      ) {
        return 'Mobilidades'
      }

      // 6. Panturrilha
      if (n.includes('panturrilha') || n.includes('paturrilha') || n.includes('soleo')) {
        return 'Panturrilha'
      }

      // 4. Adutores
      if (n.includes('adutora') || n.includes('aducao')) {
        return 'Adutores'
      }

      // 5. Abdutores
      // (Abduções de quadril com caneleira, polia, máquina, solo)
      if (
        n.includes('abdutora') ||
        (n.includes('abducao') && !n.includes('ombro') && !n.includes('braco'))
      ) {
        return 'Abdutores'
      }

      // 3. Glúteo
      if (
        n.includes('gluteo') ||
        n.includes('pelvica') ||
        n.includes('coice') ||
        n.includes('quatro apoios') ||
        n.includes('4 apoios') ||
        n.includes('sumo')
      ) {
        return 'Glúteo'
      }

      // 2. Posterior (isquiotibiais)
      if (
        n.includes('stiff') ||
        n.includes('flexora') ||
        n.includes('flexona') ||
        n.includes('nordica') ||
        n.includes('mesa flexora') ||
        n.includes('cadeira flexora') ||
        n.includes('flexao de joelho') ||
        n.includes('bom dia') ||
        n.includes('good morning')
      ) {
        return 'Posterior'
      }

      // 1. Quadríceps
      if (
        n.includes('extensora') ||
        n.includes('leg press') ||
        n.startsWith('leg ') ||
        n === 'leg' ||
        n.includes('agachamento') ||
        n.includes('afundo') ||
        n.includes('avanco') ||
        n.includes('passada') ||
        n.includes('bulgaro') ||
        n.includes('hack') ||
        n.includes('sissy') ||
        n.includes('pato') ||
        n.includes('pendulo') ||
        n.includes('flexao de quadril')
      ) {
        return 'Quadríceps'
      }

      // 9. Bíceps
      if (n.includes('biceps') || n.includes('rosca')) {
        return 'Bíceps'
      }

      // 10. Tríceps
      if (
        n.includes('triceps') ||
        n.includes('frances') ||
        n.includes('testa') ||
        n.includes('diamante')
      ) {
        return 'Tríceps'
      }

      // 12. Abdômen
      if (
        n.includes('abdominal') ||
        n.includes('abdomen') ||
        n.includes('prancha') ||
        n.includes('infra') ||
        n.includes('supra') ||
        n.includes('perdigueiro') ||
        n.includes('canivete') ||
        n.includes('remador') ||
        n.includes('rolinho') ||
        n.includes('obliquo') ||
        n.includes('sanfona') ||
        n.includes('vacuo') ||
        n.includes('stomach')
      ) {
        return 'Abdômen'
      }

      // 11. Ombro
      if (
        n.includes('ombro') ||
        n.includes('desenvolvimento') ||
        n.includes('elevacao lateral') ||
        n.includes('elevacao frontal') ||
        n.includes('manguito') ||
        n.includes('encolhimento') ||
        n.includes('arnold') ||
        n.includes('crucifixo invertido') ||
        n.includes('remada alta')
      ) {
        return 'Ombro'
      }

      // 7. Peito
      if (
        n.includes('supino') ||
        (n.includes('crucifixo') && !n.includes('invertido')) ||
        n.includes('peck deck') ||
        n.includes('cross over') ||
        n.includes('crossover') ||
        n.includes('flexao de braco') ||
        n.includes('flexao de solo') ||
        (n.includes('voador') && !n.includes('dorsal') && !n.includes('invertido')) ||
        (n.includes('mergulho') && !n.includes('triceps'))
      ) {
        return 'Peito'
      }

      // 8. Costas
      if (
        n.includes('pulley') ||
        n.includes('puxada') ||
        n.includes('remada') ||
        n.includes('pull down') ||
        n.includes('pulldown') ||
        n.includes('barra fixa') ||
        n.includes('dorsal') ||
        n.includes('voador dorsal') ||
        n.includes('cavalo') ||
        n.includes('levantamento terra') ||
        n.includes('terra') ||
        n.includes('serrote') ||
        n.includes('costas') ||
        n.includes('lombar')
      ) {
        return 'Costas'
      }

      // 14. Outros (Cardio, Esteira, Bike, etc.)
      return 'Outros'
    }

    // 1. Atualizar schema da coleção `exercises` para ter os 14 valores de select
    const col = app.findCollectionByNameOrId('exercises')
    const mgField = col.fields.getByName('muscle_group')
    if (mgField) {
      mgField.values = EXACT_14_GROUPS
      mgField.maxSelect = 1
      app.save(col)
    }

    // 2. Reclassificar todos os exercícios existentes no banco via SQL
    const allExercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)
    let reclassifiedCount = 0

    for (let i = 0; i < allExercises.length; i++) {
      const ex = allExercises[i]
      const name = ex.getString('name')
      const currentMg = ex.getString('muscle_group')
      const targetMg = classifyExercise(name, currentMg)

      app
        .db()
        .newQuery(
          'UPDATE exercises SET muscle_group = {:mg}, updated = CURRENT_TIMESTAMP WHERE id = {:id}',
        )
        .bind({
          id: ex.id,
          mg: targetMg,
        })
        .execute()

      reclassifiedCount++
    }

    // 3. Validação de segurança estrita:
    // Nenhum exercício foi perdido, contagem bate, todos pertencem aos 14 grupos
    const checkExercises = app.findRecordsByFilter('exercises', '', 'name', 1000, 0)
    if (checkExercises.length !== allExercises.length) {
      throw new Error(
        `ERRO DE INTEGRIDADE: contagem divergente pós-classificação: antes=${allExercises.length}, depois=${checkExercises.length}`,
      )
    }

    for (let i = 0; i < checkExercises.length; i++) {
      const mg = checkExercises[i].getString('muscle_group')
      if (!EXACT_14_GROUPS.includes(mg)) {
        throw new Error(
          `ERRO: exercício ${checkExercises[i].getString('name')} ficou com grupo inválido "${mg}"!`,
        )
      }
    }

    // Registrar auditoria em app_settings
    let auditRec = null
    try {
      auditRec = app.findFirstRecordByData('app_settings', 'key', 'acervo_14_grupos_audit')
    } catch (_) {}
    if (!auditRec) {
      auditRec = new Record(app.findCollectionByNameOrId('app_settings'))
      auditRec.set('key', 'acervo_14_grupos_audit')
    }
    auditRec.set(
      'studio_name',
      `RECLASSIFICADOS: ${reclassifiedCount} / ${checkExercises.length} exercícios nos 14 grupos oficiais`,
    )
    auditRec.set('custom_css', JSON.stringify(EXACT_14_GROUPS))
    app.save(auditRec)

    console.log(`SUCESSO_0085: ${reclassifiedCount} exercícios classificados nos 14 grupos.`)
  },
  () => {},
)
