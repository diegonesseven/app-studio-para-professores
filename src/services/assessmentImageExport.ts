import { parseAndFormatDate } from '@/lib/dateUtils'
import { STUDIO_LOGO_SRC } from '@/assets/logo'
import {
  type ClassificationResult,
  classifyBodyFat,
  classifyImc,
  classifySkeletalMuscle,
  classifyVisceralFat,
  classifyWaistHipRatio,
  calculateWaistHipRatio,
} from '@/lib/omronClassification'
import { type PhysicalAssessment } from '@/types'

export interface AssessmentImageExportParams {
  studentName?: string
  studentAge?: number | null
  assessmentDate: string
  sex: 'M' | 'F'
  heightCm?: number | null
  currentAssessment: PhysicalAssessment
  previousAssessment?: PhysicalAssessment | null
  studioName?: string
}

interface ExportRow {
  group: 'bio' | 'perim'
  param: string
  prevVal?: string
  currVal: string
  reference: string
  classification?: ClassificationResult | null
  isHighlight?: boolean
}

/**
 * Helper seguro para desenhar retângulos com cantos arredondados,
 * com fallback para navegadores antigos onde `ctx.roundRect` não existe.
 */
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: number | number[] = 0,
): void {
  // Se o método nativo existir, use-o com segurança
  if (typeof (ctx as any).roundRect === 'function') {
    try {
      ;(ctx as any).roundRect(x, y, w, h, radii)
      return
    } catch {
      // Em caso de falha de argumentos em navegadores antigos, cai no fallback manual
    }
  }

  // Fallback manual usando arcos e linhas
  let rTopLeft = 0
  let rTopRight = 0
  let rBottomRight = 0
  let rBottomLeft = 0

  if (typeof radii === 'number') {
    rTopLeft = rTopRight = rBottomRight = rBottomLeft = Math.max(0, radii)
  } else if (Array.isArray(radii)) {
    if (radii.length === 1) {
      rTopLeft = rTopRight = rBottomRight = rBottomLeft = Math.max(0, radii[0] || 0)
    } else if (radii.length === 2) {
      rTopLeft = rBottomRight = Math.max(0, radii[0] || 0)
      rTopRight = rBottomLeft = Math.max(0, radii[1] || 0)
    } else if (radii.length === 4) {
      rTopLeft = Math.max(0, radii[0] || 0)
      rTopRight = Math.max(0, radii[1] || 0)
      rBottomRight = Math.max(0, radii[2] || 0)
      rBottomLeft = Math.max(0, radii[3] || 0)
    }
  }

  // Garante que o raio não exceda metade da largura/altura
  const maxR = Math.min(w / 2, h / 2)
  rTopLeft = Math.min(rTopLeft, maxR)
  rTopRight = Math.min(rTopRight, maxR)
  rBottomRight = Math.min(rBottomRight, maxR)
  rBottomLeft = Math.min(rBottomLeft, maxR)

  ctx.moveTo(x + rTopLeft, y)
  ctx.lineTo(x + w - rTopRight, y)
  if (rTopRight > 0) ctx.arcTo(x + w, y, x + w, y + rTopRight, rTopRight)
  ctx.lineTo(x + w, y + h - rBottomRight)
  if (rBottomRight > 0) ctx.arcTo(x + w, y + h, x + w - rBottomRight, y + h, rBottomRight)
  ctx.lineTo(x + rBottomLeft, y + h)
  if (rBottomLeft > 0) ctx.arcTo(x, y + h, x, y + h - rBottomLeft, rBottomLeft)
  ctx.lineTo(x, y + rTopLeft)
  if (rTopLeft > 0) ctx.arcTo(x, y, x + rTopLeft, y, rTopLeft)
  ctx.closePath()
}

/**
 * Cria um canvas e renderiza visualmente a ficha de avaliação física em alta resolução.
 * Retorna um Blob PNG.
 */
