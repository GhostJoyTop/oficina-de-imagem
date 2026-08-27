/* ==========================================================================
   OFICINA DE IMAGEM — onde o trabalho do autor fica
   Dono: Construtor B.

   Duas situações, e a tela sempre diz em qual está:

   1) Ponte ligada  — grava em disco, pelos endereços do Construtor C, a cada
      mudança. Não existe botão "salvar" para o autor esquecer de clicar.

   2) Ponte desligada (modo seco) — grava na memória do navegador, e a faixa
      amarela do topo fica lá, permanente, com o botão "Baixar meu trabalho".
      Este não é o modo bom, e a tela diz isso.

   Nada aqui escreve em pasta do livro. O caminho de escrita é só o que a
   ponte permite, dentro de meu_trabalho\.
   ========================================================================== */

(function (global) {
  "use strict";

  var PREFIXO = "oficina:";
  var memRAM = {};          // último recurso, se nem o navegador guardar
  var localOk = true;

  try {
    global.localStorage.setItem(PREFIXO + "_teste", "1");
    global.localStorage.removeItem(PREFIXO + "_teste");
  } catch (e) {
    localOk = false;
  }

  function seco() {
    return !global.Ponte || global.Ponte.estado().modo === "seco";
  }

  /* ---------------------------------------------------------------
     Guarda local
     --------------------------------------------------------------- */

  function guardaLer(chave) {
    if (!localOk) return Object.prototype.hasOwnProperty.call(memRAM, chave) ? memRAM[chave] : null;
    try {
      var v = global.localStorage.getItem(PREFIXO + chave);
      return v === null ? null : JSON.parse(v);
    } catch (e) { return null; }
  }

  function guardaGravar(chave, valor) {
    if (!localOk) { memRAM[chave] = valor; return { ok: true, memoriaVolatil: true }; }
    try {
      global.localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
      return { ok: true };
    } catch (e) {
      // quase sempre é a cota do navegador estourando por causa de imagem
      return {
        ok: false,
        erro: "A memória do navegador encheu. Clique em “Baixar meu trabalho”, guarde o arquivo, " +
          "e depois abra a oficina pelo arquivo ABRIR A OFICINA para gravar direto no disco."
      };
    }
  }

  function guardaApagar(chave) {
    if (!localOk) { delete memRAM[chave]; return; }
    try { global.localStorage.removeItem(PREFIXO + chave); } catch (e) { /* nada a fazer */ }
  }

  function guardaChaves(prefixo) {
    var out = [];
    if (!localOk) {
      for (var k in memRAM) {
        if (Object.prototype.hasOwnProperty.call(memRAM, k) && k.indexOf(prefixo) === 0) out.push(k);
      }
      return out;
    }
    try {
      for (var i = 0; i < global.localStorage.length; i++) {
        var ch = global.localStorage.key(i);
        if (ch && ch.indexOf(PREFIXO + prefixo) === 0) out.push(ch.slice(PREFIXO.length));
      }
    } catch (e) { /* nada a fazer */ }
    return out;
  }

  /* ---------------------------------------------------------------
     Salvar / ler / listar / apagar — a mesma porta nos dois modos
     --------------------------------------------------------------- */

  function salvar(tipo, nome, conteudo) {
    var pacote = Object.assign({}, conteudo, {
      versao_formato: (conteudo && conteudo.versao_formato) || "1.0.0",
      salvo_em: new Date().toISOString()
    });
    if (!seco()) {
      return global.Ponte.gravar(tipo, nome, pacote).then(function (r) {
        if (r && r.ok) return { ok: true, onde: "disco" };
        // a ponte caiu no meio: não perde o trabalho, guarda local
        var g = guardaGravar(tipo + "/" + nome, pacote);
        return { ok: g.ok, onde: "navegador", erro: r && r.erro ? r.erro : g.erro };
      });
    }
    var g2 = guardaGravar(tipo + "/" + nome, pacote);
    return Promise.resolve({ ok: g2.ok, onde: "navegador", erro: g2.erro, memoriaVolatil: g2.memoriaVolatil });
  }

  function ler(tipo, nome) {
    if (!seco()) {
      return global.Ponte.ler(tipo, nome).then(function (r) {
        if (r && r.ok) return { ok: true, conteudo: r.conteudo !== undefined ? r.conteudo : r.dados };
        var loc = guardaLer(tipo + "/" + nome);
        return loc ? { ok: true, conteudo: loc, onde: "navegador" } : { ok: false, erro: r && r.erro };
      });
    }
    var v = guardaLer(tipo + "/" + nome);
    return Promise.resolve(v ? { ok: true, conteudo: v } : { ok: false, erro: "Não achei “" + nome + "” guardado." });
  }

  function listar(tipo) {
    var locais = guardaChaves(tipo + "/").map(function (k) {
      return { nome: k.slice((tipo + "/").length), onde: "navegador" };
    });
    if (!seco()) {
      return global.Ponte.listar(tipo).then(function (r) {
        if (!r || !r.ok) return locais;
        var doDisco = (r.itens || r.lista || []).map(function (x) {
          if (typeof x === "string") return { nome: x, onde: "disco" };
          return {
            nome: x.nome,
            onde: "disco",
            quando: x.modificado || x.quando || "",
            bytes: x.bytes,
            endereco: x.endereco || "",
            extra: x
          };
        });
        var vistos = {};
        var junto = [];
        doDisco.concat(locais).forEach(function (it) {
          if (vistos[it.nome]) return;
          vistos[it.nome] = 1;
          junto.push(it);
        });
        return junto;
      });
    }
    return Promise.resolve(locais);
  }

  function apagar(tipo, nome) {
    guardaApagar(tipo + "/" + nome);
    if (!seco()) return global.Ponte.apagar(tipo, nome);
    return Promise.resolve({ ok: true });
  }

  /* ---------------------------------------------------------------
     O rascunho da Bancada — o que ele está montando agora.

     Grava sozinho, com um respiro de meio segundo entre gravações, para
     não escrever no disco a cada clique.

     ⚠ A TRAVA DE DISCO, e por que ela existe.

     Aconteceu de verdade, e sem ninguém tentar: a Oficina abriu numa porta
     nova (a busca de porta vai de 8760 a 8770, então a porta muda sozinha
     quando a anterior está ocupada), a memória do navegador veio vazia
     porque ela é presa ao endereço, e o autor clicou em duas tags nos
     primeiros segundos. Meio segundo depois este gravador automático
     escreveu essas duas tags por cima de um rascunho de catorze que estava
     no disco. Sem aviso, sem cópia e sem desfazer.

     A correção tem duas partes. Aqui: enquanto a leitura do disco não
     tiver respondido, NADA é escrito no disco — só na memória do
     navegador, que é barata e não destrói nada. Do outro lado, no painel:
     a Bancada fica travada até a leitura terminar, e o autor é quem decide
     se recupera. Além disso, antes da primeira sobrescrita de cada sessão,
     o conteúdo que estava no disco é copiado para um arquivo com data e
     hora no nome — sobrescrever deixou de ser perda definitiva.
     --------------------------------------------------------------- */

  var pendente = null, timer = null, aoGravar = null;
  var discoTravado = false;
  var esperandoDestrava = null;
  /* As duas chaves `ultima_copia` e `assinatura_copia` continuam sendo
     gravadas na guarda do navegador, e hoje servem só de registro: quem
     decide se uma cópia datada nasce é a ponte, que compara o conteúdo
     contra todas as cópias que já estão no disco. A tela não tem mais
     freio próprio, porque não escreve mais cópia própria. */

  function travarDisco(travar) {
    discoTravado = !!travar;
    if (!discoTravado && esperandoDestrava) {
      var e = esperandoDestrava;
      esperandoDestrava = null;
      gravarRascunhoAgora(e);
    }
  }

  function discoEstaTravado() { return discoTravado; }

  /* ⚠ A CÓPIA DATADA TEM UM DONO SÓ, E ELE É A PONTE (rodada 2).

     Antes havia dois donos. A ponte guardava a cópia do estado anterior toda
     vez que `_rascunho_atual.json` era trocado, com a hora até o segundo e uma
     regra que recusa cópia de conteúdo repetido. E a TELA, aqui, escrevia
     cópias por conta própria, com outro formato de nome (sem o segundo) e sem
     passar por aquela regra — porque a regra da ponte só roda para o nome
     `_rascunho_atual.json`.

     Três estragos medidos, os três no disco do autor:

       1. Dois formatos de nome lado a lado no Álbum, e ele lendo
          "2026-08-23 às 154408" e "2026-08-23 às 1544" na mesma lista.
       2. Cópias idênticas: três arquivos com o mesmo md5 ao mesmo tempo,
          ocupando duas das doze vagas e empurrando para fora as cópias
          antigas — que são justamente as que servem para voltar atrás.
       3. Duas cópias forçadas no mesmo minuto se sobrescreviam em silêncio,
          porque o nome da tela não tinha segundo.

     Hoje a tela não escreve mais `_rascunho_<data>`. Ela tem `pontoDeVolta`,
     que grava no `_rascunho_atual.json` — e é a PONTE que, ao receber essa
     troca, guarda o estado anterior como cópia datada, deduplicada e com o
     segundo no nome. Um dono, um formato, uma regra. */

  /* Assinatura barata do conteúdo, só para saber se ele mudou. Não precisa
     ser à prova de colisão: o preço de errar é uma escrita a mais no disco,
     nunca uma cópia a menos. */
  function assinaturaDe(conteudo) {
    var t;
    try { t = JSON.stringify(conteudo); } catch (e) { return null; }
    if (typeof t !== "string") return null;
    var h = 5381;
    for (var i = 0; i < t.length; i++) { h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; }
    return t.length + ":" + h;
  }

  /* PONTO DE VOLTA — grava `conteudo` como o rascunho atual, fora da fila do
     gravador automático e mesmo com o disco travado.

     Serve a um caso só, e é o do painel: antes de perguntar ao autor com qual
     versão ele fica, o que está na TELA vai para o disco. Com isso a ponte
     guarda o que estava lá antes (a versão do disco) como cópia datada, e a
     versão da tela fica em `_rascunho_atual.json` — de onde ela também vira
     cópia datada assim que alguma outra a substituir. Nenhuma das duas fica
     sem ponto de volta.

     Devolve a resposta da ponte, que traz `copia_do_anterior` com o nome do
     arquivo guardado. O painel só escreve "nada se perde" depois de ver isso. */
  function pontoDeVolta(conteudo) {
    if (seco() || !conteudo) return Promise.resolve({ ok: false, motivo: "sem ponte" });
    var assin = assinaturaDe(conteudo);
    if (assin) guardaGravar("assinatura_copia", assin);
    guardaGravar("ultima_copia", Date.now());
    return global.Ponte.gravar("prompts", "_rascunho_atual", conteudo);
  }

  function gravarRascunhoAgora(e) {
    guardaGravar("rascunho", e);             // navegador: barato e instantâneo
    if (seco()) { if (aoGravar) aoGravar("navegador"); return; }
    if (discoTravado) {
      esperandoDestrava = e;                 // segura até a leitura do disco responder
      if (aoGravar) aoGravar("navegador");
      return;
    }
    /* Nenhuma cópia datada é escrita daqui. Esta gravação já produz uma, do
       lado da ponte, com o estado que ela substitui. */
    global.Ponte.gravar("prompts", "_rascunho_atual", e).then(function (r) {
      if (aoGravar) aoGravar(r && r.ok ? "disco" : "navegador");
    });
  }

  function rascunho(estado) {
    pendente = estado;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      timer = null;
      var e = pendente; pendente = null;
      gravarRascunhoAgora(e);
    }, 500);
  }

  function lerRascunho() { return guardaLer("rascunho"); }

  function apagarRascunhoLocal() { guardaApagar("rascunho"); }

  /* ---------------------------------------------------------------
     Exemplo visual de uma tag — a imagem que o AUTOR solta.

     A oficina nunca inventa imagem de exemplo: este é o único caminho pelo
     qual uma imagem vira exemplo de uma tag. É a exigência 5 dele.

     ⚠ ONDE MORA A LIGAÇÃO TAG → ARQUIVO, e por que mudou.

     Ela morava só na memória do navegador. Essa memória é presa ao
     ENDEREÇO da página, e o endereço inclui a porta — que muda sozinha
     quando a anterior está ocupada. Resultado medido: um exemplo guardado
     na porta 8760 sumia da tela na porta 8764, embora o arquivo
     continuasse no disco. Pior: o Álbum listava o arquivo ("está no
     disco") enquanto a ficha da tag mostrava o quadrado vazio "solte aqui
     uma imagem sua". A mesma tela se contradizendo.

     Hoje a ligação vive em três lugares, do mais forte para o mais fraco:

     1. O PRÓPRIO NOME DO ARQUIVO. O acervo dá a cada tag um `exemplo.ref`
        (por exemplo `est_watercolor_medium.png`), e é esse o nome usado na
        gravação. Então a lista de arquivos da gaveta `exemplos` já é o
        índice: se o arquivo está lá, o exemplo existe. Isso não depende de
        índice nenhum e sobrevive a tudo, inclusive a apagar o navegador.
     2. `meu_trabalho\exemplos\_indice.json`, no disco, que guarda também a
        data e o nome original do arquivo que ele soltou.
     3. A memória do navegador, que agora é só cópia de emergência, para o
        modo sem ponte.
     --------------------------------------------------------------- */

  var NOME_DO_INDICE = "_indice";
  var indiceExemplos = {};      // idTag -> { arquivo, onde, quando }
  var arquivosDeExemplo = {};   // nomeDoArquivo -> true
  var exemplosCarregados = false;

  /* Lê o índice do disco e a lista de arquivos da gaveta. Chamada uma vez,
     no arranque, ANTES de a tela desenhar os quadrados de exemplo. */
  function carregarExemplos() {
    indiceExemplos = guardaLer("exemplos_indice") || {};
    if (seco()) { exemplosCarregados = true; return Promise.resolve(indiceExemplos); }

    return Promise.all([
      global.Ponte.listar("exemplos"),
      global.Ponte.ler("exemplos", NOME_DO_INDICE)
    ]).then(function (r) {
      var lista = r[0], idx = r[1];
      arquivosDeExemplo = {};
      if (lista && lista.ok) {
        (lista.itens || []).forEach(function (x) {
          var nome = typeof x === "string" ? x : x.nome;
          if (nome) arquivosDeExemplo[nome] = true;
        });
      }
      /* O arquivo de índice pode chegar com a lista sob `tags` ou sob
         `por_tag`: o servidor da ponte cria o arquivo vazio com o segundo
         nome, e esta tela nasceu escrevendo o primeiro. Ler os dois custa
         uma linha, e evita que o álbum de exemplos suma por causa de um
         nome de campo. Na gravação os dois são escritos, pelo mesmo
         motivo. */
      var doDisco = idx && idx.ok && idx.conteudo
        ? (idx.conteudo.tags || idx.conteudo.por_tag)
        : null;
      if (doDisco) {
        Object.keys(doDisco).forEach(function (k) { indiceExemplos[k] = doDisco[k]; });
      }
      guardaGravar("exemplos_indice", indiceExemplos);
      exemplosCarregados = true;
      return indiceExemplos;
    }, function () { exemplosCarregados = true; return indiceExemplos; });
  }

  function gravarIndiceNoDisco() {
    if (seco()) return Promise.resolve({ ok: false });
    return global.Ponte.gravar("exemplos", NOME_DO_INDICE, {
      versao_formato: "1.0.0",
      _leia: "Cada linha liga o identificador de uma tag ao arquivo de imagem que você soltou como exemplo dela. " +
        "Este arquivo mora no disco de propósito: a memória do navegador se perde quando a oficina abre noutra porta.",
      tags: indiceExemplos,
      por_tag: indiceExemplos
    });
  }

  function guardarExemplo(idTag, nomeArquivo, dataUrl) {
    var nome = nomeArquivo || (idTag + ".png");
    var reg = { tag: idTag, arquivo: nome, quando: new Date().toISOString() };
    if (!seco()) {
      return global.Ponte.enviarImagem("exemplos", nome, dataUrl, reg)
        .then(function (r) {
          if (r && r.ok) {
            var nomeGravado = r.nome || nome;
            arquivosDeExemplo[nomeGravado] = true;
            indiceExemplos[idTag] = { arquivo: nomeGravado, onde: "disco", quando: reg.quando };
            guardaGravar("exemplos_indice", indiceExemplos);
            gravarIndiceNoDisco();
            return { ok: true, onde: "disco", arquivo: nomeGravado };
          }
          return guardarExemploLocal(idTag, nome, dataUrl);
        });
    }
    return guardarExemploLocal(idTag, nome, dataUrl);
  }

  function guardarExemploLocal(idTag, nomeArquivo, dataUrl) {
    return reduzir(dataUrl, 620).then(function (menor) {
      var g = guardaGravar("exemplo/" + idTag, { arquivo: nomeArquivo, dados: menor, quando: new Date().toISOString() });
      if (!g.ok) return { ok: false, erro: g.erro };
      indiceExemplos[idTag] = { arquivo: nomeArquivo, onde: "navegador", quando: new Date().toISOString() };
      guardaGravar("exemplos_indice", indiceExemplos);
      return { ok: true, onde: "navegador" };
    });
  }

  /* O arquivo de disco que corresponde a esta tag, se houver.
     `ref` é o `exemplo.ref` que o acervo declara — e ele é a chave forte. */
  function arquivoDoExemplo(idTag, ref) {
    var reg = indiceExemplos[idTag];
    if (reg && reg.onde === "disco" && arquivosDeExemplo[reg.arquivo]) return reg.arquivo;
    if (ref && arquivosDeExemplo[ref]) {
      // conserto sozinho: o arquivo está lá e o índice não sabia
      indiceExemplos[idTag] = { arquivo: ref, onde: "disco", quando: "" };
      guardaGravar("exemplos_indice", indiceExemplos);
      return ref;
    }
    return null;
  }

  /* Devolve como MOSTRAR o exemplo, não os bytes dele.

     Imagem guardada em disco não volta como texto: a ponte responde os bytes
     crus, e tentar lê-los como dado quebraria. Então, para o que está no
     disco, devolvemos o endereço — a tela põe direto no `src` da imagem, que
     é o que o navegador faz melhor. Para o que está no navegador, devolvemos
     os dados embutidos. Quem chama trata os dois iguais: usa `url`. */
  function lerExemplo(idTag, ref) {
    var arq = seco() ? null : arquivoDoExemplo(idTag, ref);
    if (arq && global.Ponte.endereco) {
      return Promise.resolve({
        ok: true,
        url: global.Ponte.endereco("exemplos", arq),
        onde: "disco",
        arquivo: arq
      });
    }
    var local = guardaLer("exemplo/" + idTag);
    if (local && local.dados) {
      return Promise.resolve({ ok: true, url: local.dados, dados: local.dados, onde: "navegador", arquivo: local.arquivo });
    }
    return Promise.resolve({ ok: false });
  }

  /* Apagar apaga MESMO, inclusive o arquivo no disco.

     Sem isso, o conserto automático de `arquivoDoExemplo` ressuscitaria a
     imagem no clique seguinte: o índice esqueceria, o arquivo continuaria
     lá, e a tag voltaria a mostrar a imagem que ele acabou de mandar
     apagar. */
  function apagarExemplo(idTag, ref) {
    guardaApagar("exemplo/" + idTag);
    var reg = indiceExemplos[idTag];
    var arq = (reg && reg.arquivo) || ref || null;
    delete indiceExemplos[idTag];
    guardaGravar("exemplos_indice", indiceExemplos);
    if (seco() || !arq) return Promise.resolve({ ok: true });
    delete arquivosDeExemplo[arq];
    gravarIndiceNoDisco();
    return global.Ponte.apagar("exemplos", arq).then(function () { return { ok: true }; },
      function () { return { ok: true }; });
  }

  function temExemplo(idTag, ref) {
    if (!seco() && arquivoDoExemplo(idTag, ref)) return true;
    if (guardaLer("exemplo/" + idTag)) return true;
    var reg = indiceExemplos[idTag];
    return !!(reg && reg.onde === "navegador");
  }

  function exemplosProntos() { return exemplosCarregados; }

  /* ---------------------------------------------------------------
     Reduzir imagem antes de guardar no navegador — senão a memória
     do navegador enche com três fotos.
     --------------------------------------------------------------- */

  function reduzir(dataUrl, maxLado) {
    return new Promise(function (resolve) {
      try {
        var img = new Image();
        img.onload = function () {
          var w = img.naturalWidth, h = img.naturalHeight;
          if (Math.max(w, h) <= maxLado) { resolve(dataUrl); return; }
          var s = maxLado / Math.max(w, h);
          var c = document.createElement("canvas");
          c.width = Math.round(w * s); c.height = Math.round(h * s);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          try { resolve(c.toDataURL("image/jpeg", 0.86)); }
          catch (e) { resolve(dataUrl); }
        };
        img.onerror = function () { resolve(dataUrl); };
        img.src = dataUrl;
      } catch (e) { resolve(dataUrl); }
    });
  }

  /* ---------------------------------------------------------------
     Ler um arquivo que o autor soltou na tela
     --------------------------------------------------------------- */

  function lerArquivo(file) {
    return new Promise(function (resolve, reject) {
      if (!file) { reject(new Error("Nenhum arquivo.")); return; }
      if (!/^image\//.test(file.type)) {
        reject(new Error("“" + file.name + "” não é uma imagem. A oficina aceita PNG, JPG e WEBP."));
        return;
      }
      var fr = new FileReader();
      fr.onload = function () { resolve({ nome: file.name, tipo: file.type, dados: fr.result, tamanho: file.size }); };
      fr.onerror = function () { reject(new Error("Não consegui ler “" + file.name + "”. Tente arrastar de novo.")); };
      fr.readAsDataURL(file);
    });
  }

  /* ---------------------------------------------------------------
     Baixar tudo — o botão que existe justamente porque o modo seco
     não é confiável.
     --------------------------------------------------------------- */

  function tudo() {
    var pacote = {
      formato: "oficina-de-imagem/backup",
      versao_formato: "1.0.0",
      quando: new Date().toISOString(),
      itens: {}
    };
    guardaChaves("").forEach(function (k) {
      if (k === "_teste") return;
      pacote.itens[k] = guardaLer(k);
    });
    return pacote;
  }

  function baixarTudo() {
    var txt = JSON.stringify(tudo(), null, 2);
    var blob = new Blob([txt], { type: "application/json;charset=utf-8" });
    var a = document.createElement("a");
    var d = new Date();
    var carimbo = d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0") + "_" +
      String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0");
    a.href = URL.createObjectURL(blob);
    a.download = "oficina_meu_trabalho_" + carimbo + ".json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  function restaurarDeArquivo(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var p = JSON.parse(fr.result);
          if (!p || p.formato !== "oficina-de-imagem/backup") {
            reject(new Error("Este arquivo não é um backup da Oficina."));
            return;
          }
          var n = 0;
          Object.keys(p.itens || {}).forEach(function (k) { guardaGravar(k, p.itens[k]); n += 1; });
          resolve({ ok: true, quantos: n });
        } catch (e) { reject(new Error("Não consegui ler esse arquivo de backup.")); }
      };
      fr.onerror = function () { reject(new Error("Não consegui abrir o arquivo.")); };
      fr.readAsText(file, "utf-8");
    });
  }

  /* ---------------------------------------------------------------
     Baixar um texto qualquer (o prompt, a ficha em .md)
     --------------------------------------------------------------- */

  function baixarTexto(nomeArquivo, texto, tipoMime) {
    var blob = new Blob([texto], { type: (tipoMime || "text/plain") + ";charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  /* ---------------------------------------------------------------
     As preferências dele — tema, modo de ordem, plano de assinatura.

     Elas moram em `meu_trabalho\config.json`, servido pelo endereço
     `/api/config` da ponte. O motivo de não morarem na memória do
     navegador: essa memória é presa ao endereço, e o endereço inclui a
     PORTA. A porta muda sozinha (a busca vai de 8760 a 8770), e com ela ia
     embora o tema, o modo de ordem e o plano de assinatura dele.

     Há um caminho de recuo, e ele existe por um motivo concreto: numa
     versão anterior desta oficina o contrato da ponte ainda não tinha
     `/api/config`, e as preferências foram gravadas num arquivo dentro da
     gaveta `prompts`. Quem abrir a oficina de hoje com aquele arquivo no
     disco não pode perder o que já escolheu. Então a leitura junta os
     dois, com o `/api/config` mandando, e a gravação escreve no endereço
     novo — o arquivo velho fica para trás sozinho, sem nada quebrar.
     --------------------------------------------------------------- */

  // o nome antigo, na gaveta `prompts`; só é LIDO, nunca mais escrito
  var CONFIG_ANTIGA = "_config_oficina";

  function lerConfig() {
    var local = guardaLer("config") || {};
    if (seco()) return Promise.resolve(local);

    /* 1) o arquivo antigo, se existir — é o piso.

       A oficina PERGUNTA se ele está lá antes de pedi-lo. Pedir direto
       custava um erro 400 vermelho no console do navegador em TODA abertura,
       porque na esmagadora maioria das máquinas esse arquivo nunca existiu —
       ele só aparece em quem usou uma versão antiga desta oficina. O erro não
       quebrava nada (a recusa já era tratada aqui embaixo), mas erro vermelho
       de rotina ensina a ignorar erro vermelho, e um dia o que aparece ali é
       de verdade. A listagem da gaveta é uma chamada que já é normal e
       responde 200 sempre. */
    var velha = global.Ponte.listar("prompts").then(function (lista) {
      var itens = (lista && lista.ok && lista.itens) || [];
      var achou = itens.some(function (i) {
        return i && String(i.nome).toLowerCase() === CONFIG_ANTIGA + ".json";
      });
      if (!achou) return {};
      return global.Ponte.ler("prompts", CONFIG_ANTIGA).then(function (r) {
        return (r && r.ok && r.conteudo) ? r.conteudo : {};
      }, function () { return {}; });
    }, function () { return {}; });

    // 2) o endereço do contrato — manda sobre tudo
    var nova = (global.Ponte.config
      ? global.Ponte.config().then(function (r) {
        return (r && r.ok && r.config) ? r.config : null;
      }, function () { return null; })
      : Promise.resolve(null));

    return Promise.all([velha, nova]).then(function (par) {
      var junta = Object.assign({}, local, par[0] || {});
      // a ponte sem /api/config devolve nulo: aí vale o que já havia
      if (par[1]) junta = Object.assign(junta, par[1]);
      return junta;
    });
  }

  function gravarConfig(cfg) {
    guardaGravar("config", cfg);
    if (seco()) return Promise.resolve({ ok: true, onde: "navegador" });
    if (!global.Ponte.config) {
      // ponte velha, sem o endereço do contrato: o arquivo antigo serve
      return global.Ponte.gravar("prompts", CONFIG_ANTIGA, cfg);
    }
    return global.Ponte.config(cfg).then(function (r) {
      if (r && r.ok) return r;
      // o endereço não existe nesta ponte — grava onde dá, e não some nada
      return global.Ponte.gravar("prompts", CONFIG_ANTIGA, cfg);
    }, function () {
      return global.Ponte.gravar("prompts", CONFIG_ANTIGA, cfg);
    });
  }

  /* ---------------------------------------------------------------
     Trazer de volta, como texto embutido, uma imagem que está no disco.

     É o que permite a referência sobreviver a fechar a aba: a imagem fica
     gravada na gaveta `referencias`, e no dia seguinte a oficina a lê de
     lá e a devolve para dentro do pedido de geração. Sem isso, referência
     recuperada do trabalho salvo era só um nome de arquivo, e o autor
     pagaria por uma referência que nunca viajaria.
     --------------------------------------------------------------- */

  function imagemDoDisco(tipo, nome) {
    if (seco() || !global.Ponte || !global.Ponte.endereco) {
      return Promise.resolve({ ok: false, erro: "A ponte não está ligada." });
    }
    return fetch(global.Ponte.endereco(tipo, nome))
      .then(function (r) {
        if (!r.ok) throw new Error("não achei");
        return r.blob();
      })
      .then(function (blob) {
        return new Promise(function (resolve) {
          var fr = new FileReader();
          fr.onload = function () { resolve({ ok: true, dados: fr.result, nome: nome }); };
          fr.onerror = function () { resolve({ ok: false, erro: "Não consegui ler a imagem guardada." }); };
          fr.readAsDataURL(blob);
        });
      })
      .catch(function () {
        return { ok: false, erro: "Não achei “" + nome + "” na pasta meu_trabalho. Solte o arquivo de novo." };
      });
  }

  global.Memoria = {
    seco: seco,
    localDisponivel: function () { return localOk; },
    salvar: salvar,
    ler: ler,
    listar: listar,
    apagar: apagar,
    rascunho: rascunho,
    lerRascunho: lerRascunho,
    apagarRascunhoLocal: apagarRascunhoLocal,
    travarDisco: travarDisco,
    discoEstaTravado: discoEstaTravado,
    pontoDeVolta: pontoDeVolta,
    aoGravar: function (f) { aoGravar = f; },
    carregarExemplos: carregarExemplos,
    exemplosProntos: exemplosProntos,
    guardarExemplo: guardarExemplo,
    lerExemplo: lerExemplo,
    apagarExemplo: apagarExemplo,
    temExemplo: temExemplo,
    lerConfig: lerConfig,
    gravarConfig: gravarConfig,
    imagemDoDisco: imagemDoDisco,
    lerArquivo: lerArquivo,
    reduzir: reduzir,
    baixarTudo: baixarTudo,
    baixarTexto: baixarTexto,
    restaurarDeArquivo: restaurarDeArquivo,
    tudo: tudo
  };
})(window);
