import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { InstallPromptBanner } from '@/components/InstallPromptBanner'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { STUDIO_LOGO_SRC } from '@/assets/logo'
import {
  Dumbbell,
  Home,
  Users,
  Video,
  ClipboardList,
  History,
  Palette,
  LogOut,
  Menu,
  X,
  PlaySquare,
  ShieldCheck,
  UserCheck,
  GraduationCap,
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
  const { user, role, isAdmin, logout } = useAuth()
  const { appearance } = useTheme()
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
    ...(isAdmin
      ? [
          { name: 'Professores', path: '/professores', icon: GraduationCap, adminOnly: true },
          { name: 'Aparência & Logo', path: '/aparencia', icon: Palette, adminOnly: true },
        ]
      : []),
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
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* SIDEBAR TABLET/DESKTOP (>= 1024px) */}
      <aside className="hidden lg:flex flex-col w-64 bg-card/60 backdrop-blur-md border-r border-border z-20 shrink-0">
        {/* Header / Brand */}
        <div className="p-4 border-b border-[#2A2A2A] flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white border border-white/20 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-sm">
            <img
              src={appearance.logo_url || STUDIO_LOGO_SRC}
              alt={appearance.studio_name || 'Studio Bru Oliveira'}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="font-bold text-sm sm:text-base tracking-tight text-white leading-tight truncate"
              title={appearance.studio_name || 'Studio Bru Oliveira'}
            >
              {appearance.studio_name || 'Studio Bru Oliveira'}
            </span>
            <span className="text-[11px] text-secondary font-semibold tracking-wider uppercase">
              Personal &amp; Pilates
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
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group relative ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : item.highlight
                      ? 'text-primary bg-primary/10 hover:bg-primary/20'
                      : 'text-[#8A8F98] hover:text-white hover:bg-[#1E1E1E]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive
                      ? 'text-current'
                      : item.highlight
                        ? 'text-primary'
                        : 'text-[#8A8F98] group-hover:text-white'
                  }`}
                />
                <span className="truncate">{item.name}</span>
                {item.highlight && !isActive && (
                  <span className="ml-auto text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    Ao vivo
                  </span>
                )}
                {item.adminOnly && !isActive && (
                  <span className="ml-auto text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer / User info */}
        <div className="p-3 border-t border-[#2A2A2A] bg-[#141414]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A]">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-secondary shrink-0">
              {userInitials || 'P'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-white truncate">
                {user?.name || user?.email || 'Professor'}
              </span>
              <span className="text-[10px] text-[#8A8F98] flex items-center gap-1">
                {role === 'admin' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-secondary" /> Administrador
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
        <InstallPromptBanner />
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border z-20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-white border border-white/20 flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-sm">
              <img
                src={appearance.logo_url || STUDIO_LOGO_SRC}
                alt={appearance.studio_name || 'Logo'}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white truncate leading-tight">
                {appearance.studio_name || 'Studio Bru Oliveira'}
              </span>
              <span className="text-[10px] text-secondary font-medium tracking-wider uppercase leading-none">
                Personal &amp; Pilates
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-white hover:bg-[#2A2A2A] active:bg-[#333333] shrink-0"
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
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center p-1 shrink-0 overflow-hidden">
                    <img
                      src={appearance.logo_url || STUDIO_LOGO_SRC}
                      alt="Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <span className="font-bold text-sm truncate text-white">
                    {appearance.studio_name || 'Studio Bru Oliveira'}
                  </span>
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
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-sm font-bold text-secondary">
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
                          ? 'bg-primary text-primary-foreground shadow-md'
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
        <main
          className={`flex-1 bg-background ${
            location.pathname.startsWith('/treino')
              ? 'p-2 sm:p-2.5 lg:p-3 flex flex-col overflow-hidden'
              : 'p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden'
          }`}
        >
          <div
            className={`mx-auto w-full ${
              location.pathname.startsWith('/treino')
                ? 'max-w-[1800px] flex-1 flex flex-col min-h-0 h-full overflow-hidden'
                : 'max-w-7xl'
            }`}
          >
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
