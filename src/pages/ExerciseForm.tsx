import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { exercisesService, parseVideoUrl } from '@/services/exercises'
import { useAuth } from '@/contexts/AuthContext'
import { MUSCLE_GROUPS, TARGET_MUSCLE_GROUPS, type MuscleGroup } from '@/types'
import { sanitizeText, sanitizeUrl } from '@/lib/validation'
import {
  ArrowLeft,
  Dumbbell,
  Play,
  Save,
  Trash2,
  AlertCircle,
  Video,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ExerciseForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [name, setName] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('Quadríceps')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Detecção dinâmica de plataforma e prévia (YouTube / Vimeo / nenhum)
  const parsedVideo = parseVideoUrl(youtubeUrl)

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: 'Acesso Restrito',
        description: 'Apenas administradores podem cadastrar ou editar exercícios.',
        variant: 'destructive',
      })
      navigate('/acervo')
      return
    }

    if (id) {
      setLoading(true)
      exercisesService
        .getById(id)
        .then((ex) => {
          setName(ex.name)
          if (ex.youtube_url) {
            setYoutubeUrl(ex.youtube_url)
          } else if (ex.youtube_id) {
            // Compatibilidade com dados antigos que só tinham o ID
            const isVimeoNum = /^\d{6,12}$/.test(ex.youtube_id)
            setYoutubeUrl(
              isVimeoNum
                ? `https://vimeo.com/${ex.youtube_id}`
                : `https://www.youtube.com/watch?v=${ex.youtube_id}`,
            )
          } else {
            setYoutubeUrl('')
          }
          // Se for 'A classificar', podemos manter no estado se estiver na lista ou selecionar o valor
          setMuscleGroup(ex.muscle_group)
        })
        .catch((err) => {
          toast({
            title: 'Erro ao carregar exercício',
            description: err instanceof Error ? err.message : 'Não encontrado',
            variant: 'destructive',
          })
          navigate('/acervo')
        })
        .finally(() => setLoading(false))
    }
  }, [id, isAdmin, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = sanitizeText(name)
    if (!cleanName) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome do exercício.',
        variant: 'destructive',
      })
      return
    }

    // Se o usuário digitou algo no vídeo mas a URL for inválida ou não suportada
    const trimmedUrl = youtubeUrl.trim()
    if (trimmedUrl && parsedVideo.platform === 'none') {
      toast({
        title: 'Link de vídeo inválido',
        description: 'Informe um link válido do YouTube ou Vimeo, ou deixe o campo em branco.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const cleanUrl = trimmedUrl ? sanitizeUrl(trimmedUrl) : ''
      if (isEditing && id) {
        await exercisesService.update(id, {
          name: cleanName,
          youtube_url: cleanUrl,
          muscle_group: muscleGroup,
        })
        toast({
          title: 'Exercício atualizado',
          description: 'As alterações foram salvas com sucesso.',
        })
      } else {
        await exercisesService.create({
          name: cleanName,
          youtube_url: cleanUrl || undefined,
          muscle_group: muscleGroup,
        })
        toast({
          title: 'Exercício criado',
          description: 'O exercício já está disponível no acervo para fichas de treino.',
        })
      }
      navigate('/acervo')
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : 'Falha na gravação',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await exercisesService.delete(id)
      toast({
        title: 'Exercício excluído',
        description: 'Exercício removido do acervo com sucesso.',
      })
      navigate('/acervo')
    } catch (err: unknown) {
      toast({
        title: 'Erro ao excluir',
        description: err instanceof Error ? err.message : 'Falha na exclusão',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-[#8A8F98]">Carregando dados do exercício...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <Link
          to="/acervo"
          className="inline-flex items-center gap-1.5 text-sm text-[#8A8F98] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Acervo
        </Link>
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs h-9"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Excluir Exercício
          </Button>
        )}
      </div>

      <div className="bg-[#1E1E1E] border border-[#2E2E2E] rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-[#2E2E2E]">
          <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {isEditing ? 'Editar Exercício' : 'Novo Exercício'}
            </h1>
            <p className="text-xs sm:text-sm text-[#8A8F98]">
              Cadastre o movimento do acervo. O vídeo do YouTube ou Vimeo é opcional.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm text-white font-medium">
              Nome do Exercício *
            </Label>
            <Input
              id="name"
              required
              placeholder="Ex: Agachamento Búlgaro, Supino Inclinado com Halteres"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 focus-visible:ring-primary"
            />
          </div>

          {/* Agrupamento muscular */}
          <div className="space-y-1.5">
            <Label htmlFor="muscle" className="text-sm text-white font-medium">
              Agrupamento Muscular Principal *
            </Label>
            <select
              id="muscle"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
              className="w-full h-12 bg-[#121212] border border-[#2E2E2E] text-white rounded-md px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {TARGET_MUSCLE_GROUPS.map((mg) => (
                <option key={mg} value={mg}>
                  {mg}
                </option>
              ))}
            </select>
          </div>

          {/* URL do Vídeo (YouTube ou Vimeo) - Opcional */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="videoUrl" className="text-sm text-white font-medium">
                Link do Vídeo demonstrativo
              </Label>
              <span className="text-xs text-[#8A8F98] font-normal">Opcional</span>
            </div>
            <div className="relative">
              <Input
                id="videoUrl"
                placeholder="Ex: https://vimeo.com/123456789 ou https://youtu.be/..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 pr-10 focus-visible:ring-primary"
              />
              <Video className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
            </div>
            <p className="text-[11px] text-[#8A8F98]">
              Aceita links do <strong>Vimeo</strong> (ex: vimeo.com/123456789,
              player.vimeo.com/video/...) e do <strong>YouTube</strong> (web, celular ou ID). Se não
              tiver vídeo, pode deixar em branco.
            </p>
          </div>

          {/* Prévia dinâmica do vídeo (YouTube ou Vimeo) */}
          {parsedVideo.platform === 'youtube' && parsedVideo.thumbnailUrl ? (
            <div className="p-3 bg-[#121212] border border-[#2E2E2E] rounded-xl space-y-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Vídeo do YouTube
                identificado (ID: {parsedVideo.id})
              </span>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-[#2E2E2E] max-w-sm">
                <img
                  src={parsedVideo.thumbnailUrl}
                  alt="Prévia YouTube"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : parsedVideo.platform === 'vimeo' ? (
            <div className="p-3 bg-[#121212] border border-[#2E2E2E] rounded-xl space-y-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Vídeo do Vimeo
                identificado (ID: {parsedVideo.id})
              </span>
              {parsedVideo.embedUrl && (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-[#2E2E2E] max-w-sm bg-black">
                  <iframe
                    src={parsedVideo.embedUrl}
                    title="Prévia Vimeo"
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen; picture-in-picture"
                  />
                </div>
              )}
            </div>
          ) : youtubeUrl.trim() ? (
            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Não conseguimos identificar um vídeo válido do YouTube ou Vimeo nesta URL. Verifique
                o link ou deixe em branco.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-[#161616] border border-[#2A2A2A] rounded-xl text-xs text-[#8A8F98] flex items-center gap-2">
              <Video className="w-4 h-4 shrink-0 text-[#8A8F98]" />
              <span>
                Exercício sem vídeo cadastrado. Ele será salvo normalmente e poderá ser usado nas
                fichas.
              </span>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#2E2E2E]">
            <Link to="/acervo">
              <Button
                type="button"
                variant="outline"
                className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white h-11"
              >
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary hover:opacity-90 text-primary-foreground font-medium h-11 px-6 shadow-md"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Exercício'}
            </Button>
          </div>
        </form>
      </div>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] border-[#2E2E2E] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> Excluir este exercício?
            </DialogTitle>
            <DialogDescription className="text-[#8A8F98] text-sm">
              Tem certeza que deseja excluir o exercício &quot;{name}&quot; do acervo do Studio Bru
              Oliveira?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-[#2E2E2E] bg-[#121212] hover:bg-[#2A2A2A] text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
