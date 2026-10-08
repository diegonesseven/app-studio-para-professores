migrate(
  (app) => {
    // Excluir registros de teste (dados apenas, nenhum schema é alterado)
    // conforme autorizado explicitamente pelo usuário para preparação final da produção.
    try {
      // 1. Excluir avaliações físicas de teste
      app.db().newQuery('DELETE FROM physical_assessments').execute()

      // 2. Excluir histórico de treinos/progresso de teste
      app.db().newQuery('DELETE FROM workout_progress').execute()

      // 3. Excluir fichas de treino de teste
      app.db().newQuery('DELETE FROM training_sheets').execute()

      // 4. Excluir alunos de teste
      app.db().newQuery('DELETE FROM students').execute()
    } catch (e) {
      console.log('Aviso na limpeza de dados de teste:', e)
    }
  },
  () => {
    // Reversão não aplicável para limpeza de dados de teste
  },
)
