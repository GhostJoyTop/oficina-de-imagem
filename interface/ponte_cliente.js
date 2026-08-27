/* ==========================================================================
   OFICINA DE IMAGEM — o cliente da ponte
   Dono: Construtor B. Fala com os endereços que o Construtor C serve
   (contrato em ponte/PROTOCOLO.md). Nunca escreve em ponte/ nem em dados/.

   Regra de ouro deste arquivo: se a ponte não responde, a oficina NÃO mostra
   erro técnico. Ela cai sozinha no modo seco (só montar e copiar) e explica
   isso em português, uma vez, na faixa amarela do topo.

   O token nunca passa por aqui de volta. O máximo que a ponte devolve é
   "tem_token": true. Este arquivo nunca guarda, nunca imprime e nunca
   registra o valor do token.
   ========================================================================== */

(function (global) {
  "use strict";

  var ESTADO = {
    modo: "seco",          // "seco" | "ligado" | "ligado_com_token"
    base: "",              // origem da ponte; vazio quer dizer "sem ponte"
    temToken: false,
    anlasHoje: 0,
    anlasSessao: 0,
    tetoDia: 300,
    tetoSessao: 100,
    sobraHoje: 0,
    sobraSessao: 0,
    gerando: false,
    // A geração ao vivo nasce DESLIGADA, e é a ponte que manda nisso.
    // Desligada, /api/gerar devolve o ensaio: mostra a chamada e o custo,
    // e não envia nada ao NovelAI. Nenhum Anlas é gasto.
    geracaoAoVivo: false,
    pastaDeTrabalho: "",
    pastaDoCofre: "",     // o caminho POR EXTENSO onde o token mora; a tela mostra este, nunca %APPDATA%
    /* As preferências que a ponte já tem gravadas em disco (tema, ordem,
       plano de assinatura, modelo). Vêm dentro de /api/estado, então a
       tela as conhece antes de qualquer outra chamada. */
    config: null,
    planos: [],
    /* As explicações prontas de "Anlas", "ponte" e "token", que a ponte
       manda em /api/estado. A tela tem as mesmas frases escritas dentro
       dela — precisa ter, porque no modo seco não há ponte nenhuma para
       mandá-las. Quando a ponte manda, a dela vale. */
    palavras: null,
    ultimoErro: "",
    verificado: false,
    /* A diferença entre "nunca houve ponte" e "a ponte caiu no meio" muda o
       conselho que a tela dá, e o conselho errado mandava o autor fazer
       exatamente o que tinha acabado de falhar: sem Python, o .bat abre a
       página e a página dizia "abra pelo arquivo ABRIR A OFICINA" — que foi
       o que o trouxe até ali. */
    jaTevePonte: false
  };

  /* Copia o estado de orçamento que a ponte devolve. Os nomes de campo são
     os do servidor (gasto_hoje, teto_dia…) — este é o único lugar da tela
     que precisa conhecê-los. */
  function absorver(r) {
    if (!r) return;
    if (typeof r.gasto_hoje === "number") ESTADO.anlasHoje = r.gasto_hoje;
    if (typeof r.gasto_sessao === "number") ESTADO.anlasSessao = r.gasto_sessao;
    if (typeof r.teto_dia === "number") ESTADO.tetoDia = r.teto_dia;
    if (typeof r.teto_sessao === "number") ESTADO.tetoSessao = r.teto_sessao;
    if (typeof r.sobra_hoje === "number") ESTADO.sobraHoje = r.sobra_hoje;
    if (typeof r.sobra_sessao === "number") ESTADO.sobraSessao = r.sobra_sessao;
    if (typeof r.gerando === "boolean") ESTADO.gerando = r.gerando;
    if (typeof r.geracao_ao_vivo === "boolean") ESTADO.geracaoAoVivo = r.geracao_ao_vivo;
    if (r.orcamento) absorver(r.orcamento);
  }

  var ouvintes = [];

  function avisar() {
    ouvintes.forEach(function (f) { try { f(ESTADO); } catch (e) { /* um ouvinte quebrado não derruba os outros */ } });
  }

  function aoMudar(f) { ouvintes.push(f); return function () { ouvintes = ouvintes.filter(function (x) { return x !== f; }); }; }

  /* ---------------------------------------------------------------
     Chamada base
     --------------------------------------------------------------- */

  function temPonte() {
    // Página aberta direto do disco não consegue falar com a ponte: o
    // navegador bloqueia por origem cruzada. Nem tentamos, para não
    // encher o console de erro vermelho sem motivo.
    return global.location && global.location.protocol.indexOf("http") === 0;
  }

  function url(caminho) {
    return (ESTADO.base || "") + caminho;
  }

  function chamar(metodo, caminho, corpo, msTimeout) {
    if (!temPonte()) {
      return Promise.resolve({ ok: false, erro: "A oficina está aberta sem a ponte ligada.", semPonte: true });
    }
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, msTimeout || 12000);

    var op = { method: metodo, headers: {} };
    if (ctrl) op.signal = ctrl.signal;
    if (corpo !== undefined && corpo !== null) {
      op.headers["Content-Type"] = "application/json";
      op.body = JSON.stringify(corpo);
    }

    return fetch(url(caminho), op)
      .then(function (r) {
        clearTimeout(t);
        return r.text().then(function (txt) {
          var j;
          try { j = JSON.parse(txt); }
          catch (e) {
            return { ok: false, erro: "A ponte respondeu de um jeito que a oficina não entendeu. Feche a janela preta e abra a oficina de novo." };
          }
          if (typeof j.ok !== "boolean") j.ok = r.ok;
          if (!j.ok && !j.erro) j.erro = "A ponte recusou o pedido, e não disse por quê.";
          return j;
        });
      })
      .catch(function (e) {
        clearTimeout(t);
        var seco = (e && e.name === "AbortError")
          ? "A ponte demorou demais para responder."
          : "A oficina não conseguiu falar com a ponte.";
        cairNoSeco(seco);
        return { ok: false, erro: seco + " Você continua podendo montar o prompt e copiar — só o salvar no disco e o gerar aqui dentro pararam.", semPonte: true };
      });
  }

  function cairNoSeco(motivo) {
    if (ESTADO.modo === "seco") return;
    ESTADO.modo = "seco";
    ESTADO.temToken = false;
    ESTADO.ultimoErro = motivo || "";
    avisar();
  }

  /* ---------------------------------------------------------------
     Descobrir em que modo a oficina está
     --------------------------------------------------------------- */

  function verificar() {
    if (!temPonte()) {
      ESTADO.modo = "seco";
      ESTADO.verificado = true;
      avisar();
      return Promise.resolve(ESTADO);
    }
    ESTADO.base = global.location.origin;
    return chamar("GET", "/api/estado", null, 6000).then(function (r) {
      ESTADO.verificado = true;
      if (!r || !r.ok) { cairNoSeco(r && r.erro ? r.erro : ""); return ESTADO; }
      ESTADO.temToken = !!r.tem_token;
      ESTADO.modo = r.tem_token ? "ligado_com_token" : "ligado";
      ESTADO.pastaDeTrabalho = r.pasta_de_trabalho || "";
      ESTADO.pastaDoCofre = r.pasta_do_cofre || "";
      if (r.config && typeof r.config === "object") ESTADO.config = r.config;
      if (r.palavras && typeof r.palavras === "object") ESTADO.palavras = r.palavras;
      if (Array.isArray(r.planos_que_existem)) ESTADO.planos = r.planos_que_existem.slice();
      ESTADO.jaTevePonte = true;
      absorver(r);
      ESTADO.ultimoErro = "";
      avisar();
      return descobrirGaveta().then(function () { return ESTADO; });
    });
  }

  /* A chave da geração ao vivo. Sem ela ligada, a ponte só faz ensaio.
     Ligar exige token guardado — quem recusa é a ponte, e a recusa dela já
     vem escrita em português. */
  function ligarGeracaoAoVivo(ligar) {
    return chamar("POST", "/api/modo", { geracao_ao_vivo: !!ligar }, 10000)
      .then(function (r) {
        if (r && r.ok) { absorver(r); avisar(); }
        return r;
      });
  }

  function orcamento(tetos) {
    var m = tetos ? "POST" : "GET";
    return chamar(m, "/api/orcamento", tetos || null, 10000).then(function (r) {
      if (r && r.ok) { absorver(r); avisar(); }
      return r;
    });
  }

  /* As preferências do autor, gravadas pela ponte em `meu_trabalho\config.json`.

     Sem argumento, LÊ. Com argumento, GRAVA e devolve o que ficou gravado.
     Elas não dependem da porta — que é o defeito de guardá-las na memória
     do navegador, e a porta muda sozinha (a busca vai de 8760 a 8770). */
  function config(novo) {
    var m = novo ? "POST" : "GET";
    return chamar(m, "/api/config", novo || null, 10000).then(function (r) {
      if (r && r.ok) {
        if (r.config && typeof r.config === "object") ESTADO.config = r.config;
        if (Array.isArray(r.planos_que_existem)) ESTADO.planos = r.planos_que_existem.slice();
        avisar();
      }
      return r;
    });
  }

  /* Pergunta ao NovelAI se o token vale. NÃO GERA IMAGEM e não gasta Anlas:
     a ponte só lê os dados da conta.

     O nome antigo desta coisa na tela era "Teste de 1 imagem", e o texto ao
     lado prometia provar que a ponte estava de pé. Ele não provava: o
     endereço da conta é diferente do endereço da geração, e é o da geração
     que pode quebrar, porque é o que a documentação oficial não publica.
     Hoje são dois botões separados, com o nome do que cada um faz. */
  function testarToken() { return chamar("POST", "/api/testar_token", null, 30000); }

  /* GERA UMA IMAGEM DE PROVA — a mais barata possível.

     Esta função faltava, e a falta era estranha: o endereço existe inteiro do
     lado da ponte (`POST /api/testar_geracao`, com as três portas de
     segurança), está documentado no PROTOCOLO.md como "o botão que gera 1
     imagem de prova de verdade", e a função que monta a chamada mínima
     (`novelai.pedido_de_prova`) só era usada por essa rota órfã. Do lado da
     tela, nada a chamava — o botão trocava de módulo e mostrava um recado.

     Ela é a única prova possível do endereço de GERAÇÃO, que é o único que
     pode quebrar do lado do NovelAI, porque é o que a documentação oficial
     não publica. Testar o token não prova isso: o endereço da conta é outro.

     Duas etapas, como a ponte espera: sem `executar` é ensaio e mostra o
     custo; com `executar` e o custo confirmado, gera. */
  function testarGeracao(executar, custoConfirmado) {
    var corpo = { executar: !!executar };
    if (executar) corpo.custo_confirmado = custoConfirmado;
    return chamar("POST", "/api/testar_geracao", corpo, 180000).then(function (r) {
      if (r) absorver(r);
      avisar();
      return r;
    });
  }

  // Os endereços técnicos que a ponte usaria — todos marcados como não
  // verificados, porque a documentação oficial não os publica.
  function enderecos() { return chamar("GET", "/api/enderecos", null, 10000); }

  /* ---------------------------------------------------------------
     Token — só grava e apaga. Nunca lê o valor de volta.
     --------------------------------------------------------------- */

  function guardarToken(valor) {
    if (!valor || !String(valor).trim()) {
      return Promise.resolve({ ok: false, erro: "O campo do token está vazio." });
    }
    return chamar("POST", "/api/token", { token: String(valor).trim() }, 15000).then(function (r) {
      if (r && r.ok) { ESTADO.temToken = true; ESTADO.modo = "ligado_com_token"; avisar(); }
      return r;
    });
  }

  function apagarToken() {
    return chamar("DELETE", "/api/token", null, 10000).then(function (r) {
      if (r && r.ok) { ESTADO.temToken = false; ESTADO.modo = "ligado"; avisar(); }
      return r;
    });
  }

  /* ---------------------------------------------------------------
     Trabalho salvo em disco
     --------------------------------------------------------------- */

  /* As gavetas do trabalho dele.

     `meus_personagens` está na lista de propósito, e o motivo não é da
     ferramenta: a gaveta chamada `personagens` tem o mesmo nome da pasta
     protegida do livro, e a trava do projeto bloqueia por NOME solto, sem
     olhar o caminho inteiro. Quem tropeça não é o autor — é o próximo
     agente que for consertar a Oficina, que leva um bloqueio ao tentar
     mexer num arquivo que não é do livro.

     Renomear a gaveta é decisão do Construtor C, que é o dono do servidor
     e do PROTOCOLO.md. Então esta tela aceita os dois nomes e DESCOBRE
     sozinha qual existe, perguntando à ponte no arranque. Assim ela
     funciona antes e depois da renomeação, e nenhuma das duas metades
     quebra esperando a outra. */
  var TIPOS = ["personagens", "meus_personagens", "prompts", "exemplos", "referencias", "geradas"];

  var GAVETA_PERSONAGENS = "personagens";

  function tipoValido(t) { return TIPOS.indexOf(t) >= 0; }

  function gavetaDePersonagens() { return GAVETA_PERSONAGENS; }

  function descobrirGaveta() {
    return chamar("GET", "/api/trabalho/meus_personagens", null, 6000).then(function (r) {
      if (r && r.ok) GAVETA_PERSONAGENS = "meus_personagens";
      return GAVETA_PERSONAGENS;
    }, function () { return GAVETA_PERSONAGENS; });
  }

  /* Quem chama pede "personagens" e recebe a gaveta que existe de verdade.
     Um lugar só sabe que existem dois nomes: este arquivo. */
  function gaveta(t) {
    return t === "personagens" ? GAVETA_PERSONAGENS : t;
  }

  function listar(tipo) {
    if (!tipoValido(tipo)) return Promise.resolve({ ok: false, erro: "Tipo de trabalho desconhecido: " + tipo });
    return chamar("GET", "/api/trabalho/" + encodeURIComponent(gaveta(tipo)));
  }

  /* Usa a mesma regra de nome do gravar, e por isso os dois casam: nome sem
     extensão vira .json; nome que já tem extensão passa intacto. */
  function ler(tipo, nome) {
    if (!tipoValido(tipo)) return Promise.resolve({ ok: false, erro: "Tipo de trabalho desconhecido: " + tipo });
    return chamar("GET", caminhoDe(tipo, comExtensao(nome, ".json")));
  }

  /* A ponte exige que o corpo diga QUE ESPÉCIE de coisa está gravando:
     `conteudo` para dado, `texto` para texto puro, `dados_base64` para
     imagem. Mandar o objeto solto faz a ponte recusar o pedido. */
  function gravar(tipo, nome, conteudo) {
    if (!tipoValido(tipo)) return Promise.resolve({ ok: false, erro: "Tipo de trabalho desconhecido: " + tipo });
    return chamar("PUT", caminhoDe(tipo, comExtensao(nome, ".json")), { conteudo: conteudo });
  }

  // O mesmo caminho, para o arquivo legível que o autor abre e lê.
  function gravarTexto(tipo, nome, texto) {
    if (!tipoValido(tipo)) return Promise.resolve({ ok: false, erro: "Tipo de trabalho desconhecido: " + tipo });
    return chamar("PUT", caminhoDe(tipo, nome), { texto: String(texto) });
  }

  function apagar(tipo, nome) {
    if (!tipoValido(tipo)) return Promise.resolve({ ok: false, erro: "Tipo de trabalho desconhecido: " + tipo });
    return chamar("DELETE", caminhoDe(tipo, comExtensao(nome, ".json")));
  }

  function caminhoDe(tipo, nome) {
    return "/api/trabalho/" + encodeURIComponent(gaveta(tipo)) + "/" + encodeURIComponent(nome);
  }

  function comExtensao(nome, ext) {
    var n = String(nome || "");
    return /\.[a-z0-9]{2,5}$/i.test(n) ? n : n + ext;
  }

  /* A imagem viaja como texto (data URL). É o formato que o navegador produz
     ao ler um arquivo solto na tela, e não exige biblioteca nenhuma do outro
     lado. A ponte espera o campo `dados_base64` e aceita o cabeçalho
     "data:image/png;base64," na frente — ela o descarta sozinha. */
  function enviarImagem(tipo, nome, dataUrl, extra) {
    return chamar("POST", "/api/imagem", {
      tipo: gaveta(tipo),
      nome: comExtensao(nome, ".png"),
      dados_base64: dataUrl,
      extra: extra || null
    }, 60000);
  }

  /* ---------------------------------------------------------------
     Leitura do livro — SÓ a lista de nomes de Personagens\
     A ponte nunca devolve o conteúdo dos arquivos, e a oficina nunca
     pede. A aparência dos personagens vem do autor, não do livro.
     --------------------------------------------------------------- */

  function personagensDoLivro() {
    return chamar("GET", "/api/livro/personagens", null, 8000);
  }

  /* ⚠ COMENTÁRIO CORRIGIDO EM 24/08/2026 — o antigo dizia "Hoje o Ateliê a
     usa, ao lado da lista de nomes", e isso nunca foi verdade: nenhuma linha
     de painel.js chama esta função.

     Mais que isso: a ROTA do lado da ponte (`/api/livro/biblia_visual`) foi
     FECHADA de propósito em 23/08/2026 (ver `ponte/servidor.py`, comentário
     acima de `api_custo`). O motivo: um dos três arquivos que ela serve,
     `PADRAO_VISUAL_DEFAULT.md`, descreve a aparência estabelecida do livro —
     e a planta proíbe, com todas as letras, a Oficina puxar aparência dos
     arquivos do livro para dentro de um prompt. Deixar aberta uma rota que
     entrega justamente esse texto era convite ao defeito, mesmo sem nenhuma
     tela chamando.

     Esta função continua aqui, inerte, para o dia em que a rota voltar — e,
     se voltar, ROTA + `PROTOCOLO.md` seção 8 + esta função + a tela que a
     chama têm de mudar juntas, no mesmo dia. Chamá-la hoje só devolve erro,
     porque o outro lado não responde mais. */
  function bibliaVisual(nome) {
    var caminho = "/api/livro/biblia_visual";
    if (nome) caminho += "/" + encodeURIComponent(nome);
    return chamar("GET", caminho, null, 10000);
  }

  /* ---------------------------------------------------------------
     Custo e geração
     --------------------------------------------------------------- */

  function calcularCusto(pedido) {
    return chamar("POST", "/api/custo", { pedido: pedido || {} }, 10000).then(function (r) {
      if (r && r.ok) { absorver(r); avisar(); }
      return r;
    });
  }

  /* Gerar tem três portas, e o pedido passa pelas três ou vira ensaio:
     a geração ao vivo ligada de propósito, `executar: true`, e o custo
     confirmado batendo com a conta da ponte. Chamar sem `custoConfirmado`
     é o ensaio — a oficina mostra a chamada e o custo, e nada é enviado.

     Isto é de propósito: o ensaio é o padrão, e gastar Anlas exige um ato
     deliberado do autor. */
  function ensaiar(pedido) {
    return chamar("POST", "/api/gerar", { pedido: pedido || {}, executar: false }, 60000)
      .then(function (r) { if (r) absorver(r); avisar(); return r; });
  }

  function gerar(pedido, custoConfirmado) {
    if (ESTADO.gerando) {
      return Promise.resolve({ ok: false, erro: "Já existe uma geração em andamento. O NovelAI aceita uma por vez na mesma conta — espere essa terminar." });
    }
    ESTADO.gerando = true; avisar();
    return chamar("POST", "/api/gerar", {
      pedido: pedido || {},
      executar: true,
      custo_confirmado: custoConfirmado
    }, 180000).then(function (r) {
      ESTADO.gerando = false;
      if (r) absorver(r);
      avisar();
      return r;
    }).catch(function () {
      ESTADO.gerando = false; avisar();
      return { ok: false, erro: "A geração falhou e a oficina não recebeu resposta. Nada foi cobrado que a ponte pudesse confirmar." };
    });
  }

  /* ---------------------------------------------------------------
     Frases de estado, em português, para a lâmpada do topo
     --------------------------------------------------------------- */

  function frase() {
    if (ESTADO.modo === "ligado_com_token") {
      return {
        cor: "verde",
        curta: "Oficina ligada, com token",
        longa: ESTADO.geracaoAoVivo
          ? "Tudo funciona: montar, salvar no disco e gerar a imagem aqui dentro. A geração ao vivo está LIGADA — confirmar uma geração gasta Anlas de verdade."
          : "Tudo funciona: montar, salvar no disco e gerar a imagem aqui dentro. A geração ao vivo está desligada, que é o padrão: a oficina mostra a chamada e o custo sem enviar nada. Ligue a chave no Cofre quando quiser gerar de verdade."
      };
    }
    if (ESTADO.modo === "ligado") {
      return {
        cor: "amarelo",
        curta: "Oficina ligada, sem token",
        /* "faz a ponte" saiu daqui de propósito: nesta oficina "a ponte" é
           o nome do programinha da janela preta, e usar a mesma palavra no
           sentido comum, na frase que explica o modo, confunde justamente
           quem mais precisa dela. */
        longa: "Você monta, a oficina ordena e salva no seu disco. A geração da imagem acontece no site do NovelAI, " +
          "e o caminho é o botão Copiar prompt: você copia daqui e cola lá."
      };
    }
    /* Modo seco. Aqui a tela precisa saber QUAL dos secos é este, porque o
       conselho é oposto em cada um.

       ⚠ E são TRÊS casos, não dois. Havia dois, e o segundo dizia uma coisa
       que a tela não tem como saber: "Este computador não tem o Python."

       Ela dizia isso toda vez que a página rodava sem servidor — inclusive
       quando ele abria o Oficina.html com dois cliques, que é exatamente o
       que o LEIA-ME.txt manda fazer quando a janela preta pisca e some. Ou
       seja: o socorro oficial levava a uma tela acusando falta de Python numa
       máquina com Python 3.14.4 instalado. Um leigo acredita, e sai atrás de
       instalar Python — o único passo que esta ferramenta inteira foi
       desenhada para ele nunca precisar dar.

       A tela sabe UMA coisa: se o endereço começa com `file:`, a página foi
       aberta direto do arquivo. Isso ela pode afirmar. Se o Python existe ou
       não, quem sabe é o .bat, e ele não conta para cá. */
    if (ESTADO.jaTevePonte) {
      return {
        cor: "vermelho",
        curta: "A oficina foi desligada",
        caso: "caiu",
        longa: "A oficina foi desligada — a janela preta foi fechada. O que você fez até agora já está salvo no disco. " +
          "Dê dois cliques no ABRIR A OFICINA de novo para voltar a salvar. Enquanto isso, montar o prompt e copiar continua funcionando."
      };
    }
    var doArquivo = !!(global.location && String(global.location.protocol).indexOf("file") === 0);
    if (doArquivo) {
      return {
        cor: "vermelho",
        curta: "Oficina no modo simples",
        caso: "do_arquivo",
        longa: "Esta página foi aberta direto do arquivo, sem a janela preta. Assim tudo funciona menos salvar no seu disco: " +
          "montar o prompt, pôr as tags na ordem, ver as explicações e os desenhos, e avisar dos conflitos, tudo continua. " +
          "Use Copiar prompt para levar ao site do NovelAI, e Baixar meu trabalho antes de fechar a aba. " +
          "Para voltar a salvar no disco, feche esta aba e abra pelo ABRIR A OFICINA."
      };
    }
    return {
      cor: "vermelho",
      curta: "Oficina no modo simples",
      caso: "sem_ponte",
      longa: "A oficina está sem a janela preta, que é a parte que salva no seu disco. Tudo aqui funciona assim mesmo: " +
        "montar o prompt, pôr as tags na ordem, ver as explicações e os desenhos, e avisar dos conflitos. " +
        "O botão Copiar prompt é o caminho normal — cole no site do NovelAI. Use o Baixar meu trabalho antes de fechar a aba."
    };
  }

  global.Ponte = {
    estado: function () { return ESTADO; },
    aoMudar: aoMudar,
    verificar: verificar,
    temPonte: temPonte,
    guardarToken: guardarToken,
    apagarToken: apagarToken,
    listar: listar,
    ler: ler,
    gravar: gravar,
    gravarTexto: gravarTexto,
    apagar: apagar,
    enviarImagem: enviarImagem,
    endereco: caminhoDe,
    gavetaDePersonagens: gavetaDePersonagens,
    personagensDoLivro: personagensDoLivro,
    bibliaVisual: bibliaVisual,
    calcularCusto: calcularCusto,
    ensaiar: ensaiar,
    gerar: gerar,
    ligarGeracaoAoVivo: ligarGeracaoAoVivo,
    orcamento: orcamento,
    config: config,
    testarToken: testarToken,
    testarGeracao: testarGeracao,
    enderecos: enderecos,
    frase: frase,
    tipos: function () { return TIPOS.slice(); }
  };
})(window);
