# PROTOCOLO DA PONTE

O contrato dos endereços que a Oficina usa para falar com o próprio computador.

Quem serve estes endereços: `ponte\servidor.py`.
Quem os chama: `interface\ponte_cliente.js`.

Este arquivo é a verdade. Se o programa e este texto discordarem, o programa
está errado e deve ser corrigido para bater com o que está escrito aqui.

---

## 1. Onde a ponte fica

`http://127.0.0.1:<porta>/api/...`

A porta é procurada entre **8760 e 8770**, na ordem, e a primeira livre vence.
A página não precisa descobrir a porta: ela é servida pela mesma porta, então
uma chamada para `/api/estado` (caminho relativo) sempre acerta.

Se as onze portas estiverem ocupadas, o servidor não sobe. A página abre em
**modo seco** (sem gravar em disco) e a Oficina continua funcionando.

**Uma Oficina só, e isto mudou em 21/08/2026.** Antes de subir, o servidor
varre as onze portas procurando uma Oficina **desta mesma pasta** já rodando. Se
achar, ele **não sobe outra**: abre o navegador na que existe e sai.

O motivo é maior do que parece, e vale para o Construtor B saber, porque explica
três defeitos de uma vez. O navegador guarda a memória de uma página **por
endereço, com a porta dentro**. Então, quando a Oficina abria numa porta nova:

- o álbum de imagens de exemplo por tag aparecia vazio, embora os arquivos
  estivessem no disco (o índice morava só na memória do navegador);
- o rascunho recuperado do disco brigava com o que a tela já tinha montado;
- e as duas janelas contavam gasto separado, furando o teto de Anlas (os
  créditos pagos do NovelAI — cada imagem consome um tanto).

Com uma Oficina só, a porta para de saltar. **Mesmo assim, nada do lado do
Construtor B pode depender da porta ser sempre a mesma** — o que precisa
sobreviver a fechar e abrir vai para o disco, pelos endereços de trabalho.

**A ponte só atende a si mesma.** O servidor confere o cabeçalho `Host` de todo
pedido. Se ele não for `127.0.0.1`, `localhost` ou `::1`, a resposta é 403. Nos
métodos que mudam alguma coisa (POST, PUT, DELETE) o cabeçalho `Origin` também
é conferido. Isso impede que um site aberto em outra aba converse com a Oficina.

---

## 2. A forma de toda resposta

Toda resposta é JSON (formato de texto que programa lê) em UTF-8 (a codificação
que aceita acento), e sempre traz:

```json
{ "ok": true }
```

ou

```json
{ "ok": false, "erro": "uma frase em português dizendo o que fazer" }
```

**Regra dura para o Construtor B:** o campo `erro` já vem escrito para o autor
ler. Mostre-o como está. Nunca troque por texto seu, e nunca mostre código de
erro (número técnico) na tela.

A única resposta que **não** é JSON: `GET /api/trabalho/<tipo>/<nome>` quando o
arquivo é imagem. Aí vêm os bytes da imagem, com o tipo certo no cabeçalho.

---

## 3. Estado

### `GET /api/estado`

O retrato da Oficina. É a primeira chamada que a página faz.

```json
{
  "ok": true,
  "modo": "ligado",
  "frase_do_modo": "Oficina ligada. Sem token — a geração acontece no site...",
  "tem_token": false,
  "geracao_ao_vivo": false,
  "modo_ensaio": true,
  "explicacao_do_ensaio": "No modo ensaio a oficina monta a chamada...",
  "porta": 8760,
  "aberta_em": "2026-08-21T13:40:00",
  "pasta_de_trabalho": "...\\meu_trabalho",
  "pasta_do_cofre": "C:\\Users\\...\\AppData\\Roaming\\OficinaDeImagem",
  "gasto_hoje": 0, "teto_dia": 300,
  "gasto_sessao": 0, "teto_sessao": 100,
  "sobra_hoje": 300, "sobra_sessao": 100,
  "gerando": false,
  "config": { "assinatura": "nenhuma", "tema": "sistema",
              "ordem": "padrao_manual", "modelo": "v45_full" },
  "planos_que_existem": ["nenhuma", "teste", "tablet", "scroll", "opus"],
  "palavras": {
    "anlas": "Anlas (os créditos pagos do NovelAI — cada imagem consome um tanto)",
    "ponte": "a ponte (o programinha da janela preta, que salva no seu disco)",
    "token": "token (a senha que a sua conta do NovelAI dá a este programa)",
    "onde_pegar_o_token": "O token fica no site do NovelAI, no menu da sua conta, com o nome Token Persistente de API. Ele aparece uma vez só — copie antes de fechar a janela."
  }
}
```

**`pasta_do_cofre` vem por extenso, e é isso que a tela mostra.** Nunca escreva
`%APPDATA%\OficinaDeImagem` na tela: `%APPDATA%` é escrita de programador, e o
autor não sabe abrir esse lugar. A ponte já devolve o caminho de verdade.

**O bloco `palavras` existe para a tela não ter de inventar a explicação.** A
regra do projeto é termo técnico sempre seguido do que ele é, entre parênteses,
sem exceção — e "Anlas" aparecia quinze vezes na tela sem uma única linha
dizendo o que era. É a unidade que controla o dinheiro dele. Use estas frases na
**primeira aparição de cada tela**, e `onde_pegar_o_token` logo acima do campo
do token, porque a tela pedia o token sem nunca dizer onde buscá-lo.

`modo` tem dois valores: `"ligado"` (sem token) e `"ligado_com_token"`.
O terceiro estado da lâmpada — 🔴 seca — não vem daqui: ele é o que a página
mostra quando esta chamada **falha**, porque aí não há ponte nenhuma.

Mapa da lâmpada, para o Construtor B:

