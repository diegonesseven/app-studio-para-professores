import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BookOpen, Info } from 'lucide-react'

interface OmronReferenceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OmronReferenceModal({ open, onOpenChange }: OmronReferenceModalProps) {
  const [activeTab, setActiveTab] = useState<'imc' | 'gordura' | 'musculo' | 'visceral'>('imc')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#181C2E] border-[#252B3E] text-white sm:max-w-3xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="border-b border-[#252B3E] pb-4">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/40 font-black text-xs tracking-wider">
              OMRON
            </div>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-secondary" />
              Tabelas de Referência Bioimpedância
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#9CA5B8] pt-1">
            Parâmetros oficiais Omron para interpretação de IMC, % Gordura, % Músculo Esquelético e
            Gordura Visceral.
          </DialogDescription>
        </DialogHeader>

        {/* Mini tabs */}
        <div className="flex items-center gap-2 pt-2 border-b border-[#252B3E] pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('imc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'imc'
                ? 'bg-primary text-primary-foreground font-bold shadow'
                : 'bg-[#121522] text-[#9CA5B8] hover:text-white border border-[#252B3E]'
            }`}
          >
            1. IMC
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gordura')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'gordura'
                ? 'bg-primary text-primary-foreground font-bold shadow'
                : 'bg-[#121522] text-[#9CA5B8] hover:text-white border border-[#252B3E]'
            }`}
          >
            2. % Gordura Corporal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('musculo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'musculo'
                ? 'bg-primary text-primary-foreground font-bold shadow'
                : 'bg-[#121522] text-[#9CA5B8] hover:text-white border border-[#252B3E]'
            }`}
          >
            3. % Músculo Esquelético
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('visceral')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'visceral'
                ? 'bg-primary text-primary-foreground font-bold shadow'
                : 'bg-[#121522] text-[#9CA5B8] hover:text-white border border-[#252B3E]'
            }`}
          >
            4. Gordura Visceral
          </button>
        </div>

        {/* Conteúdo das tabelas */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'imc' && (
            <div className="space-y-3">
              <div className="bg-[#121522] border border-[#252B3E] rounded-xl overflow-hidden">
                <div className="bg-primary/20 px-4 py-2 border-b border-[#252B3E] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    1. IMC (Índice de Massa Corporal)
                  </span>
                  <span className="text-[11px] text-[#9CA5B8]">Unidade: kg/m²</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#1A2138] text-[#9CA5B8] border-b border-[#252B3E]">
                    <tr>
                      <th className="p-3 font-semibold">IMC (kg/m²)</th>
                      <th className="p-3 font-semibold">Classificação</th>
                      <th className="p-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252B3E] text-white">
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-medium">&lt; 18,5</td>
                      <td className="p-3">Baixo peso</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          Atenção
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#1E243A] bg-emerald-500/5">
                      <td className="p-3 font-semibold text-emerald-400">18,5 – 24,9</td>
                      <td className="p-3 font-semibold text-emerald-400">Normal</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          OK
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-medium">25,0 – 29,9</td>
                      <td className="p-3">Sobrepeso</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          Atenção
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-medium">30,0 – 34,9</td>
                      <td className="p-3">Obesidade grau I</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                          Alto
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-medium">35,0 – 39,9</td>
                      <td className="p-3">Obesidade grau II</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                          Alto
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-medium">≥ 40,0</td>
                      <td className="p-3">Obesidade grau III</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                          Muito Alto
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[#121522] border border-[#252B3E] text-xs text-[#9CA5B8]">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>
                  O IMC é calculado dividindo o peso (kg) pela altura ao quadrado (m²). Pode ser
                  calculado automaticamente pelo sistema se a altura e o peso estiverem preenchidos.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'gordura' && (
            <div className="space-y-3">
              <div className="bg-[#121522] border border-[#252B3E] rounded-xl overflow-hidden">
                <div className="bg-primary/20 px-4 py-2 border-b border-[#252B3E] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    2. % Gordura Corporal (Omron)
                  </span>
                  <span className="text-[11px] text-[#9CA5B8]">Unidade: %</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#1A2138] text-[#9CA5B8] border-b border-[#252B3E]">
                    <tr>
                      <th className="p-3 font-semibold">Classificação</th>
                      <th className="p-3 font-semibold">Homens (% gordura)</th>
                      <th className="p-3 font-semibold">Mulheres (% gordura)</th>
                      <th className="p-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252B3E] text-white">
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-medium">Baixo</td>
                      <td className="p-3">5,0 – 9,9%</td>
                      <td className="p-3">5,0 – 19,9%</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          Baixo
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#1E243A] bg-emerald-500/5">
                      <td className="p-3 font-semibold text-emerald-400">Normal</td>
                      <td className="p-3 font-semibold text-emerald-400">10,0 – 19,9%</td>
                      <td className="p-3 font-semibold text-emerald-400">20,0 – 29,9%</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          OK
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-medium">Alto</td>
                      <td className="p-3">20,0 – 24,9%</td>
                      <td className="p-3">30,0 – 34,9%</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          Alto
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-medium">Muito alto</td>
                      <td className="p-3">≥ 25,0%</td>
                      <td className="p-3">≥ 35,0%</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                          Muito Alto
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'musculo' && (
            <div className="space-y-3">
              <div className="bg-[#121522] border border-[#252B3E] rounded-xl overflow-hidden">
                <div className="bg-primary/20 px-4 py-2 border-b border-[#252B3E] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    3. % Músculo Esquelético (Omron)
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    ↑ Quanto maior melhor
                  </span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#1A2138] text-[#9CA5B8] border-b border-[#252B3E]">
                    <tr>
                      <th className="p-3 font-semibold">Sexo / Idade</th>
                      <th className="p-3 font-semibold">Baixo</th>
                      <th className="p-3 font-semibold text-emerald-400">Normal</th>
                      <th className="p-3 font-semibold text-emerald-400">Alto (Excelente)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252B3E] text-white">
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-semibold text-sky-400">Homens 18 – 39</td>
                      <td className="p-3 text-amber-400">&lt; 33,3%</td>
                      <td className="p-3 text-emerald-400 font-medium">33,3 – 39,3%</td>
                      <td className="p-3 text-emerald-300 font-bold">≥ 39,4%</td>
                    </tr>
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-semibold text-sky-400">Homens 40 – 59</td>
                      <td className="p-3 text-amber-400">&lt; 33,1%</td>
                      <td className="p-3 text-emerald-400 font-medium">33,1 – 39,1%</td>
                      <td className="p-3 text-emerald-300 font-bold">≥ 39,2%</td>
                    </tr>
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-semibold text-sky-400">Homens 60 – 80</td>
                      <td className="p-3 text-amber-400">&lt; 32,9%</td>
                      <td className="p-3 text-emerald-400 font-medium">32,9 – 38,9%</td>
                      <td className="p-3 text-emerald-300 font-bold">≥ 39,0%</td>
                    </tr>

                    <tr className="hover:bg-[#1E243A] border-t-2 border-[#252B3E]">
                      <td className="p-3 font-semibold text-pink-400">Mulheres 18 – 39</td>
                      <td className="p-3 text-amber-400">&lt; 24,3%</td>
                      <td className="p-3 text-emerald-400 font-medium">24,3 – 30,3%</td>
                      <td className="p-3 text-emerald-300 font-bold">≥ 30,4%</td>
                    </tr>
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-semibold text-pink-400">Mulheres 40 – 59</td>
                      <td className="p-3 text-amber-400">&lt; 24,1%</td>
                      <td className="p-3 text-emerald-400 font-medium">24,1 – 30,1%</td>
                      <td className="p-3 text-emerald-300 font-bold">≥ 30,2%</td>
                    </tr>
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-semibold text-pink-400">Mulheres 60 – 80</td>
                      <td className="p-3 text-amber-400">&lt; 23,9%</td>
                      <td className="p-3 text-emerald-400 font-medium">23,9 – 29,9%</td>
                      <td className="p-3 text-emerald-300 font-bold">≥ 30,0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'visceral' && (
            <div className="space-y-3">
              <div className="bg-[#121522] border border-[#252B3E] rounded-xl overflow-hidden">
                <div className="bg-primary/20 px-4 py-2 border-b border-[#252B3E] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    4. Gordura Visceral (Índice 1–30)
                  </span>
                  <span className="text-[11px] text-[#9CA5B8]">Nível</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#1A2138] text-[#9CA5B8] border-b border-[#252B3E]">
                    <tr>
                      <th className="p-3 font-semibold">Índice</th>
                      <th className="p-3 font-semibold">Classificação</th>
                      <th className="p-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252B3E] text-white">
                    <tr className="hover:bg-[#1E243A] bg-emerald-500/5">
                      <td className="p-3 font-semibold text-emerald-400">1 – 9</td>
                      <td className="p-3 font-semibold text-emerald-400">Normal</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                          OK
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-medium">10 – 14</td>
                      <td className="p-3">Alto</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          Atenção
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-medium">15 – 30</td>
                      <td className="p-3">Muito alto</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                          Risco Elevado
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#252B3E] pt-3 flex justify-end">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="bg-primary hover:opacity-90 text-primary-foreground text-xs h-9 font-semibold"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