export async function generateAssessmentImageBlob(
  params: AssessmentImageExportParams,
): Promise<Blob> {
  const {
    studentName = 'Aluno',
    studentAge,
    assessmentDate,
    sex,
    heightCm,
    currentAssessment,
    previousAssessment,
    studioName = 'Studio Bru Oliveira',
  } = params

  const data = currentAssessment.data || {}
  const prevData = previousAssessment?.data || {}

  // Monta as linhas para renderização
  const rows: ExportRow[] = []

  // 1. Bioimpedância
  // Peso
  const pesoCurr = data.peso ?? null
  const pesoPrev = prevData.peso ?? null
  rows.push({
    group: 'bio',
    param: 'Peso (kg)',
    prevVal: pesoPrev !== null ? `${pesoPrev.toString().replace('.', ',')} kg` : '—',
    currVal: pesoCurr !== null ? `${pesoCurr.toString().replace('.', ',')} kg` : '—',
    reference: 'Metabolismo / Evolução',
  })

  // IMC
  const imcCurr = data.imc ?? null
  const imcPrev = prevData.imc ?? null
  const imcClassif = classifyImc(imcCurr)
  rows.push({
    group: 'bio',
    param: 'IMC (kg/m²)',
    prevVal: imcPrev !== null ? imcPrev.toString().replace('.', ',') : '—',
    currVal: imcCurr !== null ? imcCurr.toString().replace('.', ',') : '—',
    reference: '18,5 – 24,9 (Normal)',
    classification: imcClassif,
  })

  // % Gordura
  const fatCurr = data.gordura ?? null
  const fatPrev = prevData.gordura ?? null
  const fatClassif = classifyBodyFat(fatCurr, sex, studentAge)
  rows.push({
    group: 'bio',
    param: '% Gordura Corporal',
    prevVal: fatPrev !== null ? `${fatPrev.toString().replace('.', ',')}%` : '—',
    currVal: fatCurr !== null ? `${fatCurr.toString().replace('.', ',')}%` : '—',
    reference: fatClassif?.rangeLabel || (sex === 'M' ? '8,0 – 19,9%' : '21,0 – 32,9%'),
    classification: fatClassif,
  })

  // % Músculos Esqueléticos
  const muscCurr = data.musculos ?? null
  const muscPrev = prevData.musculos ?? null
  const muscClassif = classifySkeletalMuscle(muscCurr, sex, studentAge)
  rows.push({
    group: 'bio',
    param: '% Músculos Esqueléticos',
    prevVal: muscPrev !== null ? `${muscPrev.toString().replace('.', ',')}%` : '—',
    currVal: muscCurr !== null ? `${muscCurr.toString().replace('.', ',')}%` : '—',
    reference:
      muscClassif?.rangeLabel ||
      (sex === 'M' ? '≥ 33,3% (↑ maior melhor)' : '≥ 24,3% (↑ maior melhor)'),
    classification: muscClassif,
    isHighlight: true,
  })

  // Gordura Visceral
  const viscCurr = data.gordura_visceral ?? null
  const viscPrev = prevData.gordura_visceral ?? null
  const viscClassif = classifyVisceralFat(viscCurr)
  rows.push({
    group: 'bio',
    param: 'Gordura Visceral',
    prevVal: viscPrev !== null ? String(viscPrev) : '—',
    currVal: viscCurr !== null ? String(viscCurr) : '—',
    reference: '< 9 (1 a 9 Normal)',
    classification: viscClassif,
  })

  // Metabolismo basal MR
  if (data.mr) {
    rows.push({
      group: 'bio',
      param: 'Taxa Metabólica (MR)',
      prevVal: prevData.mr ? `${prevData.mr} kcal` : '—',
      currVal: `${data.mr} kcal`,
      reference: 'Gasto calórico basal',
    })
  }

  // Idade Biológica
  if (data.idade_biologica) {
    rows.push({
      group: 'bio',
      param: 'Idade Biológica',
      prevVal: prevData.idade_biologica ? `${prevData.idade_biologica} anos` : '—',
      currVal: `${data.idade_biologica} anos`,
      reference: studentAge ? `Cronológica: ${studentAge} anos` : '—',
    })
  }

  // RCQ
  const rcqCurr = calculateWaistHipRatio(data.cintura, data.quadril)
  const rcqPrev = calculateWaistHipRatio(prevData.cintura, prevData.quadril)
  if (rcqCurr !== null) {
    const rcqClassif = classifyWaistHipRatio(rcqCurr, sex)
    rows.push({
      group: 'perim',
      param: 'Relação Cintura-Quadril (RCQ)',
      prevVal: rcqPrev !== null ? rcqPrev.toFixed(2).replace('.', ',') : '—',
      currVal: rcqCurr.toFixed(2).replace('.', ','),
      reference: sex === 'M' ? '< 0,90 (Saudável)' : '< 0,85 (Saudável)',
      classification: rcqClassif,
    })
  }

  // Perimetria principal
  const addPerimSingle = (label: string, curr?: number | null, prev?: number | null) => {
    if (curr !== null && curr !== undefined) {
      rows.push({
        group: 'perim',
        param: label,
        prevVal:
          prev !== null && prev !== undefined ? `${prev.toString().replace('.', ',')} cm` : '—',
        currVal: `${curr.toString().replace('.', ',')} cm`,
        reference: 'Perimetria (cm)',
      })
    }
  }

  const addPerimBi = (
    label: string,
    curr?: { direito?: number | null; esquerdo?: number | null },
    prev?: { direito?: number | null; esquerdo?: number | null },
  ) => {
    if (curr?.direito || curr?.esquerdo) {
      const dStr = curr.direito ? `D: ${curr.direito}cm` : ''
      const eStr = curr.esquerdo ? `E: ${curr.esquerdo}cm` : ''
      const currStr = [dStr, eStr].filter(Boolean).join(' | ')

      const prevD = prev?.direito ? `D: ${prev.direito}cm` : ''
      const prevE = prev?.esquerdo ? `E: ${prev.esquerdo}cm` : ''
      const prevStr = [prevD, prevE].filter(Boolean).join(' | ') || '—'

      rows.push({
        group: 'perim',
        param: label,
        prevVal: prevStr,
        currVal: currStr,
        reference: 'Bilateral (cm)',
      })
    }
  }

  addPerimSingle('Tórax', data.torax, prevData.torax)
  addPerimSingle('Ombro', data.ombro, prevData.ombro)
  addPerimSingle('Cintura', data.cintura, prevData.cintura)
  addPerimSingle('Abdômen', data.abdomen, prevData.abdomen)
  addPerimSingle('Quadril', data.quadril, prevData.quadril)
  addPerimBi('Bíceps', data.biceps, prevData.biceps)
  addPerimBi('Antebraço', data.antebraco, prevData.antebraco)
  addPerimBi('Coxa', data.coxa, prevData.coxa)
  addPerimBi('Panturrilha', data.panturrilha, prevData.panturrilha)

  // Carrega logo opcionalmente sem crossOrigin para evitar erros com assets empacotados localmente/tainted canvas
  let logoImg: HTMLImageElement | null = null
  try {
    if (STUDIO_LOGO_SRC) {
      logoImg = await new Promise<HTMLImageElement | null>((resolve) => {
        try {
          const img = new Image()
          // Não define crossOrigin para assets locais/data URI para não disparar erro CORS
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = STUDIO_LOGO_SRC
        } catch {
          resolve(null)
        }
      })
    }
  } catch {
    logoImg = null
  }

  // Garante que a data da avaliação esteja devidamente formatada e sem "Invalid Date"
  const safeAssessmentDate = parseAndFormatDate(assessmentDate, parseAndFormatDate(new Date()))

  // Dimensões do Canvas
  const width = 1080
  const headerHeight = 220
  const infoBarHeight = 90
  const tableHeaderHeight = 44
  const rowHeight = 46
  const footerHeight = 70
  const padding = 36

  const totalHeight =
    headerHeight +
    infoBarHeight +
    tableHeaderHeight +
    rows.length * rowHeight +
    footerHeight +
    padding * 2

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = totalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Falha ao inicializar contexto do Canvas.')
  }

  // Fundo geral escuro elegante (#111526)
  ctx.fillStyle = '#111526'
  ctx.fillRect(0, 0, width, totalHeight)

  // Gradiente sutil no topo
  const topGrad = ctx.createLinearGradient(0, 0, width, 240)
  topGrad.addColorStop(0, 'rgba(235, 94, 40, 0.15)')
  topGrad.addColorStop(1, 'rgba(17, 21, 38, 0)')
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, width, 240)

  // Borda decorativa
  ctx.strokeStyle = '#252B3E'
  ctx.lineWidth = 2
  ctx.strokeRect(16, 16, width - 32, totalHeight - 32)

  let y = padding + 10

  // 1. TOPO: LOGO + NOME DO STUDIO
  if (logoImg) {
    const logoSize = 72
    ctx.save()
    ctx.beginPath()
    ctx.arc(padding + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(logoImg, padding, y, logoSize, logoSize)
    ctx.restore()

    // Borda circular do logo
    ctx.strokeStyle = '#EB5E28'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(padding + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
    ctx.stroke()
  }

  const textStartX = logoImg ? padding + 90 : padding

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 28px sans-serif'
  ctx.fillText(studioName, textStartX, y + 32)

  ctx.fillStyle = '#EB5E28'
  ctx.font = 'bold 15px sans-serif'
  ctx.fillText('AVALIAÇÃO FÍSICA & BIOIMPEDÂNCIA OMRON', textStartX, y + 58)

  y += 95

  // 2. CARD DO ALUNO (Barra horizontal com Dados)
  ctx.fillStyle = '#181C2E'
  ctx.beginPath()
  drawRoundRect(ctx, padding, y, width - padding * 2, 80, 12)
  ctx.fill()
  ctx.strokeStyle = '#2A324B'
  ctx.stroke()

  const colWidth = (width - padding * 2) / 4

  // Aluno
  ctx.fillStyle = '#9CA5B8'
  ctx.font = '11px sans-serif'
  ctx.fillText('ALUNO(A)', padding + 18, y + 26)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 16px sans-serif'
  const displayName = studentName.length > 22 ? studentName.slice(0, 20) + '...' : studentName
  ctx.fillText(displayName, padding + 18, y + 54)

  // Data da Avaliação
  ctx.fillStyle = '#9CA5B8'
  ctx.font = '11px sans-serif'
  ctx.fillText('DATA AVALIAÇÃO', padding + colWidth + 10, y + 26)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText(safeAssessmentDate, padding + colWidth + 10, y + 54)

  // Idade / Sexo
  ctx.fillStyle = '#9CA5B8'
  ctx.font = '11px sans-serif'
  ctx.fillText('IDADE & SEXO', padding + colWidth * 2 + 10, y + 26)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 16px sans-serif'
  const sexLabel = sex === 'M' ? 'Masc (M)' : 'Fem (F)'
  const ageLabel = studentAge ? `${studentAge} anos` : '—'
  ctx.fillText(`${ageLabel} • ${sexLabel}`, padding + colWidth * 2 + 10, y + 54)

  // Altura
  ctx.fillStyle = '#9CA5B8'
  ctx.font = '11px sans-serif'
  ctx.fillText('ALTURA', padding + colWidth * 3 + 10, y + 26)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 16px sans-serif'
  ctx.fillText(heightCm ? `${heightCm} cm` : '—', padding + colWidth * 3 + 10, y + 54)

  y += 100

  // 3. TABELA DE RESULTADOS
  const colX = {
    param: padding + 16,
    prev: padding + 310,
    curr: padding + 460,
    ref: padding + 610,
    classif: padding + 860,
  }

  // Cabeçalho da tabela
  ctx.fillStyle = '#1E243A'
  ctx.beginPath()
  drawRoundRect(ctx, padding, y, width - padding * 2, tableHeaderHeight, [8, 8, 0, 0])
  ctx.fill()
  ctx.strokeStyle = '#2D3550'
  ctx.stroke()

  ctx.fillStyle = '#C5CEE0'
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('PARÂMETRO', colX.param, y + 27)
  ctx.fillText('ANTERIOR', colX.prev, y + 27)
  ctx.fillText('ATUAL', colX.curr, y + 27)
  ctx.fillText('REFERÊNCIA OMRON', colX.ref, y + 27)
  ctx.fillText('CLASSIFICAÇÃO', colX.classif, y + 27)

  y += tableHeaderHeight

  // Linhas da tabela
  rows.forEach((r, idx) => {
    const isEven = idx % 2 === 0
    ctx.fillStyle = r.isHighlight ? 'rgba(235, 94, 40, 0.08)' : isEven ? '#15192A' : '#121522'
    ctx.fillRect(padding, y, width - padding * 2, rowHeight)

    // Linha inferior divisória
    ctx.strokeStyle = '#1F263B'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, y + rowHeight)
    ctx.lineTo(width - padding, y + rowHeight)
    ctx.stroke()

    // Nome do parâmetro
    ctx.fillStyle = r.isHighlight ? '#F87171' : '#FFFFFF'
    ctx.font = r.isHighlight ? 'bold 14px sans-serif' : '14px sans-serif'
    ctx.fillText(r.param, colX.param, y + 28)

    // Valor anterior
    ctx.fillStyle = '#7E889F'
    ctx.font = '13px monospace'
    ctx.fillText(r.prevVal || '—', colX.prev, y + 28)

    // Valor atual
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 14px monospace'
    ctx.fillText(r.currVal, colX.curr, y + 28)

    // Referência
    ctx.fillStyle = '#9CA5B8'
    ctx.font = '12px sans-serif'
    ctx.fillText(r.reference, colX.ref, y + 28)

    // Classificação (com pílula colorida)
    if (r.classification) {
      const cls = r.classification
      const pillW = 120
      const pillH = 26
      const pillX = colX.classif
      const pillY = y + (rowHeight - pillH) / 2

      let bgPill = 'rgba(16, 185, 129, 0.2)'
      let textPill = '#34D399'
      let borderPill = '#059669'

      if (cls.statusColor === 'yellow') {
        bgPill = 'rgba(245, 158, 11, 0.2)'
        textPill = '#FBBF24'
        borderPill = '#D97706'
      } else if (cls.statusColor === 'red') {
        bgPill = 'rgba(239, 68, 68, 0.2)'
        textPill = '#F87171'
        borderPill = '#DC2626'
      }

      ctx.fillStyle = bgPill
      ctx.beginPath()
      drawRoundRect(ctx, pillX, pillY, pillW, pillH, 6)
      ctx.fill()
      ctx.strokeStyle = borderPill
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = textPill
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(cls.label, pillX + pillW / 2, pillY + 17)
      ctx.textAlign = 'left' // restaura alinhamento
    } else {
      ctx.fillStyle = '#5A637A'
      ctx.font = '12px sans-serif'
      ctx.fillText('—', colX.classif, y + 28)
    }

    y += rowHeight
  })

  // 4. RODAPÉ
  y += 24
  ctx.fillStyle = '#6B7280'
  ctx.font = '11px sans-serif'
  ctx.fillText(
    'Fonte dos limites: Diretrizes de IMC NIH/OMS e Omron Healthcare. Gerado via App Studio Bru Oliveira.',
    padding + 4,
    y,
  )

  const timestamp = parseAndFormatDate(new Date())
  ctx.textAlign = 'right'
  ctx.fillText(`Exportado em ${timestamp}`, width - padding - 4, y)
  ctx.textAlign = 'left'

  // Converte canvas para Blob PNG
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Erro ao converter imagem da avaliação.'))
      }
    }, 'image/png')
  })
}