| lâmpada | quando | o que a página faz |
|---|---|---|
| 🔴 seca | `/api/estado` não respondeu | grava na memória do navegador; aviso amarelo fixo com "Baixar meu trabalho" |
| 🟡 ligada | respondeu, `tem_token: false` | grava em disco; botão "Copiar prompt" |
| 🟢 com token | respondeu, `tem_token: true` | grava em disco; "Copiar prompt" **e** "Gerar aqui" |

**O token nunca aparece nesta resposta.** Nem inteiro, nem em pedaço, nem
mascarado. `tem_token` é tudo o que a tela pode saber.

---

## 4. O cofre do token

### `POST /api/token`

Envia: `{"token": "..."}`

Responde: `{"ok": true, "tem_token": true, "mensagem": "Token guardado..."}`

O corpo deste pedido **nunca** é registrado em log. O token é gravado em
`%APPDATA%\OficinaDeImagem\token.txt`, fora da pasta do livro e fora do git.

Colagem errada volta como `ok: false` com a frase pronta: texto vazio, texto com
espaço no meio, curto demais, ou longo demais.

**Para o Construtor B:** o campo da tela é do tipo senha (esconde o que se
digita), e é limpo assim que a resposta chega. A tela nunca mais mostra o valor.

### `DELETE /api/token`

Apaga o token. Responde `{"ok": true, "tem_token": false}`.
Apagar o token também desliga a geração ao vivo.

### `POST /api/testar_token`

Pergunta ao NovelAI se o token funciona. **Não gasta Anlas nenhum** — é a
chamada mais barata que existe, e só lê os dados da conta.

```json
{ "ok": true, "mensagem": "O token funciona. Nada foi gasto neste teste. ...",
  "gerou_imagem": false,
  "o_que_este_teste_nao_prova": "Este teste pergunta os dados da sua conta...",
  "plano": "opus", "anlas_na_conta": 9800 }
```

⚠️ **O nome do botão na tela precisa dizer a verdade.** Este endereço fala com o
endereço da **conta**, e nunca toca no endereço da **geração** — que é
justamente o único marcado como não verificado, o único que pode ter mudado do
lado deles. Um botão chamado "Teste de 1 imagem" que chama isto aqui não testa
imagem nenhuma. Chame-o de **"Testar se o token vale (não gera imagem)"**, e use
o botão separado abaixo para provar a geração.

### `POST /api/testar_geracao`

**Gera UMA imagem de verdade**, a mais barata possível: um prompt de três
palavras, uma imagem, tamanho de partida. É o botão **"Gerar 1 imagem de
prova"**, e serve para provar que a ponte está de pé antes de qualquer lote.

Passa pelas **mesmas três portas** de `/api/gerar` — geração ao vivo ligada,
`executar: true`, e `custo_confirmado` batendo. Não existe atalho para gastar.

Envia: `{"executar": true, "custo_confirmado": 5}` (ou nada, para o ensaio).
Responde igual a `/api/gerar`, mais `"e_teste_de_geracao": true`.

---

## 5. O modo de geração

### `GET /api/modo` · `POST /api/modo`

O padrão é o **modo ensaio**, e ele volta a ser o padrão toda vez que a Oficina
abre. Fechar e abrir a janela preta devolve a Oficina ao estado seguro.

Envia: `{"geracao_ao_vivo": true}`

Responde: `{"ok": true, "geracao_ao_vivo": true, "modo_ensaio": false, "mensagem": "..."}`

Ligar a geração ao vivo **sem token guardado** é recusado, com a frase pronta.

---

## 6. O trabalho do autor

As cinco gavetas, e não existe uma sexta: **`meus_personagens`**, `prompts`,
`exemplos`, `referencias`, `geradas`.

**A primeira mudou de nome em 21/08/2026, e o Construtor B precisa acompanhar.**
Ela se chamava `personagens` — o mesmo nome da pasta do livro. A trava de código
do projeto (`proteger-canonico.py`) olha o nome solto, então ela bloqueava quem
fosse consertar a ferramenta, achando que era conteúdo do livro. Aconteceu de
verdade com o crítico desta rodada.

O nome antigo **continua sendo aceito** e cai na gaveta nova, então nada quebra
enquanto a lista `TIPOS` de `interface\ponte_cliente.js` não for atualizada. Mas
atualize: o endereço devolvido nas respostas já é o novo. O que estava na pasta
antiga foi levado para a nova pelo próprio servidor, na primeira vez que rodou.

### `GET /api/trabalho/<gaveta>`

```json
{ "ok": true, "tipo": "meus_personagens", "quantos": 2,
  "itens": [
    { "nome": "Heitor.json", "bytes": 1840,
      "modificado": "2026-08-21T13:10:00",
      "endereco": "/api/trabalho/meus_personagens/Heitor.json" }
  ] }
```

### `GET /api/trabalho/<gaveta>/<nome>`

- arquivo `.json` → `{"ok": true, "nome": "...", "conteudo": { ... }}`
- arquivo `.md` ou `.txt` → `{"ok": true, "nome": "...", "texto": "..."}`
- imagem → os bytes da imagem, com o tipo certo. **Não é JSON.**

### `PUT /api/trabalho/<gaveta>/<nome>`

Envia **um** destes três:

| campo | para quê |
|---|---|
| `conteudo` | um dado estruturado; é gravado como JSON com acento preservado |
| `texto` | texto simples (o `.md` legível do personagem, por exemplo) |
| `dados_base64` | uma imagem; aceita com ou sem o prefixo `data:image/png;base64,` |

Responde: `{"ok": true, "nome": "...", "endereco": "/api/trabalho/..."}`

A gravação é feita primeiro num arquivo temporário e só depois trocada. Isso
evita meio-arquivo se algo falhar no meio.

### Duas convenções de arquivo que o Construtor B precisa conhecer

**`prompts/_rascunho_atual.json` tem cópia de segurança automática.** Toda vez
que ele é trocado, a ponte guarda o conteúdo anterior como
`prompts/_rascunho_AAAA-MM-DD_HHMMSS.json` e devolve o nome dela no campo
`copia_do_anterior`. As doze últimas ficam; as mais velhas somem sozinhas.

