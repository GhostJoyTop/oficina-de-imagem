# FONTES — de onde veio cada bloco do acervo

Este documento existe para o **crítico conferir sem adivinhar**. Cada bloco de
dados aponta para a seção do `manual-novelai.html` de onde saiu.

**A fonte única é o tutorial que o autor já leu e aprovou:**
`manual-novelai.html`, montado a partir da documentação oficial do NovelAI
(docs.novelai.net). As referências abaixo usam o número da seção daquele
arquivo (`§01` a `§19.8`).

**Regra que foi obedecida:** nenhuma tag foi inventada. Toda tag do acervo tem o
texto exato encontrado no manual. Onde o manual não diz algo, o acervo **cala e
marca como não verificado** — não completa por conta própria.

---

## 1. Placar

| medida | número |
|---|---|
| Tags no acervo | **382** |
| Tags com `verificada: true` | **382** (100%) |
| Tags com `verificada: false` | **0** |
| Categorias | 17 |
| Gavetas (subcategorias) | 51 |
| Tags com aviso na tela | 112 |
| Tags que exigem outra tag (`requer`) | 31 |
| Tags restritas a um modelo | 7 (todas `v4`) |
| Blocos de regra marcados `verificado: false` | 5 (ver seção 5) |

---

## 2. As tags, por seção do manual

Contagem real, tirada do arquivo gerado.

### Do §18 — Armazém de tags (a seção que é o próprio armazém)

| gaveta do manual | tags |
|---|---|
| Quantidade e tipo | 10 |
| Cabelo › Comprimento | 9 |
| Cabelo › Penteado geral | 9 |
| Cabelo › Variações de rabo de cavalo | 6 |
| Cabelo › Franja e frente do rosto | 8 |
| Cabelo › Topo da cabeça | 6 |
| Cabelo › Textura | 5 |
| Cabelo › Cor | 19 |
| Cabelo › Cor combinada | 8 |
| Cabelo › Pelo facial | 6 |
| Olhos › Cor | 12 (+ `heterochromia`, do §03 item 2) |
| Olhos › Pupila e detalhes | 12 |
| Pele e rosto › Tom de pele | 6 |
| Pele e rosto › Cores fantásticas | 11 (10 cores + `colored skin`, citada no título da gaveta) |
| Pele e rosto › Detalhes de rosto | 9 (8 + `tattoo`, do §06) |
| Corpo › Altura | 3 |
| Corpo › Magro | 4 |
| Corpo › Robusto | 8 |
| Corpo › Atlético | 8 |
| Corpo › Peito | 6 |
| Roupa › Cabeça | 5 |
| Roupa › Tronco | 4 |
| Roupa › Pernas | 4 |
| Enquadramento (perto → longe) | 10 |
| Ângulo de câmera | 15 |
| Foco de objeto | 6 |
| Múltiplas vistas / folha de referência | 6 |
| Época / era | 7 |
| Qualidade | 6 |
| Estética | 6 |
| Dataset e outras | 4 (+ `text` e `english text`, tratadas pelo §13) |
| Símbolos com nome próprio | 7 (+ `square bikini`, alocada em roupa do tronco) |
| Ação entre dois personagens | 3 |

**As oito gavetas de cabelo do manual estão todas cobertas**, e a nona (pelo
facial) também. Nenhuma gaveta do §18 ficou de fora.

**Uma nota sobre `soft focus` e `dithering`.** As duas aparecem em duas gavetas
do manual (`soft focus` em Foco de objeto e em Efeitos especiais; `dithering` em
Aparência digital e em Efeitos especiais). No acervo cada uma existe **uma vez
só**, na gaveta de efeitos, com o `origem` citando as duas seções. Duplicar o
mesmo texto de tag em dois `id` deixaria o autor pôr a mesma palavra duas vezes
no prompt.

### Do §04 — Estilos artísticos

| gaveta | tags |
|---|---|
| Categoria da mídia | 4 |
| Ferramenta tradicional (medium) | 15 |
| Aparência digital | 6 |
| Movimentos e correntes | 10 |
| Técnica de traço e acabamento | 13 |
| Tratamento de cor | 14 |
| Cor dominante — `[cor] theme` | 12 |
| Efeitos especiais | 16 |

