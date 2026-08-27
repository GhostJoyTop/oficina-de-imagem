/* ==========================================================================
   OFICINA DE IMAGEM — o motor de prompt
   Dono: Construtor B.

   Monta o prompt inteiro: caixa base, até 6 caixas de personagem, caixa de
   Conteúdo Indesejado e o bloco Text: no fim absoluto. Aplica peso
   ({chaves}, [colchetes], peso numérico, peso negativo) e confere tudo
   contra as regras do motor.

   Lê `dados/acervo_tags.js` e `dados/acervo_regras.js` (donos: Construtor A).
   Nunca escreve neles.
   ========================================================================== */

(function (global) {
  "use strict";

  /* =================================================================
     1. Leitura do acervo
     ================================================================= */

  var _cache = null;

  function acervo() {
    if (_cache) return _cache;
    var a = global.OFICINA_ACERVO;
    if (!a || !a.tags) {
      _cache = { ok: false, tags: [], categorias: [], porId: {}, porTag: {} };
      return _cache;
    }
    var porId = {}, porTag = {};
    a.tags.forEach(function (t) {
      porId[t.id] = t;
      porTag[String(t.tag).toLowerCase()] = t;
    });
    _cache = {
      ok: true,
      versao: a.versao_formato,
      fonte: a.fonte,
      tags: a.tags,
      categorias: a.categorias || [],
      porId: porId,
      porTag: porTag
    };
    return _cache;
  }

  function tag(id) { return acervo().porId[id] || null; }

  /* =================================================================
     2. Os modelos e o que cada um suporta

     A matriz manda é a do Construtor A, em `OFICINA_REGRAS.modelos`. Lá
     cada modelo traz `id`, `nome`, `familia` ("v4.5" / "v4" / "v3") e um
     objeto `suporta` que declara recurso por recurso o que existe naquele
     modelo. A oficina LÊ essa declaração em vez de deduzir pela geração:
     se um dia um recurso descer de modelo, muda o acervo e mais nada.

     A lista abaixo só entra em cena se o acervo não carregar (página aberta
     sem os arquivos de dados). Ela repete os mesmos `id` do acervo — se os
     dois divergirem, a tag com `so_em` deixa de casar com o modelo.
     ================================================================= */

  var MODELOS_PADRAO = [
    { id: "v45_full",    nome: "V4.5 Full",    familia: "v4.5" },
    { id: "v45_curated", nome: "V4.5 Curated", familia: "v4.5" },
    { id: "v4_full",     nome: "V4 Full",      familia: "v4" },
    { id: "v4_curated",  nome: "V4 Curated",   familia: "v4" },
    { id: "anime_v3",    nome: "Anime V3",     familia: "v3" },
    { id: "furry_v3",    nome: "Furry V3",     familia: "v3" }
  ];

  // A ponte (Construtor C) usa outra grafia de id, em ponte/endpoints.json.
  // Aqui fica o de-para, num lugar só, para o resto da oficina nunca precisar
  // saber que existem duas grafias.
  var ID_NA_PONTE = {
    v45_full: "v4_5_full",
    v45_curated: "v4_5_curated",
    v4_full: "v4_full",
    v4_curated: "v4_curated",
    anime_v3: "anime_v3",
    furry_v3: "furry_v3"
  };

  function paraPonte(idModelo) { return ID_NA_PONTE[idModelo] || idModelo; }

  function geracaoDaFamilia(familia) {
    var f = String(familia || "").replace("v", "");
    var n = parseFloat(f);
    return isNaN(n) ? 4.5 : n;
  }

  function normalizaModelo(m) {
    var g = typeof m.geracao === "number" ? m.geracao : geracaoDaFamilia(m.familia);
    return {
      id: m.id,
      nome: m.nome || m.id,
      familia: m.familia || ("v" + g),
      geracao: g,
      padrao: !!m.padrao,
      dica: m.use_quando || m.dica || m.descricao || "",
      suporta: m.suporta || null,
      origem: m.origem || ""
    };
  }

  function modelos() {
    var r = global.OFICINA_REGRAS;
    var c = r && r.modelos;
    if (c && c.length && c[0] && c[0].id) return c.map(normalizaModelo);
    return MODELOS_PADRAO.map(normalizaModelo);
  }

  function modelo(id) {
    var lista = modelos(), i;
    for (i = 0; i < lista.length; i++) { if (lista[i].id === id) return lista[i]; }
    for (i = 0; i < lista.length; i++) { if (lista[i].padrao) return lista[i]; }
    return lista[0];
  }

  /* Este id de modelo existe mesmo na lista? */
  function existeModelo(id) {
    if (!id) return false;
    var lista = modelos(), i;
    for (i = 0; i < lista.length; i++) { if (lista[i].id === id) return true; }
    return false;
  }

  /* O modelo mais antigo da lista, que é sempre o mais restritivo. É para
     onde `podem` cai quando o id não existe. */
  function modeloMaisAntigo() {
    var lista = modelos();
    var menor = lista[0];
    lista.forEach(function (m) { if (m.geracao < menor.geracao) menor = m; });
    return menor;
  }

  /* O nome do modelo para escrever na tela. Id que não existe aparece como
     o que é — desconhecido —, e não com o nome do modelo padrão, que faria a
     tela mentir sobre o que está em uso. */
  function nomeDoModelo(id) {
    if (existeModelo(id)) return modelo(id).nome;
    return "“" + String(id) + "”, que não é um modelo desta oficina";
  }

  function modeloPadrao() {
    var lista = modelos(), i;
    for (i = 0; i < lista.length; i++) { if (lista[i].padrao) return lista[i].id; }
    return lista[0].id;
  }

  /* O que o modelo escolhido permite.

     Quando o acervo declara `suporta`, ela vale — é o dado, e o dado manda.
     Quando não declara (acervo velho ou ausente), a oficina deduz pela
     geração, que é o que o manual descreve na seção 16. */
  /* ⚠ ID DESCONHECIDO FALHA FECHADA, e isto foi um buraco medido.

     `modelo(id)` cai no modelo PADRÃO quando o id não existe — e o padrão é
     o V4.5 Full, o mais permissivo de todos. Então um arquivo de personagem
     com `"modelo": "v4"` (um id que não existe; o certo é `v4_full`) fazia a
     oficina liberar TODOS os recursos e apagar os alertas vermelhos de
     modelo: peso negativo passava sem uma palavra. E o autor é convidado a
     abrir esses arquivos no Bloco de Notas, então o caminho é real.

     Aqui, id desconhecido cai no modelo mais ANTIGO da lista. O alerta
     aparece a mais, nunca a menos — e `desconhecido` vai junto, para a
     conferência dizer o que houve em vez de deixar o autor adivinhar. */
  function podem(idModelo) {
    var faltando = !!idModelo && !existeModelo(idModelo);
    var m = faltando ? modeloMaisAntigo() : modelo(idModelo);
    var g = m.geracao;
    var s = m.suporta;
    function diz(chave, deducao) {
      if (s && typeof s[chave] === "boolean") return s[chave];
      return deducao;
    }
    return {
      geracao: g,
      pesoNumerico:     diz("peso_numerico", g >= 4),
      pesoNegativo:     diz("peso_negativo", g >= 4.5),
      multiPersonagem:  diz("multi_personagem", g >= 4),
      textoNaImagem:    diz("text_rendering", g >= 4),
      preciseReference: diz("precise_reference", g >= 4.5), // Character + Style Reference
      vibeTransfer:     diz("vibe_transfer", true),
      desconhecido:     faltando,
      idPedido:         idModelo || ""
    };
  }

  /* O Vibe Transfer é a única coluna da tabela de modelos que o manual não
     sustenta. O próprio FONTES.md do acervo admite: "O manual não afirma
     explicitamente que o Vibe Transfer funciona em todos os seis modelos (...)
     É uma inferência conservadora". A tabela dizia "sim" nos seis, creditando
     ao §16 — que fala de Multi-Character, Peso Numérico, Referência Precisa e
     Text Rendering, e não de Vibe Transfer.

     Então a oficina passa a tratar essa célula como NÃO VERIFICADA, a menos
     que o acervo declare o contrário. O acervo pode declarar em dois lugares
     (na raiz do modelo ou dentro de `suporta`), e os dois são aceitos: a
     forma exata é escolha do Construtor A, e a tela não pode quebrar
     esperando por ela. */
  function vibeVerificado(idModelo) {
    var m = modelo(idModelo);
    if (typeof m.vibe_transfer_verificado === "boolean") return m.vibe_transfer_verificado;
    var s = m.suporta;
    if (s && typeof s.vibe_transfer_verificado === "boolean") return s.vibe_transfer_verificado;
    var bruto = (global.OFICINA_REGRAS && global.OFICINA_REGRAS.modelos) || [];
    for (var i = 0; i < bruto.length; i++) {
      if (bruto[i] && bruto[i].id === m.id) {
        if (typeof bruto[i].vibe_transfer_verificado === "boolean") return bruto[i].vibe_transfer_verificado;
        var s2 = bruto[i].suporta;
        if (s2 && typeof s2.vibe_transfer_verificado === "boolean") return s2.vibe_transfer_verificado;
      }
    }
    return false;
  }

  // A que geração corresponde o campo `modelo_minimo` do acervo.
  function minimoNum(v) {
    if (!v || v === "qualquer") return 0;
    if (v === "v3") return 3;
    if (v === "v4") return 4;
    if (v === "v4.5" || v === "v4_5") return 4.5;
    var n = parseFloat(String(v).replace("v", "").replace("_", "."));
    return isNaN(n) ? 0 : n;
  }

  /* =================================================================
     3. Peso — como a tag vira texto
     ================================================================= */

  function repete(s, n) { var o = ""; for (var i = 0; i < n; i++) o += s; return o; }

  function numero(v) {
    var x = Math.round(v * 100) / 100;
    return String(x);
  }

  // Multiplicador de {chaves} / [colchetes]: 1,05 por nível, acumulando.
  function multiplicador(peso) {
    if (!peso || peso.tipo === "nenhum") return 1;
    if (peso.tipo === "chaves") return Math.pow(1.05, peso.valor);
    if (peso.tipo === "colchetes") return Math.pow(1.05, -peso.valor);
    return peso.valor;
  }

  function descrevePeso(peso) {
    if (!peso || peso.tipo === "nenhum") return "peso normal";
    if (peso.tipo === "chaves") return repete("{", peso.valor) + repete("}", peso.valor) + " = " + multiplicador(peso).toFixed(3).replace(".", ",") + "×";
    if (peso.tipo === "colchetes") return repete("[", peso.valor) + repete("]", peso.valor) + " = " + multiplicador(peso).toFixed(3).replace(".", ",") + "×";
    if (peso.tipo === "numerico") {
      if (peso.valor < 0) return numero(peso.valor) + " — inverte o conceito, não só enfraquece";
      return numero(peso.valor) + "× de peso";
    }
    return "";
  }

  // Texto final de UMA tag, sem peso numérico (esse é agrupado depois).
  function textoDaTag(item) {
    var t = item.valor ? item.valor : item.tag;   // `valor` cobre tags com campo (year XXXX)
    var p = item.peso;
    if (!p || p.tipo === "nenhum" || p.tipo === "numerico") return t;
    if (p.tipo === "chaves") return repete("{", p.valor) + t + repete("}", p.valor);
    if (p.tipo === "colchetes") return repete("[", p.valor) + t + repete("]", p.valor);
    return t;
  }

  /* Junta a lista de itens numa linha de prompt.

     Detalhe que importa: itens vizinhos com o MESMO peso numérico viram um
     bloco só — `1.5::rain, night ::`. É assim que o exemplo oficial do manual
     está escrito, e é o que faz o texto bater palavra por palavra com ele.
     Peso positivo leva o espaço antes do `::` final (como `0.5::coat ::`);
     peso negativo não leva (como `-1::speech bubble::`). As duas grafias são
     do próprio manual. */
  function juntar(itens) {
    var partes = [], i = 0;
    while (i < itens.length) {
      var it = itens[i];
      var p = it.peso;
      if (p && p.tipo === "numerico") {
        var v = p.valor;
        var grupo = [textoDaTag(it)];
        var j = i + 1;
        while (j < itens.length && itens[j].peso && itens[j].peso.tipo === "numerico" && itens[j].peso.valor === v) {
          grupo.push(textoDaTag(itens[j]));
          j += 1;
        }
        partes.push(v < 0
          ? numero(v) + "::" + grupo.join(", ") + "::"
          : numero(v) + "::" + grupo.join(", ") + " ::");
        i = j;
      } else {
        partes.push(textoDaTag(it));
        i += 1;
      }
    }
    return partes.join(", ");
  }

  function comLivre(linha, livre) {
    var l = (livre || "").trim();
    if (!l) return linha;
    if (!linha) return l;
    return linha + ", " + l;
  }

  /* =================================================================
     4. O bloco de texto na imagem — sempre no fim absoluto

     Quem escreve o "Text: " é ESTE arquivo, e só ele. A fala que chega
     aqui é a fala pura, sem prefixo.

     A regra tem motivo de campo: uma receita do acervo guardava a fala já
     com o prefixo dentro (`"bloco_texto": "Text: Aren't..."`), e a Bancada
     saía com `Text: Text: Aren't...` — o prefixo dobrado, que o NovelAI
     tende a DESENHAR como letra dentro da imagem, e o contador de 120
     caracteres contando seis caracteres a mais. Por isso o prefixo é
     arrancado na entrada, sempre. Arrancar um prefixo que não existe não
     faz nada, então a oficina fica certa com o acervo velho e com o novo.
     ================================================================= */

  // Tira o "Text:" que a fala porventura traga na frente. Idempotente.
  function semPrefixoDeTexto(t) {
    return String(t === undefined || t === null ? "" : t).replace(/^\s*Text\s*:\s*/i, "");
  }

  function blocoTexto(textos) {
    var lim = (textos || []).map(function (t) { return semPrefixoDeTexto(t).trim(); }).filter(Boolean);
    if (!lim.length) return "";
    return "Text: " + lim[0] + lim.slice(1).map(function (t) { return "\n\n" + t; }).join("");
  }

  /* ⚠ O "Text:" ESCONDIDO DENTRO DA CAIXA DE TEXTO LIVRE.

     `semPrefixoDeTexto` cuida da fala que chega no campo certo. Faltava o
     caminho oposto, e ele produzia o pior defeito possível — DOIS blocos
     `Text:` no mesmo prompt, com tag escrita depois do primeiro.

     Como acontecia, passo a passo: o autor clica em "Refazer esta imagem"
     no Álbum; a ficha da imagem traz o prompt inteiro, com o `Text:` dentro
     dele; a tela jogava esse prompt inteiro na caixa de texto livre; o
     motor colava o texto livre no fim da linha base e depois acrescentava o
     próprio `Text:`. Saía:

         …, english text
         Text: I'm not going back.
         Text: Não vou voltar.

     O manual (§13) é duro nisto: o texto vem no fim ABSOLUTO, e qualquer
     tag depois dele pode acabar desenhada dentro da imagem. E este é o
     caminho do mangá do próprio manual (§19.7: "troque só as duas últimas
     linhas entre quadros"), ou seja, o caminho que ele vai usar mais.

     A saída: arrancar a fala de onde ela estiver, mandar para o bloco único
     do fim, e DIZER o que foi movido, em vermelho. Mover em silêncio seria
     trocar um defeito por outro. */

  var MARCA_DE_TEXTO = /(^|\n)[ \t]*Text[ \t]*:/i;

  function extrairFalas(txt, onde, movidos) {
    var s = String(txt === undefined || txt === null ? "" : txt);
    var m = MARCA_DE_TEXTO.exec(s);
    if (!m) return s;

    var corte = m.index + (m[1] ? m[1].length : 0);
    var antes = s.slice(0, corte);
    var depois = s.slice(corte);

    // cada marca "Text:" abre uma fala nova; linha em branco também separa
    var falas = depois
      .replace(/(^|\n)[ \t]*Text[ \t]*:[ \t]*/gi, "\n\n")
      .split(/\n{2,}/)
      .map(function (x) { return x.trim(); })
      .filter(Boolean);

    if (falas.length) movidos.push({ onde: onde, falas: falas });
    return antes.replace(/[\s,]+$/, "");
  }

  /* =================================================================
     4.1 O texto livre lido como tags

     A caixa de texto livre existe para o autor escrever o que não está nas
     gavetas. Só que NENHUMA conferência a enxergava: ela entrava direto na
     linha do prompt, depois de tudo, sem passar por briga de tag, modelo
     mínimo nem peso. Medido: `1girl, monochrome, blue hair` digitado ali
     dava ZERO avisos, e `-1::hat::` no V4 Full também — os mesmos casos que,
     clicados nas gavetas, acendem vermelho.

     Aqui o texto livre é quebrado em pedaços e casado contra o acervo. O que
     casa vira um item igual ao clicado (com peso, id e balde), e passa por
     todas as regras. O que não casa vira um item sem id — ele ainda serve às
     checagens que olham a palavra escrita (`monochrome`, `no text`, `text`),
     e some das que dependem do acervo. Nada é inventado.
     ================================================================= */

  function umItemDoLivre(pedaco, pesoForcado, A) {
    var t = String(pedaco === undefined || pedaco === null ? "" : pedaco).trim();
    if (!t) return null;

    var peso = pesoForcado || { tipo: "nenhum", valor: 0 };
    if (!pesoForcado) {
      var ch = /^(\{+)([\s\S]*?)(\}+)$/.exec(t);
      var co = /^(\[+)([\s\S]*?)(\]+)$/.exec(t);
      if (ch) { peso = { tipo: "chaves", valor: Math.min(ch[1].length, ch[3].length) }; t = ch[2].trim(); }
      else if (co) { peso = { tipo: "colchetes", valor: Math.min(co[1].length, co[3].length) }; t = co[2].trim(); }
    }
    if (!t) return null;

    var reg = A.porTag[t.toLowerCase()] || null;
    return {
      chave: "livre:" + t.toLowerCase(),
      id: reg ? reg.id : "",
      tag: reg ? reg.tag : t,
      valor: "",
      pt: reg ? reg.pt : "",
      ordem: reg ? reg.ordem : 80,
      peso: peso,
      travada: false,
      deLivre: true,
      conhecida: !!reg
    };
  }

  function itensDoTextoLivre(txt) {
    var s = String(txt === undefined || txt === null ? "" : txt);
    if (!s.trim()) return [];
    var A = acervo();
    var itens = [];

    // os blocos de peso numérico atravessam a vírgula: "1.5::rain, night ::"
    var resto = s.replace(/(-?\d+(?:\.\d+)?)::([\s\S]*?)::/g, function (todo, pesoTxt, dentro) {
      dentro.split(",").forEach(function (pedaco) {
        var it = umItemDoLivre(pedaco, { tipo: "numerico", valor: parseFloat(pesoTxt) }, A);
        if (it) itens.push(it);
      });
      return ",";
    });

    resto.split(/[,\n]/).forEach(function (pedaco) {
      var it = umItemDoLivre(pedaco, null, A);
      if (it) itens.push(it);
    });

    return itens;
  }

  /* Lê, de um prompt já escrito, o peso que uma tag carrega ali dentro.

     Serve às receitas do acervo: elas trazem `prompt_base` escrito por
     extenso (com `-1::speech bubble::`, `{tag}`, `[tag]`) e uma lista de
     ids sem peso nenhum. Sem esta leitura, usar a receita das falas
     entregava `speech bubble` com peso normal — o contrário do que o
     manual manda, que é peso NEGATIVO para evitar o balão desenhado. */
  function escaparRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function lerPesoDoTexto(prompt, tagTexto) {
    var nenhum = { tipo: "nenhum", valor: 0 };
    var texto = String(prompt || "");
    var alvo = String(tagTexto || "").trim();
    if (!texto || !alvo) return nenhum;

    // 1) peso numérico, inclusive negativo: "1.5::rain, night ::" / "-1::speech bubble::"
    var reNum = /(-?\d+(?:\.\d+)?)::([\s\S]*?)::/g, m;
    while ((m = reNum.exec(texto)) !== null) {
      var dentro = m[2].split(",").map(function (x) { return x.trim(); });
      for (var i = 0; i < dentro.length; i++) {
        if (dentro[i] === alvo) return { tipo: "numerico", valor: parseFloat(m[1]) };
      }
    }

    // 2) chaves e colchetes empilhados: "{{tag}}" / "[[[tag]]]"
    var esc = escaparRegex(alvo);
    var reCh = new RegExp("(\\{+)\\s*" + esc + "\\s*(\\}+)");
    var reCo = new RegExp("(\\[+)\\s*" + esc + "\\s*(\\]+)");
    var c = reCh.exec(texto);
    if (c) return { tipo: "chaves", valor: Math.min(c[1].length, c[2].length) };
    var k = reCo.exec(texto);
    if (k) return { tipo: "colchetes", valor: Math.min(k[1].length, k[2].length) };

    return nenhum;
  }

  /* =================================================================
     5. As tags de contagem — a regra das caixas de personagem
     ================================================================= */

  var RE_CONTAGEM = /^(\d+|6\+|multiple)\s*(girls?|boys?|others?)$/i;

  function ehContagem(txt) { return RE_CONTAGEM.test(String(txt).trim()); }

  /* O tipo do personagem SEM número: é o que vai dentro da caixa de
     personagem, e só lá. No prompt base ele não diz quantas pessoas existem
     na imagem, então não faz o trabalho que a contagem faria. */
  var RE_TIPO_DE_CAIXA = /^(girl|boy|other|female|male)$/i;

  function ehTipoDeCaixa(txt) { return RE_TIPO_DE_CAIXA.test(String(txt).trim()); }

  /* Quantas pessoas a contagem do prompt base declara. `2girls` vale 2,
     `1girl` mais `1boy` vale 2, `6+girls` vale 6, `multiple girls` não tem
     número e devolve null — não dá para comparar o que não tem número. */
  function quantasPessoasDizAContagem(textos) {
    var soma = 0, achou = false, semNumero = false;
    (textos || []).forEach(function (bruto) {
      var t = String(bruto || "").trim();
      if (!ehContagem(t)) return;
      achou = true;
      var m = /^(\d+|6\+|multiple)/i.exec(t);
      if (!m) { semNumero = true; return; }
      if (/^multiple$/i.test(m[1])) { semNumero = true; return; }
      soma += parseInt(String(m[1]).replace("+", ""), 10) || 0;
    });
    if (!achou || semNumero) return null;
    return soma;
  }

  /* O aviso do acervo é sobre ONDE a tag deve ficar? Só esses avisos são
     escondidos quando a tag já está no lugar certo — os outros continuam
     aparecendo sempre. */
  function ehAvisoDeColocacao(txt) {
    return /contagem vai s[óo] no prompt base|dentro da caixa de personagem|Add Character/i
      .test(String(txt || ""));
  }

  /* =================================================================
     6. Montagem completa
     ================================================================= */

  function montar(estado) {
    var e0 = estado || {};
    var mod = e0.modelo || modeloPadrao();
    var cap = podem(mod);

    /* PASSO ZERO — arrancar toda fala escondida nas caixas de texto livre,
       ANTES de montar qualquer coisa. Só depois disto o estado é
       confiável, e é a versão limpa que segue para a montagem,
       para a conferência, para a conta de custo e para as instruções
       de colagem. */
    var movidos = [];
    var e = {
      modelo: e0.modelo,
      base: e0.base || [],
      livreBase: extrairFalas(e0.livreBase, "a caixa de texto livre do prompt base", movidos),
      personagens: (e0.personagens || []).map(function (p, i) {
        return {
          nome: p.nome,
          itens: p.itens || [],
          livre: extrairFalas(p.livre, "a caixa do personagem " + (i + 1), movidos),
          indesejado: p.indesejado,
          posicao: p.posicao
        };
      }),
      indesejado: {
        itens: (e0.indesejado || {}).itens || [],
        livre: extrairFalas((e0.indesejado || {}).livre, "a caixa de conteúdo indesejado", movidos),
        preset: (e0.indesejado || {}).preset
      },
      textos: [],
      referencias: e0.referencias || [],
      qualidadeAuto: e0.qualidadeAuto,
      assinatura: e0.assinatura
    };

    // as falas arrancadas entram ANTES das que ele digitou no campo certo
    var falasMovidas = [];
    movidos.forEach(function (m) { falasMovidas = falasMovidas.concat(m.falas); });
    e.textos = falasMovidas.concat(e0.textos || []);

    var base = comLivre(juntar(e.base), e.livreBase);
    var personagens = e.personagens.map(function (p) {
      return {
        nome: p.nome || "personagem",
        prompt: comLivre(juntar(p.itens), p.livre),
        indesejado: (p.indesejado || "").trim(),
        posicao: p.posicao || null
      };
    });
    var indesejado = comLivre(juntar(e.indesejado.itens), e.indesejado.livre);
    var texto = blocoTexto(e.textos);

    var promptCompleto = base;
    if (texto) promptCompleto = (base ? base + "\n" : "") + texto;

    var conta = contar(e);
    var avisos = conferir(e, cap, mod);
    var gasto = custo(e);

    // o relato do que foi movido vai na FRENTE de tudo, e em vermelho
    if (movidos.length) {
      var relato = movidos.map(function (m) {
        return "de " + m.onde + ": “" + m.falas.join("” e “") + "”";
      }).join("; ");
      avisos.unshift({
        nivel: "vermelho",
        texto: "Achei uma fala escrita com Text: dentro de uma caixa de tags, e movi para o bloco de texto do fim, " +
          "onde ela é obrigatória. O que eu movi — " + relato + ".",
        saida: "O manual manda o Text: no fim absoluto do prompt: qualquer tag depois dele pode acabar aparecendo " +
          "desenhada dentro da imagem. Para duas falas, use o botão “Adicionar uma fala” em vez de " +
          "escrever Text: na caixa de tags."
      });
    }

    return {
      modelo: mod,
      modeloNome: nomeDoModelo(mod),
      base: base,
      personagens: personagens,
      indesejado: indesejado,
      texto: texto,
      promptCompleto: promptCompleto,
      avisos: avisos,
      custo: gasto,
      contagem: conta,
      // o que saiu das caixas de tags, para a tela poder consertar a origem
      falasMovidas: movidos,
      textosFinais: e.textos.slice(),
      instrucoes: instrucoesDeColagem(mod, base, personagens, indesejado, texto, e)
    };
  }

  /* A conta de tags passou a incluir o texto livre, que também vira tag
     dentro do prompt. Antes ela dizia "6 tags" para um prompt com nove.

     ⚠ E DESDE A RODADA 2 ELA DEVOLVE AS DUAS CONTAS SEPARADAS.

     Havia `tags` (o prompt INTEIRO, caixas de personagem incluídas) e
     `caracteresBase` (só a caixa principal). A Bancada mostrava as duas na
     mesma linha, embaixo da caixa principal — e com a base vazia e três tags
     numa caixa de personagem ela escrevia "Ainda vazio" e "3 tags · 0
     caracteres", uma debaixo da outra. Duas contas verdadeiras somam uma
     linha falsa. Agora `tagsBase` existe, e quem mostra escolhe qual usar. */
  function contar(e) {
    var nBase = (e.base || []).length + itensDoTextoLivre(e.livreBase).length;
    var n = nBase;
    (e.personagens || []).forEach(function (p) {
      n += (p.itens || []).length + itensDoTextoLivre(p.livre).length;
    });
    var chars = 0;
    var linha = juntar(e.base || []);
    chars = linha.length + (e.livreBase || "").length;
    return {
      tags: n,
      tagsBase: nBase,
      caracteresBase: chars,
      personagens: (e.personagens || []).length
    };
  }

  /* =================================================================
     7. Conferência — regra do motor (vermelho) × briga de tag (amarelo)
     ================================================================= */

  function conferir(e, cap, mod) {
    var out = [];
    var A = acervo();

    function v(txt, comoResolver) { out.push({ nivel: "vermelho", texto: txt, saida: comoResolver || "" }); }
    function am(txt, comoResolver) { out.push({ nivel: "amarelo", texto: txt, saida: comoResolver || "" }); }
    function az(txt) { out.push({ nivel: "azul", texto: txt }); }

    /* As caixas são separadas, e a conferência também.

       Isto é uma correção de um erro que ensinava o autor a ignorar os
       alertas vermelhos. A conferência antiga juntava o prompt base e
       TODAS as caixas de personagem num bolo só. Uma cena com dois
       personagens — Helena com `girl, long hair` numa caixa e Heitor com
       `boy, short hair` na outra, que é exatamente o uso para o qual as
       caixas existem — saía com dois vermelhos falsos dizendo que as tags
       se anulavam. O manual abre a seção das caixas dizendo o contrário:
       elas existem justamente para as características de um não vazarem
       para o outro.

       Então: briga entre tags é conferida DENTRO de cada caixa. Só o que
       é mesmo global — modelo mínimo, contagem, teto de 6, peso, texto na
       imagem, preto e branco — olha o conjunto. */
    /* O TEXTO LIVRE ENTRA AQUI, e esta linha vale um paragrafo.

       A caixa de texto livre nao passava por conferencia nenhuma. Medido:
       `1girl, monochrome, blue hair` digitado ali dava ZERO avisos, e
       `-1::hat::` no V4 Full tambem — os mesmos casos que, clicados nas
       gavetas, acendem vermelho. E o prompt recuperado do Album cai
       inteiro nessa caixa, entao era exatamente o material mais complexo
       que ninguem conferia.

       `itensDoTextoLivre` quebra o texto e casa cada pedaco contra o
       acervo. O que casa vira item igual ao clicado e passa por todas as
       regras. O que nao casa entra sem id — ainda serve as checagens que
       olham a palavra escrita, e some das que dependem do acervo. */
    var grupos = [{
      id: "base",
      nome: "prompt base",
      itens: (e.base || []).slice().concat(itensDoTextoLivre(e.livreBase))
    }];
    (e.personagens || []).forEach(function (p, i) {
      grupos.push({
        id: "p" + i,
        nome: "caixa do personagem " + (i + 1) + (p.nome ? " (" + p.nome + ")" : ""),
        itens: (p.itens || []).slice().concat(itensDoTextoLivre(p.livre))
      });
    });

    var todos = [];
    grupos.forEach(function (g) { todos = todos.concat(g.itens); });

    var idsNaBase = {};
    (e.base || []).concat(itensDoTextoLivre(e.livreBase)).forEach(function (it) {
      if (it.id) idsNaBase[it.id] = it;
    });

    /* --- 7.0 o modelo existe?

       Um arquivo de personagem ou de prompt aberto no Bloco de Notas pode
       trazer um id que a oficina não conhece. `podem()` já falha fechada
       nesse caso, tratando o pedido como o modelo mais antigo — mas o autor
       precisa saber POR QUE tudo virou vermelho de repente. */
    if (cap.desconhecido) {
      v("O modelo gravado neste trabalho é " + nomeDoModelo(cap.idPedido) +
        ". Enquanto ele estiver assim, a oficina confere tudo pelas regras do modelo mais antigo — " +
        "o alerta aparece a mais, nunca a menos.",
        "Escolha um modelo na lista, no alto da Bancada.");
    }

    // --- 7.1 modelo mínimo de cada tag (global, e uma vez por tag)
    var jaFalado = {};
    todos.forEach(function (it) {
      var t = it.id ? A.porId[it.id] : null;
      if (!t || jaFalado[t.id]) return;
      jaFalado[t.id] = 1;
      var min = minimoNum(t.modelo_minimo);
      if (min > cap.geracao) {
        v("A tag " + t.tag + " (" + t.pt + ") só existe no modelo " + t.modelo_minimo.toUpperCase() +
          " ou mais novo. Você está no " + nomeDoModelo(mod) + ".",
          "Troque o modelo no alto da Bancada, ou tire essa tag.");
      }
      if (t.so_em && t.so_em.length && t.so_em.indexOf(mod) < 0) {
        v("A tag " + t.tag + " só funciona no modelo " + t.so_em.join(" ou ") + ".",
          "Troque o modelo ou tire essa tag.");
      }
      if (t.verificada === false) {
        am("A tag " + t.tag + " não foi encontrada no manual oficial. Ela pode não existir para a IA.",
          "Se o resultado ignorar essa tag, é por isso.");
      }
    });

    // --- 7.1b campo por preencher (year XXXX e parentes)
    var porPreencher = todos.filter(function (it) {
      return /XXXX/.test(String(it.valor || it.tag || ""));
    });
    if (porPreencher.length) {
      v("A tag " + (porPreencher[0].valor || porPreencher[0].tag) +
        " tem um espaço por preencher. Mandar XXXX para a IA gasta Anlas num pedido sem sentido.",
        "Na Bancada, em “As suas tags”, escreva o valor no campo que aparece ao lado dessa tag — por exemplo, o ano 1998.");
    }

    // --- 7.2 exclusivas, brigas e exigências — DENTRO de cada caixa
    var jaAviso = {};
    grupos.forEach(function (g) {
      var idsAqui = {};
      g.itens.forEach(function (it) { if (it.id) idsAqui[it.id] = it; });
      var jaDito = {};
      var ondeTxt = grupos.length > 1 ? " (no " + g.nome + ")" : "";

      g.itens.forEach(function (it) {
        var t = it.id ? A.porId[it.id] : null;
        if (!t) return;

        (t.exclusivo_com || []).forEach(function (outro) {
          if (!idsAqui[outro]) return;
          var par = [t.id, outro].sort().join("|");
          if (jaDito["x" + par]) return;
          jaDito["x" + par] = 1;
          var o = A.porId[outro];
          v(t.tag + " e " + (o ? o.tag : outro) + " não podem estar juntas" + ondeTxt +
            " — uma anula a outra.",
            "Escolha uma das duas e tire a outra.");
        });

        (t.conflita_com || []).forEach(function (outro) {
          if (!idsAqui[outro]) return;
          var par = [t.id, outro].sort().join("|");
          if (jaDito["c" + par]) return;
          jaDito["c" + par] = 1;
          var o2 = A.porId[outro];
          am(t.tag + " e " + (o2 ? o2.tag : outro) + " brigam entre si" + ondeTxt +
            ". O resultado tende a sair inconsistente.",
            "Dá para manter as duas, mas espere resultado instável.");
        });

        /* `requer` aceita a companheira no prompt base: uma tag posta na
           base vale para a imagem inteira, então exigi-la repetida dentro
           da caixa seria aviso falso. */
        (t.requer || []).forEach(function (outro) {
          if (idsAqui[outro] || idsNaBase[outro]) return;
          var par = t.id + ">" + outro;
          if (jaDito["r" + par]) return;
          jaDito["r" + par] = 1;
          var o3 = A.porId[outro];
          am(t.tag + " funciona muito melhor junto com " + (o3 ? o3.tag : outro) + ".",
            "Clique em “Adicionar junto” para pôr as duas.");
        });

        /* ⚠ ALARME QUE DISPARA NO ACERTO ENSINA A IGNORAR ALARME.

           O aviso de colocação do acervo (`a contagem vai só no prompt
           base`, `só dentro da caixa de personagem`) aparecia SEMPRE, até
           quando a tag estava exatamente onde devia. Medido: `2girls` na
           base com `girl` em cada caixa — o uso correto, o que o manual
           manda — colhia duas notas azuis repreendendo o autor, enquanto o
           uso ERRADO (girl solto na base, sem caixa nenhuma) não colhia
           vermelho nenhum. A regra valia num sentido só.

           Agora o aviso de colocação só sai quando a tag está no lugar
           errado. O lugar errado de cada uma vira alerta em 7.4: contagem
           dentro da caixa é vermelho lá; tipo sem número no prompt base
           passou a ser vermelho lá também. */
        if (t.aviso && !jaAviso[t.id]) {
          var txtTag = it.valor || t.tag || "";
          var noLugarCerto = ehAvisoDeColocacao(t.aviso) && (
            (ehContagem(txtTag) && g.id === "base") ||
            (ehTipoDeCaixa(txtTag) && g.id !== "base")
          );
          if (!noLugarCerto) { jaAviso[t.id] = 1; az(t.tag + ": " + t.aviso); }
        }
      });
    });

    // --- 7.3 peso × modelo
    var usaNumerico = todos.some(function (it) { return it.peso && it.peso.tipo === "numerico"; });
    var usaNegativo = todos.some(function (it) { return it.peso && it.peso.tipo === "numerico" && it.peso.valor < 0; });
    if (usaNumerico && !cap.pesoNumerico) {
      v("Você usou peso numérico (o formato 1.5::tag ::), que só funciona no V4 ou mais novo.",
        "Troque para {chaves} e [colchetes], ou mude o modelo.");
    }
    if (usaNegativo && !cap.pesoNegativo) {
      v("Você usou peso negativo (número menor que zero), que só funciona no V4.5.",
        "Mande a tag para o Conteúdo Indesejado, ou mude o modelo para V4.5.");
    }

    // --- 7.4 caixas de personagem
    var np = (e.personagens || []).length;
    if (np > 0 && !cap.multiPersonagem) {
      v("Caixa de personagem separada só existe no V4 ou mais novo. Você está no " + nomeDoModelo(mod) + ".",
        "Mude o modelo, ou escreva tudo no prompt base.");
    }
    if (np > 6) {
      v("O NovelAI aceita no máximo 6 personagens. Você montou " + np + ".",
        "Tire " + (np - 6) + ".");
    }
    (e.personagens || []).forEach(function (p, i) {
      (p.itens || []).forEach(function (it) {
        var txt = it.valor || it.tag || "";
        if (ehContagem(txt)) {
          v("Dentro da caixa do personagem " + (i + 1) + " você pôs " + txt +
            ". A contagem vai SÓ no prompt base; dentro da caixa vai só girl ou boy, sem número.",
            "Tire " + txt + " da caixa e ponha no prompt base.");
        }
      });
      if ((p.livre || "").split(",").some(function (s) { return ehContagem(s); })) {
        v("O texto livre da caixa do personagem " + (i + 1) + " tem uma tag de contagem (tipo 1girl).",
          "A contagem vai só no prompt base.");
      }
    });
    /* Os textos do prompt base, tags e caixa de texto livre juntos. É a
       lista contra a qual as três regras de colocação abaixo se aplicam. */
    var textosDaBase = (e.base || [])
      .map(function (it) { return it.valor || it.tag || ""; })
      .concat(String(e.livreBase || "").split(",").map(function (s) { return s.trim(); }))
      .filter(Boolean);

    /* ⚠ O ESPELHO QUE FALTAVA: o tipo sem número solto no prompt base.

       A oficina já acendia vermelho para a contagem dentro da caixa. O
       caminho inverso — `girl, long hair` no prompt base, sem caixa nenhuma —
       passava calado. O manual (07) trata os dois lados da mesma regra: a
       contagem vai só no prompt base; dentro da caixa vai só girl ou boy. */
    var jaDitoTipo = {};
    textosDaBase.forEach(function (txt) {
      if (!ehTipoDeCaixa(txt) || jaDitoTipo[txt.toLowerCase()]) return;
      jaDitoTipo[txt.toLowerCase()] = 1;
      v("No prompt base você pôs " + txt + ", sem número. Solto aí, ele não diz quantas pessoas há na imagem — " +
        txt + " sem número é a tag de DENTRO da caixa de personagem.",
        "No prompt base, troque por 1" + (/^(girl|female)$/i.test(txt) ? "girl" : (/^(boy|male)$/i.test(txt) ? "boy" : "other")) +
        ". Se você quer um personagem em caixa separada, abra a caixa na Bancada e ponha " + txt + " lá dentro.");
    });

    /* ⚠ E O PREFIXO DE AÇÃO, que só existe dentro de uma caixa.

       As tags `source#hug`, `target#hug` e `mutual#hug` dizem QUEM faz o quê
       entre dois personagens. O manual só as apresenta dentro do modo de
       vários personagens, e o prefixo precisa de uma caixa para se ligar a
       alguém. Solto no prompt base ele é texto morto que o autor copia e
       paga. Medido: `2girls, source#hug, target#hug` sem caixa nenhuma saía
       com três notas azuis e nenhum vermelho. */
    var jaDitoPrefixo = {};
    textosDaBase.forEach(function (txt) {
      if (txt.indexOf("#") < 0 || jaDitoPrefixo[txt.toLowerCase()]) return;
      jaDitoPrefixo[txt.toLowerCase()] = 1;
      v("A tag " + txt + " é um prefixo de ação, e ele só funciona DENTRO de uma caixa de personagem. " +
        "No prompt base ele não se liga a ninguém: vai junto no pedido, é cobrado, e não faz nada.",
        "Abra duas caixas de personagem na Bancada e ponha " + txt + " dentro da caixa de quem faz essa parte da ação — " +
        "source# em quem age, target# em quem recebe, mutual# quando os dois fazem juntos.");
    });

    if (np > 0) {
      var temContagemBase = textosDaBase.some(function (s) { return ehContagem(s); });
      if (!temContagemBase) {
        am("Você tem " + np + " caixa(s) de personagem, mas o prompt base não diz quantos personagens existem.",
          "Ponha a contagem no prompt base — por exemplo 2girls, ou 1girl, 1boy.");
      } else {
        /* A contagem do prompt base bate com o número de caixas abertas?
           `1girl` com duas caixas é contradição: a imagem pede uma pessoa e
           a oficina descreve duas. */
        var quantasDiz = quantasPessoasDizAContagem(textosDaBase);
        if (quantasDiz !== null && quantasDiz !== np) {
          am("O prompt base diz que há " + quantasDiz + " pessoa(s) na imagem, e você abriu " + np +
            " caixa(s) de personagem. Os dois números precisam bater.",
            quantasDiz > np
              ? "Abra mais " + (quantasDiz - np) + " caixa(s) de personagem, ou baixe a contagem do prompt base."
              : "Feche " + (np - quantasDiz) + " caixa(s) de personagem, ou suba a contagem do prompt base.");
        }
      }
    }

    // --- 7.5 texto na imagem
    var textos = (e.textos || []).map(function (t) { return semPrefixoDeTexto(t).trim(); }).filter(Boolean);
    if (textos.length && !cap.textoNaImagem) {
      v("Escrever texto dentro da imagem só funciona no V4 ou mais novo.",
        "Mude o modelo, ou gere sem fala e escreva o balão depois num editor de imagem.");
    }
    textos.forEach(function (t, i) {
      if (t.length > 120) {
        am("O texto " + (i + 1) + " tem " + t.length + " caracteres. O manual recomenda até 120 — texto curto sai mais confiável.",
          "Corte para 120 caracteres ou divida em dois balões.");
      }
    });
    if (textos.length) {
      var temTagTexto = todos.some(function (it) { return /^(text|english text)$/i.test(it.valor || it.tag || ""); });
      if (!temTagTexto) {
        am("Você pediu texto na imagem, mas não pôs as tags text e english text no prompt.",
          "Clique em “Adicionar junto” para incluir as duas.");
      }
      if (e.qualidadeAuto) {
        am("As Etiquetas de Qualidade automáticas incluem no text por padrão, e isso briga com o texto que você pediu.",
          "Desligue as Etiquetas de Qualidade se o texto não aparecer na imagem.");
      }
      var temNoText = todos.some(function (it) { return /^no text$/i.test(it.valor || it.tag || ""); });
      if (temNoText) {
        v("Você tem a tag no text no prompt e pediu texto na imagem ao mesmo tempo. Uma cancela a outra.",
          "Tire no text.");
      }
    }

    // --- 7.6 preto e branco contra tag de cor
    var pbs = todos.filter(function (it) { return /^(monochrome|greyscale)$/i.test(it.valor || it.tag || ""); });
    if (pbs.length) {
      var comCor = todos.filter(function (it) {
        var t2 = it.id ? A.porId[it.id] : null;
        var txt2 = String(it.valor || it.tag || "");
        var ehCor = /\b(hair|eyes|skin|theme|shirt|skirt|jacket|dress|pants|gloves|boots|cape|coat)\b/i.test(txt2) &&
          /\b(black|blonde|blue|aqua|brown|green|grey|gray|orange|pink|purple|red|white|yellow|platinum|silver)\b/i.test(txt2);
        return ehCor || (t2 && t2.subcategoria && /cor/.test(t2.subcategoria) && !/^(monochrome|greyscale)$/i.test(txt2));
      });
      if (comCor.length) {
        am("Você tem " + (pbs[0].valor || pbs[0].tag) + " (preto e branco) e ainda " + comCor.length +
          " tag(s) de cor no prompt: " + comCor.slice(0, 4).map(function (x) { return x.valor || x.tag; }).join(", ") +
          ". Elas brigam, e o resultado sai inconsistente.",
          "Tire as tags de cor, ou tire o preto e branco.");
      }
    }

    // --- 7.7 efeitos cancelados pelo preset Pesado
    var presetPesado = /pesad|heavy/i.test(String((e.indesejado || {}).preset || ""));
    if (presetPesado) {
      var canc = todos.filter(function (it) { return /^chromatic aberration$/i.test(it.valor || it.tag || ""); });
      if (canc.length) {
        am("O preset “Pesado” de Conteúdo Indesejado já contém chromatic aberration. Se você pedir esse efeito, ele pode nunca aparecer.",
          "Troque o preset para Leve, ou tire o efeito da lista de desejados.");
      }
    }

    // --- 7.8 referências
    var refs = e.referencias || [];
    var nChar = refs.filter(function (r) { return r.tipo === "character"; }).length;
    var nStyle = refs.filter(function (r) { return r.tipo === "style"; }).length;
    var nVibe = refs.filter(function (r) { return r.tipo === "vibe"; }).length;

    if ((nChar || nStyle) && !cap.preciseReference) {
      v("Character Reference e Style Reference só existem no modelo V4.5. Você está no " + nomeDoModelo(mod) + ".",
        "Mude o modelo para V4.5, ou use Vibe Transfer no lugar.");
    }
    if ((nChar || nStyle) && nVibe) {
      v("Precise Reference (que é Character Reference mais Style Reference) NÃO funciona junto com Vibe Transfer na mesma geração.",
        "Escolha um dos dois e tire o outro.");
    }
    /* Vibe Transfer no V4/V4.5: a oficina supõe que funciona, e a suposição
       não foi conferida. Isso precisa aparecer ANTES de a codificação cobrar
       os 2 Anlas dela, porque esse gasto acontece de qualquer jeito. */
    if (nVibe && !vibeVerificado(mod) && /^v4/.test(String(modelo(mod).familia || ""))) {
      am("O manual não diz se o Vibe Transfer funciona no " + nomeDoModelo(mod) +
        ". A oficina supõe que sim, e essa suposição não foi conferida em lugar nenhum. " +
        "Codificar cada imagem custa Anlas, e esse gasto acontece antes de qualquer resultado.",
        "Prove com uma imagem só antes de mandar um lote. Se não funcionar, o caminho é a Referência Precisa, que o manual sustenta.");
    }
    /* ⚠ A PALAVRA "OFICIAL" SAIU DAQUI, e a saída tem prova.

       Esta frase dizia "Isso é limite oficial do NovelAI". O próprio acervo
       da Oficina declara essa regra como NÃO verificada
       (`acervo_regras.js`, nó `duas_char_ref_misturam`: `"verificado": false`,
       com a origem escrita — "briefing da sessão; o manual não trata disto").
       Procurando "mistur" no manual inteiro, as duas únicas ocorrências são
       do Remove BG.

       A regra continua valendo, e continua vermelha: é decisão do autor. O
       que não pode é a Oficina carimbar de "oficial" uma coisa que os
       próprios dados dela marcam como não conferida. */
    if (nChar >= 2) {
      v("Você anexou " + nChar + " referências de personagem. A Oficina trata isso como regra dura: ela NÃO vai fazer " +
        nChar + " personagens — as referências se MISTURAM num personagem só, com as características somadas. " +
        "Isto é decisão do autor desta oficina. O manual do NovelAI não afirma isso; ele só diz que o custo soma " +
        "quando há mais de uma referência.",
        "Para dois personagens de verdade, use as caixas de personagem (até 6), com a contagem só no prompt base.");
    }

    return out;
  }

  /* =================================================================
     8. Custo em Anlas

     Só entra aqui número que o manual publica. O custo da geração em si
     depende do plano e do tamanho, e a documentação não publica essa
     tabela — então a oficina diz isso, em vez de inventar um número.
     ================================================================= */

  /* Lê os valores de `OFICINA_REGRAS.custos.itens`, onde cada item tem `id`,
     `anlas` e `verificado`. Só entram aqui os números que o manual publica;
     os que o acervo marca como não verificados a oficina não usa para contar. */
  function itemDeCusto(id) {
    var r = global.OFICINA_REGRAS;
    var itens = r && r.custos && r.custos.itens;
    if (!itens || !itens.length) return null;
    for (var i = 0; i < itens.length; i++) {
      if (itens[i].id === id) return itens[i];
    }
    return null;
  }

  function tabelaCusto() {
    var ref = itemDeCusto("character_reference");
    var vibe = itemDeCusto("vibe_transfer");
    return {
      referencia: ref && typeof ref.anlas === "number" ? ref.anlas : 5,
      vibe: vibe && typeof vibe.anlas === "number" ? vibe.anlas : 2
    };
  }

  /* Só entra na conta o que a oficina realmente vai mandar, e só no modelo
     onde o recurso existe.

     Duas correções de campo vivem aqui, e as duas custavam dinheiro de
     verdade ao autor:

     1. A Bancada cobrava 5 Anlas por Character Reference no V4 Full, na
        linha logo abaixo do alerta vermelho dizendo que esse recurso não
        existe no V4 Full. Cobrar por uma coisa que a linha de cima acabou
        de dizer que não vai acontecer.
     2. A Bancada cobrava pela imagem de referência mesmo quando a imagem
        não estava carregada na memória — e aí ela não viaja, e ele pagaria
        por uma referência que o NovelAI nunca veria. Referência sem os
        bytes agora entra com custo ZERO e um recado dizendo por quê. */
  function custo(e) {
    var t = tabelaCusto();
    var mod = e.modelo || modeloPadrao();
    var cap = podem(mod);
    var refs = e.referencias || [];
    var linhas = [];
    var total = 0;

    function temBytes(r) { return !!(r && (r.dados || r.dados_base64)); }

    var precisas = refs.filter(function (r) { return r.tipo === "character" || r.tipo === "style"; });
    var precisasProntas = precisas.filter(temBytes);

    if (precisas.length && !cap.preciseReference) {
      linhas.push({
        o: precisas.length + " imagem(ns) de referência precisa",
        anlas: 0,
        nota: "não cobrei nada: Character Reference e Style Reference não existem no " +
          nomeDoModelo(mod) + ", então essa referência não seria usada"
      });
    } else if (precisasProntas.length) {
      var sub = precisasProntas.length * t.referencia;
      total += sub;
      linhas.push({
        o: precisasProntas.length + " imagem(ns) de referência precisa",
        anlas: sub,
        nota: "+" + t.referencia + " Anlas por imagem, e soma se houver mais de uma — inclusive no plano Opus"
      });
    }
    var precisasSemBytes = precisas.length - (cap.preciseReference ? precisasProntas.length : precisas.length);
    if (precisasSemBytes > 0) {
      linhas.push({
        o: precisasSemBytes + " referência(s) sem a imagem carregada",
        anlas: 0,
        nota: "não cobrei nada porque a imagem não está na memória desta sessão — solte o arquivo de novo no Ateliê para ela valer"
      });
    }

    var vibes = refs.filter(function (r) { return r.tipo === "vibe" && !r.jaCodificado; });
    var vibesProntos = vibes.filter(temBytes);
    if (vibesProntos.length) {
      var sub2 = vibesProntos.length * t.vibe;
      total += sub2;
      linhas.push({
        o: vibesProntos.length + " imagem(ns) de Vibe Transfer para codificar",
        anlas: sub2,
        nota: t.vibe + " Anlas cada, uma vez só — depois fica guardada"
      });
    }
    if (vibes.length > vibesProntos.length) {
      linhas.push({
        o: (vibes.length - vibesProntos.length) + " Vibe Transfer sem a imagem carregada",
        anlas: 0,
        nota: "não cobrei nada: sem os dados da imagem ela não viaja"
      });
    }

    var obs = "O custo da geração em si depende do plano e do tamanho da imagem, e a documentação oficial não publica essa tabela — " +
      "por isso a oficina não inventa um número aqui. Os valores acima são os que o manual declara.";
    if (String(e.assinatura || "") === "opus") {
      obs += " Você marcou o plano Opus: a GERAÇÃO sai sem gastar Anlas (tamanho normal, até 28 passos, V4.5 ou anterior). " +
        "A referência de personagem NÃO é grátis nem no Opus: continua custando " + t.referencia +
        " Anlas por imagem, e soma a cada quadro. Uma folha de mangá com 8 quadros e a referência em cada um dá " +
        (8 * t.referencia) + " Anlas.";
    } else {
      obs += " No plano Opus a geração sai sem gastar Anlas (tamanho normal, até 28 passos); a referência de personagem continua custando " +
        t.referencia + " Anlas por imagem mesmo lá.";
    }

    return { total: total, linhas: linhas, observacao: obs };
  }

  /* =================================================================
     9. Instruções de colagem — para o dia sem token
     ================================================================= */

  function instrucoesDeColagem(mod, base, personagens, indesejado, texto, e) {
    var p = [];
    p.push({ onde: "No alto do site, em Modelo", oque: nomeDoModelo(mod) });
    p.push({ onde: "Na caixa de prompt principal", oque: texto ? (base + "\n" + texto) : base });
    if (indesejado) p.push({ onde: "Na aba Conteúdo Indesejado (Undesired Content)", oque: indesejado });
    personagens.forEach(function (pp, i) {
      p.push({
        onde: "Em + Add Character, caixa " + (i + 1) + (pp.nome ? " (" + pp.nome + ")" : ""),
        oque: pp.prompt + (pp.indesejado ? "\n[Conteúdo indesejado desta caixa] " + pp.indesejado : "")
      });
    });
    (e.referencias || []).forEach(function (r, i) {
      var nome = r.tipo === "character" ? "Character Reference" : (r.tipo === "style" ? "Style Reference" : "Vibe Transfer");
      p.push({ onde: "Anexe em " + nome + " (imagem " + (i + 1) + ")", oque: r.nome || "a imagem que você separou" });
    });
    if (texto) {
      p.push({ onde: "Confira antes de gerar", oque: "O bloco Text: tem de ser a última coisa da caixa. Nada pode vir depois dele." });
    }
    return p;
  }

  /* =================================================================
     10. Ajudas para a tela
     ================================================================= */

  // Escreve o prompt com o peso destacado, para a Bancada.
  function comDestaque(linha) {
    return String(linha)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/(\{+|\}+|\[+|\]+)/g, '<span class="peso">$1</span>')
      .replace(/(-?\d+(?:\.\d+)?::)/g, '<span class="peso">$1</span>')
      .replace(/(::)/g, '<span class="peso">$1</span>')
      .replace(/^(Text:)/gm, '<span class="txt-final">$1</span>');
  }

  /* =================================================================
     11. Autoteste — o prompt bate com o exemplo oficial?
     ================================================================= */

  function autoteste() {
    var casos = [];
    function reg(nome, esperado, obtido) {
      casos.push({ nome: nome, ok: esperado === obtido, esperado: esperado, obtido: obtido });
    }
    function it(txt, peso) { return { tag: txt, peso: peso || { tipo: "nenhum" } }; }

    reg("Exemplo do tutorial de introdução (§02)",
      "1girl, flower field, sunset, messy hair, brown hair, green eyes, from side, school uniform",
      juntar(["1girl", "flower field", "sunset", "messy hair", "brown hair", "green eyes", "from side", "school uniform"].map(function (s) { return it(s); })));

    reg("Combinação de estilo — aquarela tradicional (§04)",
      "traditional media, watercolor (medium), painterly, muted color, 1girl, standing, forest, best quality, very aesthetic",
      juntar(["traditional media", "watercolor (medium)", "painterly", "muted color", "1girl", "standing", "forest", "best quality", "very aesthetic"].map(function (s) { return it(s); })));

    reg("Combinação de estilo — ukiyo-e (§04)",
      "ukiyo-e, traditional media, ink (medium), flat color, limited palette, 1girl, standing, forest, best quality, very aesthetic",
      juntar(["ukiyo-e", "traditional media", "ink (medium)", "flat color", "limited palette", "1girl", "standing", "forest", "best quality", "very aesthetic"].map(function (s) { return it(s); })));

    reg("Combinação de estilo — pixel art retrô (§04)",
      "pixel art, dithering, year 1998, limited palette, 1girl, standing, forest, best quality",
      juntar(["pixel art", "dithering", "year 1998", "limited palette", "1girl", "standing", "forest", "best quality"].map(function (s) { return it(s); })));

    reg("Combinação de estilo — cinematográfico (§04)",
      "photorealistic, realistic, depth of field, bokeh, backlighting, 1girl, standing, forest, best quality, very aesthetic",
      juntar(["photorealistic", "realistic", "depth of field", "bokeh", "backlighting", "1girl", "standing", "forest", "best quality", "very aesthetic"].map(function (s) { return it(s); })));

    reg("Peso numérico, exemplo oficial (§05)",
      "1girl, 1.5::rain, night ::, 0.5::coat ::, black shoes",
      juntar([
        it("1girl"),
        it("rain", { tipo: "numerico", valor: 1.5 }),
        it("night", { tipo: "numerico", valor: 1.5 }),
        it("coat", { tipo: "numerico", valor: 0.5 }),
        it("black shoes")
      ]));

    reg("Chaves e colchetes empilhados (§05)",
      "[[[[[messy hair]]]]], messy hair, {{{{{messy hair}}}}}",
      juntar([
        it("messy hair", { tipo: "colchetes", valor: 5 }),
        it("messy hair"),
        it("messy hair", { tipo: "chaves", valor: 5 })
      ]));

    reg("Peso negativo (§05 e §13)",
      "2girls, text, english text, park, cowboy shot, -1::speech bubble::, looking at another, best quality",
      juntar([
        it("2girls"), it("text"), it("english text"), it("park"), it("cowboy shot"),
        it("speech bubble", { tipo: "numerico", valor: -1 }),
        it("looking at another"), it("best quality")
      ]));

    reg("O bloco Text: fica no fim absoluto, com linha em branco entre falas (§13)",
      "Text: Aren't stochastic differential equations exciting?\n\nIs this about diffusion models again?",
      blocoTexto(["Aren't stochastic differential equations exciting?", "Is this about diffusion models again?"]));

    // propriedade: nada nunca vem depois do Text:
    var m = montar({
      modelo: modeloPadrao(),
      base: [it("1girl"), it("best quality")],
      textos: ["olá"]
    });
    casos.push({
      nome: "Propriedade: nada é escrito depois do bloco Text:",
      ok: /\nText: olá$/.test(m.promptCompleto),
      esperado: "o prompt termina em “Text: olá”",
      obtido: JSON.stringify(m.promptCompleto)
    });

    // o prefixo Text: nunca sai dobrado, venha a fala como vier
    reg("A fala que já chega com “Text:” na frente não sai com o prefixo dobrado",
      "Text: Aren't stochastic differential equations exciting?",
      blocoTexto(["Text: Aren't stochastic differential equations exciting?"]));

    // ler o peso de dentro de um prompt escrito (é como as receitas viram tags)
    var pNeg = lerPesoDoTexto(
      "2girls, text, english text, park, cowboy shot, -1::speech bubble::, looking at another, best quality",
      "speech bubble");
    reg("O peso negativo do exemplo oficial é lido de dentro do prompt da receita",
      "numerico -1", pNeg.tipo + " " + pNeg.valor);

    var pCh = lerPesoDoTexto("1girl, {{{{{messy hair}}}}}, forest", "messy hair");
    reg("As chaves empilhadas são lidas de dentro do prompt da receita",
      "chaves 5", pCh.tipo + " " + pCh.valor);

    var pPar = lerPesoDoTexto("traditional media, [watercolor (medium)], forest", "watercolor (medium)");
    reg("Tag com parênteses no nome não quebra a leitura do peso",
      "colchetes 1", pPar.tipo + " " + pPar.valor);

    // duas caixas de personagem NÃO podem gerar alerta de anulação
    var mm = montar({
      modelo: "v45_full",
      base: [it("1girl"), it("1boy")],
      personagens: [
        { nome: "Helena", itens: [{ id: "quem_girl", tag: "girl", peso: { tipo: "nenhum" } },
          { id: "cab_long_hair", tag: "long hair", peso: { tipo: "nenhum" } }] },
        { nome: "Heitor", itens: [{ id: "quem_boy", tag: "boy", peso: { tipo: "nenhum" } },
          { id: "cab_short_hair", tag: "short hair", peso: { tipo: "nenhum" } }] }
      ]
    });
    var vermelhosFalsos = mm.avisos.filter(function (a) {
      return a.nivel === "vermelho" && /não podem estar juntas/.test(a.texto);
    });
    casos.push({
      nome: "Dois personagens em caixas separadas não geram alerta vermelho de anulação",
      ok: vermelhosFalsos.length === 0,
      esperado: "nenhum alerta de “não podem estar juntas”",
      obtido: vermelhosFalsos.length
        ? vermelhosFalsos.map(function (a) { return a.texto; }).join(" | ")
        : "nenhum"
    });

    // a mesma briga DENTRO de uma caixa continua sendo pega
    var mu = montar({
      modelo: "v45_full",
      base: [],
      personagens: [
        { nome: "um só", itens: [{ id: "cab_long_hair", tag: "long hair", peso: { tipo: "nenhum" } },
          { id: "cab_short_hair", tag: "short hair", peso: { tipo: "nenhum" } }] }
      ]
    });
    var achou = mu.avisos.some(function (a) {
      return a.nivel === "vermelho" && /não podem estar juntas/.test(a.texto);
    });
    casos.push({
      nome: "Duas tags que se anulam DENTRO da mesma caixa continuam sendo pegas",
      ok: !!(acervo().porId.cab_long_hair && acervo().porId.cab_short_hair) ? achou : true,
      esperado: "um alerta vermelho",
      obtido: achou ? "o alerta saiu" : "nenhum alerta (ou o acervo não tem essas duas tags)"
    });

    // referência precisa não pode ser cobrada em modelo que não a tem
    var cV4 = custo({ modelo: "v4_full", referencias: [{ tipo: "character", dados: "data:image/png;base64,AAA" }] });
    casos.push({
      nome: "Referência precisa não é cobrada no V4 Full, onde o recurso não existe",
      ok: cV4.total === 0,
      esperado: "0 Anlas",
      obtido: cV4.total + " Anlas"
    });

    /* --- os quatro casos que a crítica mediu, virados em teste ---------- */

    // A: prompt recuperado do Álbum, com Text: dentro do texto livre, mais
    //    uma fala nova. Antes saiam DOIS blocos Text:, e nenhum alerta.
    var mDois = montar({
      modelo: "v45_full",
      base: [],
      livreBase: "monochrome, greyscale, 1boy, solo, text, english text\nText: I'm not going back.",
      textos: ["Nao vou voltar."]
    });
    var quantosText = (mDois.promptCompleto.match(/(^|\n)Text:/g) || []).length;
    casos.push({
      nome: "Prompt recuperado com Text: dentro do texto livre não gera dois blocos Text:",
      ok: quantosText === 1,
      esperado: "1 bloco Text:",
      obtido: quantosText + " bloco(s) — " + JSON.stringify(mDois.promptCompleto)
    });
    casos.push({
      nome: "E a oficina diz, em vermelho, o que ela moveu de lugar",
      ok: mDois.avisos.some(function (a) { return a.nivel === "vermelho" && /movi/i.test(a.texto); }),
      esperado: "um alerta vermelho dizendo o que foi movido",
      obtido: mDois.avisos.map(function (a) { return a.nivel; }).join(", ") || "nenhum aviso"
    });
    casos.push({
      nome: "Nada é escrito depois do bloco Text:, nem vindo do texto livre",
      ok: /\nText: I'm not going back\.\n\nNao vou voltar\.$/.test(mDois.promptCompleto),
      esperado: "o prompt termina nas duas falas, na ordem",
      obtido: JSON.stringify(mDois.promptCompleto.slice(-70))
    });

    // B: briga de preto-e-branco com tag de cor, tudo digitado no texto livre
    var mPB = montar({ modelo: "v45_full", base: [], livreBase: "1girl, monochrome, blue hair" });
    casos.push({
      nome: "Preto e branco contra tag de cor é pego mesmo digitado no texto livre",
      ok: mPB.avisos.some(function (a) { return /preto e branco/i.test(a.texto); }),
      esperado: "um aviso de briga",
      obtido: mPB.avisos.length ? mPB.avisos.map(function (a) { return a.texto; }).join(" | ") : "ZERO avisos"
    });

    // C: peso negativo digitado no texto livre, em modelo que não o tem
    var mNeg = montar({ modelo: "v4_full", base: [], livreBase: "1girl, -1::hat::" });
    casos.push({
      nome: "Peso negativo digitado no texto livre acende vermelho no V4 Full",
      ok: mNeg.avisos.some(function (a) { return a.nivel === "vermelho" && /peso negativo/i.test(a.texto); }),
      esperado: "um alerta vermelho de peso negativo",
      obtido: mNeg.avisos.length ? mNeg.avisos.map(function (a) { return a.texto; }).join(" | ") : "ZERO avisos"
    });

    // D: texto na imagem em modelo V3, com tudo vindo do texto livre
    var mV3 = montar({ modelo: "anime_v3", base: [], livreBase: "1girl\nText: ola" });
    casos.push({
      nome: "Texto na imagem acende vermelho no Anime V3, mesmo vindo do texto livre",
      ok: mV3.avisos.some(function (a) { return a.nivel === "vermelho" && /texto dentro da imagem/i.test(a.texto); }),
      esperado: "um alerta vermelho de texto na imagem",
      obtido: mV3.avisos.map(function (a) { return a.texto; }).join(" | ") || "ZERO avisos"
    });

    // E: a acusação falsa — as tags text e english text ESTAVAM no texto livre
    var mFalso = montar({
      modelo: "v45_full", base: [],
      livreBase: "1girl, text, english text", textos: ["ola"]
    });
    casos.push({
      nome: "A oficina não acusa falta de text/english text quando elas estão no texto livre",
      ok: !mFalso.avisos.some(function (a) { return /não pôs as tags text/i.test(a.texto); }),
      esperado: "nenhuma acusação",
      obtido: mFalso.avisos.map(function (a) { return a.texto; }).join(" | ") || "nenhum aviso"
    });

    // F: Vibe Transfer no V4 avisa antes de a codificação cobrar
    var mVibe = montar({
      modelo: "v4_full", base: [],
      referencias: [{ tipo: "vibe", dados: "data:image/png;base64,AAA", nome: "v.png" }]
    });
    casos.push({
      nome: "Vibe Transfer no V4 Full avisa que o manual não confirma esse recurso",
      ok: mVibe.avisos.some(function (a) { return a.nivel === "amarelo" && /Vibe Transfer/.test(a.texto); }),
      esperado: "um aviso amarelo antes de cobrar",
      obtido: mVibe.avisos.map(function (a) { return a.nivel + ": " + a.texto; }).join(" | ") || "nenhum aviso"
    });

    // referência sem os bytes da imagem também não é cobrada
    var cSem = custo({ modelo: "v45_full", referencias: [{ tipo: "character", nome: "x.png" }] });
    casos.push({
      nome: "Referência sem a imagem carregada não é cobrada",
      ok: cSem.total === 0,
      esperado: "0 Anlas",
      obtido: cSem.total + " Anlas"
    });

    /* --- as regras de colocação, nos DOIS sentidos (rodada 2) ---------
       Cada par testa a mesma regra do manual pelos dois lados: o uso certo
       tem de passar calado, e o uso errado tem de acender. Alarme que
       dispara no acerto ensina o autor a ignorar alarme. */

    function porTexto(txt, ordem) {
      return { chave: "t" + txt, tag: txt, valor: "", ordem: ordem || 10, peso: { tipo: "nenhum", valor: 0 } };
    }
    function temNotaDeColocacao(m) {
      return m.avisos.some(function (a) {
        return /contagem vai s[óo] no prompt base|dentro da caixa de personagem|Add Character/i.test(a.texto);
      });
    }

    // G1: uso CERTO — contagem na base, tipo sem número dentro das caixas
    var mCerto = montar({
      modelo: "v45_full",
      base: [porTexto("2girls")],
      personagens: [
        { nome: "", itens: [porTexto("girl")], livre: "", indesejado: "" },
        { nome: "", itens: [porTexto("girl")], livre: "", indesejado: "" }
      ]
    });
    casos.push({
      nome: "Uso certo (2girls na base, girl em cada caixa) não é repreendido",
      ok: !temNotaDeColocacao(mCerto) && !mCerto.avisos.some(function (a) { return a.nivel === "vermelho"; }),
      esperado: "nenhuma nota de colocação e nenhum vermelho",
      obtido: mCerto.avisos.map(function (a) { return a.nivel + ": " + a.texto; }).join(" | ") || "nenhum aviso"
    });

    // G2: uso ERRADO — tipo sem número solto no prompt base
    var mErrado = montar({ modelo: "v45_full", base: [porTexto("girl"), porTexto("long hair", 40)] });
    casos.push({
      nome: "girl solto no prompt base acende vermelho",
      ok: mErrado.avisos.some(function (a) { return a.nivel === "vermelho" && /sem n[úu]mero/i.test(a.texto); }),
      esperado: "um vermelho sobre o tipo sem número no prompt base",
      obtido: mErrado.avisos.map(function (a) { return a.nivel + ": " + a.texto; }).join(" | ") || "nenhum aviso"
    });

    // G3: prefixo de ação solto no prompt base
    var mPrefixo = montar({ modelo: "v45_full", base: [porTexto("2girls"), porTexto("source#hug", 70)] });
    casos.push({
      nome: "source#hug no prompt base acende vermelho",
      ok: mPrefixo.avisos.some(function (a) { return a.nivel === "vermelho" && /prefixo de a[çc][ãa]o/i.test(a.texto); }),
      esperado: "um vermelho sobre o prefixo solto",
      obtido: mPrefixo.avisos.map(function (a) { return a.nivel + ": " + a.texto; }).join(" | ") || "nenhum aviso"
    });

    // G4: a contagem do prompt base não bate com o número de caixas
    var mBate = montar({
      modelo: "v45_full",
      base: [porTexto("1girl")],
      personagens: [
        { nome: "", itens: [porTexto("girl")], livre: "", indesejado: "" },
        { nome: "", itens: [porTexto("girl")], livre: "", indesejado: "" }
      ]
    });
    casos.push({
      nome: "1girl com duas caixas de personagem avisa que os números não batem",
      ok: mBate.avisos.some(function (a) { return /precisam bater/i.test(a.texto); }),
      esperado: "um aviso de que 1 pessoa e 2 caixas não batem",
      obtido: mBate.avisos.map(function (a) { return a.nivel + ": " + a.texto; }).join(" | ") || "nenhum aviso"
    });

    // G5: modelo que não existe falha FECHADA, e não abre tudo
    var capFalso = podem("v4");
    casos.push({
      nome: "Modelo desconhecido não libera os recursos do V4.5",
      ok: capFalso.desconhecido === true && capFalso.pesoNegativo === false && capFalso.preciseReference === false,
      esperado: "peso negativo e referência precisa desligados",
      obtido: "desconhecido=" + capFalso.desconhecido + " pesoNegativo=" + capFalso.pesoNegativo +
        " preciseReference=" + capFalso.preciseReference
    });

    // G6: a conta da Bancada separa a caixa principal do prompt inteiro
    var cNum = contar({
      base: [], livreBase: "",
      personagens: [{ itens: [porTexto("girl"), porTexto("jacket", 62)], livre: "" }]
    });
    casos.push({
      nome: "A conta separa a caixa principal (0) do prompt inteiro (2)",
      ok: cNum.tagsBase === 0 && cNum.tags === 2,
      esperado: "tagsBase 0 e tags 2",
      obtido: "tagsBase " + cNum.tagsBase + " e tags " + cNum.tags
    });

    // G7: a palavra "oficial" não volta ao alerta das duas referências
    var mDuas = montar({
      modelo: "v45_full", base: [],
      referencias: [
        { tipo: "character", dados: "data:image/png;base64,AAA", nome: "a.png" },
        { tipo: "character", dados: "data:image/png;base64,BBB", nome: "b.png" }
      ]
    });
    casos.push({
      nome: "O alerta das duas referências não se diz “oficial”",
      ok: mDuas.avisos.some(function (a) { return /MISTURAM/.test(a.texto); }) &&
        !mDuas.avisos.some(function (a) { return /limite oficial/i.test(a.texto); }),
      esperado: "o alerta existe, sem a palavra oficial",
      obtido: mDuas.avisos.filter(function (a) { return /MISTURAM|oficial/i.test(a.texto); })
        .map(function (a) { return a.texto; }).join(" | ") || "nenhum aviso"
    });

    return casos;
  }

  /* =================================================================
     Exportação
     ================================================================= */

  global.Motor = {
    acervo: acervo,
    tag: tag,
    modelos: modelos,
    modelo: modelo,
    modeloPadrao: modeloPadrao,
    existeModelo: existeModelo,
    nomeDoModelo: nomeDoModelo,
    paraPonte: paraPonte,
    itemDeCusto: itemDeCusto,
    podem: podem,
    minimoNum: minimoNum,
    juntar: juntar,
    textoDaTag: textoDaTag,
    blocoTexto: blocoTexto,
    semPrefixoDeTexto: semPrefixoDeTexto,
    extrairFalas: extrairFalas,
    itensDoTextoLivre: itensDoTextoLivre,
    vibeVerificado: vibeVerificado,
    lerPesoDoTexto: lerPesoDoTexto,
    multiplicador: multiplicador,
    descrevePeso: descrevePeso,
    ehContagem: ehContagem,
    ehTipoDeCaixa: ehTipoDeCaixa,
    montar: montar,
    custo: custo,
    comDestaque: comDestaque,
    autoteste: autoteste,
    recarregar: function () { _cache = null; return acervo(); }
  };
})(window);
