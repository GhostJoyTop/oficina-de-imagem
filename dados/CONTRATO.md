# CONTRATO DOS DADOS — Oficina de Imagem

Este é o documento que o **Construtor B** (a tela) e o **Construtor C** (a ponte)
leem **antes de escrever uma linha**. Ele descreve os três arquivos da pasta
`dados\`, campo por campo.

Quem escreve em `dados\` é só o Construtor A. B e C **leem** e nunca gravam aqui.

---

## 1. Os três arquivos

| Arquivo | Variável | O que tem dentro |
|---|---|---|
| `acervo_tags.js` | `window.OFICINA_ACERVO` | 382 tags e 17 categorias |
| `acervo_regras.js` | `window.OFICINA_REGRAS` | as regras do motor NovelAI, como dados |
| `acervo_receitas.js` | `window.OFICINA_RECEITAS` | 14 receitas prontas de prompt |

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
  "versao_formato": "1.0.0",
  "fonte": "manual-novelai.html (docs.novelai.net)",
  "gerado_em": "2026-08-21",
  "categorias": [ ... 17 ... ],
  "tags": [ ... 382 ... ]
}
```

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

**Atenção ao `ordem` da subcategoria.** Ele pode ser diferente do `ordem_base`
da categoria. Exemplo real: a categoria `roupa` tem `ordem_base` 60, mas a
gaveta `pernas` tem `ordem` 64 e a gaveta `acessorio` tem `ordem` 68. É de
propósito: é o conselho do manual ("descreva cabeça, tronco e pernas
separadamente") virado em mecânica.

**Sobre `eixo_unico`.** Quando é verdadeiro, todas as tags daquela gaveta já vêm
com o campo `exclusivo_com` preenchido com as irmãs. B não precisa calcular
nada: basta obedecer o `exclusivo_com` de cada tag.

### As 17 categorias e suas 51 gavetas

| categoria | `ordem_base` | gavetas |
|---|---|---|
| `quem` | 10 | contagem, caixa_personagem |
| `enquadramento` | 20 | distancia |
| `multiplas_vistas` | 20 | folha |
| `foco` | 25 | objeto |
| `angulo` | 30 | posicao |
| `cabelo` | 40 | comprimento, penteado, rabo, franja, topo, textura, cor, cor_combinada, pelo_facial |
| `olhos` | 45 | cor, pupila |
| `pele` | 50 | tom, fantastica, detalhes |
| `corpo` | 55 | altura, magro, robusto, atletico, peito |
| `roupa` | 60 | cabeca (60), tronco (62), pernas (64), calcado (66), acessorio (68) |
| `pose` | 70 | acao, olhar, expressao, dupla |
| `paisagem` | 80 | lugar, tempo_luz, fundo |
| `epoca` | 85 | era |
| `estilo` | 90 | meio_categoria, meio_tradicional, meio_digital, movimento, traco, coloracao, cor_dominante, efeitos (95) |
| `qualidade` | 98 | nivel |
| `estetica` | 98 | nivel |
| `especiais` | 98 | dataset, simbolos, manga |

---

## 5. Os campos de uma TAG

**Todos são obrigatórios. Nenhum falta em nenhuma das 382 tags.** B pode ler
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
| `verificada` | verdadeiro/falso | apareceu no manual? **Falso obriga a mostrar aviso na tela.** Hoje as 382 são `true` |
| `origem` | texto | onde no manual. Ex.: `"§18 Armazém de tags › Cabelo › Cor"` |
| `exemplo` | objeto | `{"tipo": ..., "ref": ...}` — ver a seção 6 |
| `aviso` | texto ou `null` | alerta curto que aparece junto da tag. 112 tags têm |
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
| `"esquema"` | 34 | 📐 um desenho geométrico feito por nós | o nome do SVG que B desenha em `interface\esquemas.js` |
| `"vazio"` | 315 | 🖼️ um quadrado com "solte aqui uma imagem sua com esta tag" | o nome do arquivo dentro de `meu_trabalho\exemplos\` |
| `"nenhum"` | 33 | nada — sem marca, sem quadrado | sempre `null` |

**Os três nomes de esquema usados, e mais nenhum:**

| `ref` | quantas tags | o que o desenho mostra |
|---|---|---|
| `enquadramento_escada` | 10 | quadros recortando um bonequinho, do close-up ao very wide shot |
| `angulo_camera` | 15 | posições da câmera ao redor de uma figura |
| `cabelo_comprimento` | 9 | silhuetas de comprimento de cabelo |

B não precisa inventar nome nenhum: se `exemplo.tipo` é `"esquema"`, o `ref` é
um destes três.

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

**A ordenação é estável.** Empatou no mesmo balde, mantém a ordem em que o autor
escolheu. Isso importa: dentro de "roupa do tronco", a preferência é dele, não
nossa.

---

## 8. `acervo_regras.js` — as chaves de cima

| chave | o que tem |
|---|---|
| `modelos` | 6 modelos, cada um com `suporta` (multi_personagem, peso_numerico, peso_negativo, precise_reference, vibe_transfer, text_rendering) |
| `incompatibilidades` | 11 regras **duras** do motor. Cada uma tem `gravidade` (`"vermelha"` ou `"amarela"`) |
| `brigas_de_tag` | 7 conflitos documentados. `gravidade` `"amarela"` ou `"informativa"` |
| `ordens` | as duas ordens e os 20 baldes (seção 7) |
| `pesos` | chaves, colchetes, peso numérico e peso negativo, com o modelo mínimo de cada |
| `conteudo_indesejado` | os 4 presets — **ver o aviso na seção 10** |
| `multi_personagem` | máximo 6, grade 5×5, e os 3 prefixos de ação |
| `referencias` | as 3 resoluções nativas, o preparo da imagem, os 2 controles e as 4 ferramentas com custo |
| `image2image`, `inpaint`, `upscale_enhance` | os controles de cada um |
| `director_tools` | as 6 ferramentas, com as condições do Emotion |
| `text_rendering` | formato, posição, limite de 120 caracteres, tags obrigatórias |
| `atalhos` | Prompt Chunks e Prompt Randomizer |
| `canvas` | as ferramentas e o boneco 3D (formatos, teclas, passos) |
| `custos` | itens em Anlas, planos e limites |
| `api` | token, endpoints não publicados, bibliotecas de comunidade |
| `avisos_permanentes` | 5 frases que a tela repete sempre |

**A separação que B tem de respeitar:** `incompatibilidades` com
`gravidade: "vermelha"` são **regra do motor** — alerta vermelho que não some, e
o autor não negocia. `brigas_de_tag` são **preferência** — aviso amarelo, e o
autor decide.

---

## 9. `acervo_receitas.js` — as 14 receitas

Cada receita tem `id`, `nome`, `familia`, `para_que`, `origem`, e depois **um de
dois formatos**:

- **receita simples:** `prompt_base` (texto pronto) + `tags_base` (a lista de
  `id` de tag correspondente);
- **receita em blocos:** `blocos`, uma lista de `{rotulo, prompt, tags}` — é o
  caso do quadro de mangá e da evolução da roupa.

Campos opcionais que aparecem em algumas: `modelo_sugerido` (um `id` de modelo),
`ferramenta`, `ajustes`, `preserva`, `troque`, `aviso`, `nota`, `passos`,
`etapas`, `bloco_texto`, `alternativa`.

As famílias são: `estilo` (4), `manga` (2), `referencia` (2), `retoque` (4),
`personagem` (1), `basico` (1).

**Garantia verificada por código:** todo `id` citado em `tags_base` e em
`blocos[].tags` existe no `acervo_tags.js`, e todo `modelo_sugerido` existe em
`regras.modelos`. B pode confiar sem checar.

---

## 10. O que este acervo NÃO garante — leia antes de reclamar

1. **O conteúdo literal dos presets de Conteúdo Indesejado não está aqui.** O
   manual não publica a lista de palavras de cada preset, e ele mesmo diz que
   trocar de modelo muda essa lista. Os quatro presets estão em
   `regras.conteudo_indesejado.presets` com `conteudo_literal: null` e
   `verificado: false`. O único conteúdo confirmado é `chromatic aberration`
   dentro do preset Pesado. **B não deve fingir que tem a lista.**

2. **Os preços dos planos não vêm do manual.** `regras.custos.planos` está
   inteiro com `verificado: false` e um `aviso` explicando. Os valores em Anlas
   das ferramentas (5 do Character Reference, 2 do Vibe Transfer) **são** do
   manual e estão com `verificado: true`.

3. **Os endereços técnicos da API não estão aqui.** Eles são do Construtor C, em
   `ponte\endpoints.json`. O acervo só registra, em `regras.api`, que a
   documentação oficial não os publica.

4. **Nenhuma tag foi inventada.** As 382 vieram do `manual-novelai.html`. Se um
   dia alguém acrescentar uma que não esteja lá, ela entra com
   `verificada: false`, e a tela é obrigada a marcar isso.

---

## 11. Se você achar que este contrato está errado

**Obedeça mesmo assim e avise.** Mudar o formato por conta própria quebra os
outros dois construtores. O acervo é gerado por script, então uma correção é
barata — mas ela tem de ser feita no acervo, uma vez, e não contornada em três
lugares diferentes.
