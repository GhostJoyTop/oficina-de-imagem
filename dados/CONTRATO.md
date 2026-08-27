# CONTRATO DOS DADOS — Oficina de Imagem

Este é o documento que o **Construtor B** (a tela) e o **Construtor C** (a ponte)
leem **antes de escrever uma linha**. Ele descreve os três arquivos da pasta
`dados\`, campo por campo.

Quem escreve em `dados\` é só o Construtor A. B e C **leem** e nunca gravam aqui.

---

## 1. Os três arquivos

| Arquivo | Variável | O que tem dentro |
|---|---|---|
| `acervo_tags.js` | `window.OFICINA_ACERVO` | 997 tags e 19 categorias |
| `acervo_regras.js` | `window.OFICINA_REGRAS` | as regras do motor NovelAI, como dados |
| `acervo_receitas.js` | `window.OFICINA_RECEITAS` | 15 receitas prontas de prompt |

Hoje os três estão em versões diferentes, e isso é normal:
`acervo_tags.js` em `"1.7.1"`, `acervo_receitas.js` em `"1.3.0"`,
`acervo_regras.js` em `"1.2.1"`.
**Leia sempre o campo do arquivo, nunca presuma que os três batem.**

### ⚠️ O `manual-novelai.html` foi reconstruído, e só PARCIALMENTE (D7, 27/08/2026, rodada 3)

A fonte que este contrato chama de lei — `manual-novelai.html` — **não existe
em lugar nenhum do projeto original**, nem no disco, nem em nenhum commit do
git. O autor decidiu (D7, `REFERENCIAS_COAUTOR_fafa8949.md`, resposta
"p1. a") repor o arquivo por busca em `docs.novelai.net`.

**O arquivo foi reposto, e ele diz isto de si mesmo, na primeira linha: não é
o original.** É uma reconstrução parcial, montada em 27/08/2026 a partir das
páginas ao vivo do site oficial — sem a numeração de seções do original
(§01–§19.8), sem cobrir tudo que o original cobria, e sem copiar parágrafo
nenhum do site (só vocabulário de tag e fato objetivo, por regra de direito
autoral). O que ficou de fora está listado, item por item, no próprio
`manual-novelai.html`, seção "O que ficou de fora desta reconstrução".

**O que isso mudou de fato, medido:** das 382 tags `verificada: true`, 346
bateram com o vocabulário reconstruído (continuam `true`, agora com prova
reproduzível de novo); 36 não bateram — e **isso não as rebaixa**, porque a
reconstrução é parcial e admite isso. Elas continuam `true`, com a lista das
36 registrada em `FONTES.md`, seção 5.11, para quem quiser aprofundar depois.
Das 497 tags novas de 27/08 (rodada 1), **1 bateu e foi promovida**:
`nat_petals` ("petals"), achada no exemplo de introdução do site. As outras
496 continuam `false` — o vocabulário oficial do NovelAI não nomeia bicho,
veículo, arma ou objeto, e isso nunca foi diferente.

Quem quiser aprofundar a reconferência das 36 deve reler
`manual-novelai.html` (ele lista exatamente quais páginas foram mineradas e
quais não) e rodar de novo a checagem 12 do `FONTES.md` contra qualquer parte
nova que for coberta.

### O que mudou em 27/08/2026, rodada 4 — Kouta Hirano na gaveta de mangaká (D11)

Decisão do autor, em `REFERENCIAS_COAUTOR_fafa8949.md`, D11. Palavras
literais dele: *"quero que inclua nos estilos o autor Kouta Hirano de
Hellsing. ao colocar os estilos e nom dos autores coloque um obra famosa
deles."*

A regra que ele pediu — obra famosa entre parênteses no `pt` — **já era o
padrão das 8 tags que existiam** em `estilo › mangaka` (ex.:
`"traço de Akira Toriyama (Dragon Ball)"`). Não foi mudança de política:
foi seguir o que já estava lá.

| mudança | onde | versão | por que |
|---|---|---|---|
| nasce `est_ref_hirano` ("Kouta Hirano art style", `pt`: "traço de Kouta Hirano (Hellsing)") na gaveta `estilo › mangaka`, 9ª tag da gaveta | tags | 1.7.1 | D11: pedido direto do autor. `verificada: false`, com o mesmo `aviso` que as outras 8 já trazem — nome de mangaká raramente existe como tag de artista no Danbooru |

O total do acervo passa de 996 para **997** tags. Nenhuma outra tag, gaveta
ou categoria foi tocada nesta rodada.

### O que mudou em 27/08/2026, rodada 3 — reconferência do manual (D7) e a receita do abatedouro (D9)

Duas decisões do autor, as duas em `REFERENCIAS_COAUTOR_fafa8949.md`.

**D7 — o manual foi reconstruído, e a reconferência está feita.** Ver a
caixa de aviso no topo desta seção 1: o resultado, por número, é 346 das 382
tags antigas reconfirmadas, 36 não reconfirmadas (mas mantidas `true`, por
falta de prova em qualquer direção), e 1 das 497 tags novas promovida
(`nat_petals`).

| mudança | onde | versão | por que |
|---|---|---|---|
| `manual-novelai.html` reposto, como reconstrução parcial e declarada | novo arquivo em `dados\` | — | D7: sem cópia do original em lugar nenhum, a única saída honesta é reconstruir a partir de `docs.novelai.net` e dizer, na cara, o que não foi coberto |
| `nat_petals` (`petals`) passa a `verificada: true` | tags | 1.7.0 | achada no exemplo de introdução do site (docs.novelai.net/en/image/tutorial-imgintro), que reproduz quase palavra por palavra o §02 do manual antigo |

**D9 — nasce a receita do abatedouro clandestino.** O autor pediu (D9,
resposta "p3. b") uma receita pronta para o cenário do Cap. 10, aceitando de
propósito a falta de uma tag de "metal" cru — ela não existe no
Danbooru/NovelAI (ver a tabela de materiais medidos, mais abaixo nesta
seção). A receita `cenario_abatedouro_clandestino` (família nova, `cenario`)
usa 14 tags que já existiam no acervo — nenhuma delas vem do manual, todas
`verificada: false` — e é **um ponto de partida genérico, não o retrato da
cena do livro**: a prosa cita o abatedouro 24 vezes (Cap. 10) mas nunca
descreve o interior dele
(`Imagens\_Biblia_Visual\INVENTARIO_VISUAL_DO_LIVRO.md`, item "abatedouro" e
§12). A falta de "metal" é coberta, como o autor aceitou, por `glowing`
(brilho), `veins` (veios — vale para carcaça pendurada, não só bicho vivo) e
`grey theme` (cor). Detalhe completo na seção 9 e no próprio registro da
receita em `acervo_receitas.js`.

| mudança | onde | versão | por que |
|---|---|---|---|
| nasce a receita `cenario_abatedouro_clandestino`, família nova `cenario` | receitas | 1.3.0 | D9: cenário pedido pelo autor, sem prompt pronto em lugar nenhum do projeto |

### O que mudou em 27/08/2026, rodada 2 — 42 tags de material e de parte do bicho (D5)

Decisão D5 do autor, na mesma data: *"o que vira tag: só a coisa inteira, ou
também material e parte de animal?"* — resposta **B**, os três grupos. O motivo
está medido no `Imagens\_Biblia_Visual\INVENTARIO_VISUAL_DO_LIVRO.md`: das 30
palavras de coisa mais repetidas no livro, 9 são material ou parte do corpo do
cão. "Focinho" tem 151 menções e "concreto" 120.

| mudança | onde | versão | por que |
|---|---|---|---|
| nasce **`assunto › parte_animal`** (14 tags: focinho, bigodes, rabo, orelhas, patas, felpudo) | tags | 1.6.0 | o livro tem um animal só, e ele é protagonista. `dog` sozinho desperdiça o Ghost — as partes é que dão expressão a ele |
| nasce **`paisagem › material`** (26 tags: azulejo, tijolo, cascalho, concreto, poeira, ferrugem, rachadura, pichação, buraco de bala, mofo, fuligem) | tags | 1.6.0 e 1.6.1 | o peso do mundo do livro está no material, não no móvel. Sem material, o prompt acerta o objeto e erra a cena |
| entram 6 tags em gavetas que já existiam: `roupa › tronco` (roupa rasgada, roupa suja), `estilo › efeitos` (brilhando), `paisagem › construcao` (barraco), `assunto › criatura` (antropomorfo, moça com traço de cachorro) | tags | 1.6.0 | cada uma já tinha casa certa. Abrir gaveta nova para duas tags de roupa seria pior que pô-las onde roupa mora |

#### Um conserto do mesmo dia (1.6.1) — quatro materiais fora da gaveta

`dust`, `rust` e `broken glass` nasceram na rodada 1 dentro de
`objeto › objeto_cena`, **balde 68**, porque a gaveta de material ainda não
existia. `concrete` ficou em `construcao`. As quatro são material, e o resto do
material está no **balde 80** — então `gravel` e `dust`, no mesmo prompt,
saíam em posições diferentes sem motivo.

As quatro passaram para `paisagem › material`. **Nenhum `id` mudou**, então o
trabalho já salvo do autor continua apontando para o lugar certo; mudaram a
gaveta e o balde. O defeito era meu, da rodada 1, e foi achado montando uma
cena de teste do Cap. 15 — não por revisão de terceiro.

#### ⚠️ A armadilha das orelhas — o achado mais útil desta rodada

No Danbooru, `dog ears`, `animal ears`, `pointy ears`, `animal hands` e
`animal feet` **quase nunca marcam um bicho**. Elas marcam uma **pessoa com
traço de bicho** — o gênero que o site chama de `dog girl`, que sozinho tem
50.407 imagens. Quem pedir `dog ears` pensando no Ghost recebe uma moça de
orelha de cachorro, e paga por ela.

As cinco tags entraram, porque o autor pode querer exatamente isso, mas **cada
uma leva um `aviso` que começa com ⚠️** e manda usar `dog` mais `animal focus`
para desenhar o cão. Entraram junto, de propósito, `furry` e `dog girl`: são a
armadilha com nome, e é mais fácil evitar o que tem nome.

`snout` (focinho), `whiskers` (bigodes), `floppy ears` (orelhas caídas),
`fluffy tail` e `tail wagging` **não** têm esse problema e são o caminho bom
para o Ghost.

#### D6 — o que só existe na Bíblia: coberto por vocabulário, NÃO por marca nova

Decisão D6 do autor: entra também o que só existe na Bíblia e nunca foi escrito
em prosa, **com a marca `[AINDA NÃO ESCRITO]`**.

**A marca está feita, e não é aqui.** Ela vive no
`INVENTARIO_VISUAL_DO_LIVRO.md`, item por item, que é o documento que o
pipeline de imagem lê. **No `acervo_tags.js` ela não cabe, e a razão é de
formato:** uma tag é uma palavra que o NovelAI conhece; "já foi escrito em
prosa" é um fato sobre o **livro**, não sobre a palavra. `whip` é a mesma tag
quer o chicote Cérbero-1 tenha aparecido em cena ou não.

Gravar a marca aqui exigiria um **18º campo obrigatório** em todas as 997 tags,
e a seção 5 promete dezesseis a quem lê. Isso quebraria o Construtor B e o C.
A seção 11 deste contrato manda **obedecer e avisar** em vez de mudar o formato
por conta própria — é o que está sendo feito. Se o autor quiser a marca dentro
do acervo, o caminho honesto é uma versão maior (2.0.0) combinada com B e C, e
isso é decisão dele, não minha.

**O que foi feito, então:** conferi um por um se os itens só-da-Bíblia têm
vocabulário para serem desenhados. Têm, menos dois:

| item só da Bíblia | com que tags se desenha hoje |
|---|---|
| espada cinética | `sword` + `energy sword` + `glowing` |
| chicote Cérbero-1 | `whip` + `glowing` |
| Quimeras, Ecos | `monsterification` + `extra arms` + `veins` |
| as 5 armas do Bando do Anzol sem descrição | `staff`, `gauntlets`, `handgun`, `dagger`, `knife`, `net` — todas existem |
| favela | `shack` + `abandoned` + `ruins` + `destruction` |
| Tecno-Hylé limpo (maquinário de elite) | `machine` + `industrial` + `glowing` |
| **abatedouro clandestino** | ❌ **nenhuma.** `slaughterhouse` dá 0 imagens e `meat hook` só 53 |
| **o trem do Cap. 14 por fora** | ❌ nada a fazer no acervo: `train` existe, mas a **prosa** nunca o descreveu |

Os dois com ❌ continuam sendo lacuna, e é assim que devem aparecer: o
inventário já os lista no § 12 dele, e quem for gerar imagem tem de parar e
perguntar ao autor, em vez de deduzir.

#### O que a medição desmentiu no inventário

O inventário estimava cerca de 220 tags para D5. Entraram 42, e o motivo não é
corte: **é que a maior parte dos materiais do livro não existe como tag no
NovelAI.** Medido um por um:

| palavra do livro | menções no livro | imagens no Danbooru |
|---|---|---|
| metal | **374** (o material nº 1 do livro) | **0** |
| aço, ferro, chumbo, zinco | 28 / 30 / 25 / 16 | **0** cada |
| asfalto | 33 | **0** |
| madeira, plástico | 4 / 5 | **0** cada |
| cimento | 71 | **4** |
| azulejo | 37 | `tile` **0**, mas `tiles` 36.781 e `tile floor` 23.781 |
| concreto | 120 | 1.077 |

Ou seja: o vocabulário do Danbooru quase não nomeia material cru — ele nomeia
**superfície** (`tile floor`, `wooden floor`, `brick wall`). Onde havia
superfície equivalente, ela entrou. Onde não havia, **nada foi inventado**, e a
falta está declarada aqui.

### O que mudou em 27/08/2026, rodada 1 — 455 tags de coisa que não é gente

O autor pediu, com estas palavras: *"senti falta de 'personagens' objetos, como
carros, robos, e coisas. as vezes a cena não é só de pessoas. quero animais
também."* E, na rodada seguinte: *"faça uma varredura total na novel AI e pegue
todas as tag, varra pela internet e busque tags importantes para as historia
que estou escrevendo"*.

O buraco era real e estava medido: 499 tags, e **nenhuma** de assunto que não
fosse gente. A gaveta `foco › objeto` dizia para onde a câmera olha
(`animal focus`, `vehicle focus`) e nenhuma tag dizia **qual** animal ou
**qual** veículo. Não existia gato, cavalo, robô, carro, espada, comida nem
prédio.

| mudança | onde | versão | por que |
|---|---|---|---|
| nasce a categoria **`assunto`** (`ordem_base` 10), com 4 gavetas e 177 tags: `animal` (68), `criatura` (46), `veiculo` (31), `maquina` (32) | tags | 1.5.0 | a categoria `quem` só conta gente (`1girl`, `2boys`). Não havia como dizer que na imagem há um cachorro, um carro ou um monstro. O balde 10 é o mesmo de `quem`, porque assunto é assunto |
| nasce a categoria **`objeto`** (`ordem_base` 68), com 5 gavetas e 206 tags: `arma_branca` (39), `arma_fogo` (29), `protecao` (33), `objeto_cena` (79), `comida` (26) | tags | 1.5.0 | `holding sword` existia em `pose › acao`, mas a espada em si não existia. O balde 68 é o de acessório: primeiro a pessoa, depois o que ela carrega |
| `paisagem` ganha **`construcao`** (45) e **`natureza`** (25), e mais 2 tags de luz em `tempo_luz` | tags | 1.5.0 | `paisagem › lugar` já tinha `ruins` e `warehouse`, mas nada de prédio, muro, portão, árvore ou pedra. Ficam no balde 80, que é o da cena — construção é cenário, não assunto |
| `simple background` passa a brigar com as **45 tags de construção** e com as **19 de natureza que são ambiente**, e ganha o recíproco | tags | 1.5.0 | ela já brigava com os 31 lugares. Um prédio ou um descampado contradiz fundo liso do mesmo jeito. Flor, pétala, folha, galho e espinho **não** entram: cabem num fundo liso sem contradição |
| `no humans` passa a brigar com as **22 tags novas que nomeiam ser em forma de gente**, e ganha o recíproco | tags | 1.5.0 | mesmo defeito que a rodada de 23/08 corrigiu na contagem: `no humans` com `monster girl` ou `android` passava calado |
| o `explica` de `no humans` passa a mandar escolher **o que aparece no lugar da gente** | tags | 1.5.0 | até hoje ele só dizia o que **não** está na imagem. Com as gavetas novas, `no humans` finalmente tem com o que andar junto — e sozinho ele produz imagem vazia |

**As 455 são `verificada: false`, e o motivo mudou de natureza.** Nas rodadas
anteriores a razão era "o manual não tem essa gaveta". Agora é mais grave: **o
`manual-novelai.html` não está no disco** (ver o aviso na abertura desta
seção), então não há onde procurar. Nenhuma tag desta rodada podia ser
verificada, nem as óbvias.

**O que entrou no lugar da conferência no manual, e é mais forte do que era.**
Cada uma das 455 foi **medida na API do próprio Danbooru** em 27/08/2026 — o
vocabulário com que o NovelAI foi treinado. O campo `origem` de cada tag traz
o número de imagens marcadas com aquela grafia exata. Isso é reproduzível: quem
duvidar repete a consulta.

**A medição derrubou 66 grafias que pareciam certas**, e este é o ganho real da
rodada. Todas estas dão **zero** imagens no Danbooru e teriam ido para o prompt
do autor sem fazer nada: `insect` (o certo é `bug`), `pistol` (é `handgun`),
`vehicle` (é `motor vehicle`), `photo` (é `photo (object)`), `bandage` (é
`bandages`), `chains` (é `chain`), `mouse` e `rat` (é `mouse (animal)`), `bat`
(é `bat (animal)`), `wall`, `blade`, `machinery`, `mechanical arm` (é
`mechanical arms`), `streetlight` (é `lamppost`), `jet` (é `fighter jet`),
`spirit`, `beast`, `mutant`, `slum`, `curtain`, `tied up`, `medkit`.

**Duas armadilhas de significado, evitadas e declaradas.** `mole` tem 397.672
imagens no Danbooru e **não é a toupeira**: é a pinta do rosto — a Oficina já
tem `mole under eye`. Ficou de fora. E `magazine (weapon)` precisa do
`(weapon)`: sem ele, o site entende revista de banca. As tags que dependem
desse sufixo trazem o `aviso` explicando, uma por uma.

**Nenhuma tag nova nomeia cor, e isso foi escolha.** `black cat` e
`white horse` existem no Danbooru e ficaram fora de propósito: toda tag de cor
precisa entrar na teia de 78 brigas do `monochrome`, e a cor do bicho pertence
ao `explica`, não ao nome da tag. `monochrome` e `greyscale` continuam com
exatamente 78 brigas, sem uma a mais.

### O que mudou em 24/08/2026 — 15 tags de gênero, formato e traço de mangaká

O autor sentiu falta, no Armazém: das categorias de mangá/anime por público
(shonen, shojo, seinen, josei), do formato de quadrinho coreano e chinês
(manhwa, manhua, webtoon), e de tags que imitam o traço de um mangaká ou
estúdio conhecido (Toriyama, Oda, Takeuchi, CLAMP, Otomo, Miura, Ghibli,
Takahashi). Nenhuma delas está no manual do NovelAI — o manual não tem gaveta
de gênero de mangá nem de referência de artista — então as 15 entraram com
`verificada: false`, como as 102 da rodada 3.

| mudança | onde | versão | por que |
|---|---|---|---|
| nasce a gaveta `estilo › genero_formato` (7 tags: shounen, shoujo, seinen, josei, manhwa, manhua, webtoon) | tags | 1.4.0 | as categorias de público do mangá não têm gaveta própria hoje; a tela só tinha `anime screencap` e `anime coloring`, que descrevem acabamento, não gênero |
| nasce a gaveta `estilo › mangaka` (8 tags: referência de traço de mangaká/estúdio) | tags | 1.4.0 | o autor quer imitar o traço de um mangaká específico, e isso não existia — só havia `retro artstyle` (traço genérico de época) |

**Uma ressalva que a tela precisa repetir, não só o dado.** As 8 tags de
`mangaka` usam nome de pessoa ou estúdio real, e o `aviso` de cada uma diz a
verdade: o NovelAI foi treinado com imagens marcadas no Danbooru, e nome de
mangaká profissional quase nunca existe lá como tag de artista — a tag pode
simplesmente não mudar nada na imagem. Isto não é um "talvez funcione" comum:
é a mesma incerteza que já existe, por exemplo, em `retro artstyle`, só que
mais forte porque o alvo é um nome próprio, não um efeito genérico. **A tela
não pode prometer o traço de ninguém** — só oferecer a tentativa, com o aviso
visível.

As 7 tags de `genero_formato` (shounen/shoujo/seinen/josei) trazem o mesmo
tipo de ressalva por outro motivo: são categoria de público-alvo, não traço
visual — um shonen pode ter traço redondo (Dragon Ball) ou traço realista
(Attack on Titan). Sozinhas, podem mudar pouco a imagem.

### O que mudou em 23/08/2026 (rodada 2 da crítica)

Quatro mudanças, todas nascidas de achado da crítica. **Nenhuma apaga campo
antigo** — a versão anterior continua sendo lida sem erro.

| mudança | onde | versão | por que |
|---|---|---|---|
| `pai_no_humans` passa a brigar com as **12** tags de contagem, e não com 4 | tags | 1.3.0 | escolher `3girls` junto com `no humans` passava calado. Ficaram de fora `3girls`, `2boys`, `1other`, `2others`, `multiple girls`, `6+girls`, `girl` e `boy`. A tag `monochrome` está ligada às 78 tags de cor sem deixar nenhuma de fora — o padrão de rigor existia e aqui não tinha sido seguido |
| as gavetas `pose › dupla` e `quem › caixa_personagem` ganham **`so_na_caixa_de_personagem`** | tags | 1.3.0 | os prefixos de ação (`source#`, `target#`, `mutual#`) eram clicáveis e caíam no prompt base, onde não fazem nada. O autor copiava e pagava por texto morto |
| toda receita ganha **`verificado`**, **`verificado_nota`** e **`prompt_da_oficina`** | receitas | 1.2.0 | a receita `prancha_personagem` guardava um prompt montado pela Oficina num campo chamado `prompt_oficial`. `character image` aparece **uma** vez no manual, numa lista de tags — nunca dentro de um prompt |
| `duas_char_ref_misturam` ganha **`frase_para_tela`** e **`nao_diga`** | regras | 1.2.1 | o dado já dizia `verificado: false` desde a rodada 3, mas a tela continuava escrevendo "limite oficial do NovelAI". A correção tinha parado na camada de dados e nunca chegado ao que o autor lê |

