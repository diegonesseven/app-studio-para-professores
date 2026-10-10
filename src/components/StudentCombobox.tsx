import { useState, useRef, useEffect, useMemo } from 'react'
import { Check, ChevronsUpDown, Search, User, X } from 'lucide-react'
import { Student } from '@/types'

interface StudentComboboxProps {
  students: Student[]
  value?: string
  onChange: (studentId: string, student: Student | null) => void
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  compact?: boolean
  autoFocus?: boolean
  id?: string
}

export function StudentCombobox({
  students,
  value,
  onChange,
  placeholder = 'Selecione ou digite o nome do aluno...',
  emptyText = 'Nenhum aluno encontrado',
  disabled = false,
  className = '',
  compact = false,
  autoFocus = false,
  id,
}: StudentComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === value) || null,
    [students, value],
  )

  // Filtro em tempo real, case-insensitive, sobre o nome do aluno (e telefone se houver)
  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return students
    return students.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(term)
      const phoneMatch = s.phone ? s.phone.toLowerCase().includes(term) : false
      return nameMatch || phoneMatch
    })
  }, [students, searchTerm])

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (st: Student) => {
    onChange(st.id, st)
    setSearchTerm('')
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('', null)
    setSearchTerm('')
    if (isOpen) {
      inputRef.current?.focus()
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Gatilho / Campo visível */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (disabled) return
          if (!isOpen) {
            setIsOpen(true)
            setTimeout(() => inputRef.current?.focus(), 30)
          }
        }}
        onKeyDown={(e) => {
          if (disabled) return
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault()
            if (!isOpen) {
              setIsOpen(true)
              setTimeout(() => inputRef.current?.focus(), 30)
            }
          } else if (e.key === 'Escape') {
            setIsOpen(false)
            setSearchTerm('')
          }
        }}
        className={`w-full flex items-center justify-between gap-2 bg-[#121212] border border-[#2E2E2E] text-white rounded-md transition-all cursor-pointer select-none ${
          compact ? 'h-9 px-2 text-xs' : 'h-12 px-3 text-sm'
        } ${isOpen ? 'ring-2 ring-primary border-primary' : 'hover:border-[#444444]'} ${
          disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
        }`}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <User className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[#8A8F98] shrink-0`} />
          {selectedStudent ? (
            <span className="truncate font-medium text-white">
              {selectedStudent.name}
              {selectedStudent.phone && (
                <span className="text-[#8A8F98] ml-1.5 font-normal text-xs">
                  ({selectedStudent.phone})
                </span>
              )}
            </span>
          ) : (
            <span className="text-[#8A8F98] truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedStudent && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded text-[#8A8F98] hover:text-white hover:bg-[#222222] transition-colors"
              title="Limpar seleção"
              aria-label="Limpar seleção"
            >
              <X className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            </button>
          )}
          <ChevronsUpDown className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-[#8A8F98]`} />
        </div>
      </div>

      {/* Popover flutuante com campo de busca em tempo real e lista filtrada */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#1E1E1E] border border-[#2E2E2E] rounded-xl shadow-2xl p-2 space-y-2 animate-fade-in"
          style={{ minWidth: '260px' }}
        >
          {/* Input de digitação / autocomplete */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A8F98]" />
            <input
              ref={inputRef}
              type="text"
              autoFocus={autoFocus}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false)
                  setSearchTerm('')
                } else if (e.key === 'Enter' && filteredStudents.length > 0) {
                  e.preventDefault()
                  handleSelect(filteredStudents[0])
                }
              }}
              placeholder="Digite parte do nome..."
              className="w-full h-10 pl-8 pr-8 bg-[#121212] border border-[#2E2E2E] text-white placeholder:text-[#8A8F98] rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  inputRef.current?.focus()
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A8F98] hover:text-white p-1"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista com scroll */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5" role="listbox">
            {filteredStudents.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8A8F98]">{emptyText}</div>
            ) : (
              filteredStudents.map((st) => {
                const isSelected = st.id === value
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelect(st)}
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-primary/20 text-white font-bold border border-primary/40'
                        : 'hover:bg-[#2A2A2A] text-white'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="truncate">{st.name}</span>
                      {st.phone && (
                        <span className="text-[10px] text-[#8A8F98] font-normal truncate">
                          {st.phone}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
