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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl relative z-10 animate-fade-in-up">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/25 mb-4">
            <Lock className="w-7 h-7 text-white stroke-[2.5]" />
          </div>{' '}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Redefinir Senha</h1>
          <p className="text-sm text-muted-foreground mt-1">Studio Bru Oliveira</p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Senha alterada com sucesso!</h2>
            <p className="text-sm text-muted-foreground">
              Você será redirecionado para a tela de login em instantes...
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button className="w-full bg-primary hover:opacity-90 text-primary-foreground">
                  Ir para Login agora
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!token && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                Aviso: Nenhum token foi detectado no link. Certifique-se de acessar pelo link do
                e-mail recebido.
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="pass" className="text-sm text-foreground font-medium">
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
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground h-12 pr-10 focus-visible:ring-primary"
                />
                <Lock className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="passConf" className="text-sm text-foreground font-medium">
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
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground h-12 pr-10 focus-visible:ring-primary"
                />
                <Lock className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !token}
              className="w-full h-12 bg-primary hover:opacity-90 text-primary-foreground font-semibold transition-colors shadow-md mt-2"
            >
              {isLoading ? 'Redefinindo...' : 'Redefinir senha'}
            </Button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