**Além dessas, três correções de texto que não mudam formato:** o `explica` de
`duas_char_ref_misturam` passou a carregar a ressalva dentro dele; os seis
prefixos de ação passaram a dizer **onde** funcionam, não só o que marcam; e o
`para_que` da `prancha_personagem` — que a tela já mostra hoje, no cartão —
passou a dizer que aquelas tags são tradução da Oficina, não prompt do manual.

### O que mudou na versão 1.2.0 (21/08/2026, rodada 3)

Cinco mudanças, todas nascidas de achado da crítica. **Nenhuma apaga campo
antigo** — a 1.1.0 continua sendo lida sem erro.

| mudança | onde | por que |
|---|---|---|
| entram **102 tags de cenário, ação e expressão**, todas com `verificada: false` | tags | a gaveta `paisagem`, que o autor pediu pelo nome, tinha 4 lugares; a de ação tinha 3 poses. O manual não traz gaveta de cenário, e o escape do contrato (`verificada: false`) nunca tinha sido usado |
| nasce a gaveta `paisagem › dentro_fora`, de escolha única | tags | `indoors` e `outdoors` são um ou outro, e a tela precisa mostrar isso como escolha, não como duas bolinhas soltas |
| cada modelo ganha `suporta_verificado` e `vibe_transfer_verificado` | regras | a tabela afirmava sim/não para Vibe Transfer nos seis modelos, e creditava ao §16, que não fala de Vibe Transfer |
| `duas_char_ref_misturam` passa a `verificado: false` | regras | o carimbo dizia que a regra tinha sido conferida no manual. A palavra "misturar" não existe no manual — a regra veio do briefing, e agora diz isso |
| cada balde ganha `porque_sobe` e `porque_desce` | regras | a Régua de Ordem explicava ao contrário: dizia que a tag desceu para o fim **porque pesa mais no começo**. Um motivo só não serve para as duas direções |

