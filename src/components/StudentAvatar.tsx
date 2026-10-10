import { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

export interface StudentAvatarProps {
  student?: {
    id?: string
    name?: string
    photo?: string
    collectionId?: string
    collectionName?: string
  } | null
  /** Nome direto (caso o objeto aluno não seja passado) */
  name?: string
  /** Foto direta (caso o objeto aluno não seja passado) */
  photo?: string
  /** Classes CSS aplicadas ao container circular (tamanho, borda, etc.) */
  className?: string
  /** Classes adicionais para o texto com as iniciais */
  textClassName?: string
  /** Alt customizado para acessibilidade da imagem */
  alt?: string
}

/**
 * Componente unificado de avatar do aluno.
 * - Exibe a foto do aluno dentro de um círculo com corte retrato (object-cover) preenchendo todo o espaço sem distorcer.
 * - Constrói a URL do PocketBase com pb.files.getURL(record, fieldName).
 * - Se não houver foto cadastrada (ou em caso de falha de carregamento), exibe as iniciais do nome dentro do círculo.
 */
export function StudentAvatar({
  student,
  name: directName,
  photo: directPhoto,
  className,
  textClassName,
  alt,
}: StudentAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const rawName = (directName !== undefined ? directName : student?.name) || ''
  const trimmedName = rawName.trim()
  const photo = directPhoto !== undefined ? directPhoto : student?.photo

  const initials = trimmedName
    ? trimmedName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : '?'

  let photoUrl = ''
  if (photo && !imageError) {
    // Se a foto já for uma URL completa (ex: blob:, data: ou http), usa direto
    if (
      photo.startsWith('http://') ||
      photo.startsWith('https://') ||
      photo.startsWith('blob:') ||
      photo.startsWith('data:')
    ) {
      photoUrl = photo
    } else {
      try {
        const record = {
          id: student?.id || '',
          collectionId: student?.collectionId || 'students',
          collectionName: student?.collectionName || 'students',
        }
        photoUrl = pb.files.getURL(record as any, photo)
      } catch {
        photoUrl = ''
      }
    }
  }

  return (
    <div
      className={cn(
        'w-11 h-11 rounded-full bg-gradient-to-tr from-[#2A2A2A] to-[#3A3A3A] border border-primary/30 text-primary font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden select-none',
        className,
      )}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={alt || trimmedName || 'Foto do aluno'}
          className="w-full h-full object-cover object-center"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <span className={cn('leading-none select-none', textClassName)}>{initials}</span>
      )}
    </div>
  )
}

export default StudentAvatar
