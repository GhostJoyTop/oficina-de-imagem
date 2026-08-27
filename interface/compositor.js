/* ==========================================================================
   OFICINA DE IMAGEM — Compositor de Cena (novo módulo)
   Dono: Construtor B.

   Permite criar cenas com múltiplos personagens de forma clara e intuitiva.
   Mostra cards de cada personagem lado a lado, com opção de editar cada um.

   Interface:
   - Dropdown para escolher contagem (1-6 personagens)
   - Cards lado a lado mostrando cada personagem e suas tags
   - Botão [EDITAR] em cada card para mudar aquele personagem
   - Vista consolidada do que está sendo construído
   ========================================================================== */

(function (global) {
  "use strict";

  var doc = global.document;

  function $(sel, raiz) { return (raiz || doc).querySelector(sel); }
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

  function plural(n, singular, muitos) {
    var q = Number(n) || 0;
    return q + " " + (Math.abs(q) === 1 ? singular : (muitos || singular + "s"));
  }

  var Compositor = {
    /* Desenha o módulo inteiro. Precisa que P (projeto) tenha sido carregado. */
    montar: function (raiz, P, mudou) {
      if (!raiz) return;
      raiz.innerHTML = "";

      /* ⚠ O MÓDULO ABRIA DIZENDO "1 PERSONAGEM" E NÃO MOSTRAVA NENHUM.

         A Oficina começa sem caixa de personagem nenhuma (`P.personagens`
         é uma lista vazia), mas a menor opção da lista era 1 — então o
         seletor exibia "1 personagem", o laço desenhava zero cards, e o
         texto de baixo mandava clicar em EDITAR num card que não existia.
         Uma tela que se contradiz três vezes na mesma dobra.

         O conserto é dizer a verdade: zero é um estado legítimo (a cena
         pode ser só de objeto, de bicho ou de cenário), então zero é uma
         opção, e quando ela vale a tela mostra o que fazer em seguida. */
      var opcoes = [
        { n: 0, label: "Nenhum — só o prompt base" },
        { n: 1, label: "1 personagem" },
        { n: 2, label: "2 personagens" },
        { n: 3, label: "3 personagens" },
        { n: 4, label: "4 personagens" },
        { n: 5, label: "5 personagens" },
        { n: 6, label: "6 personagens" }
      ];

      // Descobrir quantos personagens já existem
      var qtdAgora = P.personagens ? P.personagens.length : 0;

      // Cabeçalho. O texto é permanente, então não usa a classe `carregando`
      // — ela é o itálico apagado de "espere um instante", e aqui não há
      // nada por que esperar.
      var cabeca = el("div", { "class": "cabecalho-modulo" }, [
        el("h2", { "texto": "Compositor de Cena" }),
        el("p", { "texto": "Cada personagem ganha uma caixa própria de tags." })
      ]);

      // Seletor de contagem
      var seletor = el("div", { "class": "cena-seletor" }, [
        el("label", { "for": "seletor-quantidade", "texto": "Quantos personagens na imagem? " }),
        el("select", {
          "id": "seletor-quantidade",
          "ao": {
            "change": function () {
              var novaQtd = parseInt(this.value, 10);
              while (P.personagens.length < novaQtd) {
                P.personagens.push({ nome: "", tipo: "girl", itens: [] });
              }
              while (P.personagens.length > novaQtd) {
                P.personagens.pop();
              }
              Compositor.montar(raiz, P, mudou);
              mudou();
            }
          }
        }, opcoes.map(function (op) {
          return el("option", {
            "value": String(op.n),
            "selected": op.n === qtdAgora ? "selected" : null,
            "texto": op.label
          });
        }))
      ]);

      // Montar a seção
      raiz.appendChild(cabeca);
      raiz.appendChild(seletor);

      /* Tela vazia é convite para agir, não buraco. Com zero caixas, o
         módulo diz o que fazer e oferece o botão que faz — em vez de
         mandar clicar num card inexistente. */
      if (!P.personagens.length) {
        raiz.appendChild(el("div", { "class": "compositor-resumo" }, [
          el("h3", { "texto": "Nenhuma caixa de personagem ainda" }),
          el("p", { "texto": "Tudo o que você escolher no Armazém vai para o prompt base. Abra uma caixa quando quiser dar uma característica a UM personagem só — cabelo louro na garota, sem mexer no garoto." }),
          el("button", {
            "type": "button",
            "class": "botao-forte",
            "texto": "Abrir a primeira caixa de personagem",
            "ao": {
              "click": function () {
                P.personagens.push({ nome: "", tipo: "girl", itens: [] });
                P.alvo = "p0";
                Compositor.montar(raiz, P, mudou);
                mudou();
              }
            }
          })
        ]));
        return;
      }

      // Container de cards
      var containerCards = el("div", { "class": "compositor-cards" });
      for (var i = 0; i < P.personagens.length; i++) {
        containerCards.appendChild(Compositor.criarCard(P.personagens[i], i, P, mudou));
      }
      raiz.appendChild(containerCards);

      var resumo = el("div", { "class": "compositor-resumo" }, [
        el("h3", { "texto": "O que você está montando" }),
        el("p", { "texto": "Clique em Editar num card para mexer naquele personagem no Ateliê. As características vêm do Armazém de tags." })
      ]);
      raiz.appendChild(resumo);
    },

    criarCard: function (pers, index, P, mudou) {
      var numero = index + 1;
      var nomeExibicao = pers.nome || "Personagem " + numero;
      var tipo = pers.tipo === "boy" ? "garoto" : "garota";
      var qtdTags = (pers.itens || []).length;

      var card = el("div", { "class": "compositor-card" }, [
        el("div", { "class": "card-cabeca" }, [
          el("h4", { "texto": nomeExibicao }),
          el("p", { "class": "card-tipo", "texto": tipo })
        ]),
        el("div", { "class": "card-body" }, [
          el("p", { "class": "card-tags-info", "texto": plural(qtdTags, "tag", "tags") + " selecionada(s)" }),
          el("div", { "class": "card-tags-lista" }, [
            (pers.itens && pers.itens.length) ? el("ul", {}, pers.itens.slice(0, 5).map(function (tag) {
              return el("li", { "texto": tag.tag || tag.id });
            }).concat(qtdTags > 5 ? [el("li", { "class": "mais", "texto": "+ " + (qtdTags - 5) + " mais" })] : [])) : el("p", { "class": "vazio", "texto": "Nenhuma tag ainda" })
          ]),
          el("button", {
            "type": "button",
            "class": "botao-card-editar",
            "texto": "Editar " + nomeExibicao,
            "title": "Abre este personagem no Ateliê",
            "ao": {
              "click": function () {
                P.alvo = "p" + index;
                if (window.abrirAtelie) window.abrirAtelie();
              }
            }
          })
        ])
      ]);

      return card;
    }
  };

  global.Compositor = Compositor;
})(window);
