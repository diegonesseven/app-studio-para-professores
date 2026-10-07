import { describe, it, expect } from 'vitest'
import {
  maskPhone,
  validatePhone,
  validateEmail,
  sanitizeText,
  escapeHtml,
  sanitizeUrl,
} from '../lib/validation'

describe('Validação, Máscaras e Proteção contra XSS', () => {
  describe('maskPhone', () => {
    it('deve formatar número de celular com 11 dígitos', () => {
      expect(maskPhone('11987654321')).toBe('(11) 98765-4321')
    })

    it('deve formatar número fixo com 10 dígitos', () => {
      expect(maskPhone('1133334444')).toBe('(11) 3333-4444')
    })

    it('deve retornar string vazia para entrada vazia ou nula', () => {
      expect(maskPhone('')).toBe('')
      expect(maskPhone(null)).toBe('')
      expect(maskPhone(undefined)).toBe('')
    })

    it('deve lidar com digitação progressiva', () => {
      expect(maskPhone('1')).toBe('(1')
      expect(maskPhone('11')).toBe('(11')
      expect(maskPhone('119')).toBe('(11) 9')
    })
  })

  describe('validatePhone', () => {
    it('deve validar telefone correto com DDD válido', () => {
      expect(validatePhone('(11) 98765-4321')).toBe(true)
      expect(validatePhone('11987654321')).toBe(true)
      expect(validatePhone('1133334444')).toBe(true)
    })

    it('deve rejeitar sequências inválidas ou repetidas', () => {
      expect(validatePhone('11111111111')).toBe(false)
      expect(validatePhone('00987654321')).toBe(false)
      expect(validatePhone('123')).toBe(false)
    })

    it('deve aceitar vazio se não obrigatório', () => {
      expect(validatePhone('', false)).toBe(true)
      expect(validatePhone(null, false)).toBe(true)
    })
  })

  describe('validateEmail', () => {
    it('deve validar e-mails válidos', () => {
      expect(validateEmail('professor@studiobru.com.br', true)).toBe(true)
      expect(validateEmail('moreiradiego.seven@gmail.com', true)).toBe(true)
      expect(validateEmail('teste.aluno+1@sub.dominio.com', true)).toBe(true)
    })

    it('deve rejeitar e-mails inválidos', () => {
      expect(validateEmail('email-sem-arroba', true)).toBe(false)
      expect(validateEmail('email@sem-ponto', true)).toBe(false)
      expect(validateEmail('@dominio.com', true)).toBe(false)
      expect(validateEmail('', true)).toBe(false)
    })
  })

  describe('sanitizeText (Proteção XSS)', () => {
    it('deve remover tags <script> e seu conteúdo', () => {
      const malicious = 'Mariana <script>alert("XSS")</script> Costa'
      expect(sanitizeText(malicious)).toBe('Mariana  Costa')
    })

    it('deve remover iframes, embeds e objetos maliciosos', () => {
      const malicious = 'João <iframe src="javascript:alert(1)"></iframe> Silva'
      expect(sanitizeText(malicious)).toBe('João  Silva')
    })

    it('deve remover manipuladores de evento inline como onload, onerror, onclick', () => {
      const malicious = '<img src=x onerror=alert(1)> Pedro'
      expect(sanitizeText(malicious)).toBe('Pedro')
    })

    it('deve preservar caracteres legítimos em português (acentos, cedilha, apóstrofo)', () => {
      const legitimate = "D'Ávila da Conceição - Treino de Reabilitação & Força: 20kg"
      expect(sanitizeText(legitimate)).toBe(
        "D'Ávila da Conceição - Treino de Reabilitação & Força: 20kg",
      )
    })
  })

  describe('escapeHtml', () => {
    it('deve escapar caracteres especiais para impressão / PDF', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
      )
      expect(escapeHtml("Mariana & Carlos D'Ávila")).toBe('Mariana &amp; Carlos D&#39;Ávila')
    })
  })

  describe('sanitizeUrl', () => {
    it('deve bloquear esquemas perigosos javascript: e data:', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('')
      expect(sanitizeUrl('data:text/html;base64,PHNjcmlwdD5...')).toBe('')
    })

    it('deve permitir URLs http e https legítimas', () => {
      expect(sanitizeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      )
    })
  })
})
