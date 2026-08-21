/* ==========================================================================
   OFICINA DE IMAGEM — desenhos esquemáticos (SVG)
   Dono: Construtor B.

   PROIBIÇÃO DURA, que vale para cada linha deste arquivo:
   nenhum desenho aqui mostra rosto, cor de cabelo, tom de pele ou peça de
   roupa. Só geometria: caixas, linhas, ângulos, proporções e silhuetas ocas.
   Inventar aparência é a única coisa que este projeto nunca faz.

   Todo desenho usa `currentColor` e as variáveis de tema, então ele se vira
   sozinho no tema claro e no escuro.

   Quem usa este arquivo chama:
     Esquemas.tem(nome)         -> true/false
     Esquemas.desenhar(nome)    -> string com o <svg>, ou null
     Esquemas.paraTag(tag)      -> string com o <svg> mais adequado, ou null
     Esquemas.semDesenho(texto) -> o cartão honesto de "não há desenho"
   ========================================================================== */

(function (global) {
  "use strict";

  /* ---------------------------------------------------------------
     Peças básicas
     --------------------------------------------------------------- */

  // Um corpo esquemático, em coordenadas próprias: x de 0 a 100,
  // y de -10 (acima da cabeça) a 210 (abaixo dos pés).
  // Sem rosto. Sem cabelo. Sem roupa. Só o esqueleto do enquadramento.
  function figura(op) {
    var o = op === undefined ? 0.85 : op;
    return (
      '<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" ' +
      'stroke-linejoin="round" opacity="' + o + '">' +
      '<circle cx="50" cy="18" r="13"/>' +
      '<path d="M50 31 V39"/>' +
      '<path d="M31 43 H69"/>' +
      '<path d="M34 43 L36 101 H64 L66 43"/>' +
      '<path d="M31 44 L23 80 L25 99"/>' +
      '<path d="M69 44 L77 80 L75 99"/>' +
      '<path d="M43 101 L41 150 L42 191"/>' +
      '<path d="M57 101 L59 150 L58 191"/>' +
      '<path d="M35 193 H48"/>' +
      '<path d="M52 193 H65"/>' +
      "</g>"
    );
  }

  // Chão e um par de marcas de cenário, para os planos abertos não
  // parecerem um corpo flutuando no vazio.
  function cenario() {
    return (
      '<g fill="none" stroke="currentColor" stroke-width="2" opacity="0.28">' +
      '<path d="M-400 196 H500"/>' +
      '<path d="M-120 196 V120 L-70 96 L-20 120 V196"/>' +
      '<path d="M150 196 V140 L190 118 L230 140 V196"/>' +
      '<path d="M-230 196 V160 H-190 V196"/>' +
      "</g>"
    );
  }

  function moldura(x, y, w, h, forte) {
    return (
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
      '" rx="6" fill="none" stroke="' + (forte ? "var(--acento)" : "currentColor") +
      '" stroke-width="' + (forte ? 2.6 : 1.8) + '" opacity="' + (forte ? 1 : 0.45) + '"/>'
    );
  }

  function rotulo(x, y, txt, cls, tam, anc) {
    return (
      '<text x="' + x + '" y="' + y + '" text-anchor="' + (anc || "middle") +
      '" font-size="' + (tam || 12) + '" fill="currentColor" opacity="0.85"' +
      (cls ? ' class="' + cls + '"' : "") + ">" + esc(txt) + "</text>"
    );
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  var idSeq = 0;
  function novoId(p) { idSeq += 1; return p + "_" + idSeq; }

  function svg(vb, corpo, titulo) {
    return (
      '<svg viewBox="' + vb + '" role="img" aria-label="' + esc(titulo || "") +
      '" xmlns="http://www.w3.org/2000/svg">' + corpo + "</svg>"
    );
  }

  /* ---------------------------------------------------------------
     1. A escada de enquadramento (close-up até very wide shot)
     --------------------------------------------------------------- */

  // Cada painel mostra o MESMO corpo, recortado de um jeito diferente.
  // É isso que a tag de enquadramento faz: ela escolhe o recorte.
  var RECORTES = {
    "close-up":        { x: 30,   y: 2,    w: 40,  h: 40,  pt: "primeiríssimo plano" },
    "portrait":        { x: 22,   y: -2,   w: 56,  h: 56,  pt: "retrato" },
    "upper body":      { x: 8,    y: -6,   w: 84,  h: 112, pt: "meio corpo" },
    "cowboy shot":     { x: 2,    y: -8,   w: 96,  h: 152, pt: "da coxa para cima" },
    "full body":       { x: -6,   y: -12,  w: 112, h: 218, pt: "corpo inteiro" },
    "wide shot":       { x: -70,  y: -40,  w: 240, h: 260, pt: "plano aberto" },
    "very wide shot":  { x: -180, y: -70,  w: 460, h: 300, pt: "plano bem aberto" },
    "lower body":      { x: 8,    y: 88,   w: 84,  h: 118, pt: "da cintura para baixo" }
  };

  function painelRecorte(px, py, pw, ph, rec, comCenario) {
    var s = Math.min(pw / rec.w, ph / rec.h);
    var ox = px + (pw - rec.w * s) / 2 - rec.x * s;
    var oy = py + (ph - rec.h * s) / 2 - rec.y * s;
    var cid = novoId("crp");
    return (
      '<clipPath id="' + cid + '"><rect x="' + px + '" y="' + py + '" width="' + pw +
      '" height="' + ph + '" rx="6"/></clipPath>' +
      '<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph +
      '" rx="6" fill="currentColor" opacity="0.04"/>' +
      '<g clip-path="url(#' + cid + ')"><g transform="translate(' + ox.toFixed(2) + "," +
      oy.toFixed(2) + ") scale(" + s.toFixed(4) + ')">' +
      (comCenario ? cenario() : "") + figura() +
      "</g></g>" + moldura(px, py, pw, ph, false)
    );
  }

  function enquadramentoEscada() {
    var ordem = ["close-up", "portrait", "upper body", "cowboy shot", "full body", "wide shot"];
    var pw = 146, ph = 196, gap = 14, x0 = 14, y0 = 14;
    var c = "";
    ordem.forEach(function (nome, i) {
      var px = x0 + i * (pw + gap);
      var rec = RECORTES[nome];
      c += painelRecorte(px, y0, pw, ph, rec, i >= 5);
      c += rotulo(px + pw / 2, y0 + ph + 20, nome, "rot-mono", 13);
      c += rotulo(px + pw / 2, y0 + ph + 36, rec.pt, null, 11.5);
    });
    // a seta "mais perto -> mais longe"
    var xF = x0 + 6, xT = x0 + 6 * pw + 5 * gap - 6, yA = y0 + ph + 56;
    c +=
      '<g stroke="var(--acento)" stroke-width="2" fill="none" opacity="0.8">' +
      '<path d="M' + xF + " " + yA + " H" + (xT - 10) + '"/>' +
      '<path d="M' + (xT - 12) + " " + (yA - 5) + " L" + xT + " " + yA + " L" + (xT - 12) + " " + (yA + 5) + '"/>' +
      "</g>" +
      rotulo(xF + 60, yA - 8, "mais perto", null, 11.5) +
      rotulo(xT - 70, yA - 8, "mais longe", null, 11.5);
    return svg(
      "0 0 960 300", c,
      "Seis molduras recortando o mesmo corpo esquemático, do primeiríssimo plano ao plano aberto."
    );
  }

  function enquadramentoUnico(tagEn) {
    var rec = RECORTES[tagEn];
    if (!rec) return null;
    var c = painelRecorte(20, 14, 200, 240, rec, rec.w > 200);
    c += painelRecorte(250, 14, 200, 240, RECORTES["full body"], false);
    c += rotulo(120, 274, tagEn, "rot-mono", 13);
    c += rotulo(120, 290, rec.pt, null, 11.5);
    c += rotulo(350, 274, "full body", "rot-mono", 13);
    c += rotulo(350, 290, "para comparar", null, 11.5);
    return svg("0 0 470 300", c, "O recorte da tag " + tagEn + " comparado com o corpo inteiro.");
  }

  /* ---------------------------------------------------------------
     2. Ângulo de câmera
     --------------------------------------------------------------- */

  // Uma câmera esquemática: um trapézio com uma lente.
  function camera(cx, cy, ang, destaque) {
    return (
      '<g transform="translate(' + cx + "," + cy + ") rotate(" + ang + ')" ' +
      'fill="none" stroke="' + (destaque ? "var(--acento)" : "currentColor") +
      '" stroke-width="2.2" opacity="' + (destaque ? 1 : 0.7) + '">' +
      '<rect x="-15" y="-10" width="30" height="20" rx="3"/>' +
      '<path d="M15 -6 L27 -12 V12 L15 6 Z"/>' +
      "</g>"
    );
  }

  function anguloCamera() {
    var cx = 300, cy = 210;
    var c = "";
    // corpo no meio, pequeno
    c += '<g transform="translate(' + (cx - 50) + "," + (cy - 200) + ") scale(0.95)\">" + figura(0.9) + "</g>";
    c += '<circle cx="' + cx + '" cy="' + cy + '" r="150" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="5 6" opacity="0.3"/>';

    var pos = [
      { a: -90, tag: "from above",  pt: "de cima",     rx: 0,    ry: -170, ta: "middle", ry2: -190 },
      { a: 90,  tag: "from below",  pt: "de baixo",    rx: 0,    ry: 170,  ta: "middle", ry2: 196 },
      { a: 180, tag: "from side",   pt: "de lado",     rx: -170, ry: 0,    ta: "end",    ry2: 0 },
      { a: 0,   tag: "facing viewer", pt: "de frente", rx: 170,  ry: 0,    ta: "start",  ry2: 0 }
    ];
    pos.forEach(function (p) {
      var camX = cx + Math.cos((p.a * Math.PI) / 180) * 150;
      var camY = cy + Math.sin((p.a * Math.PI) / 180) * 150;
      // a câmera aponta para o centro
      c += camera(camX, camY, p.a + 180, false);
      c += '<path d="M' + camX + " " + camY + " L" + cx + " " + cy +
           '" stroke="currentColor" stroke-width="1.3" opacity="0.28" fill="none"/>';
      c += rotulo(cx + p.rx, cy + (p.ry2 || p.ry), p.tag, "rot-mono", 12.5, p.ta);
      c += rotulo(cx + p.rx, cy + (p.ry2 || p.ry) + 15, p.pt, null, 11, p.ta);
    });

    // from behind — a câmera atrás do corpo
    c += camera(cx, cy - 150, 90, false);
    c += rotulo(cx + 92, cy - 152, "from behind", "rot-mono", 12.5, "start");
    c += rotulo(cx + 92, cy - 137, "por trás (a câmera fica atrás dele)", null, 11, "start");

    // dutch angle — a moldura torta
    var dx = 700, dy = 130;
    c += '<g transform="translate(' + dx + "," + dy + ') rotate(-14)">' +
         moldura(-95, -100, 190, 200, true) +
         '<g transform="translate(-50,-96) scale(0.95)">' + figura(0.75) + "</g></g>";
    c += rotulo(dx, dy + 132, "dutch angle", "rot-mono", 13);
    c += rotulo(dx, dy + 148, "câmera inclinada — a cena entorta, não o corpo", null, 11.5);

    // profile
    var px2 = 700, py2 = 330;
    c += '<g fill="none" stroke="currentColor" stroke-width="2.4" opacity="0.85" ' +
         'transform="translate(' + px2 + "," + py2 + ')">' +
         '<path d="M-4 -34 q22 4 24 26 q2 20 -12 30 q-14 10 -12 24"/>' +
         '<path d="M-4 -34 q-22 6 -22 30 q0 26 16 34"/>' +
         "</g>";
    c += rotulo(px2, py2 + 66, "profile", "rot-mono", 13);
    c += rotulo(px2, py2 + 82, "cabeça de perfil, 90 graus", null, 11.5);

    return svg("0 0 960 420", c, "Posições de câmera ao redor de um corpo esquemático: de cima, de baixo, de lado, de frente, por trás, e a moldura inclinada do dutch angle.");
  }

  var ANG_UNICO = {
    "from above": { a: -90, pt: "a câmera está acima e olha para baixo" },
    "from below": { a: 90,  pt: "a câmera está abaixo e olha para cima" },
    "from side":  { a: 180, pt: "a câmera está ao lado" },
    "from behind":{ a: -90, pt: "a câmera está atrás do corpo", atras: true },
    "facing viewer": { a: 0, pt: "o corpo olha para quem vê" },
    "profile":    { a: 180, pt: "cabeça de perfil, 90 graus" }
  };

  function anguloUnico(tagEn) {
    var d = ANG_UNICO[tagEn];
    if (!d) return null;
    var cx = 170, cy = 160;
    var c = '<g transform="translate(' + (cx - 50) + "," + (cy - 175) + ') scale(0.82)">' + figura(0.9) + "</g>";
    c += '<circle cx="' + cx + '" cy="' + cy + '" r="110" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="5 6" opacity="0.3"/>';
    var camX = cx + Math.cos((d.a * Math.PI) / 180) * (d.atras ? 0 : 110);
    var camY = cy + Math.sin((d.a * Math.PI) / 180) * 110;
    c += camera(camX, camY, d.a + 180, true);
    c += '<path d="M' + camX + " " + camY + " L" + cx + " " + cy + '" stroke="var(--acento)" stroke-width="1.6" opacity="0.5" fill="none"/>';
    c += rotulo(cx, 300, tagEn, "rot-mono", 13);
    c += rotulo(cx, 316, d.pt, null, 11.5);
    return svg("0 0 340 330", c, "A posição da câmera para a tag " + tagEn + ".");
  }

  /* ---------------------------------------------------------------
     3. Grade 5x5 de posição de personagem
     --------------------------------------------------------------- */

  function gradePosicao() {
    var x0 = 40, y0 = 24, cel = 62;
    var c = "";
    for (var l = 0; l < 5; l++) {
      for (var col = 0; col < 5; col++) {
        var x = x0 + col * cel, y = y0 + l * cel;
        var marc = (l === 2 && col === 1) || (l === 2 && col === 3);
        c += '<rect x="' + x + '" y="' + y + '" width="' + cel + '" height="' + cel +
             '" fill="' + (marc ? "var(--acento)" : "currentColor") +
             '" fill-opacity="' + (marc ? 0.16 : 0.03) +
             '" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>';
      }
    }
    // corpo 1 na coluna 2, corpo 2 na coluna 4
    c += '<g transform="translate(' + (x0 + cel * 1 + 8) + "," + (y0 + cel * 2 - 40) + ') scale(0.44)">' + figura(0.9) + "</g>";
    c += '<g transform="translate(' + (x0 + cel * 3 + 8) + "," + (y0 + cel * 2 - 40) + ') scale(0.44)">' + figura(0.9) + "</g>";
    c += rotulo(x0 + cel * 1.5, y0 + cel * 5 + 20, "1ª caixa", "rot-mono", 12);
    c += rotulo(x0 + cel * 3.5, y0 + cel * 5 + 20, "2ª caixa", "rot-mono", 12);
    c += rotulo(x0 + cel * 2.5, y0 + cel * 5 + 40, "A ordem das caixas costuma virar a posição: a primeira à esquerda, a segunda à direita.", null, 12);
    c += rotulo(x0 + cel * 2.5, y0 - 8, "grade 5 × 5 — onde cada personagem fica no quadro", null, 12);
    return svg("0 0 700 420", c, "Grade de cinco por cinco com dois corpos esquemáticos, um na segunda coluna e outro na quarta.");
  }

  /* ---------------------------------------------------------------
     4. Comprimento de cabelo — silhuetas ocas, sem rosto e sem cor
     --------------------------------------------------------------- */

  function cabecaBase() {
    return (
      '<g fill="none" stroke="currentColor" stroke-width="2.2" opacity="0.5">' +
      '<circle cx="50" cy="42" r="24"/>' +
      '<path d="M50 66 V78"/>' +
      '<path d="M22 92 H78"/>' +
      "</g>"
    );
  }

  // O contorno do cabelo é uma forma vazia (sem preenchimento de cor),
  // só para mostrar até onde ele desce. Não há fio, não há cor, não há rosto.
  var COMPRIMENTOS = [
    { tag: "very short hair",     pt: "muito curto",     y: 52 },
    { tag: "short hair",          pt: "curto",           y: 74 },
    { tag: "medium hair",         pt: "médio",           y: 110 },
    { tag: "long hair",           pt: "longo",           y: 156 },
    { tag: "very long hair",      pt: "muito longo",     y: 208 },
    { tag: "absurdly long hair",  pt: "absurdamente longo", y: 262 }
  ];

  function cabeloComprimento() {
    var pw = 150, gap = 6, y0 = 16;
    var c = "";
    COMPRIMENTOS.forEach(function (d, i) {
      var px = 12 + i * (pw + gap);
      c += '<g transform="translate(' + px + "," + y0 + ')">';
      c += '<rect x="0" y="0" width="' + pw + '" height="290" rx="6" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.22"/>';
      c += '<g transform="translate(25,0)">';
      c += cabecaBase();
      c += '<path d="M26 40 q0 -28 24 -28 q24 0 24 28 L74 ' + d.y +
           ' q-6 10 -14 4 L60 60 M26 40 L26 ' + d.y + ' q6 10 14 4 L40 60" ' +
           'fill="none" stroke="var(--acento)" stroke-width="2.6" stroke-linejoin="round" opacity="0.95"/>';
      c += "</g>";
      c += '<line x1="8" y1="' + d.y + '" x2="' + (pw - 8) + '" y2="' + d.y +
           '" stroke="var(--acento)" stroke-width="1" stroke-dasharray="3 4" opacity="0.5"/>';
      c += "</g>";
      c += rotulo(px + pw / 2, y0 + 310, d.tag, "rot-mono", 12.5);
      c += rotulo(px + pw / 2, y0 + 326, d.pt, null, 11);
    });
    return svg("0 0 948 360", c, "Seis silhuetas ocas mostrando até onde o cabelo desce, do muito curto ao absurdamente longo. Sem rosto e sem cor.");
  }

  /* ---------------------------------------------------------------
     5. A régua de peso — {chaves} e [colchetes]
     --------------------------------------------------------------- */

  function reguaPeso() {
    var c = "";
    var base = 400, y = 210, larg = 66, gap = 8;
    var passos = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
    passos.forEach(function (n, i) {
      var mult = Math.pow(1.05, n);
      var alt = 26 + (mult - 0.7) * 150;
      var x = 20 + i * (larg + gap);
      var forte = n === 0;
      c += '<rect x="' + x + '" y="' + (y - alt) + '" width="' + larg + '" height="' + alt +
           '" rx="4" fill="' + (forte ? "currentColor" : "var(--acento)") +
           '" fill-opacity="' + (forte ? 0.22 : 0.2) +
           '" stroke="' + (forte ? "currentColor" : "var(--acento)") + '" stroke-width="1.6"/>';
      c += rotulo(x + larg / 2, y - alt - 8, mult.toFixed(3).replace(".", ","), "rot-mono", 11.5);
      var txt = n === 0 ? "tag" : (n > 0 ? rep("{", n) + "tag" + rep("}", n) : rep("[", -n) + "tag" + rep("]", -n));
      c += rotulo(x + larg / 2, y + 18, txt, "rot-mono", 11);
    });
    c += '<line x1="14" y1="' + y + '" x2="' + (20 + 11 * (larg + gap)) + '" y2="' + y +
         '" stroke="currentColor" stroke-width="1.8" opacity="0.5"/>';
    c += rotulo(base, 258, "cada { multiplica o peso por 1,05 · cada [ divide por 1,05 · empilhar multiplica de novo", null, 12.5);
    c += rotulo(base, 276, "no Conteúdo Indesejado é ao contrário: { evita mais, [ evita menos", null, 12);
    c += rotulo(120, 34, "quase some", null, 12);
    c += rotulo(680, 34, "domina a imagem", null, 12);
    return svg("0 0 830 292", c, "Régua de barras mostrando o multiplicador de peso de cinco colchetes até cinco chaves.");
    function rep(s, n) { var o = ""; for (var k = 0; k < n; k++) o += s; return o; }
  }

  /* ---------------------------------------------------------------
     6. As quatro portas de entrada de uma imagem
     --------------------------------------------------------------- */

  function quatroPortas() {
    var portas = [
      { n: "Character Reference", o: "leva o PERSONAGEM", d: "quem ele é: rosto, corpo, roupa. A cena é refeita.", cst: "+5 Anlas por imagem · só V4.5" },
      { n: "Style Reference",     o: "leva o TRAÇO",      d: "o acabamento visual, não quem está na imagem.", cst: "dentro do Precise Reference · só V4.5" },
      { n: "Vibe Transfer",       o: "leva o CLIMA",      d: "cor, luz e composição, de forma solta.", cst: "2 Anlas para codificar, uma vez" },
      { n: "Image2Image",         o: "leva a IMAGEM INTEIRA", d: "parte do desenho e o transforma por cima.", cst: "sem custo extra" }
    ];
    var c = "";
    var x = 24, y0 = 22, bw = 250, bh = 96, gap = 14;
    portas.forEach(function (p, i) {
      var y = y0 + i * (bh + gap);
      c += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh +
           '" rx="8" fill="currentColor" fill-opacity="0.04" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.8"/>';
      c += rotulo(x + bw / 2, y + 30, p.n, "rot-mono", 14);
      c += rotulo(x + bw / 2, y + 52, p.o, null, 12.5);
      c += rotulo(x + bw / 2, y + 76, p.cst, "rot-mono", 10.5);
      c += '<g stroke="var(--acento)" stroke-width="2" fill="none" opacity="0.8">' +
           '<path d="M' + (x + bw + 6) + " " + (y + bh / 2) + " H" + (x + bw + 44) + '"/>' +
           '<path d="M' + (x + bw + 38) + " " + (y + bh / 2 - 5) + " L" + (x + bw + 46) + " " + (y + bh / 2) +
           " L" + (x + bw + 38) + " " + (y + bh / 2 + 5) + '"/></g>';
      c += rotulo(x + bw + 56, y + bh / 2 + 5, p.d, null, 13, "start");
    });
    var yF = y0 + 4 * (bh + gap) + 6;
    c += '<rect x="' + x + '" y="' + yF + '" width="700" height="42" rx="7" fill="var(--erro)" fill-opacity="0.1" stroke="var(--erro)" stroke-width="1.6"/>';
    c += '<text x="' + (x + 16) + '" y="' + (yF + 26) + '" font-size="13" fill="var(--erro)">' +
         esc("Precise Reference (Character + Style) não funciona junto com Vibe Transfer. Escolha um dos dois.") + "</text>";
    return svg("0 0 780 " + (yF + 62), c, "As quatro portas de entrada de uma imagem no NovelAI e o que cada uma leva embora do desenho.");
  }

  /* ---------------------------------------------------------------
     7. Mapa de Força × Ruído (Image2Image)
     --------------------------------------------------------------- */

  function mapaForcaRuido() {
    var x0 = 90, y0 = 24, lado = 320;
    var c = "";
    c += '<rect x="' + x0 + '" y="' + y0 + '" width="' + lado + '" height="' + lado +
         '" rx="8" fill="currentColor" fill-opacity="0.035" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.8"/>';
    for (var i = 1; i < 4; i++) {
      c += '<line x1="' + (x0 + (lado / 4) * i) + '" y1="' + y0 + '" x2="' + (x0 + (lado / 4) * i) +
           '" y2="' + (y0 + lado) + '" stroke="currentColor" stroke-opacity="0.14"/>';
      c += '<line x1="' + x0 + '" y1="' + (y0 + (lado / 4) * i) + '" x2="' + (x0 + lado) +
           '" y2="' + (y0 + (lado / 4) * i) + '" stroke="currentColor" stroke-opacity="0.14"/>';
    }
    var cantos = [
      { x: x0 + 8,          y: y0 + lado - 40, w: lado / 2 - 16, t: "quase igual",       s: "Força baixa, Ruído baixo — reproduz o original. É o passo antes de Upscale." },
      { x: x0 + lado / 2,   y: y0 + lado - 40, w: lado / 2 - 8,  t: "mesma forma, cara nova", s: "Força alta, Ruído baixo — reinterpreta mantendo a composição." },
      { x: x0 + 8,          y: y0 + 14,        w: lado / 2 - 16, t: "detalhe inventado",  s: "Força baixa, Ruído alto — a IA preenche o que faltava." },
      { x: x0 + lado / 2,   y: y0 + 14,        w: lado / 2 - 8,  t: "outra imagem",       s: "Força alta, Ruído alto — sobra pouco do original." }
    ];
    cantos.forEach(function (k) {
      c += rotulo(k.x + k.w / 2, k.y + 16, k.t, "rot-mono", 12.5);
    });
    c += rotulo(x0 + lado / 2, y0 + lado + 26, "Força (Strength) — o quanto a IA reinterpreta", null, 12.5);
    c += '<text transform="translate(' + (x0 - 26) + "," + (y0 + lado / 2) + ') rotate(-90)" text-anchor="middle" font-size="12.5" fill="currentColor" opacity="0.85">' +
         esc("Ruído (Noise) — o quanto ela inventa detalhe novo") + "</text>";
    var lx = x0 + lado + 30;
    cantos.forEach(function (k, i) {
      c += '<text x="' + lx + '" y="' + (y0 + 24 + i * 58) + '" font-size="13" fill="currentColor" font-weight="700">' + esc(k.t) + "</text>";
      c += quebra(lx, y0 + 42 + i * 58, k.s, 46, 12);
    });
    return svg("0 0 900 400", c, "Mapa de Força por Ruído com as quatro esquinas do Image2Image explicadas.");
  }

  function quebra(x, y, txt, cols, tam) {
    var pal = String(txt).split(" "), lin = [], at = "";
    pal.forEach(function (p) {
      if ((at + " " + p).trim().length > cols) { lin.push(at.trim()); at = p; }
      else { at += " " + p; }
    });
    if (at.trim()) lin.push(at.trim());
    return lin.map(function (l, i) {
      return '<text x="' + x + '" y="' + (y + i * (tam + 3)) + '" font-size="' + tam +
        '" fill="currentColor" opacity="0.78">' + esc(l) + "</text>";
    }).join("");
  }

  /* ---------------------------------------------------------------
     8. A fita da ordem do prompt
     --------------------------------------------------------------- */

  function fitaOrdem(baldes) {
    var lista = baldes && baldes.length ? baldes : [
      { n: 10, r: "assunto" }, { n: 20, r: "enquadramento" }, { n: 30, r: "ângulo" },
      { n: 40, r: "cabelo" }, { n: 45, r: "olhos" }, { n: 50, r: "pele" }, { n: 55, r: "corpo" },
      { n: 60, r: "roupa" }, { n: 70, r: "pose" }, { n: 80, r: "cena" },
      { n: 90, r: "estilo" }, { n: 95, r: "efeitos" }, { n: 98, r: "qualidade" }, { n: 999, r: "Text:" }
    ];
    var c = "", x = 16, y = 40, h = 46;
    var larg = Math.floor((940 - 16) / lista.length) - 4;
    lista.forEach(function (b, i) {
      var ult = b.n === 999;
      c += '<rect x="' + x + '" y="' + y + '" width="' + larg + '" height="' + h +
           '" rx="5" fill="' + (ult ? "var(--info)" : "var(--acento)") +
           '" fill-opacity="' + (0.06 + (1 - i / lista.length) * 0.16).toFixed(3) +
           '" stroke="' + (ult ? "var(--info)" : "var(--acento)") + '" stroke-opacity="0.6" stroke-width="1.4"/>';
      c += rotulo(x + larg / 2, y + 20, String(b.n), "rot-mono", 11);
      c += rotulo(x + larg / 2, y + 36, b.r, null, 11);
      x += larg + 4;
    });
    c += '<g stroke="var(--acento)" stroke-width="2" fill="none" opacity="0.75">' +
         '<path d="M16 26 H900"/><path d="M892 21 L902 26 L892 31"/></g>';
    c += rotulo(90, 18, "pesa mais", null, 12);
    c += rotulo(830, 18, "pesa menos", null, 12);
    c += rotulo(478, y + h + 24, "A ordem é o balde. Dentro de um balde, a ordem em que você escolheu é mantida.", null, 12.5);
    return svg("0 0 948 " + (y + h + 40), c, "Fita mostrando os baldes de prioridade do prompt, do que pesa mais para o que pesa menos.");
  }

  /* ---------------------------------------------------------------
     9. As três resoluções nativas de referência
     --------------------------------------------------------------- */

  function resolucoesNativas() {
    var res = [
      { w: 1024, h: 1536, pt: "retrato — o mais usado para personagem de corpo inteiro" },
      { w: 1472, h: 1472, pt: "quadrado" },
      { w: 1536, h: 1024, pt: "paisagem — bom para cena com mais de um personagem" }
    ];
    var c = "", x = 30, esc0 = 0.13, maxH = 0;
    res.forEach(function (r) { maxH = Math.max(maxH, r.h * esc0); });
    res.forEach(function (r) {
      var w = r.w * esc0, h = r.h * esc0;
      var y = 20 + (maxH - h);
      c += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
           '" rx="6" fill="currentColor" fill-opacity="0.04" stroke="var(--acento)" stroke-width="2"/>';
      c += rotulo(x + w / 2, y + h / 2, r.w + " × " + r.h, "rot-mono", 13);
      c += quebra(x, 20 + maxH + 22, r.pt, 30, 11.5);
      x += w + 34;
    });
    c += rotulo(300, 20 + maxH + 76, "Imagem menor é esticada, maior é reduzida. Use uma destas três e a referência não deforma.", null, 12.5, "start");
    return svg("0 0 760 " + (maxH + 120), c, "As três proporções nativas de imagem de referência, lado a lado.");
  }

  /* ---------------------------------------------------------------
     10. Folha de referência (multiple views / turnaround)
     --------------------------------------------------------------- */

  function multiplasVistas() {
    var c = "";
    var vistas = [
      { r: "frente",  esp: "" },
      { r: "3/4",     esp: "skewX(-8)" },
      { r: "lado",    esp: "scale(0.55,1)" },
      { r: "costas",  esp: "" }
    ];
    var x = 26, pw = 150;
    vistas.forEach(function (v, i) {
      c += '<rect x="' + x + '" y="16" width="' + pw + '" height="240" rx="6" fill="currentColor" fill-opacity="0.03" stroke="currentColor" stroke-opacity="0.25"/>';
      c += '<g transform="translate(' + (x + 25) + ',24) scale(1.05) ' + (v.esp ? v.esp : "") + '">' + figura(0.85) + "</g>";
      c += rotulo(x + pw / 2, 274, v.r, null, 12);
      x += pw + 12;
    });
    c += rotulo(350, 300, "multiple views, turnaround, reference sheet, no text", "rot-mono", 13);
    c += rotulo(350, 318, "A referência mais flexível: serve para gerar qualquer ângulo depois.", null, 12);
    return svg("0 0 700 336", c, "Quatro vistas do mesmo corpo esquemático numa folha de referência: frente, três quartos, lado e costas.");
  }

  /* ---------------------------------------------------------------
     11. Preparar a referência — o que ajuda e o que atrapalha
     --------------------------------------------------------------- */

  function prepararReferencia() {
    var c = "";
    // bom
    c += '<rect x="20" y="20" width="220" height="250" rx="8" fill="var(--ok)" fill-opacity="0.08" stroke="var(--ok)" stroke-width="2"/>';
    c += '<g transform="translate(65,32) scale(1.08)">' + figura(0.9) + "</g>";
    c += '<text x="130" y="292" text-anchor="middle" font-size="13" fill="var(--ok)" font-weight="700">' + esc("funciona bem") + "</text>";
    c += quebra(30, 312, "Corpo inteiro, de pé, pose neutra, fundo simples, traço limpo.", 34, 12);
    // ruim — pose torcida e recorte apertado
    c += '<rect x="270" y="20" width="220" height="250" rx="8" fill="var(--erro)" fill-opacity="0.07" stroke="var(--erro)" stroke-width="2"/>';
    var cid = novoId("cortado");
    c += '<clipPath id="' + cid + '"><rect x="270" y="20" width="220" height="250" rx="8"/></clipPath>';
    c += '<g clip-path="url(#' + cid + ')"><g transform="translate(300,-60) scale(1.9) rotate(14,50,100)">' + figura(0.75) + "</g></g>";
    c += '<text x="380" y="292" text-anchor="middle" font-size="13" fill="var(--erro)" font-weight="700">' + esc("atrapalha") + "</text>";
    c += quebra(280, 312, "Pose complexa, corpo cortado, fundo cheio, rascunho solto.", 34, 12);
    // recorte do rosto no canto
    c += '<rect x="520" y="20" width="220" height="250" rx="8" fill="currentColor" fill-opacity="0.035" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.8"/>';
    c += '<g transform="translate(560,32) scale(1.0)">' + figura(0.8) + "</g>";
    c += '<rect x="672" y="30" width="58" height="58" rx="4" fill="var(--acento)" fill-opacity="0.12" stroke="var(--acento)" stroke-width="1.8"/>';
    c += '<g transform="translate(683,26) scale(0.46)"><circle cx="50" cy="42" r="24" fill="none" stroke="currentColor" stroke-width="4" opacity="0.7"/></g>';
    c += '<text x="630" y="292" text-anchor="middle" font-size="13" fill="var(--acento)" font-weight="700">' + esc("ajuda mais ainda") + "</text>";
    c += quebra(530, 312, "Um recorte da cabeça num canto dá ao modelo uma leitura ampliada.", 34, 12);
    return svg("0 0 760 380", c, "Três painéis comparando uma referência boa, uma ruim e uma com recorte de cabeça no canto.");
  }

  /* ---------------------------------------------------------------
     12. Onde vai cada caixa do prompt
     --------------------------------------------------------------- */

  function caixasDoPrompt() {
    var c = "";
    var caixas = [
      { t: "Prompt base", d: "a contagem (1girl, 2girls), a cena, o estilo e a qualidade", y: 20, h: 78, cor: "var(--acento)" },
      { t: "Caixa de personagem 1…6", d: "só girl ou boy, SEM número, mais a aparência daquele personagem", y: 110, h: 78, cor: "var(--info)" },
      { t: "Conteúdo Indesejado", d: "o que a IA deve evitar; aqui {chaves} evitam MAIS", y: 200, h: 62, cor: "currentColor" },
      { t: "Text: no fim absoluto", d: "nada pode vir depois, ou vira letra desenhada na imagem", y: 274, h: 62, cor: "var(--erro)" }
    ];
    caixas.forEach(function (b) {
      c += '<rect x="24" y="' + b.y + '" width="560" height="' + b.h + '" rx="8" fill="' + b.cor +
           '" fill-opacity="0.07" stroke="' + b.cor + '" stroke-width="1.8"/>';
      c += '<text x="42" y="' + (b.y + 28) + '" font-size="14.5" font-weight="700" fill="' + b.cor + '">' + esc(b.t) + "</text>";
      c += quebra(42, b.y + 50, b.d, 62, 12.5);
    });
    return svg("0 0 620 356", c, "As quatro caixas de um prompt do NovelAI, empilhadas na ordem em que são lidas.");
  }

  /* ---------------------------------------------------------------
     13. Cartão honesto de "não há desenho"
     --------------------------------------------------------------- */

  function semDesenho(txt) {
    var c =
      '<rect x="2" y="2" width="316" height="86" rx="8" fill="currentColor" fill-opacity="0.03" ' +
      'stroke="currentColor" stroke-opacity="0.32" stroke-width="1.6" stroke-dasharray="6 5"/>' +
      '<path d="M40 45 H278" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.4"/>' +
      quebra(24, 34, txt || "Esta tag não tem desenho esquemático — o efeito dela não é geométrico.", 44, 12);
    return svg("0 0 320 92", c, "Aviso de que não existe desenho para esta tag.");
  }

  /* ---------------------------------------------------------------
     Registro e resolução de nomes
     --------------------------------------------------------------- */

  var REG = {
    enquadramento_escada: enquadramentoEscada,
    angulo_camera: anguloCamera,
    grade_posicao: gradePosicao,
    cabelo_comprimento: cabeloComprimento,
    regua_peso: reguaPeso,
    quatro_portas: quatroPortas,
    mapa_forca_ruido: mapaForcaRuido,
    fita_ordem: function () { return fitaOrdem(null); },
    resolucoes_nativas: resolucoesNativas,
    multiplas_vistas: multiplasVistas,
    preparar_referencia: prepararReferencia,
    caixas_do_prompt: caixasDoPrompt
  };

  // O Construtor A escolhe os nomes em `exemplo.ref`. Como não dá para saber
  // de antemão qual grafia ele usou, aceitamos várias, e ainda tentamos
  // adivinhar pelo id e pelo texto da tag. Nunca inventamos um desenho:
  // se nada casar, devolvemos null e a tela mostra o cartão honesto.
  var ALIAS = {
    enquadramento: "enquadramento_escada",
    escada_enquadramento: "enquadramento_escada",
    escada: "enquadramento_escada",
    enq_escada: "enquadramento_escada",
    planos: "enquadramento_escada",
    angulo: "angulo_camera",
    angulos: "angulo_camera",
    camera: "angulo_camera",
    angulo_de_camera: "angulo_camera",
    grade: "grade_posicao",
    grade_5x5: "grade_posicao",
    posicao_personagem: "grade_posicao",
    cabelo: "cabelo_comprimento",
    comprimento_cabelo: "cabelo_comprimento",
    comprimento_de_cabelo: "cabelo_comprimento",
    peso: "regua_peso",
    forca_da_tag: "regua_peso",
    chaves_colchetes: "regua_peso",
    portas: "quatro_portas",
    portas_de_entrada: "quatro_portas",
    quatro_portas_de_entrada: "quatro_portas",
    forca_ruido: "mapa_forca_ruido",
    strength_noise: "mapa_forca_ruido",
    img2img: "mapa_forca_ruido",
    ordem: "fita_ordem",
    fita_da_ordem: "fita_ordem",
    ordem_do_prompt: "fita_ordem",
    resolucao: "resolucoes_nativas",
    resolucoes: "resolucoes_nativas",
    proporcoes: "resolucoes_nativas",
    folha_referencia: "multiplas_vistas",
    folha_de_referencia: "multiplas_vistas",
    turnaround: "multiplas_vistas",
    reference_sheet: "multiplas_vistas",
    referencia: "preparar_referencia",
    preparar: "preparar_referencia",
    caixas: "caixas_do_prompt"
  };

  function normal(n) {
    return String(n || "")
      .toLowerCase()
      .replace(/[áàâã]/g, "a").replace(/[éê]/g, "e").replace(/í/g, "i")
      .replace(/[óôõ]/g, "o").replace(/[úü]/g, "u").replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function achar(nome) {
    var n = normal(nome);
    if (!n) return null;
    if (REG[n]) return REG[n];
    if (ALIAS[n] && REG[ALIAS[n]]) return REG[ALIAS[n]];
    // recorte individual de enquadramento, por id ou por texto de tag
    var porEnq = enqPorChave(n);
    if (porEnq) return function () { return enquadramentoUnico(porEnq); };
    var porAng = angPorChave(n);
    if (porAng) return function () { return anguloUnico(porAng); };
    if (/(^|_)enq(_|$)|enquadr|close_up|full_body|cowboy|wide_shot|portrait|upper_body/.test(n)) return REG.enquadramento_escada;
    if (/angul|from_above|from_below|from_side|from_behind|dutch|profile|camera/.test(n)) return REG.angulo_camera;
    if (/cabel|hair_length|comprim/.test(n)) return REG.cabelo_comprimento;
    if (/peso|weight|chave|colchete/.test(n)) return REG.regua_peso;
    if (/grade|posicao|position/.test(n)) return REG.grade_posicao;
    if (/resolu|proporc|aspect/.test(n)) return REG.resolucoes_nativas;
    if (/vista|turnaround|reference_sheet|folha/.test(n)) return REG.multiplas_vistas;
    if (/porta|reference|vibe|character_ref|style_ref/.test(n)) return REG.quatro_portas;
    if (/ruido|noise|strength|forca/.test(n)) return REG.mapa_forca_ruido;
    if (/ordem|order|balde/.test(n)) return REG.fita_ordem;
    return null;
  }

  function enqPorChave(n) {
    var mapa = {
      close_up: "close-up", closeup: "close-up", portrait: "portrait",
      upper_body: "upper body", lower_body: "lower body", cowboy_shot: "cowboy shot",
      full_body: "full body", wide_shot: "wide shot", very_wide_shot: "very wide shot"
    };
    for (var k in mapa) {
      if (Object.prototype.hasOwnProperty.call(mapa, k) && n.indexOf(k) >= 0) return mapa[k];
    }
    return null;
  }

  function angPorChave(n) {
    var mapa = {
      from_above: "from above", from_below: "from below", from_side: "from side",
      from_behind: "from behind", facing_viewer: "facing viewer", profile: "profile"
    };
    for (var k in mapa) {
      if (Object.prototype.hasOwnProperty.call(mapa, k) && n.indexOf(k) >= 0) return mapa[k];
    }
    return null;
  }

  var Esquemas = {
    tem: function (nome) { return !!achar(nome); },

    desenhar: function (nome) {
      var f = achar(nome);
      if (!f) return null;
      try { return f(); } catch (e) { return null; }
    },

    // Recebe o registro inteiro da tag e devolve o melhor desenho possível.
    // Ordem de tentativa: exemplo.ref -> texto da tag em inglês -> id.
    paraTag: function (tag) {
      if (!tag) return null;
      var ref = tag.exemplo && tag.exemplo.ref ? tag.exemplo.ref : null;
      var s = ref ? this.desenhar(ref) : null;
      if (s) return s;
      var porTag = tag.tag ? enqPorChave(normal(tag.tag)) : null;
      if (porTag) return enquadramentoUnico(porTag);
      var porTagA = tag.tag ? angPorChave(normal(tag.tag)) : null;
      if (porTagA) return anguloUnico(porTagA);
      if (tag.id) { s = this.desenhar(tag.id); if (s) return s; }
      if (tag.tag) { s = this.desenhar(tag.tag); if (s) return s; }
      return null;
    },

    semDesenho: semDesenho,
    fitaOrdem: fitaOrdem,
    lista: function () { return Object.keys(REG); }
  };

  global.Esquemas = Esquemas;
})(window);
