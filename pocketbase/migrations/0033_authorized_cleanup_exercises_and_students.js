migrate(
  (app) => {
    // LIMPEZA COMPLETA E AUTORIZADA DE DADOS (apenas registros DML, nenhum schema é alterado).
    // O usuário solicitou limpar todo o acervo de exercícios e todos os alunos
    // para recomeçar cadastrando as fichas primeiro e subindo os vídeos manualmente depois.
    //
    // Contas de usuários (admin e professores) e configurações (app_settings) ficam 100% INTACTOS.

    try {
      // 1. Excluir avaliações físicas vinculadas a alunos
      app.db().newQuery('DELETE FROM physical_assessments').execute()

      // 2. Excluir histórico de treinos e progresso de sessões
      app.db().newQuery('DELETE FROM workout_progress').execute()

      // 3. Excluir todas as fichas de treino
      app.db().newQuery('DELETE FROM training_sheets').execute()

      // 4. Excluir todos os alunos
      app.db().newQuery('DELETE FROM students').execute()

      // 5. Excluir todos os exercícios do acervo
      app.db().newQuery('DELETE FROM exercises').execute()

      const remainingExercises = app.countRecords('exercises')
      const remainingStudents = app.countRecords('students')
      const remainingSheets = app.countRecords('training_sheets')
      const remainingProgress = app.countRecords('workout_progress')
      const remainingAssessments = app.countRecords('physical_assessments')

      console.log(
        'LIMPEZA_CONCLUIDA: exercises=' +
          remainingExercises +
          ', students=' +
          remainingStudents +
          ', sheets=' +
          remainingSheets +
          ', progress=' +
          remainingProgress +
          ', assessments=' +
          remainingAssessments,
      )
    } catch (e) {
      console.log('Erro na limpeza autorizada de registros:', e)
      throw e
    }
  },
  () => {
    // Reversão de limpeza de dados não aplicável
  },
)
