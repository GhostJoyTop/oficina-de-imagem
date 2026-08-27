# -*- coding: utf-8 -*-
"""
A CONVERSA COM O NOVELAI.

Este arquivo monta a chamada, envia, entende a resposta e traduz todo erro para
uma frase em portugues que diz o que fazer.

Tres coisas que voce precisa saber antes de ler o resto:

1. O PADRAO E O MODO ENSAIO. Nada e enviado ao NovelAI a nao ser que o autor
   ligue a geracao ao vivo de proposito e confirme o custo. No modo ensaio a
   oficina MOSTRA a chamada que faria — endereco, cabecalhos, corpo — e quanto
   custaria. E a fabrica aberta antes de gastar dinheiro.

2. OS ENDERECOS SAO DADO, NAO PROGRAMA. Todos vem de endpoints.json, e todos
   estao marcados como nao verificados, porque a documentacao oficial do
   NovelAI nao os publica (tutorial, secao 19.8). Se quebrarem, conserta-se um
   arquivo de texto.

3. O TOKEN NAO PASSA POR AQUI DE VOLTA. Ele e lido do cofre no instante de
   montar o cabecalho, usado, e descartado. Nenhuma funcao deste arquivo
   devolve o token, e nenhuma o imprime.

So usa o que ja vem no Python: urllib, json, zipfile, base64. Nada de instalar.
"""

from __future__ import annotations

import base64
import json
import random
import socket
import urllib.error
import urllib.request
import zipfile
from datetime import datetime
from io import BytesIO
from pathlib import Path

import cofre

PASTA_DA_PONTE = Path(__file__).resolve().parent
ARQUIVO_DE_ENDERECOS = PASTA_DA_PONTE / "endpoints.json"

TOKEN_ESCONDIDO = "Bearer (o seu token — a oficina nunca mostra o valor)"


class ErroDaPonte(Exception):
    """Erro ja escrito em portugues, pronto para aparecer na tela do autor."""


# ---------------------------------------------------------------------------
# Os enderecos, que sao dado
# ---------------------------------------------------------------------------

_cache_de_enderecos = None


def enderecos(recarregar: bool = False) -> dict:
    global _cache_de_enderecos
    if _cache_de_enderecos is not None and not recarregar:
        return _cache_de_enderecos
    try:
        _cache_de_enderecos = json.loads(
            ARQUIVO_DE_ENDERECOS.read_text(encoding="utf-8")
        )
    except OSError as erro:
        raise ErroDaPonte(
            "Não encontrei o arquivo de endereços do NovelAI em {}. "
            "A oficina continua funcionando para montar e copiar prompt; só a "
            "geracao aqui dentro precisa desse arquivo.".format(ARQUIVO_DE_ENDERECOS)
        ) from erro
    except ValueError as erro:
        raise ErroDaPonte(
            "O arquivo de endereços {} esta com erro de digitação e o programa "
            "não conseguiu ler. Se você editou esse arquivo, desfaça a última "
            "mudanca.".format(ARQUIVO_DE_ENDERECOS.name)
        ) from erro
    return _cache_de_enderecos


def rota(nome: str) -> dict:
    dados = enderecos()
    caminho = (dados.get("rotas") or {}).get(nome)
    if not caminho:
        raise ErroDaPonte(
            "A oficina não conhece a ação '{}'. As ações conhecidas são: {}.".format(
                nome, ", ".join(sorted((dados.get("rotas") or {}).keys()))
            )
        )
    base = (dados.get("bases") or {}).get(caminho.get("base", "imagem")) or {}
    url = "{}{}".format(base.get("url", "").rstrip("/"), caminho.get("caminho", ""))
    return {
        "nome": nome,
        "metodo": caminho.get("metodo", "POST"),
        "url": url,
        "acao_no_corpo": caminho.get("acao_no_corpo"),
        "resposta": caminho.get("resposta", "zip"),
        "descricao_pt": caminho.get("descricao_pt", ""),
        "verificado": bool(caminho.get("verificado", False)),
    }


def achatar_nome_de_modelo(chave: str) -> str:
    """
    Reduz o nome de um modelo a uma forma unica, para os dois lados se
    entenderem.

    Existe por um motivo concreto: o Construtor A escreve o identificador do
    modelo como "v45_full" e este arquivo o escrevia como "v4_5_full". Sao a
    mesma coisa com duas grafias. Sem isto, a oficina recebia "v45_curated" e
    entregava silenciosamente o V4.5 FULL — outro modelo, gerado e pago sem
    ninguem perceber a troca.

    A regra e so tirar pontuacao e baixar a caixa: "v4_5_full" e "v45_full"
    viram os dois "v45full". Nao existe tabela para envelhecer.
    """
    return "".join(c for c in str(chave or "").lower() if c.isalnum())


def nome_do_modelo(chave: str) -> str:
    """
    Traduz o identificador do modelo para o nome que o NovelAI entende.

    Modelo desconhecido levanta erro em portugues, e NAO cai no modelo padrao.
    Trocar de modelo em silencio e o pior desfecho possivel: o autor pediu um,
    pagou, e recebeu outro sem aviso nenhum.
    """
    modelos = enderecos().get("modelos") or {}
    procurado = achatar_nome_de_modelo(chave)

    for identificador, dados in modelos.items():
        # As linhas que comecam com "_" sao anotacoes para quem le o arquivo,
        # nao modelos. Sem esta linha, "_nota" seria tratado como um modelo.
        if identificador.startswith("_") or not isinstance(dados, dict):
            continue
        if achatar_nome_de_modelo(identificador) == procurado:
            return dados.get("nome_na_api", "nai-diffusion-4-5-full")

    raise ErroDaPonte(
        "A oficina não conhece o modelo '{}'. Os modelos que existem são: {}. "
        "Escolha um deles na tela.".format(
            chave,
            ", ".join(
                "{} ({})".format(d.get("nome_pt", i), i)
                for i, d in sorted(modelos.items())
                if not i.startswith("_")
            ),
        )
    )


def familia_do_modelo(chave: str) -> str:
    """
    Diz de que geracao o modelo e: "v4.5", "v4" ou "v3".

    Serve para uma coisa so, e ela e cara: os modelos V4 e V4.5 recebem as
    caixas de personagem numa estrutura propria (ver montar_caixas_v4). Sem
    saber a familia, o pedido sairia com essa estrutura tambem para os modelos
    V3, que nao a conhecem.

    Modelo sem familia declarada em endpoints.json responde "" — e ai a
    estrutura nao e montada, que e o lado seguro do erro.
    """
    modelos = enderecos().get("modelos") or {}
    procurado = achatar_nome_de_modelo(chave)
    for identificador, dados in modelos.items():
        if identificador.startswith("_") or not isinstance(dados, dict):
            continue
        if achatar_nome_de_modelo(identificador) == procurado:
            return str(dados.get("familia", "") or "")
    return ""


# ---------------------------------------------------------------------------
# Montar o pedido (isto roda SEMPRE, inclusive no modo ensaio)
# ---------------------------------------------------------------------------

NOMES_NA_TELA = {
    "largura": "largura", "altura": "altura", "passos": "passos",
    "escala": "força do prompt (escala)", "quantidade": "quantas imagens",
    "semente": "semente", "forca": "Forca", "ruido": "Ruido",
    "fidelidade": "Fidelidade", "info_extraida": "informacao extraida",
    "forca_da_emocao": "forca da emocao",
}


def _numero(pedido: dict, campo: str, padrao, inteiro: bool = True):
    """
    Le um numero que veio da tela sem derrubar a oficina.

    Campo em branco vale como "use o valor de partida" — apagar o conteudo de
    uma caixinha de numero e a coisa mais natural do mundo, e antes de
    23/08/2026 isso devolvia "Aconteceu um erro inesperado dentro da oficina",
    que nao diz nada e nao ensina nada. Texto que nao e numero vira uma frase
    em portugues que nomeia o campo.
    """
    valor = pedido.get(campo, padrao)
    if valor is None or (isinstance(valor, str) and not valor.strip()):
        valor = padrao
    if isinstance(valor, bool):
        valor = padrao
    try:
        numero = float(valor)
    except (TypeError, ValueError):
        raise ErroDaPonte(
            "O campo '{}' precisa de um número, e chegou '{}'. Corrija esse "
            "campo na tela e tente de novo. Nada foi enviado e nada foi "
            "gasto.".format(NOMES_NA_TELA.get(campo, campo), valor)
        ) from None
    if numero != numero or numero in (float("inf"), float("-inf")):
        raise ErroDaPonte(
            "O campo '{}' chegou com um número que não existe. Corrija esse "
            "campo na tela.".format(NOMES_NA_TELA.get(campo, campo))
        )
    return int(numero) if inteiro else numero


def _tamanho_legivel(texto_base64: str) -> str:
    if not texto_base64:
        return "(nenhuma)"
    kb = int(len(texto_base64) * 3 / 4 / 1024)
    return "(imagem de cerca de {} KB, não mostrada aqui)".format(max(kb, 1))


