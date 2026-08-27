/* ==========================================================================
   OFICINA DE IMAGEM — os oito módulos e a navegação entre eles
   Dono: Construtor B.

   Este arquivo é a tela. Ele lê `dados/` (dono: Construtor A) e fala com a
   ponte pelo `ponte_cliente.js`. Nunca escreve em `dados/` nem em `ponte/`.

   Três proibições que valem para cada linha daqui:

   1. Nenhuma imagem de exemplo inventada. O exemplo de uma tag é um desenho
      geométrico feito por nós, ou um espaço vazio que o autor preenche com
      uma imagem dele. A tela diz na cara qual é qual.
   2. Nenhuma aparência de personagem lida dos arquivos do livro. A oficina
      pede a lista de NOMES e mais nada.
   3. Nenhum termo técnico sem a explicação em português ao lado.
   ========================================================================== */

(function (global) {
  "use strict";

  var doc = global.document;

  /* =================================================================
     0. Peças pequenas
     ================================================================= */

  function $(sel, raiz) { return (raiz || doc).querySelector(sel); }
  function $$(sel, raiz) {
    return Array.prototype.slice.call((raiz || doc).querySelectorAll(sel));
  }

  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function el(tag, attrs, dentro) {
    var n = doc.createElement(tag), k;
    if (attrs) {
      for (k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        if (k === "html") n.innerHTML = attrs[k];
        else if (k === "texto") n.textContent = attrs[k];
        else if (k === "ao") { /* tratado abaixo */ }
        else if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
      }
      if (attrs.ao) {
        for (k in attrs.ao) {
          if (Object.prototype.hasOwnProperty.call(attrs.ao, k)) n.addEventListener(k, attrs.ao[k]);
        }
      }
    }
    (dentro || []).forEach(function (f) {
      if (f === null || f === undefined) return;
      n.appendChild(typeof f === "string" ? doc.createTextNode(f) : f);
    });
    return n;
  }

  function limpar(no) { while (no && no.firstChild) no.removeChild(no.firstChild); return no; }

  /* ⚠ O LUGAR ONDE A RESPOSTA APARECE MORRE NO MEIO DA CHAMADA.

     Este é o defeito mais caro que a oficina já teve, e ele não dava erro
     nenhum: a resposta chegava certa e ia parar num pedaço de tela que já
     tinha sido jogado fora.

     Como acontecia, na ordem exata. A tela guardava o nó de saída numa
     variável (`var saida = $("#saida-cofre")`) e só então falava com a
     ponte. A ponte, ao responder, atualiza o gasto e AVISA quem escuta
     (`absorver(r); avisar();`). Quem escuta é o painel, que redesenha o
     módulo inteiro — e o redesenho troca o nó de saída por um novo, vazio.
     Só DEPOIS disso é que a resposta chegava à tela, e ela era escrita no nó
     velho, que já não estava mais na página.

     Medido com a oficina de pé: `POST /api/testar_geracao` respondeu 200, o
     texto "Ensaio — nada foi enviado e nada foi gasto… custaria 5 Anlas" foi
     montado, e o nó que o recebeu tinha `isConnected === false`. Na tela, o
     autor clicava em "Gerar 1 imagem de prova" e não acontecia nada.

     Onde isso mordia mais forte: `gerarAqui` tinha o mesmo desenho. Com
     token, o autor confirmaria o gasto, a imagem seria gerada e PAGA, e a
     tela ficaria muda — sem a imagem, sem a semente, sem o aviso de erro.

     A regra, agora: nunca guardar um nó de saída atravessando uma chamada à
     ponte. `saidaViva` procura o nó de novo no instante de escrever nele, e
     por isso sempre acha o que está na tela de verdade. */
  function saidaViva(id) {
    function achar() { return $("#" + id); }
    return {
      existe: function () { return !!achar(); },
      limpar: function () { return limpar(achar()); },
      por: function () {
        var n = achar();
        if (!n) return null;
        for (var i = 0; i < arguments.length; i++) {
          if (arguments[i]) n.appendChild(arguments[i]);
        }
        return n;
      }
    };
  }

  var torradaTimer = null;
  function torrada(txt) {
    var t = $("#torrada");
    if (!t) return;
    t.textContent = txt;
    t.classList.add("visivel");
    if (torradaTimer) clearTimeout(torradaTimer);
    torradaTimer = setTimeout(function () { t.classList.remove("visivel"); }, 3200);
  }

  function nota(nivel, rotulo, texto) {
    var classe = "nota" + (nivel ? " " + nivel : "");
    return el("div", { "class": classe }, [
      rotulo ? el("span", { "class": "rot", texto: rotulo }) : null,
      el("p", { texto: texto })
    ]);
  }

  function caixa(titulo, filhos) {
    return el("div", { "class": "caixa" },
      [titulo ? el("h3", { texto: titulo }) : null].concat(filhos || []));
  }

  function linhaChave(rot, valor) {
    return el("p", {}, [el("strong", { texto: rot + ": " }), doc.createTextNode(valor)]);
  }

  /* Concordância de plural. A Bancada escrevia "1 tags · 5 caracteres", e a
     Régua "a oficina mudou 1 tag(s) de lugar". Parêntese de plural é escrita
     de formulário, e o autor não está preenchendo formulário nenhum. */
  function plural(n, singular, muitos) {
    var q = Number(n) || 0;
    return q + " " + (Math.abs(q) === 1 ? singular : (muitos || singular + "s"));
  }

  /* =================================================================
     0.1 O glossário — palavra técnica nunca sozinha na tela

     Três palavras governam o dinheiro e o funcionamento da oficina, e as
     três apareciam cruas. "Anlas" aparecia quinze vezes na tela sem uma
     única explicação — e é a unidade que controla o gasto dele. "A ponte"
     era usada como se fosse palavra comum. "Token" só tinha explicação
     dentro de outro módulo, longe do campo onde ele o cola.

     A regra do projeto é dura: termo técnico sempre seguido do que ele é,
     entre parênteses, sem exceção. Aqui ficam as três frases inteiras, num
     lugar só, para nenhuma tela esquecer.
     ================================================================= */

  /* O nome da gaveta onde os personagens dele moram. Quem sabe o nome de
     verdade e a ponte, que o descobre no arranque — a tela nunca o escreve
     a mao. Sem ponte, o nome que a ponte usa hoje. */
  function gavetaDePersonagens() {
    if (global.Ponte && global.Ponte.gavetaDePersonagens) return global.Ponte.gavetaDePersonagens();
    return "meus_personagens";
  }

  function moeda() {
    var c = (R().custos || {}).moeda;
    return c || "Anlas";
  }

  /* ⚠ O GLOSSÁRIO É DO ACERVO, NÃO DESTA TELA.

     Aqui havia três frases escritas à mão — anlas, ponte, token — enquanto o
     acervo já publicava VINTE E DUAS, cada uma com o campo `primeira_vez`
     pronto para colar. Dezenove nunca chegavam à tela, e entre elas estava a
     palavra que mais aparece na oficina: "prompt". Medido nos sete módulos
     mais a Bancada, "prompt" saía 33 vezes e nenhuma delas explicada — sendo
     que ela nomeia um módulo inteiro e abre a primeira linha que ele lê.

     Hoje a fonte é `OFICINA_REGRAS.glossario`, casando pelo campo `id`. As
     frases daqui ficam só como reserva, para o caso de a página abrir sem os
     arquivos de dados. */

  function termoDoAcervo(id) {
    var lista = R().glossario || [];
    for (var i = 0; i < lista.length; i++) {
      if (lista[i] && lista[i].id === id) return lista[i];
    }
    return null;
  }

  var RESERVA_DO_GLOSSARIO = {
    anlas: "Anlas (os créditos pagos do NovelAI — cada imagem consome um tanto)",
    ponte: "a ponte (o programinha da janela preta, que salva no seu disco)",
    token: "token (a senha que a sua conta do NovelAI dá a este programa)",
    prompt: "prompt (a lista de palavras que descreve a imagem que você quer)",
    tag: "tag (cada palavra-chave do prompt, em inglês)"
  };

  // A frase inteira, com os parênteses, do jeito que o acervo manda usá-la.
  function primeiraVez(id) {
    var g = termoDoAcervo(id);
    if (g && g.primeira_vez) return g.primeira_vez;
    if (RESERVA_DO_GLOSSARIO[id]) return RESERVA_DO_GLOSSARIO[id];
    return id;
  }

  /* Compatibilidade: o resto do arquivo chama GLOSSARIO.anlas() e parentes.
     Agora qualquer id do acervo responde, não só os três de antes. */
  var GLOSSARIO = {
    anlas: function () {
      var g = termoDoAcervo("anlas");
      if (g && g.primeira_vez) {
        // a moeda pode ter outro nome no acervo; o nome dele manda
        return g.primeira_vez.replace(/^Anlas\b/, moeda());
      }
      return moeda() + " (os créditos pagos do NovelAI — cada imagem consome um tanto)";
    },
    ponte: function () { return primeiraVez("ponte"); },
    token: function () { return primeiraVez("token"); },
    prompt: function () { return primeiraVez("prompt"); },
    tag: function () { return primeiraVez("tag"); }
  };

  // Um <p> discreto com a explicação da palavra, para pôr logo abaixo do título.
  function explicaTermo(chave) {
    var f = GLOSSARIO[chave];
    var txt = f ? f() : primeiraVez(chave);
    if (!txt || txt === chave) return null;
    return el("p", { "class": "discreto glossario", texto: txt });
  }

  /* =================================================================
     0.2 A glosa dentro da frase — para o texto que vem do acervo

     `explicaTermo` resolve o termo que a TELA escreve: basta pôr o <p> antes.
     Não resolve o termo que vem escrito dentro de um dado do acervo, e é aí
     que a régua vazava. Medido na Mesa de retoque: "Anlas" quatro vezes sem
     uma linha dizendo o que é — a palavra que controla o dinheiro dele —,
     mais Precise Reference, Upscale e Enhance sem tradução, todos vindos de
     texto do acervo ou dos cartões deste arquivo.

     `glosar` põe a explicação entre parênteses na PRIMEIRA vez que cada termo
     aparece dentro de um módulo, e cala nas seguintes. `novaTela()` zera a
     conta, e cada módulo a chama ao começar a desenhar.

     Duas recusas de propósito: não glosa o termo que já vem seguido de
     parêntese no próprio texto (senão sairia parêntese dobrado), e não glosa
     o vocabulário do próprio livro — explicar ao autor o que ele inventou é
     ruído. */
  var GLOSAS_INLINE = [
    ["Precise Reference", "referência precisa: leva o personagem e o traço"],
    ["Character Reference", "referência de personagem"],
    ["Style Reference", "referência de traço"],
    ["Vibe Transfer", "transferência de clima e de cor"],
    ["Image2Image", "partir de uma imagem sua"],
    ["Focused Inpainting", "repintura por máscara, ampliando o pedaço antes"],
    ["Inpaint Focado", "repintura que amplia o pedaço antes de refazer"],
    ["Inpaint", "repintura por máscara"],
    ["Upscale", "aumentar o tamanho da imagem"],
    ["Enhance", "refazer com mais detalhe"],
    ["Director Tools", "as ferramentas de direção do site"],
    ["Remove BG", "tirar o fundo"],
    ["Line Art", "reduzir a imagem ao traço"],
    ["Colorize", "colorir"],
    ["Declutter", "limpar o excesso da imagem"],
    ["Emotion", "trocar a expressão do rosto"],
    ["Anlas", "os créditos pagos do NovelAI — cada imagem consome um tanto"],
    ["token", "a senha que a sua conta do NovelAI dá a este programa"]
  ];

  var jaGlosado = {};

  function novaTela() { jaGlosado = {}; }

  // Marca um termo como já explicado nesta tela, sem escrever nada.
  function jaExpliquei(termo) { jaGlosado[String(termo).toLowerCase()] = 1; }

  function glosar(texto) {
    var t = String(texto == null ? "" : texto);
    if (!t) return t;
    GLOSAS_INLINE.forEach(function (par) {
      var termo = par[0];
      var chave = termo.toLowerCase();
      if (jaGlosado[chave]) return;
      var i = t.indexOf(termo);
      if (i < 0) return;
      var depois = t.slice(i + termo.length, i + termo.length + 3);
      if (/^\s*\(/.test(depois)) { jaGlosado[chave] = 1; return; }  // o texto já explica
      t = t.slice(0, i + termo.length) + " (" + par[1] + ")" + t.slice(i + termo.length);
      jaGlosado[chave] = 1;
    });
    return t;
  }

  // Um <p> já glosado — o atalho usado pelos módulos que mostram texto do acervo.
  function pGlosado(txt, classe) {
    return el("p", classe ? { "class": classe } : {}, [doc.createTextNode(glosar(txt))]);
  }

  /* Os planos de assinatura, tirados do acervo.

     O plano importa porque muda a conta: no Opus a GERAÇÃO sai sem gastar
     nada, e a referência de personagem continua custando. A oficina nunca
     perguntava qual era o plano dele, então tratava todo mundo como quem
     paga — e o teto de gasto barrava gerações que seriam gratuitas. */
  function planos() {
    var lista = (((R().custos || {}).planos || {}).lista) || [];
    var fora = [{ id: "nenhuma", nome: "Nenhum — não sou assinante" }];
    lista.forEach(function (p) {
      fora.push({ id: p.id, nome: p.nome, extra: p.extra || "", usd: p.usd_mes, anlas: p.anlas_mes });
    });
    return fora;
  }

  function nomeDoPlano(id) {
    var l = planos();
    for (var i = 0; i < l.length; i++) { if (l[i].id === id) return l[i].nome; }
    return "Nenhum — não sou assinante";
  }

  /* =================================================================
     1. O acervo (dono: Construtor A)
     ================================================================= */

  function A() { return global.OFICINA_ACERVO || { categorias: [], tags: [] }; }
  function R() { return global.OFICINA_REGRAS || {}; }
  function RC() { return global.OFICINA_RECEITAS || { receitas: [] }; }

  var POR_ID = {};
  var POR_CAT = {};
  var CAT_POR_ID = {};

  function indexar() {
    POR_ID = {}; POR_CAT = {}; CAT_POR_ID = {};
    (A().categorias || []).forEach(function (c) {
      CAT_POR_ID[c.id] = c;
      POR_CAT[c.id] = {};
      (c.subcategorias || []).forEach(function (s) { POR_CAT[c.id][s.id] = []; });
    });
    (A().tags || []).forEach(function (t) {
      POR_ID[t.id] = t;
      if (!POR_CAT[t.categoria]) POR_CAT[t.categoria] = {};
      if (!POR_CAT[t.categoria][t.subcategoria]) POR_CAT[t.categoria][t.subcategoria] = [];
      POR_CAT[t.categoria][t.subcategoria].push(t);
    });
  }

  function tagDe(id) { return POR_ID[id] || null; }
  function nomeDaTag(id) { var t = tagDe(id); return t ? t.tag : id; }

  function acervoCarregou() { return !!(A().tags && A().tags.length); }

  /* As cores saem do próprio acervo: são as tags "[cor] theme" da gaveta de
     cor dominante, sem a palavra theme. Nenhuma cor inventada aqui. */
  function coresDoAcervo() {
    var lista = (POR_CAT.estilo && POR_CAT.estilo.cor_dominante) || [];
    var fora = lista.map(function (t) {
      return { en: String(t.tag).replace(/\s*theme$/i, ""), pt: String(t.pt).replace(/^tema\s+/i, "") };
    });
    if (!fora.length) {
      fora = [{ en: "black", pt: "preto" }, { en: "white", pt: "branco" }, { en: "blue", pt: "azul" }];
    }
    return fora;
  }

  /* =================================================================
     2. O PROJETO — tudo que o autor montou
     ================================================================= */

  var seq = 0;
  function novaChave() { seq += 1; return "i" + seq; }

  var P = {
    versao_formato: "1.0.0",
    nome: "",
    modelo: "",
    ordem: "padrao_manual",
    ordenarAuto: true,
    base: [],
    livreBase: "",
    personagens: [],
    indesejado: { itens: [], livre: "", preset: "leve" },
    textos: [],
    referencias: [],
    /* As Etiquetas de Qualidade do site (o interruptor "Quality Tags").
       Elas existem de verdade no NovelAI, contêm `no text` por dentro, e
       por isso brigam com a fala escrita na imagem. A oficina tinha o aviso
       escrito no motor e NENHUM lugar para ligar a chave — o aviso nunca
       podia acender. Hoje a chave está na Bancada e viaja no pedido. */
    qualidadeAuto: true,
    /* O plano dele no NovelAI. Sem esta escolha, a ponte tratava todo mundo
       como quem paga: um assinante Opus via "gastar 5 Anlas" numa geração
       gratuita, e o teto do dia o barrava depois de 60 gerações que não
       custaram nada. */
    assinatura: "nenhuma",
    semente: null,          // null = sortear uma nova a cada geração
    /* A imagem da Mesa de Retoque, e o que fazer com ela.

       `mascara` é o desenho da parte a refeita, em PNG transparente (o que a
       tela pinta). `mascaraPB` é o mesmo desenho em preto e branco, que é o
       formato que o NovelAI espera, composto na hora em que ele solta o
       pincel. `intencao` é o cartão que ele escolheu — e é ela que decide se
       o pedido vira Inpaint ou Image2Image. */
    retoque: {
      nome: "", arquivo: "", dados: "", forca: 0.7, ruido: 0,
      mascara: "", mascaraPB: "", mascaraArquivo: "", intencao: "",
      emocao: "", forcaDaEmocao: 0
    },
    usarRetoque: false,   // partir dessa imagem na hora de gerar
    alvo: "base"
  };

  // Tag com espaço por preencher, como `year XXXX`.
  function temEspacoPorPreencher(t) {
    return /XXXX/.test(String((t && t.tag) || ""));
  }

  function itemDe(t) {
    return {
      chave: novaChave(),
      id: t.id,
      tag: t.tag,
      valor: "",
      pt: t.pt,
      ordem: t.ordem,
      peso: { tipo: "nenhum", valor: 0 },
      travada: false,
      // quando verdadeiro, a Bancada mostra um campo de texto para esta tag
      preencher: temEspacoPorPreencher(t)
    };
  }

  function itemLivre(texto, ordem) {
    return {
      chave: novaChave(), id: "", tag: texto, valor: "", pt: "",
      ordem: typeof ordem === "number" ? ordem : 80,
      peso: { tipo: "nenhum", valor: 0 }, travada: false
    };
  }

  function listaDe(alvo) {
    if (alvo === "base" || !alvo) return P.base;
    if (alvo === "indesejado") return P.indesejado.itens;
    var n = parseInt(String(alvo).replace("p", ""), 10);
    return P.personagens[n] ? P.personagens[n].itens : P.base;
  }

  function listaAtual() { return listaDe(P.alvo); }

  function nomeDoAlvo(alvo) {
    if (alvo === "base") return "prompt base (a caixa principal)";
    if (alvo === "indesejado") return "conteúdo indesejado (o que a IA deve evitar)";
    var n = parseInt(String(alvo).replace("p", ""), 10);
    var p = P.personagens[n];
    return "caixa do personagem " + (n + 1) + (p && p.nome ? " (" + p.nome + ")" : "");
  }

  function todosOsItens() {
    var t = P.base.slice();
    P.personagens.forEach(function (p) { t = t.concat(p.itens); });
    return t;
  }

  function ondeEsta(idTag) {
    var i;
    for (i = 0; i < P.base.length; i++) { if (P.base[i].id === idTag) return "base"; }
    for (i = 0; i < P.personagens.length; i++) {
      var i2;
      for (i2 = 0; i2 < P.personagens[i].itens.length; i2++) {
        if (P.personagens[i].itens[i2].id === idTag) return "p" + i;
      }
    }
    for (i = 0; i < P.indesejado.itens.length; i++) {
      if (P.indesejado.itens[i].id === idTag) return "indesejado";
    }
    return null;
  }

  function estaNoPrompt(idTag) { return ondeEsta(idTag) !== null; }

  function itemPorChave(chave) {
    var t = todosOsItens().concat(P.indesejado.itens), i;
    for (i = 0; i < t.length; i++) { if (t[i].chave === chave) return t[i]; }
    return null;
  }

  function listaDoItem(chave) {
    var listas = [P.base, P.indesejado.itens].concat(P.personagens.map(function (p) { return p.itens; }));
    for (var i = 0; i < listas.length; i++) {
      for (var j = 0; j < listas[i].length; j++) { if (listas[i][j].chave === chave) return listas[i]; }
    }
    return null;
  }

  /* --- pôr e tirar tag, respeitando o que o acervo declara --------- */

  function porTag(t, alvo) {
    var lista = listaDe(alvo || P.alvo);
    if (lista.some(function (x) { return x.id === t.id; })) return { ok: true, jaTinha: true };

    // exclusivo_com: a outra SAI, sem pergunta. É bloqueio, não aviso.
    var tirou = [];
    (t.exclusivo_com || []).forEach(function (outro) {
      var pos = lista.map(function (x) { return x.id; }).indexOf(outro);
      if (pos >= 0) { tirou.push(nomeDaTag(outro)); lista.splice(pos, 1); }
    });

    lista.push(itemDe(t));

    // requer: a oficina OFERECE a outra junto, com o motivo.
    var falta = (t.requer || []).filter(function (r) { return !estaNoPrompt(r); });
    return { ok: true, tirou: tirou, falta: falta };
  }

  function tirarTag(idTag) {
    var listas = [P.base, P.indesejado.itens].concat(P.personagens.map(function (p) { return p.itens; }));
    listas.forEach(function (l) {
      for (var i = l.length - 1; i >= 0; i--) { if (l[i].id === idTag) l.splice(i, 1); }
    });
  }

  /* Clicar numa tag que já está no prompt TIRA a tag.

     Isso acontecia em silêncio: o texto da tela só prometia que clicar
     acrescentava, a Bancada caía de catorze tags para treze, e a única
     pista era a pastilha mudar de cor. Agora a tela conta o que fez —
     NAS DUAS DIREÇÕES.

     O aviso de pôr não é enfeite. Sem ele, o recado "Tirei X do seu
     prompt" ficava na tela depois de ele clicar de novo e pôr a tag de
     volta, então a tela dizia o contrário do que tinha acabado de fazer.
     Medido no ensaio: onze tags, tirei uma, pus de volta, e o recado
     continuava sendo "Tirei 1girl". */
  function alternarTag(t) {
    if (travadoPelaRecuperacao()) return { acao: "nada" };
    if (estaNoPrompt(t.id)) {
      tirarTag(t.id);
      torrada("Tirei " + t.tag + " do seu prompt. Clique de novo para pôr de volta.");
      salvarRascunho();
      return { acao: "tirou" };
    }
    var r = porTag(t);
    salvarRascunho();
    if (r.tirou && r.tirou.length) {
      torrada("Pus " + t.tag + " e tirei " + r.tirou.join(" e ") +
        ": só uma tag dessa gaveta pode ficar por vez.");
    } else {
      torrada("Pus " + t.tag + " no seu prompt. Clique de novo para tirar.");
    }
    return { acao: "pos", falta: r.falta || [] };
  }

  /* =================================================================
     3. A ordenação — a exigência 6 do autor
     ================================================================= */

  /* A identidade usada para ordenar é a POSIÇÃO na lista, não a chave do item.

     O motivo é uma falha real que apareceu no teste: um trabalho recuperado do
     disco traz as chaves antigas, e as tags clicadas depois nasciam com chaves
     iguais às recuperadas. Ordenar por chave então casava duas tags diferentes,
     e o prompt saía com uma repetida e outra faltando. A posição é única por
     construção, e essa falha não tem como voltar. */
  function ordenarLista(lista) {
    if (!global.Ordenador) return { itens: lista.slice(), movimentos: [], alertas: [], mexeu: false };

    var entrada = lista.map(function (it, i) {
      return { chave: "__pos" + i, rotulo: textoDoItem(it), ordem: it.ordem, travada: !!it.travada };
    });
    var r = global.Ordenador.ordenar(entrada, { modo: P.ordem });

    function daPosicao(chave) { return lista[parseInt(String(chave).slice(5), 10)]; }

    return {
      itens: r.ordenada.map(function (x) { return daPosicao(x.chave); }).filter(Boolean),
      movimentos: r.movimentos.map(function (m) {
        var it = daPosicao(m.chave);
        return {
          chave: it ? it.chave : m.chave,
          rotulo: m.rotulo, de: m.de, para: m.para, balde: m.balde, motivo: m.motivo
        };
      }),
      alertas: r.alertas,
      mexeu: r.mexeu
    };
  }

  function textoDoItem(it) { return it.valor ? it.valor : it.tag; }

  /* ⚠ O TEXTO LIVRE TAMBÉM É TAG, E TAMBÉM PRECISA DE ORDEM.

     A caixa de texto livre ficava fora da Régua inteira: `ordenarLista`
     só recebia `P.base`, e o texto livre era colado no fim da linha, depois
     de tudo. Medido: base = [1girl, best quality, watercolor (medium)] com
     `rooftop, storm clouds` digitado saía

         1girl, best quality, watercolor (medium), rooftop, storm clouds

     — o cenário depois da etiqueta de qualidade, que é o pior lugar
     possível (o manual diz que tag mais perto do início pesa mais), e a
     Régua não mostrava movimento nenhum para ele conferir. E é justamente
     essa caixa que ele vai usar para o que falta nas gavetas.

     Hoje o texto livre é quebrado em tags, casado contra o acervo, e entra
     na mesma fila. O que o acervo conhece leva o balde certo. O que ele não
     conhece entra no balde 80 (cena) e vai marcado na Régua como chute —
     porque chutar em silêncio seria pior do que não ordenar.

     A fala escrita com `Text:` NÃO vira tag: ela sai antes, e continua indo
     ao motor pelo caminho de sempre, para o alerta vermelho poder acender. */

  function partesDoLivre() {
    var bruto = P.livreBase || "";
    if (!global.Motor || !global.Motor.extrairFalas) {
      return { limpo: bruto, falaCrua: "", temFala: false };
    }
    var movidos = [];
    var limpo = global.Motor.extrairFalas(bruto, "a caixa de texto livre", movidos);
    return {
      limpo: limpo,
      falaCrua: movidos.length ? bruto.slice(limpo.length) : "",
      temFala: movidos.length > 0
    };
  }

  function itensDoLivre() {
    if (!global.Motor || !global.Motor.itensDoTextoLivre) return [];
    var lista = global.Motor.itensDoTextoLivre(partesDoLivre().limpo);
    return lista.map(function (x, i) {
      return {
        chave: "livre" + i + ":" + x.tag,
        id: x.id,
        tag: x.tag,
        valor: "",
        pt: x.pt || "",
        ordem: x.ordem,
        peso: x.peso,
        travada: false,
        deLivre: true,
        conhecida: !!x.conhecida
      };
    });
  }

  // A lista que a Régua e o prompt usam: as pastilhas mais o texto livre.
  function baseParaOrdenar() {
    return P.base.concat(itensDoLivre());
  }

  function baseOrdenada() {
    var lista = baseParaOrdenar();
    return P.ordenarAuto ? ordenarLista(lista).itens : lista;
  }

  function paraMotor() {
    return {
      modelo: P.modelo,
      // as tags do texto livre já estão dentro de `base`, na ordem certa;
      // para o motor sobra só a fala, que ele move para o fim e reporta
      base: baseOrdenada(),
      livreBase: partesDoLivre().falaCrua,
      personagens: P.personagens.map(function (p) {
        return {
          nome: p.nome,
          itens: P.ordenarAuto ? ordenarLista(p.itens).itens : p.itens.slice(),
          livre: p.livre,
          indesejado: p.indesejado,
          posicao: p.posicao
        };
      }),
      indesejado: P.indesejado,
      textos: P.textos,
      referencias: P.referencias,
      qualidadeAuto: P.qualidadeAuto,
      assinatura: P.assinatura
    };
  }

  function montado() {
    if (!global.Motor) return null;
    try { return global.Motor.montar(paraMotor()); } catch (e) { return null; }
  }

  /* =================================================================
     4. Guardar o trabalho
     ================================================================= */

  /* ⚠ A TRAVA DA RECUPERAÇÃO.

     Enquanto a oficina não terminou de ler o disco, clicar numa tag é
     recusado — com uma frase, não em silêncio. É a outra metade da
     correção que mora no `memoria.js`: lá o disco não é escrito, aqui a
     tela não deixa o autor começar a montar por cima.

     Sem as duas metades juntas, o que acontecia era isto: a Oficina abria
     numa porta nova, ele clicava em duas tags nos primeiros segundos, a
     recuperação chegava depois e desistia (porque já havia tags na tela),
     e meio segundo mais tarde o gravador automático escrevia essas duas
     tags por cima de catorze que estavam no disco. */
  /* Dois estados, e não um só. A diferença é o que me pegou no ensaio.

     `lendoDisco`      — a leitura ainda não respondeu. Isto PODE demorar
                         demais (o OneDrive às vezes segura um arquivo que
                         está na nuvem), então tem prazo: oito segundos.
     `esperandoResposta` — a pergunta já está na tela e o autor ainda não
                         respondeu. Isto NUNCA tem prazo.

     Eu tinha juntado os dois num flag só, com um prazo comum. No teste, a
     pergunta apareceu e o prazo de oito segundos a apagou da tela sozinho,
     destravando o disco — e o rascunho de catorze tags foi sobrescrito
     pelas duas tags clicadas. O prazo existe para a máquina não travar; ele
     não pode ter opinião sobre o tempo que uma pessoa leva para decidir. */
  var lendoDisco = true;
  var esperandoResposta = false;

  function estaRecuperando() { return lendoDisco || esperandoResposta; }

  function travadoPelaRecuperacao() {
    if (!estaRecuperando()) return false;
    torrada(esperandoResposta
      ? "Responda ali em cima primeiro: recuperar o trabalho que está no disco, ou começar do zero."
      : "Um instante: estou vendo no disco o que você já tinha montado, para não escrever por cima.");
    return true;
  }

  function liberarTrava() {
    lendoDisco = false;
    esperandoResposta = false;
    if (global.Memoria) global.Memoria.travarDisco(false);
    var f = $("#faixa-recuperacao");
    if (f) f.remove();
    doc.body.classList.remove("recuperando");
    render();
  }

  function salvarRascunho() {
    if (global.Memoria) global.Memoria.rascunho(paraGuardar());
    render();
  }

  function paraGuardar() {
    return {
      versao_formato: P.versao_formato,
      nome: P.nome,
      modelo: P.modelo,
      ordem: P.ordem,
      ordenarAuto: P.ordenarAuto,
      base: P.base,
      livreBase: P.livreBase,
      personagens: P.personagens,
      indesejado: P.indesejado,
      textos: P.textos,
      qualidadeAuto: P.qualidadeAuto,
      assinatura: P.assinatura,
      semente: P.semente,
      /* A imagem da Mesa de Retoque não vai inteira para o rascunho — vai o
         NOME do arquivo que a ponte gravou em meu_trabalho\referencias.
         Antes ela morava numa variável solta do módulo e sumia ao fechar a
         aba, então Image2Image, Inpaint e as ferramentas de direção
         perdiam a imagem de partida sem avisar. */
      retoque: {
        nome: P.retoque.nome, arquivo: P.retoque.arquivo,
        forca: P.retoque.forca, ruido: P.retoque.ruido,
        // a máscara também vai pelo NOME do arquivo, como a imagem
        mascaraArquivo: P.retoque.mascaraArquivo || "",
        intencao: P.retoque.intencao || "",
        emocao: P.retoque.emocao || "",
        forcaDaEmocao: P.retoque.forcaDaEmocao || 0
      },
      usarRetoque: P.usarRetoque,
      /* A imagem das referências também não entra: encheria a memória do
         navegador em três fotos. Fica a ficha, com o nome do arquivo
         gravado no disco — é por ele que a imagem volta na próxima
         sessão. */
      referencias: P.referencias.map(function (r) {
        return {
          id: r.id, tipo: r.tipo, nome: r.nome, arquivo: r.arquivo || "",
          forca: r.forca, fidelidade: r.fidelidade
        };
      })
    };
  }

  function restaurar(dados) {
    if (!dados) return;
    ["nome", "modelo", "ordem", "livreBase", "assinatura"].forEach(function (k) {
      if (typeof dados[k] === "string") P[k] = dados[k];
    });
    if (typeof dados.ordenarAuto === "boolean") P.ordenarAuto = dados.ordenarAuto;
    if (typeof dados.qualidadeAuto === "boolean") P.qualidadeAuto = dados.qualidadeAuto;
    if (typeof dados.usarRetoque === "boolean") P.usarRetoque = dados.usarRetoque;
    if (typeof dados.semente === "number") P.semente = dados.semente;
    if (Array.isArray(dados.base)) P.base = dados.base;
    if (Array.isArray(dados.personagens)) P.personagens = dados.personagens;
    if (Array.isArray(dados.textos)) P.textos = dados.textos;
    if (dados.indesejado) P.indesejado = dados.indesejado;
    if (Array.isArray(dados.referencias)) {
      P.referencias = dados.referencias.map(function (r) {
        return {
          id: r.id || novaChave(), tipo: r.tipo || "character", nome: r.nome || "",
          arquivo: r.arquivo || "", dados: "", forca: typeof r.forca === "number" ? r.forca : 0.6,
          fidelidade: typeof r.fidelidade === "number" ? r.fidelidade : 1
        };
      });
    }
    if (dados.retoque) {
      P.retoque = {
        nome: dados.retoque.nome || "", arquivo: dados.retoque.arquivo || "", dados: "",
        forca: typeof dados.retoque.forca === "number" ? dados.retoque.forca : 0.7,
        ruido: typeof dados.retoque.ruido === "number" ? dados.retoque.ruido : 0,
        mascara: "", mascaraPB: "",
        mascaraArquivo: dados.retoque.mascaraArquivo || "",
        intencao: dados.retoque.intencao || "",
        emocao: dados.retoque.emocao || "",
        forcaDaEmocao: typeof dados.retoque.forcaDaEmocao === "number" ? dados.retoque.forcaDaEmocao : 0
      };
    }
    /* Toda chave é refeita, sempre. A chave é só um crachá de memória: ela não
       significa nada fora desta sessão. Reaproveitar a chave que veio do disco
       fazia a próxima tag clicada nascer com o mesmo crachá de uma recuperada,
       e duas tags diferentes viravam a mesma na hora de ordenar. */
    todosOsItens().concat(P.indesejado.itens).forEach(function (it) {
      it.chave = novaChave();
      if (!it.peso) it.peso = { tipo: "nenhum", valor: 0 };
      if (it.preencher === undefined) it.preencher = /XXXX/.test(String(it.tag || ""));
    });
    trazerImagensDoDisco();
  }

  /* A folha em branco de verdade.

     Ela existe por um defeito medido, e o defeito era a tela se contradizendo
     sozinha. O botão "Começar do zero" só destravava o disco: ele não limpava
     nada. Acontece que a Bancada é carregada de DOIS lugares na abertura —
     primeiro a cópia que fica no navegador, depois o rascunho que está no
     disco. O botão recusava o do disco e deixava o do navegador na tela.
     Resultado: a mensagem dizia "Começando do zero" com as tags de antes
     ainda ali, à vista. Quando as duas cópias eram iguais, ninguém percebia;
     quando eram diferentes, ele começava um trabalho novo em cima de tags
     que achava ter descartado.

     O que ela limpa: o trabalho — as tags, as caixas de personagem, as falas,
     as referências, a imagem da Mesa de Retoque, o nome e a semente.

     O que ela NÃO limpa, de propósito: as preferências dele — o modelo, a
     ordem escolhida, o plano de assinatura, as Etiquetas de Qualidade e o
     preset de Conteúdo Indesejado. "Começar do zero" é uma folha em branco,
     não é desconfigurar a oficina. */
  function zerarProjeto() {
    P.nome = "";
    P.base = [];
    P.livreBase = "";
    P.personagens = [];
    P.textos = [];
    P.referencias = [];
    P.indesejado.itens = [];
    P.indesejado.livre = "";
    P.semente = null;
    P.retoque = {
      nome: "", arquivo: "", dados: "", forca: 0.7, ruido: 0,
      mascara: "", mascaraPB: "", mascaraArquivo: "", intencao: ""
    };
    P.usarRetoque = false;
    P.alvo = "base";
  }

  /* Busca de volta, do disco, os bytes das imagens que o rascunho só guarda
     por nome. Sem isso, uma referência recuperada seria um nome de arquivo
     e nada mais — e a conta de custo cobraria por ela, e a geração sairia
     sem ela. */
  function trazerImagensDoDisco() {
    if (!global.Memoria || global.Memoria.seco()) return;
    var pend = [];
    P.referencias.forEach(function (r) {
      if (r.dados || !r.arquivo) return;
      pend.push(global.Memoria.imagemDoDisco("referencias", r.arquivo).then(function (x) {
        if (x && x.ok) r.dados = x.dados;
      }));
    });
    if (P.retoque.arquivo && !P.retoque.dados) {
      pend.push(global.Memoria.imagemDoDisco("referencias", P.retoque.arquivo).then(function (x) {
        if (x && x.ok) P.retoque.dados = x.dados;
      }));
    }
    // a máscara volta do disco junto, senão o Inpaint recuperado sai sem ela
    if (P.retoque.mascaraArquivo && !P.retoque.mascara) {
      pend.push(global.Memoria.imagemDoDisco("referencias", P.retoque.mascaraArquivo).then(function (x) {
        if (x && x.ok) { P.retoque.mascara = x.dados; refazerMascaraPB(); }
      }));
    }
    if (pend.length) Promise.all(pend).then(function () { render(); });
  }

  /* =================================================================
     5. Zona de soltar imagem
     ================================================================= */

  function zonaDeSolta(no, aoReceber, rotulo) {
    no.classList.add("solta-aqui");
    no.setAttribute("tabindex", "0");
    no.setAttribute("role", "button");
    if (rotulo) no.setAttribute("aria-label", rotulo);

    function abrirSeletor() {
      var inp = el("input", { type: "file", accept: "image/*", "class": "oculto" });
      doc.body.appendChild(inp);
      inp.addEventListener("change", function () {
        if (inp.files && inp.files[0]) receber(inp.files[0]);
        inp.remove();
      });
      inp.click();
    }

    function receber(file) {
      if (!global.Memoria) return;
      global.Memoria.lerArquivo(file).then(function (r) {
        aoReceber(r);
      }, function (erro) {
        torrada(erro.message || "Não consegui ler essa imagem.");
      });
    }

    no.addEventListener("click", abrirSeletor);
    no.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); abrirSeletor(); }
    });
    no.addEventListener("dragover", function (ev) {
      ev.preventDefault(); no.classList.add("sobre");
    });
    no.addEventListener("dragleave", function () { no.classList.remove("sobre"); });
    no.addEventListener("drop", function (ev) {
      ev.preventDefault();
      no.classList.remove("sobre");
      var f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (f) receber(f);
    });
    return no;
  }

  /* =================================================================
     6. A bolinha de uma tag, e a ficha dela
     ================================================================= */

  /* ⚠ DOIS GESTOS, E NÃO UM.

     A pastilha era um botão só: clicar punha a tag no prompt E abria a
     ficha. Para um leigo que está ali justamente para descobrir o que cada
     uma das 382 tags faz, cada curiosidade sujava o prompt. A única forma de
     ler sem alterar nada era parar o mouse em cima — o que não existe em
     tela de toque.

     Hoje a pastilha tem duas partes:
       o CORPO (a palavra) abre a ficha e não mexe no prompt — ler é de graça;
       o "+" no canto põe a tag no prompt, e vira "×" para tirar.

     O estado de "está no prompt" migrou de `aria-pressed` na pastilha para
     `data-posta`, porque a pastilha deixou de ser um botão e `aria-pressed`
     em elemento que não é botão é ARIA inválida. Quem carrega o
     `aria-pressed` agora é o "+", que é um interruptor de verdade. */
  function bolinha(t, aoLer, aoAlternar) {
    var dentro = estaNoPrompt(t.id);

    var b = el("span", {
      "class": "bolinha",
      "data-tag": t.id,
      "data-posta": dentro ? "true" : "false"
    });

    var ler = el("button", {
      "class": "bolinha-ler",
      type: "button",
      "aria-expanded": "false",
      title: t.pt + " — " + t.explica + "  ·  Clique para ver a ficha (não mexe no prompt)."
    }, [
      el("span", { "class": "en", texto: t.tag }),
      el("span", { "class": "pt", texto: t.pt })
    ]);
    if (t.verificada === false) {
      ler.appendChild(el("span", { "class": "selo-nv", texto: "NV", title: "Não verificada: esta tag não foi encontrada no manual oficial." }));
    }
    ler.addEventListener("click", function () { aoLer(t, b); });

    var por = el("button", {
      "class": "bolinha-por",
      type: "button",
      "aria-pressed": dentro ? "true" : "false",
      "aria-label": (dentro ? "Tirar " : "Pôr ") + t.tag + " no prompt",
      title: dentro ? "Tirar do prompt" : "Pôr no prompt",
      texto: dentro ? "×" : "+"
    });
    por.addEventListener("click", function () { aoAlternar(t, b); });

    b.appendChild(ler);
    b.appendChild(por);
    return b;
  }

  var TITULO_DO_EXEMPLO = {
    esquema: "Desenho esquemático",
    vazio: "Espaço a preencher",
    nenhum: "Sem exemplo visual"
  };

  function blocoDeExemplo(t) {
    var tipo = (t.exemplo && t.exemplo.tipo) || "nenhum";
    var envolucro = el("div", { "class": "exemplo-caixa" });

    if (tipo === "esquema") {
      var svg = global.Esquemas ? global.Esquemas.paraTag(t) : null;
      envolucro.appendChild(el("span", { "class": "selo selo-esquema", texto: TITULO_DO_EXEMPLO.esquema }));
      if (svg) {
        envolucro.appendChild(el("div", { "class": "esquema", html: svg }));
        envolucro.appendChild(el("p", {
          "class": "legenda",
          texto: "Desenho feito pela oficina, só com linhas e formas. Ele mostra a geometria da tag — o corte do quadro, o ângulo, a proporção. Não é uma imagem gerada, e não mostra rosto, cor nem roupa."
        }));
      } else {
        envolucro.appendChild(el("p", { "class": "legenda", texto: "O desenho desta tag ainda não foi feito." }));
      }
      return envolucro;
    }

    if (tipo === "vazio") {
      envolucro.appendChild(el("span", { "class": "selo selo-vazio", texto: TITULO_DO_EXEMPLO.vazio }));
      var alvo = el("div", {});
      envolucro.appendChild(alvo);
      montarEspacoDeExemplo(alvo, t);
      envolucro.appendChild(el("p", {
        "class": "legenda",
        texto: "Este espaço é seu. A oficina não tem banco de imagens e nunca inventa um exemplo. Solte aqui uma imagem que você mesmo gerou com esta tag, e ela fica guardada como o seu exemplo dela."
      }));
      return envolucro;
    }

    envolucro.appendChild(el("span", { "class": "selo selo-nenhum", texto: TITULO_DO_EXEMPLO.nenhum }));
    envolucro.appendChild(el("p", {
      "class": "legenda",
      texto: "Esta tag não tem como ser mostrada num desenho nem numa foto sozinha. Ela age no acabamento da imagem inteira."
    }));
    return envolucro;
  }

  /* O `ref` do acervo é o NOME do arquivo, e é ele a chave forte do álbum
     de exemplos: se o arquivo está na pasta, o exemplo existe — não
     importa em que porta a oficina abriu hoje. Por isso ele viaja em toda
     chamada de exemplo, e não só na hora de gravar. */
  function montarEspacoDeExemplo(alvo, t) {
    limpar(alvo);
    var ref = (t.exemplo && t.exemplo.ref) || (t.id + ".png");

    function vazio() {
      var z = el("div", {}, [
        el("strong", { texto: "Solte aqui uma imagem sua com esta tag" }),
        el("span", { texto: "ou clique para escolher um arquivo do seu computador" })
      ]);
      zonaDeSolta(z, function (arq) {
        global.Memoria.guardarExemplo(t.id, ref, arq.dados).then(function (r) {
          if (!r.ok) { torrada(r.erro || "Não consegui guardar essa imagem."); return; }
          torrada(r.onde === "disco"
            ? "Guardei o seu exemplo no disco, na pasta meu_trabalho\\exemplos."
            : "Guardei o seu exemplo na memória do navegador.");
          montarEspacoDeExemplo(alvo, t);
        });
      }, "Solte aqui uma imagem sua com a tag " + t.tag);
      alvo.appendChild(z);
    }

    if (!global.Memoria || !global.Memoria.temExemplo(t.id, ref)) { vazio(); return; }

    global.Memoria.lerExemplo(t.id, ref).then(function (r) {
      if (!r || !r.ok || !r.url) { vazio(); return; }
      limpar(alvo);
      var img = el("img", { src: r.url, alt: "Sua imagem de exemplo para a tag " + t.tag });
      img.addEventListener("error", function () { vazio(); });
      var moldura = el("div", { "class": "solta-aqui" }, [img]);
      alvo.appendChild(moldura);
      alvo.appendChild(el("p", { "class": "legenda" }, [
        doc.createTextNode("Este exemplo é seu, guardado " +
          (r.onde === "disco" ? "no disco, em meu_trabalho\\exemplos." : "na memória do navegador.") + " "),
        el("button", {
          "class": "botao-p", type: "button", texto: "Trocar ou apagar",
          ao: {
            click: function () {
              if (!global.confirm("Isso apaga a sua imagem de exemplo desta tag, inclusive o arquivo no disco. Continuar?")) return;
              global.Memoria.apagarExemplo(t.id, ref).then(function () {
                torrada("Apaguei o seu exemplo de " + t.tag + ".");
                montarEspacoDeExemplo(alvo, t);
              });
            }
          }
        })
      ]));
    });
  }

  function fichaDaTag(t, aoMudar) {
    var dentro = ondeEsta(t.id);
    var f = el("div", { "class": "ficha-tag" });

    f.appendChild(el("div", { "class": "aperto" }, [
      el("span", { "class": "tag-en", texto: t.tag }),
      el("span", { "class": "tag-pt", texto: "— " + t.pt })
    ]));

    f.appendChild(el("p", { "class": "explica", texto: t.explica }));

    f.appendChild(el("div", { "class": "aperto" }, [
      el("span", {
        "class": "discreto",
        texto: dentro ? "Está no seu prompt, em: " + nomeDoAlvo(dentro) : "Não está no seu prompt."
      }),
      el("button", {
        "class": dentro ? "botao-p" : "botao-p botao-forte",
        type: "button",
        texto: dentro ? "Tirar do prompt" : "Pôr no prompt",
        ao: { click: function () { alternarTag(t); if (aoMudar) aoMudar(); } }
      })
    ]));

    if (t.aviso) f.appendChild(nota("amarela", "Atenção", t.aviso));

    if (t.verificada === false) {
      f.appendChild(nota("amarela", "Tag não verificada",
        "Esta tag não foi encontrada no manual oficial do NovelAI. Ela pode não existir para a IA, e ser simplesmente ignorada."));
    }

    (t.requer || []).forEach(function (r) {
      var o = tagDe(r);
      if (!o) return;
      var falta = !estaNoPrompt(r);
      var linha = el("div", { "class": "nota" }, [
        el("span", { "class": "rot", texto: "Funciona melhor acompanhada" }),
        el("p", { texto: "O manual diz que " + t.tag + " rende mais junto com " + o.tag + " (" + o.pt + ")." })
      ]);
      if (falta) {
        linha.appendChild(el("button", {
          "class": "botao-p", type: "button", texto: "Adicionar " + o.tag + " junto",
          ao: { click: function () { porTag(o); salvarRascunho(); if (aoMudar) aoMudar(); } }
        }));
      }
      f.appendChild(linha);
    });

    var brigando = (t.conflita_com || []).filter(estaNoPrompt);
    if (brigando.length) {
      f.appendChild(nota("amarela", "Briga com o que você já escolheu",
        t.tag + " briga com " + brigando.map(nomeDaTag).join(", ") +
        ". Dá para manter as duas, mas o resultado tende a sair instável."));
    }

    var barra = [];
    if (t.modelo_minimo && t.modelo_minimo !== "qualquer") {
      barra.push("Só no modelo " + t.modelo_minimo.toUpperCase() + " ou mais novo");
    }
    if (t.so_em && t.so_em.length) barra.push("Só no modelo " + t.so_em.join(" ou "));
    if (t.genero === "f") barra.push("Vale para personagem feminina");
    if (t.genero === "m") barra.push("Vale para personagem masculino");
    if ((t.exclusivo_com || []).length) {
      barra.push("Só uma tag desta gaveta por vez — escolher esta tira a anterior");
    }
    if (barra.length) f.appendChild(el("p", { "class": "discreto", texto: barra.join(" · ") }));

    f.appendChild(blocoDeExemplo(t));
    f.appendChild(el("p", { "class": "fonte", texto: "Fonte: " + t.origem }));
    return f;
  }

  /* =================================================================
     7. Gavetas de tags — o desenho que o autor já aprovou no tutorial
     ================================================================= */

  /* ⚠ A FICHA NASCIA ONDE ELE NUNCA A VERIA.

     Havia um slot só, no topo do módulo, e `alvo.appendChild(fichaSlot)`
     rodava ANTES das gavetas — então a ficha era sempre o primeiro elemento
     da tela, e nada rolava até ela. Medido no navegador, com a Oficina de
     pé: clicando cinco tags, a ficha nascia entre 938 e 7.688 pixels ACIMA
     da janela. Nas cinco, invisível.

     O que ficava invisível não era pouco: 42 tags têm desenho esquemático,
     312 têm o quadrado "solte aqui uma imagem sua", e a ficha carrega também
     o aviso amarelo e o "funciona melhor acompanhada" — coisas como «As
     etiquetas de qualidade empurram para o anime bonitinho padrão. Ao
     perseguir um estilo, desligue-as ou enfraqueça com colchetes.»

     Hoje CADA subgaveta tem o seu slot, logo abaixo das pastilhas dela. A
     ficha abre a dois dedos do dedo que clicou. Clicar de novo na mesma tag
     fecha. E `scrollIntoView({block:"nearest"})` só age quando a ficha
     nasceu fora da vista — ele não é arrancado do lugar onde estava lendo. */
  function montarGavetas(alvo, idsDeCategoria, opc) {
    opc = opc || {};
    limpar(alvo);
    var slots = [];

    function fecharTodas() {
      slots.forEach(function (sl) { limpar(sl); sl.removeAttribute("data-tag"); });
      $$(".bolinha-ler", alvo).forEach(function (x) { x.setAttribute("aria-expanded", "false"); });
    }

    function slotDe(bolinhaEl) {
      var sub = bolinhaEl && bolinhaEl.closest ? bolinhaEl.closest(".subgaveta") : null;
      var sl = sub ? sub.querySelector(".ficha-slot") : null;
      return sl || slots[0] || null;
    }

    function desenharFicha(sl, t, bolinhaEl) {
      limpar(sl);
      sl.setAttribute("data-tag", t.id);
      sl.appendChild(fichaDaTag(t, function () {
        // a ficha se redesenha quando o botão dentro dela muda o prompt
        atualizarBolinhas(alvo);
        desenharFicha(sl, t, bolinhaEl);
      }));
      var lb = bolinhaEl ? bolinhaEl.querySelector(".bolinha-ler") : null;
      if (lb) lb.setAttribute("aria-expanded", "true");
    }

    function abrirFicha(t, bolinhaEl) {
      var sl = slotDe(bolinhaEl);
      if (!sl) return;
      var jaAberta = sl.getAttribute("data-tag") === t.id && sl.firstChild;
      fecharTodas();
      if (jaAberta) return;                       // clicar de novo fecha
      desenharFicha(sl, t, bolinhaEl);
      if (sl.scrollIntoView) {
        try { sl.scrollIntoView({ block: "nearest" }); } catch (e) { /* navegador antigo */ }
      }
    }

    function aoAlternar(t, bolinhaEl) {
      var r = alternarTag(t);
      atualizarBolinhas(alvo);
      var sl = slotDe(bolinhaEl);
      if (sl && sl.getAttribute("data-tag") === t.id && sl.firstChild) {
        desenharFicha(sl, t, bolinhaEl);
      }
      if (r.acao === "pos" && r.falta && r.falta.length) {
        torrada("O manual recomenda usar " + t.tag + " junto com " +
          r.falta.map(nomeDaTag).join(", ") + ". Clique na palavra para abrir a ficha e pôr as duas.");
      }
    }

    var cats = (A().categorias || []).filter(function (c) {
      return !idsDeCategoria || idsDeCategoria.indexOf(c.id) >= 0;
    });

    // quantas gavetas já entraram na tela — é o que diz qual é a primeira
    var desenhadas = 0;

    cats.forEach(function (c) {
      var quantas = 0;
      var miolo = el("div", { "class": "miolo" });

      (c.subcategorias || []).forEach(function (s) {
        var tags = (POR_CAT[c.id] && POR_CAT[c.id][s.id]) || [];
        if (!tags.length) return;
        quantas += tags.length;

        var rot = el("div", { "class": "rotulo" }, [
          doc.createTextNode(s.nome)
        ]);
        if (s.eixo_unico) {
          rot.appendChild(el("span", {
            "class": "so-uma",
            texto: "— só uma por vez: escolher outra tira a anterior"
          }));
        }

        var bolas = el("div", { "class": "bolinhas" });
        tags.forEach(function (t) { bolas.appendChild(bolinha(t, abrirFicha, aoAlternar)); });

        // o lugar da ficha desta gaveta: logo abaixo das pastilhas dela
        var slot = el("div", { "class": "ficha-slot" });
        slots.push(slot);

        miolo.appendChild(el("div", { "class": "subgaveta", "data-sub": c.id + "/" + s.id }, [rot, bolas, slot]));
      });

      if (!quantas) return;

      var g = el("details", { "class": "gaveta", "data-cat": c.id });
      /* `abertas: "primeira"` abre só a primeira gaveta e deixa as outras
         fechadas. É a decisão do autor de 27/08/2026, e o efeito é a razão
         inteira desta rodada: o Armazém abria com as 17 gavetas
         escancaradas — 2.956 elementos, 1.000 botões, onze telas e meia de
         rolagem, 3.266 palavras. Uma decisão por vez na tela; gaveta
         fechada é informação a menos competindo. */
      if (opc.abertas === true || (opc.abertas === "primeira" && desenhadas === 0)) {
        g.setAttribute("open", "open");
      }
      g.appendChild(el("summary", {}, [
        doc.createTextNode(c.nome),
        el("span", { "class": "cont", texto: quantas + " tags" })
      ]));
      g.appendChild(miolo);
      alvo.appendChild(g);
      desenhadas += 1;
    });

    return alvo;
  }

  /* A busca é o caminho principal do Armazém, não o alternativo: com 499
     tags em 57 gavetas, procurar é mais rápido do que lembrar em qual
     gaveta a coisa estava.

     Ela devolve quantas tags casaram, para a linha de resultado dizer o
     número em vez de deixar o autor contar pastilha. E, ao apagar a busca,
     as gavetas VOLTAM a ficar fechadas — antes elas ficavam todas abertas
     depois de uma busca, e o Armazém voltava a ser a parede de 499 tags
     que esta rodada foi feita para desfazer. */
  function filtrarGavetas(raiz, texto) {
    var alvo = String(texto || "").trim().toLowerCase();
    var total = 0;
    var comResultado = 0;
    var primeira = true;
    $$(".gaveta", raiz).forEach(function (g) {
      var vivasNaGaveta = 0;
      $$(".subgaveta", g).forEach(function (s) {
        var vivas = 0;
        $$(".bolinha", s).forEach(function (b) {
          var t = tagDe(b.getAttribute("data-tag"));
          var casa = !alvo || (t && (
            t.tag.toLowerCase().indexOf(alvo) >= 0 ||
            String(t.pt).toLowerCase().indexOf(alvo) >= 0 ||
            String(t.explica).toLowerCase().indexOf(alvo) >= 0));
          b.classList.toggle("oculto", !casa);
          if (casa) vivas += 1;
        });
        s.classList.toggle("oculto", vivas === 0);
        vivasNaGaveta += vivas;
      });
      g.classList.toggle("oculto", vivasNaGaveta === 0);
      total += vivasNaGaveta;
      if (vivasNaGaveta) comResultado += 1;

      if (alvo) {
        if (vivasNaGaveta) g.setAttribute("open", "open");
      } else if (primeira) {
        g.setAttribute("open", "open");
        primeira = false;
      } else {
        g.removeAttribute("open");
      }
    });
    return { tags: total, gavetas: comResultado };
  }

  /* =================================================================
     8. MÓDULO — ARMAZÉM DE TAGS  (exigências 4 e 5)
     ================================================================= */

  var armazemPronto = false;

  function moduloArmazem(sec) {
    if (armazemPronto) { atualizarBolinhas(sec); return; }
    armazemPronto = true;
    limpar(sec);

    /* ⚠ ERAM 3.266 PALAVRAS ANTES DA PRIMEIRA TAG.

       O cabeçalho deste módulo trazia quatro blocos de texto abertos, um
       deles de sessenta palavras explicando os dois cliques da pastilha.
       Parágrafo de cinco linhas não é lido — e o que explicava o gesto
       ficava justamente onde ninguém chegava.

       Hoje o cabeçalho tem UMA frase. O resto foi para trás de um clique
       ("Como funciona a pastilha"), fechado por padrão, junto do desenho
       das caixas do prompt que também morava aberto aqui. */
    sec.appendChild(el("div", { "class": "cabecalho-modulo" }, [
      el("h2", { texto: "Armazém de tags" }),
      el("p", { texto: "Procure a característica que você quer e clique no + para pôr no seu prompt." })
    ]));

    var busca = el("input", {
      type: "search",
      id: "busca-armazem",
      placeholder: "cabelo, chuva, close…",
      "aria-label": "Procurar uma tag em português ou em inglês"
    });
    var gavetas = el("div", {});
    var contaBusca = el("p", { "class": "discreto", id: "conta-busca", role: "status" });

    function buscar() {
      var r = filtrarGavetas(gavetas, busca.value);
      var termo = busca.value.trim();
      if (!termo) {
        contaBusca.textContent = "";
        return;
      }
      contaBusca.textContent = r.tags
        ? plural(r.tags, "tag") + " em " + plural(r.gavetas, "gaveta") + " para “" + termo + "”."
        : "Nenhuma tag com “" + termo + "”. Tente outra palavra, em português ou em inglês.";
    }
    busca.addEventListener("input", buscar);

    /* A busca vem ANTES de tudo o mais, e sozinha na linha. Com 499 tags em
       57 gavetas, procurar é mais rápido do que lembrar onde a coisa
       estava — então ela é o caminho principal, não o alternativo. Os
       botões de abrir e fechar tudo saíram: "abrir todas" refazia com um
       clique exatamente a parede que esta rodada desfez. */
    sec.appendChild(el("label", {
      "class": "busca-rotulo", "for": "busca-armazem",
      texto: "Procure uma tag, em português ou em inglês"
    }));
    sec.appendChild(el("div", { "class": "linha-busca" }, [busca]));
    sec.appendChild(contaBusca);

    sec.appendChild(el("div", { "class": "nota", id: "aviso-alvo", role: "status" }));

    /* O desenho das quatro caixas do prompt (base, personagem, indesejado,
       texto) já existia em esquemas.js desde a primeira versão, pronto e
       testado, e nunca tinha sido chamado em lugar nenhum — achado da
       auditoria de 24/08/2026. É exatamente o desenho que explicaria de
       uma vez, sem texto técnico, a confusão de "para onde minha tag vai".
       Vive aqui dentro, fechado: quem já sabe não o vê. */
    var ajuda = el("details", { "class": "gaveta gaveta-ajuda" });
    ajuda.appendChild(el("summary", { texto: "Como funciona a pastilha, e para onde a tag vai" }));
    var mioloAjuda = el("div", { "class": "miolo" }, [
      el("p", { texto: "A pastilha tem duas metades, e cada uma faz uma coisa." }),
      el("p", { texto: "A palavra abre a ficha da tag: o que ela faz, o desenho, os avisos e a fonte no manual. Isso não mexe no seu prompt." }),
      el("p", { texto: "O + do canto põe a tag no prompt. Ele vira × e tira de volta." }),
      el("p", { "class": "discreto", texto: "O que você monta aqui é o " + GLOSSARIO.prompt() + ". Cada pastilha é uma " + GLOSSARIO.tag() + "." })
    ]);
    if (global.Esquemas) {
      var desenhoCaixas = global.Esquemas.desenhar("caixas_do_prompt");
      if (desenhoCaixas) {
        mioloAjuda.appendChild(el("h4", { texto: "As quatro caixas do prompt" }));
        mioloAjuda.appendChild(el("div", { "class": "esquema", html: desenhoCaixas }));
        mioloAjuda.appendChild(el("p", { "class": "discreto", texto: "Desenho feito pela oficina, só com linhas. Não é imagem gerada." }));
      }
    }
    ajuda.appendChild(mioloAjuda);
    sec.appendChild(ajuda);

    sec.appendChild(gavetas);
    // decisão do autor: todas fechadas, menos a primeira
    montarGavetas(gavetas, null, { abertas: "primeira" });
    atualizarAvisoDeAlvo();
  }

  /* ⚠ Isto é o que resolve "não sei dar características a UM personagem".

     A oficina já separa características por personagem: cada caixa aberta
     na Bancada (à direita) é um alvo próprio, e um seletor ali muda para
     onde a próxima tag clicada aqui no Armazém vai. O problema nunca foi a
     falta do recurso — foi ele ficar invisível: a nota antiga cabia numa
     linha discreta, igual para "prompt base" e para "caixa do personagem 2",
     sem dizer que existem caixas nem como abrir uma. Hoje, quando o alvo é
     uma caixa de personagem, a nota vira amarela e ganha o nome de quem foi
     posto ali. Quando não há nenhuma caixa aberta ainda, ela ensina o
     primeiro passo em vez de só citar "a Bancada, do lado direito". */
  function atualizarAvisoDeAlvo() {
    var n = $("#aviso-alvo");
    if (!n) return;
    limpar(n);
    var ehPersonagem = String(P.alvo || "").charAt(0) === "p";
    var destino = nomeDoAlvo(P.alvo);
    var texto = "As tags que você clicar agora, aqui no Armazém, vão para: " + destino + ".";
    if (!ehPersonagem) {
      texto += P.personagens.length
        ? " Para dar características a UM personagem específico (por exemplo, só o cabelo louro da garota), abra a caixa dele na Bancada, do lado direito, e troque o seletor \"A tag que eu clicar vai para\"."
        : " Para dar características a UM personagem específico numa cena com vários, clique em \"Abrir caixa de personagem\" na Bancada, do lado direito — isso já muda o alvo para a caixa nova.";
    } else {
      texto += " Troque de novo pelo seletor da Bancada (ou pelo botão \"Mandar as tags para cá\" dentro da caixa) quando quiser voltar ao prompt base ou passar para outro personagem.";
    }
    var caixaNota = nota(ehPersonagem ? "amarela" : "", "Onde a tag vai cair", texto);
    n.appendChild(caixaNota);
  }

  /* Monta o índice do que está escolhido UMA vez, e só escreve na bolinha que
     realmente mudou. São 382 bolinhas na tela: varrer o prompt inteiro para
     cada uma, e reescrever as 380 que não mudaram, é trabalho jogado fora. */
  function atualizarBolinhas(raiz) {
    var dentro = {};
    todosOsItens().concat(P.indesejado.itens).forEach(function (it) {
      if (it.id) dentro[it.id] = 1;
    });
    $$(".bolinha", raiz || doc).forEach(function (b) {
      var idTag = b.getAttribute("data-tag");
      var posta = !!dentro[idTag];
      var v = posta ? "true" : "false";
      if (b.getAttribute("data-posta") === v) return;
      b.setAttribute("data-posta", v);
      var bt = b.querySelector(".bolinha-por");
      if (!bt) return;
      var reg = tagDe(idTag);
      bt.setAttribute("aria-pressed", v);
      bt.textContent = posta ? "×" : "+";
      bt.setAttribute("title", posta ? "Tirar do prompt" : "Pôr no prompt");
      bt.setAttribute("aria-label", (posta ? "Tirar " : "Pôr ") + (reg ? reg.tag : idTag) + " no prompt");
    });
    atualizarAvisoDeAlvo();
  }

  /* =================================================================
     9. MÓDULO — ATELIÊ DE PERSONAGEM  (exigência 1)
     ================================================================= */

  var PASSOS = [
    { id: "base", nome: "1. Quem é", cats: ["quem"] },
    { id: "cabelo", nome: "2. Cabelo", cats: ["cabelo"], esquema: "cabelo_comprimento" },
    { id: "olhos", nome: "3. Olhos", cats: ["olhos"] },
    { id: "pele", nome: "4. Pele e rosto", cats: ["pele"] },
    { id: "corpo", nome: "5. Corpo", cats: ["corpo"] },
    { id: "camera", nome: "6. Enquadramento e ângulo", cats: ["enquadramento", "angulo", "multiplas_vistas"], esquema: "enquadramento_escada", esquema2: "angulo_camera" },
    { id: "roupa", nome: "7. Roupa", cats: [] },
    { id: "referencias", nome: "8. Referências", cats: [] },
    { id: "salvar", nome: "9. Salvar o personagem", cats: [] }
  ];

  var passoAtual = "base";

  function moduloAtelie(sec) {
    limpar(sec);
    sec.appendChild(el("div", { "class": "cabecalho-modulo" }, [
      el("h2", { texto: "Ateliê de personagem" }),
      el("p", { texto: "Monte um personagem por partes, do zero ou partindo de imagens que você já tem. No fim ele vira um bloco salvo, que você chama de novo em qualquer cena." })
    ]));

    var pills = el("div", { "class": "passos" });
    PASSOS.forEach(function (p) {
      pills.appendChild(el("button", {
        type: "button", texto: p.nome,
        "aria-current": passoAtual === p.id ? "true" : "false",
        ao: { click: function () { passoAtual = p.id; moduloAtelie(sec); } }
      }));
    });
    sec.appendChild(pills);

    var corpo = el("div", {});
    sec.appendChild(corpo);

    var p = PASSOS.filter(function (x) { return x.id === passoAtual; })[0] || PASSOS[0];

    if (p.id === "base") { passoBase(corpo); return; }
    if (p.id === "roupa") { passoRoupa(corpo); return; }
    if (p.id === "referencias") { passoReferencias(corpo); return; }
    if (p.id === "salvar") { passoSalvar(corpo); return; }

    if (p.esquema && global.Esquemas) {
      var s1 = global.Esquemas.desenhar(p.esquema);
      if (s1) corpo.appendChild(caixa("O que cada opção faz, em desenho", [
        el("div", { "class": "esquema", html: s1 }),
        el("p", { "class": "discreto", texto: "Desenho feito pela oficina, só com linhas. Não é imagem gerada." })
      ]));
    }
    if (p.esquema2 && global.Esquemas) {
      var s2 = global.Esquemas.desenhar(p.esquema2);
      if (s2) corpo.appendChild(el("div", { "class": "caixa" }, [el("div", { "class": "esquema", html: s2 })]));
    }

    var g = el("div", {});
    corpo.appendChild(g);
    montarGavetas(g, p.cats, { abertas: true });
  }

  function passoBase(corpo) {
    corpo.appendChild(nota("", "Comece por aqui",
      "Diga quantas pessoas há na imagem e de que tipo. Esta é a primeira coisa que a IA decide, e por isso ela abre o prompt."));

    var g = el("div", {});
    corpo.appendChild(g);
    montarGavetas(g, ["quem"], { abertas: true });

    // Receitas prontas — para não começar da folha em branco.
    var receitas = (RC().receitas || []);
    if (receitas.length) {
      var cartoes = el("div", { "class": "cartoes" });
      receitas.forEach(function (r) {
        var quantas = idsDaReceita(r).length;
        var cartao = promptDaReceita(r);
        var c = el("button", { "class": "cartao", type: "button" }, [
          el("b", { texto: r.nome }),
          el("span", { texto: r.para_que || "" })
        ]);
        c.appendChild(el("span", {
          "class": "custo",
          texto: quantas
            ? quantas + " tags prontas"
            : "sem tags — é um caminho de ferramenta, não um prompt"
        }));
        if (cartao) c.appendChild(el("span", { "class": "mono", texto: cartao }));
        c.addEventListener("click", function () { usarReceita(r); });
        cartoes.appendChild(c);
      });
      corpo.appendChild(caixa("Ou comece de uma receita pronta", [
        el("p", { texto: "Cada receita é um prompt inteiro tirado do manual. Ela substitui o que estiver no prompt base agora, e põe as tags na mesma ordem em que o manual as escreveu." }),
        cartoes
      ]));
    }

    // Importar do livro — SÓ os nomes.
    var lista = el("div", { "class": "escolhidas" });
    var botao = el("button", {
      type: "button", texto: "Importar nomes do livro",
      ao: {
        click: function () {
          if (!global.Ponte || !global.Ponte.temPonte()) {
            torrada("Isso precisa da oficina aberta pelo arquivo ABRIR A OFICINA.");
            return;
          }
          global.Ponte.personagensDoLivro().then(function (r) {
            limpar(lista);
            if (!r || !r.ok || !(r.nomes || []).length) {
              lista.appendChild(el("span", { "class": "discreto", texto: (r && r.aviso) || "Não achei a pasta de personagens." }));
              return;
            }
            r.nomes.forEach(function (n) {
              lista.appendChild(el("button", {
                "class": "bolinha", type: "button", texto: n,
                ao: { click: function () { P.nome = n; torrada("O personagem em montagem passou a se chamar " + n + "."); salvarRascunho(); } }
              }));
            });
          });
        }
      }
    });

    corpo.appendChild(caixa("Usar um nome do seu livro", [
      el("p", { texto: "A oficina lê só a LISTA DE NOMES dos arquivos de personagem do livro. Ela nunca lê a aparência deles: isso vem de você, ou da imagem de referência que você anexa." }),
      el("div", { "class": "aperto" }, [botao]),
      lista
    ]));
  }

  /* =================================================================
     Usar uma receita pronta — reescrito por inteiro, e por três falhas
     que a crítica mediu na tela aberta.

     1. A RECEITA DO QUADRO DE MANGÁ APAGAVA O PROMPT E NÃO PUNHA NADA.
        Ela é a peça central do produto dele, e não tem `tags_base`: as 19
        tags moram em `blocos[].tags` (ESTILO, PERSONAGEM, QUADRO 1,
        TEXTO). O código lia só `tags_base`, achava lista vazia, zerava o
        prompt e parava. Agora as duas formas são lidas, e o prompt só é
        zerado DEPOIS de haver o que pôr no lugar.

     2. A RECEITA DAS FALAS INVERTIA O EFEITO. O prompt oficial traz
        `-1::speech bubble::` — peso NEGATIVO, para evitar o balão
        desenhado e deixar só o texto. A lista de ids não carrega peso
        nenhum, então a Bancada pedia o balão em vez de evitá-lo. Agora o
        peso é lido de dentro do próprio `prompt_base` da receita, e o
        acervo pode passar a declará-lo por item sem quebrar nada aqui.

     3. DEZ DAS ONZE RECEITAS MOSTRAVAM UM PROMPT E ENTREGAVAM OUTRO. As
        quatro de estilo começam pelo bloco de estilo, que é o modo
        "Estilo em primeiro". A oficina as ordenava no "Padrão do manual"
        e avisava "mudei 7 tags de lugar". Agora ela descobre qual modo
        reproduz o prompt do cartão e muda para esse modo junto com as
        tags. Se nenhum reproduz, ela DIZ isso, em vez de mudar calada.
     ================================================================= */

  function idsDaReceita(r) {
    if (r.tags_base && r.tags_base.length) return r.tags_base.slice();
    var fora = [];
    (r.blocos || []).forEach(function (b) { fora = fora.concat(b.tags || []); });
    (r.etapas || []).forEach(function (b) { fora = fora.concat(b.tags || []); });
    return fora;
  }

  // O prompt que o cartão mostra, seja ele um campo só, vários blocos, ou
  // a última etapa de uma receita que mostra uma evolução.
  function promptDaReceita(r) {
    if (r.prompt_base) return r.prompt_base;
    var partes = (r.blocos || [])
      .filter(function (b) { return (b.tags || []).length && b.prompt; })
      .map(function (b) { return b.prompt; });
    if (partes.length) return partes.join(", ");
    var et = r.etapas || [];
    // a última etapa é a versão completa — é dela que sai a lista de tags
    if (et.length && et[et.length - 1].prompt) return et[et.length - 1].prompt;
    return "";
  }

  /* Quebra o prompt de um cartão nas tags que ele contém, na ordem, já sem
     os sinais de peso. `1.5::rain, night ::` devolve `rain` e `night`;
     `-1::speech bubble::` devolve `speech bubble`; `{{tag}}` devolve `tag`. */
  function tagsDoCartao(cartao) {
    return String(cartao || "")
      .split(",")
      .map(function (p) {
        return p.replace(/^\s*-?\d+(?:\.\d+)?::/, "")
          .replace(/::\s*$/, "")
          .replace(/^[\s{[]+/, "")
          .replace(/[\s}\]]+$/, "")
          .trim();
      })
      .filter(Boolean);
  }

  /* Põe os itens na ordem exata em que o manual escreveu aquele prompt.

     É o que faz o cartão e a Bancada contarem a mesma história quando
     nenhum dos dois modos de ordem reproduz o exemplo. E isso acontece de
     verdade: o prompt de introdução do manual é
     `1girl, flower field, sunset, messy hair...` — a paisagem antes do
     cabelo, que nenhuma regra de balde produz. O exemplo do manual é o que
     o NovelAI documentou; a ordem sugerida pela oficina é conselho. Numa
     receita, quem manda é o exemplo. */
  function palavrasDe(texto) {
    return String(texto || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  }

  // As palavras de `parte` cabem todas dentro de `inteiro`?
  function cabeDentro(parte, inteiro) {
    var dentro = palavrasDe(inteiro);
    var pedaco = palavrasDe(parte);
    if (!pedaco.length) return false;
    return pedaco.every(function (p) { return dentro.indexOf(p) >= 0; });
  }

  function ordemDoCartao(itens, cartao) {
    var ordemTags = tagsDoCartao(cartao);
    if (!ordemTags.length) return itens.slice();
    var indice = {};
    ordemTags.forEach(function (t, i) { if (indice[t] === undefined) indice[t] = i; });

    /* Achar o lugar de uma tag no prompt do manual.

       Nem toda tag aparece com a mesma escrita: o manual escreve
       `short brown hair` numa frase só, e o armazém guarda isso como duas
       tags, `short hair` e `brown hair`. Sem tratar esse caso, as duas
       caíam no fim do prompt, depois de `english text` — longe do lugar
       onde o manual as pôs, que é o que importa, porque tag mais perto do
       começo pesa mais.

       Então, quando a escrita exata não existe no cartão, a oficina
       procura o trecho do cartão que CONTÉM todas as palavras da tag, e usa
       a posição dele. `short hair` e `brown hair` acham as duas o trecho
       `short brown hair`, e a ordem entre elas fica a da própria receita. */
    function posicaoDe(txt) {
      if (indice[txt] !== undefined) return indice[txt];
      for (var i = 0; i < ordemTags.length; i++) {
        if (cabeDentro(txt, ordemTags[i])) return i;
      }
      return 1e9;
    }

    return itens
      .map(function (it, i) {
        return { it: it, i: i, pos: posicaoDe(it.valor || it.tag) };
      })
      .sort(function (a, b) { return a.pos !== b.pos ? a.pos - b.pos : a.i - b.i; })
      .map(function (x) { return x.it; });
  }

  /* Compara, trecho a trecho, o prompt do manual com o que a oficina
     montou. Devolve três coisas, e a diferença entre elas importa:

       igual        — palavra por palavra, o mesmo texto;
       equivalente  — diz a mesma coisa na mesma ordem, mas um trecho do
                      manual está escrito como tags separadas no armazém
                      (o caso do `short brown hair`);
       diferente    — a ordem ou o conteúdo mudaram, e isso é defeito.

     Sem essa distinção, a conferência da oficina diria "FALHOU" para uma
     receita que está certa, e o autor aprenderia a ignorar a conferência —
     que é o mesmo estrago do alerta vermelho falso. */
  function compararComCartao(cartao, montado) {
    if (cartao === montado) return { igual: true, equivalente: true, trechos: [] };

    var a = tagsDoCartao(cartao);
    var b = tagsDoCartao(montado);
    var i = 0, j = 0, trechos = [];

    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i += 1; j += 1; continue; }
      if (cabeDentro(b[j], a[i])) {
        var juntadas = [];
        while (j < b.length && cabeDentro(b[j], a[i])) { juntadas.push(b[j]); j += 1; }
        trechos.push({ manual: a[i], oficina: juntadas });
        i += 1;
        continue;
      }
      return { igual: false, equivalente: false, trechos: trechos, parou_em: a[i] };
    }
    if (i < a.length || j < b.length) {
      return { igual: false, equivalente: false, trechos: trechos, parou_em: a[i] || b[j] };
    }
    return { igual: false, equivalente: true, trechos: trechos };
  }

  /* Preenche `year XXXX` com o ano que o próprio cartão traz.

     A receita do pixel art aponta para a tag `year XXXX` e mostra
     `year 1998` no prompt. Sem isto, usar a receita punha o XXXX literal
     na Bancada. */
  function preencherPeloCartao(it, cartao) {
    if (!it.preencher) return;
    var molde = new RegExp("^" + String(it.tag)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/XXXX/g, "(.+)") + "$", "i");
    var achou = null;
    tagsDoCartao(cartao).forEach(function (t) {
      if (!achou && molde.test(t)) achou = t;
    });
    if (achou) it.valor = achou;
  }

  // O que a Bancada vai mostrar, para comparar com o cartão.
  function textoDaBase(itens) {
    return global.Motor ? global.Motor.juntar(itens) : itens.map(textoDoItem).join(", ");
  }

  // A fala da receita, venha ela em `bloco_texto` ou num bloco de texto.
  function textoDaReceita(r) {
    if (r.bloco_texto) return [].concat(r.bloco_texto);
    var achou = [];
    (r.blocos || []).forEach(function (b) {
      if (!(b.tags || []).length && b.prompt && /^\s*Text\s*:/i.test(b.prompt)) achou.push(b.prompt);
    });
    return achou;
  }

  /* A montagem de uma receita, separada de quem a aplica na tela.

     Separada de propósito: assim a conferência da Sala de Recursos roda
     ESTA função — a de verdade, a mesma que o botão usa — contra as onze
     receitas do acervo, e o autor pode ver com um clique se alguma delas
     mostra um prompt no cartão e entrega outro na Bancada. Uma conferência
     que testa uma cópia do código não confere nada. */
  function montarBaseDaReceita(r) {
    var ids = idsDaReceita(r);
    var promptCartao = promptDaReceita(r);
    var novos = [];

    ids.forEach(function (entrada) {
      var id = typeof entrada === "string" ? entrada : (entrada && entrada.id);
      var t = tagDe(id);
      if (!t) return;
      var it = itemDe(t);
      if (entrada && entrada.valor) it.valor = entrada.valor;
      if (!it.valor) preencherPeloCartao(it, promptCartao);
      if (entrada && entrada.peso) {
        it.peso = entrada.peso;
      } else if (promptCartao && global.Motor && global.Motor.lerPesoDoTexto) {
        it.peso = global.Motor.lerPesoDoTexto(promptCartao, it.valor || it.tag);
      }
      novos.push(it);
    });

    if (!novos.length) return { itens: [], cartao: promptCartao, modo: null, faltou: ids.length > 0 };

    var modo = null;
    if (promptCartao && global.Ordenador && global.Ordenador.modoQueReproduz) {
      var entrada2 = novos.map(function (it, i) {
        return { chave: "__pos" + i, rotulo: it.valor || it.tag, ordem: it.ordem, travada: false };
      });
      modo = global.Ordenador.modoQueReproduz(entrada2, promptCartao);
    }

    var itens;
    if (modo) {
      var rr = global.Ordenador.ordenar(
        novos.map(function (it, i) {
          return { chave: "__pos" + i, rotulo: it.valor || it.tag, ordem: it.ordem, travada: false };
        }), { modo: modo });
      itens = rr.ordenada.map(function (x) { return novos[parseInt(String(x.chave).slice(5), 10)]; });
    } else if (promptCartao) {
      itens = ordemDoCartao(novos, promptCartao);
    } else {
      itens = novos;
    }

    return { itens: itens, cartao: promptCartao, modo: modo, faltou: false };
  }

  function usarReceita(r) {
    if (travadoPelaRecuperacao()) return;

    var montada = montarBaseDaReceita(r);
    var promptCartao = montada.cartao;

    if (!montada.itens.length) {
      torrada(montada.faltou
        ? "As tags desta receita não existem no armazém — não posso montá-la."
        : "Esta receita não traz tags para o prompt — ela é um caminho de ferramenta. Leia a ficha dela aqui embaixo.");
      return;
    }

    if (r.modelo_sugerido) P.modelo = casarModelo(r.modelo_sugerido);

    var recado = "Receita “" + r.nome + "” carregada no prompt base.";
    avisoDaReceita = null;

    /* Se algum modo de ordem reproduz o prompt do cartão — é o caso das
       quatro receitas de estilo, que começam pelo bloco de estilo —, a
       oficina troca para esse modo e SEGUE ordenando sozinha, inclusive as
       tags que ele acrescentar depois.

       Se nenhum reproduz, ela usa a ordem do próprio manual e DESLIGA a
       ordenação automática, dizendo isso na tela. O contrário seria
       mostrar um prompt no cartão e entregar outro na Bancada, que era o
       defeito: dez das onze receitas faziam isso. */
    P.base = montada.itens;
    if (montada.modo) {
      if (montada.modo !== P.ordem) {
        P.ordem = montada.modo;
        recado += " Pus na ordem “" + global.Ordenador.modo(montada.modo).nome +
          "”, que é como o manual escreveu este exemplo.";
      }
    } else if (promptCartao && P.ordenarAuto) {
      P.ordenarAuto = false;
      recado += " Deixei as tags na ordem exata do manual e desliguei a ordenação automática, " +
        "para a Bancada mostrar o mesmo que o cartão. Você religa na Bancada quando quiser.";
    }

    var falas = textoDaReceita(r);
    if (falas.length) {
      P.textos = falas.map(function (t) {
        return global.Motor ? global.Motor.semPrefixoDeTexto(t) : String(t);
      });
    }

    /* Última conferência, e ela é honesta: o que a Bancada montou bate
       palavra por palavra com o prompt do cartão? Quando não bate, a
       diferença é quase sempre o armazém guardar como DUAS tags o que o
       manual escreveu como uma frase — `short brown hair` virou
       `short hair` mais `brown hair`. Isso não é erro, e o autor tem de
       poder ver os dois textos lado a lado em vez de descobrir depois. */
    if (promptCartao) {
      var montadoAgora = textoDaBase(baseOrdenada());
      var comp = compararComCartao(promptCartao, montadoAgora);
      if (!comp.igual) {
        avisoDaReceita = {
          receita: r.nome,
          cartao: promptCartao,
          bancada: montadoAgora,
          equivalente: comp.equivalente,
          trechos: comp.trechos
        };
      }
    }

    torrada(recado);
    salvarRascunho();
    irPara("bancada");
  }

  /* Guarda a diferença entre o prompt do cartão e o que a Bancada montou,
     para a Bancada mostrar os dois. Some quando ele mexe no prompt. */
  var avisoDaReceita = null;

  function casarModelo(id) {
    var lista = global.Motor ? global.Motor.modelos() : [];
    for (var i = 0; i < lista.length; i++) { if (lista[i].id === id) return id; }
    return P.modelo;
  }

  /* --- passo 7: a roupa, peça por peça, com a cor obrigatória ------ */

  var ORDEM_DA_ROUPA = [
    { sub: "cabeca", nome: "Cabeça" },
    { sub: "tronco", nome: "Tronco" },
    { sub: "pernas", nome: "Pernas" },
    { sub: "calcado", nome: "Calçado" },
    { sub: "acessorio", nome: "Acessório" }
  ];

  function passoRoupa(corpo) {
    corpo.appendChild(nota("amarela", "É aqui que a consistência mais escapa",
      "O manual manda escrever a cor junto de cada peça, e descrever cabeça, tronco e pernas separadamente. Peça sem cor sai diferente a cada tentativa."));

    corpo.appendChild(caixa("A diferença, no exemplo do próprio manual", [
      el("p", { texto: "Vago, e por isso instável:" }),
      el("div", { "class": "saida", texto: "witch hat, robe" }),
      el("p", { texto: "Completo, e por isso repetível:" }),
      el("div", { "class": "saida", texto: "witch hat, blue headwear, blue cape, white shirt, long sleeves, corset, leather belt, leather pouch, short skirt, blue skirt, frilled skirt, black pantyhose, brown gloves, knee boots" })
    ]));

    var cores = coresDoAcervo();
    var semCor = [];

    ORDEM_DA_ROUPA.forEach(function (slot) {
      var tags = (POR_CAT.roupa && POR_CAT.roupa[slot.sub]) || [];
      if (!tags.length) return;

      var bolas = el("div", { "class": "bolinhas" });
      var fichaAqui = el("div", { "class": "ficha-slot" });
      tags.forEach(function (t) {
        bolas.appendChild(bolinha(
          t,
          function (tt) {
            // ler não mexe no prompt, aqui também
            var jaEra = fichaAqui.getAttribute("data-tag") === tt.id && fichaAqui.firstChild;
            limpar(fichaAqui);
            fichaAqui.removeAttribute("data-tag");
            if (jaEra) return;
            fichaAqui.setAttribute("data-tag", tt.id);
            fichaAqui.appendChild(fichaDaTag(tt, function () { moduloAtelie($("#mod-atelie")); }));
          },
          function (tt) {
            alternarTag(tt);
            moduloAtelie($("#mod-atelie"));
          }
        ));
      });

      var escolhidas = el("div", {});
      tags.filter(function (t) { return estaNoPrompt(t.id); }).forEach(function (t) {
        var it = itemDaTag(t.id);
        if (!it) return;
        var temCor = !!it.valor;
        if (!temCor) semCor.push(t.tag);

        var sel = el("select", { "aria-label": "Cor de " + t.tag });
        sel.appendChild(el("option", { value: "", texto: "sem cor — não recomendado" }));
        cores.forEach(function (c) {
          var o = el("option", { value: c.en, texto: c.en + " (" + c.pt + ")" });
          if (it.valor === c.en + " " + t.tag) o.setAttribute("selected", "selected");
          sel.appendChild(o);
        });
        sel.addEventListener("change", function () {
          it.valor = sel.value ? sel.value + " " + t.tag : "";
          salvarRascunho();
          moduloAtelie($("#mod-atelie"));
        });

        escolhidas.appendChild(el("div", { "class": "peso-linha" }, [
          el("span", { "class": "mono", texto: it.valor || t.tag }),
          el("label", { texto: "cor: " }),
          sel,
          temCor ? null : el("span", { "class": "discreto", texto: "esta peça ainda não tem cor" })
        ]));
      });

      corpo.appendChild(caixa(slot.nome, [
        bolas,
        fichaAqui,
        escolhidas.childNodes.length ? el("hr", {}) : null,
        escolhidas
      ]));
    });

    if (semCor.length) {
      corpo.insertBefore(
        nota("amarela", "Falta a cor de " + semCor.length + " peça(s)",
          "Estas peças estão sem cor: " + semCor.join(", ") +
          ". Escolha a cor de cada uma no seletor ao lado dela. Sem isso, cada geração inventa uma cor diferente."),
        corpo.firstChild
      );
    }
  }

  function itemDaTag(idTag) {
    var t = todosOsItens(), i;
    for (i = 0; i < t.length; i++) { if (t[i].id === idTag) return t[i]; }
    return null;
  }

  /* Grava no disco uma imagem que ele soltou, e devolve o nome do arquivo.

     Sem ponte, devolve vazio — e aí a imagem vive só nesta sessão, o que a
     tela diz na cara em vez de fingir que salvou. */
  function guardarImagemDeTrabalho(arq, prefixo) {
    if (!global.Ponte || !global.Memoria || global.Memoria.seco()) return Promise.resolve("");
    var d = new Date();
    function dd(n) { return String(n).padStart(2, "0"); }
    var limpo = String(arq.nome || "imagem.png").replace(/[^\w.\- ]+/g, "_");
    var nome = prefixo + "_" + d.getFullYear() + dd(d.getMonth() + 1) + dd(d.getDate()) +
      "_" + dd(d.getHours()) + dd(d.getMinutes()) + dd(d.getSeconds()) + "_" + limpo;
    return global.Ponte.enviarImagem("referencias", nome, arq.dados).then(function (r) {
      if (r && r.ok) { torrada("Guardei a imagem em meu_trabalho\\referencias."); return r.nome || nome; }
      torrada((r && r.erro) || "Não consegui guardar a imagem no disco. Ela vale só nesta sessão.");
      return "";
    }, function () { return ""; });
  }

  /* --- passo 8: as referências, e o aviso das duas que se misturam - */

  function passoReferencias(corpo) {
    var refs = R().referencias || {};

    corpo.appendChild(nota("", "O que é uma referência",
      "É uma imagem que você já tem e entrega à IA como modelo. A oficina guarda a imagem em meu_trabalho\\referencias, " +
      "monta o pedido e diz onde anexar cada arquivo no site."));
    corpo.appendChild(el("p", { "class": "discreto glossario", texto: "Os custos abaixo são em " + GLOSSARIO.anlas() + "." }));

    var zona = el("div", {});
    zonaDeSolta(zona, function (arq) {
      var r = {
        id: novaChave(), tipo: "character", nome: arq.nome, arquivo: "",
        dados: arq.dados, forca: 0.6, fidelidade: 1
      };
      P.referencias.push(r);
      /* A imagem vai para o disco na hora. É o que a faz sobreviver a
         fechar a aba: o rascunho guarda o NOME do arquivo, e na próxima
         sessão a oficina lê os bytes de volta de meu_trabalho\referencias.
         Sem isso, a referência recuperada era um nome e nada mais. */
      guardarImagemDeTrabalho(arq, "ref").then(function (nome) {
        if (nome) { r.arquivo = nome; salvarRascunho(); }
      });
      salvarRascunho();
      moduloAtelie($("#mod-atelie"));
    }, "Solte aqui uma imagem de referência");
    zona.appendChild(el("strong", { texto: "Solte aqui uma imagem de referência" }));
    zona.appendChild(el("span", { texto: "ou clique para escolher um arquivo" }));
    corpo.appendChild(caixa("Suas referências", [zona]));

    var nChar = P.referencias.filter(function (r) { return r.tipo === "character"; }).length;
    var nVibe = P.referencias.filter(function (r) { return r.tipo === "vibe"; }).length;

    if (nChar >= 2) {
      corpo.appendChild(nota("vermelha", "Duas referências de personagem viram UM personagem só",
        "Isto é limite oficial do NovelAI, não escolha da oficina: várias referências de personagem se MISTURAM numa pessoa só. Elas não geram dois personagens. Para dois personagens de verdade, use as caixas de personagem da Bancada (até 6), com a contagem só no prompt base."));
    }
    if (nChar && nVibe) {
      corpo.appendChild(nota("vermelha", "Estas duas ferramentas não rodam juntas",
        "Referência Precisa (Character Reference e Style Reference) não funciona na mesma geração que o Vibe Transfer (transferência de clima). Escolha uma das duas e tire a outra."));
    }

    P.referencias.forEach(function (r, i) {
      var sel = el("select", { "aria-label": "Tipo da referência " + (i + 1) });
      [
        ["character", "Character Reference — leva o personagem (rosto, corpo, roupa). Custa 5 Anlas por imagem. Só no V4.5."],
        ["style", "Style Reference — leva só o traço, não quem está na imagem. Custa 5 Anlas por imagem. Só no V4.5."],
        ["vibe", "Vibe Transfer — leva o clima e a cor. Custa 2 Anlas para codificar, uma vez só."]
      ].forEach(function (o) {
        var op = el("option", { value: o[0], texto: o[1] });
        if (r.tipo === o[0]) op.setAttribute("selected", "selected");
        sel.appendChild(op);
      });
      sel.addEventListener("change", function () {
        r.tipo = sel.value; salvarRascunho(); moduloAtelie($("#mod-atelie"));
      });

      var trocar = el("div", {});
      zonaDeSolta(trocar, function (arq) {
        r.nome = arq.nome; r.dados = arq.dados;
        guardarImagemDeTrabalho(arq, "ref").then(function (nome) {
          if (nome) r.arquivo = nome;
          salvarRascunho(); moduloAtelie($("#mod-atelie"));
        });
      }, "Solte aqui a imagem desta referência");
      trocar.appendChild(el("strong", { texto: "Solte aqui a imagem desta referência" }));

      /* ⚠ AS DUAS RÉGUAS QUE A OFICINA ENSINAVA E NÃO OFERECIA.

         A Mesa de Retoque avisa, no cartão da pose: "Força alta copia também
         a POSE da referência (...) Use Força moderada." A Sala de Recursos
         explica Força e Fidelidade. E não havia onde mexer em nenhuma das
         duas: os valores nasciam fixos em 0,6 e 1 no instante em que a
         imagem era solta, e viajavam assim no pedido. A imagem da Mesa de
         Retoque TEM as réguas dela; a referência ficou sem. */
      var reguasDaRef = reguasDaReferencia(r);

      corpo.appendChild(caixa("Referência " + (i + 1) + " — " + r.nome, [
        r.dados ? el("img", { src: r.dados, alt: "sua referência", style: "max-width:220px;border-radius:8px" }) : null,
        /* Referência sem os bytes da imagem não viaja para o NovelAI — e o
           autor não pode pagar por ela achando que viajou. A tela diz isso
           em vermelho, e a conta de custo já a trata como zero. */
        r.dados ? null : nota("vermelha", "A imagem desta referência não está aqui",
          "Ela ficou salva no disco pelo nome “" + (r.arquivo || r.nome) + "”, mas os dados não voltaram para a memória. " +
          "Enquanto for assim, ela NÃO será enviada e NÃO é cobrada. Solte o arquivo de novo no espaço abaixo."),
        r.dados ? null : trocar,
        el("div", { "class": "peso-linha" }, [el("label", { texto: "O que esta imagem entrega: " }), sel]),
        reguasDaRef,
        el("button", {
          "class": "botao-p botao-perigo", type: "button", texto: "Tirar esta referência",
          ao: {
            click: function () {
              P.referencias = P.referencias.filter(function (x) { return x.id !== r.id; });
              salvarRascunho(); moduloAtelie($("#mod-atelie"));
            }
          }
        })
      ]));
    });

    if (global.Esquemas) {
      var s = global.Esquemas.desenhar("preparar_referencia");
      var s2 = global.Esquemas.desenhar("resolucoes_nativas");
      corpo.appendChild(caixa("Como preparar a imagem de referência", [
        el("ul", { "class": "limpa" }, (refs.preparo || []).map(function (x) {
          return el("li", { texto: x });
        })),
        s ? el("div", { "class": "esquema", html: s }) : null,
        s2 ? el("div", { "class": "esquema", html: s2 }) : null,
        el("p", { "class": "discreto", texto: refs.resolucao_explica || "" })
      ]));
    }
  }

  /* As duas réguas de uma referência, com a explicação curta ao lado de
     cada uma. Os textos longos vêm do acervo (Sala de Recursos); aqui fica a
     frase de uma linha, que é o que se lê enquanto se arrasta a régua. */
  function reguasDaReferencia(r) {
    var controles = ((R().referencias || {}).controles) || [];

    function explicaDoAcervo(chave, reserva) {
      for (var i = 0; i < controles.length; i++) {
        var c = controles[i];
        if (c && new RegExp(chave, "i").test(String(c.nome || ""))) return c.explica || reserva;
      }
      return reserva;
    }

    function regua(rot, campo, min, max, explica) {
      var atual = typeof r[campo] === "number" ? r[campo] : 1;
      var faixa = el("input", {
        type: "range", min: String(min), max: String(max), step: "0.05", value: String(atual),
        "aria-label": rot + " desta referência"
      });
      var mostra = el("span", { "class": "peso-mostra", texto: String(atual).replace(".", ",") });
      faixa.addEventListener("input", function () {
        r[campo] = parseFloat(faixa.value);
        mostra.textContent = String(r[campo]).replace(".", ",");
      });
      faixa.addEventListener("change", function () { salvarRascunho(); });
      return el("div", {}, [
        el("div", { "class": "peso-linha" }, [el("label", { texto: rot + ": " }), faixa, mostra]),
        el("p", { "class": "discreto", texto: explica })
      ]);
    }

    return el("div", {}, [
      regua("Força", "forca", 0, 1,
        explicaDoAcervo("for\u00e7a|strength",
          "Quanto a IA copia desta imagem. Força alta copia também a pose e o ângulo — é o que atrapalha quando o objetivo é justamente mudar a pose.")),
      regua("Fidelidade", "fidelidade", 0, 1,
        explicaDoAcervo("fidelidade|fidelity",
          "Quanto o seu prompt consegue vencer a imagem. Fidelidade alta faz a imagem mandar; baixa deixa o prompt mandar mais.")),
      el("p", { "class": "discreto", texto: "Os dois aceitam valor negativo no site do NovelAI; aqui a régua vai de 0 a 1, que é a faixa de uso normal." })
    ]);
  }

  function passoSalvar(corpo) {
    var nome = el("input", { type: "text", value: P.nome, placeholder: "Nome do personagem" });
    nome.addEventListener("input", function () { P.nome = nome.value; });

    corpo.appendChild(caixa("Salvar este personagem", [
      el("p", { texto: "O personagem vira um bloco reusável: você o chama depois em qualquer cena, e as tags dele voltam inteiras." }),
      el("div", { "class": "peso-linha" }, [
        el("label", { texto: "Nome: " }), nome,
        el("button", {
          "class": "botao-forte", type: "button", texto: "Salvar personagem",
          ao: { click: function () { salvarPersonagem(nome.value); } }
        })
      ]),
      /* O nome da gaveta é descoberto na ponte, e não escrito aqui.
         A tela dizia `meu_trabalho\personagens`, e a pasta real é
         `meu_trabalho\meus_personagens` — a própria ponte recusa o nome
         antigo. Era a única frase que ele lê no instante em que salva. */
      el("p", { "class": "discreto", texto: "Com a oficina ligada, isto grava em meu_trabalho\\" + gavetaDePersonagens() + ". Sem a " + GLOSSARIO.ponte() + ", grava na memória do navegador — e aí use o botão Baixar meu trabalho, no alto da tela." })
    ]));

    var lista = el("div", { "class": "escolhidas" });
    corpo.appendChild(caixa("Personagens que você já salvou", [lista]));
    /* ⚠ NÃO EXISTIA JEITO DE APAGAR NADA SALVO — achado da auditoria de
       24/08/2026. `Memoria.apagar` já existia e já era usado no Álbum de
       exemplos (`apagarExemplo`); só faltava o botão aqui. Sem isso, um
       personagem salvo com nome errado ficava para sempre na lista, e a
       única saída era abrir a pasta meu_trabalho no Explorador do
       Windows — que o autor, leigo em programação, não sabe fazer. */
    function recarregarListaDePersonagens() {
      if (!global.Memoria) return;
      global.Memoria.listar("personagens").then(function (itens) {
        limpar(lista);
        if (!itens.length) {
          lista.appendChild(el("span", { "class": "discreto", texto: "Nenhum ainda." }));
          return;
        }
        itens.forEach(function (it) {
          var n = String(it.nome).replace(/\.json$/i, "");
          lista.appendChild(el("span", { "class": "escolhida" }, [
            doc.createTextNode(n),
            el("button", {
              "class": "x", type: "button", texto: "usar", title: "Trazer este personagem para o prompt",
              ao: { click: function () { carregarPersonagem(it.nome); } }
            }),
            el("button", {
              "class": "x botao-perigo", type: "button", texto: "apagar", title: "Apagar este personagem salvo",
              ao: {
                click: function () {
                  if (!global.confirm("Apagar o personagem salvo \"" + n + "\"? Isso não desfaz.")) return;
                  global.Memoria.apagar("personagens", it.nome).then(function () {
                    torrada("Personagem \"" + n + "\" apagado.");
                    recarregarListaDePersonagens();
                  });
                }
              }
            })
          ]));
        });
      });
    }
    recarregarListaDePersonagens();
  }

  function salvarPersonagem(nomeDoArquivo) {
    var n = String(nomeDoArquivo || "").trim();
    if (!n) { torrada("Dê um nome ao personagem antes de salvar."); return; }
    P.nome = n;
    var ficha = {
      versao_formato: "1.0.0",
      nome: n,
      modelo: P.modelo,
      tags: P.base.map(function (it) {
        return { id: it.id, tag: it.tag, valor: it.valor, peso: it.peso, ordem: it.ordem };
      }),
      livre: P.livreBase,
      referencias: P.referencias.map(function (r) {
        return { tipo: r.tipo, nome: r.nome, forca: r.forca, fidelidade: r.fidelidade };
      })
    };
    global.Memoria.salvar("personagens", n, ficha).then(function (r) {
      if (!r.ok) { torrada(r.erro || "Não consegui salvar."); return; }
      torrada("Personagem “" + n + "” salvo " + (r.onde === "disco" ? "no disco." : "na memória do navegador."));
      // a versão legível, que ele abre e lê sem programa nenhum
      if (global.Ponte && !global.Memoria.seco()) {
        global.Ponte.gravarTexto("personagens", n + ".md", fichaEmTexto(ficha));
      }
      moduloAtelie($("#mod-atelie"));
    });
  }

  function fichaEmTexto(f) {
    var l = ["# " + f.nome, "", "Modelo sugerido: " + (f.modelo || "—"), "", "## Tags", ""];
    f.tags.forEach(function (t) {
      var reg = tagDe(t.id);
      l.push("- `" + (t.valor || t.tag) + "` — " + (reg ? reg.pt : ""));
    });
    if (f.livre) { l.push("", "## Texto livre", "", f.livre); }
    if (f.referencias.length) {
      l.push("", "## Referências", "");
      f.referencias.forEach(function (r) { l.push("- " + r.nome + " (" + r.tipo + ")"); });
    }
    l.push("", "---", "Feito na Oficina de Imagem. As tags saem do manual do NovelAI.");
    return l.join("\n");
  }

  function carregarPersonagem(nomeArq) {
    if (travadoPelaRecuperacao()) return;
    global.Memoria.ler("personagens", nomeArq).then(function (r) {
      if (!r.ok || !r.conteudo) { torrada("Não consegui abrir esse personagem."); return; }
      var f = r.conteudo;
      P.nome = f.nome || "";
      if (f.modelo) P.modelo = f.modelo;
      P.base = (f.tags || []).map(function (t) {
        var reg = tagDe(t.id);
        var it = reg ? itemDe(reg) : itemLivre(t.tag, t.ordem);
        it.valor = t.valor || "";
        it.peso = t.peso || { tipo: "nenhum", valor: 0 };
        return it;
      });
      P.livreBase = f.livre || "";
      torrada("Personagem “" + (f.nome || nomeArq) + "” carregado no prompt base.");
      salvarRascunho();
    });
  }

  /* =================================================================
     10. MÓDULO — MESA DE RETOQUE  (exigência 2)
     ================================================================= */

  var CARTOES_DE_RETOQUE = [
    {
      id: "pose", titulo: "A pose",
      resumo: "O personagem é o mesmo, mas em outra posição do corpo.",
      ferramenta: "Character Reference (referência de personagem)",
      custo: "5 Anlas por imagem de referência", modelo: "Só no V4.5",
      receita: "trocar_pose"
    },
    {
      id: "estilo", titulo: "O estilo",
      resumo: "A mesma cena, com outro acabamento — aquarela, traço limpo, pixel.",
      ferramenta: "Três caminhos, do mais conservador ao mais livre",
      custo: "de 0 a 5 Anlas, depende do caminho", modelo: "Depende do caminho",
      receitas: ["trocar_estilo_a", "trocar_estilo_b", "trocar_estilo_c"]
    },
    {
      id: "expressao", titulo: "A expressão do rosto",
      resumo: "A mesma imagem, com outra emoção no rosto.",
      ferramenta: "Director Tools > Emotion (ferramentas de direção, trocar a expressão)",
      custo: "o manual não declara o custo", modelo: "—",
      director: "emotion"
    },
    {
      id: "fundo", titulo: "O fundo",
      resumo: "Tirar o fundo, trocar por outro, ou limpar o que está atrás.",
      ferramenta: "Director Tools > Remove BG, ou Inpaint (repintura por máscara)",
      custo: "o manual não declara o custo", modelo: "—",
      /* "remove_bg" é o id usado em dados/acervo_regras.js (director_tools),
         para achar a explicação certa. A ponte usa outro id para a mesma
         ferramenta ("bg-removal", em ponte/endpoints.json) — são dois
         vocabulários diferentes para a mesma coisa, e a tradução entre eles
         é feita em montarPedido(), não aqui, para este id continuar achando
         a explicação certa. */
      director: "remove_bg"
    },
    {
      id: "roupa", titulo: "Uma peça de roupa",
      resumo: "Trocar só a jaqueta, só a saia, só o chapéu.",
      ferramenta: "Inpaint (repintura por máscara)",
      custo: "sem custo extra além da geração", modelo: "—",
      inpaint: true
    },
    {
      id: "cor", titulo: "Uma cor",
      resumo: "Recolorir sem mudar o desenho.",
      ferramenta: "Director Tools > Colorize (colorir), ou Inpaint",
      custo: "o manual não declara o custo", modelo: "—",
      director: "colorize"
    },
    {
      id: "detalhe", titulo: "Um detalhe errado",
      resumo: "Uma mão torta, um dedo a mais, um pedaço borrado.",
      ferramenta: "Inpaint, e o Inpaint Focado quando o pedaço é pequeno",
      custo: "sem custo extra além da geração", modelo: "—",
      inpaint: true
    }
  ];

  var retoqueAberto = null;

  /* A imagem da Mesa de Retoque vive em `P.retoque`, e não mais numa
     variável solta deste módulo.

     A variável solta sumia ao fechar a aba, não era gravada em lugar
     nenhum, e nunca entrava no pedido de geração — então Image2Image,
     Inpaint e as ferramentas de direção não funcionavam pela ponte nem com
     token. Agora ela é gravada em meu_trabalho\referencias, o rascunho
     guarda o nome do arquivo, e os bytes viajam no pedido. */
  function temImagemDeRetoque() { return !!(P.retoque && P.retoque.dados); }

  function temMascara() { return !!(P.retoque && P.retoque.mascaraPB); }

  function cartaoDeRetoque(id) {
    for (var i = 0; i < CARTOES_DE_RETOQUE.length; i++) {
      if (CARTOES_DE_RETOQUE[i].id === id) return CARTOES_DE_RETOQUE[i];
    }
    return null;
  }

  /* A escolha dele exige repintura por máscara? Duas das sete respostas da
     Mesa de Retoque exigem — "Uma peça de roupa" e "Um detalhe errado" —, e
     é exatamente onde a Oficina mentia: a tela mandava pintar uma máscara
     que não existia em lugar nenhum, e o pedido saía como Image2Image da
     imagem inteira. Com token, isso muda a cena toda em vez da jaqueta, e
     cobra Anlas por isso. */
  function retoqueExigeMascara() {
    var c = cartaoDeRetoque(P.retoque.intencao);
    return !!(c && c.inpaint);
  }

  /* O NovelAI espera a máscara em preto e branco: branco é o que ele refaz.
     A tela pinta em PNG transparente (para o autor ver a imagem por baixo),
     e a versão preto-e-branco é composta a partir dela. */
  function refazerMascaraPB() {
    if (!P.retoque.mascara) { P.retoque.mascaraPB = ""; return; }
    var v = new global.Image();
    v.onload = function () {
      var pb = doc.createElement("canvas");
      pb.width = v.naturalWidth || v.width;
      pb.height = v.naturalHeight || v.height;
      var c = pb.getContext("2d");
      c.fillStyle = "#000000";
      c.fillRect(0, 0, pb.width, pb.height);
      c.drawImage(v, 0, 0);
      P.retoque.mascaraPB = pb.toDataURL("image/png");
      renderBancada();
    };
    v.src = P.retoque.mascara;
  }

  // Grava sem redesenhar a tela. Redesenhar no meio de uma pincelada
  // destruiria o próprio canvas em que ele está pintando.
  function salvarSoOsDados() {
    if (global.Memoria) global.Memoria.rascunho(paraGuardar());
  }

  var relogioDaMascara = null;

  function nomeDoArquivoDaMascara() {
    var base = String(P.retoque.arquivo || P.retoque.nome || "imagem").replace(/\.[a-z0-9]+$/i, "");
    return "mascara_" + base.replace(/[^\w.\- ]+/g, "_") + ".png";
  }

  /* O PINCEL.

     Um <canvas> por cima da imagem. O que ele pinta de branco é a parte que
     o NovelAI vai refazer; o resto fica como está. O traço sai a meia
     opacidade para ele enxergar o desenho por baixo enquanto pinta.

     A resolução interna é limitada a 1024 no lado maior: máscara é forma, não
     detalhe, e um PNG de 4000 pixels ida e volta pelo disco a cada pincelada
     travaria a oficina no computador dele. */
  function pincelDeMascara() {
    if (!temImagemDeRetoque()) return null;

    var LADO_MAX = 1024;
    var palco = el("div", { "class": "mascara-palco" });
    var img = el("img", { src: P.retoque.dados, alt: "a imagem que você vai retocar" });
    var tela = el("canvas", { "class": "mascara-tela" });
    palco.appendChild(img);
    palco.appendChild(tela);

    var ctx = null;
    var grossura = 48;
    var apagando = false;
    var pintando = false;
    var ultimo = null;

    var aviso = el("p", { "class": "discreto", texto: "" });

    function contar() {
      aviso.textContent = temMascara()
        ? "Máscara pintada. Só a parte branca vai ser refeita — o resto da imagem fica igual."
        : "Nada pintado ainda. Sem máscara, a oficina não manda este pedido como repintura.";
    }

    function preparar() {
      var w = img.naturalWidth || 1024;
      var h = img.naturalHeight || 1024;
      var f = Math.min(1, LADO_MAX / Math.max(w, h));
      tela.width = Math.max(1, Math.round(w * f));
      tela.height = Math.max(1, Math.round(h * f));
      ctx = tela.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (P.retoque.mascara) {
        var v = new global.Image();
        v.onload = function () { ctx.drawImage(v, 0, 0, tela.width, tela.height); };
        v.src = P.retoque.mascara;
      }
      contar();
    }

    if (img.complete) { setTimeout(preparar, 0); } else { img.addEventListener("load", preparar); }

    function ponto(ev) {
      var r = tela.getBoundingClientRect();
      if (!r.width || !r.height) return { x: 0, y: 0 };
      return {
        x: (ev.clientX - r.left) * (tela.width / r.width),
        y: (ev.clientY - r.top) * (tela.height / r.height)
      };
    }

    function pintar(pt) {
      if (!ctx) return;
      ctx.globalCompositeOperation = apagando ? "destination-out" : "source-over";
      ctx.strokeStyle = "#ffffff";
      ctx.fillStyle = "#ffffff";
      ctx.lineWidth = grossura;
      if (ultimo) {
        ctx.beginPath();
        ctx.moveTo(ultimo.x, ultimo.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, grossura / 2, 0, Math.PI * 2);
      ctx.fill();
      ultimo = pt;
    }

    function guardar() {
      if (!ctx) return;
      P.retoque.mascara = tela.toDataURL("image/png");

      var pb = doc.createElement("canvas");
      pb.width = tela.width;
      pb.height = tela.height;
      var c2 = pb.getContext("2d");
      c2.fillStyle = "#000000";
      c2.fillRect(0, 0, pb.width, pb.height);
      c2.drawImage(tela, 0, 0);
      P.retoque.mascaraPB = pb.toDataURL("image/png");

      P.retoque.mascaraArquivo = nomeDoArquivoDaMascara();
      salvarSoOsDados();
      contar();
      renderBancada();

      // o disco espera a mão parar: gravar a cada pincelada trava a oficina
      if (relogioDaMascara) clearTimeout(relogioDaMascara);
      relogioDaMascara = setTimeout(function () {
        if (global.Ponte && global.Memoria && !global.Memoria.seco()) {
          global.Ponte.enviarImagem("referencias", P.retoque.mascaraArquivo, P.retoque.mascara);
        }
      }, 1500);
    }

    tela.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      pintando = true;
      ultimo = null;
      if (tela.setPointerCapture) { try { tela.setPointerCapture(ev.pointerId); } catch (e) { /* ok */ } }
      pintar(ponto(ev));
    });
    tela.addEventListener("pointermove", function (ev) {
      if (!pintando) return;
      ev.preventDefault();
      pintar(ponto(ev));
    });
    function soltar() {
      if (!pintando) return;
      pintando = false;
      ultimo = null;
      guardar();
    }
    tela.addEventListener("pointerup", soltar);
    tela.addEventListener("pointercancel", soltar);
    tela.addEventListener("pointerleave", soltar);

    var faixa = el("input", { type: "range", min: "8", max: "160", step: "4", value: String(grossura) });
    var mostraG = el("span", { "class": "peso-mostra", texto: grossura + " px" });
    faixa.addEventListener("input", function () {
      grossura = parseInt(faixa.value, 10) || 48;
      mostraG.textContent = grossura + " px";
    });

    var botaoApagar = el("button", {
      "class": "botao-p", type: "button", texto: "Modo borracha: desligado",
      "aria-pressed": "false"
    });
    botaoApagar.addEventListener("click", function () {
      apagando = !apagando;
      botaoApagar.textContent = apagando ? "Modo borracha: LIGADO" : "Modo borracha: desligado";
      botaoApagar.setAttribute("aria-pressed", apagando ? "true" : "false");
    });

    var botaoLimpar = el("button", {
      "class": "botao-p botao-perigo", type: "button", texto: "Apagar a máscara inteira"
    });
    botaoLimpar.addEventListener("click", function () {
      if (!ctx) return;
      ctx.clearRect(0, 0, tela.width, tela.height);
      P.retoque.mascara = "";
      P.retoque.mascaraPB = "";
      salvarSoOsDados();
      contar();
      renderBancada();
    });

    return caixa("Pinte a parte que você quer refazer", [
      el("p", { texto: "Arraste o dedo ou o mouse por cima da parte errada. O que ficar pintado de branco é o que a IA refaz. O resto da imagem não é tocado." }),
      palco,
      el("div", { "class": "peso-linha" }, [
        el("label", { texto: "Grossura do pincel: " }), faixa, mostraG
      ]),
      el("div", { "class": "peso-linha" }, [botaoApagar, botaoLimpar]),
      aviso,
      nota("amarela", "Pinte um pouco além da borda",
        "A repintura vaza um pouco para fora da área marcada. Cobrir um pedaço a mais em volta sai melhor do que cobrir de menos.")
    ]);
  }

  function moduloRetoque(sec) {
    limpar(sec);
    /* Achado D10, 27/08/2026: nomes técnicos (Image2Image, Character
       Reference, strength...) apareciam crus. `glosar()` já existia pronto
       desde a auditoria de "Anlas" (linha ~275), mas nenhum módulo o
       chamava — inclusive este, que é o mais técnico de todos. `novaTela()`
       zera a marcação a cada desenho do módulo, para a explicação aparecer
       de novo sempre que o autor ABRE esta tela, e só uma vez por termo
       dentro dela. */
    novaTela();
    sec.appendChild(el("div", { "class": "cabecalho-modulo" }, [
      el("h2", { texto: "Mesa de retoque" }),
      el("p", { texto: "Você põe uma imagem que já tem e diz o que quer trocar nela. A oficina escolhe a porta certa e explica o porquê." })
    ]));

    var zona = el("div", {});
    if (temImagemDeRetoque()) {
      zona.appendChild(el("img", { src: P.retoque.dados, alt: "a imagem que você vai retocar" }));
      zona.appendChild(el("span", { texto: P.retoque.nome }));
    } else {
      zona.appendChild(el("strong", { texto: "Solte aqui a imagem que você quer mudar" }));
      zona.appendChild(el("span", { texto: "ou clique para escolher um arquivo do seu computador" }));
    }
    zonaDeSolta(zona, function (arq) {
      P.retoque.nome = arq.nome;
      P.retoque.dados = arq.dados;
      P.retoque.arquivo = "";
      guardarImagemDeTrabalho(arq, "retoque").then(function (nome) {
        if (nome) { P.retoque.arquivo = nome; salvarRascunho(); }
        moduloRetoque(sec);
      });
      salvarRascunho();
      moduloRetoque(sec);
    }, "Solte aqui a imagem a retocar");
    sec.appendChild(zona);

    if (temImagemDeRetoque()) {
      sec.appendChild(el("div", { "class": "peso-linha" }, [
        el("span", {
          "class": "discreto",
          texto: P.retoque.arquivo
            ? "Guardada no disco como " + P.retoque.arquivo + ". Ela volta na próxima vez que você abrir a oficina."
            : "Esta imagem vale só nesta sessão: sem " + GLOSSARIO.ponte() + ", não há onde gravá-la."
        }),
        el("button", {
          "class": "botao-p botao-perigo", type: "button", texto: "Tirar esta imagem",
          ao: {
            click: function () {
              P.retoque = { nome: "", arquivo: "", dados: "", forca: P.retoque.forca, ruido: P.retoque.ruido };
              salvarRascunho(); moduloRetoque(sec);
            }
          }
        })
      ]));
      sec.appendChild(controlesDoRetoque(sec));
    }

    sec.appendChild(el("h3", { texto: "O que você quer trocar nesta imagem?" }));

    var cartoes = el("div", { "class": "cartoes" });
    CARTOES_DE_RETOQUE.forEach(function (c) {
      var b = el("button", { "class": "cartao", type: "button" }, [
        el("b", { texto: c.titulo }),
        el("span", { texto: c.resumo }),
        el("span", { "class": "custo", texto: glosar(c.ferramenta) + " · " + c.custo + (c.modelo !== "—" ? " · " + c.modelo : "") })
      ]);
      b.addEventListener("click", function () {
        retoqueAberto = c.id;
        /* A escolha dele fica gravada: é ela que decide, mais tarde, se o
           pedido sai como repintura (Inpaint) ou como Image2Image. Antes
           nada guardava essa escolha, e o pedido saía sempre img2img. */
        P.retoque.intencao = c.id;
        salvarSoOsDados();
        moduloRetoque(sec);
      });
      cartoes.appendChild(b);
    });
    sec.appendChild(cartoes);

    if (retoqueAberto) {
      var c2 = CARTOES_DE_RETOQUE.filter(function (x) { return x.id === retoqueAberto; })[0];
      if (c2) sec.appendChild(detalheDoRetoque(c2));
    }

    if (global.Esquemas) {
      var portas = global.Esquemas.desenhar("quatro_portas");
      var mapa = global.Esquemas.desenhar("mapa_forca_ruido");
      sec.appendChild(caixa("As quatro portas de entrada de uma imagem", [
        portas ? el("div", { "class": "esquema", html: portas }) : null,
        el("p", { "class": "discreto", texto: "Cada porta preserva uma coisa diferente da imagem original." })
      ]));
      sec.appendChild(caixa("Força e Ruído, os dois controles do Image2Image", [
        mapa ? el("div", { "class": "esquema", html: mapa }) : null,
        el("p", { texto: (R().image2image || {}).strength || "" }),
        el("p", { texto: (R().image2image || {}).noise || "" }),
        el("p", { "class": "discreto", texto: (R().image2image || {}).copia_perfeita || "" })
      ]));
    }
  }

  function detalheDoRetoque(c) {
    var d = el("div", { "class": "caixa" }, [el("h3", { texto: "Trocar: " + c.titulo })]);

    /* Achado D10, 27/08/2026: o autor clicou em "O estilo" sem ter soltado
       imagem nenhuma, e a tela abriu três caminhos técnicos por extenso —
       com "Ajustes" em código cru — e só DEPOIS deles avisou que faltava a
       imagem. Ele leu tudo, não entendeu nada, e desistiu. Hoje o aviso vem
       PRIMEIRO, e sem imagem a tela mostra só um resumo curto do caminho —
       o detalhe técnico completo só aparece depois que a imagem existe,
       porque é só aí que ele serve para alguma coisa. */
    if (!temImagemDeRetoque()) {
      d.appendChild(nota("amarela", "Falta a imagem",
        "Solte a imagem que você quer mudar no espaço lá em cima. Sem ela, a oficina só consegue explicar o caminho — não dá para gerar nada ainda."));
      d.appendChild(el("p", { texto: c.resumo }));
      d.appendChild(linhaChave("Caminho que a oficina vai usar", glosar(c.ferramenta)));
      d.appendChild(linhaChave("Custo em Anlas", c.custo));
      return d;
    }

    d.appendChild(linhaChave("Ferramenta do NovelAI", glosar(c.ferramenta)));
    d.appendChild(linhaChave("Custo em Anlas", c.custo));
    d.appendChild(linhaChave("Modelo exigido", c.modelo));

    if (c.id === "pose") {
      d.appendChild(nota("amarela", "O erro que quase todo mundo comete aqui",
        "Força alta copia também a POSE da referência, junto com o personagem — que é exatamente o que você não quer quando o objetivo é mudar a pose. Use Força moderada."));
      var canvas = R().canvas || {};
      var b3d = canvas.boneco_3d || {};
      d.appendChild(caixa("O outro caminho: o boneco 3D dentro do site", [
        el("p", { texto: canvas.explica || "" }),
        el("ol", { "class": "limpa" }, (b3d.passos || []).map(function (x) { return el("li", { texto: x }); })),
        el("p", { "class": "discreto", texto: "Formatos aceitos: " + (b3d.formatos || []).join(", ") + ". " + (b3d.zip || "") }),
        el("p", { texto: b3d.por_que_funciona || "" })
      ]));
    }

    if (c.id === "estilo") {
      (c.receitas || []).forEach(function (rid) {
        var r = receita(rid);
        if (!r) return;
        d.appendChild(caixa(r.nome, [
          el("p", { texto: r.para_que || "" }),
          r.ferramenta ? linhaChave("Ferramenta", glosar(r.ferramenta)) : null,
          r.ajustes ? linhaChave("Ajustes", textoDosAjustes(r.ajustes)) : null,
          r.preserva ? linhaChave("O que ele preserva", r.preserva) : null,
          r.prompt_base ? el("div", { "class": "saida", texto: r.prompt_base }) : null,
          r.aviso ? nota("amarela", "Atenção", r.aviso) : null,
          idsDaReceita(r).length ? el("button", {
            "class": "botao-p", type: "button", texto: "Usar esta receita no prompt",
            ao: { click: function () { usarReceita(r); } }
          }) : null
        ]));
      });
    }

    if (c.director) {
      var dt = (R().director_tools || []).filter(function (x) { return x.id === c.director; })[0];
      if (dt) {
        d.appendChild(caixa(dt.nome + " (" + dt.pt + ")", [
          el("p", { texto: dt.faz }),
          dt.condicoes ? el("div", {}, [
            el("h4", { texto: "As condições para funcionar" }),
            el("ul", { "class": "limpa" }, dt.condicoes.map(function (x) { return el("li", { texto: x }); }))
          ]) : null,
          dt.controles ? el("p", { "class": "discreto", texto: "Controles: " + dt.controles.join(" · ") }) : null
        ]));
      }

      /* ⚠ AS TRÊS FERRAMENTAS DE DIREÇÃO (Emotion, Colorize, Remove BG) SÓ
         EXPLICAVAM E NUNCA GERAVAM — achado da auditoria de 24/08/2026. O
         botão "Gerar aqui"/"Ensaiar a geração" montava sempre `img2img` ou
         `inpaint`, nunca `director`, então clicar aqui trocava a cena
         inteira em vez de só a expressão/cor/fundo. `montarPedido()` agora
         manda `acao: "director"` quando o cartão escolhido é um destes três.

         Só o Emotion precisa de campo extra (o que a ponte manda como
         `prompt` e `forca_da_emocao`, dentro de `ponte/novelai.py`,
         função `montar_pedido`); Colorize e Remove BG usam só a imagem. */
      if (c.director === "emotion") {
        var campoEmocao = el("input", {
          type: "text", value: P.retoque.emocao,
          placeholder: "que expressão? por exemplo: happy, angry, surprised"
        });
        campoEmocao.addEventListener("change", function () { P.retoque.emocao = campoEmocao.value; salvarRascunho(); });
        var campoForca = el("input", {
          type: "number", min: "0", max: "5", step: "1",
          value: String(P.retoque.forcaDaEmocao || 0)
        });
        campoForca.addEventListener("change", function () {
          var v = parseInt(campoForca.value, 10);
          P.retoque.forcaDaEmocao = isNaN(v) ? 0 : v;
          salvarRascunho();
        });
        d.appendChild(caixa("Emotion Prompt e Emotion Level", [
          el("div", { "class": "peso-linha" }, [el("label", { texto: "Emotion Prompt (a expressão desejada): " }), campoEmocao]),
          el("div", { "class": "peso-linha" }, [el("label", { texto: "Emotion Level (o quanto aplicar): " }), campoForca]),
          el("p", { "class": "discreto", texto: "Faixa comum: 0 a 5. O manual não declara um limite exato para este campo — se o site recusar um valor, tente um menor." })
        ]));
      }
    }

    if (c.inpaint) {
      var ip = R().inpaint || {};
      d.appendChild(caixa("Inpaint (repintura por máscara)", [
        el("p", { texto: ip.explica || "" }),
        nota("amarela", "Vazamento de borda", ip.vazamento || ""),
        el("p", { texto: ip.forca || "" }),
        el("p", { texto: ip.focado || "" })
      ]));

      /* O pincel, que faltava. A tela dizia "você pinta uma máscara (área
         azul) só sobre a parte errada" e não havia pincel, nem tela de
         desenho, nem sequer uma frase dizendo onde pintar. Com token, o
         pedido caía em Image2Image calado: mudava a cena inteira em vez da
         jaqueta, e cobrava por isso. */
      var pincel = pincelDeMascara();
      if (pincel) d.appendChild(pincel);

      // e o caminho do site, que é o único no dia sem token
      d.appendChild(caixa("Como fazer isto no site do NovelAI", [
        el("p", { texto: "Este caminho funciona sempre, com ou sem token. É o mesmo trabalho, feito lá." }),
        el("ol", { "class": "limpa" }, [
          el("li", { texto: "Copie o prompt aqui na Oficina, no botão Copiar prompt da Bancada." }),
          el("li", { texto: "No site do NovelAI, carregue a sua imagem e abra a ferramenta Inpaint." }),
          el("li", { texto: "Pinte a máscara por cima da parte que você quer refazer, com o pincel do site." }),
          el("li", { texto: "Cole o prompt, descrevendo o que deve APARECER no lugar — não o que está errado." }),
          el("li", { texto: "Se o pedaço for pequeno, ligue o Focused Inpainting: ele amplia a região antes de refazer." }),
          el("li", { texto: "Gere, e baixe pelo botão de salvar do site. Depois traga a imagem de volta para o Álbum, aqui na Oficina." })
        ])
      ]));

      if (temImagemDeRetoque() && !temMascara()) {
        d.appendChild(nota("vermelha", "Sem máscara, a oficina não gera aqui dentro",
          "Enquanto você não pintar a parte a refazer, o botão Gerar aqui fica recusando este pedido. " +
          "Isso é de propósito: gerar sem máscara refaria a imagem inteira e cobraria Anlas por uma coisa que você não pediu."));
      }
    }

    if (c.receita) {
      var r2 = receita(c.receita);
      if (r2) {
        d.appendChild(caixa("A receita pronta: " + r2.nome, [
          el("p", { texto: r2.para_que || "" }),
          r2.ajustes ? linhaChave("Ajustes", textoDosAjustes(r2.ajustes)) : null,
          r2.prompt_base ? el("div", { "class": "saida", texto: r2.prompt_base }) : null,
          r2.aviso ? nota("amarela", "Atenção", r2.aviso) : null,
          r2.alternativa ? nota("", "Outro caminho", typeof r2.alternativa === "string" ? r2.alternativa : JSON.stringify(r2.alternativa)) : null,
          idsDaReceita(r2).length ? el("button", {
            "class": "botao-p", type: "button", texto: "Usar esta receita no prompt",
            ao: { click: function () { usarReceita(r2); } }
          }) : null
        ]));
      }
    }

    return d;
  }

  /* Achado D10, 27/08/2026: o campo "ajustes" das receitas é um objeto
     pensado para o pipeline técnico ({"strength": "perto de 0,3", "noise":
     "baixo"}), e a tela despejava esse objeto cru na frente do autor com
     `JSON.stringify` — código de programador, não frase. Aqui ele vira
     texto legível, um rótulo em português por chave conhecida. */
  var ROTULOS_DE_AJUSTE = {
    strength: "Força",
    noise: "Ruído",
    colorize_prompt: "O que colorir"
  };
  function textoDosAjustes(ajustes) {
    if (!ajustes) return "";
    if (typeof ajustes === "string") return ajustes;
    var partes = [];
    Object.keys(ajustes).forEach(function (chave) {
      partes.push((ROTULOS_DE_AJUSTE[chave] || chave) + ": " + ajustes[chave]);
    });
    return partes.join(". ") + ".";
  }

  /* Os dois controles do Image2Image, que a ponte espera dentro do pedido:
     Força (o quanto a IA pode mudar) e Ruído. Eles existiam só como
     explicação na tela — não havia onde mexer neles, e nada os enviava. */
  function controlesDoRetoque() {
    var i2i = R().image2image || {};

    function regua(rot, campo, min, max, passo, explica) {
      var faixa = el("input", { type: "range", min: min, max: max, step: passo, value: P.retoque[campo] });
      var mostra = el("span", { "class": "peso-mostra", texto: String(P.retoque[campo]).replace(".", ",") });
      faixa.addEventListener("input", function () {
        P.retoque[campo] = parseFloat(faixa.value);
        mostra.textContent = String(P.retoque[campo]).replace(".", ",");
      });
      faixa.addEventListener("change", function () { salvarRascunho(); });
      return el("div", {}, [
        el("div", { "class": "peso-linha" }, [el("label", { texto: rot + ": " }), faixa, mostra]),
        el("p", { "class": "discreto", texto: explica })
      ]);
    }

    return caixa("Quanto a IA pode mexer nesta imagem", [
      regua("Força", "forca", "0", "1", "0.05",
        i2i.strength || "Força baixa (perto de 0,3) preserva quase tudo. Força alta reinterpreta livre."),
      regua("Ruído", "ruido", "0", "1", "0.05",
        i2i.noise || "Ruído baixo mantém a imagem parecida com a original."),
      el("p", { "class": "discreto", texto: i2i.copia_perfeita || "" })
    ]);
  }

  function receita(id) {
    var l = RC().receitas || [];
    for (var i = 0; i < l.length; i++) { if (l[i].id === id) return l[i]; }
    return null;
  }

  /* =================================================================
     11. MÓDULO — RÉGUA DE ORDEM  (exigência 6)
     ================================================================= */

  /* ⚠ A RÉGUA SÓ EXPLICAVA A CAIXA PRINCIPAL — achado da auditoria de
     24/08/2026. `paraMotor()` (linha 651) já reordena cada caixa de
     personagem sozinha, do mesmo jeito que a base, mas esta tela só lia
     `baseParaOrdenar()`. Numa cena com vários personagens — o cenário
     inteiro que motivou a exigência de caixa por personagem — o cabelo, os
     olhos e a roupa de cada um mudavam de lugar sem NENHUMA tela mostrar o
     quê nem por quê, e o cartão da caixa na Bancada mostra os chips na
     ordem do clique, que pode não ser a ordem realmente enviada. Hoje um
     seletor escolhe qual caixa a Régua explica — a mesma função
     `ordenarLista` de sempre, só que apontada para `p.itens` em vez de
     `P.base` quando o alvo é um personagem. */
  var reguaAlvo = "base";

  function listaDaRegua() {
    if (reguaAlvo === "base") return baseParaOrdenar();
    var idx = parseInt(String(reguaAlvo).slice(1), 10);
    var p = P.personagens[idx];
    return p ? p.itens : [];
  }

  function moduloRegua(sec) {
    limpar(sec);
    sec.appendChild(el("div", { "class": "cabecalho-modulo" }, [
      el("h2", { texto: "Régua de ordem" }),
      el("p", { texto: global.Ordenador ? global.Ordenador.regraGeral() : "" })
    ]));

    if (reguaAlvo !== "base" && !P.personagens[parseInt(String(reguaAlvo).slice(1), 10)]) reguaAlvo = "base";

    if (P.personagens.length) {
      var selReguaAlvo = el("select", { "aria-label": "De qual caixa mostrar a ordem" });
      var opcoesRegua = [["base", "Prompt base (a caixa principal)"]];
      P.personagens.forEach(function (p, i) { opcoesRegua.push(["p" + i, "Caixa do personagem " + (i + 1) + (p.nome ? " — " + p.nome : "")]); });
      opcoesRegua.forEach(function (o) {
        var opt = el("option", { value: o[0], texto: o[1] });
        if (reguaAlvo === o[0]) opt.setAttribute("selected", "selected");
        selReguaAlvo.appendChild(opt);
      });
      selReguaAlvo.addEventListener("change", function () { reguaAlvo = selReguaAlvo.value; moduloRegua(sec); });
      sec.appendChild(el("div", { "class": "peso-linha" }, [el("label", { texto: "Mostrar a ordem de: " }), selReguaAlvo]));
    }

    if (!listaDaRegua().length) {
      sec.appendChild(nota("", "Ainda não há o que ordenar",
        reguaAlvo === "base"
          ? "Escolha algumas tags no Armazém ou no Ateliê. A ordem aparece aqui, com o motivo de cada mudança."
          : "Esta caixa de personagem ainda não tem tags. Escolha algumas no Armazém, com ela como alvo."));
      return;
    }

    // O seletor de ordem, com o motivo escrito em cada opção.
    var modos = global.Ordenador ? global.Ordenador.modos() : [];
    var escolha = el("div", {});
    modos.forEach(function (m) {
      var r = el("input", { type: "radio", name: "modo-ordem", value: m.id, id: "ordem-" + m.id });
      if (P.ordem === m.id || (P.ordem === "padrao" && m.id === "padrao_manual")) r.setAttribute("checked", "checked");
      r.addEventListener("change", function () { P.ordem = m.id; salvarRascunho(); moduloRegua(sec); });
      escolha.appendChild(el("div", { "class": "aperto" }, [
        r, el("label", { "for": "ordem-" + m.id }, [el("strong", { texto: m.nome }), doc.createTextNode(" — " + m.resumo)])
      ]));
    });
    sec.appendChild(caixa("Qual ordem usar", [escolha]));

    /* UMA lista só, calculada uma vez: as duas colunas e os traços entre
       elas comparam os MESMOS objetos. Recalcular geraria itens novos para
       o texto livre, e nenhum traço casaria. */
    var lista = listaDaRegua();
    var r = ordenarLista(lista);
    var moveu = {};
    r.movimentos.forEach(function (m) { moveu[m.chave] = m; });

    var colA = el("ol", {});
    lista.forEach(function (it, i) {
      colA.appendChild(linhaDaRegua(it, i, moveu[it.chave], sec));
    });

    var colB = el("ol", {});
    r.itens.forEach(function (it, i) {
      colB.appendChild(linhaDaRegua(it, i, moveu[it.chave], sec, true));
    });
    if (reguaAlvo === "base" && P.textos.length) {
      colB.appendChild(el("li", { "class": "mudou" }, [
        el("span", { "class": "num", texto: "fim" }),
        el("span", { texto: "Text: " + P.textos[0].slice(0, 24) + (P.textos[0].length > 24 ? "…" : "") }),
        el("span", { "class": "discreto", texto: "sempre por último" })
      ]));
    }

    var tracos = el("div", { "class": "tracos" });
    var regua = el("div", { "class": "regua" }, [
      el("div", {}, [el("div", { "class": "col-cab", texto: "Como você montou" }), colA]),
      el("div", {}, [el("div", { "class": "col-cab", texto: "" }), tracos]),
      el("div", {}, [el("div", { "class": "col-cab", texto: "Ordem sugerida" }), colB])
    ]);
    sec.appendChild(regua);

    var motivos = el("ul", { "class": "limpa motivos" });
    if (!r.movimentos.length) {
      motivos.appendChild(el("li", { texto: "Nada mudou de lugar: a sua ordem já é a ordem sugerida." }));
    }
    r.movimentos.forEach(function (m) { motivos.appendChild(el("li", { texto: m.motivo })); });
    sec.appendChild(caixa("O que mudou de lugar, e por quê", [
      motivos,
      el("p", { "class": "discreto", texto: global.Ordenador ? global.Ordenador.estabilidade() : "" }),
      r.movimentos.length ? el("button", {
        "class": "botao-forte", type: "button", texto: "Usar a ordem sugerida",
        ao: {
          click: function () {
            if (reguaAlvo === "base") {
              /* As tags digitadas no texto livre NÃO viram pastilha aqui: elas
                 continuam morando na caixa de texto, e a oficina as coloca na
                 ordem a cada montagem. Copiá-las para `P.base` faria cada uma
                 aparecer duas vezes no prompt. */
              P.base = r.itens.filter(function (it) { return !it.deLivre; });
            } else {
              var idx = parseInt(String(reguaAlvo).slice(1), 10);
              if (P.personagens[idx]) P.personagens[idx].itens = r.itens;
            }
            torrada("Pronto: a sua lista agora está na ordem sugerida.");
            salvarRascunho();
            moduloRegua(sec);
          }
        }
      }) : null
    ]));

    (r.alertas || []).forEach(function (a) {
      sec.appendChild(nota("vermelha", "Regra do motor, não preferência", a.texto));
    });

    setTimeout(function () { desenharTracos(regua, tracos, moveu); }, 0);
  }

  function linhaDaRegua(it, i, mov, sec, ehSugerida) {
    var li = el("li", { "data-chave": it.chave, "data-lado": ehSugerida ? "b" : "a" }, [
      el("span", { "class": "num", texto: String(i + 1) }),
      el("span", { texto: textoDoItem(it) })
    ]);
    if (mov) li.classList.add("mudou");

    /* Tag que veio da caixa de texto livre. Ela não tem cadeado: o cadeado
       grava no item, e este item é refeito a cada montagem. Em vez disso ela
       diz de onde veio — e, quando o acervo não a conhece, avisa que o lugar
       dela foi chutado. */
    if (it.deLivre) {
      li.classList.add("de-livre");
      li.appendChild(el("span", {
        "class": "discreto",
        texto: it.conhecida
          ? "tag sua, digitada na caixa de texto"
          : "tag sua, e o acervo não a conhece — pus no meio, junto do cenário"
      }));
      return li;
    }

    /* O cadeado precisa dizer de QUAL tag ele é. Sem o nome, a Régua mostra
       uma coluna de cadeados idênticos, com a mesma dica em todos: para saber
       o que aquele ali trava, ele tem de contar as linhas com o dedo. E o
       botão era um desenho sem nome nenhum — quem usa leitor de tela ouvia
       só "botão", seis vezes. */
    var nomeDaTag = it.valor || it.tag || "esta tag";
    var cad = el("button", {
      "class": "cadeado", type: "button",
      "aria-pressed": it.travada ? "true" : "false",
      "aria-label": (it.travada ? "Destravar " : "Travar ") + nomeDaTag,
      title: it.travada
        ? "“" + nomeDaTag + "” está travada: não sai do lugar. Clique para destravar."
        : "“" + nomeDaTag + "” está destravada: a oficina pode mover. Clique para travar no lugar."
    }, [el("span", { html: cadeadoSVG(it.travada) })]);
    cad.addEventListener("click", function () {
      it.travada = !it.travada; salvarRascunho(); moduloRegua(sec);
    });
    li.appendChild(cad);
    return li;
  }

  function cadeadoSVG(fechado) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="4" y="10" width="16" height="11" rx="2"/>' +
      (fechado ? '<path d="M8 10V7a4 4 0 0 1 8 0v3"/>' : '<path d="M8 10V7a4 4 0 0 1 7.5-2"/>') +
      "</svg>";
  }

  function desenharTracos(regua, alvo, moveu) {
    limpar(alvo);
    var chaves = Object.keys(moveu);
    if (!chaves.length) return;
    var caixaR = alvo.getBoundingClientRect();
    if (!caixaR.height) return;

    var partes = [];
    chaves.forEach(function (ch) {
      var a = regua.querySelector('li[data-chave="' + ch + '"][data-lado="a"]');
      var b = regua.querySelector('li[data-chave="' + ch + '"][data-lado="b"]');
      if (!a || !b) return;
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      var y1 = ra.top + ra.height / 2 - caixaR.top;
      var y2 = rb.top + rb.height / 2 - caixaR.top;
      partes.push('<path d="M0 ' + y1.toFixed(1) + " C 22 " + y1.toFixed(1) +
        ", 24 " + y2.toFixed(1) + ", 46 " + y2.toFixed(1) +
        '" fill="none" stroke="currentColor" stroke-width="1.6" opacity="0.65"/>');
    });
    alvo.innerHTML = '<svg viewBox="0 0 46 ' + Math.round(caixaR.height) +
      '" preserveAspectRatio="none" aria-hidden="true">' + partes.join("") + "</svg>";
  }

  /* =================================================================
     12. MÓDULO — SALA DE RECURSOS  (exigência 3)
     ================================================================= */

  function moduloRecursos(sec) {
    limpar(sec);
    var r = R();
    sec.appendChild(el("div", { "class": "cabecalho-modulo" }, [
      el("h2", { texto: "Sala de recursos" }),
      el("p", { texto: "Tudo que o NovelAI faz, em português, com o custo e o modelo de cada coisa. Nada está escondido aqui." })
    ]));

    // --- modelos
    var linhas = (r.modelos || []).map(function (m) {
      var s = m.suporta || {};
      function sim(v) { return v ? "sim" : "não"; }

      /* A coluna do Vibe Transfer é a única da tabela que o manual não
         sustenta. O §16, citado como fonte das seis linhas, fala de
         Multi-Character, Peso Numérico, Referência Precisa e Text Rendering
         — e não de Vibe Transfer. O próprio FONTES.md do acervo admite que
         o "sim" ali é inferência. Então a célula diz isso, com as mesmas
         palavras que a tabela de endereços usa. */
      var vibeOk = global.Motor && global.Motor.vibeVerificado
        ? global.Motor.vibeVerificado(m.id) : false;
      var celulaVibe = vibeOk
        ? el("td", { texto: sim(s.vibe_transfer) })
        : el("td", {}, [
            doc.createTextNode(sim(s.vibe_transfer) + " "),
            el("span", { "class": "selo selo-vazio", texto: "não verificado",
              title: "O manual não declara em que modelos o Vibe Transfer funciona. A oficina supõe que sim." })
          ]);

      return el("tr", {}, [
        el("td", {}, [el("strong", { texto: m.nome }), el("br", {}), el("span", { "class": "discreto", texto: m.use_quando || "" })]),
        el("td", { texto: sim(s.multi_personagem) }),
        el("td", { texto: sim(s.peso_numerico) }),
        el("td", { texto: sim(s.peso_negativo) }),
        el("td", { texto: sim(s.precise_reference) }),
        celulaVibe,
        el("td", { texto: sim(s.text_rendering) })
      ]);
    });
    sec.appendChild(caixa("Os modelos, e o que cada um aceita", [
      el("div", { "class": "rolagem" }, [
        el("table", {}, [
          el("thead", {}, [el("tr", {}, [
            el("th", { texto: "Modelo" }),
            el("th", { texto: "Vários personagens" }),
            el("th", { texto: "Peso numérico" }),
            el("th", { texto: "Peso negativo" }),
            el("th", { texto: "Referência precisa" }),
            el("th", { texto: "Vibe Transfer" }),
            el("th", { texto: "Texto na imagem" })
          ])]),
          el("tbody", {}, linhas)
        ])
      ]),
      botaoIrPara("Escolher o modelo agora", "bancada")
    ]));

    // --- peso
    var pesos = r.pesos || {};
    var reguaPeso = global.Esquemas ? global.Esquemas.desenhar("regua_peso") : null;
    sec.appendChild(caixa("A força de uma tag", [
      reguaPeso ? el("div", { "class": "esquema", html: reguaPeso }) : null,
      fichaDePeso("Chaves", pesos.chaves),
      fichaDePeso("Colchetes", pesos.colchetes),
      fichaDePeso("Peso numérico", pesos.numerico),
      fichaDePeso("Peso negativo", pesos.negativo),
      pesos.no_indesejado ? nota("", "Dentro do Conteúdo Indesejado é ao contrário", pesos.no_indesejado) : null,
      botaoIrPara("Ajustar o peso das minhas tags", "bancada")
    ]));

    // --- conteúdo indesejado
    var ci = r.conteudo_indesejado || {};
    sec.appendChild(caixa("Conteúdo indesejado (o que a IA deve evitar)", [
      el("p", { texto: ci.explica || "" }),
      nota("amarela", "O que a oficina NÃO tem", ci.aviso_lista_literal || ""),
      /* Esta lista mostra os presets TODOS, e a Bancada oferece só os que dá
         para enviar com segurança. Duas telas com contagens diferentes é
         exatamente o tipo de contradição que faz ele desconfiar da oficina
         inteira — então o item que não está lá diz aqui que não está, e por
         quê. Mostrar sem oferecer é honesto; mostrar e calar, não. */
      el("ul", { "class": "limpa" }, (ci.presets || []).map(function (p) {
        var partes = [el("strong", { texto: p.nome + ": " }), doc.createTextNode(p.explica || "")];
        if (p.id === "foco") {
          partes.push(el("em", {
            "class": "discreto",
            texto: " — este a Bancada não oferece. O manual escreve “variações” no plural, " +
              "ou seja, é uma família de presets e não um só. Escolher um nome que o manual " +
              "não confirma mandaria um número ao NovelAI sem ninguém saber qual, e a imagem " +
              "sairia filtrada por uma lista que você não pediu. Volta no dia em que o nome for confirmado."
          }));
        }
        return el("li", {}, partes);
      })),
      el("p", { "class": "discreto", texto: "Defeitos que esses presets combatem: " + (ci.defeitos_combatidos || []).join(", ") + "." }),
      botaoIrPara("Escrever o meu conteúdo indesejado", "bancada")
    ]));

    // --- vários personagens
    var mp = r.multi_personagem || {};
    var grade = global.Esquemas ? global.Esquemas.desenhar("grade_posicao") : null;
    sec.appendChild(caixa("Vários personagens na mesma imagem", [
      el("p", { texto: "Até " + mp.maximo + " personagens, cada um com a caixa dele (botão " + mp.botao + " no site). Exige o modelo " + String(mp.modelo_minimo).toUpperCase() + " ou mais novo." }),
      nota("vermelha", "A regra que mais confunde", mp.regra_contagem || ""),
      el("p", { texto: mp.regra_posicao || "" }),
      grade ? el("div", { "class": "esquema", html: grade }) : null,
      el("h4", { texto: "Os prefixos de ação" }),
      el("ul", { "class": "limpa" }, (mp.prefixos_acao || []).map(function (p) {
        return el("li", {}, [el("code", { texto: p.exemplo }), doc.createTextNode(" — " + p.explica)]);
      })),
      botaoIrPara("Abrir uma caixa de personagem", "bancada")
    ]));

    // --- referências
    var refs = r.referencias || {};
    sec.appendChild(caixa("Partir de uma imagem que você já tem", [
      el("div", { "class": "rolagem" }, [
        el("table", {}, [
          el("thead", {}, [el("tr", {}, [
            el("th", { texto: "Ferramenta" }), el("th", { texto: "O que ela leva" }),
            el("th", { texto: "O que devolve" }), el("th", { texto: "Custo" }), el("th", { texto: "Modelo" })
          ])]),
          el("tbody", {}, (refs.ferramentas || []).map(function (f) {
            return el("tr", {}, [
              el("td", { texto: f.nome }), el("td", { texto: f.leva || "" }),
              el("td", { texto: f.devolve || "" }),
              el("td", { texto: (f.custo_anlas ? f.custo_anlas + " Anlas por " + f.custo_por : "sem custo extra") }),
              el("td", { texto: String(f.modelo_minimo || "qualquer").toUpperCase() })
            ]);
          }))
        ])
      ]),
      el("h4", { texto: "Os dois controles" }),
      el("ul", { "class": "limpa" }, (refs.controles || []).map(function (c) {
        return el("li", {}, [el("strong", { texto: c.nome + ": " }), doc.createTextNode(c.explica)]);
      })),
      botaoIrPara("Anexar uma referência", "atelie", "referencias")
    ]));

    // --- image2image, inpaint, upscale
    sec.appendChild(caixa("Image2Image, Inpaint, Upscale e Enhance", [
      el("h4", { texto: "Image2Image (partir de uma imagem)" }),
      el("p", { texto: (r.image2image || {}).strength || "" }),
      el("p", { texto: (r.image2image || {}).noise || "" }),
      el("h4", { texto: "Inpaint (repintura por máscara)" }),
      el("p", { texto: (r.inpaint || {}).explica || "" }),
      el("p", { "class": "discreto", texto: (r.inpaint || {}).focado || "" }),
      el("h4", { texto: "Upscale e Enhance" }),
      el("ul", { "class": "limpa" }, (r.upscale_enhance || []).map(function (u) {
        return el("li", {}, [
          el("strong", { texto: u.nome + ": " }),
          doc.createTextNode(u.faz + (u.limite ? " — " + u.limite : "") + (u.nota ? " " + u.nota : ""))
        ]);
      })),
      botaoIrPara("Ir para a Mesa de Retoque", "retoque")
    ]));

    // --- director tools
    sec.appendChild(caixa("Ferramentas de direção (Director Tools)", [
      el("ul", { "class": "limpa" }, (r.director_tools || []).map(function (d) {
        return el("li", {}, [el("strong", { texto: d.nome + " (" + d.pt + "): " }), doc.createTextNode(d.faz)]);
      })),
      el("p", { "class": "discreto", texto: r.director_tools_nota || "" }),
      botaoIrPara("Ir para a Mesa de Retoque", "retoque")
    ]));

    // --- texto na imagem
    var tr = r.text_rendering || {};
    sec.appendChild(caixa("Escrever texto dentro da imagem", [
      el("p", { texto: "Formato: " + tr.formato + ". Posição: " + tr.posicao }),
      el("p", { texto: "Até " + tr.limite_caracteres + " caracteres por texto. Tags obrigatórias: " + (tr.tags_obrigatorias || []).join(", ") + "." }),
      el("p", { texto: tr.varios_textos || "" }),
      el("ul", { "class": "limpa" }, (tr.avisos || []).map(function (a) { return el("li", { texto: a }); })),
      botaoIrPara("Escrever uma fala", "bancada")
    ]));

    // --- atalhos e canvas
    sec.appendChild(caixa("Atalhos e Canvas (a tela de desenho do site)", [
      el("ul", { "class": "limpa" }, (r.atalhos || []).map(function (a) {
        return el("li", {}, [el("strong", { texto: a.nome + " (" + a.pt + "): " }), doc.createTextNode(a.explica)]);
      })),
      el("p", { texto: (r.canvas || {}).explica || "" }),
      el("p", { "class": "discreto", texto: "Ferramentas do Canvas: " + ((r.canvas || {}).ferramentas || []).join(", ") + "." })
    ]));

    // --- custos
    var cst = r.custos || {};
    sec.appendChild(caixa("Custos e limites, em " + moeda(), [
      explicaTermo("anlas"),
      el("ul", { "class": "limpa" }, (cst.itens || []).map(function (i) {
        return el("li", {}, [
          el("strong", { texto: i.nome + ": " }),
          doc.createTextNode(i.anlas + " " + moeda() + " por " + i.por + " — " + i.explica),
          i.verificado ? null : el("span", { "class": "selo selo-vazio", texto: "não verificado" })
        ]);
      })),
      /* A gratuidade do Opus é da GERAÇÃO, e só dela. Uma folha de mangá
         com a referência do personagem em cada quadro custa dinheiro que
         ele não espera. */
      nota("amarela", "No plano Opus a geração é de graça; a referência não é",
        "A geração de tamanho normal, com até 28 passos, em V4.5 ou anterior, não gasta " + moeda() +
        " no Opus. Mas a referência de personagem continua custando 5 " + moeda() +
        " por imagem, e soma a cada quadro: 8 quadros com a referência em cada um dão 40 " + moeda() + "."),
      nota("amarela", "Os preços dos planos não vêm do manual", ((cst.planos || {}).aviso) || ""),
      botaoIrPara("Ver o meu gasto e marcar o meu plano", "cofre")
    ]));

    // --- api
    var api = r.api || {};
    sec.appendChild(caixa("A geração aqui dentro, e por que ela é um extra", [
      nota("amarela", "O ponto frágil da oficina", api.endpoints_nota || ""),
      el("p", {}, [el("strong", { texto: "O que se ganha: " }), doc.createTextNode(api.ganha || "")]),
      el("p", {}, [el("strong", { texto: "O que se perde: " }), doc.createTextNode(api.perde || "")]),
      el("h4", { texto: "O token" }),
      el("ul", { "class": "limpa" }, ((api.token || {}).avisos || []).map(function (a) { return el("li", { texto: a }); }))
    ]));

    // --- as regras duras
    sec.appendChild(caixa("As regras que não se negociam", [
      el("p", { texto: "Estas são do NovelAI, não da oficina. Quando você esbarra numa delas, o aviso sai em vermelho e não some." }),
      el("ul", { "class": "limpa" }, (r.incompatibilidades || []).map(function (i) {
        return el("li", {}, [el("strong", { texto: i.titulo + ": " }), doc.createTextNode(i.explica)]);
      })),
      el("h4", { texto: "E estas são só avisos — você decide" }),
      el("ul", { "class": "limpa" }, (r.brigas_de_tag || []).map(function (i) {
        return el("li", {}, [el("strong", { texto: i.titulo + ": " }), doc.createTextNode(i.explica)]);
      }))
    ]));

    // --- conferência
    sec.appendChild(caixa("Conferência da própria oficina", [
      el("p", { texto: "A oficina testa a si mesma contra os exemplos escritos no manual. Se alguma linha aparecer como falhou, o prompt que ela monta não bate com o exemplo oficial." }),
      el("button", {
        type: "button", texto: "Rodar a conferência",
        ao: { click: function () { rodarConferencia($("#saida-conferencia")); } }
      }),
      el("div", { id: "saida-conferencia" })
    ]));
  }

  function fichaDePeso(nome, p) {
    if (!p) return null;
    return el("div", {}, [
      el("h4", { texto: nome }),
      el("p", {}, [
        el("code", { texto: p.simbolo }),
        doc.createTextNode(" — " + p.explica)
      ]),
      el("p", { "class": "discreto", texto: "Modelo mínimo: " + String(p.modelo_minimo || "qualquer").toUpperCase() +
        (p.exemplo_oficial ? " · Exemplo oficial: " + p.exemplo_oficial : "") })
    ]);
  }

  /* Confere as receitas do acervo rodando a MESMA função que o botão
     "Usar esta receita" roda. O que está no cartão tem de ser o que cai na
     Bancada — e quando não for, a conferência diz qual receita e mostra os
     dois textos. */
  function conferirReceitas() {
    var casos = [];
    (RC().receitas || []).forEach(function (r) {
      var ids = idsDaReceita(r);
      if (!ids.length) return;
      var m = montarBaseDaReceita(r);

      var perdidas = ids.length - m.itens.length;
      if (perdidas > 0) {
        casos.push({
          nome: "Receita “" + r.nome + "”: todas as tags existem no armazém",
          ok: false,
          esperado: ids.length + " tags",
          obtido: m.itens.length + " tags encontradas — " + perdidas + " id(s) não existem no acervo"
        });
      }
      if (!m.cartao || !m.itens.length) return;

      var saiu = textoDaBase(m.itens);
      var comp = compararComCartao(m.cartao, saiu);
      var comoOrdenou = m.modo
        ? " (ordem: " + global.Ordenador.modo(m.modo).nome + ")"
        : " (ordem do manual, sem reordenar)";

      var nome;
      if (comp.igual) {
        nome = "Receita “" + r.nome + "”: a Bancada mostra o mesmo prompt do cartão" + comoOrdenou;
      } else if (comp.equivalente) {
        nome = "Receita “" + r.nome + "”: a Bancada reproduz o cartão" + comoOrdenou +
          " — só que " + comp.trechos.map(function (t) {
            return "“" + t.manual + "” está no armazém como " + t.oficina.length + " tags (" + t.oficina.join(" + ") + ")";
          }).join("; ");
      } else {
        nome = "Receita “" + r.nome + "”: a Bancada mostra um prompt DIFERENTE do cartão" + comoOrdenou;
      }

      casos.push({ nome: nome, ok: comp.equivalente, esperado: m.cartao, obtido: saiu });
    });
    return casos;
  }

  function rodarConferencia(alvo) {
    if (!alvo) return;
    limpar(alvo);
    var casos = [];
    if (global.Motor) casos = casos.concat(global.Motor.autoteste());
    if (global.Ordenador) casos = casos.concat(global.Ordenador.autoteste());
    casos = casos.concat(conferirReceitas());
    var falhas = casos.filter(function (c) { return !c.ok; });
    alvo.appendChild(nota(falhas.length ? "vermelha" : "verde",
      falhas.length ? "Falhou" : "Tudo certo",
      casos.length + " conferências rodadas, " + falhas.length + " com falha."));
    alvo.appendChild(el("ul", { "class": "limpa" }, casos.map(function (c) {
      return el("li", {}, [
        el("strong", { texto: (c.ok ? "passou" : "FALHOU") + " — " }),
        doc.createTextNode(c.nome),
        c.ok ? null : el("div", { "class": "saida", texto: "esperado: " + c.esperado + "\nobtido: " + c.obtido })
      ]);
    })));
  }

  /* `passo` é opcional e só faz sentido quando `modulo` é "atelie": o Ateliê
     de personagem é dividido em 9 passos (var PASSOS, lá em cima), e cada um
     mostra uma parte diferente da tela (id "referencias" mostra a caixa de
     soltar imagem; sem isso, o botão "Anexar uma referência" da Sala de
     Recursos levava para o passo em que o Ateliê já estava — geralmente
     "1. Quem é" — e o autor nunca via a caixa de soltar imagem que veio
     buscar, sem entender por quê. */
  function botaoIrPara(rotulo, modulo, passo) {
    return el("button", {
      "class": "botao-p", type: "button", texto: rotulo,
      ao: {
        click: function () {
          if (passo && modulo === "atelie") passoAtual = passo;
          irPara(modulo);
        }
      }
    });
  }

  /* =================================================================
     13. MÓDULO — ÁLBUM
     ================================================================= */

  function moduloAlbum(sec) {
    limpar(sec);
    sec.appendChild(el("div", { "class": "cabecalho-modulo" }, [
      el("h2", { texto: "Álbum" }),
      el("p", { texto: "Tudo que você guardou: personagens, prompts, imagens geradas, imagens de exemplo e referências." })
    ]));

    if (!global.Memoria) return;

    /* Arquivos de dentro da máquina não entram no álbum: o índice do
       álbum de exemplos, o arquivo de preferências e as cópias datadas do
       rascunho. Eles existem para a oficina se achar, e mostrá-los ao
       autor é ruído. As cópias datadas ganham um bloco só delas, no fim,
       porque essas SIM ele pode querer. */
    function eInterno(nome) {
      return /^_indice\.json$/i.test(nome) ||
        /^_config_oficina\.json$/i.test(nome) ||
        /^_rascunho_/i.test(nome);
    }

    [
      ["personagens", "Personagens salvos"],
      ["prompts", "Prompts salvos"],
      ["geradas", "Imagens geradas"],
      ["exemplos", "Suas imagens de exemplo de tag"],
      ["referencias", "Referências"]
    ].forEach(function (par) {
      var alvo = el("div", { "class": "grade-album" });
      /* ⚠ A GAVETA DAS IMAGENS GERADAS PRECISA DE UMA PORTA DE ENTRADA.

         No dia um, sem token, TODA imagem dele nasce no site do NovelAI — e
         não havia jeito nenhum de trazê-la para cá. O bloco "Imagens geradas"
         dizia "Nada aqui ainda" e ia dizer isso para sempre. O par
         prompt + imagem, que é a razão inteira do Álbum, nunca se formava
         justamente no modo em que ele vai trabalhar. */
      sec.appendChild(caixa(par[1], par[0] === "geradas"
        ? [entradaDeImagemGerada(sec), alvo]
        : [alvo]));
      global.Memoria.listar(par[0]).then(function (itens) {
        limpar(alvo);
        var visiveis = itens.filter(function (it) { return !eInterno(it.nome); });
        if (!visiveis.length) {
          alvo.appendChild(el("span", { "class": "discreto", texto: "Nada aqui ainda." }));
          return;
        }
        visiveis.forEach(function (it) {
          var ehImagem = /\.(png|jpe?g|webp|gif)$/i.test(it.nome);
          var cartao = el("div", { "class": "item-album" });
          if (ehImagem && it.onde === "disco" && global.Ponte.endereco) {
            cartao.appendChild(el("img", { src: global.Ponte.endereco(par[0], it.nome), alt: it.nome, loading: "lazy" }));
          }
          cartao.appendChild(el("div", { "class": "nome", texto: it.nome }));
          cartao.appendChild(el("div", {
            "class": "quando",
            texto: (it.quando ? String(it.quando).replace("T", " ") + " · " : "") +
              (it.onde === "disco" ? "no disco" : "no navegador")
          }));
          /* Refazer uma imagem é a razão inteira de a semente ser guardada
             ao lado dela. Não havia como usá-la: nenhum campo mandava
             semente no pedido, e a ponte sorteava uma nova toda vez. */
          if (par[0] === "geradas" && ehImagem) {
            cartao.appendChild(el("button", {
              "class": "botao-p", type: "button", texto: "Refazer esta imagem",
              ao: { click: function () { refazerImagem(it.nome); } }
            }));
          }
          alvo.appendChild(cartao);
        });
      });
    });

    /* ⚠ "SALVAR ESTE PROMPT" GRAVAVA NO DISCO E DEPOIS SUMIA PARA SEMPRE —
       achado da auditoria de 24/08/2026. O botão "Salvar este prompt", na
       Bancada, pede um nome e grava em meu_trabalho\prompts\<nome>.json.
       Só que a única lista de prompts que o Álbum mostrava era a das
       cópias automáticas (`_rascunho_AAAA-MM-DD_HHMMSS`), filtrada bem
       aqui embaixo — um prompt salvo com nome próprio nunca aparecia em
       lugar nenhum da tela. O autor clicava em "salvar", via a mensagem de
       sucesso, e não tinha como abrir aquele prompt de novo a não ser
       procurando o arquivo à mão no Explorador do Windows. */
    var salvos = el("div", { "class": "escolhidas" });
    sec.appendChild(caixa("Prompts que você salvou com nome", [
      el("p", { texto: "O que você guarda pelo botão \"Salvar este prompt\", na Bancada, aparece aqui." }),
      salvos
    ]));
    function recarregarPromptsSalvos() {
      global.Memoria.listar("prompts").then(function (itens) {
        limpar(salvos);
        var nomeados = itens.filter(function (it) { return !/^_rascunho_/i.test(String(it.nome)); });
        if (!nomeados.length) {
          salvos.appendChild(el("span", { "class": "discreto", texto: "Nenhum ainda." }));
          return;
        }
        nomeados.forEach(function (it) {
          var n = String(it.nome).replace(/\.json$/i, "");
          salvos.appendChild(el("span", { "class": "escolhida" }, [
            doc.createTextNode(n),
            el("button", {
              "class": "x", type: "button", texto: "abrir", title: "Trazer este prompt para a Bancada",
              ao: {
                click: function () {
                  if (!global.confirm("Isso troca o que está na Bancada agora pelo prompt \"" + n + "\". Continuar?")) return;
                  global.Memoria.ler("prompts", n).then(function (r) {
                    if (!r.ok || !r.conteudo) { torrada("Não consegui abrir esse prompt."); return; }
                    restaurar(r.conteudo);
                    torrada("Prompt \"" + n + "\" carregado na Bancada.");
                    salvarRascunho();
                  });
                }
              }
            }),
            el("button", {
              "class": "x botao-perigo", type: "button", texto: "apagar", title: "Apagar este prompt salvo",
              ao: {
                click: function () {
                  if (!global.confirm("Apagar o prompt salvo \"" + n + "\"? Isso não desfaz.")) return;
                  global.Memoria.apagar("prompts", it.nome).then(function () {
                    torrada("Prompt \"" + n + "\" apagado.");
                    recarregarPromptsSalvos();
                  });
                }
              }
            })
          ]));
        });
      });
    }
    recarregarPromptsSalvos();

    // as cópias de segurança do que ele estava montando
    var copias = el("div", { "class": "escolhidas" });
    sec.appendChild(caixa("Cópias do seu rascunho, com data e hora", [
      el("p", { texto: "Toda vez que a oficina abre e encontra trabalho salvo, ela guarda uma cópia com a data no nome antes de qualquer coisa. Se algo se perder, está aqui." }),
      copias
    ]));
    global.Memoria.listar("prompts").then(function (itens) {
      limpar(copias);
      var backs = itens.filter(function (it) { return /^_rascunho_\d/i.test(it.nome); });
      if (!backs.length) {
        copias.appendChild(el("span", { "class": "discreto", texto: "Nenhuma cópia ainda." }));
        return;
      }
      backs.reverse().slice(0, 20).forEach(function (it) {
        copias.appendChild(el("span", { "class": "escolhida" }, [
          doc.createTextNode(String(it.nome).replace(/^_rascunho_/, "").replace(/\.json$/i, "").replace("_", " às ")),
          el("button", {
            "class": "x", type: "button", texto: "abrir", title: "Trazer esta cópia para a Bancada",
            ao: {
              click: function () {
                if (!global.confirm("Isso troca o que está na Bancada agora pela cópia de " + it.nome + ". Continuar?")) return;
                global.Memoria.ler("prompts", String(it.nome).replace(/\.json$/i, "")).then(function (r) {
                  if (!r.ok || !r.conteudo) { torrada("Não consegui abrir essa cópia."); return; }
                  restaurar(r.conteudo);
                  torrada("Cópia carregada na Bancada.");
                  salvarRascunho();
                });
              }
            }
          })
        ]));
      });
    });
  }

  /* A porta de entrada da imagem que ele gerou no site do NovelAI.

     Ela guarda DUAS coisas: a imagem, em meu_trabalho\\geradas, e ao lado
     dela uma ficha .json com o prompt que estava na Bancada naquele momento.
     É essa ficha que faz o botão "Refazer esta imagem" funcionar depois —
     sem ela, a imagem vira órfã. */
  function entradaDeImagemGerada(sec) {
    var caixaDaZona = el("div", {});

    caixaDaZona.appendChild(el("p", {
      texto: "Gerou uma imagem no site do NovelAI? Traga ela para cá. A oficina guarda a imagem no seu disco e escreve ao lado o " +
        GLOSSARIO.prompt() + " que está na Bancada agora — é assim que você consegue refazer a mesma imagem meses depois."
    }));

    if (global.Memoria && global.Memoria.seco()) {
      caixaDaZona.appendChild(nota("amarela", "Sem a janela preta não há onde guardar",
        "A oficina está aberta sem a " + GLOSSARIO.ponte() + ", então não tem disco para gravar imagem. " +
        "Feche esta aba, dê dois cliques no ABRIR A OFICINA, e a porta aparece aqui."));
      return caixaDaZona;
    }

    var zona = el("div", {}, [
      el("strong", { texto: "Solte aqui a imagem que você gerou no site" }),
      el("span", { texto: "ou clique para escolher o arquivo que você baixou de lá" })
    ]);

    zonaDeSolta(zona, function (arq) {
      guardarImagemQueEuGerei(arq, sec);
    }, "Solte aqui uma imagem que você gerou no site do NovelAI");

    caixaDaZona.appendChild(zona);
    caixaDaZona.appendChild(el("p", {
      "class": "discreto",
      texto: "Aviso do próprio manual: o NovelAI não guarda nada. Recarregar a aba apaga a sessão. " +
        "Baixe cada imagem pelo botão de salvar do site — o botão direito do mouse não guarda o prompt nem a semente dentro do arquivo."
    }));
    return caixaDaZona;
  }

  function guardarImagemQueEuGerei(arq, sec) {
    var m = montado();
    var d = new Date();
    function dd(n) { return String(n).padStart(2, "0"); }
    var carimbo = d.getFullYear() + dd(d.getMonth() + 1) + dd(d.getDate()) + "_" +
      dd(d.getHours()) + dd(d.getMinutes()) + dd(d.getSeconds());
    var limpo = String(arq.nome || "imagem.png").replace(/[^\w.\- ]+/g, "_");
    var nomeImagem = "minha_" + carimbo + "_" + limpo;

    global.Ponte.enviarImagem("geradas", nomeImagem, arq.dados).then(function (r) {
      if (!r || !r.ok) {
        torrada((r && r.erro) || "Não consegui guardar essa imagem no disco.");
        return;
      }
      var nomeGravado = r.nome || nomeImagem;

      var ficha = {
        versao_formato: "1.0.0",
        arquivo: nomeGravado,
        quando: d.toISOString().slice(0, 19),
        de_onde: "gerada por você no site do NovelAI e trazida para a oficina",
        modelo: P.modelo,
        prompt: m ? m.promptCompleto : "",
        conteudo_indesejado: m ? m.indesejado : "",
        personagens: m ? m.personagens : [],
        semente: P.semente,
        _leia: "Guarde este arquivo junto da imagem. O prompt daqui é o que permite refazer a mesma imagem depois."
      };

      global.Ponte.gravar("geradas", nomeGravado.replace(/\.[a-z0-9]+$/i, ""), ficha).then(function () {
        torrada(m && m.promptCompleto
          ? "Guardei a imagem e o prompt da Bancada ao lado dela."
          : "Guardei a imagem. A Bancada estava vazia, então a ficha ao lado ficou sem prompt.");
        moduloAlbum(sec);
      });
    });
  }

  /* Carrega o prompt e a semente de uma imagem já gerada.

     A ficha `.json` que a ponte grava ao lado de cada imagem tem tudo: o
     prompt, o modelo e a semente. Basta lê-la — o que nenhuma tela fazia. */
  function refazerImagem(nomeDaImagem) {
    var ficha = String(nomeDaImagem).replace(/\.(png|jpe?g|webp|gif)$/i, ".json");
    global.Memoria.ler("geradas", ficha).then(function (r) {
      if (!r || !r.ok || !r.conteudo) {
        torrada("Não achei a ficha desta imagem. Sem ela não dá para refazer igual.");
        return;
      }
      var f = r.conteudo;
      if (typeof f.semente === "number") P.semente = f.semente;
      if (f.modelo) P.modelo = casarModelo(f.modelo) || P.modelo;
      /* ⚠ O PROMPT GUARDADO VOLTA SEPARADO, e não num bolo só.

         Jogar o prompt inteiro na caixa de texto livre produzia o pior
         defeito do motor: a ficha traz o `Text:` dentro do prompt, o motor
         acrescentava o dele por cima, e saíam DOIS blocos Text: no mesmo
         pedido, com tag escrita depois do primeiro. O manual (§13) é duro
         nisso — o texto vem no fim absoluto, e o que vier depois pode acabar
         desenhado dentro da imagem. E este é o caminho do mangá: trocar as
         duas últimas linhas entre quadros.

         Agora: a fala vai para o campo de fala; o que o acervo reconhece
         volta como pastilha, com o peso que estava escrito; e só o que não
         casou com tag nenhuma fica na caixa de texto livre. */
      var txt = f.prompt || (f.pedido && f.pedido.prompt) || "";
      if (txt) {
        var movidos = [];
        var limpo = global.Motor ? global.Motor.extrairFalas(txt, "o prompt guardado com a imagem", movidos) : txt;
        var falas = [];
        movidos.forEach(function (mv) { falas = falas.concat(mv.falas); });

        var pecas = global.Motor && global.Motor.itensDoTextoLivre
          ? global.Motor.itensDoTextoLivre(limpo) : [];
        var sobrou = [];
        P.base = [];
        pecas.forEach(function (x) {
          var reg = x.id ? tagDe(x.id) : null;
          if (reg) {
            var it = itemDe(reg);
            it.peso = x.peso || { tipo: "nenhum", valor: 0 };
            P.base.push(it);
          } else {
            sobrou.push(x.tag);
          }
        });
        P.livreBase = sobrou.join(", ");
        P.textos = falas;
        if (!pecas.length) { P.livreBase = limpo; }
      }
      torrada("Trouxe o prompt e a semente " + (f.semente !== undefined ? f.semente : "") +
        " para a Bancada. Confira e gere de novo.");
      salvarRascunho();
      irPara("bancada");
    });
  }

  /* =================================================================
     14. MÓDULO — COFRE E GASTO
     ================================================================= */

  /* Qual é o plano dele no NovelAI.

     A oficina nunca perguntava, então mandava `assinatura: "nenhuma"` sem
     saber, e a regra do Opus — geração sem gastar Anlas — nunca podia ser
     alcançada, embora estivesse escrita certinha do outro lado. Na
     prática: um assinante Opus lia "Confirmar e gastar 5 Anlas" numa
     geração gratuita, e o teto de 300 por dia o barrava depois de 60
     gerações que não custaram nada. */
  function caixaDoPlano(sec) {
    var lista = planos();
    var sel = el("select", { "aria-label": "Qual é o seu plano no NovelAI" });
    lista.forEach(function (p) {
      var o = el("option", { value: p.id, texto: p.nome + (p.usd ? " — " + p.usd + " dólares por mês" : "") });
      if (P.assinatura === p.id) o.setAttribute("selected", "selected");
      sel.appendChild(o);
    });
    sel.addEventListener("change", function () {
      P.assinatura = sel.value;
      guardarPreferencias();
      torrada("Plano marcado: " + nomeDoPlano(P.assinatura) + ". A conta de custo já mudou.");
      salvarRascunho();
      moduloCofre(sec);
    });

    var atual = null;
    lista.forEach(function (p) { if (p.id === P.assinatura) atual = p; });

    var avisoPlanos = ((R().custos || {}).planos || {}).aviso || "";

    return caixa("Qual é o seu plano no NovelAI", [
      el("p", { texto: "A conta de custo depende disso. Sem essa resposta, a oficina trata você como quem paga por cada imagem." }),
      el("div", { "class": "peso-linha" }, [el("label", { texto: "O meu plano: " }), sel]),
      atual && atual.extra ? nota("", "O que este plano dá", atual.extra) : null,
      /* O ponto que custa dinheiro sem ele esperar: no Opus a geração é de
         graça, e a referência de personagem NÃO é. */
      P.assinatura === "opus"
        ? nota("amarela", "No Opus a geração é de graça; a referência não é",
          "A gratuidade é da GERAÇÃO — tamanho normal, até 28 passos, V4.5 ou anterior. A referência de personagem " +
          "continua custando 5 " + moeda() + " por imagem, e soma a cada quadro. Uma folha de mangá com 8 quadros e a " +
          "referência do personagem em cada um dá 40 " + moeda() + ".")
        : null,
      avisoPlanos ? el("p", { "class": "discreto", texto: avisoPlanos }) : null
    ]);
  }

  function moduloCofre(sec) {
    limpar(sec);
    var est = global.Ponte ? global.Ponte.estado() : { modo: "seco" };

    sec.appendChild(el("div", { "class": "cabecalho-modulo" }, [
      el("h2", { texto: "Cofre e gasto" }),
      el("p", { texto: "Onde a sua senha do NovelAI fica, qual é o seu plano, quanto você já gastou, e o teto que impede um susto." }),
      explicaTermo("token"),
      explicaTermo("anlas"),
      explicaTermo("ponte")
    ]));

    if (est.modo === "seco") {
      var f = global.Ponte.frase();
      sec.appendChild(nota("amarela", "A oficina está sem a parte que salva no disco", f.longa));
      return;
    }

    // --- o plano de assinatura
    sec.appendChild(caixaDoPlano(sec));

    // --- token
    var campo = el("input", { type: "password", placeholder: "cole aqui o seu token", "aria-label": "Token do NovelAI", autocomplete: "off" });
    var apiTok = (R().api || {}).token || {};
    var blocoToken = [
      el("p", {}, [
        el("strong", { texto: est.temToken ? "Token guardado. " : "Nenhum token guardado. " }),
        doc.createTextNode(est.temToken
          ? "A oficina nunca mostra o valor dele de volta, nem em pedaço."
          : "A oficina funciona inteira assim: você monta o prompt e usa o botão Copiar.")
      ]),
      /* Onde BUSCAR o token, que faltava. A tela pedia o token e só dizia
         onde ele seria GRAVADO. O dado de onde obtê-lo já estava no
         acervo, e era descartado. */
      nota("", "Onde pegar o seu token",
        "O token fica no site do NovelAI, no " + (apiTok.onde || "menu de conta do NovelAI") +
        ", com o nome " + (apiTok.nome || "Token Persistente de API") +
        ". Ele aparece uma vez só — copie antes de fechar a janela."),
      /* E onde ele fica gravado, por extenso. A tela mostrava
         "%APPDATA%\OficinaDeImagem", que é escrita de programador; a ponte
         já devolve o caminho de verdade. */
      nota("", "Onde ele mora nesta máquina",
        "Fora da pasta do livro e fora do controle de versão, em " +
        (est.pastaDoCofre || "C:\\Users\\<você>\\AppData\\Roaming\\OficinaDeImagem") +
        ". Ele nunca aparece na tela, nunca entra em registro de atividade, e nunca sobe para lugar nenhum.")
    ];
    if (!est.temToken) {
      blocoToken.push(el("div", { "class": "peso-linha" }, [
        campo,
        el("button", {
          "class": "botao-forte", type: "button", texto: "Guardar token",
          ao: {
            click: function () {
              global.Ponte.guardarToken(campo.value).then(function (r) {
                campo.value = "";
                torrada(r && r.ok ? "Token guardado." : (r && r.erro) || "Não consegui guardar.");
                moduloCofre(sec);
              });
            }
          }
        })
      ]));
    } else {
      blocoToken.push(el("button", {
        "class": "botao-perigo", type: "button", texto: "Apagar o token desta máquina",
        ao: {
          click: function () {
            global.Ponte.apagarToken().then(function () { torrada("Token apagado."); moduloCofre(sec); });
          }
        }
      }));
    }
    sec.appendChild(caixa("O token", blocoToken));

    // --- geração ao vivo
    var aoVivo = el("button", {
      "class": est.geracaoAoVivo ? "botao-perigo" : "botao-forte", type: "button",
      texto: est.geracaoAoVivo ? "Desligar a geração ao vivo" : "Ligar a geração ao vivo",
      ao: {
        click: function () {
          global.Ponte.ligarGeracaoAoVivo(!est.geracaoAoVivo).then(function (r) {
            torrada((r && r.mensagem) || (r && r.erro) || "");
            moduloCofre(sec);
          });
        }
      }
    });
    sec.appendChild(caixa("A chave da geração", [
      el("p", {
        texto: est.geracaoAoVivo
          ? "LIGADA. Confirmar uma geração gasta Anlas de verdade."
          : "Desligada, que é como ela nasce. Assim a oficina monta a chamada e mostra o custo, sem enviar nada e sem gastar nada. É o modo ensaio."
      }),
      aoVivo,
      /* Dois botões, e não um.

         O botão único chamava-se "Teste de 1 imagem" e não gerava imagem
         nenhuma: por baixo ele só lia os dados da conta. E o texto ao lado
         prometia provar que a ponte estava de pé — justamente o que ele
         não provava, porque o endereço da conta é outro, e é o da geração
         que pode quebrar (é o que a documentação oficial não publica).
         Agora cada botão diz o que faz. */
      el("button", {
        "class": "botao-p", type: "button", texto: "Testar se o token vale (não gera imagem)",
        ao: {
          click: function () {
            // o nó é procurado de novo a cada escrita: ver `saidaViva`
            var S = saidaViva("saida-cofre");
            S.limpar();
            S.por(el("p", { "class": "carregando", texto: "Perguntando ao NovelAI…" }));
            global.Ponte.testarToken().then(function (r) {
              S.limpar();
              if (r && r.ok) {
                S.por(nota("verde", "O token vale",
                  (r.mensagem || "O NovelAI reconheceu o seu token.") +
                  (r.plano ? " Plano da conta: " + r.plano + "." : "") +
                  (typeof r.anlas_na_conta === "number" ? " " + moeda() + " na conta: " + r.anlas_na_conta + "." : "")));
              } else {
                S.por(nota("vermelha", "Não deu", (r && r.erro) || "A ponte não respondeu."));
              }
            });
          }
        }
      }),
      el("p", { "class": "discreto", texto: "Este teste não gasta nada: ele só pergunta ao NovelAI se a sua senha é aceita. Ele NÃO prova que a geração funciona." }),
      /* Este botão não gerava imagem nenhuma: ele trocava de tela e mostrava
         um recado. O endereço existia e estava escrito, testado e documentado
         do lado da ponte (POST /api/testar_geracao, com as três portas de
         segurança), e nenhuma linha da tela o chamava. Ele é a única prova
         possível do endereço de geração — o único que pode quebrar do lado
         do NovelAI, porque é o que a documentação não publica. */
      el("button", {
        "class": "botao-p", type: "button", texto: "Gerar 1 imagem de prova",
        ao: { click: function () { provaDeGeracao(); } }
      }),
      el("p", { "class": "discreto", texto: "A prova de verdade é uma geração pequena, na Bancada, com o custo confirmado antes. O endereço da geração é o único que pode quebrar, porque não está na documentação oficial." }),
      el("div", { id: "saida-cofre" })
    ]));

    // --- orçamento
    /* Os dois rótulos ao lado eram <label> soltos, sem ligação com o campo:
       na tela pareciam rótulo, para o leitor de tela eram texto qualquer, e
       clicar neles não punha o cursor no campo. `for` + `id` liga os dois. */
    var tetoDia = el("input", {
      type: "number", id: "teto-dia", value: est.tetoDia, min: "0", style: "width:6em"
    });
    var tetoSes = el("input", {
      type: "number", id: "teto-sessao", value: est.tetoSessao, min: "0", style: "width:6em"
    });
    sec.appendChild(caixa("O teto de gasto", [
      el("p", { texto: "Hoje você gastou " + est.anlasHoje + " de " + est.tetoDia + " " + moeda() + ". Nesta sessão, " + est.anlasSessao + " de " + est.tetoSessao + "." }),
      el("div", { "class": "peso-linha" }, [
        el("label", { "for": "teto-dia", texto: "Teto do dia: " }), tetoDia,
        el("label", { "for": "teto-sessao", texto: "Teto da sessão: " }), tetoSes,
        el("button", {
          type: "button", texto: "Guardar os tetos",
          ao: {
            click: function () {
              global.Ponte.orcamento({
                teto_dia: parseInt(tetoDia.value, 10),
                teto_sessao: parseInt(tetoSes.value, 10)
              }).then(function (r) {
                torrada(r && r.ok ? "Tetos guardados." : (r && r.erro) || "Não consegui guardar.");
                moduloCofre(sec);
              });
            }
          }
        })
      ]),
      el("p", { "class": "discreto", texto: "A conta do NovelAI aceita uma geração por vez. A oficina respeita esse limite: enquanto uma roda, a outra espera." })
    ]));

    // --- endereços
    var saidaEnd = el("div", {});
    sec.appendChild(caixa("Os endereços técnicos da geração", [
      nota("amarela", "Nenhum deles é oficial",
        "A documentação do NovelAI não publica os endereços técnicos da geração de imagem. Eles vivem num arquivo de texto, em ponte\\endpoints.json, e se consertam sem mexer no programa. É por isso que a geração aqui dentro é um extra, e o botão Copiar prompt nunca some."),
      el("button", {
        "class": "botao-p", type: "button", texto: "Mostrar os endereços",
        ao: {
          click: function () {
            global.Ponte.enderecos().then(function (r) {
              limpar(saidaEnd);
              if (!r || !r.ok) { saidaEnd.appendChild(el("p", { texto: (r && r.erro) || "Não consegui ler." })); return; }
              saidaEnd.appendChild(el("div", { "class": "saida", texto: JSON.stringify(r.rotas, null, 2) }));
            });
          }
        }
      }),
      saidaEnd
    ]));
  }

  /* A prova de geração, em duas etapas, como a ponte espera.

     Primeiro o ensaio: nada é enviado, e ela devolve o custo. Só depois de
     ele ver o número é que o botão de confirmar aparece. É a chamada mais
     barata possível — um prompt de três palavras, uma imagem, tamanho de
     partida —, e serve para provar que a ponte fala com o NovelAI antes de
     qualquer lote. */
  function provaDeGeracao() {
    // o nó é procurado de novo a cada escrita: ver `saidaViva`
    var S = saidaViva("saida-cofre");
    if (!S.existe()) return;
    S.limpar();

    if (!global.Ponte || !global.Ponte.testarGeracao) {
      S.por(nota("vermelha", "Esta oficina está sem a ponte", "Abra pelo ABRIR A OFICINA para usar este botão."));
      return;
    }

    S.por(el("p", { "class": "carregando", texto: "Montando a chamada mais barata possível…" }));

    global.Ponte.testarGeracao(false, null).then(function (r) {
      S.limpar();
      if (!r || !r.ok) {
        S.por(nota("vermelha", "Não deu", (r && r.erro) || "A ponte não respondeu."));
        return;
      }
      var anlas = (r.custo && r.custo.anlas) || 0;

      if (r.gerou) {
        S.por(nota("verde", "A geração funciona", (r.mensagem || "A imagem de prova foi salva.")));
        return;
      }

      S.por(nota("", "Ensaio — nada foi enviado e nada foi gasto",
        (r.motivo || "") + " A imagem de prova custaria " + anlas + " " + moeda() + "."));

      var est = global.Ponte.estado();
      if (!est.geracaoAoVivo) {
        S.por(el("p", { texto: "A chave da geração ao vivo está desligada, e é ela que impede qualquer gasto. Ligue a chave aqui em cima para poder fazer a prova de verdade." }));
        return;
      }

      S.por(el("button", {
        "class": "botao-forte", type: "button",
        texto: "Confirmar a prova e gastar " + anlas + " " + moeda(),
        ao: {
          click: function () {
            S.limpar();
            S.por(el("p", { "class": "carregando", texto: "Gerando a imagem de prova…" }));
            global.Ponte.testarGeracao(true, anlas).then(function (g) {
              S.limpar();
              if (!g || !g.ok || !g.gerou) {
                S.por(nota("vermelha", "A geração não funcionou",
                  (g && (g.erro || g.motivo)) || "A ponte não respondeu." +
                  " Isto é o que este botão existe para descobrir: o endereço da geração não é publicado pelo NovelAI, " +
                  "e pode ter mudado. O botão Copiar prompt continua funcionando."));
                return;
              }
              S.por(nota("verde", "A geração funciona",
                (g.mensagem || "A imagem de prova foi salva em meu_trabalho\\geradas.")));
              (g.arquivos || []).forEach(function (a) {
                S.por(el("div", { "class": "item-album" }, [
                  el("img", { src: global.Ponte.endereco("geradas", a.imagem), alt: "imagem de prova" }),
                  el("div", { "class": "nome", texto: a.imagem })
                ]));
              });
            });
          }
        }
      }));
    });
  }

  /* =================================================================
     15. A BANCADA — sempre visível, do lado direito
     ================================================================= */

  function renderBancada() {
    var b = $("#bancada");
    if (!b) return;
    var rolagem = b.scrollTop;
    limpar(b);

    var m = montado();
    var cap = global.Motor ? global.Motor.podem(P.modelo) : {};

    b.appendChild(el("h3", { texto: "Bancada de prompt" }));

    // aviso permanente: o NovelAI só faz anime
    var perm = (R().avisos_permanentes || []).filter(function (a) { return a.id === "so_anime"; })[0];
    if (perm) b.appendChild(nota("", "Antes de tudo", perm.texto));

    // --- modelo
    var selM = el("select", { "aria-label": "Modelo" });
    (global.Motor ? global.Motor.modelos() : []).forEach(function (mo) {
      var o = el("option", { value: mo.id, texto: mo.nome });
      if (mo.id === P.modelo) o.setAttribute("selected", "selected");
      selM.appendChild(o);
    });
    selM.addEventListener("change", function () { P.modelo = selM.value; salvarRascunho(); });
    b.appendChild(el("div", { "class": "peso-linha" }, [el("label", { texto: "Modelo: " }), selM]));
    var moAtual = global.Motor ? global.Motor.modelo(P.modelo) : null;
    if (moAtual && moAtual.dica) b.appendChild(el("p", { "class": "discreto", texto: moAtual.dica }));

    // --- onde a tag cai
    var selA = el("select", { "aria-label": "Onde a próxima tag vai cair" });
    var alvos = [["base", "Prompt base (a caixa principal)"], ["indesejado", "Conteúdo indesejado (o que evitar)"]];
    P.personagens.forEach(function (p, i) {
      alvos.splice(1 + i, 0, ["p" + i, "Caixa do personagem " + (i + 1) + (p.nome ? " — " + p.nome : "")]);
    });
    alvos.forEach(function (a) {
      var o = el("option", { value: a[0], texto: a[1] });
      if (P.alvo === a[0]) o.setAttribute("selected", "selected");
      selA.appendChild(o);
    });
    selA.addEventListener("change", function () { P.alvo = selA.value; render(); });
    b.appendChild(el("div", { "class": "peso-linha" }, [el("label", { texto: "A tag que eu clicar vai para: " }), selA]));

    /* O que aparece aqui é EXATAMENTE o que o botão Copiar leva: o prompt
       base mais o bloco Text: no fim. Mostrar uma coisa e copiar outra é o
       tipo de diferença que só se descobre depois de gastar Anlas. */
    var tituloBase = el("div", { "class": "aperto" }, [el("h3", { texto: "Prompt base" })]);
    var linhaBase = m ? m.promptCompleto : "";
    /* ⚠ "LIMPAR TUDO" JÁ EXISTIA, MAS SÓ NUCLEAR E LONGE DAQUI.

       O botão de apagar tudo (base + caixas de personagem + indesejado +
       falas) fica lá embaixo, junto de Copiar/Salvar/Gerar — quem olha só a
       caixa do prompt, que é a coisa mais visível da Bancada, não o vê. E
       "tudo" é grande demais para quem só quer recomeçar a caixa principal
       sem perder as caixas de personagem já montadas. Este botão limpa só
       o que está aqui embaixo: as tags da base e o texto livre. */
    if (P.base.length || P.livreBase) {
      tituloBase.appendChild(el("button", {
        "class": "botao-p", type: "button", texto: "Limpar a caixa principal",
        title: "Apaga só as tags e o texto do prompt base — as caixas de personagem e o conteúdo indesejado ficam como estão",
        ao: {
          click: function () {
            if (!global.confirm("Isso apaga as tags e o texto do prompt base (a caixa principal). As caixas de personagem continuam. Continuar?")) return;
            P.base = []; P.livreBase = "";
            salvarRascunho();
            torrada("Caixa principal limpa.");
          }
        }
      }));
    }
    b.appendChild(tituloBase);
    b.appendChild(el("div", {
      "class": "saida" + (linhaBase ? "" : " vazia"),
      html: linhaBase ? global.Motor.comDestaque(linhaBase) : "Ainda vazio. Clique numa tag no Armazém."
    }));
    /* ⚠ ESTA LINHA CONTAVA DUAS COISAS DIFERENTES E AS ESCREVIA JUNTAS.

       Ela somava as tags do prompt INTEIRO (caixas de personagem incluídas) e
       os caracteres SÓ da caixa principal. Com a base vazia e três tags numa
       caixa de personagem, a Bancada escrevia "Ainda vazio. Clique numa tag
       no Armazém." e, na linha de baixo, "3 tags · 0 caracteres". A linha
       desmentia a frase logo acima dela, e o autor não tinha como saber em
       qual acreditar.

       Como ela fica DEBAIXO da caixa principal, ela conta a caixa principal.
       O total do prompt aparece separado e nomeado, e só quando é diferente. */
    if (m) {
      var contaBase = plural(m.contagem.tagsBase, "tag") + " · " + plural(linhaBase.length, "caractere");
      var linhaConta = "na caixa principal: " + contaBase;
      if (m.contagem.tags !== m.contagem.tagsBase) {
        linhaConta += "  ·  no prompt todo: " + plural(m.contagem.tags, "tag");
      }
      b.appendChild(el("div", { "class": "contador", texto: linhaConta }));
    }

    /* Quando a receita não pôde ser reproduzida palavra por palavra, os
       dois textos aparecem aqui, lado a lado. Sem esconder e sem fingir. */
    if (avisoDaReceita) {
      var explicacao = avisoDaReceita.equivalente
        ? "Na receita “" + avisoDaReceita.receita + "”, o manual escreve numa frase só o que o armazém guarda " +
          "como tags separadas: " +
          (avisoDaReceita.trechos || []).map(function (t) {
            return "“" + t.manual + "” virou " + t.oficina.join(" + ");
          }).join("; ") +
          ". O pedido diz a mesma coisa, na mesma ordem — muda a escrita."
        : "Na receita “" + avisoDaReceita.receita + "”, o que eu montei não é o mesmo que o cartão mostra. " +
          "Confira os dois abaixo antes de gerar.";
      var dif = nota(avisoDaReceita.equivalente ? "" : "amarela",
        avisoDaReceita.equivalente
          ? "O manual escreve isto numa frase; o armazém, em tags"
          : "O prompt do manual e o que eu montei não batem",
        explicacao + " Compare:");
      dif.appendChild(el("div", { "class": "saida", texto: "manual:  " + avisoDaReceita.cartao }));
      dif.appendChild(el("div", { "class": "saida", texto: "oficina: " + avisoDaReceita.bancada }));
      dif.appendChild(el("button", {
        "class": "botao-p", type: "button", texto: "Entendi, esconder este aviso",
        ao: { click: function () { avisoDaReceita = null; render(); } }
      }));
      b.appendChild(dif);
    }
    if (m && m.texto) {
      b.appendChild(el("p", { "class": "discreto", texto: "O bloco Text: é a última coisa do prompt. Nada pode vir depois dele — isso é regra do motor." }));
    }

    // --- a ordem
    var ordenacao = ordenarLista(baseParaOrdenar());
    var chaveOrd = el("label", { "class": "peso-linha" }, []);
    var cb = el("input", { type: "checkbox" });
    if (P.ordenarAuto) cb.setAttribute("checked", "checked");
    cb.addEventListener("change", function () { P.ordenarAuto = cb.checked; salvarRascunho(); });
    chaveOrd.appendChild(cb);
    chaveOrd.appendChild(doc.createTextNode(" Pôr as tags na ordem certa sozinha"));
    b.appendChild(chaveOrd);
    if (P.ordenarAuto && ordenacao.movimentos.length) {
      var av = nota("", "A oficina mudou " + plural(ordenacao.movimentos.length, "tag") + " de lugar",
        ordenacao.movimentos.slice(0, 2).map(function (x) { return x.motivo; }).join(" "));
      av.appendChild(botaoIrPara("Ver tudo o que mudou, e por quê", "regua"));
      b.appendChild(av);
    }

    // --- as tags escolhidas
    b.appendChild(el("h3", { texto: "As suas tags" }));
    b.appendChild(chipsDe(P.base, "base"));
    b.appendChild(camposPorPreencher());

    /* ⚠ O RÓTULO DESTA CAIXA ESCONDIA O QUE ELA FAZ DE MAIS ÚTIL.

       Ela dizia "texto livre, se quiser escrever alguma coisa que não está
       nas tags" — que lê como o contrário de "cole aqui o seu prompt". Só que
       é exatamente aqui que um prompt colado vira tags reconhecidas, entra na
       ordenação e passa por toda a conferência. Um leigo chegando com um
       prompt na mão não tinha como descobrir isso. */
    b.appendChild(el("p", { "class": "discreto", texto: "Escreva aqui o que não estiver nas gavetas — ou cole um prompt inteiro que você já tem. Eu reconheço as tags e ponho na ordem." }));
    var livre = el("textarea", {
      rows: "2",
      "aria-label": "Texto livre do prompt base",
      placeholder: "cole aqui um prompt que você já escreveu, ou escreva tags soltas separadas por vírgula"
    });
    livre.value = P.livreBase;
    livre.addEventListener("change", function () { P.livreBase = livre.value; salvarRascunho(); });
    b.appendChild(livre);

    // --- peso
    if (P.base.length) {
      var det = el("details", { "class": "gaveta" });
      det.appendChild(el("summary", { texto: "Ajustar a força de cada tag" }));
      var miolo = el("div", { "class": "miolo" });
      miolo.appendChild(el("p", {
        "class": "discreto",
        texto: "Chaves e colchetes funcionam em qualquer modelo. O peso numérico exige V4 ou mais novo. O peso negativo exige V4.5 — e ele não enfraquece: inverte o conceito."
      }));
      P.base.forEach(function (it) { miolo.appendChild(linhaDePeso(it, cap)); });
      det.appendChild(miolo);
      b.appendChild(det);
    }

    // --- personagens
    b.appendChild(el("h3", { texto: "Personagens em caixa separada" }));
    if (!cap.multiPersonagem) {
      b.appendChild(nota("amarela", "Não neste modelo",
        "Caixa de personagem separada só existe no V4 ou mais novo. No modelo atual, escreva tudo no prompt base."));
    }
    /* Aqui morava a segunda cópia da explicação de "como dar
       características a UM personagem". A primeira está no Armazém, na nota
       "Onde a tag vai cair", que muda de cor e de texto conforme o alvo —
       ou seja, a que fala no momento certo. Esta era fixa e repetia a
       mesma coisa em 46 palavras, numa coluna que já tinha 1.944px de
       conteúdo em 788px de janela. Decisão do autor de 27/08/2026: apagar
       a da Bancada, manter a do Armazém. */
    P.personagens.forEach(function (p, i) { b.appendChild(caixaDePersonagem(p, i)); });
    if (P.personagens.length < 6) {
      b.appendChild(el("button", {
        type: "button", texto: "Abrir caixa de personagem (" + P.personagens.length + " de 6)",
        ao: {
          click: function () {
            P.personagens.push({ nome: "", itens: [], livre: "", indesejado: "", posicao: null });
            var indice = P.personagens.length - 1;
            P.alvo = "p" + indice;
            salvarRascunho();
            irPara("armazem");
            torrada("Caixa do personagem " + (indice + 1) + " aberta. As tags que você clicar agora no Armazém vão para ela — escolha, por exemplo, cabelo, olhos e roupa.");
          }
        }
      }));
    }

    /* --- as Etiquetas de Qualidade (Quality Tags)

       Interruptor real do NovelAI, que faltava aqui. Ele importa por um
       motivo prático: as Etiquetas de Qualidade contêm `no text` por
       dentro, e por isso brigam com a fala escrita na imagem — o mangá
       dele sairia brigando com o próprio balão. O manual também manda
       desligá-las quando se persegue um estilo. */
    b.appendChild(el("h3", { texto: "Etiquetas de qualidade" }));
    var chaveQ = el("label", { "class": "peso-linha" }, []);
    var cbq = el("input", { type: "checkbox" });
    if (P.qualidadeAuto) cbq.setAttribute("checked", "checked");
    cbq.addEventListener("change", function () { P.qualidadeAuto = cbq.checked; salvarRascunho(); });
    chaveQ.appendChild(cbq);
    chaveQ.appendChild(doc.createTextNode(" Deixar o site acrescentar as Etiquetas de Qualidade (Quality Tags)"));
    b.appendChild(chaveQ);
    b.appendChild(el("p", {
      "class": "discreto",
      texto: P.qualidadeAuto
        ? "Ligadas. Elas puxam para o anime bonitinho padrão e contêm no text por dentro — se a sua fala não aparecer na imagem, desligue aqui."
        : "Desligadas. É o que o manual recomenda ao perseguir um estilo, e para a fala escrita na imagem funcionar."
    }));

    // --- conteúdo indesejado
    b.appendChild(el("h3", { texto: "Conteúdo indesejado" }));
    var selP = el("select", { "aria-label": "Preset de conteúdo indesejado" });
    /* "Variações por foco" saiu da lista, e o motivo é o próprio acervo: o
       manual escreve "variações" no plural, ou seja, é uma FAMÍLIA de
       presets, não um preset. Oferecer um item que não existe com esse nome
       manda um número ao NovelAI sem ninguém saber qual. Volta no dia em que
       o nome real for confirmado. */
    ((R().conteudo_indesejado || {}).presets || [])
      .filter(function (pr) { return pr.id !== "foco"; })
      .forEach(function (pr) {
        var o = el("option", { value: pr.id, texto: pr.nome });
        if (P.indesejado.preset === pr.id) o.setAttribute("selected", "selected");
        selP.appendChild(o);
      });
    selP.addEventListener("change", function () { P.indesejado.preset = selP.value; salvarRascunho(); });
    b.appendChild(el("div", { "class": "peso-linha" }, [el("label", { texto: "Preset: " }), selP]));
    b.appendChild(el("p", {
      "class": "discreto",
      texto: "O NovelAI identifica cada preset por um número, e o manual não publica esse número. " +
        "A oficina usa a numeração que os programas da comunidade usam. Se a imagem evitar alguma coisa que você não pediu, é aqui. " +
        "O site tem mais um preset, o de foco humano, e a oficina não o oferece de propósito: " +
        "o manual não confirma o nome dele, e mandar o número errado filtraria a sua imagem por uma lista que você não pediu. " +
        "A Sala de recursos explica isso por extenso."
    }));
    var ind = el("textarea", {
      rows: "2",
      "aria-label": "Conteúdo indesejado, escrito por você",
      placeholder: "o que a IA deve evitar desenhar"
    });
    ind.value = P.indesejado.livre;
    ind.addEventListener("change", function () { P.indesejado.livre = ind.value; salvarRascunho(); });
    b.appendChild(ind);
    if (P.indesejado.itens.length) b.appendChild(chipsDe(P.indesejado.itens, "indesejado"));

    // --- texto na imagem
    b.appendChild(el("h3", { texto: "Texto dentro da imagem" }));
    if (!cap.textoNaImagem) {
      b.appendChild(el("p", { "class": "discreto", texto: "Só no modelo V4 ou mais novo." }));
    }
    P.textos.forEach(function (t, i) {
      var ta = el("textarea", { rows: "2", "aria-label": "Texto " + (i + 1) });
      ta.value = t;
      ta.addEventListener("change", function () { P.textos[i] = ta.value; salvarRascunho(); });
      b.appendChild(ta);
      b.appendChild(el("div", { "class": "contador", texto: t.length + " de 120 caracteres" }));
    });
    b.appendChild(el("button", {
      "class": "botao-p", type: "button", texto: "Adicionar uma fala",
      ao: { click: function () { P.textos.push(""); salvarRascunho(); } }
    }));
    if (P.textos.length) {
      b.appendChild(el("button", {
        "class": "botao-p", type: "button", texto: "Tirar a última fala",
        ao: { click: function () { P.textos.pop(); salvarRascunho(); } }
      }));
    }

    // --- partir da imagem da Mesa de Retoque
    if (temImagemDeRetoque()) {
      b.appendChild(el("h3", { texto: "Partir de uma imagem" }));
      var chaveR = el("label", { "class": "peso-linha" }, []);
      var cbr = el("input", { type: "checkbox" });
      if (P.usarRetoque) cbr.setAttribute("checked", "checked");
      cbr.addEventListener("change", function () { P.usarRetoque = cbr.checked; salvarRascunho(); });
      chaveR.appendChild(cbr);
      chaveR.appendChild(doc.createTextNode(" Partir de “" + P.retoque.nome + "”, a imagem da Mesa de Retoque"));
      b.appendChild(chaveR);
      b.appendChild(el("p", {
        "class": "discreto",
        texto: P.usarRetoque
          ? "A imagem viaja junto, com Força " + String(P.retoque.forca).replace(".", ",") +
            " e Ruído " + String(P.retoque.ruido).replace(".", ",") + ". Ajuste os dois na Mesa de Retoque."
          : "Desligado: a imagem fica guardada, e a geração parte só do prompt."
      }));
    }

    // --- avisos
    if (m && m.avisos.length) {
      b.appendChild(el("h3", { texto: "Avisos" }));
      m.avisos.forEach(function (a) {
        var nivel = a.nivel === "vermelho" ? "vermelha" : (a.nivel === "amarelo" ? "amarela" : "");
        var rot = a.nivel === "vermelho" ? "Regra do motor" : (a.nivel === "amarelo" ? "Atenção" : "Nota");
        var n = nota(nivel, rot, a.texto);
        if (a.saida) n.appendChild(el("p", { "class": "discreto", texto: a.saida }));
        b.appendChild(n);
      });
    }

    /* --- a semente

       Ela era gravada ao lado de cada imagem e mostrada no Álbum, e não
       havia como usá-la de novo — então refazer uma imagem, que é a razão
       inteira de guardar a semente, não funcionava por dentro da Oficina. */
    b.appendChild(el("h3", { texto: "Semente" }));
    b.appendChild(el("p", {
      "class": "discreto",
      texto: "A semente (o número que faz a IA repetir exatamente o mesmo sorteio) é o que permite refazer uma imagem igual."
    }));
    var campoSem = el("input", {
      type: "number", value: P.semente === null ? "" : P.semente,
      "aria-label": "Número da semente",
      placeholder: "vazio = sortear uma nova", style: "width:11em"
    });
    campoSem.addEventListener("change", function () {
      var v = campoSem.value.trim();
      P.semente = v === "" ? null : parseInt(v, 10);
      salvarRascunho();
    });
    b.appendChild(el("div", { "class": "peso-linha" }, [
      el("label", { texto: "Usar a semente: " }), campoSem,
      el("button", {
        "class": "botao-p", type: "button", texto: "Sortear uma nova",
        ao: { click: function () { P.semente = null; salvarRascunho(); } }
      })
    ]));

    // --- custo
    if (m && m.custo) {
      b.appendChild(el("h3", { texto: "Custo em " + moeda() }));
      b.appendChild(explicaTermo("anlas"));
      if (m.custo.linhas.length) {
        b.appendChild(el("ul", { "class": "limpa" }, m.custo.linhas.map(function (l) {
          return el("li", { texto: l.o + ": " + l.anlas + " " + moeda() + " — " + l.nota });
        })));
        b.appendChild(el("p", {}, [el("strong", { texto: "Total das ferramentas: " + m.custo.total + " " + moeda() })]));
      }
      b.appendChild(el("p", { "class": "discreto", texto: m.custo.observacao }));
      b.appendChild(el("p", { "class": "discreto" }, [
        doc.createTextNode("A conta acima vale para o plano que você marcou: "),
        el("strong", { texto: nomeDoPlano(P.assinatura) }),
        doc.createTextNode(". "),
        botaoIrPara("Trocar o meu plano", "cofre")
      ]));
    }

    // --- as outras ações, que continuam no corpo da Bancada
    var est = global.Ponte ? global.Ponte.estado() : { modo: "seco" };
    var acoes = el("div", { "class": "acoes-bancada" });
    var pedacos = pedacosParaCopiar(m);

    /* O segundo botão só aparece quando há mais de uma peça — senão ele
       ofereceria "só a caixa principal" num prompt que é só ela. */
    if (pedacos.length > 1 && m && m.promptCompleto) {
      acoes.appendChild(el("button", {
        type: "button", texto: "Copiar só a caixa principal",
        ao: { click: function () { copiarSoABase(m); } }
      }));
    }
    acoes.appendChild(el("button", {
      type: "button", texto: "Como colar no site",
      ao: { click: function () { mostrarColagem(m); } }
    }));
    acoes.appendChild(el("button", {
      type: "button", texto: "Salvar este prompt",
      ao: { click: function () { salvarPrompt(); } }
    }));
    if (est.modo === "ligado_com_token") {
      acoes.appendChild(el("button", {
        type: "button", texto: est.geracaoAoVivo ? "Gerar aqui" : "Ensaiar a geração",
        ao: { click: function () { gerarAqui(m, est); } }
      }));
    }
    acoes.appendChild(el("button", {
      "class": "botao-perigo botao-p", type: "button", texto: "Limpar tudo",
      ao: {
        click: function () {
          if (!global.confirm("Isso apaga todas as tags que você escolheu. Continuar?")) return;
          P.base = []; P.personagens = []; P.textos = []; P.livreBase = "";
          P.indesejado = { itens: [], livre: "", preset: P.indesejado.preset };
          P.alvo = "base";
          salvarRascunho();
        }
      }
    }));
    b.appendChild(acoes);

    b.appendChild(el("div", { id: "saida-bancada" }));
    b.appendChild(rodapeDaBancada(m, pedacos));
    b.scrollTop = rolagem;
  }

  /* ⚠ O RODAPÉ GRUDADO — as duas coisas que não podem sair da vista.

     Medido antes desta mudança: a Bancada tinha 1.944px de conteúdo em
     788px de janela, e as duas coisas que o autor mais procura eram as
     mais fundas dela. O `Copiar prompt` nascia 1.033px abaixo do que se
     vê; o custo em Anlas, 1.420px abaixo. Ele montava o prompt e não
     achava como levá-lo embora, nem quanto ele custaria.

     A regra de TDAH que manda aqui é a terceira: o estado atual — quanto
     já vai custar e o que fazer em seguida — fica à vista o tempo todo,
     porque memória de trabalho é justamente o que falha.

     O rodapé leva UM botão de destaque, e um só. Copiar/salvar/gerar
     continuam acima; aqui fica o gesto que fecha o trabalho. */
  function rodapeDaBancada(m, pedacos) {
    var pe = el("div", { "class": "bancada-rodape" });

    var quantas = m ? m.contagem.tags : 0;
    var linha = el("div", { "class": "custo-agora" }, [
      el("span", { texto: plural(quantas, "tag") + " no prompt" })
    ]);
    if (m && m.custo && m.custo.total) {
      linha.appendChild(el("span", { "class": "discreto", texto: "·" }));
      linha.appendChild(el("strong", { texto: m.custo.total + " " + moeda() }));
      linha.appendChild(el("span", { "class": "discreto", texto: "em ferramentas" }));
    }
    pe.appendChild(linha);

    var acoes = el("div", { "class": "acoes-bancada" });
    acoes.appendChild(el("button", {
      "class": "botao-forte", type: "button",
      texto: pedacos.length > 1 ? "Copiar prompt (tudo)" : "Copiar prompt",
      title: pedacos.length > 1
        ? "Leva " + plural(pedacos.length, "pedaço") + ": " + pedacos.map(function (p) { return p.nome; }).join(", ")
        : "Leva o prompt para a área de transferência",
      ao: { click: function () { copiar(m); } }
    }));
    pe.appendChild(acoes);
    return pe;
  }

  /* Tags com espaço por preencher — hoje só `year XXXX`.

     A receita do pixel art aponta para essa tag, e o prompt saía com o
     XXXX literal: não havia campo nenhum onde escrever o ano, em tela
     alguma. Mandar `year XXXX` ao NovelAI gasta Anlas num pedido sem
     sentido. Agora o campo existe aqui, ao lado das tags, e enquanto
     sobrar XXXX o motor levanta alerta vermelho. */
  function camposPorPreencher() {
    var caixaCampos = el("div", {});
    var comCampo = todosOsItens().filter(function (it) { return it.preencher; });
    if (!comCampo.length) return caixaCampos;

    caixaCampos.appendChild(el("h4", { texto: "Falta preencher" }));
    comCampo.forEach(function (it) {
      var atual = it.valor ? String(it.valor).replace(/^year\s*/i, "") : "";
      var campo = el("input", {
        type: "text",
        value: atual,
        placeholder: /^year/i.test(it.tag) ? "o ano, por exemplo 1998" : "escreva o valor",
        "aria-label": "Valor de " + it.tag
      });
      campo.addEventListener("input", function () {
        var v = campo.value.trim();
        it.valor = v ? String(it.tag).replace(/XXXX/g, v) : "";
      });
      campo.addEventListener("change", function () { salvarRascunho(); });
      caixaCampos.appendChild(el("div", { "class": "peso-linha" }, [
        el("span", { "class": "mono", texto: it.valor || it.tag }),
        campo
      ]));
    });
    caixaCampos.appendChild(el("p", {
      "class": "discreto",
      texto: "A tag " + comCampo[0].tag + " tem um espaço para você preencher. Sem isso, o XXXX vai literal para a IA."
    }));
    return caixaCampos;
  }

  function chipsDe(lista, alvo) {
    var d = el("div", { "class": "escolhidas" });
    if (!lista.length) {
      d.appendChild(el("span", { "class": "discreto", texto: "nenhuma tag aqui ainda" }));
      return d;
    }
    lista.forEach(function (it) {
      var c = el("span", { "class": "escolhida" }, [doc.createTextNode(textoDoItem(it))]);
      c.appendChild(el("button", {
        "class": "x", type: "button", texto: "×", title: "tirar " + it.tag,
        ao: {
          click: function () {
            var l = listaDoItem(it.chave);
            if (l) l.splice(l.indexOf(it), 1);
            salvarRascunho();
          }
        }
      }));
      d.appendChild(c);
    });
    return d;
  }

  function linhaDePeso(it, cap) {
    var mostra = el("span", { "class": "peso-mostra", texto: global.Motor.descrevePeso(it.peso) });

    function mudar(delta) {
      var p = it.peso;
      if (p.tipo === "numerico") { p.valor = Math.round((p.valor + delta * 0.5) * 100) / 100; }
      else if (p.tipo === "chaves") {
        p.valor += delta;
        if (p.valor <= 0) { it.peso = { tipo: "nenhum", valor: 0 }; }
      } else if (p.tipo === "colchetes") {
        p.valor -= delta;
        if (p.valor <= 0) { it.peso = { tipo: "nenhum", valor: 0 }; }
      } else {
        it.peso = delta > 0 ? { tipo: "chaves", valor: 1 } : { tipo: "colchetes", valor: 1 };
      }
      salvarRascunho();
    }

    var linha = el("div", { "class": "peso-linha" }, [
      el("span", { "class": "mono", texto: textoDoItem(it) }),
      el("button", { "class": "peso-btn", type: "button", texto: "−", title: "enfraquecer", ao: { click: function () { mudar(-1); } } }),
      el("button", { "class": "peso-btn", type: "button", texto: "+", title: "reforçar", ao: { click: function () { mudar(1); } } }),
      mostra
    ]);

    var num = el("button", {
      "class": "botao-p", type: "button",
      texto: it.peso.tipo === "numerico" ? "usar chaves" : "usar número",
      title: cap.pesoNumerico ? "" : "Precisa do modelo V4 ou mais novo"
    });
    if (!cap.pesoNumerico) num.setAttribute("disabled", "disabled");
    num.addEventListener("click", function () {
      it.peso = it.peso.tipo === "numerico" ? { tipo: "nenhum", valor: 0 } : { tipo: "numerico", valor: 1.5 };
      salvarRascunho();
    });
    linha.appendChild(num);
    return linha;
  }

  /* A grade 5×5 de posição do personagem, clicável.

     Ela era ensinada na tela — o desenho esquemático está na Sala de
     Recursos, com o texto dizendo que dá para escolher a posição — e não
     existia lugar nenhum onde escolher. Ele lia que dava, procurava, e não
     achava. Agora a escolha existe aqui, e viaja no pedido junto com o
     aviso de que ela desliga a escolha automática da IA.

     Os valores vão de 0 a 1 nos dois eixos, no centro de cada casa: a
     primeira coluna é 0,1; a última, 0,9. */
  function gradeDePosicao(p) {
    var mp = R().multi_personagem || {};
    var d = el("div", { "class": "caixa" }, [el("h4", { texto: "Onde este personagem fica no quadro" })]);

    d.appendChild(el("p", {
      "class": "discreto",
      texto: mp.regra_posicao || "Dá para indicar a posição aproximada numa grade de 5 por 5. Escolher uma casa desliga a escolha automática da IA."
    }));

    var grade = el("div", { "class": "grade-pos" });
    for (var l = 0; l < 5; l++) {
      for (var col = 0; col < 5; col++) {
        (function (linha, coluna) {
          var x = (coluna * 2 + 1) / 10;
          var y = (linha * 2 + 1) / 10;
          var marcada = p.posicao &&
            Math.abs(p.posicao.x - x) < 0.01 && Math.abs(p.posicao.y - y) < 0.01;
          var casa = el("button", {
            type: "button",
            "class": "casa" + (marcada ? " marcada" : ""),
            "aria-pressed": marcada ? "true" : "false",
            title: "coluna " + (coluna + 1) + ", linha " + (linha + 1),
            "aria-label": "Pôr este personagem na coluna " + (coluna + 1) + ", linha " + (linha + 1)
          });
          casa.addEventListener("click", function () {
            p.posicao = marcada ? null : { x: x, y: y };
            salvarRascunho();
          });
          grade.appendChild(casa);
        })(l, col);
      }
    }
    d.appendChild(grade);

    d.appendChild(el("div", { "class": "peso-linha" }, [
      el("span", {
        "class": "discreto",
        texto: p.posicao
          ? "Escolhido: " + Math.round(p.posicao.x * 100) + "% da largura, " +
            Math.round(p.posicao.y * 100) + "% da altura. Clique na mesma casa para soltar."
          : "Nenhuma casa escolhida — a IA decide onde pôr este personagem."
      }),
      p.posicao ? el("button", {
        "class": "botao-p", type: "button", texto: "Deixar a IA decidir",
        ao: { click: function () { p.posicao = null; salvarRascunho(); } }
      }) : null
    ]));
    return d;
  }

  function caixaDePersonagem(p, i) {
    var c = el("div", { "class": "caixa" }, [el("h4", { texto: "Personagem " + (i + 1) })]);

    var nome = el("input", { type: "text", value: p.nome, placeholder: "nome, só para você se achar" });
    nome.addEventListener("change", function () { p.nome = nome.value; salvarRascunho(); });
    c.appendChild(nome);

    c.appendChild(chipsDe(p.itens, "p" + i));

    var livre = el("textarea", { rows: "2", placeholder: "girl ou boy, sem número, mais o que descreve este personagem" });
    livre.value = p.livre;
    livre.addEventListener("change", function () { p.livre = livre.value; salvarRascunho(); });
    c.appendChild(livre);

    c.appendChild(el("p", { "class": "discreto", texto: "A contagem (1girl, 2girls) vai SÓ no prompt base. Aqui dentro vai girl ou boy, sem número." }));

    c.appendChild(gradeDePosicao(p));

    var jaEhOAlvo = P.alvo === "p" + i;
    var acoes = el("div", { "class": "aperto" }, [
      el("button", {
        "class": jaEhOAlvo ? "botao-p botao-forte" : "botao-p",
        type: "button",
        texto: jaEhOAlvo ? "As tags do Armazém já vêm para cá" : "Mandar as tags do Armazém para cá",
        ao: {
          click: function () {
            P.alvo = "p" + i;
            render();
            irPara("armazem");
            torrada("Pronto. Vá clicando as tags do Armazém (cabelo, olhos, roupa…) — todas caem na caixa de " + (p.nome || ("personagem " + (i + 1))) + ".");
          }
        }
      }),
      el("button", {
        "class": "botao-p botao-perigo", type: "button", texto: "Fechar esta caixa",
        ao: {
          click: function () {
            P.personagens.splice(i, 1);
            /* ⚠ O ALVO É POR POSIÇÃO ("p2"), NÃO POR IDENTIDADE.

               Fechar uma caixa do meio empurra as de trás um lugar para
               trás no array, mas P.alvo continuava com o número antigo.
               Se o alvo era "p2" e a caixa fechada foi a "p0", quem sobra
               na posição 2 agora é outro personagem (ou nenhum) — e a nota
               "onde a tag cai" ia continuar dizendo "personagem 3", que já
               não existe mais, sem nenhum aviso. As tags do autor cairiam
               no personagem errado (ou na base) em silêncio — a mesma
               classe de defeito da nota que ficava desatualizada. */
            var alvoEraP = /^p(\d+)$/.exec(P.alvo);
            if (alvoEraP) {
              var idxAlvo = parseInt(alvoEraP[1], 10);
              if (idxAlvo === i) {
                P.alvo = "base";
                torrada("Caixa fechada. Como era para ela que as tags estavam indo, agora elas voltam para o prompt base.");
              } else if (idxAlvo > i) {
                P.alvo = "p" + (idxAlvo - 1);
              }
            }
            salvarRascunho();
          }
        }
      })
    ]);
    c.appendChild(acoes);
    return c;
  }

  /* --- copiar, colar, salvar, gerar ------------------------------- */

  /* ⚠ O BOTÃO COPIAR ABANDONAVA AS CAIXAS DE PERSONAGEM, e mentia sobre isso.

     `copiar` levava `m.promptCompleto` e nada mais — só a caixa principal.
     Medido na página: base `1boy, close-up, short hair, acrylic paint (medium)`
     com `aqua eyes, very short hair, jacket` na caixa do personagem 1; o que
     foi para a área de transferência tinha as quatro tags da base e nenhuma
     das três do personagem, e a tela dizia "Prompt copiado." Pior: com a base
     VAZIA e três tags na caixa do personagem, a resposta era "Não há prompt
     para copiar ainda" enquanto a Bancada mostrava as três ali, à vista.

     E o Copiar prompt é o caminho de trabalho inteiro do dia sem token.

     Hoje o botão copia TUDO — a caixa principal, o conteúdo indesejado e cada
     caixa de personagem, cada bloco com a etiqueta dizendo onde colar no
     site. A mensagem diz peça por peça o que foi copiado. Para quem quer só a
     linha de cima, existe um segundo botão que diz exatamente isso no rótulo.

     A função `pedacos` é a fonte única das duas coisas: do texto e da
     mensagem. Assim a mensagem não tem como descrever um texto diferente do
     que foi copiado. */
  function pedacosParaCopiar(m) {
    if (!m) return [];
    var fora = [];
    if (m.promptCompleto) {
      fora.push({
        rotulo: "Prompt base — cole na caixa principal do site",
        nome: "a caixa principal",
        texto: m.promptCompleto
      });
    }
    if (m.indesejado) {
      fora.push({
        rotulo: "Conteúdo indesejado — cole na caixa Undesired Content",
        nome: "o conteúdo indesejado (o que evitar)",
        texto: m.indesejado
      });
    }
    (m.personagens || []).forEach(function (p, i) {
      var quem = "Personagem " + (i + 1) + (p.nome ? " — " + p.nome : "");
      if (p.prompt) {
        fora.push({
          rotulo: quem + " — cole numa caixa Add Character do site",
          nome: "a caixa do personagem " + (i + 1),
          texto: p.prompt
        });
      }
      if (p.indesejado) {
        fora.push({
          rotulo: quem + ", conteúdo indesejado",
          nome: "o indesejado do personagem " + (i + 1),
          texto: p.indesejado
        });
      }
    });
    return fora;
  }

  function textoParaCopiar(m) {
    var ps = pedacosParaCopiar(m);
    if (!ps.length) return "";
    if (ps.length === 1) return ps[0].texto;   // uma peça só não precisa de etiqueta
    return ps.map(function (p) { return "[" + p.rotulo + "]\n" + p.texto; }).join("\n\n");
  }

  // Põe o texto na área de transferência e avisa o autor com a frase exata.
  function paraAreaDeTransferencia(txt, recado) {
    if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(
        function () { torrada(recado); },
        function () { copiarNaMarra(txt, recado); }
      );
    } else { copiarNaMarra(txt, recado); }
  }

  function copiar(m) {
    var ps = pedacosParaCopiar(m);
    if (!ps.length) {
      torrada("Não há nada para copiar ainda: nem a caixa principal, nem caixa de personagem, nem conteúdo indesejado.");
      return;
    }
    var recado;
    if (ps.length === 1) {
      recado = "Copiei " + ps[0].nome + ". Cole no site do NovelAI.";
    } else {
      recado = "Copiei o prompt inteiro, em " + plural(ps.length, "pedaço") + ": " +
        ps.map(function (p) { return p.nome; }).join(", ") +
        ". Cada pedaço vem com uma etiqueta dizendo onde colar no site.";
    }
    paraAreaDeTransferencia(textoParaCopiar(m), recado);
  }

  // Só a linha de cima, para quem quer colar sem as etiquetas.
  function copiarSoABase(m) {
    var txt = m ? m.promptCompleto : "";
    if (!txt) { torrada("A caixa principal está vazia. O que você montou está nas caixas de personagem — use o Copiar prompt."); return; }
    var quantasFora = pedacosParaCopiar(m).length - 1;
    paraAreaDeTransferencia(txt, quantasFora > 0
      ? "Copiei SÓ a caixa principal. Ficou de fora: " +
        pedacosParaCopiar(m).slice(1).map(function (p) { return p.nome; }).join(", ") + "."
      : "Copiei a caixa principal, que é tudo o que há no seu prompt.");
  }

  function copiarNaMarra(txt, recado) {
    var ta = el("textarea", {});
    ta.value = txt;
    doc.body.appendChild(ta);
    ta.select();
    try { doc.execCommand("copy"); torrada(recado || "Copiado."); }
    catch (e) { torrada("Não consegui copiar sozinha. Selecione o texto do prompt e copie com Ctrl+C."); }
    ta.remove();
  }

  function mostrarColagem(m) {
    var alvo = $("#saida-bancada");
    if (!alvo || !m) return;
    limpar(alvo);
    alvo.appendChild(el("h3", { texto: "Onde colar cada pedaço" }));
    m.instrucoes.forEach(function (p) {
      alvo.appendChild(el("p", {}, [el("strong", { texto: p.onde + ": " })]));
      alvo.appendChild(el("div", { "class": "saida", texto: p.oque }));
    });
    var aviso = (R().avisos_permanentes || []).filter(function (a) { return a.id === "semente"; })[0];
    alvo.appendChild(nota("amarela", "O NovelAI não guarda nada",
      "Recarregar a aba apaga a sessão. Baixe cada imagem pelo botão de salvar do site — o botão direito do mouse não guarda o prompt nem a semente dentro do arquivo."));
    if (aviso) alvo.appendChild(nota("", "Para comparar tentativas", aviso.texto));
    alvo.appendChild(el("button", {
      "class": "botao-p", type: "button", texto: "Copiar tudo, com as etiquetas",
      ao: { click: function () { copiar(m); } }
    }));
  }

  function salvarPrompt() {
    var n = global.prompt("Com que nome eu guardo este prompt?", P.nome || "prompt");
    if (!n) return;
    global.Memoria.salvar("prompts", n, paraGuardar()).then(function (r) {
      torrada(r.ok ? "Prompt guardado " + (r.onde === "disco" ? "no disco." : "na memória do navegador.") : (r.erro || "Não consegui guardar."));
    });
  }

  /* =================================================================
     O PEDIDO DE GERAÇÃO — reescrito, e esta era a falha mais cara.

     O pedido antigo mandava a CONTAGEM das referências
     (`character_reference: 2`) e mais nada. A contagem servia só para
     cobrar: a ponte monta a referência a partir de uma LISTA com os bytes
     de cada imagem (`referencias`, com `dados_base64`), e essa lista nunca
     chegava. Provado em ensaio: custo cobrado 17 Anlas, e no corpo que
     iria ao NovelAI, "chaves de referência: []". Ele confirmava um gasto
     por um recurso que não saía da máquina dele.

     O mesmo buraco atingia `imagem_base_base64`: a imagem da Mesa de
     Retoque nunca chegava, então Image2Image, Inpaint e as ferramentas de
     direção não funcionavam pela ponte nem com token.

     Hoje o pedido leva os bytes, e leva também o que ele escolheu na tela
     e antes era ignorado: o plano de assinatura, a semente, as Etiquetas
     de Qualidade e o preset de Conteúdo Indesejado.

     E há uma recusa, de propósito: se houver referência anexada SEM os
     bytes carregados, a geração aqui dentro é recusada com a frase que
     manda ele pelo caminho que funciona — Copiar prompt e anexar no site.
     Melhor recusar do que gerar sem a referência e cobrar por ela.
     ================================================================= */

  function montarPedido(m) {
    var cap = global.Motor.podem(P.modelo);

    function bytes(r) { return r.dados || ""; }

    var precisas = P.referencias.filter(function (r) {
      return (r.tipo === "character" || r.tipo === "style") && cap.preciseReference;
    });
    var vibes = P.referencias.filter(function (r) { return r.tipo === "vibe"; });

    /* A AÇÃO DO PEDIDO, e este campo tinha só dois valores quando precisa
       de quatro. Duas das sete respostas da Mesa de Retoque pedem repintura por
       máscara, e o pedido saía como `img2img` — Image2Image da imagem
       inteira. Com token, o resultado é a cena toda mudada em vez da jaqueta,
       cobrada em Anlas. A ponte estava pronta dos dois lados (ela recusa
       inpaint sem máscara e usa a máscara quando ela vem); o pedido é que
       nunca chegava lá.

       ⚠ E MAIS TRÊS RESPOSTAS — "A expressão do rosto", "O fundo" e "Uma
       cor" — usam Director Tools (ferramentas de direção do NovelAI), e até
       24/08/2026 este campo nunca virava `"director"`: saía sempre como
       `img2img` comum, ignorando a ferramenta escolhida sem avisar nada.
       Achado da auditoria do mesmo dia. */
    var cartaoAtivo = cartaoDeRetoque(P.retoque.intencao);
    // "remove_bg" é o id do dado (acervo_regras.js); a ponte espera "bg-removal".
    var IDS_DE_DIRECAO_NA_PONTE = { remove_bg: "bg-removal" };
    var acaoDoPedido = "gerar";
    if (P.usarRetoque && temImagemDeRetoque()) {
      if (cartaoAtivo && cartaoAtivo.director) {
        acaoDoPedido = "director";
      } else {
        acaoDoPedido = (retoqueExigeMascara() && temMascara()) ? "inpaint" : "img2img";
      }
    }

    var pedido = {
      acao: acaoDoPedido,
      modelo: global.Motor.paraPonte(P.modelo),
      prompt: m.promptCompleto,
      conteudo_indesejado: m.indesejado,
      personagens: m.personagens.map(function (p) {
        return { prompt: p.prompt, conteudo_indesejado: p.indesejado, posicao: p.posicao || null };
      }),
      quantidade: 1,
      semente: P.semente,
      assinatura: P.assinatura,

      /* As Etiquetas de Qualidade vão nos dois nomes — o do site
         (`qualityToggle`) e o em português —, porque os dois são booleanos e
         querem dizer a mesma coisa.

         O preset de Conteúdo Indesejado, NÃO. Do lado do NovelAI `ucPreset` é
         um NÚMERO, e a tela mandava a palavra em português ("leve") dentro
         dele. Hoje não quebra porque a ponte só lê `preset_indesejado`; no dia
         em que ela repassar o campo cru, iria texto onde se espera número, e o
         resultado seria uma imagem filtrada por uma lista que ele não pediu.
         Então só viaja o vocabulário combinado no PROTOCOLO. */
      qualityToggle: !!P.qualidadeAuto,
      etiquetas_de_qualidade: !!P.qualidadeAuto,
      preset_indesejado: P.indesejado.preset,

      // as imagens, com os bytes de verdade
      referencias: precisas.map(function (r) {
        return { dados_base64: bytes(r), forca: r.forca, fidelidade: r.fidelidade, tipo: r.tipo, nome: r.nome };
      }),
      vibes: vibes.map(function (r) {
        return { dados_base64: bytes(r), forca: r.forca, info_extraida: r.fidelidade, nome: r.nome };
      }),

      imagem_base_base64: null,
      mascara_base64: null
    };

    if (P.usarRetoque && temImagemDeRetoque()) {
      pedido.imagem_base_base64 = P.retoque.dados;
      pedido.forca = P.retoque.forca;
      pedido.ruido = P.retoque.ruido;
      // a máscara em preto e branco, que é o formato que o NovelAI espera
      if (acaoDoPedido === "inpaint") pedido.mascara_base64 = P.retoque.mascaraPB || null;
      if (acaoDoPedido === "director") {
        var idDaFerramenta = cartaoAtivo.director;
        pedido.ferramenta_de_direcao = IDS_DE_DIRECAO_NA_PONTE[idDaFerramenta] || idDaFerramenta;
        if (idDaFerramenta === "emotion") {
          // a ponte só lê estes dois campos quando a ferramenta é "emotion"
          pedido.prompt = P.retoque.emocao || "";
          pedido.forca_da_emocao = P.retoque.forcaDaEmocao || 0;
        }
      }
    }

    // a posição só vale se alguém escolheu uma casa na grade 5×5
    if (pedido.personagens.some(function (p) { return p.posicao; })) {
      pedido.use_coords = true;
      pedido.usar_posicao = true;
    }

    return pedido;
  }

  // Referência anexada cuja imagem não está carregada: a geração para aqui.
  function referenciasSemImagem() {
    var cap = global.Motor.podem(P.modelo);
    return P.referencias.filter(function (r) {
      if ((r.tipo === "character" || r.tipo === "style") && !cap.preciseReference) return false;
      return !r.dados;
    });
  }

  function gerarAqui(m, est) {
    // o nó é procurado de novo a cada escrita: ver `saidaViva`
    var S = saidaViva("saida-bancada");
    if (!S.existe() || !m) return;
    S.limpar();

    /* ⚠ ELE PEDIU REPINTURA E NÃO PINTOU NADA: a geração para aqui.

       Sem esta trava o pedido virava Image2Image da imagem inteira, em
       silêncio — mudava a cena toda em vez da peça de roupa, e cobrava por
       isso. Recusar é mais barato do que explicar depois. */
    if (P.usarRetoque && temImagemDeRetoque() && retoqueExigeMascara() && !temMascara()) {
      var qual = cartaoDeRetoque(P.retoque.intencao);
      S.por(nota("vermelha", "Falta pintar a parte a refazer",
        "Você escolheu “" + (qual ? qual.titulo : "repintura") + "”, e isso é repintura por máscara: a IA só " +
        "refaz o pedaço que você marcar. Como não há nada marcado, eu não vou gerar. Gerar assim refaria a " +
        "imagem inteira e cobraria Anlas por uma coisa que você não pediu."));
      S.por(botaoIrPara("Ir à Mesa de Retoque e pintar a máscara", "retoque"));
      return;
    }

    var faltando = referenciasSemImagem();
    if (faltando.length) {
      S.por(nota("vermelha", "Não posso gerar aqui dentro com esta referência",
        "A imagem de " + faltando.length + " referência(s) não está carregada nesta sessão, e sem os dados dela a imagem " +
        "não é enviada ao NovelAI. Eu não vou gerar e cobrar por uma referência que não sairia daqui. " +
        "Dois caminhos: solte o arquivo de novo no Ateliê, ou use o botão Copiar prompt e anexe a imagem no site."));
      S.por(botaoIrPara("Ir ao Ateliê soltar a imagem de novo", "atelie"));
      return;
    }

    S.por(el("p", { "class": "carregando", texto: "Falando com " + GLOSSARIO.ponte() + "…" }));

    var pedido = montarPedido(m);

    global.Ponte.ensaiar(pedido).then(function (r) {
      S.limpar();
      if (!r || !r.ok) {
        S.por(nota("vermelha", "Não deu", (r && r.erro) || "A ponte não respondeu."));
        return;
      }
      var anlas = (r.custo && r.custo.anlas) || 0;
      S.por(nota("", "Ensaio — nada foi enviado e nada foi gasto",
        (r.motivo || "") + " Esta geração custaria " + anlas + " Anlas."));
      if (r.custo && r.custo.itens) {
        S.por(el("ul", { "class": "limpa" }, r.custo.itens.map(function (i) {
          return el("li", { texto: i.item + ": " + i.anlas + " Anlas" + (i.estimativa ? " (estimativa, não é número do manual)" : "") + " — " + i.motivo });
        })));
      }
      if (!est.geracaoAoVivo) {
        S.por(botaoIrPara("Ligar a geração ao vivo no Cofre", "cofre"));
        return;
      }
      S.por(el("p", { "class": "discreto" }, [
        doc.createTextNode("O que vai junto neste pedido: " +
          pedido.referencias.length + " referência(s) de personagem ou de traço, " +
          pedido.vibes.length + " imagem(ns) de Vibe Transfer, " +
          (pedido.imagem_base_base64 ? "e a imagem da Mesa de Retoque" : "e nenhuma imagem de partida") +
          ". Plano marcado: " + nomeDoPlano(P.assinatura) + ".")
      ]));

      S.por(el("button", {
        "class": "botao-forte", type: "button", texto: "Confirmar e gastar " + anlas + " " + moeda(),
        ao: {
          click: function () {
            S.limpar();
            S.por(el("p", { "class": "carregando", texto: "Gerando. Isso pode demorar até três minutos…" }));
            global.Ponte.gerar(pedido, anlas).then(function (g) {
              S.limpar();
              if (!g || !g.ok || !g.gerou) {
                S.por(nota("vermelha", "Não gerou", (g && (g.erro || g.motivo)) || "A ponte não respondeu."));
                return;
              }
              S.por(nota("verde", "Pronto", "A imagem foi salva na pasta meu_trabalho\\geradas, com o prompt e a semente ao lado."));
              (g.arquivos || []).forEach(function (a) {
                S.por(el("div", { "class": "item-album" }, [
                  el("img", { src: global.Ponte.endereco("geradas", a.imagem), alt: "imagem gerada" }),
                  el("div", { "class": "nome", texto: a.imagem }),
                  el("div", { "class": "quando", texto: "semente " + a.semente }),
                  el("button", {
                    "class": "botao-p", type: "button", texto: "Usar esta semente de novo",
                    ao: {
                      click: function () {
                        P.semente = a.semente;
                        torrada("A Bancada passou a usar a semente " + a.semente + ".");
                        salvarRascunho();
                      }
                    }
                  })
                ]));
              });
            });
          }
        }
      }));
    });
  }

  /* =================================================================
     15.5 Compositor de Cena — visualizar múltiplos personagens
     ================================================================= */

  function moduloCompositor(sec) {
    if (!global.Compositor) return;
    global.Compositor.montar(sec, P, salvarRascunho);
  }

  /* Atalho para o alinhador abrir o Ateliê diretamente. Usado pelo Compositor. */
  global.abrirAtelie = function () {
    irPara("atelie");
  };

  /* =================================================================
     16. Navegação, lâmpada e arranque
     ================================================================= */

  var MODULOS = [
    { id: "armazem", nome: "Armazém de tags", sub: "todas as tags, por gaveta", render: moduloArmazem },
    { id: "compositor", nome: "Compositor de Cena", sub: "múltiplos personagens lado a lado", render: moduloCompositor },
    { id: "atelie", nome: "Ateliê de personagem", sub: "criar do zero ou com referências", render: moduloAtelie },
    { id: "retoque", nome: "Mesa de retoque", sub: "mudar uma imagem que você tem", render: moduloRetoque },
    { id: "regua", nome: "Régua de ordem", sub: "a ordem certa das tags", render: moduloRegua },
    { id: "recursos", nome: "Sala de recursos", sub: "tudo que o NovelAI faz", render: moduloRecursos },
    { id: "album", nome: "Álbum", sub: "o seu trabalho guardado", render: moduloAlbum },
    /* O rótulo do menu era "token e teto de Anlas" — duas palavras técnicas
       cruas, e é a PRIMEIRA vez que ele lê "Anlas" na tela. */
    { id: "cofre", nome: "Cofre e gasto", sub: "a sua senha do NovelAI e o teto de gasto", render: moduloCofre }
  ];

  var moduloAtivo = "armazem";
  var arrancou = false;

  /* ⚠ O RÓTULO CONTAVA OITO E A LISTA TINHA NOVE.

     Escrito "OS OITO MÓDULOS", com nove botões embaixo — e o nono, a
     Bancada, nem destino era: clicar nele só rolava a página até a coluna
     da direita, que já estava à vista. Número no rótulo é promessa, e essa
     estava quebrada desde que o Compositor entrou.

     Hoje o rótulo não conta nada (número que ninguém precisa é número que
     envelhece sozinho), e a Bancada saiu da lista de módulos para virar um
     atalho declarado como atalho — útil na tela estreita, onde ela desce
     para o fim da página. */
  function montarMenu() {
    var menu = $("#menu");
    if (!menu) return;
    limpar(menu);
    menu.appendChild(el("div", { "class": "grupo-titulo", texto: "Módulos" }));
    MODULOS.forEach(function (m) {
      var b = el("button", {
        type: "button", "data-modulo": m.id,
        "aria-current": moduloAtivo === m.id ? "true" : "false"
      }, [
        doc.createTextNode(m.nome),
        el("small", { texto: m.sub })
      ]);
      b.addEventListener("click", function () { irPara(m.id); });
      menu.appendChild(b);
    });

    menu.appendChild(el("div", { "class": "grupo-titulo", texto: "Atalho" }));
    menu.appendChild(el("button", {
      type: "button", "data-modulo": "bancada",
      ao: { click: function () { irPara("bancada"); } }
    }, [
      doc.createTextNode("Ir à Bancada de prompt"),
      el("small", { texto: "a coluna da direita, sempre visível" })
    ]));
  }

  function irPara(id) {
    if (id === "bancada") {
      var b = $("#bancada");
      if (b) {
        b.scrollIntoView({ block: "start" });
        b.focus({ preventScroll: true });
      }
      return;
    }
    moduloAtivo = id;
    montarMenu();
    $$("#palco > section").forEach(function (s) {
      s.classList.toggle("ativa", s.id === "mod-" + id);
    });
    renderModulo();
    /* O foco vai junto com a tela. Sem isto, trocar de módulo mudava tudo
       o que está à vista e deixava o foco parado no botão do menu: quem
       usa leitor de tela não era avisado de nada, e quem usa teclado
       recomeçava a percorrer a página do menu. `scrollIntoView` sem
       `behavior: smooth` porque a regra desta oficina é que nada desliza
       sozinho. */
    // no arranque a Oficina abre no Armazém sozinha: mexer no foco aí seria
    // arrancar o cursor de onde o navegador o deixou, sem ninguém ter pedido
    if (arrancou) {
      var p = $("#palco");
      if (p) {
        p.scrollIntoView({ block: "start" });
        p.focus({ preventScroll: true });
      }
    }
  }

  function renderModulo() {
    var m = MODULOS.filter(function (x) { return x.id === moduloAtivo; })[0];
    if (!m || !m.render) return;
    var sec = $("#mod-" + m.id);
    if (sec) m.render(sec);
  }

  function render() {
    renderBancada();
    /* ⚠ A NOTA "ONDE A TAG CAI" FICAVA MENTINDO.

       O Armazém e a Bancada ficam lado a lado (a Bancada é "sempre visível,
       à direita"). Trocar o alvo pela Bancada — abrir uma caixa de
       personagem, ou clicar "Mandar as tags para cá" — muda P.alvo, mas só
       chamava renderBancada(). A nota do Armazém (#aviso-alvo), que diz para
       onde a próxima tag clicada vai, ficava com o texto de ANTES da troca.
       O autor abria a caixa do personagem, via a nota ainda dizendo "prompt
       base", e não confiava que clicar a tag ia para o lugar certo — a causa
       provável da queixa de não saber como dar características a UM
       personagem específico. Ela precisa atualizar toda vez, não só quando
       o Armazém está com o painel ativo (a Bancada fica visível mesmo com
       outro módulo aberto). */
    atualizarAvisoDeAlvo();
    if (moduloAtivo === "armazem") atualizarBolinhas($("#mod-armazem"));
    else renderModulo();
  }

  function atualizarLampada() {
    var l = $("#lampada");
    if (!l || !global.Ponte) return;
    var f = global.Ponte.frase();
    l.setAttribute("data-modo", f.cor);
    l.setAttribute("title", f.longa);
    var txt = $("#lampada-texto");
    if (txt) txt.textContent = f.curta;
    var faixa = $("#faixa-modo");
    if (faixa) {
      limpar(faixa);

      /* A lâmpada do topo é a PRIMEIRA coisa que ele lê, e ela diz "sem
         token" antes de qualquer tela explicar o que é um token. A regra
         do projeto é termo técnico sempre seguido do que ele é, entre
         parênteses, sem exceção — então a explicação vem aqui embaixo,
         junto com o caminho que funciona hoje.

         Uma linha discreta, não um alarme: no modo amarelo não há nada
         errado. É o modo do dia um, e a oficina inteira funciona nele. */
      if (f.cor === "amarelo") {
        faixa.appendChild(el("p", { "class": "discreto glossario" }, [
          el("strong", { texto: "Sem token. " }),
          "O " + GLOSSARIO.token() + ". Você ainda não guardou o seu, e não precisa: " +
          "monte o prompt aqui, clique em Copiar prompt e cole no site do NovelAI. " +
          "O seu trabalho é salvo no disco a cada mudança."
        ]));
      }

      if (f.cor === "vermelho") {
        /* Duas situações diferentes, dois conselhos diferentes.

           O conselho único era circular e mandava ele repetir o que tinha
           acabado de falhar: sem Python, o .bat abre a página e a página
           dizia "abra pelo arquivo ABRIR A OFICINA" — que foi justamente o
           que o trouxe até ali. */
        var titulo = f.caso === "caiu"
          ? "A oficina foi desligada"
          : "O seu trabalho está só na memória do navegador";
        var n = nota("amarela", titulo, f.longa);
        n.appendChild(el("button", {
          "class": "botao-p", type: "button", texto: "Baixar meu trabalho",
          ao: { click: function () { global.Memoria.baixarTudo(); } }
        }));
        faixa.appendChild(n);
      }
    }
  }

  /* As preferências — tema, modo de ordem, plano de assinatura.

     Elas moravam só na memória do navegador, que é presa ao endereço da
     página. A porta muda sozinha (a busca vai de 8760 a 8770), e com ela
     ia embora tudo isso. Hoje vão para `meu_trabalho\config.json`, pelo
     endereço `/api/config` da ponte, e não dependem mais da porta. Quem
     grava e lê é o `memoria.js` — aqui só se diz o que guardar. */
  var temaAtual = "";

  function guardarPreferencias() {
    if (!global.Memoria) return;
    global.Memoria.gravarConfig({
      versao_formato: "1.0.0",
      tema: temaAtual,
      ordem: P.ordem,
      ordenarAuto: P.ordenarAuto,
      qualidadeAuto: P.qualidadeAuto,
      assinatura: P.assinatura
    });
  }

  function aplicarPreferencias(cfg) {
    if (!cfg) return;
    if (typeof cfg.tema === "string") {
      temaAtual = cfg.tema;
      if (temaAtual) doc.documentElement.setAttribute("data-theme", temaAtual);
      else doc.documentElement.removeAttribute("data-theme");
    }
    if (typeof cfg.ordem === "string") P.ordem = cfg.ordem;
    if (typeof cfg.ordenarAuto === "boolean") P.ordenarAuto = cfg.ordenarAuto;
    if (typeof cfg.qualidadeAuto === "boolean") P.qualidadeAuto = cfg.qualidadeAuto;
    if (typeof cfg.assinatura === "string") P.assinatura = cfg.assinatura;
  }

  function tema() {
    var b = $("#btn-tema");
    if (!b) return;
    b.addEventListener("click", function () {
      var atual = doc.documentElement.getAttribute("data-theme");
      var novo = atual === "dark" ? "light" : (atual === "light" ? "" : "dark");
      if (novo) doc.documentElement.setAttribute("data-theme", novo);
      else doc.documentElement.removeAttribute("data-theme");
      temaAtual = novo;
      try { global.localStorage.setItem("oficina:tema", novo); } catch (e) { /* sem guarda local */ }
      guardarPreferencias();
      torrada(novo === "dark" ? "Tema escuro." : (novo === "light" ? "Tema claro." : "Tema do sistema."));
    });
    try {
      var g = global.localStorage.getItem("oficina:tema");
      if (g) { temaAtual = g; doc.documentElement.setAttribute("data-theme", g); }
    } catch (e) { /* sem guarda local */ }
  }

  /* ⚠ A RECUPERAÇÃO DO DISCO — quem decide é ele, não a oficina.

     Antes isto acontecia sozinho e em silêncio, e criava dois problemas
     opostos, os dois medidos:

     1. PERDA. A oficina abria numa porta nova, a tela nascia vazia, o
        autor clicava em duas tags nos primeiros segundos, e a recuperação
        chegava atrasada e desistia (a condição era "só se a tela estiver
        vazia"). Meio segundo depois, o gravador automático escrevia as
        duas tags por cima das catorze que estavam no disco. Sem aviso e
        sem desfazer.

     2. CONFUSÃO. O caminho oposto: a Oficina abria já montada, com um
        prompt que ele não fez — o rascunho de teste de outra pessoa — e o
        recado "A OFICINA MUDOU 14 TAGS DE LUGAR". Um leigo lê isso como
        "a Oficina veio com alguma coisa pronta" e não sabe se pode apagar.

     A correção é a mesma para os dois: a oficina NÃO aplica nada sozinha.
     Ela lê o disco, guarda uma cópia datada do que achou, e PERGUNTA, numa
     faixa no alto da tela, com o resumo do que está lá dentro. Enquanto
     ele não responde, o disco não é escrito e a Bancada não aceita clique.
     Recuperar e começar do zero são as duas respostas, e as duas são
     seguras: a cópia datada fica no disco de qualquer jeito. */
  function recuperarDoDisco() {
    if (!global.Ponte || !global.Memoria || global.Memoria.seco()) {
      return Promise.resolve();
    }
    /* PERGUNTA SE O RASCUNHO ESTÁ LÁ ANTES DE PEDIR.

       Pedir direto dava um erro 400 vermelho no console exatamente na
       situação mais comum de todas: a PRIMEIRA vez que ele abre a oficina,
       quando ainda não existe rascunho nenhum. O código já tratava a recusa,
       então nada quebrava — mas a primeira coisa que a oficina fazia na vida
       era registrar um erro, e isso ensina a ignorar erro. A listagem da
       gaveta responde 200 mesmo quando ela está vazia. */
    return global.Ponte.listar("prompts").then(function (lista) {
      var itens = (lista && lista.ok && lista.itens) || [];
      var existe = itens.some(function (i) {
        return i && String(i.nome).toLowerCase() === "_rascunho_atual.json";
      });
      if (!existe) return null;
      return global.Ponte.ler("prompts", "_rascunho_atual");
    }, function () { return null; }).then(function (r) {
      if (!r || !r.ok || !r.conteudo) return;
      var d = r.conteudo;
      var quantas = (d.base || []).length;
      var quantosP = (d.personagens || []).length;
      if (!quantas && !quantosP) return;
      // a cópia datada vem ANTES de qualquer decisão: sobrescrever deixou
      // de ser perda definitiva
      global.Memoria.pontoDeVolta(d);
      return new Promise(function (resolve) { perguntarSeRecupera(d, quantas, quantosP, resolve); });
    }, function () { /* sem rascunho no disco: é o primeiro uso */ });
  }

  function perguntarSeRecupera(d, quantas, quantosP, pronto) {
    var palco = $("#palco");
    if (!palco) { pronto(); return; }

    // a leitura acabou; agora quem a oficina espera é ele, e sem prazo
    lendoDisco = false;
    esperandoResposta = true;

    var amostra = (d.base || []).slice(0, 8)
      .map(function (it) { return it.valor || it.tag; })
      .join(", ");
    if (quantas > 8) amostra += ", e mais " + (quantas - 8);

    var faixa = el("div", { "class": "nota amarela", id: "faixa-recuperacao" }, [
      el("span", { "class": "rot", texto: "Achei um trabalho guardado no seu disco" }),
      el("p", {
        texto: "Tem " + quantas + " tag(s)" + (quantosP ? " e " + quantosP + " caixa(s) de personagem" : "") +
          " esperando: " + (amostra || "—") + ". Já guardei uma cópia com a data no nome, " +
          "então nada se perde, escolha o que escolher."
      })
    ]);

    faixa.appendChild(el("button", {
      "class": "botao-forte", type: "button", texto: "Recuperar este trabalho",
      ao: {
        click: function () {
          /* Zerar antes de trazer o do disco. Sem isto, o que ele recupera é
             uma mistura das duas cópias: `restaurar` só troca o que o arquivo
             do disco traz escrito, e o que faltar lá continua sendo o que
             estava no navegador. Com as duas cópias iguais ninguém nota; com
             um rascunho antigo, sem alguma seção, ele recebe as falas de um
             trabalho e as tags de outro — e a tela não teria como avisar,
             porque para ela as duas coisas são igualmente válidas. */
          zerarProjeto();
          restaurar(d);
          torrada("Pronto: recuperei do disco o que você estava montando.");
          liberarTrava();
          pronto();
        }
      }
    }));
    faixa.appendChild(el("button", {
      "class": "botao-p", type: "button", texto: "Começar do zero",
      ao: {
        click: function () {
          /* Zerar de verdade, e só depois destravar. A ordem importa: a
             gravação automática está presa até `liberarTrava`, então a folha
             já sai em branco quando o disco volta a aceitar escrita — nunca
             o contrário. E o `salvarRascunho` logo abaixo é o que impede a
             mesma pergunta de voltar na próxima abertura: sem ele, a cópia
             de antes continuaria no disco e ele responderia isto de novo,
             toda vez. O trabalho não se perde — a cópia com a data no nome
             foi guardada antes de a pergunta aparecer. */
          zerarProjeto();
          torrada("Começando do zero. O trabalho de antes continua no disco, num arquivo com a data no nome.");
          liberarTrava();
          salvarRascunho();
          pronto();
        }
      }
    }));

    palco.insertBefore(faixa, palco.firstChild);
    doc.body.classList.add("recuperando");
  }

  function comecar() {
    indexar();

    if (!acervoCarregou()) {
      var p = $("#palco");
      if (p) {
        limpar(p);
        p.appendChild(nota("vermelha", "O acervo de tags não carregou",
          "A oficina não achou o arquivo dados\\acervo_tags.js. Confira se a pasta dados está ao lado do arquivo Oficina.html. Sem ela, não há tags para mostrar."));
      }
      return;
    }

    P.modelo = global.Motor ? global.Motor.modeloPadrao() : "v45_full";
    var pr = ((R().conteudo_indesejado || {}).presets || [])[1];
    if (pr) P.indesejado.preset = pr.id;

    tema();
    montarMenu();

    /* O disco fica travado desde o primeiro instante. Ele só é liberado
       quando a leitura terminar — e, se houver trabalho lá dentro, só
       depois de ele responder o que quer fazer. Enquanto isso a tela
       funciona e mostra tudo; o que não acontece é escrita por cima. */
    if (global.Memoria) {
      global.Memoria.travarDisco(true);
      restaurar(global.Memoria.lerRascunho());
      global.Memoria.aoGravar(function (onde) {
        var s = $("#estado-salvo");
        if (s) s.textContent = onde === "disco" ? "salvo no disco" : "salvo no navegador";
      });
    }

    if (global.Ponte) {
      global.Ponte.aoMudar(function () { atualizarLampada(); render(); });
      global.Ponte.verificar().then(function () {
        atualizarLampada();
        if (!global.Memoria || global.Memoria.seco()) { liberarTrava(); return null; }
        // as preferências e o álbum de exemplos vêm do disco, não da porta
        return global.Memoria.lerConfig()
          .then(function (cfg) { aplicarPreferencias(cfg); return global.Memoria.carregarExemplos(); })
          .then(function () { return recuperarDoDisco(); })
          .then(function () { liberarTrava(); });
      }).then(function () { render(); }, function () { liberarTrava(); });
    } else {
      liberarTrava();
    }

    /* Rede de segurança, e ela cobre UMA coisa só: a leitura do disco que
       nunca responde (o OneDrive às vezes demora para baixar um arquivo
       que está na nuvem). Oito segundos e a oficina libera, avisando.

       Ela NÃO cobre a pergunta na tela. Se a pergunta já está lá, o prazo
       não faz nada — o autor decide no tempo dele. Foi assim que eu perdi
       um rascunho no ensaio: o prazo apagou a pergunta e destravou o
       disco sozinho. */
    setTimeout(function () {
      if (lendoDisco && !esperandoResposta) {
        torrada("A leitura do disco demorou. Liberei a Bancada — se você tinha trabalho salvo, ele está em meu_trabalho\\prompts.");
        liberarTrava();
      }
    }, 8000);

    atualizarLampada();
    irPara("armazem");
    render();
    arrancou = true;   // daqui em diante, trocar de módulo leva o foco junto

    var baixar = $("#btn-baixar");
    if (baixar) baixar.addEventListener("click", function () { global.Memoria.baixarTudo(); });
  }

  global.Painel = {
    irPara: irPara,
    render: render,
    projeto: function () { return P; },
    // usados pela conferência da Sala de Recursos, e por quem for testar
    conferirReceitas: conferirReceitas,
    montarBaseDaReceita: montarBaseDaReceita,
    textoDaBase: textoDaBase,
    montado: montado,
    montarPedido: montarPedido,
    referenciasSemImagem: referenciasSemImagem
  };

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", comecar);
  else comecar();
})(window);
