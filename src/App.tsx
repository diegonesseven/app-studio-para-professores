/* Main App Component - Handles routing (using react-router-dom), auth provider, toast notifications */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Layout from './components/Layout'

// Páginas Públicas / Auth
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import ConfirmEmailChange from './pages/ConfirmEmailChange'

// Páginas Autenticadas
import Index from './pages/Index'
import StudentList from './pages/StudentList'
import StudentForm from './pages/StudentForm'
import ExerciseList from './pages/ExerciseList'
import ExerciseForm from './pages/ExerciseForm'
import SheetList from './pages/SheetList'
import SheetForm from './pages/SheetForm'
import Training from './pages/Training'
import HistoryPage from './pages/HistoryPage'
import Appearance from './pages/Appearance'
import TeachersPage from './pages/TeachersPage'
import NotFound from './pages/NotFound'

/**
 * Guarda de rota autenticada com suporte opcional a restrição de role (ex.: admin).
 */
function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode
  adminOnly?: boolean
}) {
  const { user, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-[#8A8F98] text-sm">
        Carregando Studio Bru Oliveira...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Rotas Públicas de Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/confirm-email-change" element={<ConfirmEmailChange />} />

            {/* Rotas Autenticadas protegidas pelo Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />

              {/* Gestão de Alunos */}
              <Route path="/alunos" element={<StudentList />} />
              <Route path="/alunos/novo" element={<StudentForm />} />
              <Route path="/alunos/:id/editar" element={<StudentForm />} />

              {/* Acervo de Exercícios */}
              <Route path="/acervo" element={<ExerciseList />} />
              <Route path="/acervo/novo" element={<ExerciseForm />} />
              <Route path="/acervo/:id/editar" element={<ExerciseForm />} />

              {/* Fichas de Treino */}
              <Route path="/treinos" element={<SheetList />} />
              <Route path="/fichas/nova" element={<SheetForm />} />
              <Route path="/fichas/:id/editar" element={<SheetForm />} />

              {/* Tela Principal de Treino (Condução ao vivo) */}
              <Route path="/treino" element={<Training />} />

              {/* Histórico de Treinos */}
              <Route path="/historico" element={<HistoryPage />} />

              {/* Gestão de Professores (Exclusivo Admin) */}
              <Route
                path="/professores"
                element={
                  <ProtectedRoute adminOnly>
                    <TeachersPage />
                  </ProtectedRoute>
                }
              />

              {/* Personalização de Aparência e Cores (Admin) */}
              <Route
                path="/aparencia"
                element={
                  <ProtectedRoute adminOnly>
                    <Appearance />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