# Os campos do corpo que carregam IMAGEM, e so eles. A troca por uma linha
# curta acontece pelo NOME do campo, nunca pelo tamanho do texto.
CAMPOS_DE_IMAGEM = frozenset({
    "image",
    "mask",
    "dados_base64",
    "reference_image",
    "director_reference_images",
    "reference_image_multiple",
})


def _parece_base64_de_imagem(texto: str) -> bool:
    """
    Uma rede de seguranca para campo de imagem que a oficina ainda nao conhece.

    Imagem em base64 e uma tira longa e sem respiro: nao tem espaco, nem
    virgula, nem quebra de linha. Um prompt tem os tres. Por isso a pergunta e
    feita assim, e nao pelo tamanho.
    """
    if len(texto) <= 400:
        return False
    return not any(c in texto for c in " ,\n\t")


def _limpar_para_a_tela(corpo: dict) -> dict:
    """
    Uma copia do corpo com as IMAGENS trocadas por uma descricao curta.

    Sem isso, a tela do modo ensaio mostraria megabytes de letra embaralhada e o
    autor nao veria nada do que importa.

    A TROCA E PELO NOME DO CAMPO, e isso e o conserto de 23/08/2026.
    Ate esta data ela era pelo TAMANHO: todo texto acima de 400 letras virava
    "(imagem de cerca de 1 KB, nao mostrada aqui)". So que um prompt de trinta
    tags passa de 400 letras com folga — o de teste, com tags comuns de cabelo,
    roupa, enquadramento e qualidade, deu 416. Resultado medido: no modo ensaio,
    que e o modo PADRAO e a unica tela onde o autor confere a chamada antes de
    gastar, o proprio prompt dele sumia e era anunciado como se fosse uma
    imagem. A tela que existe para mostrar a fabrica aberta escondia a peca
    principal, e ainda mentia sobre o que ela era.
    """
    def limpar(valor, chave: str = ""):
        if isinstance(valor, dict):
            return {c: limpar(v, c) for c, v in valor.items()}
        if isinstance(valor, list):
            # A lista herda o nome do campo dela: em
            # "director_reference_images" cada item e uma imagem.
            return [limpar(v, chave) for v in valor]
        if isinstance(valor, str) and valor:
            if chave in CAMPOS_DE_IMAGEM or _parece_base64_de_imagem(valor):
                return _tamanho_legivel(valor)
        return valor

    return limpar(corpo)


GRADE_COLUNAS = "ABCDE"


def centro_do_personagem(valor, numero: int) -> tuple[dict, bool]:
    """
    Traduz a posicao de um personagem para o par de coordenadas do NovelAI.

    Aceita quatro formas, porque a tela pode mandar qualquer uma delas:
      - nada (None)          -> o meio do quadro, e a posicao NAO conta como
                                escolhida (o NovelAI decide sozinho);
      - {"x": 0.3, "y": 0.5} -> usado como esta;
      - [0.3, 0.5]           -> mesma coisa, em lista;
      - "B2"                 -> a celula da grade 5x5 que a tela desenha, com
                                coluna de A a E e linha de 1 a 5.

    Devolve (centro, foi_escolhida).

    Por que existe: ate 21/08/2026 este trecho era
    `(p.get("posicao") or {}).get("x", 0.5)`, que so aceitava dicionario.
    Mandar "A1" — a forma que a grade da tela usa para falar de posicao —
    derrubava o servidor com um erro 500 e a frase generica "aconteceu um erro
    inesperado". Erro sem explicacao e o pior tipo de erro para quem nao e
    tecnico: nao da nem para tentar de outro jeito.
    """
    if valor is None or valor == "":
        return {"x": 0.5, "y": 0.5}, False

    if isinstance(valor, dict):
        try:
            return {"x": float(valor.get("x", 0.5)), "y": float(valor.get("y", 0.5))}, True
        except (TypeError, ValueError):
            raise ErroDaPonte(
                "A posição do personagem {} chegou num formato que eu não "
                "entendi. Use a grade de posição na tela, ou deixe em branco "
                "para o NovelAI escolher.".format(numero)
            ) from None

    if isinstance(valor, (list, tuple)) and len(valor) == 2:
        try:
            return {"x": float(valor[0]), "y": float(valor[1])}, True
        except (TypeError, ValueError):
            raise ErroDaPonte(
                "A posição do personagem {} chegou como uma lista de duas "
                "coisas que não são números.".format(numero)
            ) from None

    if isinstance(valor, str):
        texto = valor.strip().upper()
        if len(texto) == 2 and texto[0] in GRADE_COLUNAS and texto[1] in "12345":
            coluna = GRADE_COLUNAS.index(texto[0])
            linha = int(texto[1]) - 1
            return {"x": (coluna + 0.5) / 5.0, "y": (linha + 0.5) / 5.0}, True
        raise ErroDaPonte(
            "Não entendi a posição '{}' do personagem {}. Na grade de posição, "
            "a coluna vai de A a E e a linha de 1 a 5 — por exemplo B2. Deixe "
            "em branco se quiser que o NovelAI escolha.".format(valor, numero)
        )

    raise ErroDaPonte(
        "A posição do personagem {} chegou num formato que eu não entendi. "
        "Use a grade de posição na tela, ou deixe em branco.".format(numero)
    )


def numero_do_preset(valor) -> int:
    """
    Traduz o preset de Conteudo Indesejado escolhido na tela para o numero que o
    NovelAI usa.

    Aceita o numero pronto ou o identificador do acervo ("nenhum", "leve",
    "pesado", "foco"). Identificador desconhecido e RECUSADO com a lista dos que
    existem — nunca vira o preset 0 em silencio. Trocar o preset sem avisar muda
    o que a imagem evita desenhar, e o autor paga por ela.
    """
    if isinstance(valor, bool):
        raise ErroDaPonte("O preset de Conteúdo Indesejado chegou como sim/nao.")
    if isinstance(valor, (int, float)):
        return int(valor)

    tabela = (enderecos().get("presets_de_conteudo_indesejado") or {}).get("por_id") or {}
    chave = str(valor or "").strip().lower()
    if chave in tabela:
        return int(tabela[chave])
    raise ErroDaPonte(
        "Não conheco o preset de Conteúdo Indesejado '{}'. Os que existem são: "
        "{}.".format(valor, ", ".join(sorted(tabela.keys())) or "nenhum cadastrado")
    )


def _so_com_imagem(lista) -> list:
    """Fica so com os itens que trazem imagem de verdade."""
    limpos = []
    for item in (lista or []):
        if isinstance(item, dict) and str(item.get("dados_base64") or "").strip():
            limpos.append(item)
    return limpos


def _conferir_imagens_prometidas(pedido: dict, acao: str, referencias: list,
                                 vibes: list) -> list[str]:
    """
    Compara o que a tela DISSE que ia anexar com o que ela REALMENTE anexou.

    Esta funcao existe por causa de um defeito caro: a tela mandava a CONTAGEM
    das imagens de referencia ("character_reference: 2") e o custo cobrava 5
    Anlas por cada uma, mas as imagens nunca vinham no pedido. O autor confirmava
    o gasto de uma referencia que nao saia do computador dele, e recebia uma
    imagem gerada sem referencia nenhuma.

    A ponte nao conserta isso sozinha — quem anexa a imagem e a tela. O que ela
    faz e recusar-se a fingir: devolve a frase em portugues, o custo nao cobra o
    que nao vai ser enviado, e a geracao e barrada antes de gastar.
    """
    avisos = []

    prometidas = (
        int(pedido.get("character_reference", 0) or 0)
        + int(pedido.get("style_reference", 0) or 0)
    )
    if prometidas > len(referencias):
        avisos.append(
            "Você anexou {} imagem(ns) de referência de personagem ou de estilo, "
            "e elas não chegaram até aqui. Gerar aqui dentro ainda não leva as "
            "suas imagens de referência. Use o botao Copiar prompt e anexe a "
            "imagem no site do NovelAI — o resultado e o mesmo, e nada foi "
            "gasto.".format(prometidas)
        )

    vibes_prometidos = int(pedido.get("vibe_novos", 0) or 0)
    if vibes_prometidos > len(vibes):
        avisos.append(
            "Você anexou {} imagem(ns) para o Vibe Transfer, e elas não chegaram "
            "até aqui. Use o botao Copiar prompt e anexe no site do NovelAI. "
            "Nada foi gasto.".format(vibes_prometidos)
        )

    precisam_de_imagem = {
        "img2img": "partir de uma imagem",
        "inpaint": "corrigir um pedaco da imagem",
        "director": "usar uma ferramenta de direção",
        "codificar_vibe": "codificar a imagem para o Vibe Transfer",
    }
    if acao in precisam_de_imagem and not str(pedido.get("imagem_base_base64") or "").strip():
        avisos.append(
            "Para {} a oficina precisa da imagem de partida, e ela não chegou "
            "no pedido. Nada foi enviado e nada foi gasto.".format(
                precisam_de_imagem[acao]
            )
        )

    if acao == "inpaint" and not str(pedido.get("mascara_base64") or "").strip():
        avisos.append(
            "O Inpaint precisa da mascara — o desenho da parte que você quer "
            "refazer — e ela não chegou no pedido. Nada foi gasto."
        )

    return avisos


