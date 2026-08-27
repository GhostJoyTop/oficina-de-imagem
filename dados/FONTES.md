# FONTES — de onde veio cada bloco do acervo

Este documento existe para o **crítico conferir sem adivinhar**. Cada bloco de
dados aponta para a seção do `manual-novelai.html` de onde saiu.

**A fonte única é o tutorial que o autor já leu e aprovou:**
`manual-novelai.html`, montado a partir da documentação oficial do NovelAI
(docs.novelai.net). As referências abaixo usam o número da seção daquele
arquivo (`§01` a `§19.8`).

**Regra que foi obedecida:** nenhuma tag foi inventada em silêncio. Das 997
tags, **383 têm o texto exato encontrado no manual** (ou reconfirmado contra a
reconstrução dele) e estão com `verificada: true`. As outras **614 não estão
no manual** — 102 de cenário, ação e expressão (rodada 3), 15 de gênero,
formato e traço de mangaká (24/08/2026, seção 5.8), **496 de 27/08/2026**
(seção 5.9) e `est_ref_hirano` (27/08/2026, rodada 4, D11, seção 5.12) — e
estão todas com `verificada: false`, com a origem declarada e com a tela
obrigada a marcá-las. Onde o manual não diz algo, o acervo **diz que não
sabe** — nunca completa fingindo que sabe.

⚠️ **Atualização de 27/08/2026, rodada 3 (D7): o manual foi reposto, e só
parcialmente.** O `manual-novelai.html` original **não existe em lugar
nenhum** — procurado por código no projeto inteiro, nunca foi achado. O autor
decidiu (D7) repor o arquivo por busca em `docs.novelai.net`. O que voltou
**não é o original**: é uma reconstrução parcial, declarada como tal na
primeira linha do próprio arquivo, sem a numeração de seções antiga e sem
cobrir todo o vocabulário que o original cobria. A reconferência contra essa
reconstrução está na seção 5.11, com números e a lista completa.

---

## 1. Placar

| medida | número |
|---|---|
| Tags no acervo | **997** |
| Tags com `verificada: true` | **383** (38%) |
| Tags com `verificada: false` | **614** (62%) — 102 na seção 5.6, 15 na 5.8, 496 na 5.9, 1 na 5.12 |
| Categorias | 19 |
| Gavetas (subcategorias) | 70 |
| Tags com desenho esquemático | 45 |
| Tags com aviso na tela | 176 |
| Tags que exigem outra tag (`requer`) | 31 |
| Tags restritas a um modelo | 10 (todas `v4`) |
| Nós de `acervo_regras.js` com `verificado: false` | **14**, em 5 assuntos (ver seção 5) |
| Termos no glossário | **22** (21 do NovelAI, 1 nosso) |
| Receitas | 15 |
| Receitas com `verificado: true` | **13** |
| Receitas com `verificado: false` | **2** — `prancha_personagem` (ver 7.3) e `cenario_abatedouro_clandestino` (D9, 27/08/2026) |
| Receitas cujo prompt montado bate com o do manual | 4 de 10 que têm prompt do manual (ver 7.2) |

**Versões de hoje, 27/08/2026, e elas não batem entre si de propósito:**
`acervo_tags.js` em **1.7.0**, `acervo_receitas.js` em **1.3.0**,
`acervo_regras.js` em **1.2.1**. O que mudou e por quê está no `CONTRATO.md`,
logo na seção 1.

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
| Símbolos com nome próprio | 7 na gaveta + `neutral face`, que ficou na gaveta Expressão do rosto |
| Ação entre dois personagens | 3 |

**As gavetas de cabelo do manual estão todas cobertas.** São **nove**, contadas
uma a uma no §18: Comprimento, Penteado geral, Variações de rabo de cavalo,
Franja e frente do rosto, Topo da cabeça, Textura, Cor, Cor combinada e Pelo
facial. (O briefing desta construção falava em oito; o acervo segue a fonte, não
o briefing.) Nenhuma gaveta do §18 ficou de fora.

**Sobre a gaveta "Símbolos com nome próprio".** O manual junta ali oito grafias
curiosas que não têm nada a ver umas com as outras. Sete estão na gaveta
`especiais / simbolos` do acervo; `neutral face` ficou na gaveta Expressão do
rosto, que é onde o autor procuraria por ela. E, como as sete são de assuntos
diferentes, **cada uma carrega o balde do próprio assunto** — `square bikini`
entra no prompt junto da roupa do tronco, `bar eyes` junto dos olhos,
`character image` junto do enquadramento. A gaveta declara isso no campo
`ordem_vem_da_tag`, e o `CONTRATO.md` explica na seção 4.

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

| exigida | existe como | tags | do manual | de fora |
|---|---|---|---|---|
| corpo | `corpo` | 29 | 29 | 0 |
| enquadramento | `enquadramento` | 10 | 10 | 0 |
| paisagem | `paisagem` | **161** | 8 | 153 |

E as duas categorias que ele pediu em 27/08/2026, com estas palavras —
*"senti falta de 'personagens' objetos, como carros, robos, e coisas"*:

| exigida | existe como | tags | do manual | de fora |
|---|---|---|---|---|
| objetos e bichos como assunto | `assunto` | **193** | 0 | 193 |
| coisas na cena | `objeto` | **203** | 0 | 203 |

Nenhuma das duas tem uma só tag do manual, e o motivo está na seção 5.9: o
manual não está mais no disco.

**A `paisagem` tinha 8 tags até a rodada 3, e quatro delas eram lugares**
(`flower field`, `forest`, `city street`, `park`). O motivo era real: **o manual
não traz uma gaveta de cenário**. As 8 são as que ele escreve nos exemplos.