Isso é a rede embaixo, não a solução: o caso real foi o autor perder 14 tags
porque clicou em duas tags antes de a leitura do disco terminar, e o gravador
automático sobrescreveu o arquivo meio segundo depois. **A tela continua tendo de
não gravar antes de a leitura do disco responder.** A rede só garante que, se
acontecer de novo, o que foi perdido está no disco e dá para voltar atrás.

**`exemplos/_indice.json` é onde mora o índice das imagens de exemplo por tag.**
A ponte o cria vazio na primeira vez, então ele nunca volta "não encontrei":

```json
{ "versao_formato": "1.0.0", "por_tag": {} }
```

**O que tem dentro é do Construtor B, e a ponte não olha.** Ela cria o arquivo
com `por_tag` vazio, grava o que a tela mandar e devolve igual. Hoje a tela
escreve as duas chaves (`tags` e `por_tag`), cada tag apontando para um objeto
com `arquivo`, `onde` e `quando` — e isso está certo: quem grava e quem lê é o
mesmo lado. A ponte só garante que o arquivo existe, que é UTF-8 e que sobrevive
a fechar a Oficina.

Ele mora no **disco**, e não na memória do navegador, porque a memória do
navegador é presa ao endereço — porta inclusa. Guardado só na memória, o álbum
de exemplos sumia da tela quando a Oficina abria noutra porta, enquanto o Álbum
continuava listando os arquivos: a mesma tela se contradizendo.

### `DELETE /api/trabalho/<gaveta>/<nome>`

Apagar o que já não existe responde `ok: true` — não é erro.

### Os nomes que a ponte aceita

Letra, número, acento, espaço, ponto, hífen e sublinha. Até 120 caracteres.
No máximo **uma** pasta dentro da gaveta (é o que permite `geradas/2026-08-21/`).

Recusado sempre, com erro em português: qualquer caminho com `..`, nome
terminado em ponto, e os nomes reservados do Windows (`con`, `prn`, `aux`,
`nul`, `com1`…`com9`, `lpt1`…`lpt9`).

**A trava de escrita não tem escape.** A ponte só grava dentro de
`Ferramentas\Oficina_de_Imagem\meu_trabalho\`. Nenhum parâmetro muda isso.

---

## 7. Imagem que o autor arrasta

### `POST /api/imagem`

```json
{ "tipo": "referencias", "nome": "heitor_frente.png", "dados_base64": "..." }
```

`tipo` é uma das cinco gavetas (o padrão é `referencias`). Sem `nome`, a ponte
inventa um com a data e a hora. Só aceita `.png`, `.jpg`, `.jpeg`, `.webp` e
`.gif`, e no máximo 40 MB.

Responde: `{"ok": true, "tipo": "...", "nome": "...", "bytes": 184320, "endereco": "..."}`

---

## 8. O que a Oficina lê do livro

### `GET /api/livro/personagens`

Devolve **só os nomes** dos arquivos de `Personagens\`. Nunca o conteúdo.

```json
{ "ok": true, "nomes": ["Ghost", "Heitor", "Helena", "Tito"],
  "aviso": "Isto é só a lista de nomes. A oficina não lê a aparência..." }
```

**Proibição, e ela é da planta:** a Oficina não puxa descrição de aparência dos
arquivos do livro. A aparência vem do autor ou da imagem de referência que ele
anexa. A Oficina só ajuda a nomear e a organizar.

### `GET /api/livro/biblia_visual` · `GET /api/livro/biblia_visual/<nome>` — FECHADA em 23/08/2026

**Esta seção descreve uma rota que não existe mais.** Ficou aqui sem essa nota
até 24/08/2026, e uma auditoria quase recomendou reabri-la por causa disso —
exatamente o acidente que o comentário do lado do servidor pede para evitar.

Sem nome, listava os três arquivos que a Oficina podia ler. Com nome, devolvia
o texto de um deles. A lista era fechada em três: `PADRAO_VISUAL_DEFAULT.md`,
`INDICE_REFERENCIAS.md`, `REGRAS_PROMPT_POR_MOTOR.md`.

**Por que foi fechada.** A rota existia, respondia, e nenhuma linha da tela a
chamava — código morto. Mais grave: `PADRAO_VISUAL_DEFAULT.md` descreve a
aparência estabelecida do livro, e a planta proíbe a Oficina puxar aparência
dos arquivos do livro para dentro de um prompt (a aparência vem do autor, ou da
imagem de referência que ele anexa). Deixar aberta uma rota que entrega
justamente esse texto era convite ao defeito, mesmo sem ninguém a chamando
ainda. O comentário completo está em `ponte/servidor.py`, logo acima de
`api_custo`.

**Se um dia isto precisar voltar:** a rota, esta seção do `PROTOCOLO.md`, a
função `bibliaVisual` de `interface/ponte_cliente.js` e a tela que a chama
mudam juntas, no mesmo dia — nunca uma sozinha.

---

## 9. Dinheiro

### `POST /api/custo`

Calcula e **não gera nada**. Pode ser chamado a cada tecla, sem medo.

Envia: `{"pedido": { ... o mesmo objeto de /api/gerar ... }}`

```json
{ "ok": true, "anlas": 10, "tem_estimativa": true,
  "cabe_no_teto": true, "motivo": "",
  "origem_da_tabela": "dados/acervo_regras.js (...)",
  "aviso": "Parte desta conta é estimativa...",
  "itens": [
    { "item": "geração base (1 imagem)", "anlas": 0, "estimativa": false,
      "motivo": "Assinatura Opus gera sem gastar Anlas em V4.5 ou inferior..." },
    { "item": "referência precisa (2 imagens de referência)", "anlas": 10,
      "estimativa": false, "motivo": "FATO do tutorial: +5 Anlas por imagem..." }
  ],
  "orcamento": { "gasto_hoje": 0, "teto_dia": 300, ... } }