def montar_pedido(pedido: dict) -> dict:
    """
    Transforma o que a tela mandou na chamada que o NovelAI receberia.

    Devolve um dicionario com endereco, cabecalhos (com o token ESCONDIDO),
    corpo completo, corpo limpo para mostrar, e a lista de ALERTAS — o que a
    tela prometeu anexar e nao anexou. Nada e enviado aqui.
    """
    pedido = pedido or {}
    acao = str(pedido.get("acao", "gerar"))
    a_rota = rota(acao)
    padrao = dict(enderecos().get("parametros_padrao") or {})
    padrao.pop("_nota", None)
    padrao.pop("verificado", None)

    modelo_chave = str(pedido.get("modelo", "v4_5_full"))
    semente = pedido.get("semente")
    if semente in (None, "", 0):
        semente = random.randint(1, 2**32 - 1)
    else:
        semente = _numero(pedido, "semente", 0)

    parametros = dict(padrao)
    parametros.update({
        "width": _numero(pedido, "largura", padrao.get("width", 832)),
        "height": _numero(pedido, "altura", padrao.get("height", 1216)),
        "steps": _numero(pedido, "passos", padrao.get("steps", 28)),
        "scale": _numero(pedido, "escala", padrao.get("scale", 5), inteiro=False),
        "n_samples": _numero(pedido, "quantidade", 1),
        "seed": semente,
        "negative_prompt": str(pedido.get("conteudo_indesejado", "") or ""),
    })

    # As duas escolhas da tela que antes eram ignoradas.
    #
    # Ate 21/08/2026 "qualityToggle" e "ucPreset" ficavam presos no valor de
    # partida de endpoints.json. Consequencia real: as Etiquetas de Qualidade
    # ficavam SEMPRE ligadas, e elas contem "no text" — entao todo quadro de
    # mangá com fala saia brigando com a propria fala. E o seletor de Conteudo
    # Indesejado da tela nao mudava nada, incluindo o preset Pesado, que cancela
    # o efeito "chromatic aberration".
    if pedido.get("etiquetas_de_qualidade") is not None:
        parametros["qualityToggle"] = bool(pedido.get("etiquetas_de_qualidade"))

    # O preset de Conteudo Indesejado nunca mais cai no valor de partida em
    # silencio (achado do critico em 21/08/2026).
    #
    # O que acontecia: sem o campo, o pedido saia com o preset de partida, que e
    # 0 — o PESADO. O autor escolhia outra coisa na tela, pagava a imagem, e
    # recebia uma imagem filtrada por uma lista que ele nao pediu. Nada avisava.
    #
    # Agora sao tres caminhos, e nenhum deles e mudo:
    #   1. veio "preset_indesejado" — o vocabulario combinado no PROTOCOLO;
    #   2. veio so "ucPreset" — o nome antigo da tela. E aceito, para a geracao
    #      nao morrer enquanto a tela nao troca o nome, mas sai um AVISO;
    #   3. nao veio nenhum dos dois — a geracao e BARRADA com frase em portugues.
    avisos: list[str] = []
    alertas_do_preset: list[str] = []

    escolha_do_preset = pedido.get("preset_indesejado")
    if escolha_do_preset is None and pedido.get("ucPreset") is not None:
        escolha_do_preset = pedido.get("ucPreset")
        avisos.append(
            "A tela mandou o preset de Conteúdo Indesejado no campo antigo. A "
            "oficina obedeceu a sua escolha, e nada muda para você — e um nome "
            "de campo a acertar entre as pecas do programa."
        )

    if escolha_do_preset is not None:
        parametros["ucPreset"] = numero_do_preset(escolha_do_preset)
    elif acao in ("gerar", "img2img", "inpaint"):
        parametros.pop("ucPreset", None)
        alertas_do_preset.append(
            "A oficina não recebeu qual preset de Conteúdo Indesejado você "
            "escolheu, e não vai adivinhar: adivinhar aqui muda o que a imagem "
            "evita desenhar, e você paga por ela. Escolha um preset na tela "
            "(Nenhum, Leve, Pesado ou Foco humano) e tente de novo. Nada foi "
            "enviado e nada foi gasto."
        )

    # Personagens (V4+). A contagem (1girl, 2girls) fica so no prompt base; aqui
    # dentro vai "girl" ou "boy", sem numero. Quem garante isso e a tela.
    personagens = pedido.get("personagens") or []
    caixas: list[dict] = []
    alguma_posicao_escolhida = False

    # O teto de 6 personagens e do proprio NovelAI. O que a oficina NAO pode
    # fazer e cortar o setimo calado (achado testando a ponte de pe, 23/08/2026).
    #
    # O que acontecia: mandar 7 caixas devolvia 6, sem uma palavra. O autor
    # montava o quadro com sete personagens, conferia o modo ensaio, nao via
    # aviso nenhum, pagava a imagem — e recebia seis. O corte estava certo; o
    # silencio e que estava errado. Some em silencio e o pior modo de falhar:
    # nao deixa pista.
    TETO_DE_PERSONAGENS = 6
    if len(personagens) > TETO_DE_PERSONAGENS:
        sobraram = len(personagens) - TETO_DE_PERSONAGENS
        avisos.append(
            "Você montou {} personagens, e o NovelAI aceita no máximo {} por "
            "imagem. Vou gerar com os {} primeiros, e {} caixa(s) de personagem "
            "vai(vão) ficar de fora desta imagem. Se os que sobraram importam, "
            "tire algum dos primeiros ou faca uma segunda imagem.".format(
                len(personagens), TETO_DE_PERSONAGENS, TETO_DE_PERSONAGENS, sobraram
            )
        )

    if personagens:
        for numero, p in enumerate(personagens[:TETO_DE_PERSONAGENS], start=1):
            if not isinstance(p, dict):
                raise ErroDaPonte(
                    "A caixa do personagem {} chegou num formato que eu não "
                    "entendi.".format(numero)
                )
            centro, escolhida = centro_do_personagem(p.get("posicao"), numero)
            alguma_posicao_escolhida = alguma_posicao_escolhida or escolhida
            caixas.append({
                "prompt": str(p.get("prompt", "") or ""),
                "uc": str(p.get("conteudo_indesejado", "") or ""),
                "center": centro,
            })
        parametros["characterPrompts"] = caixas
        # So liga a grade quando o autor escolheu alguma posicao de verdade.
        # Ligada sem escolha, ela empilharia todo mundo no meio do quadro.
        parametros["use_coords"] = bool(alguma_posicao_escolhida)

    # A estrutura onde os modelos V4 e V4.5 recebem de fato as caixas de
    # personagem (achado do critico em 21/08/2026).
    #
    # O defeito: o pedido levava so "characterPrompts", e sem "v4_prompt" as
    # caixas nao chegavam ao NovelAI. A oficina anunciava o recurso de varios
    # personagens, cobrava 5 Anlas por referencia, e mandava o pedido sem o
    # carregador. Os dois campos vao juntos, como no proprio cliente do NovelAI.
    #
    # A FORMA desta estrutura mora em endpoints.json, marcada como nao
    # verificada, pelo mesmo motivo dos enderecos: a documentacao oficial nao a
    # publica. Se mudar, conserta-se ali.
    familia = familia_do_modelo(modelo_chave)
    forma = enderecos().get("estrutura_das_caixas_de_personagem") or {}
    familias_com_caixas = forma.get("usar_nas_familias") or ["v4", "v4.5"]
    if familia in familias_com_caixas:
        campo = forma.get("nome_do_campo", "v4_prompt")
        campo_negativo = forma.get("nome_do_campo_negativo", "v4_negative_prompt")
        parametros[campo] = {
            "caption": {
                "base_caption": str(pedido.get("prompt", "") or ""),
                "char_captions": [
                    {"char_caption": c["prompt"], "centers": [c["center"]]}
                    for c in caixas
                ],
            },
            "use_coords": bool(alguma_posicao_escolhida),
            "use_order": bool(forma.get("use_order", True)),
        }
        parametros[campo_negativo] = {
            "caption": {
                "base_caption": str(pedido.get("conteudo_indesejado", "") or ""),
                "char_captions": [
                    {"char_caption": c["uc"], "centers": [c["center"]]}
                    for c in caixas
                ],
            },
            "legacy_uc": bool(forma.get("legacy_uc", False)),
        }
    elif caixas:
        avisos.append(
            "O modelo escolhido não e da família V4, e só V4 e V4.5 aceitam "
            "caixas de personagem separadas. As caixas não vão ter efeito nesta "
            "geracao. Troque para um modelo V4 ou V4.5, ou escreva tudo no "
            "prompt principal."
        )

    # Partir de uma imagem.
    if pedido.get("imagem_base_base64"):
        parametros["image"] = pedido["imagem_base_base64"]
        parametros["strength"] = _numero(pedido, "forca", 0.7, inteiro=False)
        parametros["noise"] = _numero(pedido, "ruido", 0.0, inteiro=False)

    # Corrigir so um pedaco.
    if pedido.get("mascara_base64"):
        parametros["mask"] = pedido["mascara_base64"]

    # Referencia precisa (personagem e estilo). So V4.5, e nao convive com Vibe.
    #
    # So entra na conta o que traz imagem de verdade. Item sem "dados_base64" e
    # promessa vazia: ele viraria uma referencia em branco no corpo do pedido.
    referencias = _so_com_imagem(pedido.get("referencias"))
    vibes = _so_com_imagem(pedido.get("vibes"))

    # Quantas referencias CHEGARAM de verdade no pedido. Guardado aqui, antes de
    # qualquer corte da oficina, porque quem confere promessa (a funcao
    # _conferir_imagens_prometidas) precisa saber o que a TELA anexou, nao o que
    # a ponte decidiu mandar. Sem esta linha, deixar de mandar uma referencia por
    # incompatibilidade de modelo viraria o alerta vermelho "as suas imagens nao
    # chegaram ate aqui" — um alarme falso, criado pela propria oficina, que
    # ainda por cima barraria a geracao.
    referencias_que_chegaram = list(referencias)

    if referencias and vibes:
        raise ErroDaPonte(
            "Referência Precisa e Vibe Transfer não funcionam na mesma geracao. "
            "Escolha um dos dois e tente de novo."
        )

    # A Referencia Precisa so existe no V4.5 — e as duas telas da oficina
    # precisam dizer a MESMA coisa (achado testando a ponte de pe, 23/08/2026).
    #
    # O defeito era uma contradicao dentro da propria oficina, na mesma rodada:
    # anexar uma referencia num modelo V3 fazia a tela de custo escrever "nao
    # cobrei nada por isto: a Referencia Precisa so existe no V4.5, ela nao vai
    # acontecer nesta geracao" — enquanto o corpo do pedido saia levando a
    # referencia assim mesmo, sem um aviso sequer. Uma tela dizia que nao ia
    # acontecer, a outra mandava. O autor pagava a geracao e recebia uma imagem
    # sem a referencia dele, com a oficina tendo dito as duas coisas.
    #
    # Hoje a ponte concorda com a propria conta: avisa em portugues e NAO manda
    # os campos que o modelo escolhido nao conhece. Se um dia o NovelAI levar a
    # Referencia Precisa para outros modelos, o conserto e uma linha: acrescentar
    # a familia em "familias_com_referencia_precisa" no endpoints.json.
    forma_ref = enderecos().get("estrutura_das_caixas_de_personagem") or {}
    familias_com_referencia = (
        forma_ref.get("familias_com_referencia_precisa") or ["v4.5"]
    )
    if referencias and familia not in familias_com_referencia:
        avisos.append(
            "Você anexou {} imagem(ns) de Referência Precisa, mas ela só existe "
            "no modelo V4.5, e você escolheu outro. Não vou mandar a referência "
            "nesta geracao — ela seria ignorada e você pagaria a imagem do mesmo "
            "jeito. Troque o modelo para V4.5 se quiser usar a referência.".format(
                len(referencias)
            )
        )
        referencias = []

    # Duas referencias de personagem se misturam num personagem so.
    #
    # ATENCAO AO CARIMBO DESTA REGRA (corrigido em 23/08/2026). Ate a rodada
    # anterior, esta mensagem dizia "isto e limite oficial do NovelAI" — e nao
    # e. O manual nao trata do assunto: procurando "mistur" no texto inteiro,
    # as duas unicas ocorrencias sao do Remove BG. O que o manual diz sobre duas
    # referencias e so que o CUSTO soma.
    #
    # A regra continua valendo, e continua sendo alerta: ela veio do briefing
    # desta sessao, ou seja, e decisao do autor. O dado da oficina ja registra
    # isso — dados/acervo_regras.js, no "duas_char_ref_misturam", traz
    # "verificado": false. O que saiu foi a palavra "oficial", que era um
    # carimbo mentiroso em cima de uma regra honesta.
    #
    # As tres telas tem de dizer a MESMA coisa: esta aqui, o motor_prompt.js e o
    # painel.js. Mudar uma sem mudar as outras e como o defeito nasceu.
    so_de_personagem = [
        r for r in referencias
        if str(r.get("tipo", "character") or "character").strip().lower() == "character"
    ]
    if len(so_de_personagem) > 1:
        avisos.append(
            "Você anexou {} referências de personagem. A oficina trata isto como "
            "regra dura: elas não fazem dois personagens diferentes, e sim UM só, "
            "com as características somadas. Se você quer dois personagens na "
            "mesma imagem, use uma referência só e monte o segundo pelas caixas de "
            "personagem. (O manual do NovelAI não afirma isto — ele só diz que o "
            "custo soma quando há mais de uma referência. A regra e decisão do "
            "autor, e o alerta continua valendo.)".format(len(so_de_personagem))
        )

    if referencias:
        parametros["director_reference_images"] = [
            r.get("dados_base64", "") for r in referencias
        ]
        parametros["director_reference_strength_values"] = [
            _numero(r, "forca", 1.0, inteiro=False) for r in referencias
        ]
        parametros["director_reference_information_extracted"] = [
            _numero(r, "fidelidade", 1.0, inteiro=False) for r in referencias
        ]
    if vibes:
        parametros["reference_image_multiple"] = [
            v.get("dados_base64", "") for v in vibes
        ]
        parametros["reference_strength_multiple"] = [
            _numero(v, "forca", 0.6, inteiro=False) for v in vibes
        ]
        parametros["reference_information_extracted_multiple"] = [
            _numero(v, "info_extraida", 1.0, inteiro=False) for v in vibes
        ]

    corpo = {
        "input": str(pedido.get("prompt", "") or ""),
        "model": nome_do_modelo(modelo_chave),
        "action": a_rota.get("acao_no_corpo") or "generate",
        "parameters": parametros,
    }

    # As ferramentas de direcao usam outro formato de corpo.
    if acao == "director":
        ferramenta = str(pedido.get("ferramenta_de_direcao", "") or "")
        conhecidas = enderecos().get("acoes_de_direcao") or {}
        if ferramenta not in conhecidas:
            raise ErroDaPonte(
                "A ferramenta de direção '{}' não existe. As que existem são: {}.".format(
                    ferramenta, ", ".join(sorted(conhecidas.keys()))
                )
            )
        corpo = {
            "req_type": ferramenta,
            "width": parametros["width"],
            "height": parametros["height"],
            "image": pedido.get("imagem_base_base64", ""),
        }
        if ferramenta == "emotion":
            corpo["prompt"] = str(pedido.get("prompt", "") or "")
            corpo["defry"] = _numero(pedido, "forca_da_emocao", 0)

    if acao == "codificar_vibe":
        corpo = {
            "image": pedido.get("imagem_base_base64", ""),
            "model": nome_do_modelo(modelo_chave),
            "information_extracted": _numero(pedido, "info_extraida", 1.0, inteiro=False),
        }

    cabecalhos_dados = enderecos().get("cabecalhos") or {}
    cabecalhos_para_a_tela = {
        "Content-Type": cabecalhos_dados.get("tipo_de_conteudo", "application/json"),
        cabecalhos_dados.get("autorizacao", "Authorization"): TOKEN_ESCONDIDO,
        "User-Agent": cabecalhos_dados.get("agente", "OficinaDeImagem/1.0"),
    }

    alertas = _conferir_imagens_prometidas(
        pedido, acao, referencias_que_chegaram, vibes
    )
    alertas = alertas_do_preset + alertas

    return {
        "acao": acao,
        "metodo": a_rota["metodo"],
        "url": a_rota["url"],
        "descricao_pt": a_rota["descricao_pt"],
        "endereco_verificado": a_rota["verificado"],
        "cabecalhos": cabecalhos_para_a_tela,
        "corpo": corpo,
        "corpo_para_mostrar": _limpar_para_a_tela(corpo),
        "semente": semente,
        "modelo": modelo_chave,
        "resposta_esperada": a_rota["resposta"],
        "alertas": alertas,
        "avisos": avisos,
        "familia_do_modelo": familia,
        "pode_gerar": not alertas,
        "imagens_anexadas": {
            # "referencias" e quantas VAO SER ENVIADAS; "referencias_recebidas" e
            # quantas a tela anexou. Os dois numeros so ficam diferentes quando a
            # ponte deixou de mandar alguma por incompatibilidade de modelo — e
            # nesse caso o motivo esta escrito na lista "avisos", em portugues.
            "referencias": len(referencias),
            "referencias_recebidas": len(referencias_que_chegaram),
            "vibes": len(vibes),
            "imagem_de_partida": bool(str(pedido.get("imagem_base_base64") or "").strip()),
            "mascara": bool(str(pedido.get("mascara_base64") or "").strip()),
        },
        "aviso_do_endereco": (
            "Este endereço não esta na documentacao oficial do NovelAI. Ele vem do "
            "arquivo ponte/endpoints.json e pode mudar sem aviso. Se a geracao "
            "falhar, o resto da oficina continua funcionando: monte o prompt e use "
            "o botao Copiar."
        ),
    }


