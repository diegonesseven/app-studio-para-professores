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
  const [activeTab, setActiveTab] = useState<'imc' | 'gordura' | 'musculo' | 'visceral' | 'rcq'>(
    'imc',
  )

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
          <button
            type="button"
            onClick={() => setActiveTab('rcq')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'rcq'
                ? 'bg-primary text-primary-foreground font-bold shadow'
                : 'bg-[#121522] text-[#9CA5B8] hover:text-white border border-[#252B3E]'
            }`}
          >
            5. Cintura-Quadril
          </button>
        </div>

        {/* Conteúdo das tabelas */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'imc' && (
            <div className="space-y-3">
              <div className="bg-[#121522] border border-[#252B3E] rounded-xl overflow-hidden">
                <div className="bg-primary/20 px-4 py-2.5 border-b border-[#252B3E] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Como interpretar o resultado do IMC (Omron)
                  </span>
                  <span className="text-[11px] text-[#9CA5B8]">kg/m²</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#1A2138] text-[#9CA5B8] border-b border-[#252B3E]">
                    <tr>
                      <th className="p-3 font-semibold">Abaixo do peso</th>
                      <th className="p-3 font-semibold text-emerald-400">Normal</th>
                      <th className="p-3 font-semibold text-amber-400">Sobrepeso</th>
                      <th className="p-3 font-semibold text-rose-400">Obesidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252B3E] text-white">
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-medium">&lt; 18,5</td>
                      <td className="p-3 font-bold text-emerald-400 bg-emerald-500/5">
                        18,5 – 24,9
                      </td>
                      <td className="p-3 text-amber-400">25,0 – 29,9</td>
                      <td className="p-3 text-rose-400 font-semibold">≥ 30,0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[#121522] border border-[#252B3E] text-xs text-[#9CA5B8]">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p>
                  Diretrizes de IMC do Instituto Nacional de Saúde / Organização Mundial da Saúde
                  (NIH/OMS). O IMC é calculado dividindo o peso (kg) pela altura ao quadrado (m²).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'gordura' && (
            <div className="space-y-3">
              <div className="bg-[#121522] border border-[#252B3E] rounded-xl overflow-hidden">
                <div className="bg-primary/20 px-4 py-2.5 border-b border-[#252B3E] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Como interpretar o resultado da porcentagem de GORDURA CORPORAL
                  </span>
                  <span className="text-[11px] text-[#9CA5B8]">Unidade: %</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#1A2138] text-[#9CA5B8] border-b border-[#252B3E]">
                    <tr>
                      <th className="p-3 font-semibold">SEXO</th>
                      <th className="p-3 font-semibold">IDADE</th>
                      <th className="p-3 font-semibold text-amber-400">BAIXO</th>
                      <th className="p-3 font-semibold text-emerald-400">NORMAL</th>
                      <th className="p-3 font-semibold text-amber-400">ALTO</th>
                      <th className="p-3 font-semibold text-rose-400">MUITO ALTO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252B3E] text-white">
                    {/* FEMININO */}
                    <tr className="hover:bg-[#1E243A] bg-pink-950/10">
                      <td
                        rowSpan={3}
                        className="p-3 font-bold text-pink-400 border-r border-[#252B3E]"
                      >
                        FEMININO
                      </td>
                      <td className="p-2.5 font-medium">20–39</td>
                      <td className="p-2.5 text-amber-400">&lt; 21,0</td>
                      <td className="p-2.5 font-semibold text-emerald-400">21,0 – 32,9</td>
                      <td className="p-2.5 text-amber-400">33,0 – 38,9</td>
                      <td className="p-2.5 text-rose-400 font-bold">&gt; 39,0</td>
                    </tr>
                    <tr className="hover:bg-[#1E243A] bg-pink-950/10">
                      <td className="p-2.5 font-medium">40–59</td>
                      <td className="p-2.5 text-amber-400">&lt; 23,0</td>
                      <td className="p-2.5 font-semibold text-emerald-400">23,0 – 33,9</td>
                      <td className="p-2.5 text-amber-400">34,0 – 39,9</td>
                      <td className="p-2.5 text-rose-400 font-bold">&gt; 40,0</td>
                    </tr>
                    <tr className="hover:bg-[#1E243A] bg-pink-950/10">
                      <td className="p-2.5 font-medium">60–79</td>
                      <td className="p-2.5 text-amber-400">&lt; 24,0</td>
                      <td className="p-2.5 font-semibold text-emerald-400">24,0 – 35,9</td>
                      <td className="p-2.5 text-amber-400">36,0 – 41,9</td>
                      <td className="p-2.5 text-rose-400 font-bold">&gt; 42,0</td>
                    </tr>

                    {/* MASCULINO */}
                    <tr className="hover:bg-[#1E243A] bg-sky-950/10 border-t-2 border-[#252B3E]">
                      <td
                        rowSpan={3}
                        className="p-3 font-bold text-sky-400 border-r border-[#252B3E]"
                      >
                        MASCULINO
                      </td>
                      <td className="p-2.5 font-medium">20–39</td>
                      <td className="p-2.5 text-amber-400">&lt; 8,0</td>
                      <td className="p-2.5 font-semibold text-emerald-400">8,0 – 19,9</td>
                      <td className="p-2.5 text-amber-400">20,0 – 24,9</td>
                      <td className="p-2.5 text-rose-400 font-bold">&gt; 25,0</td>
                    </tr>
                    <tr className="hover:bg-[#1E243A] bg-sky-950/10">
                      <td className="p-2.5 font-medium">40–59</td>
                      <td className="p-2.5 text-amber-400">&lt; 11,0</td>
                      <td className="p-2.5 font-semibold text-emerald-400">11,0 – 21,9</td>
                      <td className="p-2.5 text-amber-400">22,0 – 27,9</td>
                      <td className="p-2.5 text-rose-400 font-bold">&gt; 28,0</td>
                    </tr>
                    <tr className="hover:bg-[#1E243A] bg-sky-950/10">
                      <td className="p-2.5 font-medium">60–79</td>
                      <td className="p-2.5 text-amber-400">&lt; 13,0</td>
                      <td className="p-2.5 font-semibold text-emerald-400">13,0 – 24,9</td>
                      <td className="p-2.5 text-amber-400">25,0 – 29,9</td>
                      <td className="p-2.5 text-rose-400 font-bold">&gt; 30,0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[#8A8F98] italic">
                Fonte: Diretrizes de IMC do Instituto Nacional de Saúde / Organização Mundial da
                Saúde.
              </p>
            </div>
          )}

          {activeTab === 'musculo' && (
            <div className="space-y-3">
              <div className="bg-[#121522] border border-[#252B3E] rounded-xl overflow-hidden">
                <div className="bg-primary/20 px-4 py-2.5 border-b border-[#252B3E] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Como interpretar o resultado da porcentagem de MÚSCULOS ESQUELÉTICOS
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    ↑ Quanto maior melhor (Excelente)
                  </span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#1A2138] text-[#9CA5B8] border-b border-[#252B3E]">
                    <tr>
                      <th className="p-3 font-semibold">SEXO</th>
                      <th className="p-3 font-semibold">IDADE</th>
                      <th className="p-3 font-semibold text-rose-400">BAIXO</th>
                      <th className="p-3 font-semibold text-emerald-400">NORMAL</th>
                      <th className="p-3 font-semibold text-emerald-300">ALTO</th>
                      <th className="p-3 font-semibold text-emerald-200">MUITO ALTO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252B3E] text-white">
                    {/* FEMININO */}
                    <tr className="hover:bg-[#1E243A] bg-pink-950/10">
                      <td
                        rowSpan={3}
                        className="p-3 font-bold text-pink-400 border-r border-[#252B3E]"
                      >
                        FEMININO
                      </td>
                      <td className="p-2.5 font-medium">18–39</td>
                      <td className="p-2.5 text-rose-400">&lt; 24,3</td>
                      <td className="p-2.5 font-semibold text-emerald-400">24,3 – 30,3</td>
                      <td className="p-2.5 font-bold text-emerald-300">30,4 – 35,3</td>
                      <td className="p-2.5 font-black text-emerald-200">&gt; 35,4</td>
                    </tr>
                    <tr className="hover:bg-[#1E243A] bg-pink-950/10">
                      <td className="p-2.5 font-medium">40–59</td>
                      <td className="p-2.5 text-rose-400">&lt; 24,1</td>
                      <td className="p-2.5 font-semibold text-emerald-400">24,1 – 30,1</td>
                      <td className="p-2.5 font-bold text-emerald-300">30,2 – 35,1</td>
                      <td className="p-2.5 font-black text-emerald-200">&gt; 35,2</td>
                    </tr>
                    <tr className="hover:bg-[#1E243A] bg-pink-950/10">
                      <td className="p-2.5 font-medium">60–80</td>
                      <td className="p-2.5 text-rose-400">&lt; 23,9</td>
                      <td className="p-2.5 font-semibold text-emerald-400">23,9 – 29,9</td>
                      <td className="p-2.5 font-bold text-emerald-300">30,0 – 34,9</td>
                      <td className="p-2.5 font-black text-emerald-200">&gt; 35,0</td>
                    </tr>

                    {/* MASCULINO */}
                    <tr className="hover:bg-[#1E243A] bg-sky-950/10 border-t-2 border-[#252B3E]">
                      <td
                        rowSpan={3}
                        className="p-3 font-bold text-sky-400 border-r border-[#252B3E]"
                      >
                        MASCULINO
                      </td>
                      <td className="p-2.5 font-medium">18–39</td>
                      <td className="p-2.5 text-rose-400">&lt; 33,0</td>
                      <td className="p-2.5 font-semibold text-emerald-400">33,3 – 39,3</td>
                      <td className="p-2.5 font-bold text-emerald-300">39,4 – 44,0</td>
                      <td className="p-2.5 font-black text-emerald-200">&gt; 44,1</td>
                    </tr>
                    <tr className="hover:bg-[#1E243A] bg-sky-950/10">
                      <td className="p-2.5 font-medium">40–59</td>
                      <td className="p-2.5 text-rose-400">&lt; 33,1</td>
                      <td className="p-2.5 font-semibold text-emerald-400">33,1 – 39,1</td>
                      <td className="p-2.5 font-bold text-emerald-300">39,2 – 43,8</td>
                      <td className="p-2.5 font-black text-emerald-200">&gt; 43,9</td>
                    </tr>
                    <tr className="hover:bg-[#1E243A] bg-sky-950/10">
                      <td className="p-2.5 font-medium">60–80</td>
                      <td className="p-2.5 text-rose-400">&lt; 32,9</td>
                      <td className="p-2.5 font-semibold text-emerald-400">32,9 – 38,9</td>
                      <td className="p-2.5 font-bold text-emerald-300">39,0 – 43,6</td>
                      <td className="p-2.5 font-black text-emerald-200">&gt; 43,7</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'visceral' && (
            <div className="space-y-3">
              <div className="bg-[#121522] border border-[#252B3E] rounded-xl overflow-hidden">
                <div className="bg-primary/20 px-4 py-2.5 border-b border-[#252B3E] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Como interpretar o resultado da porcentagem de GORDURA VISCERAL
                  </span>
                  <span className="text-[11px] text-[#9CA5B8]">Nível (1–30)</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#1A2138] text-[#9CA5B8] border-b border-[#252B3E]">
                    <tr>
                      <th className="p-3 font-semibold text-emerald-400">NORMAL</th>
                      <th className="p-3 font-semibold text-amber-400">ALTO</th>
                      <th className="p-3 font-semibold text-rose-400">MUITO ALTO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252B3E] text-white">
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-bold text-emerald-400 bg-emerald-500/5">
                        &lt; 09 (1 a 9)
                      </td>
                      <td className="p-3 text-amber-400 font-semibold">10 a 14</td>
                      <td className="p-3 text-rose-400 font-bold">&gt; 15</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'rcq' && (
            <div className="space-y-3">
              <div className="bg-[#121522] border border-[#252B3E] rounded-xl overflow-hidden">
                <div className="bg-primary/20 px-4 py-2.5 border-b border-[#252B3E] flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Níveis Saudáveis: Relação Cintura-Quadril (RCQ)
                  </span>
                  <span className="text-[11px] text-[#9CA5B8]">Cintura (cm) / Quadril (cm)</span>
                </div>
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#1A2138] text-[#9CA5B8] border-b border-[#252B3E]">
                    <tr>
                      <th className="p-3 font-semibold text-pink-400">FEMININO (Nível Saudável)</th>
                      <th className="p-3 font-semibold text-sky-400">MASCULINO (Nível Saudável)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252B3E] text-white">
                    <tr className="hover:bg-[#1E243A]">
                      <td className="p-3 font-bold text-emerald-400 bg-emerald-500/5">&lt; 0,85</td>
                      <td className="p-3 font-bold text-emerald-400 bg-emerald-500/5">&lt; 0,90</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-[#9CA5B8]">
                A relação cintura-quadril é calculada dividindo a medida da cintura pela do quadril.
                Valores dentro do limite saudável indicam menor risco cardiovascular.
              </p>
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
