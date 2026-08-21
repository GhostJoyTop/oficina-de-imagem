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
    gerando: false,
    ultimoErro: "",
    verificado: false
  };

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
      if (typeof r.anlas_hoje === "number") ESTADO.anlasHoje = r.anlas_hoje;
      if (typeof r.anlas_sessao === "number") ESTADO.anlasSessao = r.anlas_sessao;
      if (typeof r.teto_dia === "number") ESTADO.tetoDia = r.teto_dia;
      if (typeof r.teto_sessao === "number") ESTADO.tetoSessao = r.teto_sessao;
      ESTADO.gerando = !!r.gerando;
      ESTADO.ultimoErro = "";
      avisar();
      return ESTADO;
    });
  }

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

  var TIPOS = ["personagens", "prompts", "exemplos", "referencias", "geradas"];

  function tipoValido(t) { return TIPOS.indexOf(t) >= 0; }

  function listar(tipo) {
    if (!tipoValido(tipo)) return Promise.resolve({ ok: false, erro: "Tipo de trabalho desconhecido: " + tipo });
    return chamar("GET", "/api/trabalho/" + encodeURIComponent(tipo));
  }

  function ler(tipo, nome) {
    if (!tipoValido(tipo)) return Promise.resolve({ ok: false, erro: "Tipo de trabalho desconhecido: " + tipo });
    return chamar("GET", "/api/trabalho/" + encodeURIComponent(tipo) + "/" + encodeURIComponent(nome));
  }

  function gravar(tipo, nome, conteudo) {
    if (!tipoValido(tipo)) return Promise.resolve({ ok: false, erro: "Tipo de trabalho desconhecido: " + tipo });
    return chamar("PUT", "/api/trabalho/" + encodeURIComponent(tipo) + "/" + encodeURIComponent(nome), conteudo);
  }

  function apagar(tipo, nome) {
    if (!tipoValido(tipo)) return Promise.resolve({ ok: false, erro: "Tipo de trabalho desconhecido: " + tipo });
    return chamar("DELETE", "/api/trabalho/" + encodeURIComponent(tipo) + "/" + encodeURIComponent(nome));
  }

  // A imagem viaja como texto (data URL). É o formato que o navegador
  // produz ao ler um arquivo solto na tela, e não exige biblioteca nenhuma
  // do outro lado.
  function enviarImagem(tipo, nome, dataUrl, extra) {
    return chamar("POST", "/api/imagem", {
      tipo: tipo, nome: nome, dados: dataUrl, extra: extra || null
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

  /* ---------------------------------------------------------------
     Custo e geração
     --------------------------------------------------------------- */

  function calcularCusto(pedido) {
    return chamar("POST", "/api/custo", pedido, 10000);
  }

  function gerar(pedido) {
    if (ESTADO.gerando) {
      return Promise.resolve({ ok: false, erro: "Já existe uma geração em andamento. O NovelAI aceita uma por vez na mesma conta — espere essa terminar." });
    }
    ESTADO.gerando = true; avisar();
    return chamar("POST", "/api/gerar", pedido, 180000).then(function (r) {
      ESTADO.gerando = false;
      if (r && typeof r.anlas_hoje === "number") ESTADO.anlasHoje = r.anlas_hoje;
      if (r && typeof r.anlas_sessao === "number") ESTADO.anlasSessao = r.anlas_sessao;
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
        longa: "Tudo funciona: montar, salvar no disco e gerar a imagem aqui dentro."
      };
    }
    if (ESTADO.modo === "ligado") {
      return {
        cor: "amarelo",
        curta: "Oficina ligada, sem token",
        longa: "Você monta, a oficina ordena e salva no seu disco. A geração da imagem acontece no site do NovelAI — o botão Copiar prompt faz a ponte."
      };
    }
    return {
      cor: "vermelho",
      curta: "Oficina seca",
      longa: "A oficina está aberta sem a ponte. Ela monta o prompt, ordena, explica e avisa dos conflitos — mas o trabalho fica só na memória do navegador. Para salvar no disco, feche esta aba e abra pelo arquivo ABRIR A OFICINA."
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
    apagar: apagar,
    enviarImagem: enviarImagem,
    personagensDoLivro: personagensDoLivro,
    calcularCusto: calcularCusto,
    gerar: gerar,
    frase: frase,
    tipos: function () { return TIPOS.slice(); }
  };
})(window);
