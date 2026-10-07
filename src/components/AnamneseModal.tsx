import React from 'react'
import {
  X,
  HeartPulse,
  AlertTriangle,
  Scissors,
  ShieldAlert,
  Target,
  Sparkles,
  FileText,
  Calendar,
  Phone,
  User,
} from 'lucide-react'
import type { Student } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AnamneseModalProps {
  isOpen: boolean
  onClose: () => void
  student: Student | null
}

export default function AnamneseModal({ isOpen, onClose, student }: AnamneseModalProps) {
  if (!isOpen || !student) return null

  // Calcular idade
  let age: number | null = null
  if (student.birthdate) {
    const bDate = new Date(student.birthdate)
    const diff = Date.now() - bDate.getTime()
    age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  const hasAnamneseData = Boolean(
    student.health_history ||
    student.injuries ||
    student.surgeries ||
    student.restrictions ||
    (student.goals && student.goals.length > 0) ||
    student.experience_level ||
    student.teacher_observations,
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E2E2E] bg-[#171717]">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">
                Saúde & Anamnese
              </span>              <h3 className="text-lg font-bold text-white truncate">{student.name}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#8A8F98] hover:text-white hover:bg-[#2A2A2A] transition-colors"
            aria-label="Fechar anamnese"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Informações básicas do aluno */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A]">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#8A8F98]" />
              <div className="text-xs">
                <span className="text-[#8A8F98] block">Idade</span>
                <span className="text-white font-medium">
                  {age !== null ? `${age} anos` : 'Não informada'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#8A8F98]" />
              <div className="text-xs">
                <span className="text-[#8A8F98] block">Contato</span>
                <span className="text-white font-medium">{student.phone || 'Não informado'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <div className="text-xs">
                <span className="text-[#8A8F98] block">Nível de Experiência</span>
                <span className="text-white font-medium">
                  {student.experience_level || 'Iniciante'}
                </span>
              </div>
            </div>
          </div>

          {/* Objetivos */}
          {student.goals && student.goals.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8A8F98] uppercase tracking-wider">
                <Target className="w-3.5 h-3.5 text-primary" /> Objetivos do Aluno
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {student.goals.map((g) => (
                  <Badge
                    key={g}
                    className="bg-primary/20 text-primary border border-primary/40 text-xs px-2.5 py-0.5 font-medium"
                  >                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Destaque de Restrições (Crítico para a condução do treino) */}
          {student.restrictions ? (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/40 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                <ShieldAlert className="w-4 h-4" /> Restrições Médicas / Cuidados em Aula
              </div>
              <p className="text-sm text-amber-100 font-medium">{student.restrictions}</p>
            </div>
          ) : null}

          {/* Lesões Anteriores */}
          {student.injuries && (
            <div className="space-y-1 p-3 rounded-xl bg-[#141414] border border-[#2A2A2A]">
              <div className="flex items-center gap-2 text-xs text-[#8A8F98] font-semibold uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Lesões Anteriores
              </div>
              <p className="text-sm text-white">{student.injuries}</p>
            </div>
          )}

          {/* Cirurgias */}
          {student.surgeries && (
            <div className="space-y-1 p-3 rounded-xl bg-[#141414] border border-[#2A2A2A]">
              <div className="flex items-center gap-2 text-xs text-[#8A8F98] font-semibold uppercase">
                <Scissors className="w-3.5 h-3.5 text-purple-400" /> Cirurgias Realizadas
              </div>
              <p className="text-sm text-white">{student.surgeries}</p>
            </div>
          )}

          {/* Histórico de Saúde */}
          {student.health_history && (
            <div className="space-y-1 p-3 rounded-xl bg-[#141414] border border-[#2A2A2A]">
              <div className="flex items-center gap-2 text-xs text-[#8A8F98] font-semibold uppercase">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> Histórico Clínico Geral
              </div>
              <p className="text-sm text-white">{student.health_history}</p>
            </div>
          )}

          {/* Observações do Professor */}
          {student.teacher_observations && (
            <div className="space-y-1 p-3 rounded-xl bg-[#141414] border border-[#2A2A2A]">
              <div className="flex items-center gap-2 text-xs text-[#8A8F98] font-semibold uppercase">
                <FileText className="w-3.5 h-3.5 text-primary" /> Parecer do Professor
              </div>
              <p className="text-sm text-white">{student.teacher_observations}</p>
            </div>
          )}

          {/* Observações Gerais */}
          {student.general_observations && (
            <div className="space-y-1 p-3 rounded-xl bg-[#141414] border border-[#2A2A2A]">
              <div className="flex items-center gap-2 text-xs text-[#8A8F98] font-semibold uppercase">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> Observações Gerais / Rotina
              </div>
              <p className="text-sm text-white">{student.general_observations}</p>
            </div>
          )}

          {!hasAnamneseData && (
            <div className="py-8 text-center text-[#8A8F98] space-y-1">
              <HeartPulse className="w-8 h-8 opacity-40 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">Anamnese não preenchida</p>
              <p className="text-xs">
                O aluno pode treinar normalmente, mas você pode editar o cadastro a qualquer momento
                para enriquecer o histórico.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#171717] border-t border-[#2E2E2E] flex justify-end">
          <Button
            onClick={onClose}
            className="bg-primary hover:opacity-90 text-primary-foreground text-xs h-9 px-4"
          >
            Entendido, Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
