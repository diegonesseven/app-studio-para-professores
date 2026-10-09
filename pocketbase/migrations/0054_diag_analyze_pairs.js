migrate(
  (app) => {
    // Diagnosticar quantos treinos/fichas usam cada par
    // E verificar se algum dos 17 pares é uma duplicidade semântica
    // Pares:
    // P0: "Abdominal Supra Solo" <===> "Abdominal Supra Total" -> DIFERENTES (solo é curto no chão, total é completo até em cima)
    // P1: "Abdominal Supra Total" <===> "Abdominal Supra Total com AP" -> Total vs Total com Apoio dos Pés (AP)
    // P2: "Alongamento / Revezar" <===> "Alongamentos / Revezar" -> DUPLICADO ÓBVIO!
    // P3: "Crucifixo Halter" <===> "Crucifixo Halter Invertido" -> DIFERENTES (peito vs posterior de ombro)
    // P4: "Crucifixo Halter" <===> "Crucifixo Máquina" -> DIFERENTES (halter vs máquina)
    // P5: "Elevação Lateral Halter" <===> "Elevação Lateral Simultaneo Halter" -> No Studio Bru Oliveira, "Elevação Lateral Halter" e "Elevação Lateral Simultaneo Halter" são ambos elevação lateral com halteres simultâneos!
    // P6: "Flexora Deitado" <===> "Flexora Simult." -> Mesa flexora deitado simultâneo vs flexora simultânea
    // P7: "Flexora Simul 2 Tempos" <===> "Flexora Simult." -> Variação 2 tempos
    // P8: "Prancha Isométrica" <===> "Prancha Ventral" -> Prancha ventral isométrica!
    // P9: "Remada Curvada Halter" <===> "Remada Curvada Pronado Aberto (Halter)" -> Remada curvada com halter
    // P10: "Remada Curvada Supinada" <===> "Remada Curvada Polia Peg Supinada Barra P"
    // P11: "Rosca Direta Barra" <===> "Rosca Direta Polia" -> barra vs polia (diferentes)
    // P12: "Rosca Direta Halter" <===> "Rosca Martelo Halter" -> supina vs neutra (diferentes)
    // P13: "Supino Inclinado Halter" <===> "Supino Inclinado Smith" -> halter vs smith (diferentes)
    // P14: "Supino Reto Barra" <===> "Supino Reto Halter" -> barra vs halter (diferentes)
    // P15: "Tríceps Polia Barra V" <===> "Tríceps Polia Corda" -> barra V vs corda (diferentes)
    // P16: "Voador" <===> "Voador Unilateral" -> bilateral vs unilateral (diferentes)

    // Vamos salvar no diagRec todas as chaves diag_p_* para verificação
    const list = []
    for (let i = 0; i < 17; i++) {
      try {
        const r = app.findFirstRecordByData('app_settings', 'key', 'diag_p_' + i)
        list.push(r.getString('studio_name'))
      } catch (_) {}
    }
    const diagRec = app.findFirstRecordByData('app_settings', 'key', 'diag_exercises')
    diagRec.set('studio_name', 'PAIRS_OK')
    diagRec.set('primary_color', list[2] || '') // Deve ser Alongamento / Revezar <===> Alongamentos / Revezar
    diagRec.set('background_color', list[5] || '') // Elevação Lateral Halter <===> Elevação Lateral Simultaneo Halter
    diagRec.set('surface_color', list[8] || '') // Prancha Isométrica <===> Prancha Ventral
    app.save(diagRec)
  },
  () => {},
)
