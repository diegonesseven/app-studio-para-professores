import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { profileService, parseProfileErrorMessage } from '@/services/profile'
import { toast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import {
  User as UserIcon,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  Info,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()

  // Estados de edição de Dados Básicos (Nome, Foto)
  const [name, setName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Estados de Alteração de E-mail
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [sendingEmailChange, setSendingEmailChange] = useState(false)
  const [emailSuccessSent, setEmailSuccessSent] = useState(false)

  // Estados de Alteração de Senha
  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      if (user.avatar) {
        setAvatarPreview(pb.files.getURL(user as any, user.avatar))
      } else {
        setAvatarPreview(null)
      }
    }
  }, [user])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Submissão do Nome / Foto
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe seu nome completo.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSavingProfile(true)
      setProfileSuccess(false)
      await profileService.updateProfile(user.id, {
        name,
        avatar: avatarFile,
      })
      await refreshUser()
      setProfileSuccess(true)
      toast({
        title: 'Perfil atualizado com sucesso!',
        description: 'Suas informações cadastrais foram salvas.',
      })
      setTimeout(() => setProfileSuccess(false), 4000)
    } catch (err: unknown) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: parseProfileErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  // Submissão de Troca de E-mail
  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast({
        title: 'E-mail inválido',
        description: 'Informe um endereço de e-mail válido.',
        variant: 'destructive',
      })
      return
    }

    if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      toast({
        title: 'Mesmo e-mail',
        description: 'O novo e-mail informado é idêntico ao seu e-mail atual.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSendingEmailChange(true)
      await profileService.requestEmailChange(newEmail)
      setEmailSuccessSent(true)
      toast({
        title: 'Solicitação enviada!',
        description: `Enviamos uma mensagem de confirmação para ${newEmail}. Acesse a mensagem para validar a troca.`,
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao solicitar alteração',
        description: parseProfileErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSendingEmailChange(false)
    }
  }

  // Submissão de Troca de Senha
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!oldPassword) {
      toast({
        title: 'Senha atual obrigatória',
        description: 'Digite sua senha atual para autorizar a alteração.',
        variant: 'destructive',
      })
      return
    }

    if (!password || password.length < 8) {
      toast({
        title: 'Senha muito curta',
        description: 'A nova senha deve possuir no mínimo 8 caracteres.',
        variant: 'destructive',
      })
      return
    }

    if (password !== passwordConfirm) {
      toast({
        title: 'Senhas não coincidem',
        description: 'A confirmação da nova senha não confere.',
        variant: 'destructive',
      })
      return
    }

    try {
      setChangingPassword(true)
      setPasswordSuccess(false)
      await profileService.changePassword(user.id, {
        oldPassword,
        password,
        passwordConfirm,
      })
      await refreshUser()
      setOldPassword('')
      setPassword('')
      setPasswordConfirm('')
      setPasswordSuccess(true)
      toast({
        title: 'Senha alterada com sucesso! 🔒',
        description: 'Sua nova senha de acesso já está em vigor.',
      })
      setTimeout(() => setPasswordSuccess(false), 5000)
    } catch (err: unknown) {
      toast({
        title: 'Falha ao alterar senha',
        description: parseProfileErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const userInitials = (user?.name || user?.email || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <UserIcon className="w-7 h-7 text-primary" /> Meu Perfil
        </h1>
        <p className="text-sm text-[#8A8F98] mt-1">
          Gerencie seus dados de identificação, credenciais de acesso e segurança da conta.
        </p>
      </div>

      {/* Cartão de Identificação do Usuário */}
      <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar grande com botão de upload */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-[#2A2A2A] to-[#3A3A3A] border-2 border-primary/40 flex items-center justify-center overflow-hidden shadow-inner">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user?.name || 'Avatar'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl sm:text-3xl font-black text-primary">{userInitials}</span>
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-primary text-primary-foreground shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
            title="Alterar foto de perfil"
          >
            <Camera className="w-4 h-4" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        {/* Resumo cadastral */}
        <div className="flex-1 text-center sm:text-left min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
              {user?.name || 'Usuário Studio'}
            </h2>
            <Badge
              className={`text-xs px-2.5 py-0.5 font-bold ${
                isAdmin
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isAdmin ? (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Administrador
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Professor
                </span>
              )}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 text-xs text-[#8A8F98]">
            <span className="flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
              {user?.email}
            </span>
            {user?.created && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                Membro desde {new Date(user.created).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          {avatarFile && (
            <p className="text-xs text-primary mt-2 font-medium">
              * Nova foto selecionada. Clique em &quot;Salvar Alterações&quot; abaixo para gravar.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEÇÃO 1: DADOS BÁSICOS & E-MAIL */}
        <div className="space-y-6">
          {/* Formulário de Nome e Foto */}
          <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="border-b border-[#2A2A2A] pb-3 mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-primary" /> Dados Pessoais
                </h3>
                <p className="text-xs text-[#8A8F98] mt-0.5">Edite seu nome de exibição no app.</p>
              </div>

              {profileSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/50 flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dados salvos com sucesso!</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
                  Nome Completo
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold h-11"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                    </>
                  ) : (
                    'Salvar Alterações do Perfil'
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Cartão de E-mail de Acesso */}
          <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-6 shadow-md">
            <div className="border-b border-[#2A2A2A] pb-3 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> E-mail de Login
              </h3>
              <p className="text-xs text-[#8A8F98] mt-0.5">
                Endereço de e-mail utilizado para autenticação no Studio Bru Oliveira.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#141414] border border-[#2E2E2E] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] uppercase font-bold text-[#8A8F98] block">
                    E-mail atual
                  </span>
                  <span className="text-sm font-semibold text-white truncate block">
                    {user?.email}
                  </span>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] shrink-0">
                  Verificado
                </Badge>
              </div>

              <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] flex items-start gap-2.5 text-xs text-[#8A8F98]">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Por motivos de segurança, ao alterar seu e-mail um link de confirmação será
                  enviado para o novo endereço informado.
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewEmail('')
                  setEmailSuccessSent(false)
                  setEmailModalOpen(true)
                }}
                className="w-full border-[#2E2E2E] bg-[#141414] hover:bg-[#2A2A2A] text-white h-11 font-medium"
              >
                <Mail className="w-4 h-4 mr-2 text-primary" />
                Alterar Endereço de E-mail
              </Button>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: SEGURANÇA & ALTERAÇÃO DE SENHA */}
        <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="border-b border-[#2A2A2A] pb-3 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" /> Segurança &amp; Senha
              </h3>
              <p className="text-xs text-[#8A8F98] mt-0.5">
                Altere sua senha de login informando sua senha atual para confirmação.
              </p>
            </div>

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/50 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sua senha foi alterada com sucesso!</span>
              </div>
            )}

            {/* Senha Atual */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Senha Atual *
              </label>
              <Input
                type="password"
                required
                placeholder="Digite sua senha atual"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
              />
              <p className="text-[11px] text-[#8A8F98]">
                Necessária para validar que você é o proprietário desta conta.
              </p>
            </div>

            {/* Nova Senha */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Nova Senha (mín. 8 caracteres) *
              </label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
              />
            </div>

            {/* Confirmar Nova Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Confirmar Nova Senha *
              </label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={changingPassword}
                className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold h-11"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Atualizando Senha...
                  </>
                ) : (
                  'Confirmar e Atualizar Senha'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL DE SOLICITAÇÃO DE ALTERAÇÃO DE E-MAIL */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
          {emailSuccessSent ? (
            <div className="py-4 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <DialogTitle className="text-lg font-bold text-white">
                E-mail de confirmação enviado!
              </DialogTitle>
              <p className="text-sm text-[#8A8F98]">
                Enviamos um link de confirmação para{' '}
                <strong className="text-white">{newEmail}</strong>. Abra sua caixa de entrada e
                clique no link para concluir a alteração.
              </p>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold"
                >
                  Entendi e Fechar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleRequestEmailChange}>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" /> Alterar E-mail da Conta
                </DialogTitle>
                <DialogDescription className="text-[#8A8F98] text-sm">
                  Informe o novo endereço de e-mail. Um e-mail de confirmação será enviado para este
                  endereço antes que a alteração seja concluída.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
                    Novo E-mail
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="novoemail@studiobru.com.br"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
                  />
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    Após confirmar o link que chegará no novo e-mail, você precisará fazer login
                    novamente com as novas credenciais.
                  </span>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmailModalOpen(false)}
                  disabled={sendingEmailChange}
                  className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={sendingEmailChange}
                  className="bg-primary hover:opacity-90 text-primary-foreground font-semibold"
                >
                  {sendingEmailChange ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
                    </>
                  ) : (
                    'Enviar Confirmação'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
