migrate(
  (app) => {
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
      throw new Error('dataForPlayer not found in showcase embed HTML')
    }
    const startIdx = html.indexOf('{', idx)
    const nextVarIdx = html.indexOf('var entityData', startIdx)
    let jsonStr = html.substring(startIdx, nextVarIdx).trim()
    if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1).trim()
    const data = JSON.parse(jsonStr)
    const clips = data.clips || []

    if (clips.length < 200) {
      throw new Error('Expected at least 200 clips, found ' + clips.length)
    }

    // Título normalizado para Title Case em português, preservando acentos
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

      // Normaliza espaços
      const words = str.trim().split(/\s+/)
      return words
        .map((w, index) => {
          // Preservar se contiver parênteses ex: "(CORDA)", "(BARRA)"
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
          // Se for palavra de ligação e não for a primeira nem a última
          if (index > 0 && index < words.length - 1 && lowerWords.indexOf(lowerCore) !== -1) {
            return prefix + lowerCore + suffix
          }

          // Title Case: primeira letra maiúscula, restante minúscula
          // mas se for romano tipo I, II, III, IV ou sigla curta mantemos ou capitalizamos normalmente
          const capitalized = lowerCore.charAt(0).toUpperCase() + lowerCore.slice(1)
          return prefix + capitalized + suffix
        })
        .join(' ')
    }

    // Limpa tabela antes (ou garante idempotência)
    app.db().newQuery('DELETE FROM exercises').execute()

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const videoId = String(clip.id)
      const rawTitle = clip.title || 'Exercício ' + videoId
      const normTitle = toTitleCasePt(rawTitle)
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

      const id = $security.randomString(15)

      app
        .db()
        .newQuery(
          'INSERT INTO exercises (id, name, youtube_url, youtube_id, thumbnail_url, muscle_group, created, updated) ' +
            'VALUES ({:id}, {:name}, {:url}, {:vid}, {:thumb}, {:mg}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        )
        .bind({
          id: id,
          name: normTitle,
          url: vimeoUrl,
          vid: videoId,
          thumb: thumb,
          mg: 'A classificar',
        })
        .execute()
    }
  },
  () => {},
)
