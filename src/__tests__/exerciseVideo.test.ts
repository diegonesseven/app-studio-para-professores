import { describe, it, expect } from 'vitest'
import {
  extractYoutubeId,
  extractVimeoId,
  parseVideoUrl,
  getYoutubeThumbnail,
} from '../services/exercises'

describe('Suporte a Vídeos no Acervo: Vimeo, YouTube e Exercício sem Vídeo', () => {
  describe('extractVimeoId', () => {
    it('deve extrair ID do Vimeo em URL padrão https://vimeo.com/123456789', () => {
      expect(extractVimeoId('https://vimeo.com/123456789')).toBe('123456789')
    })

    it('deve extrair ID do Vimeo com www https://www.vimeo.com/987654321', () => {
      expect(extractVimeoId('https://www.vimeo.com/987654321')).toBe('987654321')
    })

    it('deve extrair ID do Vimeo no formato de player embutido https://player.vimeo.com/video/543210987', () => {
      expect(extractVimeoId('https://player.vimeo.com/video/543210987')).toBe('543210987')
    })

    it('deve aceitar ID numérico puro do Vimeo', () => {
      expect(extractVimeoId('123456789')).toBe('123456789')
    })

    it('deve extrair ID em links de canais ou com query params', () => {
      expect(extractVimeoId('https://vimeo.com/channels/staffpicks/891234567?param=true')).toBe(
        '891234567',
      )
    })

    it('deve retornar null para links do YouTube ou strings inválidas', () => {
      expect(extractVimeoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull()
      expect(extractVimeoId('')).toBeNull()
      expect(extractVimeoId(null)).toBeNull()
      expect(extractVimeoId(undefined)).toBeNull()
      expect(extractVimeoId('texto-aleatorio')).toBeNull()
    })
  })

  describe('extractYoutubeId', () => {
    it('deve extrair ID do YouTube em URL watch padrão', () => {
      expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('deve extrair ID do YouTube em link curto youtu.be', () => {
      expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('deve extrair ID do YouTube em embed URL', () => {
      expect(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('deve aceitar ID puro de 11 caracteres com hífens e underscores', () => {
      expect(extractYoutubeId('aclHkVaku9U')).toBe('aclHkVaku9U')
      expect(extractYoutubeId('rT7DgCr-3pg')).toBe('rT7DgCr-3pg')
    })

    it('não deve confundir links do Vimeo com YouTube', () => {
      expect(extractYoutubeId('https://vimeo.com/123456789')).toBeNull()
      expect(extractYoutubeId('https://player.vimeo.com/video/123456789')).toBeNull()
    })

    it('deve retornar null para entradas vazias', () => {
      expect(extractYoutubeId('')).toBeNull()
      expect(extractYoutubeId(null)).toBeNull()
      expect(extractYoutubeId(undefined)).toBeNull()
    })
  })

  describe('parseVideoUrl', () => {
    it('deve detectar plataforma Vimeo e montar embedUrl com autoplay=0', () => {
      const parsed = parseVideoUrl('https://vimeo.com/123456789')
      expect(parsed.platform).toBe('vimeo')
      expect(parsed.id).toBe('123456789')
      expect(parsed.embedUrl).toBe('https://player.vimeo.com/video/123456789?autoplay=0')
      expect(parsed.originalUrl).toBe('https://vimeo.com/123456789')
    })

    it('deve detectar plataforma Vimeo a partir de player.vimeo.com/video/123456789', () => {
      const parsed = parseVideoUrl('https://player.vimeo.com/video/123456789')
      expect(parsed.platform).toBe('vimeo')
      expect(parsed.id).toBe('123456789')
      expect(parsed.embedUrl).toBe('https://player.vimeo.com/video/123456789?autoplay=0')
    })

    it('deve detectar plataforma YouTube e montar embedUrl e thumbnail', () => {
      const parsed = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      expect(parsed.platform).toBe('youtube')
      expect(parsed.id).toBe('dQw4w9WgXcQ')
      expect(parsed.embedUrl).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
      expect(parsed.thumbnailUrl).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    })

    it('deve detectar plataforma "none" para exercício sem vídeo (vazio, nulo ou indefinido)', () => {
      expect(parseVideoUrl('').platform).toBe('none')
      expect(parseVideoUrl('   ').platform).toBe('none')
      expect(parseVideoUrl(null).platform).toBe('none')
      expect(parseVideoUrl(undefined).platform).toBe('none')
      expect(parseVideoUrl('').embedUrl).toBeNull()
      expect(parseVideoUrl('').thumbnailUrl).toBeNull()
    })

    it('deve retornar platform "none" para URLs inválidas sem travar', () => {
      const parsed = parseVideoUrl('https://site-aleatorio.com.br/video.mp4')
      expect(parsed.platform).toBe('none')
      expect(parsed.id).toBeNull()
      expect(parsed.embedUrl).toBeNull()
    })
  })

  describe('getYoutubeThumbnail', () => {
    it('deve gerar URL de thumbnail do YouTube', () => {
      expect(getYoutubeThumbnail('aclHkVaku9U')).toBe(
        'https://img.youtube.com/vi/aclHkVaku9U/hqdefault.jpg',
      )
    })

    it('deve retornar null para id vazio', () => {
      expect(getYoutubeThumbnail(null)).toBeNull()
      expect(getYoutubeThumbnail(undefined)).toBeNull()
      expect(getYoutubeThumbnail('')).toBeNull()
    })
  })
})