```

**Mostre o campo `estimativa` de cada item.** O que é fato do tutorial e o que é
chute nosso não podem parecer a mesma coisa na tela. A fórmula do custo base não
é publicada pelo NovelAI, então ali a Oficina estima e avisa que estima.

#### Três regras desta conta que nasceram de defeito real, e não se negociam

**1. Só é cobrada a imagem de referência que vai ser enviada de verdade.** A
conta olha as **listas** `referencias` e `vibes`, e não a contagem
(`character_reference: 2`). Item sem `dados_base64` não entra. Se a tela mandar
contagem sem as imagens, a conta responde `"faltam_imagens_de_referencia": true`
e um item de 0 Anlas explicando o que fazer.

O defeito que isto conserta: a tela cobrava 5 Anlas por imagem de referência, o
botão dizia "Confirmar e gastar 17 Anlas", e a imagem nunca saía do computador
do autor. Ele pagava por um recurso que não acontecia.

**2. Referência Precisa fora do V4.5 custa 0.** O recurso só existe no V4.5. A
tela já mostra um alerta vermelho dizendo isso; cobrar por ele na linha de baixo
é a Oficina se contradizendo na mesma tela.

**3. No plano Opus a GERAÇÃO é de graça; a REFERÊNCIA não.** Está escrito no
`motivo` do item, e a tela precisa mostrar essa frase. Uma folha de mangá com
oito quadros e a referência do personagem em cada um são 40 Anlas que ele não
espera. A única menção a Opus na tela hoje fica embaixo do título de custo e faz
parecer que no Opus tudo é grátis.

A resposta também traz `assinatura_usada` e `de_onde_veio_a_assinatura` (a tela,
as suas preferências, ou o padrão) — mostre isso, para ele conferir que a
Oficina sabe qual é o plano dele.

### `GET /api/config` · `POST /api/config`

As preferências do autor, gravadas em `meu_trabalho\config.json`. Elas
sobrevivem a fechar e abrir a Oficina, e **não dependem da porta** — que é o
defeito de guardá-las na memória do navegador.

Envia (cada campo é opcional): `{"assinatura": "opus", "tema": "escuro",
"ordem": "estilo_primeiro", "modelo": "v45_full"}`

Responde: `{"ok": true, "config": { ... }, "planos_que_existem": [...]}`

`assinatura` é um de: `nenhuma`, `teste`, `tablet`, `scroll`, `opus`. Plano que
não existe é recusado com frase em português.

**Para o Construtor B:** ponha no Cofre e Gasto um seletor simples — *"Qual é o
seu plano no NovelAI? Nenhum / Teste grátis / Tablet / Scroll / Opus"* — e
guarde a escolha aqui. Sem ela, a Oficina trata todo mundo como quem paga: um
assinante Opus vê "Confirmar e gastar 5 Anlas" numa geração gratuita, e o teto
de 300 Anlas por dia o barra depois de 60 gerações que não custaram nada.

Guardada aqui, a conta a usa mesmo quando o pedido não traz `assinatura`.

### `GET /api/orcamento` · `POST /api/orcamento`

Envia: `{"teto_sessao": 100, "teto_dia": 300}` (cada um é opcional).
Responde o estado do gasto mais `tabela_de_custo`.

Os tetos ficam gravados e sobrevivem a fechar e abrir a Oficina. O gasto da
**sessão** zera quando a Oficina abre; o gasto do **dia** zera na virada do dia.

#### `tabela_de_custo` traz as frases prontas. Use-as; não escreva as suas.

```json
{ "anlas_por_referencia_precisa": 5, "anlas_por_vibe_codificado": 2,
  "anlas_base_estimado": 5, "imagens_do_teste_gratis": 30,
  "_origem": "dados/acervo_regras.js (...)",
  "moeda": "Anlas (os creditos pagos do NovelAI — cada imagem consome um tanto)",
  "notas": [ "...", "..." ] }
```

`moeda` é a explicação da palavra **Anlas**, e ela existe porque o autor é
leigo: "Anlas" aparecia quinze vezes na tela sem uma linha dizendo o que era,
sendo a unidade que controla o dinheiro dele. Escreva essa frase na **primeira**
aparição da palavra em cada tela. As outras duas palavras que precisam do mesmo
tratamento (**ponte** e **token**) vêm em `/api/estado`, no campo `palavras`.

`notas` são cinco frases em português, na ordem em que valem a pena aparecer na
tabela de custos. A segunda é a que evita a conta-surpresa maior desta
ferramenta: **a referência de personagem custa 5 Anlas por imagem também no
plano Opus** — no Opus a geração é de graça, a referência não. Numa página de
mangá de oito quadros com a referência em cada um, são 40 Anlas que ele não
espera. Ponha essa frase na tabela de custos **e** no cartão do plano Opus.

Os números vêm de `dados\acervo_regras.js`, do Construtor A; `_origem` diz de
onde cada um saiu. Preço mudado no acervo chega aqui sozinho.

---

## 10. Gerar

### `POST /api/gerar`

**A única chamada do programa inteiro que gasta dinheiro.** Por isso ela tem
três portas, todas fechadas por padrão, e o pedido precisa passar pelas três:

1. a geração ao vivo tem de estar ligada (`POST /api/modo`);
2. o pedido tem de trazer `executar: true`;
3. `custo_confirmado` tem de bater, no número, com o que a Oficina calculou.

Falhando qualquer uma delas, a resposta é o **ensaio**: a chamada montada e o
custo, sem enviar nada. Isso não é erro — é o comportamento certo, e `ok` vem
`true`.

Envia:

```json
{ "executar": false,
  "custo_confirmado": null,
  "pedido": {
    "acao": "gerar",
    "modelo": "v45_full",
    "prompt": "1girl, close-up, watercolor (medium), best quality",
    "conteudo_indesejado": "lowres, bad anatomy",
    "largura": 832, "altura": 1216, "passos": 28, "escala": 5,
    "quantidade": 1, "semente": null,
    "etiquetas_de_qualidade": true,
    "preset_indesejado": "pesado",
    "personagens": [
      { "prompt": "girl, blue hair", "conteudo_indesejado": "",
        "posicao": "B2" }
    ],
    "imagem_base_base64": null, "forca": 0.7, "ruido": 0.0,
    "mascara_base64": null,
    "referencias": [ { "dados_base64": "...", "forca": 1.0, "fidelidade": 1.0 } ],
    "vibes": [ { "dados_base64": "...", "forca": 0.6, "info_extraida": 1.0 } ],
    "ferramenta_de_direcao": null,
    "assinatura": "opus"
  } }
