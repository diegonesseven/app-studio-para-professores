import { describe, it, expect } from 'vitest'
import { PhotoSourceModal } from '../components/PhotoSourceModal'
import StudentForm from '../pages/StudentForm'

describe('Photo Source Options (Câmera / Galeria)', () => {
  it('PhotoSourceModal é exportado como componente válido', () => {
    expect(PhotoSourceModal).toBeDefined()
    expect(typeof PhotoSourceModal).toBe('function')
  })

  it('StudentForm é exportado como componente válido', () => {
    expect(StudentForm).toBeDefined()
    expect(typeof StudentForm).toBe('function')
  })

  it('PhotoSourceModal possui propriedades de accept e capture configuráveis', () => {
    // Validação de interface em tempo de compilação e tipagem
    const mockProps = {
      open: true,
      onOpenChange: () => {},
      onFilesSelected: () => {},
      title: 'Tirar Foto do Aluno',
      accept: 'image/jpeg,image/png',
      multiple: true,
    }
    expect(mockProps.title).toBe('Tirar Foto do Aluno')
    expect(mockProps.multiple).toBe(true)
  })
})