Na rodada 3 a crítica cobrou isto de frente — o autor pediu a categoria pelo
nome, e ela era a menor do acervo. A saída estava escrita no próprio briefing
(*"Se precisar de uma tag que não está, marque-a como não verificada dentro do
próprio arquivo de dados"*) e o contrato já tinha o campo. Entraram **55 tags de
cenário**, todas com `verificada: false`. A gaveta `pose` teve o mesmo problema
(11 tags, das quais só 3 de ação) e recebeu **47**. Detalhe na seção 5.6.

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

### 4.1 — A correção de 21/08/2026 na contagem de personagens

**O defeito.** As dez tags de contagem (`1girl`, `1boy`, `solo`, `2girls`…)
estavam todas marcadas como exclusivas entre si, numa gaveta só. O motor de
prompt trata `exclusivo_com` como **erro vermelho** ("não podem estar juntas").
O resultado era que a Oficina reprovava duas coisas certas:

| prompt reprovado | por que estava certo | onde no manual |
|---|---|---|
| `1boy, solo, standing, short brown hair, blue jacket…` | é o exemplo oficial do caminho A | §19.3 |
| `1boy, solo, running, from side, outstretched arms…` | é o exemplo oficial de pose nova | §19.4 |
| `1girl, 1boy` | prompt base de um quadro com dois personagens | §07 (até 6 personagens, contagem no prompt base) |

Ou seja: o acervo reprovava o próprio manual de onde ele foi tirado.

**A correção.** A contagem virou três eixos independentes — `contagem_garotas`,
`contagem_garotos`, `contagem_outros` — cada um de escolha única por dentro, e
`solo` foi para uma gaveta própria. Nenhum `id` de tag mudou, então o trabalho
já salvo do autor continua apontando para o lugar certo.

| relação | vale hoje |
|---|---|
| `1girl` × `2girls` | exclusivo (mesmo eixo) |
| `1girl` × `1boy` | **permitido** (eixos diferentes) |
| `1boy` × `solo` | **permitido** |
| `solo` × `2girls`, `3girls`, `2boys`, `2others`, `multiple girls`, `6+girls` | exclusivo |

**Conferência:** os dez prompts oficiais do manual foram passados pelas regras
de exclusividade do acervo. Antes da correção, dois davam erro vermelho. Depois,
**zero**.

### 4.2 — A correção de 23/08/2026: `no humans` brigava com 4 das 12

**O defeito, achado pela crítica.** A tag `pai_no_humans` (`no humans`, imagem
sem nenhuma pessoa) declarava conflito com quatro tags de contagem: `1girl`,
`1boy`, `2girls` e `solo`. A categoria `quem` tem **doze**. Escolher `3girls`
junto com `no humans` passava calado — e a explicação da própria tag prometia o
contrário: *"Briga com as tags de contagem, como 1girl."*

**A comparação que condena.** Dentro do mesmo arquivo, `monochrome` está ligada
às 78 tags de cor sem deixar nenhuma de fora. O padrão de rigor existia; aqui
não tinha sido seguido.

**A correção.** As oito que faltavam entraram — `3girls`, `2boys`, `1other`,
`2others`, `multiple girls`, `6+girls`, e as duas de caixa de personagem, `girl`
e `boy` — e as doze ganharam o recíproco, como já é feito nas tags de cor. Uma
conferência por código agora percorre todo `conflita_com` e todo `exclusivo_com`
do acervo procurando relação que só existe de um lado: **zero falhas de
reciprocidade em 484 tags.**

**Um limite escolhido, e ele é declarado.** `no humans` NÃO foi ligada às tags
de cabelo, corpo, pele e roupa, embora pedir `no humans` com `long hair` também
seja contraditório. Motivo: seriam mais de duzentos avisos amarelos, disparando
num caso que quase não acontece — quem pede uma paisagem sem gente não escolhe
penteado. Alarme que dispara demais ensina o autor a ignorar alarme, e isso é
achado de crítica registrado neste mesmo projeto. As doze tags de contagem são
o conflito que o autor de fato encontra.

### 4.3 — A correção de 23/08/2026: os prefixos de ação diziam o quê, não onde

**O defeito, achado pela crítica.** As seis tags da gaveta `pose › dupla`
(`source#hug`, `target#hug`, `mutual#hug` e três irmãs) têm `ordem: 70`, que é o
balde de pose do **prompt base**. Clicar nelas no Armazém punha `source#hug` no
prompt base, onde o prefixo não se liga a personagem nenhum. Ele vira texto
morto: o autor copia, paga em Anlas e não recebe a ação.

O `explica` de cada uma dizia o que o prefixo **marca** (*"marca o personagem
que faz a ação"*) e calava sobre **onde** ele funciona. O `aviso` falava só do
modelo (*"Só funciona no modo de vários personagens (V4 ou mais novo)"*), que é
uma condição diferente — dá para estar no V4.5 e ainda assim errar o lugar.

**O que o manual diz, exatamente.** §07 só apresenta os prefixos dentro do modo
de vários personagens, logo depois de *"cada um com sua própria caixa de
prompt"*. Ele **não** escreve a proibição com estas palavras. A regra é
derivada, e o registro em `regras.multi_personagem.origem_regra_lugar` diz isso.

**A correção, em três camadas.**

1. As seis tags: o `explica` passou a terminar em *"Ele vai dentro da caixa
   desse personagem"*, e o `aviso` abre com *"Só funciona DENTRO de uma caixa de
   personagem. No prompt base ela não faz nada"*, seguido do passo concreto —
   crie duas caixas, `source#hug` numa, `target#hug` na outra.
2. As gavetas `pose › dupla` e `quem › caixa_personagem` ganharam o campo
   `so_na_caixa_de_personagem: true`, para a tela poder fazer melhor que
   avisar: **mandar o clique direto para a caixa de personagem.**
3. Em `acervo_regras.js`, cada prefixo ganhou `onde`, e o bloco ganhou
   `regra_lugar`, `regra_lugar_para_tela` e `regra_contagem_espelho`.

**O `ordem: 70` não mudou, e não deve mudar.** Dentro da caixa, uma tag de pose
ordena como pose. A gaveta diz **onde** a tag vai; o balde diz **em que
posição**, dentro do lugar onde ela está.

**A cobrança tem de valer nos dois sentidos**, e isso é outro achado da mesma
crítica: contagem (`1girl`) dentro da caixa é erro, e `girl` solto no prompt
base também é. Hoje a Oficina só acende vermelho no primeiro caso. O campo
`regra_contagem_espelho` existe para o espelho ser escrito — **o motor de prompt
é do Construtor B.**

---

## 5. O que está marcado como NÃO verificado — e por quê

**Contado por código, não de memória:** em `acervo_regras.js` há **14 nós** com
`verificado: false`, e eles tratam de **5 assuntos** — os presets (5.1), os
planos (5.2), a mistura de duas referências (5.4), o Vibe Transfer por modelo
(5.5) e o termo "a ponte" (5.7). Fora deles, **102 tags** em `acervo_tags.js`
(5.6). A seção 5.3 não tem nó nenhum aqui: os endereços moram em
`ponte\endpoints.json`, que é do Construtor C.

Por que 14 nós e só 5 assuntos: um assunto ocupa vários nós. Os presets são 4
nós mais o `aviso_numeros`; os planos são o bloco, os 4 planos da lista e o
`seletor`. **A contagem anterior dizia "oito blocos, sete em acervo_regras.js" e
não batia com nenhuma das duas medidas** — nem nós, nem assuntos. Quem conferir
este arquivo deve conseguir reproduzir o número, e agora consegue:
`verificado: false` aparece 14 vezes no arquivo de regras.

### 5.1 — Os quatro presets de Conteúdo Indesejado (`conteudo_indesejado.presets`)

**O manual não publica a lista de palavras de nenhum preset.** Ele diz só isto:

> "O site já vem com **presets automáticos** (Nenhum / Leve / Pesado, e variações
> por foco) que combatem defeitos comuns — mãos malformadas, marca d'água, baixa
> resolução. O preset recomendado já vem ativado por padrão; trocar de modelo
> muda a lista exata por trás dele." (§06)

Então os quatro presets estão no acervo **com o conteúdo vazio**:
`conteudo_literal: null`, `verificado: false`. A única palavra confirmada é
`chromatic aberration`, dentro do Pesado (§04), e ela está no campo
`contem_confirmado`.

**Correção da rodada 3 — o quarto preset não tinha nome, e a tela fingia que
tinha.** Ele estava escrito como `Variações por foco`, que é a frase do manual,
no plural: uma família, não um preset. Nos programas de API que a comunidade usa
(a mesma NekoAI-API que o §19.8 cita), o preset com esse papel se chama **Human
Focus**. O acervo agora o chama `Foco humano (estimativa)` e diz, no campo
`explica`, que o nome veio de fora do manual.

**E os números.** O NovelAI identifica cada preset por um número, e o manual não
publica nenhum deles — está escrito no `_nota` do próprio `ponte\endpoints.json`.
A rodada 3 acrescentou dois campos para essa verdade chegar à tela onde a
escolha acontece: `conteudo_indesejado.nota_sob_seletor` (a linha discreta
embaixo do seletor) e `conteudo_indesejado.aviso_numeros` (o detalhe, com o
caminho do arquivo). Cada preset ganhou também `nome_no_site` e
`numero_estimado: true`. Escolher o preset errado custa uma imagem paga com um
filtro que o autor não pediu — por isso não basta o número estar certo do lado
da ponte: a tela tem de avisar que ele é chute.

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

**Corrigido na rodada 3: agora está `verificado: false`.** Até a rodada 2 este
item carregava `verificado: true` e citava como fonte "§08 tabela + briefing da
sessão". A crítica conferiu e tinha razão: procurei `mistur` no texto inteiro do
manual e as duas únicas ocorrências são do Remove BG ("uma mistura das duas"). O
§08 só diz que o **custo soma** quando há mais de uma referência. A regra de que
elas se **misturam num personagem só** veio do briefing desta sessão, e nada
mais.

Hoje o item diz isso com todas as letras: `verificado: false`, `origem: "briefing
da sessão — o manual não trata disto…"`, e um campo novo, `vale_mesmo_assim`,
explicando que é decisão do autor e que **o alerta vermelho da tela continua
valendo**. O que mudou não foi a regra; foi o carimbo mentiroso em cima dela.

**A crítica voltou em 23/08/2026, e com razão: a correção tinha parado aqui.**
O dado dizia `verificado: false` desde a rodada 3, e a tela continuava
escrevendo **"limite oficial do NovelAI"** — em três arquivos ao mesmo tempo,
segundo a medição: no motor de prompt, no painel e na ponte. O autor não lê o
acervo; ele lê a tela. Uma correção que não chega à tela não é correção.

O que entrou agora, do lado do dado: o próprio `explica` passou a carregar a
ressalva dentro dele (a tela que renderizar o campo já fica honesta), mais dois
campos novos — `frase_para_tela`, com a frase única para os três colarem, e
`nao_diga`, que nomeia a frase proibida e o motivo. **Os arquivos da interface e
da ponte são dos Construtores B e C; o que era meu está feito.**

**A regra geral que fica, para não precisar de caso a caso:** nenhum texto da
Oficina chama de oficial uma regra cujo registro diz `verificado: false`. São
14 registros assim em `acervo_regras.js` e 102 tags em `acervo_tags.js`.

### 5.5 — O que a matriz de modelos afirma sobre V4 e V3

O manual diz: "Recursos como Multi-Character Prompting, Peso Numérico,
Referência Precisa e Text Rendering só existem em V4 ou mais novos" (§16), e que
Precise Reference "só funciona no modelo V4.5" (§08), e peso negativo "só V4.5+"
(§05). A matriz `modelos[].suporta` é a combinação dessas três frases.

**O buraco, e a correção da rodada 3.** O manual **não diz em que modelos o Vibe
Transfer funciona**. A palavra aparece cinco vezes no texto e nenhuma delas fala
de modelo. A matriz marcava `true` nos seis e creditava ao §16 — que não o cita.
Esta seção já registrava a inferência desde a rodada 2, mas **o dado não**, e a
tela desenhava um "sim" igual ao dos outros recursos.

Agora cada modelo traz `suporta_verificado`, com a mesma forma de `suporta`, e o
campo `vibe_transfer_verificado: false` que a tabela da tela lê para escrever
**"sim (não verificado)"**. Entrou também uma briga de tag nova,
`vibe_em_modelo_nao_confirmado`, de gravidade amarela, para a tela avisar
**antes** de cobrar os 2 Anlas da codificação num modelo fora do V4.5. E um bloco
`modelos_nota` diz, em três frases, o que o manual garante e o que a Oficina
supõe.

---

### 5.6 — As 102 tags que vieram de fora do manual (novo na rodada 3)

**São todas de `paisagem` (55) e de `pose` (47).** Nenhuma está no manual, e
todas trazem `verificada: false` com

`origem: "fora do manual — grafia de uso comum na comunidade do NovelAI; confira a bolinha de sugestão ao digitar no site"`.

**Por que entraram.** O autor pediu a categoria `paisagem` pelo nome, e ela
tinha quatro lugares. O manual não tem gaveta de cenário nem de ação — conferido
por busca no próprio `manual-novelai.html`: `indoors`, `outdoors`, `rooftop`,
`classroom`, `beach`, `snow`, `sitting`, `smile`, `crying`, `arms crossed` dão
**zero ocorrências** cada uma. O briefing autoriza a saída, com estas palavras:
*"Se precisar de uma tag que não está, marque-a como não verificada dentro do
próprio arquivo de dados."* O campo existia desde a 1.0.0 e nunca tinha sido
usado — em 382 tags, `verificada: false` aparecia zero vezes.

**O que entrou, por gaveta**

| gaveta | quantas | exemplos |
|---|---|---|
| `paisagem › dentro_fora` (nova, escolha única) | 2 | `indoors`, `outdoors` |
| `paisagem › lugar` | 27 | `rooftop`, `alley`, `ruins`, `warehouse`, `laboratory`, `classroom`, `train interior`, `beach`, `desert` |
| `paisagem › tempo_luz` | 19 | `day`, `dusk`, `fog`, `snowing`, `cloudy sky`, `starry sky`, `lightning`, `explosion`, `moonlight`, `light rays` |
| `paisagem › fundo` | 7 | `white background`, `blurry background`, `scenery`, `no humans` |
| `pose › acao` | 21 | `sitting`, `kneeling`, `squatting`, `jumping`, `falling`, `crossed arms`, `fighting stance`, `holding sword` |
| `pose › olhar` | 4 | `looking away`, `looking down`, `looking up`, `looking to the side` |
| `pose › expressao` | 19 | `smile`, `crying`, `surprised`, `scared`, `smirk`, `shouting`, `blush`, `closed eyes` |
| `pose › dupla` | 3 | `mutual#holding hands`, `source#punching`, `target#punching` |

**As quatro regras que essas 102 obedecem, e que o validador cobra:**

1. **`verificada: false`, sem exceção.** A tela põe o selo NV na bolinha e uma
   nota amarela na ficha — "Esta tag não foi encontrada no manual oficial do
   NovelAI. Ela pode não existir para a IA, e ser simplesmente ignorada."
2. **`origem` começando por "fora do manual".** É o que o validador confere,
   uma por uma.
3. **`requer` vazio, obrigatoriamente.** A tela escreve, para o campo `requer`:
   *"O manual diz que X rende mais junto com Y."* O manual não diz nada dessas
   tags. Usar o campo aqui plantaria uma frase falsa na ficha, então o
   validador reprova qualquer uma que o use. As dependências reais delas (por
   exemplo, `white background` andar junto de `simple background`) estão
   escritas no `explica`, que não afirma nada em nome do manual.
4. **Nenhuma repete o texto de uma tag que já existia.** Duas caíram nessa
   armadilha e foram retiradas antes de gravar: `backlighting` e `lens flare` já
   moravam em `estilo › efeitos`, verificadas, e teriam virado a mesma palavra
   duas vezes no prompt.

**Onde ainda pode haver erro, e como ele aparece.** A grafia de algumas tem
variante conhecida — o Danbooru, que é o vocabulário de onde esse tipo de tag
vem, renomeou `arms crossed` para `crossed arms`, `hand on hip` para `hand on
own hip`, e `crouching` para `squatting`. O acervo usa a forma mais recente e
**escreve a antiga no campo `aviso` daquelas tags**, mandando o autor conferir a
bolinha de sugestão do site. É a única defesa honesta: quem sabe qual grafia o
modelo conhece é o próprio site, e ele mostra isso na bolinha.

---

### 5.7 — O termo "a ponte" (`glossario`)

É o único nó de `verificado: false` que **não** é lacuna do manual: é palavra
nossa. "A ponte" (o programinha da janela preta, que salva no seu disco) não
existe no NovelAI — foi inventada nesta Oficina para dar nome à parte que roda
fora do navegador. O campo `de: "oficina"` a separa dos 21 termos que vieram do
NovelAI, e o `verificado: false` diz a verdade: não há o que conferir no manual,
porque o manual não fala dela.

---

### 5.8 — As 15 tags de gênero, formato e traço de mangaká (24/08/2026)

**Pedido do autor, com estas palavras:** *"senti falta de tagas de estilo de
animes e de traços de animes, lá tem de artes estilosa artisticos mas não vi de
animes. tanto o tipo como seinen, shounen etc, como o traço como de akira
toriama, outros mangakas, manwha e manuha, e outros."* Ele também relatou que
faltava um jeito claro de escolher as características de cada personagem
separadamente numa cena com mais de um (isso não é lacuna de dado — é lacuna de
interface, corrigida em `painel.js`, não neste arquivo).

**Conferido por busca no `manual-novelai.html`:** `shounen`, `shoujo`, `seinen`,
`josei`, `manhwa`, `manhua`, `webtoon`, `toriyama`, `oda`, `takeuchi`, `clamp`,
`otomo`, `miura`, `ghibli` e `takahashi` dão **zero ocorrências**, cada uma. O
manual não tem gaveta de gênero de mangá nem de referência de artista — só
`anime screencap` e `anime coloring` (acabamento visual, seção 2 acima), e
`retro artstyle` (traço genérico de época). Por isso as 15 entram com
`verificada: false`.

**O que entrou, por gaveta**

| gaveta | quantas | tags |
|---|---|---|
| `estilo › genero_formato` | 7 | `shounen`, `shoujo`, `seinen`, `josei`, `manhwa`, `manhua`, `webtoon` |
| `estilo › mangaka` | 8 | referência de traço de Akira Toriyama, Eiichiro Oda, Naoko Takeuchi, CLAMP, Katsuhiro Otomo, Kentaro Miura, Studio Ghibli e Rumiko Takahashi |

**Duas ressalvas, e elas são de natureza diferente uma da outra:**

1. **As 7 de `genero_formato` são categoria de público-alvo, não traço
   visual.** Shonen inclui traço redondo (Dragon Ball) e traço realista
   (Attack on Titan) na mesma prateleira. O `aviso` de cada uma diz isso e
   recomenda combinar com uma tag de traço ou de coloração.
2. **As 8 de `mangaka` usam nome de pessoa ou estúdio real.** O NovelAI foi
   treinado com imagens marcadas no Danbooru — o vocabulário de onde vem quase
   toda tag desta Oficina —, e mangaká profissional quase nunca está lá como
   tag de artista (o Danbooru marca sobretudo fanart, não a obra original do
   autor). Isto **não é confirmado nem negado**: pode funcionar, pode não
   mudar nada. O `aviso` de cada uma diz isso com todas as letras, e recomenda
   testar antes de repetir em várias gerações pagas.

**As quatro regras da seção 5.6 valem aqui também, e foram conferidas por
código:** `verificada: false` em todas; `origem` começando por "fora do
manual"; `requer` vazio nas 15; nenhuma repete o texto de uma tag que já
existia (`anime screencap`, `anime coloring` e `retro artstyle` foram
conferidas contra as 15 novas — nenhuma colisão).

---

### 5.9 — As 497 tags de coisa que não é gente (27/08/2026)

**Pedido do autor:** *"senti falta de 'personagens' objetos, como carros,
robos, e coisas. as vezes a cena não é só de pessoas. quero animais também."*
E depois: *"faça uma varredura total na novel AI e pegue todas as tag, varra
pela internet e busque tags importantes para as historia que estou
escrevendo"*.

Mais as decisões **D5** (entra também material e parte de animal) e **D6** (o
que só existe na Bíblia entra marcado), de `REFERENCIAS_COAUTOR_fafa8949.md`.

**Por que a origem delas não é o manual, e nem podia ser.** O
`manual-novelai.html` não está no disco (seção 1). Não havia onde procurar. As
497 entram com `verificada: false`, sem exceção — inclusive `cat`, `dog` e
`sword`, que qualquer um diria que funcionam.

#### O que substituiu a conferência no manual

Cada uma das 497 foi **medida na API pública do Danbooru**, o vocabulário com
que o NovelAI foi treinado, em 27/08/2026. A consulta é reproduzível:

```
https://danbooru.donmai.us/tags.json?search[name_comma]=cat,dog,sword&limit=1000
```

O campo `origem` de cada tag traz o número de imagens marcadas com aquela
grafia exata. Foram medidos **695 candidatos**; entraram 497.

**Isso é mais forte do que a busca no manual era, num ponto:** a busca no
manual dizia se a palavra aparecia num texto. A medição diz **quantas imagens o
modelo viu com aquela etiqueta** — que é a pergunta que de fato importa para
saber se a tag muda a imagem.

#### O que a medição derrubou — 66 grafias que pareciam óbvias

Todas dão **zero** imagens. Todas teriam ido para o prompt do autor e não
fariam nada, e ele teria pago a geração assim mesmo.

| escrevi | o certo | quantas imagens o certo tem |
|---|---|---|
| `insect` | `bug` | 99.485 |
| `pistol` | `handgun` | 53.482 |
| `vehicle` | `motor vehicle` | 61.876 |
| `photo` | `photo (object)` | 19.318 |
| `bandage` | `bandages` | 129.938 |
| `chains` | `chain` | 142.082 |
| `mouse`, `rat` | `mouse (animal)` | 10.463 |
| `bat` | `bat (animal)` | 17.651 |
| `mechanical arm` | `mechanical arms` | 24.662 |
| `curtain` | `curtains` | 91.900 |
| `streetlight` | `lamppost` | 14.289 |
| `jet` | `fighter jet` | 3.673 |
| `metal`, `steel`, `iron`, `zinc`, `asphalt`, `wood`, `plastic` | — | não existe equivalente |
| `wall`, `blade`, `machinery`, `spirit`, `beast`, `mutant`, `slum`, `tied up`, `medkit` | vários | — |

#### Duas armadilhas de significado

1. **`mole` tem 397.672 imagens e não é a toupeira** — no Danbooru é a **pinta
   do rosto**, e a Oficina já tem `mole under eye`. Ficou de fora.
2. **`dog ears`, `animal ears`, `pointy ears`, `animal hands`, `animal feet`
   quase nunca marcam um bicho.** Marcam **pessoa com traço de bicho** — o
   `dog girl` do site, que sozinho tem 50.407 imagens. As cinco entraram com um
   `aviso` que começa com ⚠️ e manda usar `dog` + `animal focus` para o cão.
   Para o Ghost, o caminho limpo é `snout`, `whiskers`, `floppy ears`,
   `fluffy tail` e `tail wagging`, que não têm esse problema.

#### O que entrou, por gaveta

| gaveta | quantas |
|---|---|
| `assunto › animal` | 68 |
| `assunto › criatura` | 48 |
| `assunto › veiculo` | 31 |
| `assunto › maquina` | 32 |
| `assunto › parte_animal` | 14 |
| `objeto › arma_branca` | 39 |
| `objeto › arma_fogo` | 29 |
| `objeto › protecao` | 33 |
| `objeto › objeto_cena` | 76 |
| `objeto › comida` | 26 |
| `paisagem › construcao` | 45 |
| `paisagem › natureza` | 25 |
| `paisagem › material` | 26 |
| `paisagem › tempo_luz` | 2 |
| `roupa › tronco` | 2 |
| `estilo › efeitos` | 1 |

#### As quatro regras da seção 5.6 valem aqui, e foram conferidas por código

`verificada: false` nas 497; `origem` começando por "fora do manual" nas 497;
`requer` vazio nas 497; e **nenhuma repete o texto de uma tag que já existia** —
a checagem 2 pegou `helmet`, `explosion`, `fire`, `smoke`, `ruins`, `factory`,
`laboratory`, `warehouse`, `church`, `hospital`, `city`, `bridge` e `stairs`,
que já moravam no acervo, e elas não foram duplicadas.

#### As brigas novas, e o limite declarado de cada uma

| briga | quantas | critério |
|---|---|---|
| `simple background` × construção e ambiente | +76 | a tag põe cenário na imagem. Fundo liso é o contrário disso. Ficaram **de fora** flor, pétala, folha, galho, espinho e as tags de material que não são ambiente (couro, seda, tinta, arranhão): cabem num fundo liso sem contradição |
| `no humans` × ser em forma de gente | +29 | só entra a tag que **nomeia** um ser humanoide (`monster girl`, `android`, `dog girl`, `furry`…). Chifre, garra, presa e veia valem também para bicho, e ficaram de fora — alarme que dispara demais ensina a ignorar alarme |

`simple background` foi de 33 para 109 brigas; `no humans`, de 12 para 41.

#### O que NÃO mudou, de propósito

**`monochrome` e `greyscale` continuam com exatamente 78 brigas cada.** Nenhuma
das 497 nomeia cor. `black cat` e `white horse` existem no Danbooru e ficaram
fora: toda tag de cor precisaria entrar na teia dos dois, e a cor do bicho
pertence ao `explica`, não ao nome da tag.

#### O que ficou faltando, declarado

- **Abatedouro clandestino** (24 menções na prosa): `slaughterhouse` dá 0 e
  `meat hook` dá 53. **Não há tag.**
- **A raça do Ghost.** Ele é Spitz na ficha, e `japanese spitz` tem **10
  imagens** — não funciona. Entrou `shiba inu` (2.734) como o vizinho mais
  parecido, com o `aviso` dizendo exatamente isso.
- **Os materiais do livro.** `metal` é a palavra de coisa mais repetida da obra
  (374 menções) e **não existe como tag**. Ver a tabela no `CONTRATO.md`.

**Atualização de 27/08/2026, rodada 3 (D7).** Das 497 tags que entraram nesta
rodada 1, **1 foi promovida a `verificada: true`** depois que o manual foi
reconstruído: `nat_petals` ("petals"), achada no exemplo de introdução do
site oficial. As outras 496 continuam como estão descritas nesta seção. Ver
seção 5.11 para o método e o resultado completo.

---

### 5.11 — A reconferência de 27/08/2026, rodada 3 (D7)

O autor decidiu (D7, `REFERENCIAS_COAUTOR_fafa8949.md`, resposta "p1. a")
repor o `manual-novelai.html` por busca em `docs.novelai.net`, já que o
original não existe em lugar nenhum do projeto. O arquivo reposto —
`dados\manual-novelai.html` — é uma **reconstrução parcial**, montada com
vocabulário de tag extraído de 19 páginas oficiais em inglês (fetch de
27/08/2026), sem copiar parágrafo nenhum do site (regra de direito autoral) e
sem a numeração de seções do original. Ele mesmo lista, na última seção, o
que ficou de fora.

**O método.** Cada uma das 382 tags `verificada: true` e das 497 tags novas
de 27/08 (rodada 1) foi procurada, como frase exata (sem diferenciar
maiúscula/minúscula), dentro do vocabulário reconstruído — o mesmo tipo de
busca que a checagem 12 já fazia contra o arquivo original.

**O resultado, por número:**

| grupo | bateram | não bateram | o que aconteceu com quem não bateu |
|---|---|---|---|
| 382 antigas (`verificada: true`) | **346** | **36** | continuam `true` — reconstrução parcial não é prova de erro |
| 497 novas de 27/08, rodada 1 (`verificada: false`) | **1** | 496 | a 1 (`nat_petals`) foi promovida a `true`; as 496 continuam `false` |

**A tag promovida.** `nat_petals` ("petals") foi achada no exemplo de
introdução de `docs.novelai.net/en/image/tutorial-imgintro/` — a mesma cena
de exemplo do §02 do manual antigo ("no humans, flower field, sunset, 1girl,
messy hair, brown hair, green eyes, from side, school uniform"), com
"petals" no meio. `origem` atualizado para citar isto, mais os 173.063
resultados já medidos no Danbooru na rodada 1.

**As 36 tags antigas não reconfirmadas — a lista inteira, para quem quiser
aprofundar.** Nenhuma foi tocada: continuam `verificada: true`, com o
`origem` histórico que já tinham (a busca no manual original, quando ele
existia). A causa mais provável, em cada faixa, está anotada:

| `id` | `tag` | causa mais provável |
|---|---|---|
| `quem_solo` | `solo` | página consultada listou só `1girl`/`1boy`/`1other`; `solo` deve estar noutra parte não coberta |
| `quem_2girls` | `2girls` | idem |
| `quem_3girls` | `3girls` | idem |
| `quem_2boys` | `2boys` | idem |
| `quem_2others` | `2others` | idem |
| `quem_multiple_girls` | `multiple girls` | idem |
| `quem_6plus_girls` | `6+girls` | idem |
| `cx_girl` | `girl` | idem — a página de multi-personagem fala de prefixo, não desta grafia solta |
| `cx_boy` | `boy` | idem |
| `mv_turnaround` | `turnaround` | a página de criação de personagem confirma `multiple views` e `reference sheet`, mas não esta palavra |
| `mv_cropped_shoulders` | `cropped shoulders` | não encontrada em nenhuma página consultada |
| `foc_object_focus` | `object focus` | a lista de foco de objeto do site trouxe as 5 específicas, mas não o termo genérico |
| `cab_bald_girl` | `bald girl` | a página confirma `bald`, mas não a variante composta |
| `pel_dark_skinned_female` | `dark-skinned female` | a página confirma `dark skin`, mas não a forma composta com gênero |
| `pel_dark_skinned_male` | `dark-skinned male` | idem |
| `pel_tattoo` | `tattoo` | não encontrada na página de criação de personagem consultada |
| `rou_hat` | `hat` | a página lista `baseball cap`, `helmet` etc., mas não "hat" sozinho |
| `rou_robe` | `robe` | não encontrada — pode estar num exemplo de prompt específico não mineirado |
| `rou_blue_robe` | `blue robe` | idem |
| `rou_blue_jacket` | `blue jacket` | idem — provável exemplo do §19.3 antigo, página equivalente não identificada |
| `rou_leather_jacket` | `leather jacket` | idem — provável exemplo do §19.7 antigo |
| `rou_coat` | `coat` | provável exemplo de peso do §05 antigo, não localizado |
| `rou_black_shoes` | `black shoes` | idem |
| `pos_standing` | `standing` | tags de ação/pose não têm página própria nos documentos oficiais de hoje |
| `pos_running` | `running` | idem |
| `pos_outstretched_arms` | `outstretched arms` | idem |
| `pos_looking_at_viewer` | `looking at viewer` | idem |
| `pos_looking_back` | `looking back` | idem |
| `pos_looking_at_another` | `looking at another` | idem — confirmado indiretamente por existir a tag irmã em uso na doc, mas não a grafia exata |
| `pos_angry` | `angry` | idem |
| `pai_forest` | `forest` | tags de cenário não têm página própria nos documentos oficiais de hoje |
| `pai_city_street` | `city street` | idem |
| `pai_park` | `park` | idem |
| `pai_night` | `night` | idem |
| `pai_rain` | `rain` | idem |
| `pai_simple_background` | `simple background` | citada dentro do acervo (conflita com paisagem), mas não achada nas páginas de hoje consultadas |

**Por que isto não vira uma reprovação em massa.** A maior parte desta lista
são exatamente os exemplos de prompt espalhados pelo manual antigo (seção 2
deste documento: §02, §04, §05, §13, §19.3, §19.4, §19.7) — frases inteiras de
exemplo, não vocabulário de armazém. A reconstrução de 27/08/2026 extraiu
vocabulário de armazém (listas de tags por categoria), não voltou a caçar
cada exemplo de prompt espalhado pelo tutorial inteiro — isso exigiria minerar
cada página de tutorial frase por frase, o que o método desta rodada (extração
de lista, não de prosa) não fez. **Isto está declarado como lacuna, não
escondido.**

**O que fica para depois, se o autor quiser aprofundar.** Reler as páginas de
tutorial (`tutorial-imgintro`, `tutorial-charactercreation`,
`tutorial-artstyles`) frase por frase, procurando cada uma das 36 grafias
dentro dos exemplos de prompt (não só nas listas de vocabulário), é o próximo
passo possível. Não foi feito nesta rodada por ser um trabalho de outra
ordem de grandeza (leitura de prosa completa, não extração de lista), e o
autor não pediu isso especificamente em D7.

---

### 5.12 — A 9ª tag de `estilo › mangaka`: Kouta Hirano (27/08/2026, rodada 4, D11)

**Pedido do autor, com estas palavras:** *"quero que inclua nos estilos o
autor Kouta Hirano de Hellsing. ao colocar os estilos e nom dos autores
coloque um obra famosa deles."*

**Conferido por busca no `manual-novelai.html` (a reconstrução parcial de
27/08/2026, rodada 3):** `Hirano` e `Hellsing` dão **zero ocorrências**. O
manual não tem gaveta de referência de artista — o mesmo achado que já valia
para as outras 8 tags de `mangaka` (seção 5.8). Por isso `est_ref_hirano`
entra com `verificada: false`.

**A regra da obra famosa entre parênteses não é nova.** É o padrão que já
existia nas 8 tags de `mangaka` desde 24/08/2026 (seção 5.8) — `pt: "traço de
Akira Toriyama (Dragon Ball)"`, e assim por diante. `est_ref_hirano` segue o
mesmo formato: `pt: "traço de Kouta Hirano (Hellsing)"`.

A gaveta `estilo › mangaka` passa de 8 para **9** tags. O `aviso` de
`est_ref_hirano` é o mesmo texto das outras 8 (seção 5.8, ressalva 2): nome de
mangaká profissional quase nunca existe no Danbooru como tag de artista — pode
não mudar nada na imagem.

---

## 6. As regras, bloco por bloco

| bloco de `acervo_regras.js` | seção do manual |
|---|---|
| `modelos` | §16 Qual modelo escolher; `suporta_verificado` e `vibe_transfer_verificado` são da rodada 3 — ver 5.5 |
| `modelos_nota` | **novo na rodada 3** — o que a matriz garante e o que ela supõe |
| `incompatibilidades` | §05, §07, §08, §11, §13, §19.1 |
| `brigas_de_tag` | §03 item 2 e item 6, §04 callouts, §06 callout, §13. A oitava, `vibe_em_modelo_nao_confirmado`, é da rodada 3 e nasce de uma **lacuna** do manual, não de uma frase dele |
| `ordens.regra_geral` | §01 callout "A regra mais importante" + §16 |
| `ordens.opcoes` | §02 (padrão do manual) e §04 (estilo em primeiro) |
| `ordens.baldes[].porque_sobe` / `porque_desce` | **novo na rodada 3** — texto nosso, um para cada direção. A rodada 2 tinha um motivo só, e a Régua dizia que a tag desceu para o fim *porque pesa mais no começo* |
| `pesos` | §05 Força das tags, e §06 para o comportamento invertido no Conteúdo Indesejado |
| `conteudo_indesejado` | §06. `nota_sob_seletor`, `aviso_numeros`, `nome_no_site` e a troca de "Variações por foco" por "Foco humano (estimativa)" são da rodada 3 — ver 5.1 |
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
| `glossario` | **novo na rodada 2** — ver 6.1 |
| `etiquetas_qualidade` | **novo na rodada 2** — §04 callout "Atenção" + §13 |

### 6.1 O glossário — de onde vem cada explicação, e o que é nosso

O `glossario` tem **22 termos**. Ele nasceu de um defeito medido: "Anlas"
aparecia 15 vezes na tela e nunca era explicado, e é a palavra que controla o
dinheiro do autor.

**A honestidade importa aqui**, porque explicação é onde é mais fácil inventar:

- **21 termos são do NovelAI** (`de: "novelai"`) e cada um aponta a seção do
  manual onde o termo é usado. Anlas: §08. Token: §19.8. Semente: §03 callout.
  Passos: §19.3 callout. Etiquetas de Qualidade: §04 e §13. E assim por diante.
- **1 termo é nosso** (`de: "oficina"`, `verificado: false`): **"a ponte"**. É
  vocabulário que inventamos para o programa da janela preta. Não existe no
  NovelAI, e o dado diz isso na cara em vez de deixar parecer termo oficial.
- **Um caso que merece nota:** o manual **usa** a palavra Anlas sete vezes e
  **nunca a define**. A definição do glossário ("a moeda de dentro do NovelAI:
  créditos que vêm com a assinatura") é leitura direta da tabela de custo do
  §08 e da tabela de planos. O campo `origem` registra isso por extenso:
  *"§08 tabela de custo (o manual usa a palavra, mas não a define)"*.

### 6.2 A ressalva do Opus — o que é do manual e o que é do briefing

`custos.nota_opus` diz que no Opus a geração sai de graça mas a referência de
personagem continua custando 5 Anlas por imagem. As duas metades têm origens
diferentes, e isso está marcado:

| afirmação | de onde vem | `verificado` |
|---|---|---|
| Character Reference custa +5 Anlas por imagem, e soma | §08 tabela | **sim** |
| Vibe Transfer custa 2 Anlas para codificar, uma vez | §08 tabela | **sim** |
| Inpaint Focado não gasta Anlas para assinante Opus | §10 callout | **sim** |
| Opus custa 25 USD e gera sem Anlas até 28 passos | briefing da sessão | **não** |

Ou seja: **a parte que evita o autor gastar à toa é a verificada.** A parte de
preço de assinatura continua com `verificado: false` e o aviso de conferir na
página do NovelAI.

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
| Prancha de personagem (uma vista) | §08 e §19.2 — **os dois em prosa. O manual não escreve prompt nenhum para ela.** Ver 7.3 |
| Trocar o estilo — caminho A (Image2Image fraco) | §19.3 tabela, linha A |
| Trocar o estilo — caminho B (Line Art + Colorize) | §19.3 tabela, linha B |
| Trocar o estilo — caminho C (Character Reference) | §19.3 tabela, linha C |
| Trocar a pose, mantendo o personagem | §19.4 Técnica 1 |
| Roupa consistente — do vago ao completo | §03 item 6 |
| Duas falas na mesma imagem | §13 exemplo oficial |
| Primeiro prompt (exemplo de introdução) | §02 |
| Abatedouro clandestino | nenhuma — nasceu em 27/08/2026 (D9), não vem do manual. Ver 7.4 |

**Treze das quinze copiam o manual; duas não, e as duas estão marcadas.** Os
textos de `prompt_base` das treze foram copiados palavra por palavra dos
blocos de exemplo do manual, e um crítico confere com Ctrl+F no
`manual-novelai.html` original (quando existia) ou na reconstrução dele
(desde 27/08/2026 — ver seção 1, aviso do topo). A `prancha_personagem` (a
Oficina montou sozinha a partir de uma descrição em prosa — seção 7.3) e a
`cenario_abatedouro_clandestino` (nasceu de tags do próprio acervo, a pedido
do autor — seção 7.4) carregam `verificado: false`.

**Esta frase estava errada até 23/08/2026.** Ela dizia "os textos foram copiados
palavra por palavra", sem exceção, e era o mesmo carimbo mentiroso que a seção
5.4 já tinha registrado noutro lugar. Não mudou nenhuma receita: mudou a frase.

### 7.1 As duas exceções ao "palavra por palavra", e por quê

Na rodada 2 duas coisas deixaram de ser cópia literal, **de propósito**, e as
duas por causa de um defeito que a cópia literal causava:

1. **O prefixo `Text: ` saiu de `bloco_texto` e do `blocos[].prompt` da fala.**
   O manual escreve `Text: I'm not going back.`, e o dado agora guarda só
   `I'm not going back.`. Motivo: o motor da tela prefixa por conta, e a Bancada
   estava mostrando `Text: Text: …`. O manual (§13) avisa que qualquer coisa
   depois do `Text:` pode acabar **desenhada dentro da imagem** — o prefixo
   dobrado viraria a palavra "Text:" escrita no quadro. **A citação literal
   continua no arquivo**, no campo `exibir_como`, que é o que o cartão mostra.

2. **`estilo_pixel` guarda `year 1998` no campo `valor` da tag `year XXXX`.** O
   manual escreve `year 1998` no exemplo, e a tag do armazém é `year XXXX`. Sem
   o campo `valor`, a receita entregava `year XXXX` literal ao NovelAI — um
   prompt sem sentido, pago em Anlas.

### 7.2 O prompt que a Oficina monta ≠ o prompt do cartão, em 6 das 14

Cada receita agora carrega `prompt_oficial` (o do manual), `prompt_montado` (o
que a Oficina entrega) e `ordem_bate`. **Quatro batem palavra por palavra, seis
não batem, e quatro não têm prompt do manual para comparar.**

Nas seis, a diferença é sempre de agrupamento — a Oficina junta todo o estilo, e
depois a roupa por parte do corpo; o manual escreveu na ordem em que a pessoa
pensa. São as mesmas tags, e cada uma traz o `ordem_nota` explicando em uma
frase. O detalhe está no `CONTRATO.md`, seção 9.4.

**O placar era 4 / 7 / 3 até 23/08/2026, e mudou por conserto, não por
trabalho novo.** A `prancha_personagem` saiu de "não bate" para "não há o que
comparar", porque o prompt contra o qual ela estava sendo comparada não era do
manual. Ver 7.3.

Isso está aqui, e não escondido, porque é exatamente o tipo de coisa que um
cartão bonito faria calado: mostrar um texto e entregar outro.

### 7.3 A receita que a Oficina inventou e carimbou como do manual

**Achado da crítica, rodada 2, e ele estava certo.** A receita
`prancha_personagem` guardava, num campo chamado `prompt_oficial`, o texto:

```
character image, full body, standing, simple background, facing viewer, no text
```

E o `ordem_nota` dizia, com estas palavras: *"O exemplo do manual escreve
standing antes."* Havia, portanto, uma afirmação sobre como o manual escreveu
um exemplo que o manual não tem.

**O que a conferência mostrou.** A grafia `character image` aparece **uma** vez
no `manual-novelai.html`, e é na gaveta §18 "Símbolos com nome próprio (grafias
que viraram tag)", numa lista de tags soltas — nunca dentro de um prompt. As
seções §08 ("Como preparar a imagem de referência") e §19.2 descrevem a
referência ideal **só em prosa**: corpo inteiro, personagem de pé, pose neutra,
fundo simples, ilustração limpa. Nenhuma linha de tags.

**O que mudou, e o que não mudou.** A receita continua na Oficina, com as mesmas
seis tags: ela é boa e resolve o que promete. O que saiu foi o carimbo. Hoje o
registro diz a verdade em cinco lugares — `prompt_oficial` é `null`, o texto
está em `prompt_da_oficina`, `verificado` é `false`, `verificado_nota` traz a
frase pronta, e o `para_que`, que a tela já mostra no cartão hoje, diz que
aquilo é tradução da Oficina.

**A receita irmã está certa, e vale registrar a diferença.** A
`folha_referencia` (`multiple views, turnaround, reference sheet, no text`) não
aparece no manual como uma linha de prompt, mas §19.2 manda usar exatamente
essas quatro tags, com estas palavras: *"use as tags multiple views, turnaround,
reference sheet e no text"*. Ela fica `verificado: true`, com a ressalva escrita
no `verificado_nota`. A `quadro_manga` é o mesmo caso: as quatro caixas de §19.7
são literais, e a Oficina só as junta num prompt só.

**O que sobrou para a tela fazer.** A frase de cima do bloco de receitas —
"Cada receita é um prompt inteiro tirado do manual" — continua sendo escrita
pela interface, e ela é verdadeira para treze e falsa para duas (a
`prancha_personagem` e, desde 27/08/2026, a `cenario_abatedouro_clandestino`
— ver 7.4). O mesmo vale para o recado de "a ordem exata do manual" ao
carregar uma receita. **O dado já traz o campo `verificado` para a tela ler; o
conserto do texto é do Construtor B.**

### 7.4 A receita do abatedouro clandestino — nasce sem manual nenhum (D9, 27/08/2026)

**Diferença desta para a `prancha_personagem`:** a `prancha_personagem`
carimbava como "do manual" um prompt que a Oficina inventou; a
`cenario_abatedouro_clandestino` nunca fingiu vir do manual — ela nasce
`verificado: false` desde o primeiro dia, porque o manual do NovelAI **não
tem** receita de abatedouro, de matadouro, nem de cenário nenhum parecido.
Não há carimbo mentiroso para corrigir aqui; há só honestidade desde o
início.

**Por que ela existe.** O autor pediu (D9) uma receita pronta para o cenário
do Cap. 10 — um abatedouro clandestino que a prosa cita 24 vezes mas nunca
descreve por dentro
(`Imagens\_Biblia_Visual\INVENTARIO_VISUAL_DO_LIVRO.md`, item "abatedouro" e
§12). Por isso ela é declarada, em três lugares do próprio registro
(`para_que`, `aviso`, `verificado_nota`), como **ponto de partida genérico**,
não retrato da cena do livro.

**As 14 tags, todas já existentes no acervo:** `no humans`, `warehouse`,
`abandoned`, `industrial`, `dirty`, `rust`, `hook`, `chain`, `meat`, `blood on
ground`, `veins`, `ceiling light`, `grey theme`, `glowing`. Nenhuma é nova;
todas já tinham `id`, `pt`, `explica` e o resto dos dezesseis campos da seção
5 do `CONTRATO.md`. Todas continuam `verificada: false` — a receita não muda
o carimbo de nenhuma tag, só combina o que já existe.

**A falta de "metal", aceita por decisão do autor.** `metal`, `steel` e
`iron` não existem como tag no NovelAI (zero imagens no Danbooru para as
três — ver a tabela de materiais na seção 5.9 do `CONTRATO.md`). D9 aceitou
essa falta e apontou o caminho: `glowing` (brilho), `veins` (veios — vale
para carcaça pendurada, não só bicho vivo) e `grey theme` (cor). É exatamente
o que a receita usa.

**O `prompt_montado` foi calculado, não escrito de cabeça.** Cada tag entrou
no balde que já tinha no acervo (`veins` = 10; `hook`, `chain`, `meat`,
`blood on ground` = 68; `no humans`, `warehouse`, `abandoned`, `industrial`,
`dirty`, `rust`, `ceiling light` = 80; `grey theme` = 90; `glowing` = 95), e a
ordem final segue a mesma regra estável das outras 14 receitas (empate mantém
a ordem em que a Oficina escreveu). Resultado: `veins, hook, chain, meat,
blood on ground, no humans, warehouse, abandoned, industrial, dirty, rust,
ceiling light, grey theme, glowing`.

---

## 8. Como conferir tudo isto sem confiar em mim

O acervo é gerado por script, e o script valida sozinho antes de gravar. As
checagens que ele roda, e que **falham a construção** se quebrarem:

1. nenhum `id` repetido, e nenhum fora do padrão `a-z0-9_`;
2. nenhum texto de `tag` repetido em dois `id` diferentes;
3. os 17 campos obrigatórios presentes em cada uma das 997 tags;
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

### 8.1 As checagens que entraram na rodada 2

A auditoria desta rodada acrescentou dezoito checagens, e três delas pegaram
coisa de verdade. Todas rodam de uma vez e reprovam o acervo inteiro se
falharem:

**Sobre as tags**

12. **cada tag marcada `verificada: true` é procurada, como palavra inteira,
    dentro do texto do `manual-novelai.html`.** Hoje as 382 são encontradas —
    **zero inventadas em silêncio**;
13. **nenhuma tag tem `ordem: 999`** — aquele balde é do bloco `Text:`, que não
    é tag;
14. **a exclusividade é simétrica**: se A exclui B, B tem de excluir A;
15. **gaveta de eixo único**: toda tag dela exclui todas as irmãs, sem falha;
16. **a ordem da tag é a da gaveta**, salvo gaveta que declare
    `ordem_vem_da_tag` — e, se declarar, é obrigada a trazer a `nota` que
    explica o porquê;
17. **cobertura pelo outro lado**: todas as pastilhas de tag do manual estão no
    acervo. Sobram nove, e nenhuma é tag — quatro são exemplos de peso
    (`-1::hat::`, `-2.5::flat color::`) e cinco são extensões de arquivo do
    boneco 3D (`.glb`, `.gltf`, `.pmd`, `.pmx`, `.vrm`), que moram em
    `regras.canvas`.

**Sobre as receitas**

18. `peso.tipo` só aceita o vocabulário da tela: `nenhum`, `chaves`,
    `colchetes`, `numerico`;
19. receita que usa **peso negativo** é obrigada a declarar `modelo_minimo`
    `v4.5`, porque peso negativo não existe antes disso;
20. **nenhum campo de dado carrega o prefixo `Text:`** — só `exibir_como`;
21. `bloco_texto` e `textos` têm de ser **o mesmo dado**, e cada fala tem de
    caber nos 120 caracteres que o §13 manda;
22. `prompt_montado` é **recalculado do zero** pelo mesmo algoritmo da tela
    (ordenação estável por balde + a montagem de peso do `motor_prompt.js`) e
    comparado com o que está gravado. Ele não pode envelhecer em silêncio;
23. `ordem_bate` é conferido contra o cálculo — **um `true` mentiroso reprova**;
    e quem não bate é obrigado a trazer `ordem_nota`.

**Sobre o acordo com os outros dois construtores**

24. os ids do seletor de plano são exatamente os que `ponte\orcamento.py` lê;
25. os ids dos presets são exatamente os que `ponte\novelai.py` traduz em
    `numero_do_preset`;
26. os nomes de campo `assinatura`, `preset_indesejado` e
    `etiquetas_de_qualidade` batem com os que a ponte espera;
27. todo termo do glossário traz a explicação **entre parênteses** no campo
    `primeira_vez`, que é a regra de linguagem do projeto virada em teste;

**Sobre o português que o autor lê**

28. **nenhum texto de tela escreve sem acento uma palavra que sempre leva
    acento.** A checagem varre os três arquivos com uma lista de 60 palavras
    (`não`, `só`, `você`, `número`, `ninguém`, `vários`, `também`, `página`,
    `próprio`, `possível`…), ignorando os campos que são identificador ou
    prompt em inglês.

    **Ela pegou 11 campos**, todos herdados da correção da contagem de
    personagens: o aviso colado nas dez tags de contagem
    (*"A contagem vai so no prompt base… sem numero"*) e a ficha inteira da tag
    `solo` (*"So um personagem na imagem, ninguem mais"*). Os três textos foram
    reescritos e a checagem ficou, para não voltarem. Não é frescura de
    revisor: a regra do projeto é que **uma frase que precisa ser lida duas
    vezes está errada**, e o autor se declarou totalmente leigo.

**O que essas checagens pegaram, e que já foi corrigido:** o prefixo `Text:`
dobrado, o peso negativo perdido na receita das falas, o `year XXXX` literal, o
`quadro_manga` sem `tags_base`, onze textos de tela escritos sem acento, e
quatro tags cuja ordem divergia da gaveta — esta última não era defeito, e virou
a declaração `ordem_vem_da_tag`.

### 8.1.1 As checagens que mudaram na rodada 3

**Uma regra saiu, e duas mais duras entraram no lugar.** A checagem 12 da rodada
2 terminava assim: *"Tag marcada `verificada: false` é obrigada a trazer
`aviso`"*. Ela foi escrita quando **zero** tags eram não verificadas, ou seja,
nunca rodou de verdade. Com as 102 da rodada 3, ela passou a exigir 94 avisos
genéricos — e a tela **já** põe uma nota amarela própria em toda tag não
verificada, com o texto certo. Cumprir a regra seria escrever a mesma frase duas
vezes na mesma ficha, e nada ensina um leigo a ignorar caixa amarela mais
depressa do que caixa amarela repetida. As duas que entraram:

29. **tag `verificada: false` tem de declarar `origem` começando por "fora do
    manual"** — as 102 declaram;
30. **tag `verificada: false` não pode usar `requer`** — porque a tela escreve
    "O manual diz que X rende mais junto com Y", e o manual não diz nada delas.
    Nenhuma das 102 usa.

**A checagem 2 (nenhum texto de `tag` repetido) pegou coisa de verdade nesta
rodada:** `backlighting` e `lens flare` já existiam em `estilo › efeitos`,
verificadas, e tinham sido escritas de novo em `paisagem › tempo_luz`. As duas
cópias foram retiradas antes de gravar. Sem essa checagem, o autor teria a mesma
palavra duas vezes no mesmo prompt e nada na tela dizendo por quê.

### 8.2 A prova de ponta a ponta

Além das checagens acima, o acervo é montado **pelo motor real do Construtor
B**, fora do navegador: os três arquivos de dados são carregados como
`<script src>` faz, e em seguida `interface\motor_prompt.js` e
`interface\ordenador.js` são carregados **sem alterar uma vírgula**. Então as 14
receitas são montadas, e o resultado é comparado com o `prompt_montado` gravado.

É o teste que fecha o buraco entre A e B: se o motor mudar a forma de escrever
peso, ou se o acervo gravar um `prompt_montado` errado, o teste acusa. Hoje as
14 passam, o balão sai com `-1::speech bubble::` palavra por palavra, e o bloco
de fala sai com um `Text:` só.

### 8.3 Onde ficam os testes, e por que não estão aqui dentro

Os três programas de conferência ficam na pasta de trabalho da sessão
(`…\scratchpad\`), **fora da pasta da ferramenta, de propósito**: a planta dá ao
Construtor A cinco arquivos, e programa de teste não é um deles.

| programa | o que faz |
|---|---|
| `validar_rodada2.py` | as 28 checagens acima, de uma vez |
| `validar.py` (27/08/2026) | as 20 checagens desta rodada, incluindo reciprocidade das brigas novas e "nenhuma tag nova nomeia cor" |
| `medir.py`, `medir2.py`, `medir3.py` (27/08/2026) | medem os 695 candidatos na API do Danbooru e gravam `medicao*.json` |
| `teste_integrado.js` | monta as 14 receitas com o motor real do Construtor B |
| `teste_leitura_c.py` | as quatro linhas do `CONTRATO.md`, rodadas como estão escritas lá |

Quem for auditar o acervo roda os três e não precisa acreditar em nada do que
está escrito aqui.