```

`acao` é uma destas: `gerar`, `img2img`, `inpaint`, `director`, `codificar_vibe`.

#### As imagens vão **dentro** do pedido. A contagem não serve para nada.

Esta é a parte que o Construtor B mais precisa ler, porque foi o defeito mais
caro da rodada anterior. A ponte monta a referência a partir das **listas**
`referencias` e `vibes`, cada item com o `dados_base64` da imagem, e o
Image2Image a partir de `imagem_base_base64`. Mandar
`"character_reference": 2` manda apenas um **número** — e um número não vira
imagem nenhuma no NovelAI.

Enquanto a tela mandar só a contagem:

- a conta **não cobra** por essas referências (item de 0 Anlas, com o motivo);
- a resposta traz `"pode_gerar": false` e a lista `alertas`;
- e a geração é **barrada**, mesmo com token, mesmo com custo confirmado.

A frase que volta em `alertas` já está escrita para o autor ler:
*"Gerar aqui dentro ainda não leva as suas imagens de referência. Use o botão
Copiar prompt e anexe a imagem no site do NovelAI — o resultado é o mesmo, e
nada foi gasto."* Mostre-a como está, em vermelho, junto do botão de gerar.

O campo `imagens_anexadas` da resposta diz o que realmente chegou:
`{"referencias": 2, "vibes": 0, "imagem_de_partida": false, "mascara": false}`.
Use-o para conferir a tela contra a ponte sem adivinhar.

#### `posicao` do personagem: quatro formas aceitas

| o que a tela manda | o que acontece |
|---|---|
| ausente ou `null` | o meio do quadro, e a grade fica **desligada** (o NovelAI escolhe) |
| `"B2"` | a célula da grade 5×5 — coluna de A a E, linha de 1 a 5 |
| `{"x": 0.3, "y": 0.5}` | usado como está |
| `[0.3, 0.5]` | o mesmo, em lista |

Qualquer outra coisa volta como erro **em português dizendo de qual personagem
é**. Antes disto, mandar `"A1"` derrubava o servidor com um 500 e a frase
genérica "aconteceu um erro inesperado" — erro sem pista é o pior tipo de erro
para quem não é técnico.

`use_coords` é ligado **sozinho**, e só quando alguma posição foi mesmo
escolhida. A tela não precisa mandar esse campo.

Hoje a grade 5×5 aparece na Oficina só como desenho, e nenhum controle grava
`posicao`. Ou a grade vira clicável, ou a tela escreve que a posição se escolhe
no site — hoje o autor lê que dá, procura, e não acha.

#### `semente`, e por que ela precisa de um caminho de volta

`semente` em `null` faz a ponte sortear uma. Ela volta na resposta e é gravada
na ficha ao lado da imagem. **Mas a tela nunca a envia de volta**, então
"refazer aquela imagem" — que é a razão de guardá-la — não funciona por dentro
da Oficina. O Álbum precisa de um botão "Refazer esta imagem" que carregue
prompt e semente na Bancada, e a Bancada de um campo de semente com a opção
"sortear".

#### `etiquetas_de_qualidade` e `preset_indesejado`

Os dois são **escolha do autor**, e antes ficavam presos num valor fixo. As
Etiquetas de Qualidade contêm `no text`: ligadas à força, todo quadro de mangá
com fala saía brigando com a própria fala. E o seletor de Conteúdo Indesejado da
tela não mudava nada, incluindo o preset Pesado, que cancela `chromatic
aberration`.

`preset_indesejado` aceita o número ou o identificador do acervo: `nenhum`,
`leve`, `pesado`, `foco`. Identificador desconhecido é **recusado**, e nunca
vira o preset 0 em silêncio. Os números de cada preset estão em
`ponte\endpoints.json`, marcados `"verificado": false` como todo o resto.

##### Mudou em 21/08/2026 (rodada 3), e o Construtor B precisa acompanhar

**1. `preset_indesejado` passou a ser obrigatório** em `gerar`, `img2img` e
`inpaint`. Chegando sem ele, a resposta é o ensaio com `pode_gerar: false` e a
frase pronta em `alertas`. Não há mais queda silenciosa no preset de partida.

Por quê: o valor de partida é 0, que é o **Pesado**. Sem o campo, o autor
escolhia outra coisa na tela, pagava a imagem, e recebia uma imagem filtrada por
uma lista que ele não pediu — sem nada avisando.

**2. O campo `ucPreset` no pedido continua aceito, mas é o nome antigo.** Mande
`preset_indesejado`. Enquanto a tela mandar `ucPreset`, a ponte obedece à
escolha e devolve uma linha em `avisos` — a geração não é barrada. O motivo de
aceitar: `ucPreset` do lado do NovelAI é um **número**, e a tela mandava a
palavra `"leve"` ali dentro; barrar de vez quebraria a geração antes de a tela
trocar o nome.

**3. Dois números de preset estavam trocados, e foram corrigidos.** Agora:

| identificador | número enviado | o que é |
|---|---|---|
| `pesado` | 0 | Heavy |
| `leve` | 1 | Light |
| `foco` | 2 | Human Focus |
| `nenhum` | 3 | None |

Antes disto, `nenhum` mandava 2 e `foco` mandava 3 — ou seja, escolher "Nenhum"
aplicava o filtro de foco humano, e escolher "foco" não aplicava filtro nenhum.

**Estes números continuam sendo estimativa**, e a tela precisa dizer isso onde a
escolha acontece. O manual do NovelAI não os publica. As duas frases prontas
vêm em `GET /api/enderecos`, em `presets_de_conteudo_indesejado`: `aviso_pt`
("Estimativa: o manual do NovelAI não publica o número de cada preset…") e
`conferir_assim_pt`. Ponha a primeira embaixo do seletor.

#### As caixas de personagem em V4 e V4.5: `v4_prompt`

Isto é da ponte, e o Construtor B não precisa mandar nada de novo — mas precisa
saber que existe, porque muda o que o modo ensaio mostra na tela.

Até 21/08/2026 o corpo do pedido levava só `characterPrompts`. Sem a estrutura
`v4_prompt`, **as caixas de personagem não chegavam ao NovelAI**: a Oficina
anunciava o recurso, cobrava 5 Anlas por referência, e mandava o pedido sem o
carregador. Hoje os dois vão juntos, como no próprio cliente do NovelAI:

```json
"v4_prompt": {
  "caption": { "base_caption": "2girls, rooftop",
               "char_captions": [ { "char_caption": "girl, blue hair",
                                    "centers": [ {"x": 0.3, "y": 0.3} ] } ] },
  "use_coords": true, "use_order": true },