**Além dessas, duas correções de texto:** o preset "Variações por foco" virou
`Foco humano (estimativa)`, com o aviso de que os números dos presets não são
publicados; e a frase da estabilidade de ordem parou de falar do autor em
terceira pessoa ("o autor escolheu" → "você escolheu").

### O que mudou na versão 1.1.0 (21/08/2026, rodada 2)

Cinco mudanças, todas nascidas de defeito medido na tela aberta. **Nenhuma
apaga campo antigo** — a 1.0.0 continua sendo lida sem erro.

| mudança | onde | por que |
|---|---|---|
| `tags_base` passa a aceitar **peso e valor por item** | receitas | a receita das falas perdia o `-1::speech bubble::` e passava a **pedir** o balão em vez de evitá-lo |
| o prefixo `Text: ` **sai dos dados** | receitas | o motor prefixava de novo, e saía `Text: Text: …` — a palavra acabava desenhada dentro da imagem |
| cada receita declara o **modo de ordem** que pressupõe | receitas | dez das onze mostravam um prompt no cartão e entregavam outro |
| `quadro_manga` ganha `tags_base` consolidado | receitas | ela só tinha `blocos`, e usar a receita **zerava o prompt** sem pôr nada |
| entram `glossario`, `etiquetas_qualidade` e as notas de custo | regras | "Anlas" aparecia 15 vezes na tela sem nunca ser explicado, e o Opus parecia gratuito também nas referências |