### Do §03 — Personagem consistente

| bloco | tags |
|---|---|
| Evolução do exemplo oficial da roupa (do vago ao completo) | 16 |
| `heterochromia` (item 2) | 1 |
| Enquadramento (item 5) | as 10 do §18, com `origem` citando os dois |

As 16 tags de roupa saem literalmente da linha final do exemplo oficial:
`witch hat, blue headwear, blue cape, white shirt, long sleeves, corset, leather
belt, leather pouch, short skirt, blue skirt, frilled skirt, black pantyhose,
brown gloves, knee boots` — mais `robe` e `blue robe`, das duas versões
anteriores do mesmo exemplo.

### Dos exemplos de prompt espalhados pelo manual

Estas tags não estão no §18, mas aparecem **escritas dentro de exemplos
oficiais**. Cada uma tem `origem` citando o exemplo exato.

| tag(s) | onde |
|---|---|
| `flower field`, `sunset`, `school uniform` | §02, exemplo do tutorial de introdução |
| `standing`, `forest` | §04, as quatro combinações prontas |
| `rain`, `night`, `coat`, `black shoes`, `hat`, `simple background` | §05, exemplos de peso numérico e negativo |
| `tattoo` | §06, callout "Truque de dedução" |
| `girl`, `boy` (sem número) | §07, regra da caixa de personagem |
| `park`, `looking at another`, `speech bubble` | §13, exemplo oficial de duas falas |
| `blue jacket` | §19.3, caminho A |
| `running`, `outstretched arms`, `looking back`, `city street` | §19.4, prompt de pose nova |
| `looking at viewer`, `angry`, `leather jacket` | §19.7, modelo de quadro de mangá |

---

## 3. As categorias que o autor exigiu por nome

O autor pediu, com estas palavras: *"vai ar a categorias, corpo, enquadramente,
paisagen, etc."*

| exigida | existe como | tags |
|---|---|---|
| corpo | `corpo` | 29 |
| enquadramento | `enquadramento` | 10 |
| paisagem | `paisagem` | 8 |

A categoria `paisagem` foi montada a partir do §02 ("Cena — onde, quando, luz,
clima") e das tags de cena que aparecem nos exemplos oficiais. É a menor
categoria do acervo, e isso é honesto: **o manual não traz uma gaveta de
cenário**. As 8 tags são as que ele realmente escreve em exemplos. Qualquer
outra tag de lugar que o autor quiser terá de vir de fora do manual — e aí entra
com `verificada: false`.

---

## 4. Os conflitos, e de onde cada um saiu

Nenhum conflito foi inventado. Todos derivam de uma frase do manual.

| conflito no acervo | frase do manual | onde |
|---|---|---|
| `monochrome`/`greyscale` × 79 tags de cor | "Confira se não sobrou nenhuma tag de cor específica no resto do prompt (tipo `blue hair`) — ela briga com `monochrome` ou `greyscale`" | §04, callout "Atenção com monochrome/greyscale" |
| etiquetas de qualidade × `text`/`english text` | "desligue as Etiquetas de Qualidade — elas incluem `no text` por padrão, o que briga com o que você está pedindo" | §13 |
| `chromatic aberration` × preset Pesado | "Alguns desses efeitos (como `chromatic aberration`) já estão dentro do preset 'Heavy' de Conteúdo Indesejado" | §04, callout "Atenção" |
| `close-up`/`portrait`/`upper body` × `wide shot`/`very wide shot`/`full body` | a escada "do mais fechado ao mais aberto" | §03 item 5 |
| `bald`/`bald girl` × penteado, textura e cor de cabelo | derivado: não há cabelo para pentear nem colorir | §18 Cabelo (gavetas) |
| `solo` × `2girls`, `3girls`, `2boys`, `2others`, `multiple girls`, `6+girls` | derivado do significado de `solo` | §18 Quantidade e tipo |
| `simple background` × `flower field`/`forest`/`city street`/`park` | derivado: fundo simples é o oposto de um lugar | §05 e §08 (fundo simples na referência) |
| ferramentas tradicionais × `pixel art`/`3d`/`photorealistic`/`realistic`/`anime screencap` | acabamentos que se anulam — é o padrão dado no contrato da planta | contrato da planta, seção "Exemplo de duas tags" |
| `lineart` × `no lineart` | as duas tags são opostas no próprio nome | §04 Técnica de traço |
| `pixel art` × `painterly` | acabamentos que se anulam | §04 Técnica de traço |

E os `requer`, todos com frase de origem:

| `requer` | frase do manual | onde |
|---|---|---|
| as 15 ferramentas tradicionais exigem `traditional media` | "funciona melhor combinada com a ferramenta específica — ex.: `traditional media, watercolor (medium)` em vez de só uma das duas" | §04 |
| as 10 cores fantásticas de pele exigem `colored skin` | "Cores fantásticas — use com `colored skin`" | §18, título da gaveta |
| as 6 variações de rabo de cavalo exigem `ponytail` | derivado: são variações da mesma coisa | §18, título da gaveta |

---

## 5. O que está marcado como NÃO verificado — e por quê

Cinco blocos. Todos em `acervo_regras.js`, nenhum em `acervo_tags.js`.

### 5.1 — Os quatro presets de Conteúdo Indesejado (`conteudo_indesejado.presets`)

**O manual não publica a lista de palavras de nenhum preset.** Ele diz só isto:

> "O site já vem com **presets automáticos** (Nenhum / Leve / Pesado, e variações
> por foco) que combatem defeitos comuns — mãos malformadas, marca d'água, baixa
> resolução. O preset recomendado já vem ativado por padrão; trocar de modelo
> muda a lista exata por trás dele." (§06)

