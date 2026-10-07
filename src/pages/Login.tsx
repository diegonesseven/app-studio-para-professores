import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Dumbbell, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
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
      const msg =
        err instanceof Error ? err.message : 'Credenciais inválidas. Verifique seu e-mail e senha.'
      setError(
        msg.includes('Failed to authenticate') || msg.includes('400')
          ? 'E-mail ou senha incorretos. Tente novamente.'
          : msg,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleFillDemo = (type: 'admin' | 'professor') => {
    if (type === 'admin') {
      setEmail('moreiradiego.seven@gmail.com')
      setPassword('Skip@Pass')
    } else {
      setEmail('professor@studiobru.com.br')
      setPassword('Skip@Pass')
    }
    setError(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4 py-8 relative overflow-hidden">
      {/* Glow de fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F06A2A]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 animate-fade-in-up">
        {/* Branding Studio Bru Oliveira */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#F06A2A] to-[#FF8A4C] flex items-center justify-center shadow-lg shadow-[#F06A2A]/25 mb-4">
            <Dumbbell className="w-9 h-9 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Studio Bru Oliveira
          </h1>
          <p className="text-sm text-[#8A8F98] mt-1">Plataforma do Professor e Personal Trainer</p>
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
              className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 focus-visible:ring-[#F06A2A]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm text-[#FFFFFF] font-medium">
                Senha
              </Label>
              <Link to="/forgot-password" className="text-xs text-[#F06A2A] hover:underline">
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
                className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 pr-11 focus-visible:ring-[#F06A2A]"
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
            className="w-full h-12 bg-[#F06A2A] hover:bg-[#D95C1C] text-white font-semibold text-base transition-colors shadow-md mt-2"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        {/* Acesso rápido demo */}
        <div className="mt-6 pt-6 border-t border-[#2E2E2E]">
          <p className="text-xs text-[#8A8F98] text-center mb-3">
            Acesso rápido para teste de perfis:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFillDemo('professor')}
              className="text-xs border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white h-9"
            >
              Professor Bru
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFillDemo('admin')}
              className="text-xs border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white h-9"
            >
              Admin Diego
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
