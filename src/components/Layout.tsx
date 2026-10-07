import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dumbbell,
  Home,
  Users,
  Video,
  ClipboardList,
  History,
  LogOut,
  Menu,
  X,
  PlaySquare,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function Layout() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Tela de Treino', path: '/treino', icon: PlaySquare, highlight: true },
    { name: 'Alunos', path: '/alunos', icon: Users },
    { name: 'Fichas de Treino', path: '/treinos', icon: ClipboardList },
    { name: 'Acervo de Vídeos', path: '/acervo', icon: Video },
    { name: 'Histórico', path: '/historico', icon: History },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userInitials = (user?.name || user?.email || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

  return (
    <div className="flex h-screen bg-[#121212] text-white overflow-hidden">
      {/* SIDEBAR TABLET/DESKTOP (>= 1024px) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#171717] border-r border-[#2A2A2A] z-20 shrink-0">
        {/* Header / Brand */}
        <div className="p-5 border-b border-[#2A2A2A] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F06A2A] to-[#FF8A4C] flex items-center justify-center shadow-md shadow-[#F06A2A]/20 shrink-0">
            <Dumbbell className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base tracking-tight text-white leading-tight truncate">
              Studio Bru Oliveira
            </span>
            <span className="text-[11px] text-[#8A8F98] tracking-wider uppercase font-medium">
              Personal & Studio
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-[#F06A2A] text-white shadow-md shadow-[#F06A2A]/25'
                    : item.highlight
                      ? 'text-[#F06A2A] bg-[#F06A2A]/10 hover:bg-[#F06A2A]/20'
                      : 'text-[#8A8F98] hover:text-white hover:bg-[#1E1E1E]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive
                      ? 'text-white'
                      : item.highlight
                        ? 'text-[#F06A2A]'
                        : 'text-[#8A8F98] group-hover:text-white'
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto text-[10px] font-semibold bg-[#F06A2A]/20 text-[#F06A2A] px-2 py-0.5 rounded-full">
                    Ao vivo
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer / User info */}
        <div className="p-3 border-t border-[#2A2A2A] bg-[#141414]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A]">
            <div className="w-9 h-9 rounded-full bg-[#2A2A2A] border border-[#F06A2A]/40 flex items-center justify-center text-xs font-bold text-[#F06A2A] shrink-0">
              {userInitials || 'P'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-white truncate">
                {user?.name || user?.email || 'Professor'}
              </span>
              <span className="text-[10px] text-[#8A8F98] flex items-center gap-1">
                {role === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-[#F06A2A]" /> Administrador
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3 h-3 text-emerald-400" /> Professor
                  </>
                )}
              </span>
            </div>
            <button
              onClick={() => setLogoutDialogOpen(true)}
              className="p-1.5 rounded-lg text-[#8A8F98] hover:text-red-400 hover:bg-[#2A2A2A] transition-colors"
              title="Sair"
              aria-label="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* TOPBAR MOBILE (< 1024px) */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#171717] border-b border-[#2A2A2A] z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#F06A2A] to-[#FF8A4C] flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">Studio Bru Oliveira</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-white hover:bg-[#2A2A2A] active:bg-[#333333]"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* DRAWER MOBILE */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative ml-auto w-4/5 max-w-xs bg-[#171717] border-l border-[#2A2A2A] h-full flex flex-col p-5 shadow-2xl animate-fade-in-up">
              <div className="flex items-center justify-between pb-4 border-b border-[#2A2A2A]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F06A2A] flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-sm">Menu</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[#8A8F98] hover:text-white"
                  aria-label="Fechar menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="py-4 border-b border-[#2A2A2A] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2A2A2A] border border-[#F06A2A] flex items-center justify-center text-sm font-bold text-[#F06A2A]">
                  {userInitials || 'P'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">
                    {user?.name || user?.email || 'Professor'}
                  </span>
                  <span className="text-xs text-[#8A8F98]">
                    {role === 'admin' ? 'Administrador' : 'Professor'}
                  </span>
                </div>
              </div>

              <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path)

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#F06A2A] text-white shadow-md'
                          : 'text-[#8A8F98] hover:text-white hover:bg-[#1E1E1E]'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  )
                })}
              </nav>

              <div className="pt-4 border-t border-[#2A2A2A]">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setLogoutDialogOpen(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 h-11 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40"
                >
                  <LogOut className="w-4 h-4" /> Sair da conta
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CONTEÚDO PRINCIPAL (scroll independente) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-[#121212]">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE LOGOUT */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              Deseja realmente sair?
            </DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              Sua sessão atual será encerrada. Você precisará digitar seu e-mail e senha novamente
              para acessar o Studio Bru Oliveira.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmar e Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
