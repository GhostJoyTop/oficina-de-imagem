/* ==========================================================================
   OFICINA DE IMAGEM — a Régua de Ordem
   Dono: Construtor B. Arquivo separado de propósito: esta é a exigência do
   autor ("me ajudar a colocar na ordem de prioridade correta das tags") e
   precisa poder ser atacada sozinha.

   O que este arquivo faz, e só isto:
     - dá a cada tag um número de balde (a prioridade dela);
     - reordena a lista, de forma ESTÁVEL (empate mantém a ordem de escolha);
     - respeita cadeado (tag travada não sai do lugar);
     - devolve, para CADA tag que mudou de lugar, o motivo em português;
     - separa preferência (sugestão) de regra do motor (alerta vermelho).

   Este arquivo NUNCA reordena sozinho. Ele só calcula e explica. Quem aplica
   é o autor, clicando em "Usar a ordem sugerida".
   ========================================================================== */

(function (global) {
  "use strict";

  /* ---------------------------------------------------------------
     Os baldes. Cada tag cai num deles, pelo campo `ordem` do acervo.
     Múltiplos de cinco e dez, com espaço para encaixar coisa nova.
     --------------------------------------------------------------- */

  var BALDES_PADRAO = [
    { n: 10,  nome: "assunto e contagem",   porque: "quem está na imagem é a primeira coisa que a IA decide" },
    { n: 20,  nome: "enquadramento",        porque: "o recorte define o que cabe no quadro, então vem cedo" },
    { n: 30,  nome: "ângulo de câmera",     porque: "o ângulo vem junto do recorte, pelo mesmo motivo" },
    { n: 40,  nome: "cabelo",               porque: "a aparência entra em ordem fixa: cabelo, olhos, pele, corpo" },
    { n: 45,  nome: "olhos",                porque: "a aparência entra em ordem fixa: cabelo, olhos, pele, corpo" },
    { n: 50,  nome: "pele e rosto",         porque: "a aparência entra em ordem fixa: cabelo, olhos, pele, corpo" },
    { n: 55,  nome: "corpo",                porque: "a aparência entra em ordem fixa: cabelo, olhos, pele, corpo" },
    { n: 60,  nome: "roupa da cabeça",      porque: "o manual manda descrever a roupa peça por peça, de cima para baixo" },
    { n: 62,  nome: "roupa do tronco",      porque: "o manual manda descrever a roupa peça por peça, de cima para baixo" },
    { n: 64,  nome: "roupa das pernas",     porque: "o manual manda descrever a roupa peça por peça, de cima para baixo" },
    { n: 66,  nome: "calçado",              porque: "o manual manda descrever a roupa peça por peça, de cima para baixo" },
    { n: 68,  nome: "acessório",            porque: "acessório vem depois das peças principais da roupa" },
    { n: 70,  nome: "pose e ação",          porque: "o que o corpo faz vem depois de como ele é" },
    { n: 80,  nome: "cena, lugar, luz e clima", porque: "o cenário pesa menos que o personagem" },
    { n: 90,  nome: "estilo",               porque: "tag de estilo muda a imagem inteira, então pesa mais perto do começo" },
    { n: 95,  nome: "efeitos especiais",    porque: "o efeito é acabamento: entra depois do estilo" },
    { n: 98,  nome: "qualidade e estética", porque: "é etiqueta de qualidade, e o manual a coloca por último" },
    { n: 999, nome: "o bloco de texto",     porque: "o Text: tem de ser a última coisa do prompt — isso é regra do motor, não preferência" }
  ];

  // Os dois modos, e o motivo de existirem dois. O manual se contradiz de
  // propósito: a seção 2 recomenda o assunto primeiro; a seção 4 diz que
  // estilo pesa muito e "também costuma ir cedo" — e os quatro exemplos de
  // estilo de lá começam pelo estilo. Em vez de escolher pelo autor e
  // esconder, a oficina oferece os dois.
  var MODOS = {
    padrao: {
      id: "padrao",
      nome: "Padrão do manual",
      resumo: "O assunto vem primeiro, o estilo perto do fim. É a ordem que a documentação recomenda na seção 2.",
      remapa: {}
    },
    estilo_primeiro: {
      id: "estilo_primeiro",
      nome: "Estilo em primeiro",
      resumo: "O bloco de estilo abre o prompt. É o que os quatro exemplos de estilo do manual fazem na prática.",
      remapa: { 90: 6, 95: 8 }
    }
  };

  /* ---------------------------------------------------------------
     Leitura defensiva do acervo de regras (dono: Construtor A).
     Se ele publicar uma tabela de baldes, ela vence a daqui. Se não
     publicar, ou publicar em outro formato, seguimos com a de cima —
     a tela nunca fica sem ordenação por causa disso.
     --------------------------------------------------------------- */

  function baldesDoAcervo() {
    var r = global.OFICINA_REGRAS;
    if (!r) return null;
    var cand = r.baldes || (r.ordens && r.ordens.baldes) || (r.ordem && r.ordem.baldes) || r.prioridade;
    if (!cand || !cand.length) return null;
    var saida = [];
    for (var i = 0; i < cand.length; i++) {
      var b = cand[i];
      var n = b.n !== undefined ? b.n : (b.numero !== undefined ? b.numero : b.ordem);
      var nome = b.nome || b.rotulo || b.label;
      if (typeof n !== "number" || !nome) return null; // formato diferente: não arrisca
      saida.push({ n: n, nome: nome, porque: b.porque || b.motivo || "" });
    }
    return saida;
  }

  function tabela() {
    var doA = baldesDoAcervo();
    if (!doA) return BALDES_PADRAO.slice();
    // completa o "porque" que faltar com o texto daqui, casando pelo número
    var porN = {};
    BALDES_PADRAO.forEach(function (b) { porN[b.n] = b; });
    return doA.map(function (b) {
      return { n: b.n, nome: b.nome, porque: b.porque || (porN[b.n] ? porN[b.n].porque : "") };
    });
  }

  function descreveBalde(n) {
    var t = tabela(), i;
    for (i = 0; i < t.length; i++) { if (t[i].n === n) return t[i]; }
    // balde que o acervo criou e a tabela não conhece: descreve pelo vizinho
    var perto = null;
    for (i = 0; i < t.length; i++) {
      if (t[i].n <= n && (!perto || t[i].n > perto.n)) perto = t[i];
    }
    return perto || { n: n, nome: "grupo " + n, porque: "" };
  }

  /* ---------------------------------------------------------------
     O balde de um item, já com o modo aplicado.
     `item` é { chave, rotulo, ordem, travada }.
     --------------------------------------------------------------- */

  function baldeDe(item, modo) {
    var m = MODOS[modo] || MODOS.padrao;
    var o = typeof item.ordem === "number" ? item.ordem : 80; // sem ordem: cai na cena
    if (Object.prototype.hasOwnProperty.call(m.remapa, o)) return m.remapa[o];
    return o;
  }

  /* ---------------------------------------------------------------
     A ordenação.

     Entrada: lista de itens na ordem em que o autor montou.
       { chave: id único na lista, rotulo: o que aparece, ordem: número
         do balde vindo do acervo, travada: true/false }

     Saída:
       { ordenada:  a lista nova, na ordem sugerida
         movimentos: [{ chave, rotulo, de, para, motivo }] só do que mudou
         alertas:   [{ nivel, texto }] regra do motor quebrada por cadeado
         mexeu:     true/false }
     --------------------------------------------------------------- */

  function ordenar(itens, opc) {
    opc = opc || {};
    var modo = opc.modo || "padrao";
    var lista = (itens || []).slice();
    var n = lista.length;

    var comIndice = lista.map(function (it, i) {
      return { it: it, i: i, b: baldeDe(it, modo) };
    });

    var livres = comIndice.filter(function (x) { return !x.it.travada; });
    livres.sort(function (a, b) {
      if (a.b !== b.b) return a.b - b.b;
      return a.i - b.i;                 // empate no balde: mantém a escolha
    });

    var saida = new Array(n);
    comIndice.forEach(function (x) { if (x.it.travada) saida[x.i] = x; });

    var k = 0;
    for (var i = 0; i < n; i++) {
      if (!saida[i]) { saida[i] = livres[k]; k += 1; }
    }

    var movimentos = [];
    saida.forEach(function (x, novoIdx) {
      if (!x) return;
      if (x.i === novoIdx) return;
      movimentos.push({
        chave: x.it.chave,
        rotulo: x.it.rotulo,
        de: x.i,
        para: novoIdx,
        balde: x.b,
        motivo: motivoDe(x.it, x.b, x.i, novoIdx)
      });
    });

    return {
      ordenada: saida.map(function (x) { return x.it; }),
      movimentos: movimentos,
      alertas: alertasDeTrava(saida, modo),
      mexeu: movimentos.length > 0,
      modo: modo
    };
  }

  function motivoDe(item, balde, de, para) {
    var d = descreveBalde(balde);
    var direcao = para < de ? "subiu" : "desceu";
    var alvo = para < de ? "mais para o começo" : "mais para o fim";
    var txt = "“" + item.rotulo + "” " + direcao + " " + alvo +
      " — é " + d.nome;
    if (d.porque) txt += ", e " + d.porque;
    return txt + ".";
  }

  /* ---------------------------------------------------------------
     Regra do motor × preferência.

     Preferência gera sugestão (o botão "Usar a ordem sugerida").
     Regra do motor gera alerta VERMELHO, que não se negocia — porque é
     do NovelAI, não nossa. A única que a ordem pode quebrar é a do
     bloco de texto: ele tem de ser a última coisa do prompt.
     --------------------------------------------------------------- */

  function alertasDeTrava(saida, modo) {
    var out = [];
    var n = saida.length;
    for (var i = 0; i < n; i++) {
      var x = saida[i];
      if (!x) continue;
      if (baldeDe(x.it, modo) === 999 && i !== n - 1) {
        out.push({
          nivel: "vermelho",
          texto: "O bloco de texto “" + x.it.rotulo + "” não está no fim do prompt. " +
            "Isso é regra do motor, não preferência: qualquer tag depois do Text: pode acabar " +
            "desenhada como letra na imagem. Destrave o cadeado que está segurando essa linha."
        });
      }
    }
    return out;
  }

  /* ---------------------------------------------------------------
     Autoteste — propriedades que a ordenação nunca pode violar.
     Aparece na Sala de Recursos, para o autor poder conferir sozinho.
     --------------------------------------------------------------- */

  function autoteste() {
    var casos = [];

    function reg(nome, ok, detalhe) { casos.push({ nome: nome, ok: !!ok, detalhe: detalhe || "" }); }

    function itens(defs) {
      return defs.map(function (d, i) {
        return { chave: "k" + i, rotulo: d[0], ordem: d[1], travada: !!d[2] };
      });
    }

    // 1 — não perde nem duplica tag
    var a = itens([["best quality", 98], ["1girl", 10], ["forest", 80], ["long hair", 40]]);
    var r = ordenar(a, { modo: "padrao" });
    reg("A ordenação não perde nem duplica nenhuma tag",
      r.ordenada.length === a.length &&
      a.every(function (it) { return r.ordenada.indexOf(it) >= 0; }),
      r.ordenada.map(function (x) { return x.rotulo; }).join(", "));

    // 2 — tag travada não sai do lugar
    var b = itens([["best quality", 98, true], ["1girl", 10], ["forest", 80]]);
    var rb = ordenar(b, { modo: "padrao" });
    reg("Tag com cadeado fica exatamente no mesmo lugar",
      rb.ordenada[0].rotulo === "best quality",
      rb.ordenada.map(function (x) { return x.rotulo; }).join(", "));

    // 3 — estabilidade dentro do mesmo balde
    var c = itens([["blue jacket", 62], ["white shirt", 62], ["1girl", 10]]);
    var rc = ordenar(c, { modo: "padrao" });
    reg("Empate no balde mantém a ordem em que o autor escolheu",
      rc.ordenada[1].rotulo === "blue jacket" && rc.ordenada[2].rotulo === "white shirt",
      rc.ordenada.map(function (x) { return x.rotulo; }).join(", "));

    // 4 — o bloco de texto vai para o fim
    var d = itens([["Text: olá", 999], ["1girl", 10], ["best quality", 98]]);
    var rd = ordenar(d, { modo: "padrao" });
    reg("O bloco Text: termina no fim absoluto",
      rd.ordenada[rd.ordenada.length - 1].ordem === 999 && rd.alertas.length === 0,
      rd.ordenada.map(function (x) { return x.rotulo; }).join(", "));

    // 5 — cadeado que quebra a regra do motor vira alerta vermelho
    var e = itens([["Text: olá", 999, true], ["1girl", 10]]);
    var re = ordenar(e, { modo: "padrao" });
    reg("Cadeado que tira o Text: do fim dispara alerta vermelho",
      re.alertas.length === 1 && re.alertas[0].nivel === "vermelho",
      re.alertas.length ? re.alertas[0].texto : "nenhum alerta");

    // 6 — modo "Estilo em primeiro" reproduz o exemplo oficial de aquarela
    var f = itens([
      ["traditional media", 90], ["watercolor (medium)", 90], ["painterly", 90],
      ["muted color", 90], ["1girl", 10], ["standing", 70], ["forest", 80],
      ["best quality", 98], ["very aesthetic", 98]
    ]);
    var rf = ordenar(f, { modo: "estilo_primeiro" });
    var esperado = "traditional media, watercolor (medium), painterly, muted color, 1girl, standing, forest, best quality, very aesthetic";
    var obtido = rf.ordenada.map(function (x) { return x.rotulo; }).join(", ");
    reg("“Estilo em primeiro” reproduz o exemplo oficial de aquarela",
      obtido === esperado, obtido);

    // 7 — todo movimento traz motivo escrito
    var g = itens([["best quality", 98], ["1girl", 10]]);
    var rg = ordenar(g, { modo: "padrao" });
    reg("Toda tag que muda de lugar vem com o motivo escrito",
      rg.movimentos.length > 0 && rg.movimentos.every(function (m) { return m.motivo && m.motivo.length > 20; }),
      rg.movimentos.map(function (m) { return m.motivo; }).join(" | "));

    return casos;
  }

  global.Ordenador = {
    baldes: tabela,
    balde: baldeDe,
    descreveBalde: descreveBalde,
    modos: function () { return [MODOS.padrao, MODOS.estilo_primeiro]; },
    modo: function (id) { return MODOS[id] || MODOS.padrao; },
    ordenar: ordenar,
    autoteste: autoteste
  };
})(window);
