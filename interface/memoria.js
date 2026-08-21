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
          return typeof x === "string" ? { nome: x, onde: "disco" } : { nome: x.nome, onde: "disco", quando: x.quando, extra: x };
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
     Grava sozinho, com um respiro de meio segundo entre gravações
     para não escrever no disco a cada clique.
     --------------------------------------------------------------- */

  var pendente = null, timer = null, aoGravar = null;

  function rascunho(estado) {
    pendente = estado;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      timer = null;
      var e = pendente; pendente = null;
      guardaGravar("rascunho", e);           // sempre no navegador: é barato e instantâneo
      if (!seco()) {
        global.Ponte.gravar("prompts", "_rascunho_atual", e).then(function (r) {
          if (aoGravar) aoGravar(r && r.ok ? "disco" : "navegador");
        });
      } else if (aoGravar) {
        aoGravar("navegador");
      }
    }, 500);
  }

  function lerRascunho() { return guardaLer("rascunho"); }

  /* ---------------------------------------------------------------
     Exemplo visual de uma tag — a imagem que o AUTOR solta.
     A oficina nunca inventa imagem de exemplo: este é o único caminho
     pelo qual uma imagem vira exemplo de uma tag.
     --------------------------------------------------------------- */

  function guardarExemplo(idTag, nomeArquivo, dataUrl) {
    var reg = { tag: idTag, arquivo: nomeArquivo, quando: new Date().toISOString() };
    if (!seco()) {
      return global.Ponte.enviarImagem("exemplos", nomeArquivo || (idTag + ".png"), dataUrl, reg)
        .then(function (r) {
          if (r && r.ok) {
            var idx = guardaLer("exemplos_indice") || {};
            idx[idTag] = { caminho: r.caminho || null, arquivo: nomeArquivo, onde: "disco" };
            guardaGravar("exemplos_indice", idx);
            return { ok: true, onde: "disco", caminho: r.caminho };
          }
          return guardarExemploLocal(idTag, nomeArquivo, dataUrl);
        });
    }
    return guardarExemploLocal(idTag, nomeArquivo, dataUrl);
  }

  function guardarExemploLocal(idTag, nomeArquivo, dataUrl) {
    return reduzir(dataUrl, 620).then(function (menor) {
      var g = guardaGravar("exemplo/" + idTag, { arquivo: nomeArquivo, dados: menor, quando: new Date().toISOString() });
      if (!g.ok) return { ok: false, erro: g.erro };
      var idx = guardaLer("exemplos_indice") || {};
      idx[idTag] = { arquivo: nomeArquivo, onde: "navegador" };
      guardaGravar("exemplos_indice", idx);
      return { ok: true, onde: "navegador" };
    });
  }

  function lerExemplo(idTag) {
    var idx = guardaLer("exemplos_indice") || {};
    var reg = idx[idTag];
    var local = guardaLer("exemplo/" + idTag);
    if (local && local.dados) return Promise.resolve({ ok: true, dados: local.dados, onde: "navegador" });
    if (reg && reg.onde === "disco" && !seco()) {
      return global.Ponte.ler("exemplos", reg.arquivo).then(function (r) {
        if (r && r.ok && (r.dados || r.conteudo)) return { ok: true, dados: r.dados || r.conteudo, onde: "disco" };
        return { ok: false };
      });
    }
    return Promise.resolve({ ok: false });
  }

  function apagarExemplo(idTag) {
    guardaApagar("exemplo/" + idTag);
    var idx = guardaLer("exemplos_indice") || {};
    delete idx[idTag];
    guardaGravar("exemplos_indice", idx);
    return Promise.resolve({ ok: true });
  }

  function temExemplo(idTag) {
    var idx = guardaLer("exemplos_indice") || {};
    return !!idx[idTag] || !!guardaLer("exemplo/" + idTag);
  }

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

  global.Memoria = {
    seco: seco,
    localDisponivel: function () { return localOk; },
    salvar: salvar,
    ler: ler,
    listar: listar,
    apagar: apagar,
    rascunho: rascunho,
    lerRascunho: lerRascunho,
    aoGravar: function (f) { aoGravar = f; },
    guardarExemplo: guardarExemplo,
    lerExemplo: lerExemplo,
    apagarExemplo: apagarExemplo,
    temExemplo: temExemplo,
    lerArquivo: lerArquivo,
    reduzir: reduzir,
    baixarTudo: baixarTudo,
    baixarTexto: baixarTexto,
    restaurarDeArquivo: restaurarDeArquivo,
    tudo: tudo
  };
})(window);
