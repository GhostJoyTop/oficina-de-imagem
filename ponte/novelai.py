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
            "Nao encontrei o arquivo de enderecos do NovelAI em {}. "
            "A oficina continua funcionando para montar e copiar prompt; so a "
            "geracao aqui dentro precisa desse arquivo.".format(ARQUIVO_DE_ENDERECOS)
        ) from erro
    except ValueError as erro:
        raise ErroDaPonte(
            "O arquivo de enderecos {} esta com erro de digitacao e o programa "
            "nao conseguiu ler. Se voce editou esse arquivo, desfaca a ultima "
            "mudanca.".format(ARQUIVO_DE_ENDERECOS.name)
        ) from erro
    return _cache_de_enderecos


def rota(nome: str) -> dict:
    dados = enderecos()
    caminho = (dados.get("rotas") or {}).get(nome)
    if not caminho:
        raise ErroDaPonte(
            "A oficina nao conhece a acao '{}'. As acoes conhecidas sao: {}.".format(
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


def nome_do_modelo(chave: str) -> str:
    modelos = enderecos().get("modelos") or {}
    escolhido = modelos.get(chave) or modelos.get("v4_5_full") or {}
    return escolhido.get("nome_na_api", "nai-diffusion-4-5-full")


# ---------------------------------------------------------------------------
# Montar o pedido (isto roda SEMPRE, inclusive no modo ensaio)
# ---------------------------------------------------------------------------

def _tamanho_legivel(texto_base64: str) -> str:
    if not texto_base64:
        return "(nenhuma)"
    kb = int(len(texto_base64) * 3 / 4 / 1024)
    return "(imagem de cerca de {} KB, nao mostrada aqui)".format(max(kb, 1))


def _limpar_para_a_tela(corpo: dict) -> dict:
    """
    Uma copia do corpo com as imagens trocadas por uma descricao curta.

    Sem isso, a tela do modo ensaio mostraria megabytes de letra embaralhada e o
    autor nao veria nada do que importa.
    """
    def limpar(valor):
        if isinstance(valor, dict):
            return {c: limpar(v) for c, v in valor.items()}
        if isinstance(valor, list):
            return [limpar(v) for v in valor]
        if isinstance(valor, str) and len(valor) > 400:
            return _tamanho_legivel(valor)
        return valor

    return limpar(corpo)


def montar_pedido(pedido: dict) -> dict:
    """
    Transforma o que a tela mandou na chamada que o NovelAI receberia.

    Devolve um dicionario com endereco, cabecalhos (com o token ESCONDIDO),
    corpo completo e corpo limpo para mostrar. Nada e enviado aqui.
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
    semente = int(semente)

    parametros = dict(padrao)
    parametros.update({
        "width": int(pedido.get("largura", padrao.get("width", 832))),
        "height": int(pedido.get("altura", padrao.get("height", 1216))),
        "steps": int(pedido.get("passos", padrao.get("steps", 28))),
        "scale": float(pedido.get("escala", padrao.get("scale", 5))),
        "n_samples": int(pedido.get("quantidade", 1)),
        "seed": semente,
        "negative_prompt": str(pedido.get("conteudo_indesejado", "") or ""),
    })

    # Personagens (V4+). A contagem (1girl, 2girls) fica so no prompt base; aqui
    # dentro vai "girl" ou "boy", sem numero. Quem garante isso e a tela.
    personagens = pedido.get("personagens") or []
    if personagens:
        parametros["characterPrompts"] = [
            {
                "prompt": str(p.get("prompt", "") or ""),
                "uc": str(p.get("conteudo_indesejado", "") or ""),
                "center": {
                    "x": float((p.get("posicao") or {}).get("x", 0.5)),
                    "y": float((p.get("posicao") or {}).get("y", 0.5)),
                },
            }
            for p in personagens[:6]
        ]

    # Partir de uma imagem.
    if pedido.get("imagem_base_base64"):
        parametros["image"] = pedido["imagem_base_base64"]
        parametros["strength"] = float(pedido.get("forca", 0.7))
        parametros["noise"] = float(pedido.get("ruido", 0.0))

    # Corrigir so um pedaco.
    if pedido.get("mascara_base64"):
        parametros["mask"] = pedido["mascara_base64"]

    # Referencia precisa (personagem e estilo). So V4.5, e nao convive com Vibe.
    referencias = pedido.get("referencias") or []
    vibes = pedido.get("vibes") or []
    if referencias and vibes:
        raise ErroDaPonte(
            "Referencia Precisa e Vibe Transfer nao funcionam na mesma geracao. "
            "Escolha um dos dois e tente de novo."
        )
    if referencias:
        parametros["director_reference_images"] = [
            r.get("dados_base64", "") for r in referencias
        ]
        parametros["director_reference_strength_values"] = [
            float(r.get("forca", 1.0)) for r in referencias
        ]
        parametros["director_reference_information_extracted"] = [
            float(r.get("fidelidade", 1.0)) for r in referencias
        ]
    if vibes:
        parametros["reference_image_multiple"] = [
            v.get("dados_base64", "") for v in vibes
        ]
        parametros["reference_strength_multiple"] = [
            float(v.get("forca", 0.6)) for v in vibes
        ]
        parametros["reference_information_extracted_multiple"] = [
            float(v.get("info_extraida", 1.0)) for v in vibes
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
                "A ferramenta de direcao '{}' nao existe. As que existem sao: {}.".format(
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
            corpo["defry"] = int(pedido.get("forca_da_emocao", 0))

    if acao == "codificar_vibe":
        corpo = {
            "image": pedido.get("imagem_base_base64", ""),
            "model": nome_do_modelo(modelo_chave),
            "information_extracted": float(pedido.get("info_extraida", 1.0)),
        }

    cabecalhos_dados = enderecos().get("cabecalhos") or {}
    cabecalhos_para_a_tela = {
        "Content-Type": cabecalhos_dados.get("tipo_de_conteudo", "application/json"),
        cabecalhos_dados.get("autorizacao", "Authorization"): TOKEN_ESCONDIDO,
        "User-Agent": cabecalhos_dados.get("agente", "OficinaDeImagem/1.0"),
    }

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
        "aviso_do_endereco": (
            "Este endereco nao esta na documentacao oficial do NovelAI. Ele vem do "
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
            "O NovelAI recusou o pedido (codigo {}). Isso costuma ser algo no "
            "prompt ou nos ajustes. Nada foi gasto.".format(codigo)
        )
    return (
        "O NovelAI respondeu com um erro do lado deles (codigo {}). "
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
        "O NovelAI respondeu com algo que nao e imagem. Isso costuma acontecer "
        "quando o endereco tecnico mudou do lado deles. O arquivo "
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
            "Nao ha token guardado, entao a oficina nao pode gerar aqui dentro. "
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
            "Nao consegui falar com o NovelAI. Confira se a internet esta "
            "funcionando. Se estiver, o site pode estar fora do ar — o resto da "
            "oficina continua servindo, e o botao Copiar prompt funciona sempre."
        ) from None
    except socket.timeout:
        raise ErroDaPonte(
            "O NovelAI demorou demais para responder. Nada foi salvo. Tente de novo."
        ) from None

    return _abrir_imagens(conteudo)


def testar_token(segundos: int = 30) -> dict:
    """
    A chamada mais barata que existe: pergunta os dados da conta.

    Serve para o botao de teste da tela dizer se o token funciona SEM gastar
    Anlas nenhum. Nao devolve o token, so o que a conta respondeu.
    """
    token = cofre.ler()
    if not token:
        return {"ok": False, "erro": "Nao ha token guardado nesta maquina."}

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
                "Nao consegui falar com o NovelAI. Confira a internet. "
                "Nada foi gasto."
            ),
        }
    except ValueError:
        return {
            "ok": False,
            "erro": (
                "O NovelAI respondeu algo que a oficina nao entendeu. O endereco "
                "tecnico pode ter mudado; o conserto e no arquivo "
                "ponte/endpoints.json."
            ),
        }

    return {
        "ok": True,
        "mensagem": "O token funciona. Nada foi gasto neste teste.",
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
                "sao o que permite refazer a mesma imagem depois."
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
            "O arquivo que voce soltou nao chegou inteiro. Tente arrastar de novo."
        ) from erro

    if not bruto:
        raise ErroDaPonte("O arquivo que voce soltou chegou vazio.")

    if len(bruto) > 40 * 1024 * 1024:
        raise ErroDaPonte(
            "Essa imagem tem mais de 40 MB, e a oficina recusa arquivos desse "
            "tamanho para nao travar. Salve uma versao menor e tente de novo."
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
            falhas.append("A rota '{}' nao esta marcada como nao verificada.".format(nome))

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
        falhas.append("O cabecalho de autorizacao deveria vir escondido.")
    if montado["corpo"]["parameters"]["seed"] != 42:
        falhas.append("A semente escolhida deveria ser respeitada.")
    if montado["endereco_verificado"] is not False:
        falhas.append("O endereco deveria vir marcado como nao verificado.")

    # Duas referencias precisas + vibe na mesma geracao tem de ser barrado.
    try:
        montar_pedido({
            "acao": "gerar",
            "referencias": [{"dados_base64": "x"}],
            "vibes": [{"dados_base64": "y"}],
        })
    except ErroDaPonte as erro:
        if "mesma geracao" not in str(erro):
            falhas.append("A recusa de Referencia + Vibe deveria explicar o motivo.")
    else:
        falhas.append("Referencia Precisa junto com Vibe Transfer deveria ser recusado.")

    # Imagem grande nao pode aparecer inteira na tela do modo ensaio.
    com_imagem = montar_pedido({
        "acao": "img2img",
        "prompt": "teste",
        "imagem_base_base64": "A" * 5000,
    })
    if "A" * 500 in json.dumps(com_imagem["corpo_para_mostrar"]):
        falhas.append("O corpo para mostrar nao deveria trazer a imagem inteira.")

    # Ferramenta de direcao inexistente tem de ser recusada com a lista certa.
    try:
        montar_pedido({"acao": "director", "ferramenta_de_direcao": "inventada"})
    except ErroDaPonte as erro:
        if "colorize" not in str(erro):
            falhas.append("A recusa deveria listar as ferramentas que existem.")
    else:
        falhas.append("Ferramenta de direcao inexistente deveria ser recusada.")

    # Resposta que nao e imagem vira frase em portugues, nao erro tecnico.
    try:
        _abrir_imagens(b"<html>erro</html>")
    except ErroDaPonte as erro:
        if "endpoints.json" not in str(erro):
            falhas.append("A resposta invalida deveria apontar onde consertar.")
    else:
        falhas.append("Resposta que nao e imagem deveria virar erro em portugues.")

    for codigo, pedaco in ((401, "token"), (402, "Anlas"), (502, "fora do ar")):
        if pedaco.lower() not in _frase_do_erro(codigo).lower():
            falhas.append("O erro {} deveria falar de '{}'.".format(codigo, pedaco))

    if falhas:
        print("FALHOU:")
        for falha in falhas:
            print("  - {}".format(falha))
        return 1

    print("Ponte OK: monta sem token na tela, barra o que e incompativel, e traduz erro.")
    return 0


if __name__ == "__main__":
    raise SystemExit(_autoteste())