# ---------------------------------------------------------------------------
# Enviar de verdade
# ---------------------------------------------------------------------------

def _frase_do_erro(codigo: int, corpo_do_erro: str = "") -> str:
    conhecidos = enderecos().get("erros_conhecidos") or {}
    frase = conhecidos.get(str(codigo))
    if frase:
        return frase
    if 400 <= codigo < 500:
        return (
            "O NovelAI recusou o pedido (código {}). Isso costuma ser algo no "
            "prompt ou nos ajustes. Nada foi gasto.".format(codigo)
        )
    return (
        "O NovelAI respondeu com um erro do lado deles (código {}). "
        "Nada foi gasto. Tente daqui a pouco.".format(codigo)
    )


def _abrir_imagens(bytes_da_resposta: bytes) -> list[bytes]:
    """
    A resposta do NovelAI vem como arquivo zip com as imagens dentro. As vezes
    vem uma imagem solta. Esta funcao aceita as duas formas.
    """
    if bytes_da_resposta[:2] == b"PK":
        imagens = []
        with zipfile.ZipFile(BytesIO(bytes_da_resposta)) as pacote:
            for nome in sorted(pacote.namelist()):
                if nome.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
                    imagens.append(pacote.read(nome))
        if imagens:
            return imagens
        raise ErroDaPonte(
            "O NovelAI respondeu com um pacote sem nenhuma imagem dentro. "
            "Nada foi salvo."
        )

    if bytes_da_resposta[:8] == b"\x89PNG\r\n\x1a\n" or bytes_da_resposta[:3] == b"\xff\xd8\xff":
        return [bytes_da_resposta]

    raise ErroDaPonte(
        "O NovelAI respondeu com algo que não e imagem. Isso costuma acontecer "
        "quando o endereço técnico mudou do lado deles. O arquivo "
        "ponte/endpoints.json e o lugar de corrigir. O resto da oficina continua "
        "funcionando."
    )


