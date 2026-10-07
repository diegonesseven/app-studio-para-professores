import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { DEFAULT_APPEARANCE } from '@/services/appSettings'
import {
  Palette,
  Upload,
  RotateCcw,
  Save,
  Check,
  Eye,
  Sparkles,
  ShieldAlert,
  Image as ImageIcon,
  Trash2,
  Sliders,
  CheckCircle2,
  Dumbbell,
  PlaySquare,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

interface ColorPreset {
  name: string
  primary: string
  bg: string
  surface: string
  description: string
}

const PRESETS: ColorPreset[] = [
  {
    name: 'Oficial Studio Bru (Índigo & Menta)',
    primary: '#4B4FA0',
    bg: '#0E111D',
    surface: '#181C2E',
    description: 'Identidade oficial da logo: Azul-Índigo profundo com Verde-Menta/Teal.',
  },
  {
    name: 'Menta / Soft Teal & White',
    primary: '#7EC8B6',
    bg: '#0F1C18',
    surface: '#172B26',
    description: 'Foco em Pilates, leveza, postura e saúde integrativa.',
  },
  {
    name: 'Studio Bru (Dark Indigo Elegance)',
    primary: '#5B60BD',
    bg: '#090A12',
    surface: '#131522',
    description: 'Visual noturno aprofundado com contraste elegante para tablets.',
  },
  {
    name: 'Dourado / Gold Performance',
    primary: '#EAB308',
    bg: '#111215',
    surface: '#1C1E24',
    description: 'Paleta nobre de estúdios premium e alta performance.',
  },
  {
    name: 'Esmeralda / Vitality Green',
    primary: '#10B981',
    bg: '#0F1715',
    surface: '#172320',
    description: 'Foco em saúde, reabilitação, movimento e frescor.',
  },
  {
    name: 'Laranja Energético / Sunrise',
    primary: '#F06A2A',
    bg: '#121212',
    surface: '#1E1E1E',
    description: 'Intensidade e calor para aulas de alta energia.',
  },
]

export default function Appearance() {
  const { isAdmin } = useAuth()
  const { appearance, updateAppearance, resetAppearance } = useTheme()

  const [primaryColor, setPrimaryColor] = useState(appearance.primary_color)
  const [backgroundColor, setBackgroundColor] = useState(appearance.background_color)
  const [surfaceColor, setSurfaceColor] = useState(appearance.surface_color)
  const [studioName, setStudioName] = useState(appearance.studio_name)
  const [logoUrl, setLogoUrl] = useState(appearance.logo_url)

  const [saving, setSaving] = useState(false)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Sincroniza estado local caso o tema do backend mude
  useEffect(() => {
    setPrimaryColor(appearance.primary_color)
    setBackgroundColor(appearance.background_color)
    setSurfaceColor(appearance.surface_color)
    setStudioName(appearance.studio_name)
    setLogoUrl(appearance.logo_url)
  }, [appearance])

  // Aplica um preset pré-definido
  const handleSelectPreset = (preset: ColorPreset) => {
    setPrimaryColor(preset.primary)
    setBackgroundColor(preset.bg)
    setSurfaceColor(preset.surface)
    setActivePreset(preset.name)
    toast({
      title: `Preset selecionado: ${preset.name}`,
      description: 'Clique em "Salvar Alterações" para aplicar em todos os dispositivos.',
    })
  }

  // Upload de Logotipo (transforma em Base64 para sincronizar na nuvem via PocketBase)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor selecione uma imagem PNG, JPG ou WebP.',
        variant: 'destructive',
      })
      return
    }

    // Limite de 2.5MB para base64
    if (file.size > 2.5 * 1024 * 1024) {
      toast({
        title: 'Imagem muito pesada',
        description: 'A imagem deve ter no máximo 2.5MB para carregar com rapidez.',
        variant: 'destructive',
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setLogoUrl(result)
      toast({
        title: 'Logotipo carregado',
        description: 'Pré-visualização atualizada! Salve para sincronizar na nuvem.',
      })
    }
    reader.readAsDataURL(file)
  }

  // Remove logotipo
  const handleRemoveLogo = () => {
    setLogoUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast({
      title: 'Logotipo removido',
      description: 'O app voltará a exibir o branding textual Studio Bru Oliveira.',
    })
  }

  // Salvar no backend PocketBase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateAppearance({
        primary_color: primaryColor,
        background_color: backgroundColor,
        surface_color: surfaceColor,
        studio_name: studioName.trim() || 'Studio Bru Oliveira',
        logo_url: logoUrl,
      })

      toast({
        title: 'Aparência salva com sucesso! 🎨',
        description:
          'Cores e logotipo gravados no backend e sincronizados em todos os dispositivos.',
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar personalização',
        description: err instanceof Error ? err.message : 'Falha na gravação',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Reset para padrão
  const handleReset = async () => {
    setSaving(true)
    try {
      await resetAppearance()
      setPrimaryColor(DEFAULT_APPEARANCE.primary_color)
      setBackgroundColor(DEFAULT_APPEARANCE.background_color)
      setSurfaceColor(DEFAULT_APPEARANCE.surface_color)
      setStudioName(DEFAULT_APPEARANCE.studio_name)
      setLogoUrl('')
      setActivePreset(PRESETS[0].name)
      toast({
        title: 'Tema padrão restaurado',
        description:
          'Azul-Índigo #4B4FA0 com Verde-Menta oficial Studio Bru Oliveira reaplicado em nuvem.',
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao resetar',
        description: err instanceof Error ? err.message : 'Falha na conexão',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white">Acesso Restrito ao Administrador</h1>
        <p className="text-sm text-[#8A8F98]">
          A personalização de identidade visual, cores e logotipo do Studio Bru Oliveira é exclusiva
          para o perfil de administrador.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#252525]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Área Administrativa
            </span>
            <span className="text-xs text-[#8A8F98]">•</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sincronizado em Nuvem
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Personalização de Aparência
          </h1>
          <p className="text-sm text-[#8A8F98] mt-1">
            Escolha as cores do studio e envie o logotipo oficial para sincronizar em todos os
            tablets e celulares.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="border-[#2E2E2E] bg-[#141414] hover:bg-[#252525] text-white text-xs sm:text-sm h-11"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" /> Restaurar Padrão
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:opacity-90 text-primary-foreground font-extrabold h-11 px-6 shadow-xl shadow-primary/20"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Gravando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA: Controles e Formulário (7 colunas) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Presets Rápidos */}
          <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Temas e Paletas Prontas
                </h2>
              </div>
              <span className="text-xs text-[#8A8F98]">1 clique para aplicar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESETS.map((preset) => {
                const isSelected =
                  primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
                  backgroundColor.toLowerCase() === preset.bg.toLowerCase()

                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-md shadow-primary/15 ring-2 ring-primary/30'
                        : 'border-[#2E2E2E] bg-[#161616] hover:border-[#3E3E3E] hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Bolinha com a cor */}
                        <span
                          className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 -ml-2 shrink-0"
                          style={{ backgroundColor: preset.bg }}
                        />
                        <span className="font-bold text-xs sm:text-sm text-white">
                          {preset.name.split(' (')[0]}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0 stroke-[3]" />}
                    </div>
                    <p className="text-[11px] text-[#8A8F98] leading-tight line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Card 2: Seletor de Cores Finas */}
          <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              <h2 className="text-base sm:text-lg font-bold text-white">Ajuste Fino de Cores</h2>
            </div>

            <div className="space-y-4">
              {/* Cor Primária */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-[#8A8F98] font-bold">
                    Cor Primária e Destaque (Botões, Séries ativas, Foco)
                  </Label>
                  <span className="text-xs font-mono font-bold text-primary">
                    {primaryColor.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border border-[#3E3E3E] p-1 shrink-0"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#F06A2A"
                    className="bg-[#121212] border-[#2E2E2E] text-white font-mono text-sm h-12 uppercase focus-visible:ring-primary"
                  />
                </div>
              </div>

              {/* Cor de Fundo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-[#8A8F98] font-bold">
                    Cor de Fundo Geral (Background)
                  </Label>
                  <span className="text-xs font-mono font-bold text-[#8A8F98]">
                    {backgroundColor.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border border-[#3E3E3E] p-1 shrink-0"
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#121212"
                    className="bg-[#121212] border-[#2E2E2E] text-white font-mono text-sm h-12 uppercase focus-visible:ring-primary"
                  />
                </div>
              </div>

              {/* Cor de Superfície/Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-[#8A8F98] font-bold">
                    Cor dos Cards e Colunas (Superfície)
                  </Label>
                  <span className="text-xs font-mono font-bold text-[#8A8F98]">
                    {surfaceColor.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={surfaceColor}
                    onChange={(e) => setSurfaceColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border border-[#3E3E3E] p-1 shrink-0"
                  />
                  <Input
                    value={surfaceColor}
                    onChange={(e) => setSurfaceColor(e.target.value)}
                    placeholder="#1E1E1E"
                    className="bg-[#121212] border-[#2E2E2E] text-white font-mono text-sm h-12 uppercase focus-visible:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Logotipo e Nome do Studio */}
          <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h2 className="text-base sm:text-lg font-bold text-white">Logotipo e Nome</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-[#8A8F98] font-bold">
                  Nome do Studio
                </Label>
                <Input
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="Studio Bru Oliveira"
                  className="bg-[#121212] border-[#2E2E2E] text-white font-semibold h-12 focus-visible:ring-primary"
                />
              </div>

              {/* Upload de Logo */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-[#8A8F98] font-bold">
                  Logotipo Oficial (PNG com fundo transparente recomendado)
                </Label>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-[#3A3A3A] bg-[#141414]">
                  {logoUrl ? (
                    <div className="relative w-24 h-24 rounded-xl bg-black/40 border border-[#2E2E2E] flex items-center justify-center p-2 shrink-0 overflow-hidden">
                      <img
                        src={logoUrl}
                        alt="Logotipo do Studio"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-[#222222] border border-[#2E2E2E] flex flex-col items-center justify-center text-[#8A8F98] text-xs shrink-0">
                      <Dumbbell className="w-7 h-7 text-primary mb-1" />
                      <span>Sem logo</span>
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <p className="text-xs text-[#8A8F98]">
                      {logoUrl
                        ? 'Logotipo carregado pronto para ser salvo na nuvem.'
                        : 'Envie um logotipo para substituir o ícone padrão na barra lateral e na tela de login.'}
                    </p>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload-input"
                      />
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#2A2A2A] hover:bg-[#333333] text-white text-xs h-9 px-3.5 border border-[#3A3A3A]"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5 text-primary" />
                        {logoUrl ? 'Trocar Imagem' : 'Enviar Logotipo'}
                      </Button>

                      {logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleRemoveLogo}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs h-9 px-2.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Pré-visualização ao vivo em tempo real (5 colunas) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Pré-visualização em Tempo Real
                </h2>
              </div>
              <span className="text-[11px] text-[#8A8F98] bg-[#1E1E1E] px-2 py-0.5 rounded-full border border-[#2E2E2E]">
                Simulação ao vivo
              </span>
            </div>

            {/* Mockup do App com as cores aplicadas */}
            <div
              className="rounded-2xl border border-[#2E2E2E] shadow-2xl overflow-hidden transition-all duration-300"
              style={{ backgroundColor }}
            >
              {/* Header simulado do Studio */}
              <div
                className="p-4 border-b border-[#2E2E2E] flex items-center justify-between"
                style={{ backgroundColor: surfaceColor }}
              >
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo Preview"
                      className="h-9 w-auto max-w-[120px] object-contain rounded"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md font-bold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Dumbbell className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-extrabold text-white leading-tight">
                      {studioName || 'Studio Bru Oliveira'}
                    </h3>
                    <span className="text-[10px] text-[#8A8F98] block">Personal & Studio</span>
                  </div>
                </div>

                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Admin
                </span>
              </div>

              {/* Conteúdo simulado: Card de Ficha de Treino */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" style={{ color: primaryColor }} /> Aluno em
                    Treino
                  </span>
                  <div className="flex gap-1">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Série A
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/30 text-[#8A8F98]">
                      Série B
                    </span>
                  </div>
                </div>

                {/* Bloco de Exercício Simulado */}
                <div
                  className="p-3.5 rounded-xl border border-white/10 space-y-2.5 transition-all"
                  style={{ backgroundColor: surfaceColor }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        ✓
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          Supino Reto com Barra
                        </h4>
                        <span className="text-[10px] text-[#8A8F98]">Peitoral • 4 séries</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 text-white opacity-90"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <PlaySquare className="w-3 h-3" /> Vídeo
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center pt-2 border-t border-white/5 text-[10px]">
                    <div className="bg-black/20 rounded p-1">
                      <span className="text-[#8A8F98] block">Séries</span>
                      <strong className="text-white">4x</strong>
                    </div>
                    <div className="bg-black/20 rounded p-1">
                      <span className="text-[#8A8F98] block">Reps</span>
                      <strong className="text-white">10-12</strong>
                    </div>
                    <div className="bg-black/20 rounded p-1">
                      <span className="text-[#8A8F98] block">Carga</span>
                      <strong style={{ color: primaryColor }}>30kg</strong>
                    </div>
                    <div className="bg-black/20 rounded p-1">
                      <span className="text-[#8A8F98] block">Pausa</span>
                      <strong className="text-white">60s</strong>
                    </div>
                  </div>
                </div>

                {/* Botão de Ação Primária */}
                <Button
                  type="button"
                  className="w-full h-11 text-xs font-extrabold text-white rounded-xl shadow-lg transition-transform active:scale-95"
                  style={{ backgroundColor: primaryColor }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Concluir Série A
                </Button>
              </div>
            </div>

            {/* Informações de Nuvem */}
            <div className="p-4 rounded-xl bg-[#161616] border border-[#2A2A2A] text-xs text-[#8A8F98] space-y-1.5">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Sincronização Automática
              </p>
              <p>
                Qualquer professor ou admin que abrir o app no tablet da academia, celular ou
                computador receberá estas cores e logotipo imediatamente via conexão em tempo real
                com o banco Skip Cloud.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
