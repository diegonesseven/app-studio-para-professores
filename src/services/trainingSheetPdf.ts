import type { Student, TrainingSheet, Exercise, ExerciseBlock, SeriesKey } from '@/types'
import { SERIES_KEYS } from '@/types'
import { STUDIO_LOGO_SRC } from '@/assets/logo'
import { escapeHtml } from '@/lib/validation'

export interface SheetExportData {
  student: Student
  sheet: TrainingSheet
  exercisesMap: Record<string, Exercise>
  studioName?: string
  primaryColor?: string
  secondaryColor?: string
  logoUrl?: string
  completedSessionsCount?: number
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

/**
 * Constrói o HTML completo e autocontido da ficha do aluno formatado para A4/impressão e PDF.
 */
export function generateTrainingSheetHtml(data: SheetExportData): string {
  const {
    student,
    sheet,
    exercisesMap,
    studioName = 'Studio Bru Oliveira',
    primaryColor = '#8B5CF6',
    logoUrl,
    completedSessionsCount,
  } = data

  const effectiveLogo = logoUrl || STUDIO_LOGO_SRC

  const dateGenerated = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const rawStartDate = sheet.start_date || sheet.created
  const sheetStartDate = rawStartDate
    ? new Date(rawStartDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : dateGenerated

  const sheetTitle = sheet.title || `Ficha de Treino - ${student.name}`
  const sheetNotes = sheet.notes || ''

  // Processar séries A-E
  const seriesKeys: SeriesKey[] = SERIES_KEYS.filter((key) => {
    const list = sheet.series_data?.[key] || []
    return list.length > 0
  })

  // Se nenhuma série tiver exercício, mostra ao menos A
  const activeKeys = seriesKeys.length > 0 ? seriesKeys : (['A'] as SeriesKey[])

  const seriesHtml = activeKeys
    .map((key) => {
      const blocks: ExerciseBlock[] = sheet.series_data?.[key] || []

      const rowsHtml =
        blocks.length === 0
          ? `<tr><td colspan="7" class="empty-cell">Nenhum exercício cadastrado nesta série.</td></tr>`
          : blocks
              .map((block, idx) => {
                const ex = exercisesMap[block.exercise_id]
                const name = ex?.name || 'Exercício'
                const muscle = ex?.muscle_group || 'Geral'
                const sets = block.sets || 3
                const reps = block.reps || '10'
                const load = block.load || '—'
                const time = block.time || '60s'
                const notes = block.notes || ''

                return `
              <tr>
                <td class="col-idx">#${idx + 1}</td>
                <td class="col-name">
                  <div class="ex-name">${escapeHtml(name)}</div>
                  ${notes ? `<div class="ex-notes"><strong>Obs:</strong> ${escapeHtml(notes)}</div>` : ''}
                </td>
                <td class="col-muscle"><span class="badge-muscle">${escapeHtml(muscle)}</span></td>
                <td class="col-param"><strong>${escapeHtml(String(sets))}x</strong></td>
                <td class="col-param">${escapeHtml(reps)}</td>
                <td class="col-param highlight-load">${escapeHtml(load)}</td>
                <td class="col-param">${escapeHtml(time)}</td>
              </tr>
            `
              })
              .join('')

      return `
        <div class="series-card">
          <div class="series-header">
            <span class="series-badge">Série ${key}</span>
            <span class="series-count">${blocks.length} exercício${blocks.length === 1 ? '' : 's'}</span>
          </div>
          <table class="series-table">
            <thead>
              <tr>
                <th class="col-idx">#</th>
                <th class="col-name">Exercício</th>
                <th class="col-muscle">Grupo</th>
                <th class="col-param">Séries</th>
                <th class="col-param">Reps</th>
                <th class="col-param">Carga</th>
                <th class="col-param">Descanso</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(sheetTitle)} - ${escapeHtml(student.name)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1a1e2d;
      background: #ffffff;
      line-height: 1.35;
      font-size: 11pt;
      padding: 16px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    /* HEADER */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid ${primaryColor};
      padding-bottom: 14px;
      margin-bottom: 16px;
      gap: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-img {
      width: 52px;
      height: 52px;
      object-fit: cover;
      border-radius: 12px;
      border: 1px solid #e0e4f0;
    }
    .brand-title {
      font-size: 18pt;
      font-weight: 900;
      color: ${primaryColor};
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 9pt;
      font-weight: 700;
      color: #7EC8B6;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .meta-box {
      text-align: right;
      font-size: 8.5pt;
      color: #64748b;
    }
    .meta-box strong {
      color: #1e293b;
    }

    /* STUDENT BANNER */
    .student-banner {
      background: linear-gradient(135deg, #f3f5fd 0%, #eefbf7 100%);
      border: 1px solid #d8ddf3;
      border-left: 6px solid ${primaryColor};
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .student-name {
      font-size: 14pt;
      font-weight: 800;
      color: #1e293b;
    }
    .student-info {
      font-size: 9pt;
      color: #475569;
      margin-top: 2px;
    }
    .student-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .tag {
      font-size: 8pt;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #334155;
    }
    .tag-highlight {
      background: ${primaryColor};
      color: #ffffff;
      border-color: ${primaryColor};
    }
    .tag-teal {
      background: #e6f7f3;
      color: #166e58;
      border-color: #7EC8B6;
    }

    /* RESTRICTIONS ALERT */
    .alert-restrictions {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-left: 5px solid #d97706;
      color: #92400e;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 9pt;
      font-weight: 600;
      margin-bottom: 14px;
    }

    /* GENERAL SHEET NOTES */
    .sheet-notes-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 16px;
      font-size: 9pt;
      color: #334155;
    }
    .sheet-notes-box strong {
      color: ${primaryColor};
    }

    /* SERIES CARDS */
    .series-card {
      margin-bottom: 18px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      page-break-inside: avoid;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .series-header {
      background: ${primaryColor};
      color: #ffffff;
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .series-badge {
      font-size: 11pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .series-count {
      font-size: 8.5pt;
      font-weight: 600;
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 12px;
    }

    /* TABLES */
    .series-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    .series-table th {
      background: #f1f5f9;
      color: #475569;
      text-align: left;
      font-weight: 700;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .series-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .series-table tr:nth-child(even) {
      background: #fafbfc;
    }
    .series-table tr:last-child td {
      border-bottom: none;
    }

    .col-idx {
      width: 32px;
      font-weight: 800;
      color: ${primaryColor};
      font-size: 9pt;
      text-align: center;
    }
    .col-name {
      min-width: 180px;
    }
    .ex-name {
      font-weight: 800;
      color: #1e293b;
      font-size: 10pt;
    }
    .ex-notes {
      font-size: 8pt;
      color: #64748b;
      margin-top: 2px;
      font-style: italic;
    }
    .col-muscle {
      width: 100px;
    }
    .badge-muscle {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      color: #475569;
      background: #e2e8f0;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .col-param {
      width: 65px;
      text-align: center;
      font-size: 9pt;
      color: #1e293b;
    }
    .highlight-load {
      font-weight: 800;
      color: ${primaryColor};
    }
    .empty-cell {
      text-align: center;
      padding: 16px;
      color: #94a3b8;
      font-style: italic;
    }

    /* FOOTER */
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #64748b;
    }
    .footer-left strong {
      color: ${primaryColor};
    }

    /* NO PRINT BAR */
    .no-print-bar {
      position: sticky;
      top: 0;
      background: #181C2E;
      color: #ffffff;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .no-print-bar button {
      cursor: pointer;
      font-weight: 700;
      font-size: 13px;
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-print {
      background: #7EC8B6;
      color: #0E111D;
    }
    .btn-print:hover {
      background: #6dbba9;
    }
    .btn-close {
      background: #2A2F45;
      color: #ffffff;
    }
    .btn-close:hover {
      background: #393f5b;
    }

    @media print {
      body {
        padding: 0;
        background: #ffffff;
      }
      .no-print-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print-bar">
      <div>
        <strong>Visualização de Impressão / PDF</strong>
        <span style="opacity: 0.7; font-size: 12px; display: block;">Clique em &quot;Salvar como PDF&quot; na janela de impressão para baixar ou compartilhar pelo WhatsApp.</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button type="button" class="btn-print" onclick="window.print()">
          🖨️ Imprimir / Salvar como PDF
        </button>
        <button type="button" class="btn-close" onclick="window.close()">
          Fechar
        </button>
      </div>
    </div>

    <!-- CABEÇALHO -->
    <header class="header">
      <div class="brand">
        <img src="${effectiveLogo}" alt="${escapeHtml(studioName)}" class="logo-img" />
        <div>
          <h1 class="brand-title">${escapeHtml(studioName)}</h1>
          <div class="brand-sub">Ficha Oficial de Treino Personalizado</div>
        </div>
      </div>
      <div class="meta-box">
        <div>Ficha: <strong>${escapeHtml(sheetTitle)}</strong></div>
        <div>Início da ficha: <strong>${sheetStartDate}</strong></div>
        ${completedSessionsCount !== undefined ? `<div>Sessões concluídas: <strong>${completedSessionsCount}</strong></div>` : ''}
        <div>Emissão: <strong>${dateGenerated}</strong></div>
      </div>
    </header>

    <!-- DADOS DO ALUNO -->
    <section class="student-banner">
      <div>
        <div class="student-name">${escapeHtml(student.name)}</div>
        <div class="student-info">
          ${student.phone ? `WhatsApp: <strong>${escapeHtml(student.phone)}</strong> • ` : ''}
          Início: <strong>${sheetStartDate}</strong> • 
          ${completedSessionsCount !== undefined ? `Sessões feitas: <strong>${completedSessionsCount}</strong> • ` : ''}
          Nível: <strong>${escapeHtml(student.experience_level || 'Iniciante')}</strong>
        </div>
      </div>
      <div class="student-tags">
        <span class="tag tag-highlight">Séries A–E</span>
        ${
          student.goals && student.goals.length > 0
            ? student.goals
                .slice(0, 3)
                .map((g) => `<span class="tag tag-teal">${escapeHtml(g)}</span>`)
                .join('')
            : ''
        }
      </div>
    </section>

    ${
      student.restrictions
        ? `
      <div class="alert-restrictions">
        ⚠️ <strong>Atenção / Restrições Médicas:</strong> ${escapeHtml(student.restrictions)}
      </div>
    `
        : ''
    }

    ${
      sheetNotes
        ? `
      <div class="sheet-notes-box">
        <strong>Recomendações do Treino:</strong> ${escapeHtml(sheetNotes)}
      </div>
    `
        : ''
    }

    <!-- SÉRIES A–E -->
    <section class="series-section">
      ${seriesHtml}
    </section>

    <!-- RODAPÉ -->
    <footer class="footer">
      <div class="footer-left">
        <strong>${escapeHtml(studioName)}</strong> • Treinamento Personalizado & Bem-Estar
      </div>
      <div class="footer-right">
        Documento emitido pelo app Studio dos Professores
      </div>
    </footer>
  </div>

  <script>
    // Se aberto para impressão direta, invoca print após pequeno delay de renderização
    window.addEventListener('DOMContentLoaded', () => {
      // Pequeno timeout para permitir que a logo carregue
      setTimeout(() => {
        // window.print() pode ser chamado manualmente pelo botão do topo
      }, 300);
    });
  </script>
</body>
</html>`
}

/**
 * Abre a janela de visualização/impressão e permite ao professor salvar como PDF ou imprimir.
 */
export function openSheetPrintWindow(data: SheetExportData): Window | null {
  const html = generateTrainingSheetHtml(data)
  const printWindow = window.open('', '_blank', 'width=980,height=900,scrollbars=yes')
  if (!printWindow) {
    return null
  }
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  return printWindow
}

/**
 * Gera arquivo HTML/PDF para download direto (data URI / Blob).
 */
export function downloadSheetAsHtmlFile(data: SheetExportData) {
  const html = generateTrainingSheetHtml(data)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const safeName = (data.student.name || 'aluno')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
  const a = document.createElement('a')
  a.href = url
  a.download = `ficha_treino_${safeName}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Dispara o Web Share API se disponível no dispositivo do professor (tablet / smartphone),
 * ou faz fallback para abrir a janela de impressão/PDF.
 */
export async function shareOrExportSheet(data: SheetExportData): Promise<'shared' | 'opened'> {
  const studentName = data.student.name || 'Aluno'
  const title = `Ficha de Treino - ${studentName} (${data.studioName || 'Studio Bru Oliveira'})`

  // Prepara texto resumido da ficha para compartilhamento no WhatsApp / Mensagem
  const seriesKeys: SeriesKey[] = SERIES_KEYS.filter((key) => {
    const list = data.sheet.series_data?.[key] || []
    return list.length > 0
  })

  let summaryText = `🏋️ *${title}*\n\n`
  seriesKeys.forEach((k) => {
    const list = data.sheet.series_data?.[k] || []
    summaryText += `*Série ${k}* (${list.length} exercícios):\n`
    list.forEach((b, i) => {
      const ex = data.exercisesMap[b.exercise_id]
      const name = ex?.name || 'Exercício'
      summaryText += `  ${i + 1}. ${name} — ${b.sets}x ${b.reps} (Carga: ${b.load || '—'}, Pausa: ${b.time || '60s'})\n`
    })
    summaryText += `\n`
  })

  // Tenta compartilhar nativamente se a API de compartilhamento com texto existir
  if (navigator.share && navigator.canShare && navigator.canShare({ title, text: summaryText })) {
    try {
      await navigator.share({
        title,
        text: summaryText,
      })
      return 'shared'
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return 'shared'
      }
      // Fallback para abrir a janela de PDF
    }
  }

  // Fallback padrão: abre janela otimizada para PDF/Impressão
  openSheetPrintWindow(data)
  return 'opened'
}