def executar(pedido_montado: dict, segundos: int = 180) -> list[bytes]:
    """
    Envia o pedido de verdade e devolve as imagens.

    So e chamada quando o autor ligou a geracao ao vivo E confirmou o custo. O
    servidor e quem impoe isso; aqui a funcao so faz o trabalho.
    """
    token = cofre.ler()
    if not token:
        raise ErroDaPonte(
            "Não há token guardado, então a oficina não pode gerar aqui dentro. "
            "Use o botao Copiar prompt e cole no site do NovelAI — funciona igual."
        )

    cabecalhos_dados = enderecos().get("cabecalhos") or {}
    corpo_em_bytes = json.dumps(pedido_montado["corpo"]).encode("utf-8")

    requisicao = urllib.request.Request(
        pedido_montado["url"],
        data=corpo_em_bytes,
        method=pedido_montado.get("metodo", "POST"),
    )
    requisicao.add_header(
        "Content-Type", cabecalhos_dados.get("tipo_de_conteudo", "application/json")
    )
    requisicao.add_header(
        cabecalhos_dados.get("autorizacao", "Authorization"),
        "{}{}".format(cabecalhos_dados.get("prefixo_do_token", "Bearer "), token),
    )
    requisicao.add_header("User-Agent", cabecalhos_dados.get("agente", "OficinaDeImagem/1.0"))
    del token  # nao fica em memoria alem do necessario

    try:
        with urllib.request.urlopen(requisicao, timeout=segundos) as resposta:
            conteudo = resposta.read()
    except urllib.error.HTTPError as erro:
        try:
            detalhe = erro.read().decode("utf-8", "replace")[:300]
        except Exception:
            detalhe = ""
        raise ErroDaPonte(_frase_do_erro(erro.code, detalhe)) from None
    except urllib.error.URLError as erro:
        motivo = getattr(erro, "reason", "")
        if isinstance(motivo, socket.timeout):
            raise ErroDaPonte(
                "O NovelAI demorou demais para responder e a oficina desistiu de "
                "esperar. Nada foi salvo. Tente de novo."
            ) from None
        raise ErroDaPonte(
            "Não consegui falar com o NovelAI. Confira se a internet esta "
            "funcionando. Se estiver, o site pode estar fora do ar — o resto da "
            "oficina continua servindo, e o botao Copiar prompt funciona sempre."
        ) from None
    except socket.timeout:
        raise ErroDaPonte(
            "O NovelAI demorou demais para responder. Nada foi salvo. Tente de novo."
        ) from None

    return _abrir_imagens(conteudo)


def pedido_de_prova(modelo: str = "v4_5_full") -> dict:
    """
    O pedido mais barato e mais simples que a oficina consegue montar: uma
    imagem, no tamanho de partida, com um prompt de tres palavras.

    Serve para o botao "Gerar 1 imagem de prova". Ele existe separado do teste
    de token por um motivo concreto: o teste de token pergunta os dados da conta
    e NUNCA toca no endereco da geracao — que e justamente o endereco marcado
    como nao verificado, o unico que pode ter mudado do lado do NovelAI. Um
    botao que promete provar que a ponte esta de pe e so pergunta o saldo nao
    prova nada.
    """
    return {
        "acao": "gerar",
        "modelo": modelo,
        "prompt": "1girl, standing, simple background",
        "conteudo_indesejado": "",
        "largura": 832,
        "altura": 1216,
        "passos": 28,
        "quantidade": 1,
        # Escolhido de proposito, e nao herdado de lugar nenhum: o pedido de
        # prova nao pode ser barrado pela trava do preset, e tambem nao pode
        # inventar uma escolha do autor. "Pesado" e o preset de partida do
        # proprio site do NovelAI, entao e o mais previsivel para um teste.
        "preset_indesejado": "pesado",
        "etiquetas_de_qualidade": True,
    }