"v4_negative_prompt": {
  "caption": { "base_caption": "lowres",
               "char_captions": [ { "char_caption": "hat",
                                    "centers": [ {"x": 0.3, "y": 0.3} ] } ] },
  "legacy_uc": false }
```

A estrutura só é montada quando o modelo é da família **v4** ou **v4.5** — a
família de cada modelo está em `ponte\endpoints.json`, no campo `familia`. Em
modelo V3 ela não vai, e caixa de personagem com modelo V3 volta como linha em
`avisos`, porque V3 não tem esse recurso e as caixas seriam ignoradas em
silêncio.

A **forma** dessa estrutura mora em `endpoints.json`, em
`estrutura_das_caixas_de_personagem`, marcada `"verificado": false` — mesmo
motivo dos endereços: a documentação oficial não a publica.

A resposta traz `familia_do_modelo` (`"v4.5"`, `"v4"`, `"v3"` ou `""`), para a
tela não precisar deduzir.

#### `avisos`: a lista amarela, ao lado de `alertas`

`alertas` é a lista **vermelha**: ela barra a geração (`pode_gerar: false`).
`avisos` é a **amarela**: coisas que o autor precisa ler, e que **não** impedem
de gerar. As duas vêm em toda resposta de `/api/gerar`, inclusive na de sucesso,
e as duas já vêm escritas em português — mostre como estão.

`modelo` aceita as duas grafias — `v45_full` (a do acervo do Construtor A) e
`v4_5_full`. Elas são o mesmo modelo. Modelo que não existe é **recusado com
erro**, e nunca substituído em silêncio pelo padrão.

`semente` em `null` faz a ponte sortear uma. Ela volta na resposta, e é o que
permite refazer a mesma imagem depois.

**Resposta do ensaio** (nada foi enviado, nada foi gasto):

```json
{ "ok": true, "ensaio": true, "gerou": false,
  "motivo": "Ensaio pedido. Nada foi enviado ao NovelAI...",
  "pedido_montado": {
    "metodo": "POST", "url": "https://image.novelai.net/ai/generate-image",
    "cabecalhos": { "Authorization": "Bearer (o seu token — a oficina nunca mostra o valor)" },
    "corpo": { ... },
    "endereco_verificado": false,
    "aviso_do_endereco": "Este endereço não está na documentação oficial..."
  },
  "semente": 1837462901,
  "custo": { ... }, "orcamento": { ... } }
```

Mostre isso na tela como **a fábrica aberta**: é a chamada que a Oficina faria.
As imagens dentro do corpo vêm trocadas por uma linha curta ("imagem de cerca de
340 KB, não mostrada aqui") — sem isso a tela mostraria megabytes de letra
embaralhada.

Quando falta só a confirmação do custo, a resposta traz `precisa_confirmar` com
o número de Anlas. A tela pergunta, e reenvia com `custo_confirmado` igual.

**Resposta de quem gerou de verdade:**

```json
{ "ok": true, "ensaio": false, "gerou": true,
  "anlas_gastos": 10,
  "arquivos": [ { "imagem": "2026-08-21/oficina_134500_01.png",
                  "ficha": "2026-08-21/oficina_134500_01.json",
                  "semente": 1837462901,
                  "endereco": "/api/trabalho/geradas/2026-08-21/oficina_134500_01.png" } ],
  "mensagem": "Pronto. 1 imagem salva em meu_trabalho/geradas.",
  "custo": { ... }, "orcamento": { ... } }
