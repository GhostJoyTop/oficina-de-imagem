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

  /* ⚠ O MOTIVO TEM DE SERVIR PARA A DIREÇÃO EM QUE A TAG ANDOU.

     Isto foi um defeito real, e caro: o balde 90 guardava a frase única
     "tag de estilo muda a imagem inteira, então pesa mais perto do começo",
     e a Régua a colava tanto em "subiu" quanto em "desceu". Na tela saía,
     palavra por palavra: «“watercolor (medium)” desceu mais para o fim — é
     estilo, e tag de estilo muda a imagem inteira, então pesa mais perto do
     começo.» A ajuda se desmentia na mesma frase, e ela É a exigência do
     autor.

     Por isso cada balde pode trazer TRÊS textos:
       `porque` — serve às duas direções (é o caso da roupa, da aparência e
                  de tudo que descreve posição relativa);
       `sobe`   — usado só quando a tag foi para mais perto do começo;
       `desce`  — usado só quando a tag foi para mais perto do fim.
     Quem tem `sobe`/`desce` não usa o `porque`. Quem não tem, usa o
     `porque` nas duas — e só pode ficar sem os dois quem escreveu uma
     frase que continua verdadeira nos dois sentidos. */

  var BALDES_PADRAO = [
    { n: 10,  nome: "assunto e contagem",
      sobe:  "e quem está na imagem é a primeira coisa que a IA decide, então vem na frente",
      desce: "e neste modo o bloco de estilo abre o prompt, então quem aparece entra logo depois dele" },
    { n: 20,  nome: "enquadramento",
      sobe:  "e o recorte decide o que cabe no quadro, então entra cedo",
      desce: "e o recorte entra depois de dizer quem está na imagem" },
    { n: 25,  nome: "foco de objeto",
      sobe:  "e dizer onde a atenção fica anda junto do recorte",
      desce: "e o foco anda junto do recorte, depois de quem aparece" },
    { n: 30,  nome: "ângulo de câmera",
      sobe:  "e o ângulo anda junto do recorte, pelo mesmo motivo",
      desce: "e o ângulo entra logo depois do recorte, junto com ele" },
    { n: 40,  nome: "cabelo",               porque: "a aparência entra em ordem fixa: cabelo, olhos, pele, corpo — e o cabelo abre essa fila" },
    { n: 45,  nome: "olhos",                porque: "a aparência entra em ordem fixa: cabelo, olhos, pele, corpo — os olhos vêm depois do cabelo" },
    { n: 50,  nome: "pele e rosto",         porque: "a aparência entra em ordem fixa: cabelo, olhos, pele, corpo — a pele vem depois dos olhos" },
    { n: 55,  nome: "corpo",                porque: "a aparência entra em ordem fixa: cabelo, olhos, pele, corpo — o corpo fecha essa fila, antes da roupa" },
    { n: 60,  nome: "roupa da cabeça",      porque: "o manual manda descrever a roupa peça por peça, de cima para baixo, e a cabeça é a primeira peça" },
    { n: 62,  nome: "roupa do tronco",      porque: "o manual manda descrever a roupa peça por peça, de cima para baixo, e o tronco vem depois da cabeça" },
    { n: 64,  nome: "roupa das pernas",     porque: "o manual manda descrever a roupa peça por peça, de cima para baixo, e as pernas vêm depois do tronco" },
    { n: 66,  nome: "calçado",              porque: "o manual manda descrever a roupa peça por peça, de cima para baixo, e o calçado é a última peça" },
    { n: 68,  nome: "acessório",            porque: "acessório entra depois das peças principais da roupa" },
    { n: 70,  nome: "pose e ação",          porque: "o que o corpo faz entra depois de como ele é" },
    { n: 80,  nome: "cena, lugar, luz e clima",
      sobe:  "e o cenário entra antes do estilo e das etiquetas de qualidade",
      desce: "e o cenário entra depois do personagem, porque pesa menos que ele" },
    { n: 85,  nome: "época",
      sobe:  "e a época puxa o traço inteiro, então ela anda junto do bloco de estilo, que neste modo abre o prompt",
      desce: "e a época anda junto do bloco de estilo, que neste modo entra depois do personagem" },
    { n: 90,  nome: "estilo",
      sobe:  "e tag de estilo muda a imagem inteira, então neste modo ela abre o prompt",
      desce: "e neste modo o bloco de estilo entra depois do personagem e da cena, que é a ordem recomendada pela documentação" },
    { n: 95,  nome: "efeitos especiais",
      sobe:  "e o efeito acompanha o bloco de estilo, que neste modo vai na frente",
      desce: "e o efeito é acabamento: entra depois do estilo" },
    { n: 98,  nome: "qualidade e estética",
      sobe:  "e as etiquetas de qualidade ficam todas juntas, no fim do prompt",
      desce: "e o manual manda pôr as etiquetas de qualidade no fim de tudo" },
    { n: 999, nome: "o bloco de texto",     porque: "o Text: tem de ser a última coisa do prompt — isso é regra do motor, não preferência" }
  ];

  // Os dois modos, e o motivo de existirem dois. O manual se contradiz de
  // propósito: a seção 2 recomenda o assunto primeiro; a seção 4 diz que
  // estilo pesa muito e "também costuma ir cedo" — e os quatro exemplos de
  // estilo de lá começam pelo estilo. Em vez de escolher pelo autor e
  // esconder, a oficina oferece os dois.
  var MODOS_PADRAO = {
    padrao_manual: {
      id: "padrao_manual",
      nome: "Padrão do manual",
      resumo: "O assunto vem primeiro, o estilo perto do fim. É a ordem que a documentação recomenda na seção 2.",
      remapa: {}
    },
    estilo_primeiro: {
      id: "estilo_primeiro",
      nome: "Estilo em primeiro",
      resumo: "O bloco de estilo abre o prompt. É o que os quatro exemplos de estilo do manual fazem na prática.",
      remapa: { 85: 6, 90: 5, 95: 8 }
    }
  };

  // "padrao" continua valendo como apelido do modo do manual: era o nome
  // usado antes de o acervo publicar os ids, e trabalho salvo pode citá-lo.
  function chaveDeModo(id) {
    if (id === "padrao") return "padrao_manual";
    return id || "padrao_manual";
  }

  /* ---------------------------------------------------------------
     Leitura do acervo de regras (dono: Construtor A).

     O acervo publica os baldes em `ordens.baldes`, e cada balde traz o
     MESMO id com DOIS números: um por modo de ordenação
     (`padrao_manual` e `estilo_primeiro`). Daí sai tudo: a tabela de
     baldes e o remapa de cada modo, sem número escrito à mão aqui.

     Se o acervo não carregar, ou vier em outro formato, a tabela de cima
     assume. A tela nunca fica sem ordenação por causa disso.
     --------------------------------------------------------------- */

  function baldesDoAcervo() {
    var r = global.OFICINA_REGRAS;
    var cand = r && r.ordens && r.ordens.baldes;
    if (!cand || !cand.length) return null;
    var saida = [], i, b, n;
    for (i = 0; i < cand.length; i++) {
      b = cand[i];
      n = typeof b.padrao_manual === "number" ? b.padrao_manual
        : (b.n !== undefined ? b.n : (b.numero !== undefined ? b.numero : b.ordem));
      if (typeof n !== "number" || !b.nome) return null;  // formato diferente: não arrisca
      saida.push({
        n: n,
        nome: String(b.nome).toLowerCase(),
        porque: b.porque || b.motivo || "",
        sobe: b.sobe || "",
        desce: b.desce || "",
        por_modo: b
      });
    }
    return saida;
  }

  /* O acervo publica o número e o nome de cada balde; os textos de motivo
     são desta tela. Por isso o `sobe`/`desce`/`porque` daqui completa o que
     vier de lá, casando pelo número. Se um dia o acervo publicar os textos,
     os dele valem. */
  function tabela() {
    var doA = baldesDoAcervo();
    var porN = {};
    BALDES_PADRAO.forEach(function (b) { porN[b.n] = b; });
    if (!doA) return BALDES_PADRAO.slice();
    return doA.map(function (b) {
      var meu = porN[b.n] || {};
      return {
        n: b.n,
        nome: b.nome,
        porque: b.porque || meu.porque || "",
        sobe: b.sobe || meu.sobe || "",
        desce: b.desce || meu.desce || ""
      };
    });
  }

  /* Os modos, montados do acervo quando ele existe.

     O remapa de cada modo nasce da comparação entre as duas colunas do
     mesmo balde: onde `estilo_primeiro` difere de `padrao_manual`, entra
     uma linha de remapa. Assim, mudar a ordem é mudar o acervo. */
  function modosDoAcervo() {
    var r = global.OFICINA_REGRAS;
    var opcoes = r && r.ordens && r.ordens.opcoes;
    var baldes = r && r.ordens && r.ordens.baldes;
    if (!opcoes || !opcoes.length || !baldes || !baldes.length) return null;

    var saida = {};
    for (var i = 0; i < opcoes.length; i++) {
      var o = opcoes[i];
      if (!o.id) return null;
      var remapa = {};
      for (var j = 0; j < baldes.length; j++) {
        var b = baldes[j];
        var base = b.padrao_manual;
        var neste = b[o.id];
        if (typeof base !== "number" || typeof neste !== "number") continue;
        if (neste !== base) remapa[base] = neste;
      }
      saida[o.id] = {
        id: o.id,
        nome: o.nome || o.id,
        resumo: o.motivo || o.resumo || "",
        padrao: !!o.padrao,
        origem: o.origem || "",
        remapa: remapa
      };
    }
    return saida;
  }

  function modosTodos() {
    var doA = modosDoAcervo();
    if (doA && doA.padrao_manual) return doA;
    return MODOS_PADRAO;
  }

  function modoDe(id) {
    var m = modosTodos();
    return m[chaveDeModo(id)] || m.padrao_manual || MODOS_PADRAO.padrao_manual;
  }

  function descreveBalde(n) {
    var t = tabela(), i;
    for (i = 0; i < t.length; i++) { if (t[i].n === n) return t[i]; }
    // balde que o acervo criou e a tabela não conhece: descreve pelo vizinho
    var perto = null;
    for (i = 0; i < t.length; i++) {
      if (t[i].n <= n && (!perto || t[i].n > perto.n)) perto = t[i];
    }
    return perto || { n: n, nome: "grupo " + n, porque: "", sobe: "", desce: "" };
  }

  /* O balde ORIGINAL de um item — o número que veio do acervo, antes de
     qualquer modo mexer nele.

     A separação existe por um defeito medido: no modo "Estilo em primeiro",
     o remapa troca 90 por 5, 85 por 6 e 95 por 8, e a Régua descrevia a tag
     por esse número remapeado. A tabela não tem linha para 5, 6 nem 8, e a
     explicação virava «“watercolor (medium)” subiu mais para o começo — é
     grupo 5.» — sem nome e sem motivo, justamente no modo que as quatro
     receitas de estilo do manual usam.

     Regra, então: o número REMAPEADO ordena; o número ORIGINAL explica. */
  function baldeOriginal(item) {
    return typeof item.ordem === "number" ? item.ordem : 80;
  }

  /* ---------------------------------------------------------------
     O balde de um item, já com o modo aplicado.
     `item` é { chave, rotulo, ordem, travada }.
     --------------------------------------------------------------- */

  function baldeDe(item, modo) {
    var m = modoDe(modo);
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
    var modo = chaveDeModo(opc.modo);
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
        balde: x.b,                       // o remapeado, que ordenou
        balde_original: baldeOriginal(x.it),
        // e o ORIGINAL, que explica — ver o comentário de baldeOriginal
        motivo: motivoDe(x.it, baldeOriginal(x.it), x.i, novoIdx)
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
    var subiu = para < de;
    var direcao = subiu ? "subiu" : "desceu";
    var alvo = subiu ? "mais para o começo" : "mais para o fim";
    // o texto da direção em que ela andou; sem ele, o neutro
    var razao = (subiu ? d.sobe : d.desce) || d.porque || "";
    // os textos de direção já começam com "e"; os neutros, não
    if (razao && !/^e\s/i.test(razao)) razao = "e " + razao;
    var txt = "“" + item.rotulo + "” " + direcao + " " + alvo + " — é " + d.nome;
    if (razao) txt += ", " + razao;
    return txt + ".";
  }

  /* ---------------------------------------------------------------
     Regra do motor × preferência.

     Preferência gera sugestão (o botão "Usar a ordem sugerida"). Regra do
     motor gera alerta que não se negocia, porque é do NovelAI e não nossa.

     ATENÇÃO — o que saiu daqui, e por quê. Havia um alerta vermelho para o
     caso de o bloco `Text:` não terminar no fim do prompt. Ele era código
     morto: exigia uma tag com balde 999, e NENHUMA tag do acervo tem esse
     balde, porque o bloco de texto não é tag — quem o escreve é o
     `motor_prompt.js`, e ele o põe no fim absoluto por construção, sempre.
     Um alerta que nunca pode acender dá falsa sensação de proteção. O
     balde 999 continua existindo na tabela, para o dia em que o acervo
     criar uma tag de fim de prompt; o alerta impossível é que saiu.

     Ficou o que É alcançável: cadeado demais trava a própria Régua, e o
     autor precisa saber que foi ele que a desligou.
     --------------------------------------------------------------- */

  function alertasDeTrava(saida, modo) {
    var out = [];
    var n = saida.length;
    if (!n) return out;

    var travadas = 0, i, x;
    for (i = 0; i < n; i++) {
      x = saida[i];
      if (x && x.it.travada) travadas += 1;
    }

    if (travadas === n) {
      out.push({
        nivel: "amarelo",
        texto: "Todas as " + n + " tags estão com o cadeado fechado, então a oficina não tem " +
          "como sugerir ordem nenhuma. Abra o cadeado das que podem se mexer."
      });
      return out;
    }

    /* Cadeado que segura uma etiqueta de qualidade lá no começo: não é
       regra do motor, é preferência cara. O manual manda as etiquetas de
       qualidade no fim, e uma delas presa na frente empurra tudo o que
       importa para trás. */
    for (i = 0; i < n; i++) {
      x = saida[i];
      if (!x || !x.it.travada) continue;
      var b = baldeDe(x.it, modo);
      if (b >= 98 && i < Math.floor(n / 2)) {
        out.push({
          nivel: "amarelo",
          // aqui também: quem descreve é o balde ORIGINAL, nunca o remapeado
          texto: "A tag “" + x.it.rotulo + "” está travada perto do começo, e ela é " +
            descreveBalde(baldeOriginal(x.it)).nome + ". Tag mais perto do início pesa mais, e o manual manda " +
            "essa família para o fim. Se foi sem querer, abra o cadeado dela."
        });
      }
    }
    return out;
  }

  /* ---------------------------------------------------------------
     Qual modo reproduz um prompt já escrito?

     Serve às receitas do acervo. Elas trazem o prompt pronto, copiado do
     manual, e uma lista de tags. Dez das onze receitas mostravam um prompt
     no cartão e entregavam outro na Bancada, porque as quatro receitas de
     estilo do manual começam pelo bloco de estilo — que é o modo "Estilo
     em primeiro" — e a oficina as ordenava no modo "Padrão do manual".

     Em vez de escrever o modo à mão em cada receita, a oficina PERGUNTA:
     qual dos modos, aplicado a estas tags, devolve exatamente o prompt do
     cartão? Se algum devolve, é esse. Se nenhum devolve, quem chama
     decide o que fazer — e a tela avisa, em vez de mudar em silêncio.
     --------------------------------------------------------------- */

  function modoQueReproduz(itens, textoAlvo) {
    var alvo = String(textoAlvo || "").trim();
    if (!alvo || !itens || !itens.length) return null;
    var lista = [], k, m = modosTodos();
    for (k in m) { if (Object.prototype.hasOwnProperty.call(m, k)) lista.push(m[k]); }
    // o modo do manual é testado primeiro: no empate, ele ganha
    lista.sort(function (a, b) {
      return (a.id === "padrao_manual" ? 0 : 1) - (b.id === "padrao_manual" ? 0 : 1);
    });
    for (var i = 0; i < lista.length; i++) {
      var r = ordenar(itens, { modo: lista[i].id });
      var saiu = r.ordenada.map(function (x) { return x.rotulo; }).join(", ");
      if (saiu === alvo) return lista[i].id;
    }
    return null;
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
    reg("Empate no balde mantém a ordem em que você escolheu",
      rc.ordenada[1].rotulo === "blue jacket" && rc.ordenada[2].rotulo === "white shirt",
      rc.ordenada.map(function (x) { return x.rotulo; }).join(", "));

    // 4 — o bloco de texto vai para o fim
    var d = itens([["Text: olá", 999], ["1girl", 10], ["best quality", 98]]);
    var rd = ordenar(d, { modo: "padrao" });
    reg("O bloco Text: termina no fim absoluto",
      rd.ordenada[rd.ordenada.length - 1].ordem === 999 && rd.alertas.length === 0,
      rd.ordenada.map(function (x) { return x.rotulo; }).join(", "));

    // 5 — cadeado que segura uma etiqueta de qualidade na frente vira aviso
    var e = itens([["best quality", 98, true], ["1girl", 10], ["forest", 80], ["long hair", 40]]);
    var re = ordenar(e, { modo: "padrao" });
    reg("Etiqueta de qualidade travada no começo dispara aviso",
      re.alertas.length >= 1 && /best quality/.test(re.alertas[0].texto),
      re.alertas.length ? re.alertas[0].texto : "nenhum alerta");

    // 5b — lista inteira travada avisa que a Régua ficou sem função
    var e2 = itens([["best quality", 98, true], ["1girl", 10, true]]);
    var re2 = ordenar(e2, { modo: "padrao" });
    reg("Com tudo travado, a oficina diz que não tem o que sugerir",
      re2.alertas.length === 1 && /cadeado fechado/.test(re2.alertas[0].texto),
      re2.alertas.length ? re2.alertas[0].texto : "nenhum alerta");

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

    // 8 — a oficina descobre sozinha qual modo reproduz o prompt de uma receita
    var achou = modoQueReproduz(f,
      "traditional media, watercolor (medium), painterly, muted color, 1girl, standing, forest, best quality, very aesthetic");
    reg("A oficina descobre que a receita de aquarela é “Estilo em primeiro”",
      achou === "estilo_primeiro", String(achou));

    var achou2 = modoQueReproduz(
      itens([["1girl", 10], ["forest", 80], ["best quality", 98]]),
      "1girl, forest, best quality");
    reg("E descobre o “Padrão do manual” quando é esse o caso",
      achou2 === "padrao_manual", String(achou2));

    /* 9 — a frase não pode se desmentir.

       O caso exato que apareceu na tela: uma tag de estilo desce, e o
       motivo dizia que ela pesa mais perto do começo. */
    var h = itens([["best quality", 98], ["watercolor (medium)", 90], ["1girl", 10], ["close-up", 20]]);
    var rh = ordenar(h, { modo: "padrao_manual" });
    var desceEstilo = rh.movimentos.filter(function (m) { return /watercolor/.test(m.rotulo); })[0];
    reg("Tag que DESCE não é explicada dizendo que ela pesa mais no começo",
      !!desceEstilo && /desceu/.test(desceEstilo.motivo) && !/perto do começo/.test(desceEstilo.motivo),
      desceEstilo ? desceEstilo.motivo : "a tag de estilo não se moveu neste caso");

    /* 10 — no modo "Estilo em primeiro", a explicação ainda tem nome.

       O remapa troca 90 por 5, 85 por 6 e 95 por 8. Descrever a tag por
       esse número devolvia "é grupo 5", sem nome e sem motivo. */
    var k2 = itens([["1girl", 10], ["watercolor (medium)", 90], ["1990s (style)", 85], ["bloom", 95]]);
    var rk = ordenar(k2, { modo: "estilo_primeiro" });
    var semNome = rk.movimentos.filter(function (m) { return /é grupo \d/.test(m.motivo); });
    reg("Em “Estilo em primeiro”, nenhuma explicação vira “é grupo 5”",
      semNome.length === 0,
      rk.movimentos.map(function (m) { return m.motivo; }).join(" | ") || "nada se moveu");

    // 11 — todo movimento tem nome de balde E motivo, nos dois modos
    var faltando = [];
    ["padrao_manual", "estilo_primeiro"].forEach(function (md) {
      var rr = ordenar(k2.concat(itens([["best quality", 98], ["forest", 80]])), { modo: md });
      rr.movimentos.forEach(function (m) {
        if (!/—\s.+,\s.+\.$/.test(m.motivo)) faltando.push(md + ": " + m.motivo);
      });
    });
    reg("Todo movimento traz o nome do balde e o motivo, nos dois modos",
      faltando.length === 0, faltando.join(" | ") || "todos completos");

    return casos;
  }

  global.Ordenador = {
    baldes: tabela,
    balde: baldeDe,
    descreveBalde: descreveBalde,
    modos: function () {
      var m = modosTodos(), out = [], k;
      for (k in m) { if (Object.prototype.hasOwnProperty.call(m, k)) out.push(m[k]); }
      // o modo do manual sempre primeiro na lista
      out.sort(function (a, b) { return (a.id === "padrao_manual" ? -1 : 0) - (b.id === "padrao_manual" ? -1 : 0); });
      return out;
    },
    modo: modoDe,
    regraGeral: function () {
      var r = global.OFICINA_REGRAS;
      return (r && r.ordens && r.ordens.regra_geral) ||
        "Tag mais perto do início do prompt pesa mais no resultado.";
    },
    /* A oficina fala COM o autor, então na tela ele é "você" — nunca "o
       autor" nem "ele". O acervo escreveu esta frase em terceira pessoa
       ("a ordem em que o autor escolheu... a preferência é dele"), e ela
       ia crua para o rodapé da Régua. A tela conserta no caminho: se o
       acervo mudar o texto, o conserto simplesmente não casa e some. */
    estabilidade: function () {
      var r = global.OFICINA_REGRAS;
      var t = (r && r.ordens && r.ordens.estabilidade) || "";
      if (!t) return "Empate no mesmo balde mantém a ordem em que você escolheu.";
      return String(t)
        .replace(/a preferência é dele/gi, "quem manda é você")
        .replace(/\bo autor\b/g, "você")
        .replace(/\bdo autor\b/g, "seu");
    },
    ordenar: ordenar,
    modoQueReproduz: modoQueReproduz,
    autoteste: autoteste
  };
})(window);
