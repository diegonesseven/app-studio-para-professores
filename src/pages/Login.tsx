import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { STUDIO_LOGO_SRC } from '@/assets/logo'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { appearance } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(email.trim(), password)
      navigate('/')
    } catch (err: unknown) {
      console.error('Erro ao realizar login:', err)
      const fieldErrors = extractFieldErrors(err)
      const fieldErrorMsgs = Object.values(fieldErrors)
      const rawMsg = err instanceof Error ? err.message : ''

      if (fieldErrorMsgs.length > 0) {
        setError(fieldErrorMsgs.join(' '))
      } else if (
        rawMsg.toLowerCase().includes('failed to authenticate') ||
        rawMsg.toLowerCase().includes('something went wrong') ||
        rawMsg.includes('400')
      ) {
        setError('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.')
      } else if (rawMsg) {
        setError(rawMsg)
      } else {
        setError('Não foi possível entrar. Verifique seu e-mail e senha ou tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      {/* Glow de fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 animate-fade-in-up">
        {/* Branding Studio Bru Oliveira Oficial */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-20 w-auto max-w-[220px] mb-4 p-2 bg-white rounded-2xl shadow-lg border border-white/20 flex items-center justify-center">
            <img
              src={appearance.logo_url || STUDIO_LOGO_SRC}
              alt={appearance.studio_name || 'Studio Bru Oliveira'}
              className="max-h-16 max-w-full object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {appearance.studio_name || 'Studio Bru Oliveira'}
          </h1>
          <p className="text-sm text-secondary font-medium mt-1">Personal Trainer &amp; Pilates</p>
          <p className="text-xs text-[#9CA5B8] mt-0.5">Plataforma do Professor</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-red-950/50 border border-red-800/60 text-red-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-[#FFFFFF] font-medium">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="seu.email@studiobru.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm text-[#FFFFFF] font-medium">
                Senha
              </Label>
              <Link
                to="/forgot-password"
                className="text-xs text-secondary hover:underline font-medium"
              >
                Recuperar senha
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 pr-11 focus-visible:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F98] hover:text-white p-1"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary hover:opacity-90 text-primary-foreground font-semibold text-base transition-colors shadow-md mt-2"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
