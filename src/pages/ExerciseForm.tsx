import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { exercisesService, extractYoutubeId, getYoutubeThumbnail } from '@/services/exercises'
import { useAuth } from '@/contexts/AuthContext'
import { MUSCLE_GROUPS, type MuscleGroup } from '@/types'
import { sanitizeText, sanitizeUrl } from '@/lib/validation'
import { ArrowLeft, Dumbbell, Play, Save, Trash2, AlertCircle, Video } from 'lucide-react'
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
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('Peito')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Prévia dinâmica do YouTube
  const detectedId = extractYoutubeId(youtubeUrl)
  const detectedThumb = getYoutubeThumbnail(detectedId)

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
          setYoutubeUrl(
            ex.youtube_url ||
              (ex.youtube_id ? `https://www.youtube.com/watch?v=${ex.youtube_id}` : ''),
          )
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

    setSaving(true)
    try {
      const cleanUrl = sanitizeUrl(youtubeUrl)
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
          youtube_url: cleanUrl,
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
              Cadastre o movimento e vincule um vídeo do YouTube para os professores consultarem em
              aula
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
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg} value={mg}>
                  {mg}
                </option>
              ))}
            </select>
          </div>

          {/* URL do YouTube */}
          <div className="space-y-1.5">
            <Label htmlFor="youtube" className="text-sm text-white font-medium">
              Link do Vídeo no YouTube (ou ID)
            </Label>
            <div className="relative">
              <Input
                id="youtube"
                placeholder="Ex: https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="bg-[#121212] border-[#2E2E2E] text-white placeholder:text-[#8A8F98] h-12 pr-10 focus-visible:ring-primary"
              />
              <Video className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
            </div>
            <p className="text-[11px] text-[#8A8F98]">
              Aceita links diretos do YouTube (web, celular ou compartilhamento). O ID é extraído
              automaticamente.
            </p>
          </div>

          {/* Prévia do vídeo */}
          {detectedId && detectedThumb ? (
            <div className="p-3 bg-[#121212] border border-[#2E2E2E] rounded-xl space-y-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-emerald-400" /> Vídeo identificado com sucesso
                (ID: {detectedId})
              </span>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-[#2E2E2E] max-w-sm">
                <img
                  src={detectedThumb}
                  alt="Prévia YouTube"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : youtubeUrl.trim() ? (
            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Não conseguimos extrair o ID do vídeo desta URL. Verifique o link digitado.
              </span>
            </div>
          ) : null}

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