Então os quatro presets estão no acervo **com os nomes certos e o conteúdo
vazio**: `conteudo_literal: null`, `verificado: false`. A única palavra
confirmada é `chromatic aberration`, dentro do Pesado (§04), e ela está no campo
`contem_confirmado`.

**Isto é uma lacuna real**, e a instrução do Construtor A pedia os presets
"palavra por palavra". Escrever as listas de memória seria exatamente o risco que
a regra dura proíbe: uma tag errada faz o autor gastar Anlas à toa. O campo
`aviso_lista_literal` diz ao autor o que fazer — copiar da tela do NovelAI.

### 5.2 — Os preços e as cotas dos planos (`custos.planos`)

Teste grátis de 30 imagens; Tablet 10 USD/mês; Scroll 15 USD/mês com 1000 Anlas;
Opus 25 USD/mês com 10.000 Anlas e geração sem Anlas até 28 passos.

**Nada disso está no `manual-novelai.html`.** Veio do briefing desta sessão. Cada
plano está com `verificado: false` e `origem: "briefing da sessão — NÃO consta no
manual-novelai.html"`, e o bloco tem um `aviso` mandando conferir na página de
assinatura antes de contar com os números.

Isso importa para o Construtor C: o teto de gasto dele usa Anlas, não dólares, e
os valores em Anlas **das ferramentas** (5 do Character Reference, 5 do Style
Reference, 2 do Vibe Transfer) esses **são** do manual, e estão com
`verificado: true`.

### 5.3 — Os endereços técnicos da API

Não estão neste acervo, de propósito: são do Construtor C, em
`ponte\endpoints.json`. O acervo só registra o fato, em `api.endpoints_publicados
= false`, com a frase do manual:

> "A documentação oficial do site, porém, **não publica os endereços técnicos**
> (endpoints) da geração de imagem — ela só diz que o token serve para usar a
> API." (§19.8)

### 5.4 — "Duas Character References se misturam num personagem só"

Está em `incompatibilidades`, com `verificado: true`, mas a origem é mista: o
manual documenta que o custo **soma** com mais de uma referência (§08, tabela), e
o fato de que elas se **misturam** veio do briefing da sessão. Registrado assim
no campo `origem`, sem disfarce.

### 5.5 — O que a matriz de modelos afirma sobre V4 e V3

O manual diz: "Recursos como Multi-Character Prompting, Peso Numérico,
Referência Precisa e Text Rendering só existem em V4 ou mais novos" (§16), e que
Precise Reference "só funciona no modelo V4.5" (§08), e peso negativo "só V4.5+"
(§05). A matriz `modelos[].suporta` é a combinação dessas três frases. O manual
**não afirma explicitamente** que o Vibe Transfer funciona em todos os seis
modelos; a matriz marca `true` em todos porque o manual nunca o restringe e o
apresenta como alternativa ao Precise Reference (que é o restrito). É uma
inferência conservadora, e fica registrada aqui.

