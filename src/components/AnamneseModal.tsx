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
import { StudentAvatar } from '@/components/StudentAvatar'

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
            <StudentAvatar student={student} className="w-11 h-11" alt={student.name} />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
                <HeartPulse className="w-3.5 h-3.5 inline text-primary" /> Saúde & Anamnese
              </span>{' '}
              <h3 className="text-lg font-bold text-foreground truncate">{student.name}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Fechar anamnese"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Informações básicas do aluno */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground block">Idade</span>
                <strong className="text-foreground text-xs">
                  {age !== null ? `${age} anos` : 'Não informada'}
                </strong>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground block">Contato</span>
                <strong className="text-foreground text-xs">
                  {student.phone || 'Sem telefone'}
                </strong>
              </div>
            </div>
            <div className="flex items-center gap-2.5 col-span-2 sm:col-span-1">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground block">Profissão</span>
                <strong className="text-foreground text-xs truncate max-w-[120px] block">
                  {an.profissao || 'Não informada'}
                </strong>
              </div>
            </div>
          </div>

          {/* Destaque de Restrições Médicas / Cuidados em aula (permanece exatamente com esse rótulo) */}
          {student.restrictions && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs tracking-wider uppercase">
                <ShieldAlert className="w-4 h-4" /> Restrições médicas / Cuidado em aula
              </div>
              <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
                {student.restrictions}
              </p>
            </div>
          )}

          {/* Fotos da Anamnese (Item 5) */}
          {photos.length > 0 && (
            <div className="space-y-2 p-3.5 rounded-xl bg-muted/40 border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase">
                <Camera className="w-3.5 h-3.5 text-primary" /> Fotos na Anamnese ({photos.length})
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                {photos.map((pName) => {
                  const url = studentsService.getAnamnesisPhotoUrl(student, pName)
                  return (
                    <div
                      key={pName}
                      className="relative group rounded-lg overflow-hidden border border-border bg-black aspect-square cursor-pointer"
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

          {/* Questionário de Anamnese */}
          <div className="space-y-3">
            {/* 1. Já treinou com Personal antes? */}
            {an.treinou_personal_antes && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground font-bold block mb-1 uppercase tracking-wider">
                  Já treinou com Personal antes?
                </span>
                <p className="text-foreground leading-relaxed">{an.treinou_personal_antes}</p>
              </div>
            )}

            {/* 2. Objetivos */}
            {((an.objetivos && an.objetivos.length > 0) ||
              (student.goals && student.goals.length > 0)) && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5">
                <span className="text-muted-foreground font-bold block uppercase tracking-wider">
                  Objetivo:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(an.objetivos || (student.goals as string[]) || []).map((obj) => (
                    <Badge
                      key={obj}
                      className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 font-medium"
                    >
                      (x) {obj}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Você deseja dar ênfase em alguma musculatura? Qual? */}
            {an.enfase_musculatura && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground font-bold block mb-1 uppercase tracking-wider">
                  Ênfase em alguma musculatura
                </span>
                <p className="text-foreground leading-relaxed">{an.enfase_musculatura}</p>
              </div>
            )}

            {/* 4. Já praticou algum exercício físico? */}
            {an.praticou_exercicio && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground font-bold block mb-1 uppercase tracking-wider">
                  Já praticou algum exercício físico?
                </span>
                <p className="text-foreground text-sm">
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
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground font-bold block mb-1 uppercase tracking-wider">
                  Há quanto tempo não pratica exercício físico?
                </span>
                <p className="text-foreground leading-relaxed">{an.tempo_sem_praticar}</p>
              </div>
            )}

            {/* 6. Possui alguma restrição à exercício físico? */}
            {an.restricao_exercicio && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground font-bold block mb-1 uppercase tracking-wider">
                  Possui alguma restrição a exercício físico?
                </span>
                <p className="text-foreground text-sm">
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
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5">
                <span className="text-muted-foreground font-bold block uppercase tracking-wider">
                  Possui alguma doença?
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {an.possui_doenca.map((d) => {
                    const isNao = d.toLowerCase() === 'não' || d.toLowerCase() === 'nao'
                    return (
                      <Badge
                        key={d}
                        className={`text-xs px-2.5 py-0.5 font-medium ${
                          isNao
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        (x) {d}
                      </Badge>
                    )
                  })}
                </div>
                {an.possui_doenca_outros && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Outros: <span className="text-foreground">{an.possui_doenca_outros}</span>
                  </p>
                )}
              </div>
            )}

            {/* 8. Possui alguma lesão? (ou legacy injuries) */}
            {(an.possui_lesao || student.injuries) && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground font-bold block mb-1 uppercase tracking-wider">
                  Possui alguma lesão?
                </span>
                <p className="text-foreground leading-relaxed">
                  {an.possui_lesao || student.injuries}
                </p>
              </div>
            )}

            {/* 9. Dores em alguma parte do corpo? */}
            {an.dores_corpo && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground font-bold block mb-1 uppercase tracking-wider">
                  Dores em alguma parte do corpo?
                </span>
                <p className="text-foreground text-sm">
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
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground font-bold block mb-1 uppercase tracking-wider">
                  Faz dieta?
                </span>
                <p className="text-foreground leading-relaxed">
                  {an.faz_dieta === 'SIM' ? 'Sim' : an.faz_dieta === 'NAO' ? 'Não' : an.faz_dieta}
                </p>
              </div>
            )}

            {/* 11. Faz acompanhamento com nutricionista? */}
            {an.faz_nutricionista && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground font-bold block mb-1 uppercase tracking-wider">
                  Faz acompanhamento com nutricionista?
                </span>
                <p className="text-foreground leading-relaxed">
                  {an.faz_nutricionista === 'SIM'
                    ? 'Sim'
                    : an.faz_nutricionista === 'NAO'
                      ? 'Não'
                      : an.faz_nutricionista}
                </p>
              </div>
            )}

            {/* 12. Faz uso de Álcool / Tabaco */}
            {an.uso_substancias && an.uso_substancias.length > 0 && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5">
                <span className="text-muted-foreground font-bold block uppercase tracking-wider">
                  Faz uso de álcool / tabaco?
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {an.uso_substancias.map((item) => (
                    <Badge
                      key={item}
                      className="bg-muted text-foreground border border-border text-xs px-2.5 py-0.5"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Campos legados adicionais preservados (histórico clínico geral, cirurgias, observações do professor) */}
            {student.health_history && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground font-bold block mb-1 uppercase tracking-wider">
                  Histórico Clínico / Saúde Geral
                </span>
                <p className="text-foreground leading-relaxed">{student.health_history}</p>
              </div>
            )}

            {student.surgeries && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground font-bold block mb-1 uppercase tracking-wider">
                  Cirurgias / Procedimentos
                </span>
                <p className="text-foreground leading-relaxed">{student.surgeries}</p>
              </div>
            )}

            {student.general_observations && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground font-bold block mb-1 uppercase tracking-wider">
                  Observações Gerais
                </span>
                <p className="text-foreground leading-relaxed">{student.general_observations}</p>
              </div>
            )}
          </div>
          {!hasAnamneseData && (
            <div className="py-8 text-center text-muted-foreground space-y-1">
              <HeartPulse className="w-8 h-8 opacity-40 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Anamnese não preenchida</p>
              <p className="text-xs">
                O aluno pode treinar normalmente, mas você pode editar o cadastro a qualquer momento
                para registrar a anamnese.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-between gap-2">
          {student?.id ? (
            <Link to={`/alunos/${student.id}/editar`} onClick={onClose}>
              <Button
                type="button"
                variant="outline"
                className="border-primary/40 bg-primary/10 hover:bg-primary/20 text-foreground text-xs h-9 px-3 flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> Ver Avaliação Física
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
        <DialogContent className="bg-card border-border text-foreground sm:max-w-3xl p-3 flex flex-col items-center">
          <div className="w-full flex justify-end">
            <button
              type="button"
              onClick={() => setEnlargedPhoto(null)}
              className="p-1 rounded text-muted-foreground hover:text-foreground"
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
