import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Dumbbell, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('Token de verificação ausente na URL.')
      return
    }

    pb.collection('users')
      .confirmVerification(token)
      .then(() => {
        setStatus('success')
      })
      .catch((err: unknown) => {
        setStatus('error')
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Token inválido ou expirado. Tente solicitar uma nova confirmação.',
        )
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4 py-8 relative">
      <div className="w-full max-w-md bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 animate-fade-in-up text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#F06A2A] to-[#FF8A4C] flex items-center justify-center shadow-lg shadow-[#F06A2A]/25 mx-auto mb-4">
          <Dumbbell className="w-7 h-7 text-white stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Verificação de E-mail</h1>
        <p className="text-sm text-[#8A8F98] mb-6">Studio Bru Oliveira</p>

        {status === 'loading' && (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#F06A2A] animate-spin" />
            <p className="text-sm text-[#8A8F98]">Validando sua conta...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white">E-mail verificado!</h2>
            <p className="text-sm text-[#8A8F98]">
              Sua conta foi confirmada com sucesso. Você já pode fazer login na plataforma.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-[#F06A2A] hover:bg-[#D95C1C] text-white"
              >
                Ir para o Login
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-600/40 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-white">Falha na verificação</h2>
            <p className="text-sm text-red-300">{errorMessage}</p>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" className="w-full border-[#2E2E2E] text-white">
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