```

Cada imagem é salva com um arquivo `.json` do lado, guardando prompt, semente,
modelo e ajustes. É o que permite refazer a imagem meses depois.

**Uma geração por vez.** É limite real da conta do NovelAI. A segunda chamada
simultânea volta com `ok: false` e a frase "já existe uma geração acontecendo".
A ponte não põe em fila de propósito: a resposta imediata é melhor que a tela
travada.

### `GET /api/enderecos`

Mostra os endereços técnicos que a Oficina usaria, com o aviso de que **nenhum
deles está na documentação oficial do NovelAI**. Eles vivem em
`ponte\endpoints.json` e se consertam ali, sem mexer em programa.

Devolve também duas coisas que a tela precisa e que não são endereço:

- `presets_de_conteudo_indesejado` — o número de cada preset, o nome em
  português de cada um (`nome_pt_por_id`), e as duas frases de estimativa
  (`aviso_pt`, `conferir_assim_pt`). Use `aviso_pt` embaixo do seletor de
  Conteúdo Indesejado: o manual não publica esses números, e a tela não pode
  prometer certeza onde não há.
- `estrutura_das_caixas_de_personagem` — a forma do `v4_prompt`, para a tela de
  recursos poder mostrar a fábrica aberta sem adivinhar.

---

## 11. O que fazer quando a ponte não responde

Se `GET /api/estado` falhar, o Construtor B faz três coisas, nesta ordem:

1. cai no **modo seco** sozinho, sem mostrar erro técnico;
2. acende a lâmpada 🔴 e a faixa amarela fixa, que não pode ser fechada;
3. passa a gravar na memória do navegador, e mostra o botão
   **"Baixar meu trabalho"** ao lado da faixa.

### Mas são DUAS situações, e a mensagem tem de ser diferente em cada uma

A mensagem única de hoje é circular: ela manda o autor abrir o `ABRIR A OFICINA`
— que foi exatamente o que o trouxe até ali. Ele lê e não tem o que fazer.

A página distingue as duas sozinha, **sem precisar de nada da ponte**, olhando o
protocolo do próprio endereço (`location.protocol`):

| situação | como reconhecer | o que dizer |
|---|---|---|
| **Nunca houve ponte** — o `.bat` não achou o Python e abriu o arquivo direto | o endereço começa com `file:` | *"Este computador não tem o Python, e é ele que salva no disco. Enquanto isso, tudo aqui funciona e o botão Copiar prompt é o caminho normal — use o Baixar meu trabalho antes de fechar a aba."* |
| **A ponte caiu no meio** — a janela preta foi fechada | o endereço começa com `http:` e `/api/estado` parou de responder | *"A oficina foi desligada. O que você fez até agora já está salvo no disco. Dê dois cliques no ABRIR A OFICINA de novo."* |

A segunda frase é a única em que "dê dois cliques no atalho de novo" faz
sentido, porque ali o atalho realmente resolve.

**A Oficina degrada, nunca trava.** Montar o prompt, ordenar as tags, ver as
explicações e copiar não dependem da ponte em nada.

---

## 11-A. Os códigos de saída do servidor (contrato com o atalho)

Isto não é para o Construtor B — é para quem for mexer no `ABRIR A OFICINA.bat`
ou no `ponte\servidor.py`. Os dois combinam por número, e trocar num sem trocar
no outro faz a janela preta dar a mensagem errada.

| código | constante em `servidor.py` | o que o `.bat` faz |
|---|---|---|
| 0 | `SAIU_BEM` | fecha a janela sem dizer nada |
| 2 | `SAIU_SEM_PASTA` | mostra "a oficina parou" e **espera uma tecla** |
| 3 | `SAIU_SEM_PORTA` | mostra "a oficina parou" e **espera uma tecla** |
| 7 | `SAIU_PORQUE_JA_ESTAVA_ABERTA` | diz que a Oficina já estava aberta, que **esta** janela pode ser fechada e a outra não, e **espera uma tecla** |

O 7 existe por um motivo específico: sem ele, dar dois cliques no atalho com a
Oficina aberta fazia a janela preta aparecer e sumir no mesmo instante — e
janela que pisca e some é o modo de falhar que não deixa pista nenhuma.

A ordem dos testes no `.bat` vai do maior para o menor, porque
`if errorlevel 7` quer dizer "7 **ou mais**", não "igual a 7".

---

## 12. O que mudou em 21/08/2026, em uma lista

Para o Construtor B conferir de uma olhada o que precisa acompanhar:

- gaveta `personagens` virou **`meus_personagens`** (o nome antigo ainda funciona);
- **`GET`/`POST /api/config`** — as preferências, com o **plano de assinatura**;
- **`POST /api/testar_geracao`** — o botão que gera 1 imagem de prova de verdade;
- `/api/gerar` devolve **`alertas`**, **`pode_gerar`** e **`imagens_anexadas`**, e
  **barra a geração** quando a tela promete imagem que não anexou;
- a conta **não cobra** referência sem imagem, nem Referência Precisa fora do V4.5;
- `etiquetas_de_qualidade` e `preset_indesejado` do pedido chegam à geração;
- `posicao` aceita `"B2"`, lista e dicionário, e liga `use_coords` sozinha;
- `_rascunho_atual.json` ganha **cópia com data** a cada troca;
- `exemplos/_indice.json` nasce no disco;
- `/api/estado` traz **`config`**, **`planos_que_existem`** e **`palavras`**;
- abrir a Oficina com uma já aberta **leva para a que existe**, em vez de subir
  outra numa porta nova, e a janela preta **fica aberta** dizendo isso;
- `tabela_de_custo` traz **`moeda`** e **`notas`** — as frases prontas sobre
  Anlas e sobre a referência que continua custando no plano Opus.

### E o que mudou na rodada 3 do mesmo dia, depois da crítica

- o corpo do pedido em V4 e V4.5 leva **`v4_prompt`** e **`v4_negative_prompt`**;
  sem eles as caixas de personagem não chegavam ao NovelAI;
- **dois números de preset de Conteúdo Indesejado estavam trocados** — hoje
  `foco` é 2 e `nenhum` é 3;
- **`preset_indesejado` virou obrigatório** para gerar; sem ele a geração é
  barrada em vez de cair no Pesado em silêncio. `ucPreset` no pedido ainda é
  aceito, com aviso;
- `/api/gerar` devolve **`avisos`** (a lista amarela, que não barra) e
  **`familia_do_modelo`**;
- `/api/enderecos` devolve **`presets_de_conteudo_indesejado`** e
  **`estrutura_das_caixas_de_personagem`**.

### E o que mudou em 23/08/2026 (três defeitos achados testando a ponte de pé)

Nenhum destes muda o que o Construtor B envia. Os três mudam o que ele **recebe
de volta**, e para melhor.

1. **O prompt do autor não some mais da tela do modo ensaio.** O
   `corpo_para_mostrar` trocava por uma linha curta todo texto acima de 400
   letras — e um prompt de trinta tags passa disso com folga (o de teste, com
   tags comuns, deu 416). Resultado medido: no modo ensaio, que é o padrão e a
   única tela onde ele confere a chamada antes de gastar, o próprio prompt dele
   aparecia como *"(imagem de cerca de 1 KB, não mostrada aqui)"*. Hoje a troca
   é pelo **nome do campo** (`image`, `mask`, `dados_base64`,
   `director_reference_images`, `reference_image_multiple`), mais uma rede de
   segurança para campo desconhecido: texto muito longo **sem espaço, vírgula
   nem quebra de linha** é base64, e prompt sempre tem os três. Consequência
   para B: pode mostrar `corpo_para_mostrar` inteiro na tela sem medo — o que
   for imagem já vem trocado, e só isso.
2. **Caixinha de número apagada não derruba mais a geração.** `passos: null`,
   `largura: ""` e `escala: null` devolviam 500 com *"Aconteceu um erro
   inesperado dentro da oficina"*. Hoje campo em branco vale como "use o valor
   de partida", número escrito como texto (`"23"`, `"5.5"`) é aceito, e texto
   que não é número volta em 400 com uma frase que **nomeia o campo da tela**:
   *"O campo 'largura' precisa de um numero, e chegou 'grande'."*
3. **Pedido malformado volta em 400, não em 500.** `{"pedido": "texto solto"}`
   em `/api/gerar` e em `/api/custo` agora responde com frase em português.

### E o que mudou na 2ª rodada de 23/08/2026 (quatro silêncios que custavam dinheiro)

Como os três de cima, **nenhum destes muda o que o Construtor B envia.** Os
quatro mudam o que ele **recebe**, e todos são da mesma família: a ponte fazia
a coisa certa e **não dizia**. Some em silêncio é o pior modo de falhar — não
deixa pista, e aqui a pista custa Anlas.

1. **O sétimo personagem não some mais calado.** O teto de 6 é do NovelAI, e o
   corte estava certo; mandar 7 caixas devolvia 6 **sem uma palavra**. O autor
   montava o quadro, conferia o modo ensaio, não via aviso, pagava — e recebia
   seis. Hoje sai um **aviso amarelo** dizendo quantas ficaram de fora. A
   geração continua liberada: é aviso, não veto.

2. **A Referência Precisa fora do V4.5 parou de contradizer a própria conta.**
   Este era o pior dos quatro, porque a Oficina dizia **as duas coisas na mesma
   rodada**: a tela de custo escrevia *"não cobrei nada por isto — ela não vai
   acontecer nesta geração"*, e o corpo do pedido saía levando a referência
   assim mesmo. Hoje a ponte concorda com a conta: **não manda** os campos de
   referência quando o modelo não é V4.5, e explica em português. Consequência
   para B: `imagens_anexadas` ganhou **`referencias_recebidas`** ao lado de
   `referencias` — o primeiro é o que a tela anexou, o segundo é o que vai ser
   enviado. Diferentes só quando a ponte deixou de mandar alguma, e nesse caso
   o motivo está em `avisos`. A lista de famílias que aceitam a Referência
   Precisa mora em `endpoints.json`, em
   **`estrutura_das_caixas_de_personagem.familias_com_referencia_precisa`** — se
   o NovelAI mudar isso um dia, o conserto é editar o texto, sem tocar em
   programa.

3. **Duas referências de personagem agora avisam que se misturam.** É limite
   oficial do NovelAI, e o mal-entendido é caro e comum: o autor anexa duas
   achando que vai receber os dois personagens na mesma imagem, e o que sai é
   **um personagem só**, com as duas caras somadas — tendo pago 5 Anlas por
   cada referência. Aviso amarelo, não veto: misturar pode ser exatamente o que
   ele quer.

4. **O teto de gasto aparece já no ensaio.** O ensaio dizia `pode_gerar: true`
   e mostrava o custo mesmo quando o teto ia barrar a geração logo depois — o
   autor só descobria depois de ligar a geração ao vivo e confirmar o valor. O
   modo ensaio é a **única tela onde ele confere antes de gastar**; calar o teto
   ali tirava dela a serventia. Hoje a resposta traz **`cabe_no_teto`**
   (verdadeiro/falso) e, quando é falso, a frase do teto entra em `avisos`.
   **Isto não substitui a trava:** a recusa de verdade continua acontecendo
   imediatamente antes do envio. O ensaio só deixou de esconder o que ela vai
   fazer.

**Resumo para B, em uma linha:** leia `avisos` (amarelo, não barra),
`alertas` (vermelho, barra), `pode_gerar` e agora `cabe_no_teto`. Um pedido
pode ter `pode_gerar: true` e `cabe_no_teto: false` ao mesmo tempo — o pedido
está certo, o dinheiro é que não dá.

### E um quinto, que é sobre o trabalho dele, não sobre dinheiro

**Cópia igual à anterior não ocupa mais uma das doze vagas.**

O defeito foi medido no disco do autor, não deduzido: as onze cópias de
`_rascunho_atual.json` guardavam **oito estados diferentes** — três eram o
mesmo arquivo byte a byte — e as cópias do trabalho da tarde já tinham sido
descartadas para dar lugar a elas.

A causa é a gravação automática da tela. Ela grava de tempos em tempos mesmo
quando o autor não mexeu em nada, e cada gravação dessas guardava mais uma
cópia idêntica, empurrando para fora uma cópia **velha e diferente**. Ou seja:
deixar a Oficina aberta e parada apagava sozinho aquilo que essa rede existe
para salvar — as 14 tags do caso real.

Hoje a ponte só guarda cópia quando o conteúdo **mudou** em relação à cópia
mais nova que já está no disco. As doze vagas passam a guardar doze estados
diferentes, que é o que serve para voltar atrás.

**O que muda para B:** nada no que ele envia, e uma coisa no que ele recebe —
`copia_do_anterior` pode agora repetir o nome de uma cópia que já existia, em
vez de trazer um nome novo a cada gravação. Isso é o comportamento certo e
significa "o que você tinha já está guardado ali". **Não é erro, e a tela não
deve tratar como erro.**

Isto **não** dispensa a regra da tela: continua valendo que ela **não grava
antes de a leitura do disco responder**. A cópia é a rede embaixo, não o
substituto da regra.
