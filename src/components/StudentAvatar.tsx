import { useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { Student } from '@/types'
import { cn } from '@/lib/utils'

export interface StudentAvatarProps {
  student:
    | Pick<Student, 'id' | 'name' | 'photo' | 'collectionId' | 'collectionName'>
    | null
    | undefined
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
export function StudentAvatar({ student, className, textClassName, alt }: StudentAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const name = student?.name?.trim() || ''
  const photo = student?.photo

  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : '?'

  let photoUrl = ''
  if (photo && !imageError && student) {
    try {
      photoUrl = pb.files.getURL(student as any, photo)
    } catch {
      photoUrl = ''
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
          alt={alt || name || 'Foto do aluno'}
          className="w-full h-full object-cover object-center"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <span className={cn('leading-none', textClassName)}>{initials}</span>
      )}
    </div>
  )
}

export default StudentAvatar