/**
 * Baixa o resultado da avaliação como arquivo PNG no dispositivo.
 */
export async function downloadAssessmentImage(
  params: AssessmentImageExportParams,
  filename?: string,
): Promise<void> {
  const blob = await generateAssessmentImageBlob(params)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeName = (params.studentName || 'avaliacao').toLowerCase().replace(/[^a-z0-9]/g, '_')
  const safeDateStr = parseAndFormatDate(
    params.assessmentDate,
    parseAndFormatDate(new Date()),
  ).replace(/\//g, '-')
  link.download = filename || `avaliacao_${safeName}_${safeDateStr}.png`
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Compartilha o resultado como imagem via Web Share API (ex.: WhatsApp) ou faz fallback para download.
 * Lida com NotAllowedError no iOS / WebViews e qualquer outra falha não-AbortError caindo imediatamente no download direto.
 */
export async function shareOrDownloadAssessmentImage(
  params: AssessmentImageExportParams,
): Promise<'shared' | 'downloaded'> {
  const blob = await generateAssessmentImageBlob(params)
  const safeName = (params.studentName || 'avaliacao').toLowerCase().replace(/[^a-z0-9]/g, '_')
  const safeDateStr = parseAndFormatDate(
    params.assessmentDate,
    parseAndFormatDate(new Date()),
  ).replace(/\//g, '-')
  const fileName = `avaliacao_${safeName}_${safeDateStr}.png`

  // Helper interno para executar download direto
  const triggerDirectDownload = () => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return 'downloaded' as const
  }

  // Verifica se o navegador suporta Web Share API com arquivos
  let canTryShare = false
  let file: File | null = null

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      file = new File([blob], fileName, { type: 'image/png' })
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        canTryShare = true
      }
    }
  } catch {
    canTryShare = false
  }

  if (canTryShare && file) {
    try {
      await navigator.share({
        files: [file],
        title: `Avaliação Física - ${params.studentName || 'Aluno'}`,
        text: `Olá ${params.studentName || ''}! Segue o resultado da sua avaliação física realizada no ${params.studioName || 'Studio Bru Oliveira'}.`,
      })
      return 'shared'
    } catch (err: unknown) {
      // Se o usuário explicitamente cancelou a janela de compartilhamento, respeitamos
      if (err instanceof Error && err.name === 'AbortError') {
        return 'shared'
      }
      // Qualquer outro erro (como NotAllowedError no iOS, token de gesto expirado, etc.) cai imediatamente no download
      console.warn('Falha no compartilhamento nativo; acionando download:', err)
      return triggerDirectDownload()
    }
  }

  // Fallback: download direto do arquivo PNG
  return triggerDirectDownload()
}
