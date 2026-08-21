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

     Vem do manual (seção 16 e a nota de recursos). Se o Construtor A
     publicar a matriz em `OFICINA_REGRAS.modelos` num formato com `id`,
     `nome` e `geracao`, ela vence esta daqui.
     ================================================================= */

  var MODELOS_PADRAO = [
    { id: "v4_5_full",    nome: "V4.5 Full",    geracao: 4.5, dica: "Padrão recomendado — melhor fundo e melhor obediência ao prompt." },
    { id: "v4_5_curated", nome: "V4.5 Curated", geracao: 4.5, dica: "Dataset (conjunto de imagens de treino) mais limpo e focado." },
    { id: "v4_full",      nome: "V4 Full",      geracao: 4,   dica: "Geração anterior, ainda válida." },
    { id: "v4_curated",   nome: "V4 Curated",   geracao: 4,   dica: "Geração anterior, dataset mais limpo." },
    { id: "anime_v3",     nome: "Anime V3",     geracao: 3,   dica: "Modelo mais antigo. Aqui a ordem das tags pesa ainda mais." },
    { id: "furry_v3",     nome: "Furry V3",     geracao: 3,   dica: "Vocabulário próprio, para personagens antropomórficos (com traços de animal)." }
  ];

  function modelos() {
    var r = global.OFICINA_REGRAS;
    var c = r && (r.modelos || (r.matriz && r.matriz.modelos));
    if (c && c.length && c[0] && c[0].id && typeof c[0].geracao === "number") {
      return c.map(function (m) {
        return { id: m.id, nome: m.nome || m.id, geracao: m.geracao, dica: m.dica || m.descricao || "" };
      });
    }
    return MODELOS_PADRAO.slice();
  }

  function modelo(id) {
    var lista = modelos();
    for (var i = 0; i < lista.length; i++) { if (lista[i].id === id) return lista[i]; }
    return lista[0];
  }

  function podem(idModelo) {
    var g = modelo(idModelo).geracao;
    return {
      geracao: g,
      pesoNumerico: g >= 4,
      pesoNegativo: g >= 4.5,
      multiPersonagem: g >= 4,
      textoNaImagem: g >= 4,
      preciseReference: g >= 4.5   // Character Reference + Style Reference
    };
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
     ================================================================= */

  function blocoTexto(textos) {
    var lim = (textos || []).map(function (t) { return String(t).trim(); }).filter(Boolean);
    if (!lim.length) return "";
    return "Text: " + lim[0] + lim.slice(1).map(function (t) { return "\n\n" + t; }).join("");
  }

  /* =================================================================
     5. As tags de contagem — a regra das caixas de personagem
     ================================================================= */

  var RE_CONTAGEM = /^(\d+|6\+|multiple)\s*(girls?|boys?|others?)$/i;

  function ehContagem(txt) { return RE_CONTAGEM.test(String(txt).trim()); }

  /* =================================================================
     6. Montagem completa
     ================================================================= */

  function montar(estado) {
    var e = estado || {};
    var mod = e.modelo || "v4_5_full";
    var cap = podem(mod);

    var base = comLivre(juntar(e.base || []), e.livreBase);
    var personagens = (e.personagens || []).map(function (p) {
      return {
        nome: p.nome || "personagem",
        prompt: comLivre(juntar(p.itens || []), p.livre),
        indesejado: (p.indesejado || "").trim(),
        posicao: p.posicao || null
      };
    });
    var indDados = e.indesejado || {};
    var indesejado = comLivre(juntar(indDados.itens || []), indDados.livre);
    var texto = blocoTexto(e.textos);

    var promptCompleto = base;
    if (texto) promptCompleto = (base ? base + "\n" : "") + texto;

    var conta = contar(e);
    var avisos = conferir(e, cap, mod);
    var gasto = custo(e);

    return {
      modelo: mod,
      modeloNome: modelo(mod).nome,
      base: base,
      personagens: personagens,
      indesejado: indesejado,
      texto: texto,
      promptCompleto: promptCompleto,
      avisos: avisos,
      custo: gasto,
      contagem: conta,
      instrucoes: instrucoesDeColagem(mod, base, personagens, indesejado, texto, e)
    };
  }

  function contar(e) {
    var n = (e.base || []).length;
    (e.personagens || []).forEach(function (p) { n += (p.itens || []).length; });
    var chars = 0;
    var linha = juntar(e.base || []);
    chars = linha.length + (e.livreBase || "").length;
    return { tags: n, caracteresBase: chars, personagens: (e.personagens || []).length };
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

    // reúne todos os itens escolhidos (base + personagens)
    var todos = (e.base || []).slice();
    (e.personagens || []).forEach(function (p) { todos = todos.concat(p.itens || []); });
    var idsPresentes = {};
    todos.forEach(function (it) { if (it.id) idsPresentes[it.id] = it; });

    // --- 7.1 modelo mínimo de cada tag
    todos.forEach(function (it) {
      var t = it.id ? A.porId[it.id] : null;
      if (!t) return;
      var min = minimoNum(t.modelo_minimo);
      if (min > cap.geracao) {
        v("A tag " + t.tag + " (" + t.pt + ") só existe no modelo " + t.modelo_minimo.toUpperCase() +
          " ou mais novo. Você está no " + modelo(mod).nome + ".",
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

    // --- 7.2 exclusivas, brigas e exigências entre tags
    var jaDito = {};
    todos.forEach(function (it) {
      var t = it.id ? A.porId[it.id] : null;
      if (!t) return;
      (t.exclusivo_com || []).forEach(function (outro) {
        if (!idsPresentes[outro]) return;
        var par = [t.id, outro].sort().join("|");
        if (jaDito["x" + par]) return;
        jaDito["x" + par] = 1;
        var o = A.porId[outro];
        v(t.tag + " e " + (o ? o.tag : outro) + " não podem estar juntas — uma anula a outra.",
          "Escolha uma das duas e tire a outra.");
      });
      (t.conflita_com || []).forEach(function (outro) {
        if (!idsPresentes[outro]) return;
        var par = [t.id, outro].sort().join("|");
        if (jaDito["c" + par]) return;
        jaDito["c" + par] = 1;
        var o2 = A.porId[outro];
        am(t.tag + " e " + (o2 ? o2.tag : outro) + " brigam entre si. O resultado tende a sair inconsistente.",
          "Dá para manter as duas, mas espere resultado instável.");
      });
      (t.requer || []).forEach(function (outro) {
        if (idsPresentes[outro]) return;
        var o3 = A.porId[outro];
        am(t.tag + " funciona muito melhor junto com " + (o3 ? o3.tag : outro) + ".",
          "Clique em “Adicionar junto” para pôr as duas.");
      });
      if (t.aviso) {
        var k = "a" + t.id;
        if (!jaDito[k]) { jaDito[k] = 1; az(t.tag + ": " + t.aviso); }
      }
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
      v("Caixa de personagem separada só existe no V4 ou mais novo. Você está no " + modelo(mod).nome + ".",
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
    if (np > 0) {
      var temContagemBase = (e.base || []).some(function (it) { return ehContagem(it.valor || it.tag || ""); }) ||
        (e.livreBase || "").split(",").some(function (s) { return ehContagem(s); });
      if (!temContagemBase) {
        am("Você tem " + np + " caixa(s) de personagem, mas o prompt base não diz quantos personagens existem.",
          "Ponha a contagem no prompt base — por exemplo 2girls, ou 1girl, 1boy.");
      }
    }

    // --- 7.5 texto na imagem
    var textos = (e.textos || []).map(function (t) { return String(t).trim(); }).filter(Boolean);
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
        am("Você tem " + pbs[0].valor + " (preto e branco) e ainda " + comCor.length +
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
      v("Character Reference e Style Reference só existem no modelo V4.5. Você está no " + modelo(mod).nome + ".",
        "Mude o modelo para V4.5, ou use Vibe Transfer no lugar.");
    }
    if ((nChar || nStyle) && nVibe) {
      v("Precise Reference (que é Character Reference mais Style Reference) NÃO funciona junto com Vibe Transfer na mesma geração.",
        "Escolha um dos dois e tire o outro.");
    }
    if (nChar >= 2) {
      v("Você anexou " + nChar + " referências de personagem. A IA NÃO vai fazer " + nChar +
        " personagens: ela MISTURA as duas num personagem só. Isso é limite oficial do NovelAI.",
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

  function tabelaCusto() {
    var r = global.OFICINA_REGRAS;
    var c = r && (r.custos || r.custo);
    return {
      referencia: c && typeof c.referencia_por_imagem === "number" ? c.referencia_por_imagem : 5,
      vibe: c && typeof c.vibe_codificar === "number" ? c.vibe_codificar : 2
    };
  }

  function custo(e) {
    var t = tabelaCusto();
    var refs = e.referencias || [];
    var linhas = [];
    var total = 0;

    var nPrecise = refs.filter(function (r) { return r.tipo === "character" || r.tipo === "style"; }).length;
    if (nPrecise) {
      var sub = nPrecise * t.referencia;
      total += sub;
      linhas.push({ o: nPrecise + " imagem(ns) de referência precisa", anlas: sub, nota: "+" + t.referencia + " Anlas por imagem, e soma se houver mais de uma" });
    }

    var vibesNovos = refs.filter(function (r) { return r.tipo === "vibe" && !r.jaCodificado; }).length;
    if (vibesNovos) {
      var sub2 = vibesNovos * t.vibe;
      total += sub2;
      linhas.push({ o: vibesNovos + " imagem(ns) de Vibe Transfer para codificar", anlas: sub2, nota: t.vibe + " Anlas cada, uma vez só — depois fica em cache" });
    }

    return {
      total: total,
      linhas: linhas,
      observacao: "O custo da geração em si depende do plano e do tamanho da imagem, e a documentação oficial não publica essa tabela — " +
        "por isso a oficina não inventa um número aqui. No plano Opus, imagem de tamanho normal com até 28 passos não gasta Anlas. " +
        "Os valores acima são os que o manual declara."
    };
  }

  /* =================================================================
     9. Instruções de colagem — para o dia sem token
     ================================================================= */

  function instrucoesDeColagem(mod, base, personagens, indesejado, texto, e) {
    var p = [];
    p.push({ onde: "No alto do site, em Modelo", oque: modelo(mod).nome });
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
      modelo: "v4_5_full",
      base: [it("1girl"), it("best quality")],
      textos: ["olá"]
    });
    casos.push({
      nome: "Propriedade: nada é escrito depois do bloco Text:",
      ok: /\nText: olá$/.test(m.promptCompleto),
      esperado: "o prompt termina em “Text: olá”",
      obtido: JSON.stringify(m.promptCompleto)
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
    podem: podem,
    minimoNum: minimoNum,
    juntar: juntar,
    textoDaTag: textoDaTag,
    blocoTexto: blocoTexto,
    multiplicador: multiplicador,
    descrevePeso: descrevePeso,
    ehContagem: ehContagem,
    montar: montar,
    custo: custo,
    comDestaque: comDestaque,
    autoteste: autoteste,
    recarregar: function () { _cache = null; return acervo(); }
  };
})(window);