def testar_token(segundos: int = 30) -> dict:
    """
    A chamada mais barata que existe: pergunta os dados da conta.

    Serve para o botao de teste da tela dizer se o token funciona SEM gastar
    Anlas nenhum. Nao devolve o token, so o que a conta respondeu.

    O QUE ELE NAO PROVA, e a tela precisa dizer isso: que a geracao funciona.
    Esta chamada usa o endereco da CONTA. O endereco da GERACAO e outro, e e o
    que pode ter mudado do lado deles. Para provar a geracao existe o botao
    "Gerar 1 imagem de prova", que gera de verdade e custa o minimo.
    """
    token = cofre.ler()
    if not token:
        return {"ok": False, "erro": "Não há token guardado nesta máquina."}

    a_rota = rota("assinatura")
    cabecalhos_dados = enderecos().get("cabecalhos") or {}
    requisicao = urllib.request.Request(a_rota["url"], method="GET")
    requisicao.add_header(
        cabecalhos_dados.get("autorizacao", "Authorization"),
        "{}{}".format(cabecalhos_dados.get("prefixo_do_token", "Bearer "), token),
    )
    requisicao.add_header("User-Agent", cabecalhos_dados.get("agente", "OficinaDeImagem/1.0"))
    del token

    try:
        with urllib.request.urlopen(requisicao, timeout=segundos) as resposta:
            dados = json.loads(resposta.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as erro:
        return {"ok": False, "erro": _frase_do_erro(erro.code)}
    except (urllib.error.URLError, socket.timeout):
        return {
            "ok": False,
            "erro": (
                "Não consegui falar com o NovelAI. Confira a internet. "
                "Nada foi gasto."
            ),
        }
    except ValueError:
        return {
            "ok": False,
            "erro": (
                "O NovelAI respondeu algo que a oficina não entendeu. O endereço "
                "técnico pode ter mudado; o conserto e no arquivo "
                "ponte/endpoints.json."
            ),
        }

    return {
        "ok": True,
        "mensagem": (
            "O token funciona. Nada foi gasto neste teste. Atenção: este teste "
            "pergunta os dados da sua conta, e não gera imagem nenhuma — ele não "
            "prova que a geracao esta funcionando. Para isso use o botao "
            "'Gerar 1 imagem de prova'."
        ),
        "gerou_imagem": False,
        "plano": dados.get("tier"),
        "anlas_na_conta": (dados.get("trainingStepsLeft") or {}).get("fixedTrainingStepsLeft"),
    }


# ---------------------------------------------------------------------------
# Guardar o resultado
# ---------------------------------------------------------------------------

def salvar_imagens(pasta_geradas: Path, imagens: list[bytes], pedido_montado: dict,
                   anlas: int, conta_do_custo: dict | None = None) -> list[dict]:
    """
    Guarda cada imagem com nome previsivel, e ao lado dela um arquivo .json com
    o prompt, a semente e o modelo.

    Esse arquivo ao lado e a unica forma de o autor refazer uma imagem daqui a
    meses. Sem ele, a imagem vira orfa.
    """
    agora = datetime.now()
    pasta_do_dia = Path(pasta_geradas) / agora.strftime("%Y-%m-%d")
    pasta_do_dia.mkdir(parents=True, exist_ok=True)

    corpo = pedido_montado.get("corpo") or {}
    parametros = corpo.get("parameters") or {}
    salvos = []

    for indice, dados_da_imagem in enumerate(imagens, start=1):
        base = "oficina_{}_{:02d}".format(agora.strftime("%H%M%S"), indice)
        arquivo_imagem = pasta_do_dia / (base + ".png")
        arquivo_ficha = pasta_do_dia / (base + ".json")

        arquivo_imagem.write_bytes(dados_da_imagem)

        ficha = {
            "versao_formato": "1.0.0",
            "arquivo": arquivo_imagem.name,
            "quando": agora.isoformat(timespec="seconds"),
            "acao": pedido_montado.get("acao"),
            "modelo": pedido_montado.get("modelo"),
            "modelo_na_api": corpo.get("model"),
            "prompt": corpo.get("input"),
            "conteudo_indesejado": parametros.get("negative_prompt"),
            "personagens": parametros.get("characterPrompts"),
            "semente": parametros.get("seed"),
            "largura": parametros.get("width"),
            "altura": parametros.get("height"),
            "passos": parametros.get("steps"),
            "escala": parametros.get("scale"),
            "anlas_contados": anlas,
            "conta_do_custo": conta_do_custo,
            "_leia": (
                "Guarde este arquivo junto da imagem. O prompt e a semente daqui "
                "são o que permite refazer a mesma imagem depois."
            ),
        }
        arquivo_ficha.write_text(
            json.dumps(ficha, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        salvos.append({
            "imagem": "{}/{}".format(pasta_do_dia.name, arquivo_imagem.name),
            "ficha": "{}/{}".format(pasta_do_dia.name, arquivo_ficha.name),
            "semente": parametros.get("seed"),
        })

    return salvos


def guardar_imagem_do_autor(pasta: Path, nome: str, dados_base64: str) -> dict:
    """
    Guarda uma imagem que o autor arrastou para a oficina — uma referencia dele,
    ou uma imagem que ele mesmo gerou no site do NovelAI.
    """
    try:
        bruto = base64.b64decode(_so_os_dados(dados_base64), validate=False)
    except Exception as erro:
        raise ErroDaPonte(
            "O arquivo que você soltou não chegou inteiro. Tente arrastar de novo."
        ) from erro

    if not bruto:
        raise ErroDaPonte("O arquivo que você soltou chegou vazio.")

    if len(bruto) > 40 * 1024 * 1024:
        raise ErroDaPonte(
            "Essa imagem tem mais de 40 MB, e a oficina recusa arquivos desse "
            "tamanho para não travar. Salve uma versão menor e tente de novo."
        )

    pasta = Path(pasta)
    pasta.mkdir(parents=True, exist_ok=True)
    destino = pasta / nome
    destino.write_bytes(bruto)
    return {"arquivo": destino.name, "bytes": len(bruto)}


def _so_os_dados(texto: str) -> str:
    """Tira o prefixo 'data:image/png;base64,' que o navegador costuma mandar."""
    if not texto:
        return ""
    if "," in texto[:120] and texto.strip().lower().startswith("data:"):
        return texto.split(",", 1)[1]
    return texto


# ---------------------------------------------------------------------------
# Autoteste (roda com: python novelai.py) — NAO fala com a internet
# ---------------------------------------------------------------------------

def _autoteste() -> int:
    falhas = []

    dados = enderecos()
    for nome, corpo in (dados.get("rotas") or {}).items():
        if corpo.get("verificado") is not False:
            falhas.append("A rota '{}' não esta marcada como não verificada.".format(nome))

    montado = montar_pedido({
        "acao": "gerar",
        "prompt": "1girl, watercolor (medium), best quality",
        "conteudo_indesejado": "lowres",
        "largura": 832, "altura": 1216, "passos": 28, "semente": 42,
    })

    texto = json.dumps(montado, ensure_ascii=False)
    if "Bearer " in texto and "nunca mostra" not in texto:
        falhas.append("O pedido montado carrega um token de verdade.")
    if montado["cabecalhos"]["Authorization"] != TOKEN_ESCONDIDO:
        falhas.append("O cabeçalho de autorização deveria vir escondido.")
    if montado["corpo"]["parameters"]["seed"] != 42:
        falhas.append("A semente escolhida deveria ser respeitada.")
    if montado["endereco_verificado"] is not False:
        falhas.append("O endereço deveria vir marcado como não verificado.")

    # As duas grafias do identificador de modelo tem de dar no mesmo lugar.
    # Este teste existe porque "v45_curated" (a grafia do Construtor A) caia no
    # modelo padrao em silencio: o autor pedia Curated, pagava, e recebia Full.
    pares = (
        ("v45_full", "v4_5_full"),
        ("v45_curated", "v4_5_curated"),
        ("V4_Full", "v4_full"),
    )
    for grafia_a, grafia_b in pares:
        try:
            if nome_do_modelo(grafia_a) != nome_do_modelo(grafia_b):
                falhas.append(
                    "'{}' e '{}' sao o mesmo modelo e deram nomes diferentes.".format(
                        grafia_a, grafia_b
                    )
                )
        except ErroDaPonte as erro:
            falhas.append("A grafia '{}' deveria ser aceita: {}".format(grafia_a, erro))

    if nome_do_modelo("v45_curated") == nome_do_modelo("v45_full"):
        falhas.append(
            "Curated e Full estao caindo no mesmo modelo. E a troca silenciosa "
            "que este teste existe para pegar."
        )

    # Modelo que nao existe nao pode virar o modelo padrao em silencio.
    try:
        nome_do_modelo("modelo_que_nao_existe")
    except ErroDaPonte as erro:
        if "não conhece o modelo" not in str(erro):
            falhas.append("A recusa do modelo desconhecido deveria explicar o motivo.")
    else:
        falhas.append(
            "Modelo desconhecido virou o modelo padrao sem avisar. Isso gera e "
            "cobra a imagem errada."
        )

    # Duas referencias precisas + vibe na mesma geracao tem de ser barrado.
    try:
        montar_pedido({
            "acao": "gerar",
            "referencias": [{"dados_base64": "x"}],
            "vibes": [{"dados_base64": "y"}],
        })
    except ErroDaPonte as erro:
        if "mesma geracao" not in str(erro):
            falhas.append("A recusa de Referência + Vibe deveria explicar o motivo.")
    else:
        falhas.append("Referência Precisa junto com Vibe Transfer deveria ser recusado.")

    # Imagem grande nao pode aparecer inteira na tela do modo ensaio.
    com_imagem = montar_pedido({
        "acao": "img2img",
        "prompt": "teste",
        "imagem_base_base64": "A" * 5000,
    })
    if "A" * 500 in json.dumps(com_imagem["corpo_para_mostrar"]):
        falhas.append("O corpo para mostrar não deveria trazer a imagem inteira.")
    if "nao mostrada aqui" not in json.dumps(com_imagem["corpo_para_mostrar"]):
        falhas.append("A imagem escondida deveria virar uma linha curta em português.")

    # ...mas o PROMPT DELE tem de aparecer inteiro, por mais longo que seja.
    #
    # Este caso existe por um defeito medido em 23/08/2026: a troca por linha
    # curta olhava o TAMANHO do texto, entao um prompt de trinta tags (416
    # letras, tags comuns) sumia da tela do modo ensaio anunciado como imagem.
    # O modo ensaio e o padrao, e e a unica tela onde ele confere a chamada
    # antes de gastar Anlas.
    prompt_longo = ", ".join([
        "long hair", "blue eyes", "watercolor (medium)", "traditional media",
        "1girl", "solo", "looking at viewer", "white shirt", "long sleeves",
        "pleated skirt", "black pantyhose", "knee boots", "brown gloves",
        "leather belt", "simple background", "best quality", "amazing quality",
        "very aesthetic", "absurdres", "rooftop", "storm clouds",
        "dramatic lighting", "from below", "cowboy shot", "wind lift",
        "floating hair", "serious expression", "clenched fist", "city skyline",
        "rain",
    ])
    if len(prompt_longo) <= 400:
        falhas.append("O prompt de teste precisa passar de 400 letras para valer.")
    longo = montar_pedido({
        "acao": "gerar", "prompt": prompt_longo, "preset_indesejado": "leve",
        "personagens": [{"prompt": "girl, " + prompt_longo}],
    })
    mostrado = longo["corpo_para_mostrar"]
    if mostrado["input"] != prompt_longo:
        falhas.append("O prompt do autor tem de aparecer inteiro no modo ensaio.")
    dentro_do_v4 = mostrado["parameters"]["v4_prompt"]["caption"]
    if dentro_do_v4["base_caption"] != prompt_longo:
        falhas.append("O prompt dentro de v4_prompt também tem de aparecer inteiro.")
    if not dentro_do_v4["char_captions"][0]["char_caption"].startswith("girl, "):
        falhas.append("A caixa de personagem longa tem de aparecer inteira.")
    if "nao mostrada aqui" in json.dumps(mostrado, ensure_ascii=False):
        falhas.append("Sem imagem no pedido, nada deveria ser escondido da tela.")

    # Caixinha de numero apagada na tela nao pode derrubar a oficina.
    #
    # Antes de 23/08/2026 "passos": null e "largura": "" levantavam ValueError
    # cru, e o autor recebia "Aconteceu um erro inesperado dentro da oficina" —
    # a frase que nao diz o que houve nem o que fazer.
    vazio = montar_pedido({
        "acao": "gerar", "prompt": "1girl", "preset_indesejado": "leve",
        "passos": None, "largura": "", "escala": None, "quantidade": "",
    })
    if vazio["corpo"]["parameters"]["steps"] != 28:
        falhas.append("Campo de número em branco deveria usar o valor de partida.")
    if vazio["corpo"]["parameters"]["n_samples"] != 1:
        falhas.append("Quantidade em branco deveria valer 1.")

    # Texto que nao e numero vira frase em portugues que NOMEIA o campo.
    try:
        montar_pedido({"acao": "gerar", "prompt": "1girl",
                       "preset_indesejado": "leve", "largura": "grande"})
    except ErroDaPonte as erro:
        if "largura" not in str(erro):
            falhas.append("A recusa de número inválido deveria nomear o campo.")
    else:
        falhas.append("Largura escrita por extenso deveria ser recusada.")

    # Numero escrito como texto continua valendo — a tela manda assim as vezes.
    texto_numerico = montar_pedido({
        "acao": "gerar", "prompt": "1girl", "preset_indesejado": "leve",
        "passos": "23", "escala": "5.5",
    })
    if texto_numerico["corpo"]["parameters"]["steps"] != 23:
        falhas.append("Número escrito como texto deveria ser aceito.")
    if abs(texto_numerico["corpo"]["parameters"]["scale"] - 5.5) > 0.001:
        falhas.append("Decimal escrito como texto deveria ser aceito.")

    # Ferramenta de direcao inexistente tem de ser recusada com a lista certa.
    try:
        montar_pedido({"acao": "director", "ferramenta_de_direcao": "inventada"})
    except ErroDaPonte as erro:
        if "colorize" not in str(erro):
            falhas.append("A recusa deveria listar as ferramentas que existem.")
    else:
        falhas.append("Ferramenta de direção inexistente deveria ser recusada.")

    # Resposta que nao e imagem vira frase em portugues, nao erro tecnico.
    try:
        _abrir_imagens(b"<html>erro</html>")
    except ErroDaPonte as erro:
        if "endpoints.json" not in str(erro):
            falhas.append("A resposta invalida deveria apontar onde consertar.")
    else:
        falhas.append("Resposta que não e imagem deveria virar erro em português.")

    for codigo, pedaco in ((401, "token"), (402, "Anlas"), (502, "fora do ar")):
        if pedaco.lower() not in _frase_do_erro(codigo).lower():
            falhas.append("O erro {} deveria falar de '{}'.".format(codigo, pedaco))

    # --- Posicao do personagem: as quatro formas, e o formato estranho -------
    #
    # Este bloco existe porque mandar "A1" derrubava o servidor com erro 500.
    for forma, esperado_x in (
        (None, 0.5),
        ({"x": 0.3, "y": 0.4}, 0.3),
        ([0.2, 0.8], 0.2),
        ("A1", 0.1),
        ("e5", 0.9),
    ):
        try:
            centro, escolhida = centro_do_personagem(forma, 1)
        except ErroDaPonte as erro:
            falhas.append("A posição {!r} deveria ser aceita: {}".format(forma, erro))
            continue
        if abs(centro["x"] - esperado_x) > 0.001:
            falhas.append(
                "A posição {!r} deveria dar x={}, deu {}.".format(
                    forma, esperado_x, centro["x"]
                )
            )
        if (forma is None) == escolhida:
            falhas.append("A posição {!r} marcou 'escolhida' errado.".format(forma))

    for ruim in ("Z9", "quadrado do meio", 12, {"x": "perto"}):
        try:
            centro_do_personagem(ruim, 2)
        except ErroDaPonte as erro:
            if "personagem 2" not in str(erro):
                falhas.append("A recusa de {!r} deveria dizer de qual personagem e.".format(ruim))
        else:
            falhas.append("A posição invalida {!r} deveria ser recusada.".format(ruim))

    # A grade so liga quando alguem escolheu posicao de verdade.
    sem_posicao = montar_pedido({"personagens": [{"prompt": "girl"}, {"prompt": "boy"}]})
    if sem_posicao["corpo"]["parameters"].get("use_coords"):
        falhas.append("Sem posição escolhida, use_coords tem de ficar desligado.")
    com_posicao = montar_pedido({"personagens": [{"prompt": "girl", "posicao": "B2"}]})
    if not com_posicao["corpo"]["parameters"].get("use_coords"):
        falhas.append("Com posição escolhida, use_coords tem de ligar.")

    # --- As escolhas da tela chegam mesmo ao corpo do pedido ----------------
    #
    # Antes de 21/08/2026 estas duas ficavam presas no valor de partida: as
    # Etiquetas de Qualidade sempre ligadas (e elas contem "no text", que apaga
    # a fala do quadro de mangá) e o preset sempre 0.
    escolhas = montar_pedido({
        "prompt": "1girl",
        "etiquetas_de_qualidade": False,
        "preset_indesejado": "leve",
    })
    if escolhas["corpo"]["parameters"]["qualityToggle"] is not False:
        falhas.append("A tela desligou as Etiquetas de Qualidade e o pedido não obedeceu.")
    if escolhas["corpo"]["parameters"]["ucPreset"] != 1:
        falhas.append("O preset 'leve' deveria virar 1 no corpo do pedido.")

    padrao_mantido = montar_pedido({"prompt": "1girl"})
    if padrao_mantido["corpo"]["parameters"]["qualityToggle"] is not True:
        falhas.append("Sem escolha da tela, o valor de partida deveria ser mantido.")

    try:
        numero_do_preset("inventado")
    except ErroDaPonte as erro:
        if "pesado" not in str(erro):
            falhas.append("A recusa do preset deveria listar os que existem.")
    else:
        falhas.append("Preset desconhecido deveria ser recusado, não virar 0 em silêncio.")

    # --- Prometer imagem e nao anexar tem de virar alerta -------------------
    #
    # O defeito que este teste guarda: a tela mandava a CONTAGEM das referencias,
    # o custo cobrava 5 Anlas por cada uma, e a imagem nunca saia da maquina.
    so_contagem = montar_pedido({"prompt": "1girl", "character_reference": 2})
    if so_contagem["pode_gerar"]:
        falhas.append(
            "Prometer 2 referências sem anexar imagem nenhuma deveria barrar a geracao."
        )
    if not any("Copiar prompt" in a for a in so_contagem["alertas"]):
        falhas.append("O alerta deveria mandar o autor usar o Copiar prompt.")

    com_dados = montar_pedido({
        "prompt": "1girl",
        "preset_indesejado": "leve",
        "character_reference": 1,
        "referencias": [{"dados_base64": "AAAA", "forca": 1.0, "fidelidade": 1.0}],
    })
    if not com_dados["pode_gerar"]:
        falhas.append("Com a imagem anexada de verdade, a geracao tem de passar.")
    if not com_dados["corpo"]["parameters"].get("director_reference_images"):
        falhas.append("A imagem anexada deveria entrar no corpo do pedido.")

    vazia = montar_pedido({
        "prompt": "1girl",
        "character_reference": 1,
        "referencias": [{"forca": 1.0}],
    })
    if vazia["pode_gerar"]:
        falhas.append("Referência sem dados_base64 e promessa vazia, e deveria barrar.")

    sem_imagem = montar_pedido({"acao": "img2img", "prompt": "1girl"})
    if sem_imagem["pode_gerar"]:
        falhas.append("Image2Image sem imagem de partida deveria barrar a geracao.")

    if pedido_de_prova()["quantidade"] != 1:
        falhas.append("O pedido de prova tem de ser de uma imagem só.")
    if not montar_pedido(pedido_de_prova())["pode_gerar"]:
        falhas.append(
            "O pedido de prova tem de passar por todas as travas — e ele que "
            "prova que o endereço de geracao esta de pé."
        )

    # --- As caixas de personagem tem de chegar mesmo ao NovelAI -------------
    #
    # O defeito que este bloco guarda: o corpo saia so com "characterPrompts",
    # sem a estrutura "v4_prompt", e as caixas nao chegavam. A oficina anunciava
    # o recurso, cobrava por ele, e mandava o pedido sem o carregador.
    dois = montar_pedido({
        "prompt": "2girls",
        "conteudo_indesejado": "lowres",
        "preset_indesejado": "leve",
        "modelo": "v45_full",
        "personagens": [
            {"prompt": "girl, blue hair", "conteudo_indesejado": "hat", "posicao": "B2"},
            {"prompt": "girl, red hair", "posicao": "D4"},
        ],
    })
    p_dois = dois["corpo"]["parameters"]
    if "v4_prompt" not in p_dois:
        falhas.append("Em V4.5 o corpo tem de levar v4_prompt, ou as caixas não chegam.")
    if "v4_negative_prompt" not in p_dois:
        falhas.append("Em V4.5 o corpo tem de levar v4_negative_prompt.")
    else:
        legendas = p_dois["v4_prompt"]["caption"]["char_captions"]
        if len(legendas) != 2:
            falhas.append("As duas caixas de personagem deveriam virar duas legendas.")
        elif legendas[0]["char_caption"] != "girl, blue hair":
            falhas.append("A legenda da primeira caixa não bate com o que a tela mandou.")
        elif not legendas[0].get("centers"):
            falhas.append("Cada legenda tem de levar o centro do personagem.")
        if p_dois["v4_prompt"]["caption"]["base_caption"] != "2girls":
            falhas.append("O prompt base tem de aparecer dentro de v4_prompt.")
        if p_dois["v4_negative_prompt"]["caption"]["base_caption"] != "lowres":
            falhas.append("O conteúdo indesejado tem de aparecer dentro de v4_negative_prompt.")
        if p_dois["v4_negative_prompt"]["caption"]["char_captions"][0]["char_caption"] != "hat":
            falhas.append("O indesejado de cada caixa tem de ir junto da caixa.")
        if not p_dois["v4_prompt"]["use_coords"]:
            falhas.append("Com posição escolhida, v4_prompt tem de ligar use_coords.")
        if len(p_dois.get("characterPrompts") or []) != 2:
            falhas.append("characterPrompts continua indo junto, e sumiu.")

    # Sem personagem nenhum a estrutura continua indo, com a lista vazia — e
    # assim que o proprio cliente do NovelAI monta o pedido em V4.
    sozinho = montar_pedido({"prompt": "1girl", "preset_indesejado": "leve"})
    if "v4_prompt" not in sozinho["corpo"]["parameters"]:
        falhas.append("Em V4.5, mesmo sem caixas, v4_prompt tem de ir no corpo.")
    elif sozinho["corpo"]["parameters"]["v4_prompt"]["caption"]["char_captions"] != []:
        falhas.append("Sem caixas de personagem, a lista de legendas tem de ficar vazia.")

    # Nos modelos V3 essa estrutura NAO existe, e mandar assim mesmo e erro.
    velho = montar_pedido({
        "prompt": "1girl", "preset_indesejado": "leve", "modelo": "anime_v3",
    })
    if "v4_prompt" in velho["corpo"]["parameters"]:
        falhas.append("O Anime V3 não conhece v4_prompt, e recebeu a estrutura.")

    # E caixa de personagem em modelo V3 tem de virar aviso, nao silencio.
    velho_com_caixa = montar_pedido({
        "prompt": "2girls", "preset_indesejado": "leve", "modelo": "anime_v3",
        "personagens": [{"prompt": "girl"}],
    })
    if not any("V4" in a for a in velho_com_caixa["avisos"]):
        falhas.append(
            "Caixa de personagem num modelo V3 não funciona, e tem de sair aviso."
        )

    # --- O preset de Conteudo Indesejado nunca vira 0 em silencio -----------
    #
    # Os numeros estavam trocados: 'nenhum' mandava 2 (que e o foco humano) e
    # 'foco' mandava 3 (que e nenhum). O autor pagava uma imagem filtrada por
    # uma lista que nao pediu.
    for identificador, esperado in (("pesado", 0), ("leve", 1), ("foco", 2), ("nenhum", 3)):
        if numero_do_preset(identificador) != esperado:
            falhas.append(
                "O preset '{}' deveria virar {}, virou {}.".format(
                    identificador, esperado, numero_do_preset(identificador)
                )
            )

    sem_preset = montar_pedido({"prompt": "1girl"})
    if sem_preset["pode_gerar"]:
        falhas.append(
            "Pedido sem preset de Conteúdo Indesejado deveria ser barrado, e não "
            "cair no preset de partida em silêncio."
        )
    if "ucPreset" in sem_preset["corpo"]["parameters"]:
        falhas.append("Sem escolha de preset, o corpo não pode inventar um.")

    nome_antigo = montar_pedido({"prompt": "1girl", "ucPreset": "leve"})
    if nome_antigo["corpo"]["parameters"].get("ucPreset") != 1:
        falhas.append("O nome antigo do campo do preset deveria ser aceito.")
    if not nome_antigo["avisos"]:
        falhas.append("Aceitar o nome antigo do campo tem de sair com aviso.")
    if not nome_antigo["pode_gerar"]:
        falhas.append("O nome antigo do campo não pode barrar a geracao.")

    # -----------------------------------------------------------------------
    # Os tres silencios consertados em 23/08/2026 (2a rodada).
    #
    # Todos da mesma familia: a ponte fazia a coisa certa e NAO DIZIA. Ficam
    # protegidos aqui porque regra so em texto e regra quebrada — e cada um
    # destes tres custava Anlas do autor sem deixar pista.
    # -----------------------------------------------------------------------
    UMA_IMAGEM = {"tipo": "character", "dados_base64": "iVBORw0KGgo="}
    base_ok = {"prompt": "1girl", "preset_indesejado": "pesado"}

    # 1. O setimo personagem nao pode sumir calado.
    sete = montar_pedido(dict(base_ok, modelo="v4_5_full",
                              personagens=[{"prompt": "girl"} for _ in range(7)]))
    if len(sete["corpo"]["parameters"].get("characterPrompts") or []) != 6:
        falhas.append("O teto de 6 personagens deveria valer.")
    if not sete["avisos"]:
        falhas.append(
            "Cortar o setimo personagem sem avisar e o defeito de 23/08/2026: "
            "o corte esta certo, o silêncio e que não pode voltar."
        )
    if not sete["pode_gerar"]:
        falhas.append("Passar de 6 personagens e aviso, não veto.")

    # 2. A Referencia Precisa fora do V4.5 nao pode ser enviada calada — a
    #    tela de custo ja diz que ela nao vai acontecer, e as duas telas da
    #    oficina tem de dizer a mesma coisa.
    fora = montar_pedido(dict(base_ok, modelo="anime_v3", referencias=[UMA_IMAGEM]))
    if "director_reference_images" in fora["corpo"]["parameters"]:
        falhas.append(
            "Referência Precisa fora do V4.5 não pode ir no corpo do pedido: a "
            "conta cobra 0 dizendo que ela não acontece, e as duas telas tem de "
            "concordar."
        )
    if not fora["avisos"]:
        falhas.append("Deixar de mandar a referência tem de sair com aviso.")
    if fora["alertas"]:
        falhas.append(
            "Deixar de mandar a referência por causa do modelo e AVISO amarelo, "
            "nunca alerta vermelho — alerta barraria a geracao."
        )
    if fora["imagens_anexadas"]["referencias_recebidas"] != 1:
        falhas.append("A tela anexou 1 referência; o relato tem de dizer isso.")

    # 3. Duas referencias de personagem se misturam num personagem so.
    duas = montar_pedido(dict(base_ok, modelo="v4_5_full",
                              referencias=[UMA_IMAGEM, UMA_IMAGEM]))
    if not duas["avisos"]:
        falhas.append(
            "Duas referências de personagem se misturam num personagem só, e o "
            "autor paga 5 Anlas por cada uma: tem de avisar antes."
        )
    if len(duas["corpo"]["parameters"].get("director_reference_images") or []) != 2:
        falhas.append("Avisar da mistura não e motivo para deixar de enviar.")
    # E o carimbo desse aviso tem de ser honesto. A regra e do autor, nao do
    # manual — chama-la de "oficial" e prometer uma fonte que nao existe.
    if any("oficial" in str(a).lower() for a in duas["avisos"]):
        falhas.append(
            "O aviso das duas referências não pode chamar a regra de 'oficial'. "
            "O manual do NovelAI não trata disto (a palavra 'misturar' não "
            "aparece lá), e o próprio acervo da oficina marca a regra como não "
            "verificada. O alerta vale; o carimbo de oficial, não."
        )

    # 4. E o contrario de tudo isso: o caminho normal nao pode ganhar aviso
    #    nenhum. Trava que grita no caso certo ensina o autor a ignorar aviso.
    normal = montar_pedido(dict(base_ok, modelo="v4_5_full", referencias=[UMA_IMAGEM]))
    if normal["avisos"] or normal["alertas"]:
        falhas.append(
            "Uma referência só, no V4.5, e o caminho normal: não pode sair "
            "aviso nem alerta. Alarme falso ensina a ignorar alarme."
        )
    if normal["imagens_anexadas"]["referencias"] != 1:
        falhas.append("A referência do caminho normal tem de ser enviada.")

    # 5. E a rede que o conserto acima quase rompeu: deixar de enviar uma
    #    referencia NAO pode virar o alerta vermelho de "a sua imagem nao
    #    chegou ate aqui", que barra a geracao. Sao coisas diferentes — uma e
    #    escolha da ponte, a outra e imagem que a tela prometeu e nao mandou.
    prometida = montar_pedido(dict(base_ok, modelo="v4_5_full", character_reference=2))
    if prometida["pode_gerar"]:
        falhas.append(
            "Referência prometida e não anexada tem de barrar a geracao — e a "
            "trava que impede pagar por imagem que não sai do computador."
        )

    if falhas:
        print("FALHOU:")
        for falha in falhas:
            print("  - {}".format(falha))
        return 1

    print("Ponte OK: monta sem token na tela, barra o que e incompativel, e traduz erro.")
    return 0


if __name__ == "__main__":
    raise SystemExit(_autoteste())