---

## 2. O formato do arquivo (rígido — não desvie)

Cada arquivo tem exatamente esta forma:

```
window.OFICINA_ACERVO =
{ ...JSON estrito... }
;
```

Três regras duras:

1. A **primeira linha** é exatamente `window.OFICINA_ACERVO =` (ou
   `window.OFICINA_REGRAS =`, ou `window.OFICINA_RECEITAS =`). Nada mais.
2. A **última linha** é exatamente `;` (ponto e vírgula sozinho).
3. Tudo no meio é **JSON estrito** (formato de texto que programa lê),
   codificado em **UTF-8** (a codificação que aceita acento).

**Por que assim, e não um `.json` puro.** O navegador carrega este arquivo com
`<script src="dados/acervo_tags.js">`, e isso funciona mesmo com a página aberta
direto do disco. Um `.json` puro exigiria `fetch` (o comando que busca um
arquivo), que o Chrome bloqueia em página aberta do disco. Um arquivo só, uma
verdade só, os dois lados leem.

### Como o Construtor B lê (navegador)

```html
<script src="dados/acervo_tags.js"></script>
<script src="dados/acervo_regras.js"></script>
<script src="dados/acervo_receitas.js"></script>
<script>
  const acervo = window.OFICINA_ACERVO;   // já é objeto, sem parse
</script>
```

### Como o Construtor C lê (Python)

```python
import json
with open(caminho, encoding="utf-8") as f:      # encoding sempre na mão
    linhas = f.read().splitlines()
acervo = json.loads("\n".join(linhas[1:-1]))    # descarta 1ª e última linha
```

Estas quatro linhas estão testadas contra os três arquivos.

---

## 3. A estrutura de cima (`acervo_tags.js`)

```json
{
  "versao_formato": "1.7.1",
  "fonte": "manual-novelai.html (docs.novelai.net)",
  "gerado_em": "2026-08-21",
  "mudou_em": "2026-08-27, rodada 4 (D11): entra est_ref_hirano…",
  "categorias": [ ... 19 ... ],
  "tags": [ ... 997 ... ]
}
```

⚠️ O campo `fonte` nomeia o `manual-novelai.html`. Desde 27/08/2026, rodada 3,
o arquivo **existe de novo em `dados\manual-novelai.html`**, mas é uma
**reconstrução parcial**, não o original — ver o aviso no topo da seção 1. O
campo diz de onde veio a parte antiga do acervo; para saber o que hoje pode
ser reconferido de fato, leia o próprio `manual-novelai.html`.

Os outros dois arquivos têm a mesma cabeça, trocando `categorias`/`tags` pelas
chaves próprias deles.

---

## 4. Os campos de uma CATEGORIA

| campo | tipo | o que é |
|---|---|---|
| `id` | texto, só `a-z0-9_` | identificador estável |
| `nome` | texto em português | o que aparece na tela |
| `ordem_base` | número inteiro | o balde de prioridade da categoria |
| `subcategorias` | lista | as gavetas de dentro |

Cada **subcategoria**:

| campo | tipo | o que é |
|---|---|---|
| `id` | texto, só `a-z0-9_` | identificador, único dentro da categoria |
| `nome` | texto em português | o nome da gaveta na tela |
| `eixo_unico` | verdadeiro/falso | verdadeiro = só uma tag daquela gaveta pode estar escolhida por vez |
| `ordem` | número inteiro | o balde de prioridade daquela gaveta |
| `ordem_vem_da_tag` | verdadeiro/falso | verdadeiro = **ignore o `ordem` desta gaveta**: cada tag dela traz o próprio balde |
| `nota` | texto ou ausente | só existe quando `ordem_vem_da_tag` é verdadeiro. Explica a bagunça para quem lê |
| `so_na_caixa_de_personagem` | verdadeiro **ou ausente** | verdadeiro = toda tag desta gaveta vai **dentro de uma caixa de personagem**. Ausente vale como falso |
| `nota_do_lugar` | texto ou ausente | só existe junto do campo acima. A frase pronta, para a tela colar |

**Sobre `so_na_caixa_de_personagem` (novo em 1.3.0).** Duas gavetas o têm, e só
elas: `pose › dupla` (os prefixos `source#`, `target#`, `mutual#`) e
`quem › caixa_personagem` (as tags `girl` e `boy`, sem número).

O campo nasceu de um defeito medido. As seis tags de prefixo de ação têm
`ordem: 70`, que é o balde de pose do **prompt base**. Clicar nelas no Armazém
punha `source#hug` no prompt base, onde o prefixo não se liga a ninguém: ele
vira texto morto que o autor copia e paga. O aviso de cada uma das seis já diz
isso hoje, com todas as letras. **O campo existe para a tela poder fazer melhor
que avisar: mandar o clique direto para a caixa de personagem.**

O `ordem: 70` continua certo e não deve ser mexido. Dentro da caixa, as tags
são ordenadas pelos mesmos baldes — uma tag de pose ordena como pose ali também.
A gaveta diz **onde** a tag vai; o balde diz **em que posição**, dentro do lugar
onde ela está. São duas perguntas diferentes.

**A cobrança vale nos dois sentidos.** Contagem (`1girl`, `2girls`) dentro da
caixa é erro, e `girl` ou `boy` no prompt base também é erro. A regra está em
`regras.multi_personagem.regra_contagem_espelho`. Aviso que dispara no acerto
ensina o autor a ignorar aviso.

**Sobre `ordem_vem_da_tag` — hoje só uma gaveta tem, e é declarada.** A gaveta
`especiais / simbolos` ("Símbolos com nome próprio") é herdada do manual, que
juntou ali oito grafias curiosas sem nada em comum: um gesto de mão, um tipo de
olho, uma peça de roupa, um tipo de imagem. Cada tag dela entra no prompt no
lugar do **próprio assunto** — `square bikini` ordena com a roupa do tronco
(62), `bar eyes` com os olhos (45), `character image` com o enquadramento (20).

Isso nunca foi um problema para a tela, porque **B sempre ordena pelo campo
`ordem` da TAG, nunca pelo da gaveta**. A regra está escrita aqui para que um
validador honesto não acuse a divergência como defeito, e para que ninguém
"conserte" isso um dia empurrando as quatro tags para o balde 70.

