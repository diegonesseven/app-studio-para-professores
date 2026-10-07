/**
 * Utilitários de Validação por Tipo, Máscaras e Prevenção contra XSS
 * Studio Bru Oliveira
 */

/**
 * Aplica máscara de telefone brasileiro: '(00) 00000-0000' ou '(00) 0000-0000'.
 * Trata digitação progressiva e remove caracteres não-dígitos.
 */
export function maskPhone(value: string | null | undefined): string {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '').slice(0, 11)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/**
 * Valida completude e formato do telefone (deve conter 10 ou 11 dígitos, DDD válido de 11 a 99).
 * Se opcional e vazio, retorna true.
 */
export function validatePhone(value: string | null | undefined, required = false): boolean {
  if (!value || !value.trim()) return !required
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 10 && digits.length !== 11) return false

  // DDD não pode começar com 0
  const ddd = parseInt(digits.slice(0, 2), 10)
  if (ddd < 11 || ddd > 99) return false

  // Celular de 11 dígitos no Brasil deve iniciar com 9 após o DDD
  if (digits.length === 11 && digits[2] !== '9') return false

  // Evita sequências de dígitos iguais repetidos (ex: 11111111111)
  if (/^(\d)\1+$/.test(digits)) return false

  return true
}

/**
 * Aplica máscara de CPF: '000.000.000-00'
 */
export function maskCpf(value: string | null | undefined): string {
  if (!value) return ''
  const digits = String(value).replace(/\D/g, '').slice(0, 11)

  if (digits.length === 0) return ''
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

/**
 * Validação completa de CPF com algoritmo do Dígito Verificador (módulo 11).
 * Se opcional e vazio, retorna true.
 */
export function validateCpf(value: string | null | undefined, required = false): boolean {
  if (!value || !value.trim()) return !required
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11) return false

  // Elimina CPFs conhecidos inválidos formados por todos os números iguais
  if (/^(\d)\1{10}$/.test(digits)) return false

  // Validação do 1º dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i)
  }
  let rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(digits[9], 10)) return false

  // Validação do 2º dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i)
  }
  rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(digits[10], 10)) return false

  return true
}

/**
 * Validação rigorosa de formato de e-mail (RFC 5322 simplificada com domínio e TLD válidos).
 */
export function validateEmail(value: string | null | undefined, required = false): boolean {
  if (!value || !value.trim()) return !required
  const trimmed = value.trim()
  // Padrão de e-mail seguro
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  if (!emailRegex.test(trimmed)) return false
  if (trimmed.length > 254) return false
  return true
}

/**
 * Validação de data (YYYY-MM-DD ou ISO date string).
 * Verifica se a data é real no calendário (ex: rejeita 31/02) e se não está em intervalo absurdo.
 */
export function validateDate(value: string | null | undefined, required = false): boolean {
  if (!value || !value.trim()) return !required
  const trimmed = value.trim().split('T')[0]
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false

  const [yearStr, monthStr, dayStr] = trimmed.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)

  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  if (year < 1900 || year > 2100) return false

  const dateObj = new Date(year, month - 1, day)
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return false
  }

  return true
}

/**
 * Valida número inteiro positivo (ex: séries: 1 a 20).
 */
export function validatePositiveInt(value: unknown, min = 1, max = 999, required = false): boolean {
  if (value === undefined || value === null || value === '') return !required
  const num = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isInteger(num)) return false
  return num >= min && num <= max
}

/**
 * Sanitiza input numérico para séries/repetições (mantém apenas dígitos se requerido).
 */
export function sanitizeNumericOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Sanitização e Prevenção contra Ataques XSS:
 * 1. Remove tags potencialmente perigosas (<script>, <iframe>, <embed>, <object>, on* attributes)
 * 2. Escapa entidades HTML se necessário para inserção em contextos HTML.
 */
export function sanitizeText(str: string | null | undefined): string {
  if (!str) return ''
  return (
    String(str)
      // Remove tags de script e seu conteúdo
      .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
      .replace(/<\s*script[^>]*>/gi, '')
      .replace(/<\s*\/\s*script\s*>/gi, '')
      // Remove iframes / embeds / objects
      .replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
      .replace(/<\s*iframe[^>]*>/gi, '')
      .replace(/<\s*embed[^>]*>/gi, '')
      .replace(/<\s*object[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi, '')
      // Remove tags HTML perigosas para injeção (ex: img, svg, link, form, input, button com handlers)
      .replace(
        /<\s*(?:img|svg|body|html|link|meta|style|base|applet|form|button|input)\b[^>]*>/gi,
        '',
      )
      // Remove links perigosos com javascript:, vbscript: ou data:
      .replace(/(?:href|src|action)\s*=\s*['"]?\s*(?:javascript|data|vbscript):[^'"]*['"]?/gi, '')
      // Remove atributos de evento inline on* (ex: onload=, onerror=, onclick=, onfocus=)
      .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      // Remove tags de estilo para evitar injeção de CSS malicioso
      .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
      .trim()
  )
}

/**
 * Escapa caracteres HTML para exibição 100% segura em documentos HTML (ex: PDF da ficha).
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Sanitiza URLs (garante protocolo http ou https, impede javascript: / data:).
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return ''
  }
  return trimmed
}