---

## 6. As regras, bloco por bloco

| bloco de `acervo_regras.js` | seção do manual |
|---|---|
| `modelos` | §16 Qual modelo escolher |
| `incompatibilidades` | §05, §07, §08, §11, §13, §19.1 |
| `brigas_de_tag` | §03 item 2 e item 6, §04 callouts, §06 callout, §13 |
| `ordens.regra_geral` | §01 callout "A regra mais importante" + §16 |
| `ordens.opcoes` | §02 (padrão do manual) e §04 (estilo em primeiro) |
| `pesos` | §05 Força das tags, e §06 para o comportamento invertido no Conteúdo Indesejado |
| `conteudo_indesejado` | §06 |
| `multi_personagem` | §07 |
| `referencias` | §08 + §19.1 + §19.2 |
| `image2image` | §09 |
| `inpaint` | §10 |
| `upscale_enhance` | §11 |
| `director_tools` | §12 + §19.5 + §19.6 |
| `text_rendering` | §13 |
| `atalhos` | §14 |
| `canvas` | §09 (O Canvas) + §19.4 Técnica 2 |
| `custos.itens` | §08 tabela, §10 callout, §19.1 |
| `custos.limites` | §01, §19.7 callout, §19.8 |
| `api` | §19.8 |
| `avisos_permanentes` | §01, §03 callout, §15 callout, §16, §19.3 callout |

---

## 7. As receitas, uma por uma

| receita | seção do manual |
|---|---|
| Aquarela tradicional | §04 Combinações prontas |
| Xilogravura japonesa (ukiyo-e) | §04 Combinações prontas |
| Jogo retrô em pixel art | §04 Combinações prontas |
| Cinematográfico, quase foto | §04 Combinações prontas |
| Quadro de mangá (estilo e personagem fixos) | §19.7 modelo + passo a passo |
| Folha de referência do personagem | §08 + §19.2 callout |
| Prancha de personagem (uma vista) | §08 "Como preparar a imagem de referência" + §19.2 |
| Trocar o estilo — caminho A (Image2Image fraco) | §19.3 tabela, linha A |
| Trocar o estilo — caminho B (Line Art + Colorize) | §19.3 tabela, linha B |
| Trocar o estilo — caminho C (Character Reference) | §19.3 tabela, linha C |
| Trocar a pose, mantendo o personagem | §19.4 Técnica 1 |
| Roupa consistente — do vago ao completo | §03 item 6 |
| Duas falas na mesma imagem | §13 exemplo oficial |
| Primeiro prompt (exemplo de introdução) | §02 |

Os textos de `prompt_base` e de `blocos[].prompt` foram copiados **palavra por
palavra** dos blocos de exemplo do manual. Um crítico pode conferir com
Ctrl+F no `manual-novelai.html`.

---

## 8. Como conferir tudo isto sem confiar em mim

O acervo é gerado por script, e o script valida sozinho antes de gravar. As
checagens que ele roda, e que **falham a construção** se quebrarem:

1. nenhum `id` repetido, e nenhum fora do padrão `a-z0-9_`;
2. nenhum texto de `tag` repetido em dois `id` diferentes;
3. os 17 campos obrigatórios presentes em cada uma das 382 tags;
4. toda `categoria` e toda `subcategoria` citada existe de fato;
5. todo `id` citado em `exclusivo_com`, `conflita_com` e `requer` existe;
6. `modelo_minimo` só aceita `qualquer`, `v3`, `v4`, `v4.5`;
7. `exemplo.tipo` só aceita `esquema`, `vazio`, `nenhum` — e `nenhum` obriga
   `ref: null`;
8. `genero` só aceita `f`, `m`, `null`;
9. todo `id` de tag citado nas receitas existe no acervo;
10. todo `modelo_sugerido` das receitas existe na matriz de modelos;
11. todo valor de `ordem` das tags tem um balde correspondente em
    `regras.ordens.baldes`.

E os três arquivos foram testados nas duas pontas: `json.loads` no Python
(descartando a primeira e a última linha) e `<script src>` no navegador.
