import React, { useState } from 'react'
import {
  X,
  HeartPulse,
  ShieldAlert,
  Calendar,
  Phone,
  User,
  Camera,
  Maximize2,
  Briefcase,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import type { Student } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { studentsService } from '@/services/students'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'

interface AnamneseModalProps {
  isOpen: boolean
  onClose: () => void
  student: Student | null
}

export { AnamneseModal }

export default function AnamneseModal({ isOpen, onClose, student }: AnamneseModalProps) {
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null)

  if (!isOpen || !student) return null

  // Calcular idade
  let age: number | null = null
  if (student.birthdate) {
    const bDate = new Date(student.birthdate)
    const diff = Date.now() - bDate.getTime()
    age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  const an = student.anamnesis_data || {}
  const photos = student.anamnesis_photos || []

  const hasAnamneseData = Boolean(
    student.restrictions ||
    student.injuries ||
    student.health_history ||
    student.surgeries ||
    (photos && photos.length > 0) ||
    (student.goals && student.goals.length > 0) ||
    student.anamnesis_data,
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/60">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">
                Saúde & Anamnese
              </span>{' '}
              <h3 className="text-lg font-bold text-white truncate">{student.name}</h3>
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
              <Briefcase className="w-4 h-4 text-primary" />
              <div className="text-xs">
                <span className="text-[#8A8F98] block">Profissão</span>
                <span className="text-white font-medium">{an.profissao || 'Não informada'}</span>
              </div>
            </div>
          </div>

          {/* Destaque de Restrições Médicas / Cuidados em aula (permanece exatamente com esse rótulo) */}
          {student.restrictions && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/40 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs tracking-wider uppercase">
                <ShieldAlert className="w-4 h-4" /> Restrições médicas / Cuidado em aula
              </div>
              <p className="text-sm text-amber-100 font-medium">{student.restrictions}</p>
            </div>
          )}

          {/* Fotos da Anamnese (Item 5) */}
          {photos.length > 0 && (
            <div className="space-y-2 p-3.5 rounded-xl bg-[#141414] border border-[#2A2A2A]">
              <div className="flex items-center gap-2 text-xs text-[#8A8F98] font-bold uppercase">
                <Camera className="w-3.5 h-3.5 text-primary" /> Fotos na Anamnese ({photos.length})
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                {photos.map((pName) => {
                  const url = studentsService.getAnamnesisPhotoUrl(student, pName)
                  return (
                    <div
                      key={pName}
                      className="relative group rounded-lg overflow-hidden border border-[#2A2A2A] bg-black aspect-square cursor-pointer"
                      onClick={() => setEnlargedPhoto(url)}
                    >
                      <img
                        src={url}
                        alt="Foto anamnese"
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Maximize2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Questionário de Anamnese no Modelo Exato (Item 6) */}
          <div className="space-y-3">
            {/* 1. Já treinou com Personal antes? */}
            {an.treinou_personal_antes && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="text-[#8A8F98] font-bold block mb-1 uppercase tracking-wider">
                  Já treinou com Personal antes?
                </span>
                <p className="text-white text-sm">{an.treinou_personal_antes}</p>
              </div>
            )}

            {/* 2. Objetivos */}
            {((an.objetivos && an.objetivos.length > 0) ||
              (student.goals && student.goals.length > 0)) && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs space-y-1.5">
                <span className="text-[#8A8F98] font-bold block uppercase tracking-wider">
                  Objetivo:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(an.objetivos || (student.goals as string[]) || []).map((obj) => (
                    <Badge
                      key={obj}
                      className="bg-primary/20 text-primary border border-primary/40 text-xs px-2.5 py-0.5 font-medium"
                    >
                      (x) {obj}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Você deseja dar ênfase em alguma musculatura? Qual? */}
            {an.enfase_musculatura && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="text-[#8A8F98] font-bold block mb-1 uppercase tracking-wider">
                  Você deseja dar ênfase em alguma musculatura? Qual?
                </span>
                <p className="text-white text-sm">{an.enfase_musculatura}</p>
              </div>
            )}

            {/* 4. Já praticou algum exercício físico? */}
            {an.praticou_exercicio && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="text-[#8A8F98] font-bold block mb-1 uppercase tracking-wider">
                  Já praticou algum exercício físico?
                </span>
                <p className="text-white text-sm">
                  ({an.praticou_exercicio === 'SIM' ? 'x' : ' '}) SIM{' '}
                  {an.praticou_exercicio === 'SIM' && an.praticou_exercicio_quais
                    ? `— Quais: ${an.praticou_exercicio_quais}`
                    : ''}
                  {an.praticou_exercicio === 'NAO' ? ' (x) NÃO' : ''}
                </p>
              </div>
            )}

            {/* 5. Há quanto tempo não pratica um exercício físico? */}
            {an.tempo_sem_praticar && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="text-[#8A8F98] font-bold block mb-1 uppercase tracking-wider">
                  Há quanto tempo não pratica um exercício físico?
                </span>
                <p className="text-white text-sm">{an.tempo_sem_praticar}</p>
              </div>
            )}

            {/* 6. Possui alguma restrição à exercício físico? */}
            {an.restricao_exercicio && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="text-[#8A8F98] font-bold block mb-1 uppercase tracking-wider">
                  Possui alguma restrição à exercício físico?
                </span>
                <p className="text-white text-sm">
                  ({an.restricao_exercicio === 'SIM' ? 'x' : ' '}) SIM{' '}
                  {an.restricao_exercicio === 'SIM' && an.restricao_exercicio_quais
                    ? `— Quais: ${an.restricao_exercicio_quais}`
                    : ''}
                  {an.restricao_exercicio === 'NAO' ? ' (x) NÃO' : ''}
                </p>
              </div>
            )}

            {/* 7. Possui alguma doença? */}
            {an.possui_doenca && an.possui_doenca.length > 0 && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs space-y-1.5">
                <span className="text-[#8A8F98] font-bold block uppercase tracking-wider">
                  Possui alguma doença?
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {an.possui_doenca.map((d) => (
                    <Badge
                      key={d}
                      className="bg-red-500/15 text-red-300 border border-red-500/30 text-xs px-2.5 py-0.5 font-medium"
                    >
                      (x) {d}
                    </Badge>
                  ))}
                </div>
                {an.possui_doenca_outros && (
                  <p className="text-xs text-[#9CA5B8] pt-1">
                    Outros: <span className="text-white">{an.possui_doenca_outros}</span>
                  </p>
                )}
              </div>
            )}

            {/* 8. Possui alguma lesão? (ou legacy injuries) */}
            {(an.possui_lesao || student.injuries) && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="text-[#8A8F98] font-bold block mb-1 uppercase tracking-wider">
                  Possui alguma lesão?
                </span>
                <p className="text-white text-sm">{an.possui_lesao || student.injuries}</p>
              </div>
            )}

            {/* 9. Dores em alguma parte do corpo? */}
            {an.dores_corpo && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="text-[#8A8F98] font-bold block mb-1 uppercase tracking-wider">
                  Dores em alguma parte do corpo?
                </span>
                <p className="text-white text-sm">
                  ({an.dores_corpo === 'SIM' ? 'x' : ' '}) SIM{' '}
                  {an.dores_corpo === 'SIM' && an.dores_corpo_quais
                    ? `— Quais: ${an.dores_corpo_quais}`
                    : ''}
                  {an.dores_corpo === 'NAO' ? ' (x) NÃO' : ''}
                </p>
              </div>
            )}

            {/* 10. Faz dieta? */}
            {an.faz_dieta && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="text-[#8A8F98] font-bold block mb-1 uppercase tracking-wider">
                  Faz dieta?
                </span>
                <p className="text-white text-sm">
                  {an.faz_dieta === 'SIM' ? '(x) SIM  ( ) NÃO' : '( ) SIM  (x) NÃO'}
                </p>
              </div>
            )}

            {/* 11. Faz acompanhamento com nutricionista? */}
            {an.faz_nutricionista && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="text-[#8A8F98] font-bold block mb-1 uppercase tracking-wider">
                  Faz acompanhamento com nutricionista?
                </span>
                <p className="text-white text-sm">
                  {an.faz_nutricionista === 'SIM' ? '(x) SIM  ( ) NÃO' : '( ) SIM  (x) NÃO'}
                </p>
              </div>
            )}

            {/* 12. Faz uso de Álcool / Tabaco */}
            {an.uso_substancias && an.uso_substancias.length > 0 && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs space-y-1.5">
                <span className="text-[#8A8F98] font-bold block uppercase tracking-wider">
                  Faz uso de:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {an.uso_substancias.map((sub) => (
                    <Badge
                      key={sub}
                      className="bg-[#2A2A2A] text-white border border-[#3A3A3A] text-xs px-2.5 py-0.5 font-medium"
                    >
                      (x) {sub}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Campos legados adicionais preservados (histórico clínico geral, cirurgias) */}
            {student.health_history && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="text-[#8A8F98] font-bold block mb-1 uppercase tracking-wider">
                  Histórico Clínico Adicional
                </span>
                <p className="text-white text-sm">{student.health_history}</p>
              </div>
            )}

            {student.surgeries && (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs">
                <span className="text-[#8A8F98] font-bold block mb-1 uppercase tracking-wider">
                  Cirurgias Realizadas
                </span>
                <p className="text-white text-sm">{student.surgeries}</p>
              </div>
            )}
          </div>

          {!hasAnamneseData && (
            <div className="py-8 text-center text-[#8A8F98] space-y-1">
              <HeartPulse className="w-8 h-8 opacity-40 mx-auto mb-2" />
              <p className="text-sm font-medium text-white">Anamnese não preenchida</p>
              <p className="text-xs">
                O aluno pode treinar normalmente, mas você pode editar o cadastro a qualquer momento
                para registrar a anamnese.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-card/60 border-t border-border flex items-center justify-between gap-2">
          {student?.id ? (
            <Link to={`/alunos/${student.id}/editar`} onClick={onClose}>
              <Button
                type="button"
                variant="outline"
                className="border-primary/40 bg-primary/10 hover:bg-primary/20 text-white text-xs h-9 px-3 flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5 text-secondary" /> Ver Avaliação Física
              </Button>
            </Link>
          ) : (
            <div />
          )}

          <Button
            onClick={onClose}
            className="bg-primary hover:opacity-90 text-primary-foreground text-xs h-9 px-4"
          >
            Entendido, Fechar
          </Button>
        </div>
      </div>

      {/* Modal de foto ampliada */}
      <Dialog open={Boolean(enlargedPhoto)} onOpenChange={(o) => !o && setEnlargedPhoto(null)}>
        <DialogContent className="bg-black/95 border-[#2A2A2A] text-white sm:max-w-3xl p-3 flex flex-col items-center">
          <div className="w-full flex justify-end">
            <button
              type="button"
              onClick={() => setEnlargedPhoto(null)}
              className="p-1 rounded text-[#8A8F98] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {enlargedPhoto && (
            <img
              src={enlargedPhoto}
              alt="Foto ampliada da anamnese"
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
