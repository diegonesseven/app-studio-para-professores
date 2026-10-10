import React, { useEffect, useState } from 'react'
import { teachersService, parseTeacherErrorMessage } from '@/services/teachers'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import type { User, UserRole } from '@/types'
import { validateEmail, sanitizeText } from '@/lib/validation'
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
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
import { toast } from '@/hooks/use-toast'

export default function TeachersPage() {
  const { user: currentUser } = useAuth()
  const [teachers, setTeachers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'professor' | 'admin'>('all')

  // Modal de Criação / Edição
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formOldPassword, setFormOldPassword] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formPasswordConfirm, setFormPasswordConfirm] = useState('')
  const [formRole, setFormRole] = useState<UserRole>('professor')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Modal de Redefinição Direta de Senha
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [teacherForReset, setTeacherForReset] = useState<User | null>(null)
  const [resetOldPassword, setResetOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)

  // Modal de Exclusão / Remoção de Acesso
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [teacherToDelete, setTeacherToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const data = await teachersService.getAll('all')
      setTeachers(data)
    } catch (err: unknown) {
      toast({
        title: 'Erro ao carregar professores',
        description: parseTeacherErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeachers()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingTeacher(null)
    setFormName('')
    setFormEmail('')
    setFormOldPassword('')
    setFormPassword('')
    setFormPasswordConfirm('')
    setFormRole('professor')
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenEditModal = (teacher: User) => {
    setEditingTeacher(teacher)
    setFormName(teacher.name || '')
    setFormEmail(teacher.email || '')
    setFormOldPassword('')
    setFormPassword('')
    setFormPasswordConfirm('')
    setFormRole((teacher.role as UserRole) || 'professor')
    setFormError(null)
    setModalOpen(true)
  }

  const handleSubmitTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const cleanName = sanitizeText(formName)
    if (!cleanName) {
      setFormError('Por favor, informe o nome completo do professor.')
      return
    }

    if (!validateEmail(formEmail, true)) {
      setFormError('Informe um e-mail válido (ex: professor@studiobru.com.br).')
      return
    }

    // Validação de senha na criação
    if (!editingTeacher) {
      if (!formPassword || formPassword.length < 8) {
        setFormError('A senha inicial deve ter no mínimo 8 caracteres.')
        return
      }
      if (formPassword !== formPasswordConfirm) {
        setFormError('A confirmação de senha não confere.')
        return
      }
    } else if (formPassword) {
      // Se estiver editando e digitou senha para trocar
      const isSelf = editingTeacher?.id === currentUser?.id
      if (isSelf && !formOldPassword) {
        setFormError('Informe sua senha atual para alterar a senha da sua conta.')
        return
      }
      if (formPassword.length < 8) {
        setFormError('A nova senha deve ter no mínimo 8 caracteres.')
        return
      }
      if (formPassword !== formPasswordConfirm) {
        setFormError('A confirmação de nova senha não confere.')
        return
      }
    }

    try {
      setSubmitting(true)
      if (editingTeacher) {
        const isSelf = editingTeacher.id === currentUser?.id
        await teachersService.update(editingTeacher.id, {
          name: cleanName,
          email: formEmail.trim(),
          role: formRole,
          password: formPassword || undefined,
          passwordConfirm: formPasswordConfirm || undefined,
          oldPassword: isSelf && formPassword ? formOldPassword : undefined,
        })

        // Se alterou a própria senha com sucesso, atualiza a sessão
        if (isSelf && formPassword) {
          try {
            await pb.collection('users').authRefresh()
          } catch {
            try {
              await pb
                .collection('users')
                .authWithPassword(formEmail.trim().toLowerCase(), formPassword)
            } catch (reauthErr) {
              console.warn('Falha no refresh/reautenticação após troca de senha:', reauthErr)
            }
          }
        }

        toast({
          title: 'Professor atualizado',
          description: `Os dados de ${cleanName} foram atualizados com sucesso.`,
        })
      } else {
        await teachersService.create({
          name: cleanName,
          email: formEmail.trim(),
          password: formPassword,
          passwordConfirm: formPasswordConfirm,
          role: formRole,
        })
        toast({
          title: 'Professor cadastrado com sucesso! 🎉',
          description: `Login criado para ${cleanName}. O professor já pode entrar no app.`,
        })
      }
      setModalOpen(false)
      loadTeachers()
    } catch (err: unknown) {
      const msg = parseTeacherErrorMessage(err)
      setFormError(msg)
      toast({
        title: 'Erro ao salvar',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Redefinição de senha rápida
  const handleOpenResetModal = (teacher: User) => {
    setTeacherForReset(teacher)
    setResetOldPassword('')
    setNewPassword('')
    setNewPasswordConfirm('')
    setResetError(null)
    setResetModalOpen(true)
  }

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacherForReset) return
    setResetError(null)

    const isSelf = teacherForReset.id === currentUser?.id
    if (isSelf && !resetOldPassword) {
      setResetError('Informe sua senha atual para alterar a senha da sua conta.')
      return
    }

    if (!newPassword || newPassword.length < 8) {
      setResetError('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (newPassword !== newPasswordConfirm) {
      setResetError('As senhas não coincidem.')
      return
    }

    try {
      setResettingPassword(true)
      await teachersService.update(teacherForReset.id, {
        password: newPassword,
        passwordConfirm: newPasswordConfirm,
        oldPassword: isSelf ? resetOldPassword : undefined,
      })

      // Se alterou a própria senha, atualiza sessão
      if (isSelf) {
        try {
          await pb.collection('users').authRefresh()
        } catch {
          try {
            await pb
              .collection('users')
              .authWithPassword(teacherForReset.email.trim().toLowerCase(), newPassword)
          } catch (reauthErr) {
            console.warn('Falha no refresh/reautenticação após troca de senha:', reauthErr)
          }
        }
      }

      toast({
        title: 'Senha redefinida com sucesso!',
        description: `A nova senha de ${teacherForReset.name || teacherForReset.email} já está ativa.`,
      })
      setResetModalOpen(false)
    } catch (err: unknown) {
      const msg = parseTeacherErrorMessage(err)
      setResetError(msg)
      toast({
        title: 'Erro ao redefinir senha',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setResettingPassword(false)
    }
  }

  // Exclusão / Desativação
  const handleOpenDeleteModal = (teacher: User) => {
    if (teacher.id === currentUser?.id) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode excluir sua própria conta de administrador.',
        variant: 'destructive',
      })
      return
    }
    setTeacherToDelete(teacher)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!teacherToDelete) return
    try {
      setDeleting(true)
      await teachersService.delete(teacherToDelete.id)
      toast({
        title: 'Acesso removido',
        description: `O professor ${teacherToDelete.name || teacherToDelete.email} foi removido com sucesso.`,
      })
      setDeleteModalOpen(false)
      loadTeachers()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao remover professor',
        description: parseTeacherErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  // Filtragem
  const filteredTeachers = teachers.filter((t) => {
    if (roleFilter !== 'all') {
      const tRole = t.role || 'professor'
      if (tRole !== roleFilter) return false
    }
    if (!search.trim()) return true
    const term = search.toLowerCase()
    const nameMatch = (t.name || '').toLowerCase().includes(term)
    const emailMatch = (t.email || '').toLowerCase().includes(term)
    return nameMatch || emailMatch
  })

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-primary" /> Gestão de Professores
          </h1>
          <p className="text-sm text-[#8A8F98] mt-1">
            Cadastre os professores que utilizarão o app e crie o login de acesso de cada um
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="bg-primary hover:opacity-90 text-primary-foreground font-semibold h-11 px-5 shadow-md flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Cadastrar Novo Professor
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Input
            placeholder="Pesquisar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#1E1E1E] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 pl-11 pr-4 focus-visible:ring-primary"
          />
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'professor' | 'admin')}
            className="w-full h-12 bg-[#1E1E1E] border border-[#2E2E2E] text-white rounded-md px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos os papéis ({teachers.length})</option>
            <option value="professor">Apenas Professores</option>
            <option value="admin">Apenas Administradores</option>
          </select>
        </div>
      </div>

      {/* Conteúdo / Cards de Professores */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#8A8F98] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Carregando lista de professores...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2A2A2A] flex items-center justify-center text-[#8A8F98] mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Nenhum professor encontrado</h3>
          <p className="text-sm text-[#8A8F98] max-w-sm mb-6">
            Não há professores cadastrados com os filtros informados.
          </p>
          <Button
            onClick={handleOpenCreateModal}
            className="bg-primary hover:opacity-90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Cadastrar Professor Agora
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => {
            const isSelf = teacher.id === currentUser?.id
            const initials = (teacher.name || teacher.email || 'P')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0].toUpperCase())
              .join('')

            const isAdm = teacher.role === 'admin'

            return (
              <div
                key={teacher.id}
                className="bg-[#1E1E1E] border border-[#2E2E2E] hover:border-primary/40 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl flex flex-col justify-between group"
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#2A2A2A] to-[#3A3A3A] border-2 border-primary/30 text-primary font-black text-sm flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors truncate">
                            {teacher.name || 'Sem nome'}
                          </h3>
                          {isSelf && (
                            <span className="text-[10px] font-bold bg-white/10 text-white/80 px-1.5 py-0.5 rounded">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#8A8F98] truncate mt-0.5">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                      </div>
                    </div>

                    <Badge
                      className={`text-xs px-2.5 py-0.5 font-bold shrink-0 ${
                        isAdm
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isAdm ? (
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Professor
                        </span>
                      )}
                    </Badge>
                  </div>

                  {/* Detalhes de status */}
                  <div className="mt-3 pt-3 border-t border-[#262626] text-xs space-y-1 text-[#8A8F98]">
                    <div className="flex items-center justify-between">
                      <span>Status de acesso:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ativo
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cadastrado em:</span>
                      <span className="text-white font-medium">
                        {teacher.created
                          ? new Date(teacher.created).toLocaleDateString('pt-BR')
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações inferiores */}
                <div className="pt-3.5 mt-3 border-t border-[#2A2A2A] flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenResetModal(teacher)}
                    className="border-[#2E2E2E] bg-[#141414] hover:bg-[#2A2A2A] text-white text-xs h-9 px-3 flex items-center gap-1.5"
                    title="Redefinir Senha do Professor"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    <span>Redefinir Senha</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(teacher)}
                      className="p-2 rounded-lg text-[#8A8F98] hover:text-white hover:bg-[#2A2A2A] transition-colors"
                      title="Editar dados"
                      aria-label={`Editar ${teacher.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(teacher)}
                      disabled={isSelf}
                      className={`p-2 rounded-lg transition-colors ${
                        isSelf
                          ? 'opacity-30 cursor-not-allowed text-[#666666]'
                          : 'text-[#8A8F98] hover:text-red-400 hover:bg-[#2A2A2A]'
                      }`}
                      title={
                        isSelf
                          ? 'Você não pode remover seu próprio acesso'
                          : 'Remover acesso deste professor'
                      }
                      aria-label={`Remover ${teacher.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-lg">
          <form onSubmit={handleSubmitTeacher}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                {editingTeacher ? 'Editar Professor' : 'Cadastrar Novo Professor'}
              </DialogTitle>
              <DialogDescription className="text-[#8A8F98] text-sm">
                {editingTeacher
                  ? 'Atualize os dados cadastrais e as credenciais de acesso.'
                  : 'Preencha o formulário para criar uma conta e o login do professor no Studio.'}
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-800/60 flex items-start gap-2 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4 py-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" /> Nome Completo *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
                />
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> E-mail de Login *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="professor@studiobru.com.br"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
                />
              </div>

              {/* Papel */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Tipo de Acesso
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole('professor')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formRole === 'professor'
                        ? 'bg-primary/15 border-primary text-white font-bold ring-1 ring-primary'
                        : 'bg-[#141414] border-[#2E2E2E] text-[#8A8F98] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold">Professor</span>
                    </div>
                    <p className="text-[11px] text-[#8A8F98] mt-1">
                      Acesso aos treinos, alunos e acervo de vídeos.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('admin')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formRole === 'admin'
                        ? 'bg-amber-500/15 border-amber-500 text-white font-bold ring-1 ring-amber-500'
                        : 'bg-[#141414] border-[#2E2E2E] text-[#8A8F98] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold">Administrador</span>
                    </div>
                    <p className="text-[11px] text-[#8A8F98] mt-1">
                      Acesso total, gerencia professores e aparência.
                    </p>
                  </button>
                </div>
              </div>

              {/* Senha e Confirmação */}
              <div className="space-y-3 pt-2 border-t border-[#282828]">
                {/* Campo de Senha Atual exibido apenas ao editar o PRÓPRIO usuário logado */}
                {editingTeacher && editingTeacher.id === currentUser?.id && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" /> Senha Atual (obrigatória para alterar sua
                      senha)
                    </label>
                    <Input
                      type="password"
                      placeholder="Digite sua senha atual"
                      value={formOldPassword}
                      onChange={(e) => setFormOldPassword(e.target.value)}
                      className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    {editingTeacher
                      ? 'Nova Senha (deixe em branco para manter a atual)'
                      : 'Senha de Acesso (Mín. 8 caracteres) *'}
                  </label>
                  <Input
                    type="password"
                    required={!editingTeacher}
                    placeholder="••••••••"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
                  />
                </div>

                {(!editingTeacher || formPassword) && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Confirmar Senha *
                    </label>
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={formPasswordConfirm}
                      onChange={(e) => setFormPasswordConfirm(e.target.value)}
                      className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                  </>
                ) : editingTeacher ? (
                  'Salvar Alterações'
                ) : (
                  'Cadastrar Professor'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE REDEFINIÇÃO DE SENHA RÁPIDA */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
          <form onSubmit={handleConfirmResetPassword}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" /> Redefinir Senha de Acesso
              </DialogTitle>
              <DialogDescription className="text-[#8A8F98] text-sm">
                Defina uma nova senha para o professor{' '}
                <strong className="text-white">
                  {teacherForReset?.name || teacherForReset?.email}
                </strong>
                .
              </DialogDescription>
            </DialogHeader>

            {resetError && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-800/60 flex items-start gap-2 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            <div className="space-y-3 py-4">
              {teacherForReset && teacherForReset.id === currentUser?.id && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> Senha Atual *
                  </label>
                  <Input
                    type="password"
                    required
                    placeholder="Digite sua senha atual"
                    value={resetOldPassword}
                    onChange={(e) => setResetOldPassword(e.target.value)}
                    className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Nova Senha (mín. 8 caracteres) *
                </label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Confirmar Nova Senha *
                </label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className="bg-[#141414] border-[#2E2E2E] text-white h-11 focus-visible:ring-primary"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetModalOpen(false)}
                disabled={resettingPassword}
                className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={resettingPassword}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold"
              >
                {resettingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Atualizando...
                  </>
                ) : (
                  'Salvar Nova Senha'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" /> Remover Acesso do Professor
            </DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              Tem certeza que deseja remover o acesso de{' '}
              <strong className="text-white">
                {teacherToDelete?.name || teacherToDelete?.email}
              </strong>
              ? Esse professor não conseguirá mais entrar no aplicativo.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Removendo...
                </>
              ) : (
                'Confirmar e Remover'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