**Atenção ao `ordem` da subcategoria.** Ele pode ser diferente do `ordem_base`
da categoria. Exemplo real: a categoria `roupa` tem `ordem_base` 60, mas a
gaveta `pernas` tem `ordem` 64 e a gaveta `acessorio` tem `ordem` 68. É de
propósito: é o conselho do manual ("descreva cabeça, tronco e pernas
separadamente") virado em mecânica.

**Sobre `eixo_unico`.** Quando é verdadeiro, todas as tags daquela gaveta já vêm
com o campo `exclusivo_com` preenchido com as irmãs. B não precisa calcular
nada: basta obedecer o `exclusivo_com` de cada tag.

**A contagem de personagens são TRÊS eixos, não um (corrigido em 21/08/2026).**
A gaveta única `contagem` foi partida em `contagem_garotas`,
`contagem_garotos` e `contagem_outros`, mais a gaveta `sozinho` só para a tag
`solo`. O motivo é um defeito real: com uma gaveta só, todas as dez tags de
contagem eram mutuamente exclusivas, e o motor de prompt marcava **erro
vermelho** em duas coisas legítimas —

- `1boy, solo`, que é o exemplo oficial do próprio manual (§19.3 e §19.4);
- `1girl, 1boy`, que é o prompt base de um quadro com dois personagens, ou
  seja, o caso de mangá que o autor quer.

Hoje cada eixo é de escolha única por dentro (não dá para pedir `1girl` e
`2girls` juntas), os eixos não brigam entre si (`1girl, 1boy` passa), e `solo`
combina com as contagens de um personagem e briga só com as de vários.

### As 19 categorias e suas 70 gavetas

| categoria | `ordem_base` | gavetas |
|---|---|---|
| `quem` | 10 | contagem_garotas, contagem_garotos, contagem_outros, sozinho, caixa_personagem |
| **`assunto`** | **10** | **animal, criatura, veiculo, maquina, parte_animal** |
| `enquadramento` | 20 | distancia |
| `multiplas_vistas` | 20 | folha |
| `foco` | 25 | objeto |
| `angulo` | 30 | posicao |
| `cabelo` | 40 | comprimento, penteado, rabo, franja, topo, textura, cor, cor_combinada, pelo_facial |
| `olhos` | 45 | cor, pupila |
| `pele` | 50 | tom, fantastica, detalhes |
| `corpo` | 55 | altura, magro, robusto, atletico, peito |
| `roupa` | 60 | cabeca (60), tronco (62), pernas (64), calcado (66), acessorio (68) |
| **`objeto`** | **68** | **arma_branca, arma_fogo, protecao, objeto_cena, comida** |
| `pose` | 70 | acao, olhar, expressao, dupla |
| `paisagem` | 80 | **dentro_fora** (escolha única), lugar, tempo_luz, fundo, **construcao**, **natureza**, **material** |
| `epoca` | 85 | era |
| `estilo` | 90 | meio_categoria, meio_tradicional, meio_digital, movimento, traco, coloracao, cor_dominante, efeitos (95), genero_formato, mangaka |
| `qualidade` | 98 | nivel |
| `estetica` | 98 | nivel |
| `especiais` | 98 | dataset, simbolos (70), manga (95) |

**As duas categorias novas ocupam balde que já existia**, de propósito: nenhum
balde foi criado nesta rodada. `assunto` usa o 10, o mesmo de `quem`, porque um
cachorro é assunto tanto quanto uma pessoa. `objeto` usa o 68, o de acessório,
porque a lógica do manual é descrever a pessoa e depois o que ela carrega.
`construcao` e `natureza` usam o 80, o da cena, porque construção é cenário.

**A ordem da tabela acima é a dos baldes, não a do arquivo.** No
`acervo_tags.js` as duas categorias novas estão no fim da lista `categorias`;
quem monta a tela ordena pelo `ordem_base`, nunca pela posição no arquivo.

---

## 5. Os campos de uma TAG

**Todos são obrigatórios. Nenhum falta em nenhuma das 997 tags.** B pode ler
qualquer campo sem checar se existe.

| campo | tipo | o que é |
|---|---|---|
| `id` | texto, só `a-z0-9_` | identificador único e estável. **Nunca muda depois de publicado**, porque o trabalho salvo do autor aponta para ele |
| `tag` | texto | a palavra **exatamente** como vai no prompt, em inglês. Nunca traduzida, nunca corrigida, nunca com espaço a mais |
| `pt` | texto curto | a tradução, para o autor achar a tag |
| `explica` | 1 a 2 frases | o que a tag faz, em português simples |
| `categoria` | texto | o `id` de uma categoria que existe |
| `subcategoria` | texto | o `id` de uma subcategoria que existe dentro daquela categoria |
| `ordem` | número inteiro | o peso de ordenação. Ver a tabela de baldes na seção 7 |
| `exclusivo_com` | lista de `id` | tags que **não podem** estar junto com esta. Bloqueio, não aviso. Lista vazia quando não há |
| `conflita_com` | lista de `id` | tags que brigam mas não se impedem — geram **aviso**, não bloqueio |
| `requer` | lista de `id` | tags que precisam vir junto (`blue skin` exige `colored skin`) |
| `modelo_minimo` | texto | `"qualquer"`, `"v3"`, `"v4"` ou `"v4.5"` |
| `so_em` | lista de texto | modelos onde a tag só existe. Lista vazia quando vale em todos |
| `verificada` | verdadeiro/falso | apareceu no manual? **Falso obriga a mostrar aviso na tela.** Hoje **383** são `true` e **614** são `false` — 102 de cenário, ação e expressão (seção 10), 15 de gênero, formato e traço de mangaká (24/08/2026), **496 de 27/08/2026** (das 497 originais, 1 — `nat_petals` — foi promovida a `true` na rodada 3, D7), e `est_ref_hirano` (27/08/2026, rodada 4, D11) |
| `origem` | texto | onde no manual. Ex.: `"§18 Armazém de tags › Cabelo › Cor"`. Nas 455 de 27/08/2026 traz, em vez disso, **o número de imagens medido na API do Danbooru** |
| `exemplo` | objeto | `{"tipo": ..., "ref": ...}` — ver a seção 6 |
| `aviso` | texto ou `null` | alerta curto que aparece junto da tag. **175** tags têm |
| `genero` | `"f"`, `"m"` ou `null` | tags que só valem para um. `flat chest` é `"f"`; `pectorals` é `"m"` |

### Exemplo de duas tags reais, tiradas do arquivo

```json
{
  "id": "enq_close_up",
  "tag": "close-up",
  "pt": "primeiríssimo plano",
  "explica": "O rosto ocupa quase todo o quadro. É o enquadramento da reação e da emoção.",
  "categoria": "enquadramento",
  "subcategoria": "distancia",
  "ordem": 20,
  "exclusivo_com": ["enq_portrait", "enq_upper_body", "enq_lower_body", "enq_cowboy_shot",
                    "enq_feet_out_of_frame", "enq_foot_out_of_frame", "enq_full_body",
                    "enq_wide_shot", "enq_very_wide_shot"],
  "conflita_com": ["enq_wide_shot", "enq_very_wide_shot", "enq_full_body"],
  "requer": [],
  "modelo_minimo": "qualquer",
  "so_em": [],
  "verificada": true,
  "origem": "§03 item 5 e §18 Enquadramento (perto → longe)",
  "exemplo": { "tipo": "esquema", "ref": "enquadramento_escada" },
  "aviso": null,
  "genero": null
}
```

```json
{
  "id": "est_watercolor_medium",
  "tag": "watercolor (medium)",
  "pt": "aquarela",
  "explica": "Pintado com aquarela. O manual recomenda usar junto com traditional media.",
  "categoria": "estilo",
  "subcategoria": "meio_tradicional",
  "ordem": 90,
  "exclusivo_com": [],
  "conflita_com": ["est_pixel_art", "est_3d", "est_photorealistic", "est_realistic",
                   "est_anime_screencap"],
  "requer": ["est_traditional_media"],
  "modelo_minimo": "qualquer",
  "so_em": [],
  "verificada": true,
  "origem": "§04 Ferramenta tradicional (medium) e §18 Meio tradicional",
  "exemplo": { "tipo": "vazio", "ref": "est_watercolor_medium.png" },
  "aviso": "As etiquetas de qualidade empurram para o anime bonitinho padrão. Ao perseguir um estilo, desligue-as ou enfraqueça com colchetes.",
  "genero": null
}
```

Repare no `requer` da segunda: é o manual dizendo que
`traditional media, watercolor (medium)` funciona melhor que qualquer uma das
duas sozinha, virado em dado. A Oficina não escreve isso num texto de ajuda que
ninguém lê — ela **oferece as duas juntas** quando o autor clica numa.

### O que B tem de fazer com cada campo de relação

| campo | o que a tela faz |
|---|---|
| `exclusivo_com` | ao escolher esta, **desmarca** as outras automaticamente |
| `conflita_com` | mostra **aviso amarelo**, e deixa o autor decidir |
| `requer` | **oferece** a outra tag junto, com o motivo |

---

## 6. O campo `exemplo`

`{"tipo": "esquema" | "vazio" | "nenhum", "ref": texto ou null}`

| `tipo` | quantas | o que a tela mostra | o que é `ref` |
|---|---|---|---|
| `"esquema"` | 45 | 📐 um desenho geométrico feito por nós | o nome do SVG que B desenha em `interface\esquemas.js` |
| `"vazio"` | 908 | 🖼️ um quadrado com "solte aqui uma imagem sua com esta tag" | o nome do arquivo dentro de `meu_trabalho\exemplos\` |
| `"nenhum"` | 44 | nada — sem marca, sem quadrado | sempre `null` |

**As 497 tags de 27/08/2026 são todas `"vazio"`**, como as 411 que já eram. Elas
não ganharam desenho esquemático: os 45 esquemas continuam sendo só de
enquadramento, ângulo, cabelo, folha de referência e caixas de personagem.

⚠️ **Duas destas contagens estavam erradas antes desta rodada, e a soma
denunciava.** A tabela dizia 45 + 409 + 28 = **482**, com 499 tags no arquivo —
17 tags a menos do que existiam. Medido no arquivo de 24/08, o certo era 45 +
411 + 43 = 499. Ninguém mexeu nas tags: mexeu-se no número escrito aqui. Quem
auditar deve conseguir somar a tabela e chegar ao total de tags, e agora
consegue: 45 + 908 + 44 = 997 (o 44º "nenhum" é `est_ref_hirano`, entrada de
27/08/2026 rodada 4, D11).

**Os nomes de esquema usados (conferidos contra o registro do Construtor B em
21/08/2026):**

| `ref` | quantas tags | o que o desenho mostra |
|---|---|---|
| o próprio `id` da tag | 14 | o recorte **daquele** enquadramento (8 tags) ou **aquela** posição de câmera (6 tags), um por um |
| `enquadramento_escada` | 2 | a escada inteira, do close-up ao very wide shot |
| `angulo_camera` | 9 | a bússola com as posições da câmera ao redor de uma figura |
| `cabelo_comprimento` | 9 | silhuetas de comprimento de cabelo |
| `multiplas_vistas` | 3 | a folha de referência com várias vistas |
| `caixas_do_prompt` | 8 | as caixas do modo de vários personagens |

**Por que 14 tags apontam para o próprio `id`.** O Construtor B desenha o
recorte de cada enquadramento e cada ângulo separadamente, não só a escada
geral. Antes, todas apontavam para `enquadramento_escada`, e o resolvedor dele
parava ali: quem clicava em `close-up` via a escada inteira em vez do recorte
do close-up. Apontando para o próprio `id`, o resolvedor entrega o desenho
individual. As duas tags que ficaram na escada (`feet out of frame` e
`foot out of frame`) ficaram porque B não tem recorte próprio delas.

Se um `ref` não casar com nada, B devolve o cartão honesto de "sem desenho" —
o resolvedor dele nunca inventa um desenho no lugar.

**A proibição, e ela é dura.** Nenhum esquema desenha rosto, cor de cabelo, tom
de pele ou peça de roupa. Só geometria. E **não existe imagem de exemplo
inventada em lugar nenhum da Oficina** — não temos banco de imagens, e inventar
aparência é o que este projeto nunca faz. Por isso `"vazio"` é um espaço que o
autor preenche, e a tela diz isso na cara.

---

## 7. A ordem das tags — a tabela de baldes

Cada tag carrega um número no campo `ordem`. É o balde dela. Ordenar o prompt é
ordenar por esse número.

`acervo_regras.js` traz a lista completa em `ordens.baldes`, com **duas** ordens
possíveis por balde:

| balde | `padrao_manual` | `estilo_primeiro` |
|---|---|---|
| assunto e contagem | 10 | 10 |
| enquadramento | 20 | 20 |
| foco de objeto | 25 | 25 |
| ângulo de câmera | 30 | 30 |
| cabelo | 40 | 40 |
| olhos | 45 | 45 |
| pele e rosto | 50 | 50 |
| corpo | 55 | 55 |
| roupa da cabeça | 60 | 60 |
| roupa do tronco | 62 | 62 |
| roupa das pernas | 64 | 64 |
| calçado | 66 | 66 |
| acessório | 68 | 68 |
| pose e ação | 70 | 70 |
| cena, lugar, luz e clima | 80 | 80 |
| época | 85 | **6** |
| estilo | 90 | **5** |
| efeitos especiais | 95 | **8** |
| qualidade e estética | 98 | 98 |
| bloco de texto (`Text:`) | 999 | 999 |

**Por que existem duas ordens.** O manual se contradiz: a seção 2 recomenda o
assunto primeiro, e a seção 4 diz que estilo pesa muito e "também costuma ir
cedo" — e os quatro exemplos de estilo de lá começam pelo estilo. Em vez de
escolher pelo autor e esconder, a Oficina oferece as duas, com o motivo escrito
em cada uma (o campo `motivo` de cada opção em `ordens.opcoes`).

**A ordenação é estável.** Empatou no mesmo balde, mantém a ordem em que ele
escolheu. Isso importa: dentro de "roupa do tronco", a preferência é dele, não
nossa. A frase pronta para a tela está em `ordens.estabilidade`, e ela fala
"você", não "o autor" — o resto da Oficina fala com ele, e essa linha destoava.

**Cada balde traz DOIS motivos, e usar o errado desmente a tela.** Novo em
1.2.0: `porque_sobe` e `porque_desce`. A rodada 2 tinha um motivo só por balde,
e a Régua colava o mesmo texto nas duas direções — saía na tela, palavra por
palavra: *"`watercolor (medium)` desceu mais para o fim — é estilo, e tag de
estilo muda a imagem inteira, então pesa mais perto do começo."* A frase se
contradiz sozinha. Tag que **sobe** recebe `porque_sobe`; tag que **desce**
recebe `porque_desce`.

**Cuidado com o número remapeado.** No modo "Estilo em primeiro", os baldes de
estilo, época e efeitos viram 5, 6 e 8. Esses números servem para **ordenar**, e
não existem na tabela de nomes — descrever um balde por eles devolve "grupo 5".
Para explicar, use sempre o balde original da tag (o campo `ordem` dela).

**Nenhuma tag tem `ordem: 999`, e isso é de propósito.** O balde 999 é do bloco
`Text:`, que **não é tag**: ele é montado pelo motor e colado no fim absoluto do
prompt. Procurar uma tag de balde 999 no acervo devolve lista vazia hoje e vai
devolver lista vazia sempre — um alerta que dependa disso nunca dispara. O
validador da rodada 2 recusa qualquer tag que apareça com 999.

---

## 8. `acervo_regras.js` — as chaves de cima

| chave | o que tem |
|---|---|
| `modelos` | 6 modelos, cada um com `suporta` (multi_personagem, peso_numerico, peso_negativo, precise_reference, vibe_transfer, text_rendering) e, **novo em 1.2.0**, `suporta_verificado` com a mesma forma |
| `incompatibilidades` | 11 regras **duras** do motor. Cada uma tem `gravidade` (`"vermelha"` ou `"amarela"`) |
| `brigas_de_tag` | 8 conflitos documentados. `gravidade` `"amarela"` ou `"informativa"` |
| `modelos_nota` | **novo em 1.2.0** — o que a tabela de modelos garante e o que ela supõe |
| `ordens` | as duas ordens e os 20 baldes (seção 7) |
| `pesos` | chaves, colchetes, peso numérico e peso negativo, com o modelo mínimo de cada |
| `conteudo_indesejado` | os 4 presets — **ver o aviso na seção 10** |
| `multi_personagem` | máximo 6, grade 5×5, e os 3 prefixos de ação. **Novo em 1.2.1:** cada prefixo ganhou `onde`, e o bloco ganhou `regra_lugar`, `regra_lugar_para_tela` e `regra_contagem_espelho` |
| `referencias` | as 3 resoluções nativas, o preparo da imagem, os 2 controles e as 4 ferramentas com custo |
| `image2image`, `inpaint`, `upscale_enhance` | os controles de cada um |
| `director_tools` | as 6 ferramentas, com as condições do Emotion |
| `text_rendering` | formato, posição, limite de 120 caracteres, tags obrigatórias |
| `atalhos` | Prompt Chunks e Prompt Randomizer |
| `canvas` | as ferramentas e o boneco 3D (formatos, teclas, passos) |
| `custos` | itens em Anlas, planos e limites |
| `api` | token, endpoints não publicados, bibliotecas de comunidade |
| `avisos_permanentes` | 5 frases que a tela repete sempre |
| `glossario` | **novo em 1.1.0** — 22 termos com a frase pronta de explicação |
| `etiquetas_qualidade` | **novo em 1.1.0** — o interruptor e os dois avisos dele |

### 8.0 `frase_para_tela` e `nao_diga` — quando o dado tem de ganhar da tela

**Novo em 1.2.1, e é o conserto de um defeito grave.** A regra
`duas_char_ref_misturam` estava marcada `verificado: false` desde a rodada 3,
porque o manual não a traz: a palavra "misturar" não aparece nele, e o §08 só
diz que o custo soma quando há mais de uma referência. A regra continua valendo
— é decisão do autor, passada no briefing. O que não pode continuar é a tela
chamá-la de **"limite oficial do NovelAI"**, que foi o que ela fez, em três
arquivos ao mesmo tempo, enquanto o dado dizia o contrário.

A correção tinha parado na camada de dados e nunca chegado ao que o autor lê.
Por isso o registro agora carrega dois campos novos:

| campo | o que é |
|---|---|
| `frase_para_tela` | a frase honesta, escrita uma vez, para a tela, o motor e a ponte colarem a **mesma** |
| `nao_diga` | a frase proibida, com o motivo. É um recado de quem escreve o dado para quem escreve a tela |

**A regra geral, para não precisar de um caso a caso.** Nenhum texto da Oficina
chama de oficial uma regra cujo registro diz `verificado: false`. Hoje são 14
registros assim em `acervo_regras.js` e 102 tags em `acervo_tags.js`. O alerta
vermelho continua valendo — o que sai é a palavra "oficial".

### 8.1 O glossário — a regra da linguagem, virada em dado

O autor se declarou **totalmente leigo**, e a regra do projeto é dura: termo
técnico sempre seguido do que ele é, entre parênteses, **sem exceção**. A
crítica mediu o descumprimento: "Anlas" aparecia **15 vezes** na tela e nunca
era explicado — e é a palavra que controla o dinheiro dele.

Cada termo do `glossario` traz:

| campo | o que é |
|---|---|
| `termo` | a palavra como ela aparece na tela |
| `curto` | a explicação em meia linha |
| `primeira_vez` | **a frase pronta, com os parênteses** — B cola isto e acabou |
| `explica` | duas ou três frases, para a ficha do recurso |
| `de` | `"novelai"` (termo de lá) ou `"oficina"` (vocabulário nosso) |
| `verificado` / `origem` | de onde saiu |

**Como usar, e é simples:** na **primeira** vez que o termo aparece em cada
tela, cole o `primeira_vez` inteiro. Depois disso, na mesma tela, use só o
termo. Os três que a crítica cobrou nominalmente estão lá: `anlas`, `token` e
`ponte` — este último com `de: "oficina"`, porque "a ponte" é palavra nossa e
não existe no NovelAI.

### 8.2 O vocabulário que a tela manda para a ponte

Quatro controles existiam só de um lado e agora têm nome combinado. **O nome do
campo é este, nos dois lados** — o acervo o declara, a ponte o lê:

| controle | campo no pedido | valor | onde o acervo declara |
|---|---|---|---|
| plano de assinatura | `assinatura` | `nenhuma`, `teste`, `tablet`, `scroll`, `opus` | `custos.planos.seletor` |
| preset de Conteúdo Indesejado | `preset_indesejado` | o **id** do preset: `nenhum`, `leve`, `pesado`, `foco` | `conteudo_indesejado.campo_no_pedido` |
| Etiquetas de Qualidade | `etiquetas_de_qualidade` | sim/não | `etiquetas_qualidade.campo_no_pedido` |
| falas da imagem | `textos` | lista de falas, **sem** o prefixo | `text_rendering.campo_no_pedido` |

**Não mande número no preset.** O número é do NovelAI, muda com a versão deles,
e a tabela dele mora em `ponte\endpoints.json` com `verificado: false`. Quem
traduz o id para número é `ponte\novelai.py`, na função `numero_do_preset` — e
ela **recusa** id que não conhece, em vez de virar preset 0 em silêncio.

### 8.3 O custo no plano Opus — a ressalva que faltava

`custos.nota_opus` diz, e a tela precisa dizer também:

> No plano Opus a **geração** sai de graça (V4.5 ou inferior, tamanho normal,
> até 28 passos). A **referência de personagem não sai**: continua custando 5
> Anlas por imagem, e soma a cada quadro. Uma folha de mangá com 8 quadros e a
> referência do personagem em cada um são 40 Anlas.

Cada item de `custos.itens` carrega `gratis_no_opus` (sim/não) e `nota_opus`.
Dos cinco, só dois são gratuitos no Opus, e um deles porque o próprio manual
declara: o Inpaint Focado.

**A separação que B tem de respeitar:** `incompatibilidades` com
`gravidade: "vermelha"` são **regra do motor** — alerta vermelho que não some, e
o autor não negocia. `brigas_de_tag` são **preferência** — aviso amarelo, e o
autor decide.

---

## 9. `acervo_receitas.js` — as 15 receitas

Cada receita tem `id`, `nome`, `familia`, `para_que`, `origem`, e mais **dez
campos que agora são obrigatórios em todas as 15**: `ordem`, `tags_base`,
`prompt_montado`, `prompt_oficial`, `ordem_bate`, `ordem_nota`, `verificado`,
`verificado_nota`, `prompt_da_oficina` e (quando há fala) `textos`. B pode ler
qualquer um deles sem checar se existe.

Campos opcionais que aparecem em algumas: `modelo_sugerido` (um `id` de modelo),
`modelo_minimo`, `prompt_base`, `blocos`, `etapas`, `ferramenta`, `ajustes`,
`preserva`, `troque`, `aviso`, `nota`, `passos`, `alternativa`, `exibir_como`.

As famílias são: `estilo` (4), `manga` (2), `referencia` (2), `retoque` (4),
`personagem` (1), `basico` (1), `cenario` (1, nova em 27/08/2026 — D9, ver
seção 1).

### 9.1 `tags_base` — id solto **ou** item com peso e valor

Esta é a mudança que conserta a receita das falas. Cada entrada é uma de duas
coisas, e **as duas valem na mesma lista**:

```json
"tags_base": [
  "quem_2girls",
  "esp_text",
  { "id": "esp_speech_bubble", "peso": { "tipo": "numerico", "valor": -1 } },
  { "id": "epo_year_xxxx", "valor": "year 1998" }
]
```

| campo do item | tipo | o que faz |
|---|---|---|
| `id` | texto | o `id` da tag, obrigatório |
| `peso` | objeto ou ausente | `{"tipo": "nenhum" \| "chaves" \| "colchetes" \| "numerico", "valor": número}` |
| `valor` | texto ou ausente | **substitui o texto inteiro da tag** — é como `year XXXX` vira `year 1998` |

Ausente `peso`, vale `{"tipo":"nenhum","valor":0}`. Ausente `valor`, vale a
`tag` do acervo. Este é exatamente o vocabulário que `interface\motor_prompt.js`
já usa, então não há tradução no meio.

**Por que isso existe.** O prompt oficial das falas é
`… -1::speech bubble::, looking at another, best quality`. O `-1::` é peso
negativo, e serve para **evitar** o balão desenhado, deixando só o texto. Com
`tags_base` sendo uma lista de ids sem peso, a Bancada montava `speech bubble`
com peso normal — ou seja, **pedia** o balão. O efeito saía invertido, e o
`para_que` da própria receita diz "sem balão desenhado".

### 9.2 O prefixo `Text: ` não mora nos dados — quem o põe é o motor

Regra dura, e ela vale nos dois sentidos:

- `textos` e `bloco_texto` trazem **só a fala**, nunca o prefixo. Os dois são o
  **mesmo dado**: `bloco_texto` é o nome que a tela já lia, mantido para não
  quebrar nada; `textos` é o nome bom. Ambos são **lista**, uma fala por item —
  assim a tela conta os 120 caracteres de cada fala em separado.
- `exibir_como` é o **único** campo que traz o prefixo, e existe só para o
  cartão mostrar o exemplo como o manual o escreveu.
- Nos `blocos`, o bloco de fala traz `eh_bloco_de_texto: true`, o `prompt` sem
  prefixo, e o `exibir_como` com ele.

**Por que a regra é tão explícita.** A Bancada chegou a mostrar
`Text: Text: Aren't stochastic…`, com o contador somando os 6 caracteres a
mais. O manual avisa que qualquer coisa depois do `Text:` pode acabar
**desenhada dentro da imagem** — então o prefixo dobrado vira uma palavra
escrita no quadro do mangá. Os dados calam sobre o prefixo, o motor o põe uma
vez, e o problema não pode voltar.

### 9.3 `ordem` — cada receita declara o modo que ela pressupõe

`"ordem": "padrao_manual"` ou `"ordem": "estilo_primeiro"`. Ao usar a receita, a
tela troca o modo **junto** com as tags. Sem isso, o cartão mostrava um prompt e
a Bancada entregava outro, com o recado "a oficina mudou 7 tags de lugar" —
dez das onze receitas com prompt faziam isso.

Seis receitas declaram `estilo_primeiro`: as quatro de estilo, o quadro de mangá
e o caminho A de troca de estilo. As outras oito, `padrao_manual`.

### 9.4 Os três campos que dizem a verdade sobre a ordem

| campo | tipo | o que é |
|---|---|---|
| `prompt_oficial` | texto ou `null` | o prompt **como o manual o escreveu**, quando existe um |
| `prompt_da_oficina` | texto ou `null` | o prompt que a **Oficina** montou, quando o manual não escreveu nenhum |
| `prompt_montado` | texto ou `null` | o que a Oficina realmente monta, com o modo declarado |
| `ordem_bate` | sim / não / `null` | `prompt_montado == prompt_oficial`? `null` = não há prompt oficial único para comparar |
| `ordem_nota` | texto ou `null` | quando não bate, **por que** — em português, uma frase |
| `verificado` | verdadeiro/falso | as tags **e o arranjo** desta receita vêm do manual? |
| `verificado_nota` | texto ou `null` | a frase pronta que a tela mostra quando há ressalva |

**`prompt_oficial` e `prompt_da_oficina` nunca estão os dois preenchidos.** Um
deles é sempre `null`. Quando `verificado` é falso, o texto está no segundo, e
`ordem_bate` é `null` — não há ordem do manual para comparar contra.

O placar honesto de hoje, conferido por código:

| `ordem_bate` | quantas | quais |
|---|---|---|
| sim | **4** | `estilo_aquarela`, `estilo_ukiyoe`, `estilo_cinema`, `folha_referencia` |
| não | **6** | `estilo_pixel`, `trocar_estilo_a`, `trocar_pose`, `roupa_consistente`, `texto_na_imagem`, `primeiro_prompt` |
| `null` | **5** | `prancha_personagem` (o manual não escreve prompt para ela), `quadro_manga` (quatro blocos, sem prompt único), `trocar_estilo_b` e `trocar_estilo_c` (são caminhos de ferramenta, não montam prompt), `cenario_abatedouro_clandestino` (D9, 27/08/2026 — não vem do manual, não há prompt oficial para comparar) |

### 9.5 `verificado` — a receita que a Oficina inventou (novo em 1.2.0)

**Treze receitas têm `verificado: true`. Duas têm `false`: a
`prancha_personagem` e, desde 27/08/2026, a `cenario_abatedouro_clandestino`
(D9 — nenhuma tag dela vem do manual, e a combinação é escolha da Oficina).**

O que aconteceu: ela guardava, num campo chamado `prompt_oficial`, o texto
`character image, full body, standing, simple background, facing viewer, no text`.
Conferido no manual inteiro: a grafia `character image` aparece **uma** vez, na
gaveta "Símbolos com nome próprio", numa lista de tags. Nunca dentro de um
prompt. A seção 08 e a 19.2 descrevem a referência ideal **em prosa** — corpo
inteiro, de pé, pose neutra, fundo simples — e não trazem nenhuma linha de tags.
O prompt é bom e a receita continua útil; o que era falso é o carimbo em cima
dela.

Hoje o registro diz a verdade em quatro lugares: `prompt_oficial` é `null`, o
texto está em `prompt_da_oficina`, `verificado` é falso, e `verificado_nota`
traz a frase pronta. O `para_que` — que a tela já mostra no cartão — também
diz.

**Duas receitas têm `verificado: true` com ressalva escrita, e vale ler qual.**
A `folha_referencia` não bate letra por letra, mas as quatro tags dela são
literalmente as que §19.2 manda usar, com estas palavras; a `quadro_manga` vem
das quatro caixas de §19.7, e a Oficina só as junta num prompt só. Nos dois
casos o `verificado_nota` explica.

**O que B tem de fazer com isso.** A frase de cima do bloco de receitas —
"Cada receita é um prompt inteiro tirado do manual" — é verdadeira para treze
e falsa para uma. E o recado de carregar uma receita não pode dizer "a ordem
exata do manual" quando `verificado` é falso, porque não há ordem do manual.
**Leia `verificado`; quando for falso, mostre `verificado_nota`.**

**Nas sete que não batem, a diferença é sempre a mesma coisa:** a Oficina agrupa
por tipo (todo o estilo junto, toda a roupa junta, por parte do corpo) e o
manual escreveu o exemplo na ordem em que a pessoa pensa. **São as mesmas tags,
e o motor trata as duas ordens igual.** Nenhuma das sete muda o que a imagem vai
ser — mas o cartão tem de poder dizer isso, em vez de mostrar um texto e
entregar outro.

Uma delas merece nota, porque não é defeito e sim a razão de a Oficina existir:
`primeiro_prompt` é o exemplo de introdução do manual, escrito na ordem em que a
pessoa pensa. A Oficina o reordena e mostra o porquê de cada mudança — que é
exatamente a exigência 6 do autor, e o trabalho da Régua de Ordem.

**Garantia verificada por código:** todo `id` citado em `tags_base` e em
`blocos[].tags` existe no `acervo_tags.js`; todo `modelo_sugerido` existe em
`regras.modelos`; todo `peso.tipo` está no vocabulário da tela; nenhum campo de
dado carrega o prefixo `Text:`; e `prompt_montado` é **recalculado do zero** e
comparado, então ele não pode envelhecer em silêncio.

---

## 10. O que este acervo NÃO garante — leia antes de reclamar

1. **O conteúdo literal dos presets de Conteúdo Indesejado não está aqui.** O
   manual não publica a lista de palavras de cada preset, e ele mesmo diz que
   trocar de modelo muda essa lista. Os quatro presets estão em
   `regras.conteudo_indesejado.presets` com `conteudo_literal: null` e
   `verificado: false`. O único conteúdo confirmado é `chromatic aberration`
   dentro do preset Pesado. **B não deve fingir que tem a lista.**
   **E o número também não é do manual.** O NovelAI identifica cada preset por
   um número, que mora em `ponte\endpoints.json`. O acervo traz
   `conteudo_indesejado.nota_sob_seletor` com a frase que a tela precisa mostrar
   embaixo do seletor, e `aviso_numeros` com o detalhe. O quarto preset se chama
   `Foco humano (estimativa)` porque o manual só cita "variações por foco", no
   plural, sem nomear nenhuma.

2. **Os preços dos planos não vêm do manual.** `regras.custos.planos` está
   inteiro com `verificado: false` e um `aviso` explicando. Os valores em Anlas
   das ferramentas (5 do Character Reference, 2 do Vibe Transfer) **são** do
   manual e estão com `verificado: true`.

3. **Os endereços técnicos da API não estão aqui.** Eles são do Construtor C, em
   `ponte\endpoints.json`. O acervo só registra, em `regras.api`, que a
   documentação oficial não os publica.

4. **383 tags vieram do manual (ou foram reconfirmadas contra a reconstrução
   dele); 614 vieram de fora, e dizem isso.** As 382 tags antigas com
   `verificada: true` foram procuradas por código, como palavra inteira,
   primeiro dentro do `manual-novelai.html` original (na época em que existia),
   e depois — em 27/08/2026, rodada 3 (D7) — dentro da reconstrução parcial
   dele. 346 bateram nos dois momentos; 36 só no original (a reconstrução é
   parcial e não prova erro — ver seção 1 e `FONTES.md` 5.11). Nenhuma foi
   rebaixada. **1 tag nova foi promovida** na mesma rodada: `nat_petals`
   ("petals"), achada na reconstrução. Das 614 de fora, **496 são de
   27/08/2026** e trazem, no `origem`, o número de imagens medido na API do
   Danbooru — essa medição **é** reproduzível. `est_ref_hirano` (27/08/2026,
   rodada 4, D11) é mais uma, no mesmo padrão das outras 8 tags de mangaká: o
   nome do artista não é vocabulário do manual do NovelAI. As 102 de cenário,
   ação e expressão **não estão no manual** — o manual não tem gaveta de cenário,
   e a busca por `indoors`, `outdoors`, `rooftop`, `sitting`, `smile`, `crying`,
   `snow` e `beach` devolve zero. Elas entraram porque o autor pediu a categoria
   `paisagem` pelo nome e ela tinha 4 lugares. Todas com `verificada: false` e
   `origem: "fora do manual — grafia de uso comum na comunidade do NovelAI…"`.
   **A tela é obrigada a marcar cada uma delas** (selo NV na bolinha e nota
   amarela na ficha). Nenhuma delas usa o campo `requer`, de propósito: a tela
   escreve "O manual diz que X rende mais junto com Y", e o manual não diz nada
   sobre elas.

5. **O acervo não sabe o que o autor tem no disco.** Ele diz que a tag
   `est_watercolor_medium` tem um espaço de exemplo chamado
   `est_watercolor_medium.png`; se aquele arquivo existe ou não, quem sabe é a
   ponte. O acervo nunca afirma que há imagem — ele diz onde ela caberia.

6. **O acervo não decide gasto.** Ele traz o preço de cada item e a ressalva do
   Opus. Quem soma, quem aplica teto e quem barra é `ponte\orcamento.py`. Se os
   dois discordarem um dia, **a ponte manda**, porque é ela que gasta.

---

## 11. Se você achar que este contrato está errado

**Obedeça mesmo assim e avise.** Mudar o formato por conta própria quebra os
outros dois construtores. O acervo é gerado por script, então uma correção é
barata — mas ela tem de ser feita no acervo, uma vez, e não contornada em três
lugares diferentes.
