import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Dumbbell, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setError('As senhas digitadas não coincidem.')
      return
    }

    if (!token) {
      setError('Token de recuperação inválido ou ausente no link.')
      return
    }

    setIsLoading(true)
    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao redefinir a senha.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4 py-8 relative">
      <div className="w-full max-w-md bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 animate-fade-in-up">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#F06A2A] to-[#FF8A4C] flex items-center justify-center shadow-lg shadow-[#F06A2A]/25 mb-4">
            <Dumbbell className="w-7 h-7 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Redefinir Senha</h1>
          <p className="text-sm text-[#8A8F98] mt-1">Studio Bru Oliveira</p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white">Senha alterada com sucesso!</h2>
            <p className="text-sm text-[#8A8F98]">
              Você será redirecionado para a tela de login em instantes...
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button className="w-full bg-[#F06A2A] hover:bg-[#D95C1C] text-white">
                  Ir para Login agora
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!token && (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800 text-amber-300 text-xs">
                Aviso: Nenhum token foi detectado no link. Certifique-se de acessar pelo link do
                e-mail recebido.
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="pass" className="text-sm text-white font-medium">
                Nova senha (mínimo 8 caracteres)
              </Label>
              <div className="relative">
                <Input
                  id="pass"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 pr-10 focus-visible:ring-[#F06A2A]"
                />
                <Lock className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="passConf" className="text-sm text-white font-medium">
                Confirmar nova senha
              </Label>
              <div className="relative">
                <Input
                  id="passConf"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 pr-10 focus-visible:ring-[#F06A2A]"
                />
                <Lock className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !token}
              className="w-full h-12 bg-[#F06A2A] hover:bg-[#D95C1C] text-white font-semibold transition-colors shadow-md mt-2"
            >
              {isLoading ? 'Redefinindo...' : 'Redefinir senha'}
            </Button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="text-sm text-[#8A8F98] hover:text-white transition-colors"
              >
                Voltar ao Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
