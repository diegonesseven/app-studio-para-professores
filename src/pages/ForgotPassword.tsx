import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await pb.collection('users').requestPasswordReset(email.trim())
      setIsSubmitted(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao solicitar recuperação.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 animate-fade-in-up">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/25 mb-4">
            <KeyRound className="w-7 h-7 text-white stroke-[2.5]" />
          </div>{' '}
          <h1 className="text-2xl font-bold tracking-tight text-white">Recuperar Senha</h1>
          <p className="text-sm text-[#8A8F98] mt-1">Studio Bru Oliveira</p>
        </div>

        {isSubmitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white">E-mail enviado!</h2>
            <p className="text-sm text-[#8A8F98]">
              Se houver uma conta associada a <strong className="text-white">{email}</strong>,
              enviamos um link com as instruções para redefinir sua senha.
            </p>
            <div className="pt-4">
              <Link to="/login">
                <Button className="w-full bg-primary hover:opacity-90 text-primary-foreground">
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-white font-medium">
                Seu e-mail cadastrado
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="professor@studiobru.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 pr-10 focus-visible:ring-primary"
                />
                <Mail className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:opacity-90 text-primary-foreground font-semibold transition-colors shadow-md mt-2"
            >
              {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>

            <div className="pt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-[#8A8F98] hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar ao Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
