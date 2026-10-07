migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Admin Diego Moreira
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'moreiradiego.seven@gmail.com')
      admin.set('role', 'admin')
      admin.set('name', 'Diego Moreira')
      app.save(admin)
    } catch (_) {
      const admin = new Record(users)
      admin.setEmail('moreiradiego.seven@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Diego Moreira')
      admin.set('role', 'admin')
      app.save(admin)
    }

    // 2. Professor Bru
    try {
      const prof = app.findAuthRecordByEmail('_pb_users_auth_', 'professor@studiobru.com.br')
      prof.set('role', 'professor')
      prof.set('name', 'Professor Bru')
      app.save(prof)
    } catch (_) {
      const prof = new Record(users)
      prof.setEmail('professor@studiobru.com.br')
      prof.setPassword('Skip@Pass')
      prof.setVerified(true)
      prof.set('name', 'Professor Bru')
      prof.set('role', 'professor')
      app.save(prof)
    }

    // 3. Seed de Exercícios
    const exercisesCol = app.findCollectionByNameOrId('exercises')
    const sampleExercises = [
      {
        name: 'Agachamento Livre',
        muscle_group: 'Pernas',
        youtube_id: 'aclHkVaku9U',
        youtube_url: 'https://www.youtube.com/watch?v=aclHkVaku9U',
        thumbnail_url: 'https://img.youtube.com/vi/aclHkVaku9U/hqdefault.jpg',
      },
      {
        name: 'Supino Reto',
        muscle_group: 'Peito',
        youtube_id: 'rT7DgCr-3pg',
        youtube_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
        thumbnail_url: 'https://img.youtube.com/vi/rT7DgCr-3pg/hqdefault.jpg',
      },
      {
        name: 'Remada Curvada',
        muscle_group: 'Costas',
        youtube_id: 'G8l_8chR5BE',
        youtube_url: 'https://www.youtube.com/watch?v=G8l_8chR5BE',
        thumbnail_url: 'https://img.youtube.com/vi/G8l_8chR5BE/hqdefault.jpg',
      },
      {
        name: 'Desenvolvimento Militar',
        muscle_group: 'Ombros',
        youtube_id: '2yjwXTZQDDI',
        youtube_url: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
        thumbnail_url: 'https://img.youtube.com/vi/2yjwXTZQDDI/hqdefault.jpg',
      },
      {
        name: 'Rosca Direta',
        muscle_group: 'Bíceps',
        youtube_id: 'ykJmrZ5v0Oo',
        youtube_url: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
        thumbnail_url: 'https://img.youtube.com/vi/ykJmrZ5v0Oo/hqdefault.jpg',
      },
      {
        name: 'Tríceps Corda',
        muscle_group: 'Tríceps',
        youtube_id: 'vB5OHsJ3EME',
        youtube_url: 'https://www.youtube.com/watch?v=vB5OHsJ3EME',
        thumbnail_url: 'https://img.youtube.com/vi/vB5OHsJ3EME/hqdefault.jpg',
      },
      {
        name: 'Prancha Isométrica',
        muscle_group: 'Abdômen',
        youtube_id: 'ASdvN_XEl_c',
        youtube_url: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
        thumbnail_url: 'https://img.youtube.com/vi/ASdvN_XEl_c/hqdefault.jpg',
      },
      {
        name: 'Afundo com Halteres',
        muscle_group: 'Pernas',
        youtube_id: 'QOVaHwm-Q6U',
        youtube_url: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
        thumbnail_url: 'https://img.youtube.com/vi/QOVaHwm-Q6U/hqdefault.jpg',
      },
      {
        name: 'Elevação Pélvica',
        muscle_group: 'Glúteos',
        youtube_id: 'SEdqd1n0cvg',
        youtube_url: 'https://www.youtube.com/watch?v=SEdqd1n0cvg',
        thumbnail_url: 'https://img.youtube.com/vi/SEdqd1n0cvg/hqdefault.jpg',
      },
      {
        name: 'Leg Press 45',
        muscle_group: 'Pernas',
        youtube_id: 'IZxyjW7MPJQ',
        youtube_url: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
        thumbnail_url: 'https://img.youtube.com/vi/IZxyjW7MPJQ/hqdefault.jpg',
      },
      {
        name: 'Cadeira Extensora',
        muscle_group: 'Pernas',
        youtube_id: 'YyvSfV-75bE',
        youtube_url: 'https://www.youtube.com/watch?v=YyvSfV-75bE',
        thumbnail_url: 'https://img.youtube.com/vi/YyvSfV-75bE/hqdefault.jpg',
      },
      {
        name: 'Caminhada Inclinada / Esteira',
        muscle_group: 'Cardio',
        youtube_id: 'k6wzN9rOQ30',
        youtube_url: 'https://www.youtube.com/watch?v=k6wzN9rOQ30',
        thumbnail_url: 'https://img.youtube.com/vi/k6wzN9rOQ30/hqdefault.jpg',
      },
    ]

    const exerciseMap = {}
    sampleExercises.forEach((ex) => {
      try {
        const rec = app.findFirstRecordByData('exercises', 'name', ex.name)
        exerciseMap[ex.name] = rec.id
      } catch (_) {
        const rec = new Record(exercisesCol)
        rec.set('name', ex.name)
        rec.set('muscle_group', ex.muscle_group)
        rec.set('youtube_id', ex.youtube_id)
        rec.set('youtube_url', ex.youtube_url)
        rec.set('thumbnail_url', ex.thumbnail_url)
        app.save(rec)
        exerciseMap[ex.name] = rec.id
      }
    })

    // 4. Seed de Alunos
    const studentsCol = app.findCollectionByNameOrId('students')
    const sampleStudents = [
      {
        name: 'Ana Souza',
        birthdate: '1992-04-15 00:00:00.000Z',
        phone: '(11) 98765-4321',
        general_observations: 'Prefere treinos matutinos, foca em postura e resistência.',
        health_history: 'Sem histórico de cardiopatia ou hipertensão.',
        injuries:
          'Tendinite leve no punho direito (evitar sobrecarga excessiva em flexão de punho).',
        surgeries: 'Nenhuma cirurgia relatada.',
        restrictions: 'Evitar flexão extrema de punho com alta carga.',
        goals: ['Condicionamento', 'Hipertrofia'],
        experience_level: 'Intermediário',
        teacher_observations: 'Boa consciência corporal e pontualidade exemplar.',
      },
      {
        name: 'Carlos Lima',
        birthdate: '1985-09-22 00:00:00.000Z',
        phone: '(11) 97654-3210',
        general_observations:
          'Executivo, rotina intensa de viagens, busca alívio de estresse e perda de gordura.',
        health_history: 'Colesterol levemente alterado, acompanhado por médico.',
        injuries: 'Desconforto lombar L5-S1 após longos períodos sentado.',
        surgeries: 'Artroscopia joelho esquerdo em 2018 (recuperação completa).',
        restrictions: 'Aquecimento lombar obrigatório antes de cargas axiais.',
        goals: ['Emagrecimento', 'Condicionamento'],
        experience_level: 'Iniciante',
        teacher_observations:
          'Necessita reforço constante no core abdominal e ativação de glúteos.',
      },
      {
        name: 'Mariana Costa',
        birthdate: '1998-11-03 00:00:00.000Z',
        phone: '(11) 99123-4567',
        general_observations: 'Treina 4x na semana, foco em membros inferiores e glúteos.',
        health_history: 'Histórico de pressão baixa em dias quentes.',
        injuries: 'Nenhuma lesão ativa.',
        surgeries: 'Nenhuma.',
        restrictions: 'Hidratação constante e intervalos controlados.',
        goals: ['Hipertrofia', 'Reabilitação'],
        experience_level: 'Avançado',
        teacher_observations: 'Excelente técnica de execução e alta tolerância a esforço.',
      },
      {
        name: 'Bruno Silva',
        birthdate: '1990-01-30 00:00:00.000Z',
        phone: '(11) 98234-5678',
        general_observations: 'Praticante de corrida de rua aos finais de semana.',
        health_history: 'Excelente condicionamento cardiovascular.',
        injuries: 'Fascite plantar curada há 6 meses.',
        surgeries: 'Nenhuma.',
        restrictions: 'Manter alongamento da cadeia posterior.',
        goals: ['Condicionamento', 'Hipertrofia'],
        experience_level: 'Intermediário',
        teacher_observations: 'Treino focado em fortalecimento funcional para suporte de corrida.',
      },
    ]

    const studentMap = {}
    sampleStudents.forEach((st) => {
      try {
        const rec = app.findFirstRecordByData('students', 'name', st.name)
        studentMap[st.name] = rec.id
      } catch (_) {
        const rec = new Record(studentsCol)
        rec.set('name', st.name)
        rec.set('birthdate', st.birthdate)
        rec.set('phone', st.phone)
        rec.set('general_observations', st.general_observations)
        rec.set('health_history', st.health_history)
        rec.set('injuries', st.injuries)
        rec.set('surgeries', st.surgeries)
        rec.set('restrictions', st.restrictions)
        rec.set('goals', st.goals)
        rec.set('experience_level', st.experience_level)
        rec.set('teacher_observations', st.teacher_observations)
        app.save(rec)
        studentMap[st.name] = rec.id
      }
    })

    // 5. Seed de Fichas de Treino para os alunos
    const sheetsCol = app.findCollectionByNameOrId('training_sheets')
    const anaId = studentMap['Ana Souza']
    const carlosId = studentMap['Carlos Lima']
    const marianaId = studentMap['Mariana Costa']

    if (anaId) {
      try {
        app.findFirstRecordByData('training_sheets', 'student', anaId)
      } catch (_) {
        const sheetAna = new Record(sheetsCol)
        sheetAna.set('student', anaId)
        sheetAna.set('title', 'Ficha Hipertrofia & Força Geral')
        sheetAna.set('notes', 'Priorizar cadência 2-0-2 e respiração cadenciada')
        sheetAna.set('series_data', {
          A: [
            {
              exercise_id: exerciseMap['Agachamento Livre'] || '',
              sets: 4,
              reps: '10 a 12',
              time: '60s',
              load: '30kg',
              notes: 'Manter peito aberto',
              order: 1,
            },
            {
              exercise_id: exerciseMap['Leg Press 45'] || '',
              sets: 3,
              reps: '12',
              time: '60s',
              load: '120kg',
              notes: 'Amplitude máxima segura',
              order: 2,
            },
            {
              exercise_id: exerciseMap['Cadeira Extensora'] || '',
              sets: 3,
              reps: '15',
              time: '45s',
              load: '35kg',
              notes: 'Pausa de 1s no pico de contração',
              order: 3,
            },
            {
              exercise_id: exerciseMap['Prancha Isométrica'] || '',
              sets: 3,
              reps: '40s',
              time: '45s',
              load: 'Corporal',
              notes: 'Core travado',
              order: 4,
            },
          ],
          B: [
            {
              exercise_id: exerciseMap['Supino Reto'] || '',
              sets: 4,
              reps: '10',
              time: '60s',
              load: '14kg halteres',
              notes: 'Pegada neutra recomendada',
              order: 1,
            },
            {
              exercise_id: exerciseMap['Desenvolvimento Militar'] || '',
              sets: 3,
              reps: '12',
              time: '60s',
              load: '8kg halteres',
              notes: 'Sem hiperextender lombar',
              order: 2,
            },
            {
              exercise_id: exerciseMap['Tríceps Corda'] || '',
              sets: 3,
              reps: '12 a 15',
              time: '45s',
              load: '20kg polia',
              notes: 'Abrir no final',
              order: 3,
            },
          ],
          C: [
            {
              exercise_id: exerciseMap['Remada Curvada'] || '',
              sets: 4,
              reps: '10 a 12',
              time: '60s',
              load: '25kg',
              notes: 'Coluna ereta alinhada',
              order: 1,
            },
            {
              exercise_id: exerciseMap['Rosca Direta'] || '',
              sets: 3,
              reps: '12',
              time: '45s',
              load: '7kg',
              notes: 'Cotovelos estáveis',
              order: 2,
            },
            {
              exercise_id: exerciseMap['Caminhada Inclinada / Esteira'] || '',
              sets: 1,
              reps: '20min',
              time: '20min',
              load: 'Inclin. 6%',
              notes: 'Cardio aeróbio moderado',
              order: 3,
            },
          ],
          D: [
            {
              exercise_id: exerciseMap['Elevação Pélvica'] || '',
              sets: 4,
              reps: '12 a 15',
              time: '60s',
              load: '40kg barra',
              notes: 'Segurar 2s no topo',
              order: 1,
            },
            {
              exercise_id: exerciseMap['Afundo com Halteres'] || '',
              sets: 3,
              reps: '10 por perna',
              time: '60s',
              load: '10kg',
              notes: 'Passada firme',
              order: 2,
            },
          ],
          E: [],
        })
        app.save(sheetAna)
      }
    }

    if (carlosId) {
      try {
        app.findFirstRecordByData('training_sheets', 'student', carlosId)
      } catch (_) {
        const sheetCarlos = new Record(sheetsCol)
        sheetCarlos.set('student', carlosId)
        sheetCarlos.set('title', 'Ficha Condicionamento & Core')
        sheetCarlos.set('notes', 'Aquecimento lombar obrigatório')
        sheetCarlos.set('series_data', {
          A: [
            {
              exercise_id: exerciseMap['Agachamento Livre'] || '',
              sets: 3,
              reps: '12',
              time: '60s',
              load: '20kg',
              notes: 'Enfatizar postura ereta',
              order: 1,
            },
            {
              exercise_id: exerciseMap['Elevação Pélvica'] || '',
              sets: 3,
              reps: '15',
              time: '45s',
              load: '20kg',
              notes: 'Ativação glútea',
              order: 2,
            },
            {
              exercise_id: exerciseMap['Prancha Isométrica'] || '',
              sets: 4,
              reps: '30s',
              time: '30s',
              load: 'Corporal',
              notes: 'Manter pelve neutra',
              order: 3,
            },
          ],
          B: [
            {
              exercise_id: exerciseMap['Supino Reto'] || '',
              sets: 3,
              reps: '12',
              time: '60s',
              load: '12kg halteres',
              notes: 'Controle de descida',
              order: 1,
            },
            {
              exercise_id: exerciseMap['Remada Curvada'] || '',
              sets: 3,
              reps: '12',
              time: '60s',
              load: '20kg',
              notes: 'Não curvar a lombar',
              order: 2,
            },
            {
              exercise_id: exerciseMap['Caminhada Inclinada / Esteira'] || '',
              sets: 1,
              reps: '25min',
              time: '25min',
              load: 'Inclin. 4%',
              notes: 'Ritmo contínuo',
              order: 3,
            },
          ],
          C: [],
          D: [],
          E: [],
        })
        app.save(sheetCarlos)
      }
    }

    if (marianaId) {
      try {
        app.findFirstRecordByData('training_sheets', 'student', marianaId)
      } catch (_) {
        const sheetMariana = new Record(sheetsCol)
        sheetMariana.set('student', marianaId)
        sheetMariana.set('title', 'Ficha Força e Glúteos Especial')
        sheetMariana.set('notes', 'Treino de alta intensidade com cargas progressivas')
        sheetMariana.set('series_data', {
          A: [
            {
              exercise_id: exerciseMap['Elevação Pélvica'] || '',
              sets: 4,
              reps: '10 a 12',
              time: '60s',
              load: '60kg',
              notes: 'Pausa de 2s em cima',
              order: 1,
            },
            {
              exercise_id: exerciseMap['Afundo com Halteres'] || '',
              sets: 4,
              reps: '10 cada',
              time: '60s',
              load: '14kg halteres',
              notes: 'Tronco ligeiramente inclinado',
              order: 2,
            },
            {
              exercise_id: exerciseMap['Leg Press 45'] || '',
              sets: 3,
              reps: '12',
              time: '60s',
              load: '140kg',
              notes: 'Pés altos na plataforma',
              order: 3,
            },
          ],
          B: [
            {
              exercise_id: exerciseMap['Desenvolvimento Militar'] || '',
              sets: 3,
              reps: '10',
              time: '60s',
              load: '10kg',
              notes: 'Ombros e tríceps',
              order: 1,
            },
            {
              exercise_id: exerciseMap['Tríceps Corda'] || '',
              sets: 3,
              reps: '12',
              time: '45s',
              load: '22kg',
              notes: 'Foco na extensão completa',
              order: 2,
            },
            {
              exercise_id: exerciseMap['Prancha Isométrica'] || '',
              sets: 3,
              reps: '45s',
              time: '45s',
              load: 'Corporal',
              notes: 'Estabilidade',
              order: 3,
            },
          ],
          C: [],
          D: [],
          E: [],
        })
        app.save(sheetMariana)
      }
    }
  },
  (app) => {
    // Rollback opcional
  },
)
