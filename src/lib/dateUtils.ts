/**
 * Helpers utilitários para manipulação e formatação consistente de datas.
 * Lida com formatos ISO ("2026-10-08T00:00:00.000Z"), formato padrão PocketBase
 * ("2026-10-08 00:00:00.000Z"), strings simples ("2026-10-08") e objetos Date,
 * prevenindo o erro "Invalid Date".
 */

/**
 * Extrai a parte da data no formato YYYY-MM-DD via regex, independente de separador
 * ('T', espaço, ou sufixos de fuso horário).
 */
export function extractDateInputVal(dateStr?: string | Date | null): string {
  if (!dateStr) return ''
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return ''
    const year = dateStr.getFullYear()
    const month = String(dateStr.getMonth() + 1).padStart(2, '0')
    const day = String(dateStr.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const str = String(dateStr).trim()
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }

  // Tenta formato brasileiro DD/MM/YYYY se aplicável
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`
  }

  return ''
}

/**
 * Converte qualquer representação de data para formato legível pt-BR (DD/MM/AAAA).
 * Retorna fallback (padrão: "—" ou string vazia se especificado) quando a data for nula ou inválida.
 */
/**
 * Converte de forma segura uma string de data (ou YYYY-MM-DD) para ISO string sem distorção de fuso horário.
 */
export function safeDateToISO(dateInput: string): string {
  if (!dateInput) return new Date().toISOString()
  const clean = extractDateInputVal(dateInput)
  if (clean) {
    const parts = clean.split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      return new Date(Date.UTC(year, month, day, 12, 0, 0)).toISOString()
    }
  }
  const d = new Date(dateInput)
  return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString()
}

export function parseAndFormatDate(dateStr?: string | Date | null, fallback = '—'): string {
  if (!dateStr) return fallback

  const ymd = extractDateInputVal(dateStr)
  if (ymd) {
    const parts = ymd.split('-')
    if (parts.length === 3) {
      const [year, month, day] = parts
      return `${day}/${month}/${year}`
    }
  }

  // Fallback caso seja um objeto Date direto ou timestamp numérico válido
  try {
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR')
    }
  } catch {
    // Ignora e usa fallback
  }

  return fallback
}
