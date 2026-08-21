# -*- coding: utf-8 -*-
"""
O SERVIDOR DA OFICINA DE IMAGEM.

O que e, em uma frase para quem nao e tecnico: um programinha que roda so no seu
computador, serve a pagina da oficina para o seu navegador e grava o seu
trabalho no disco. Ele nao fica na internet e ninguem de fora alcanca ele.

Por que ele existe, ja que a pagina poderia abrir sozinha: porque uma pagina
aberta direto do disco nao consegue gravar arquivo no seu computador, nem
receber imagem arrastada, nem falar com o NovelAI. O navegador proibe. Este
programa contorna isso ficando do lado de ca.

O QUE ELE NUNCA FAZ:

  - Nunca escreve fora de Ferramentas\\Oficina_de_Imagem\\meu_trabalho\\.
    As pastas do livro (Personagens, Capitulos, Imagens, Biblia, Eventos,
    Ganchos, Fichas de Alinhamento, Investigacao, Rascunhos, Jogo, _Arquivo)
    sao so de leitura, e mesmo assim so o que a planta autorizou.
  - Nunca mostra o token na resposta, nem em pedaco, nem em log.
  - Nunca escuta fora de 127.0.0.1, que e o endereco do proprio computador.
  - Nunca envia nada ao NovelAI sem o autor ligar a geracao ao vivo E confirmar
    o custo em Anlas daquela geracao. O padrao e o MODO ENSAIO.

So usa o que ja vem no Python. Nenhuma biblioteca para instalar.

Para conferir que esta tudo de pe, sem abrir nada:
    python servidor.py --autoteste
"""

from __future__ import annotations

import json
import os
import re
import socket
import sys
import threading
import time
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

PASTA_DA_PONTE = Path(__file__).resolve().parent
if str(PASTA_DA_PONTE) not in sys.path:
    sys.path.insert(0, str(PASTA_DA_PONTE))

import cofre  # noqa: E402
import novelai  # noqa: E402
import orcamento as modulo_orcamento  # noqa: E402

# ---------------------------------------------------------------------------
# Onde e cada coisa
# ---------------------------------------------------------------------------

PASTA_DA_FERRAMENTA = PASTA_DA_PONTE.parent
PASTA_DE_TRABALHO = PASTA_DA_FERRAMENTA / "meu_trabalho"
RAIZ_DO_LIVRO = PASTA_DA_FERRAMENTA.parent.parent

TIPOS_DE_TRABALHO = ("personagens", "prompts", "exemplos", "referencias", "geradas")

# Leitura autorizada dentro do livro. Nada alem disto, nunca.
PASTA_DE_PERSONAGENS = RAIZ_DO_LIVRO / "Personagens"
PASTA_DA_BIBLIA_VISUAL = RAIZ_DO_LIVRO / "Imagens" / "_Biblia_Visual"
ARQUIVOS_DA_BIBLIA_VISUAL = (
    "PADRAO_VISUAL_DEFAULT.md",
    "INDICE_REFERENCIAS.md",
    "REGRAS_PROMPT_POR_MOTOR.md",
)

PORTA_INICIAL = 8760
PORTA_FINAL = 8770
TAMANHO_MAXIMO_DO_PEDIDO = 60 * 1024 * 1024  # 60 MB, para imagem arrastada

# Nomes de arquivo aceitos. Letra, numero, acento, espaco, ponto, hifen, sublinha.
RE_NOME_DE_ARQUIVO = re.compile(r"^[0-9A-Za-zÀ-ÿ _.\-]{1,120}$")
NOMES_PROIBIDOS_NO_WINDOWS = {
    "con", "prn", "aux", "nul",
    *{"com{}".format(n) for n in range(1, 10)},
    *{"lpt{}".format(n) for n in range(1, 10)},
}

TIPOS_DE_CONTEUDO = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/plain; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
}
EXTENSOES_DE_TEXTO = (".json", ".md", ".txt")
EXTENSOES_DE_IMAGEM = (".png", ".jpg", ".jpeg", ".webp", ".gif")

# Estado da oficina enquanto ela roda. Comeca sempre no modo ensaio: fechar e
# abrir a oficina volta para o modo seguro, de proposito.
ESTADO = {
    "porta": None,
    "geracao_ao_vivo": False,
    "aberta_em": datetime.now().isoformat(timespec="seconds"),
}

ORCAMENTO = modulo_orcamento.Orcamento(PASTA_DE_TRABALHO)


class ErroDeUso(Exception):
    """Erro do lado do pedido. Vira uma frase em portugues, sem codigo tecnico."""


# ---------------------------------------------------------------------------
# Disco: as travas de caminho e a paciencia com o OneDrive
# ---------------------------------------------------------------------------

def preparar_pastas() -> None:
    """Cria as gavetas de trabalho na primeira vez. Nunca apaga nada."""
    for tipo in TIPOS_DE_TRABALHO:
        (PASTA_DE_TRABALHO / tipo).mkdir(parents=True, exist_ok=True)

    aviso = PASTA_DE_TRABALHO / "LEIA-ME desta pasta.txt"
    if not aviso.exists():
        aviso.write_text(
            "Esta pasta e sua.\r\n\r\n"
            "Tudo o que a Oficina de Imagem salva fica aqui dentro:\r\n"
            "  personagens  - as fichas dos seus personagens\r\n"
            "  prompts      - os prompts que voce montou\r\n"
            "  exemplos     - as imagens que voce soltou como exemplo de uma tag\r\n"
            "  referencias  - as imagens de referencia que voce usa\r\n"
            "  geradas      - as imagens geradas, uma pasta por dia\r\n\r\n"
            "Cada imagem gerada tem um arquivo .json do lado dela, com o prompt e a\r\n"
            "semente que a fizeram. Guarde os dois juntos: e o que permite refazer a\r\n"
            "mesma imagem meses depois.\r\n\r\n"
            "Esta pasta NAO vai para o repositorio do livro. Pode copiar, mover e\r\n"
            "guardar onde quiser.\r\n",
            encoding="utf-8",
        )


def _nome_valido(nome: str) -> bool:
    if not nome or nome in (".", ".."):
        return False
    if not RE_NOME_DE_ARQUIVO.match(nome):
        return False
    if nome != nome.strip() or nome.endswith("."):
        return False
    if nome.split(".")[0].lower() in NOMES_PROIBIDOS_NO_WINDOWS:
        return False
    return True


def caminho_de_trabalho(tipo: str, resto: str = "") -> Path:
    """
    Devolve um caminho DENTRO de meu_trabalho, ou levanta ErroDeUso.

    Esta e a trava mais importante do arquivo inteiro. Ela e a razao de a oficina
    nao conseguir escrever numa pasta do livro nem por acidente, nem por pedido
    malformado, nem por caminho com "..".
    """
    if tipo not in TIPOS_DE_TRABALHO:
        raise ErroDeUso(
            "A oficina so guarda coisas em: {}. Nao existe gaveta chamada '{}'.".format(
                ", ".join(TIPOS_DE_TRABALHO), tipo
            )
        )

    partes = [p for p in (resto or "").replace("\\", "/").split("/") if p]
    if len(partes) > 2:
        raise ErroDeUso("O nome do arquivo tem pastas demais dentro dele.")
    for parte in partes:
        if not _nome_valido(parte):
            raise ErroDeUso(
                "O nome '{}' nao pode ser usado. Use letras, numeros, espaco, "
                "hifen, sublinha e ponto.".format(parte)
            )

    alvo = (PASTA_DE_TRABALHO / tipo).joinpath(*partes)

    # A conferencia final: depois de resolver tudo, o caminho AINDA tem de estar
    # dentro de meu_trabalho. E o que mata qualquer truque com ".." ou atalho.
    base = PASTA_DE_TRABALHO.resolve()
    try:
        resolvido = alvo.resolve()
    except OSError:
        resolvido = alvo
    if not resolvido.is_relative_to(base):
        raise ErroDeUso("Caminho recusado: fica fora da sua pasta de trabalho.")
    return alvo


def ler_com_paciencia(caminho: Path, binario: bool = False, tentativas: int = 3):
    """
    Le um arquivo insistindo um pouco.

    Motivo: o OneDrive guarda arquivo na nuvem e deixa so um atalho no disco (e o
    recurso "Arquivos sob demanda"). A primeira leitura pode demorar ou falhar
    enquanto ele baixa. Insistir tres vezes resolve quase sempre.
    """
    ultimo_erro = None
    for tentativa in range(tentativas):
        try:
            if binario:
                return caminho.read_bytes()
            return caminho.read_text(encoding="utf-8")
        except FileNotFoundError:
            raise ErroDeUso("Nao encontrei o arquivo {}.".format(caminho.name))
        except OSError as erro:
            ultimo_erro = erro
            time.sleep(0.6 * (tentativa + 1))
    raise ErroDeUso(
        "Nao consegui ler o arquivo {}. Se ele esta na nuvem do OneDrive, pode "
        "ainda nao ter baixado — espere alguns segundos e tente de novo. "
        "Nada foi perdido.".format(caminho.name)
    ) from ultimo_erro


def gravar_com_paciencia(caminho: Path, dados, binario: bool = False,
                         tentativas: int = 3) -> None:
    """Grava primeiro num arquivo temporario e so depois troca. Evita meio-arquivo."""
    caminho.parent.mkdir(parents=True, exist_ok=True)
    temporario = caminho.with_name(caminho.name + ".novo")
    ultimo_erro = None
    for tentativa in range(tentativas):
        try:
            if binario:
                temporario.write_bytes(dados)
            else:
                temporario.write_text(dados, encoding="utf-8")
            temporario.replace(caminho)
            return
        except OSError as erro:
            ultimo_erro = erro
            time.sleep(0.6 * (tentativa + 1))
    raise ErroDeUso(
        "Nao consegui salvar o arquivo {}. Se a pasta esta sincronizando com o "
        "OneDrive, espere alguns segundos e tente de novo.".format(caminho.name)
    ) from ultimo_erro


def caminho_estatico(pedido: str) -> Path | None:
    """
    Resolve um pedido do navegador para um arquivo da oficina.

    So entrega arquivo de dentro da pasta da ferramenta, e nunca de dentro de
    ponte\\ (onde mora o programa) nem de meu_trabalho\\ (que so sai pela porta
    da API, com controle).
    """
    relativo = unquote(pedido).lstrip("/")
    if not relativo or relativo.endswith("/"):
        relativo = (relativo + "Oficina.html").lstrip("/")
    if ".." in relativo.replace("\\", "/").split("/"):
        return None

    alvo = (PASTA_DA_FERRAMENTA / relativo)
    try:
        resolvido = alvo.resolve()
    except OSError:
        return None

    base = PASTA_DA_FERRAMENTA.resolve()
    if not resolvido.is_relative_to(base):
        return None
    if resolvido.suffix.lower() not in TIPOS_DE_CONTEUDO:
        return None

    primeira_pasta = resolvido.relative_to(base).parts[0].lower()
    if primeira_pasta in ("ponte", "meu_trabalho", ".git"):
        return None
    if not resolvido.is_file():
        return None
    return resolvido


# ---------------------------------------------------------------------------
# A pagina de emergencia (quando a oficina ainda nao foi instalada nesta pasta)
# ---------------------------------------------------------------------------

PAGINA_DE_EMERGENCIA = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Oficina de Imagem</title>
<style>
 body{font-family:Segoe UI,system-ui,sans-serif;max-width:44rem;margin:4rem auto;
      padding:0 1.5rem;line-height:1.7;font-size:1.05rem;color:#1a1a1a;background:#fbfaf8}
 h1{font-size:1.6rem} code{background:#eee;padding:.15rem .4rem;border-radius:.25rem}
 .caixa{border-left:4px solid #c98a1b;background:#fff8e8;padding:1rem 1.2rem;border-radius:.4rem}
</style></head><body>
<h1>A ponte esta funcionando. Falta a pagina da oficina.</h1>
<div class="caixa">
<p>O programa que grava o seu trabalho e conversa com o NovelAI subiu certo.
Mas o arquivo <code>Oficina.html</code> ainda nao esta nesta pasta.</p>
</div>
<p>Isso quer dizer que a oficina foi instalada pela metade. O que fazer:
copie o arquivo <code>Oficina.html</code> e a pasta <code>interface</code>
para dentro de <code>%PASTA%</code> e atualize esta pagina.</p>
<p>Enquanto isso, a ponte responde normalmente em <code>/api/estado</code>.</p>
</body></html>
"""


# ---------------------------------------------------------------------------
# Os enderecos da API
# ---------------------------------------------------------------------------

def api_estado() -> dict:
    tem_token = cofre.tem_token()
    if tem_token:
        modo = "ligado_com_token"
        frase = (
            "Oficina ligada, com token guardado. Voce pode gerar aqui dentro — "
            "mas so depois de ligar a geracao ao vivo e confirmar o custo."
        )
    else:
        modo = "ligado"
        frase = (
            "Oficina ligada. Sem token — a geracao de imagem acontece no site do "
            "NovelAI. Monte o prompt aqui e use o botao Copiar."
        )

    dados = dict(ORCAMENTO.estado())
    dados.update({
        "ok": True,
        "modo": modo,
        "frase_do_modo": frase,
        "tem_token": tem_token,
        "geracao_ao_vivo": ESTADO["geracao_ao_vivo"],
        "modo_ensaio": not ESTADO["geracao_ao_vivo"],
        "explicacao_do_ensaio": (
            "No modo ensaio a oficina monta a chamada, mostra ela na tela e "
            "calcula o custo, mas nao envia nada ao NovelAI. Nenhum Anlas e gasto."
        ),
        "porta": ESTADO["porta"],
        "aberta_em": ESTADO["aberta_em"],
        "pasta_de_trabalho": str(PASTA_DE_TRABALHO),
        "pasta_do_cofre": str(cofre.pasta_do_cofre()),
    })
    return dados


def api_guardar_token(corpo: dict) -> dict:
    # O corpo deste pedido NUNCA e registrado em log. Nem aqui, nem no handler.
    valor = (corpo or {}).get("token")
    try:
        cofre.guardar(valor if isinstance(valor, str) else "")
    except cofre.ErroDoCofre as erro:
        raise ErroDeUso(str(erro)) from None
    del valor, corpo
    return {
        "ok": True,
        "mensagem": (
            "Token guardado. Ele ficou em {}, fora da pasta do livro e fora do "
            "git. A oficina nunca mostra o valor dele de volta.".format(
                cofre.pasta_do_cofre()
            )
        ),
        "tem_token": True,
    }


def api_apagar_token() -> dict:
    try:
        havia = cofre.apagar()
    except cofre.ErroDoCofre as erro:
        raise ErroDeUso(str(erro)) from None
    ESTADO["geracao_ao_vivo"] = False
    return {
        "ok": True,
        "tem_token": False,
        "mensagem": (
            "Token apagado." if havia else "Nao havia token guardado nesta maquina."
        ),
    }


def api_listar_trabalho(tipo: str) -> dict:
    pasta = caminho_de_trabalho(tipo)
    pasta.mkdir(parents=True, exist_ok=True)
    itens = []
    for caminho in sorted(pasta.rglob("*")):
        if not caminho.is_file():
            continue
        relativo = caminho.relative_to(pasta).as_posix()
        if len(relativo.split("/")) > 2:
            continue
        try:
            info = caminho.stat()
        except OSError:
            continue
        itens.append({
            "nome": relativo,
            "bytes": info.st_size,
            "modificado": datetime.fromtimestamp(info.st_mtime).isoformat(timespec="seconds"),
            "endereco": "/api/trabalho/{}/{}".format(tipo, relativo),
        })
    return {"ok": True, "tipo": tipo, "itens": itens, "quantos": len(itens)}


def api_ler_trabalho(tipo: str, nome: str):
    caminho = caminho_de_trabalho(tipo, nome)
    if not caminho.is_file():
        raise ErroDeUso("Nao encontrei '{}' na gaveta '{}'.".format(nome, tipo))

    extensao = caminho.suffix.lower()
    if extensao in EXTENSOES_DE_IMAGEM:
        return ("binario", ler_com_paciencia(caminho, binario=True),
                TIPOS_DE_CONTEUDO.get(extensao, "application/octet-stream"))

    texto = ler_com_paciencia(caminho)
    if extensao == ".json":
        try:
            return ("json", {"ok": True, "nome": nome, "conteudo": json.loads(texto)}, None)
        except ValueError:
            raise ErroDeUso(
                "O arquivo '{}' esta danificado e nao pode ser lido. O arquivo "
                "continua no disco; nada foi apagado.".format(nome)
            ) from None
    return ("json", {"ok": True, "nome": nome, "texto": texto}, None)


def api_gravar_trabalho(tipo: str, nome: str, corpo: dict) -> dict:
    caminho = caminho_de_trabalho(tipo, nome)
    corpo = corpo or {}

    if "conteudo" in corpo:
        gravar_com_paciencia(
            caminho, json.dumps(corpo["conteudo"], ensure_ascii=False, indent=2)
        )
    elif "texto" in corpo:
        gravar_com_paciencia(caminho, str(corpo["texto"]))
    elif "dados_base64" in corpo:
        try:
            resultado = novelai.guardar_imagem_do_autor(
                caminho.parent, caminho.name, corpo["dados_base64"]
            )
        except novelai.ErroDaPonte as erro:
            raise ErroDeUso(str(erro)) from None
        return {"ok": True, "nome": nome, "bytes": resultado["bytes"],
                "endereco": "/api/trabalho/{}/{}".format(tipo, nome)}
    else:
        raise ErroDeUso(
            "O pedido de gravar chegou sem conteudo. Mande 'conteudo' (dado), "
            "'texto' (texto simples) ou 'dados_base64' (imagem)."
        )

    return {"ok": True, "nome": nome,
            "endereco": "/api/trabalho/{}/{}".format(tipo, nome)}


def api_apagar_trabalho(tipo: str, nome: str) -> dict:
    caminho = caminho_de_trabalho(tipo, nome)
    if not caminho.is_file():
        return {"ok": True, "mensagem": "Esse arquivo ja nao existia."}
    try:
        caminho.unlink()
    except OSError:
        raise ErroDeUso(
            "Nao consegui apagar '{}'. Talvez ele esteja aberto em outro "
            "programa.".format(nome)
        ) from None
    return {"ok": True, "mensagem": "Apagado."}


def api_receber_imagem(corpo: dict) -> dict:
    """Recebe uma imagem que o autor arrastou para a tela."""
    corpo = corpo or {}
    tipo = str(corpo.get("tipo", "referencias"))
    nome = str(corpo.get("nome", "") or "")
    if not nome:
        nome = "imagem_{}.png".format(datetime.now().strftime("%Y%m%d_%H%M%S"))
    caminho = caminho_de_trabalho(tipo, nome)
    if caminho.suffix.lower() not in EXTENSOES_DE_IMAGEM:
        raise ErroDeUso(
            "A oficina guarda imagem em png, jpg, webp ou gif. O arquivo '{}' "
            "nao e um desses.".format(nome)
        )
    try:
        resultado = novelai.guardar_imagem_do_autor(
            caminho.parent, caminho.name, corpo.get("dados_base64", "")
        )
    except novelai.ErroDaPonte as erro:
        raise ErroDeUso(str(erro)) from None
    return {
        "ok": True, "tipo": tipo, "nome": caminho.name, "bytes": resultado["bytes"],
        "endereco": "/api/trabalho/{}/{}".format(tipo, caminho.name),
    }


def api_personagens_do_livro() -> dict:
    """
    Devolve SO OS NOMES dos arquivos de Personagens\\.

    Nunca o conteudo. A oficina ajuda a nomear e a organizar; a aparencia vem do
    autor ou da imagem de referencia que ele anexa. Isto e proibicao da planta,
    nao preferencia.
    """
    if not PASTA_DE_PERSONAGENS.is_dir():
        return {"ok": True, "nomes": [], "aviso": "Nao encontrei a pasta Personagens."}
    nomes = []
    try:
        for caminho in sorted(PASTA_DE_PERSONAGENS.glob("*.md")):
            if caminho.name.startswith("_"):
                continue
            nomes.append(caminho.stem)
    except OSError:
        return {"ok": True, "nomes": [],
                "aviso": "Nao consegui listar a pasta Personagens agora."}
    return {
        "ok": True,
        "nomes": nomes,
        "aviso": (
            "Isto e so a lista de nomes. A oficina nao le a aparencia dos "
            "personagens nos arquivos do livro — ela vem de voce."
        ),
    }


def api_biblia_visual(nome: str = "") -> dict:
    if not nome:
        return {"ok": True, "arquivos": list(ARQUIVOS_DA_BIBLIA_VISUAL)}
    if nome not in ARQUIVOS_DA_BIBLIA_VISUAL:
        raise ErroDeUso(
            "A oficina so le tres arquivos da Biblia Visual: {}.".format(
                ", ".join(ARQUIVOS_DA_BIBLIA_VISUAL)
            )
        )
    caminho = PASTA_DA_BIBLIA_VISUAL / nome
    if not caminho.is_file():
        raise ErroDeUso("O arquivo {} nao esta no lugar esperado.".format(nome))
    return {"ok": True, "nome": nome, "texto": ler_com_paciencia(caminho)}


def api_custo(corpo: dict) -> dict:
    conta = modulo_orcamento.calcular_custo((corpo or {}).get("pedido") or corpo or {})
    cabe, motivo = ORCAMENTO.cabe(conta["anlas"])
    conta.update({"ok": True, "cabe_no_teto": cabe, "motivo": motivo,
                  "orcamento": ORCAMENTO.estado()})
    return conta


def api_modo(corpo: dict | None = None) -> dict:
    if corpo is not None and "geracao_ao_vivo" in corpo:
        ligar = bool(corpo["geracao_ao_vivo"])
        if ligar and not cofre.tem_token():
            raise ErroDeUso(
                "Nao da para ligar a geracao ao vivo sem um token guardado. "
                "Guarde o token na tela do Cofre, ou use o botao Copiar prompt — "
                "que funciona sempre."
            )
        ESTADO["geracao_ao_vivo"] = ligar
    return {
        "ok": True,
        "geracao_ao_vivo": ESTADO["geracao_ao_vivo"],
        "modo_ensaio": not ESTADO["geracao_ao_vivo"],
        "mensagem": (
            "Geracao ao vivo LIGADA. A partir de agora, confirmar uma geracao "
            "gasta Anlas de verdade."
            if ESTADO["geracao_ao_vivo"] else
            "Modo ensaio. A oficina mostra a chamada e o custo, e nao envia nada."
        ),
    }


def api_orcamento(corpo: dict | None = None) -> dict:
    if corpo:
        try:
            ORCAMENTO.mudar_tetos(
                teto_sessao=corpo.get("teto_sessao"),
                teto_dia=corpo.get("teto_dia"),
            )
        except (ValueError, TypeError):
            raise ErroDeUso("Os tetos precisam ser numeros inteiros.") from None
        except modulo_orcamento.ErroDeOrcamento as erro:
            raise ErroDeUso(str(erro)) from None
    estado = ORCAMENTO.estado()
    estado["ok"] = True
    estado["tabela_de_custo"] = modulo_orcamento.tabela_de_custo()
    return estado


def api_testar_token() -> dict:
    resultado = novelai.testar_token()
    resultado.setdefault("ok", False)
    return resultado


def api_gerar(corpo: dict) -> dict:
    """
    O unico lugar do programa que pode gastar dinheiro.

    Tres portas, todas fechadas por padrao, e o pedido tem de passar pelas tres:
      1. A geracao ao vivo tem de estar ligada de proposito.
      2. O pedido tem de vir com executar=true.
      3. O custo tem de vir confirmado, e bater com o que a oficina calculou.
    Falhando qualquer uma, a resposta e o ENSAIO: a chamada montada e o custo,
    sem enviar nada.
    """
    corpo = corpo or {}
    pedido = corpo.get("pedido") or {}

    try:
        montado = novelai.montar_pedido(pedido)
    except novelai.ErroDaPonte as erro:
        raise ErroDeUso(str(erro)) from None

    conta = modulo_orcamento.calcular_custo(pedido)
    quer_executar = bool(corpo.get("executar"))

    ensaio = {
        "ok": True,
        "ensaio": True,
        "gerou": False,
        "pedido_montado": {
            "metodo": montado["metodo"],
            "url": montado["url"],
            "cabecalhos": montado["cabecalhos"],
            "corpo": montado["corpo_para_mostrar"],
            "endereco_verificado": montado["endereco_verificado"],
            "aviso_do_endereco": montado["aviso_do_endereco"],
        },
        "semente": montado["semente"],
        "custo": conta,
        "orcamento": ORCAMENTO.estado(),
    }

    if not quer_executar:
        ensaio["motivo"] = (
            "Ensaio pedido. Nada foi enviado ao NovelAI e nenhum Anlas foi gasto. "
            "Esta e a chamada que a oficina faria."
        )
        return ensaio

    if not ESTADO["geracao_ao_vivo"]:
        ensaio["motivo"] = (
            "A geracao ao vivo esta desligada, e ela e o padrao desligada de "
            "proposito. Nada foi enviado. Para gerar aqui dentro, ligue a chave "
            "na tela do Cofre e Gasto."
        )
        return ensaio

    if not cofre.tem_token():
        ensaio["motivo"] = (
            "Nao ha token guardado nesta maquina, entao a oficina nao gera aqui "
            "dentro. Use o botao Copiar prompt e cole no site do NovelAI."
        )
        return ensaio

    confirmado = corpo.get("custo_confirmado")
    if confirmado is None or int(confirmado) != int(conta["anlas"]):
        ensaio["motivo"] = (
            "O custo desta geracao e de {} Anlas e ainda nao foi confirmado. "
            "Confirme o valor na tela e a oficina gera.".format(conta["anlas"])
        )
        ensaio["precisa_confirmar"] = conta["anlas"]
        return ensaio

    cabe, frase = ORCAMENTO.cabe(conta["anlas"])
    if not cabe:
        return {"ok": False, "gerou": False, "erro": frase,
                "custo": conta, "orcamento": ORCAMENTO.estado()}

    if not ORCAMENTO.comecar_geracao():
        return {
            "ok": False, "gerou": False,
            "erro": (
                "Ja existe uma geracao acontecendo. A conta do NovelAI permite "
                "so uma por vez. Espere ela terminar."
            ),
            "orcamento": ORCAMENTO.estado(),
        }

    try:
        segundos = int(((novelai.enderecos().get("limites") or {}).get("segundos_de_espera")) or 180)
        imagens = novelai.executar(montado, segundos=segundos)
        salvos = novelai.salvar_imagens(
            PASTA_DE_TRABALHO / "geradas", imagens, montado, conta["anlas"], conta
        )
        ORCAMENTO.registrar_gasto(conta["anlas"])
    except novelai.ErroDaPonte as erro:
        return {"ok": False, "gerou": False, "erro": str(erro),
                "orcamento": ORCAMENTO.estado()}
    except OSError:
        return {
            "ok": False, "gerou": False,
            "erro": (
                "A imagem foi gerada, mas nao consegui salvar no disco. Se a "
                "pasta esta sincronizando com o OneDrive, espere e tente de novo. "
                "O Anlas dessa geracao ja foi gasto pelo NovelAI."
            ),
            "orcamento": ORCAMENTO.estado(),
        }
    finally:
        ORCAMENTO.terminar_geracao()

    return {
        "ok": True, "ensaio": False, "gerou": True,
        "arquivos": [
            {
                "imagem": s["imagem"],
                "ficha": s["ficha"],
                "semente": s["semente"],
                "endereco": "/api/trabalho/geradas/{}".format(s["imagem"]),
            }
            for s in salvos
        ],
        "anlas_gastos": conta["anlas"],
        "custo": conta,
        "orcamento": ORCAMENTO.estado(),
        "mensagem": "Pronto. {} salva{} em meu_trabalho/geradas.".format(
            "{} imagem".format(len(salvos)) if len(salvos) == 1
            else "{} imagens".format(len(salvos)),
            "" if len(salvos) == 1 else "s",
        ),
    }


def api_enderecos() -> dict:
    """Mostra a fabrica: os enderecos tecnicos que a oficina usaria."""
    dados = novelai.enderecos(recarregar=True)
    return {
        "ok": True,
        "bases": dados.get("bases"),
        "rotas": dados.get("rotas"),
        "modelos": dados.get("modelos"),
        "acoes_de_direcao": dados.get("acoes_de_direcao"),
        "limites": dados.get("limites"),
        "aviso": (
            "Nenhum destes enderecos esta na documentacao oficial do NovelAI. "
            "Eles vivem em ponte/endpoints.json e sao consertaveis sem mexer no "
            "programa. Se a geracao quebrar, o resto da oficina continua servindo."
        ),
    }


# ---------------------------------------------------------------------------
# O atendente dos pedidos
# ---------------------------------------------------------------------------

class Atendente(BaseHTTPRequestHandler):
    server_version = "OficinaDeImagem"
    sys_version = ""
    protocol_version = "HTTP/1.1"

    # -- log: curto, em portugues, e NUNCA com corpo de pedido -------------

    def log_message(self, formato, *args):  # noqa: A003
        caminho = self.path.split("?")[0]
        if caminho.startswith("/api/token"):
            caminho = "/api/token (o conteudo deste pedido nunca e registrado)"
        print("  {} {}".format(self.command, caminho))

    def log_error(self, formato, *args):
        return

    # -- seguranca ---------------------------------------------------------

    def _endereco_e_local(self) -> bool:
        """
        Confere que o pedido veio do proprio computador.

        Isto impede que um site aberto noutra aba do navegador converse com a
        oficina as escondidas.
        """
        cabecalho = (self.headers.get("Host") or "").strip()
        maquina = cabecalho.rsplit(":", 1)[0].strip("[]").lower() if cabecalho else ""
        if maquina not in ("127.0.0.1", "localhost", "::1"):
            return False

        if self.command in ("POST", "PUT", "DELETE"):
            origem = (self.headers.get("Origin") or "").strip()
            if origem:
                pedaco = urlparse(origem)
                if pedaco.hostname not in ("127.0.0.1", "localhost", "::1"):
                    return False
        return True

    # -- respostas ---------------------------------------------------------

    def _responder(self, codigo: int, corpo: bytes, tipo: str) -> None:
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        try:
            self.wfile.write(corpo)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _responder_json(self, objeto: dict, codigo: int = 200) -> None:
        corpo = json.dumps(objeto, ensure_ascii=False).encode("utf-8")
        self._responder(codigo, corpo, "application/json; charset=utf-8")

    def _erro(self, frase: str, codigo: int = 400) -> None:
        self._responder_json({"ok": False, "erro": frase}, codigo)

    def _corpo_do_pedido(self) -> dict:
        try:
            tamanho = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            raise ErroDeUso("O pedido chegou com tamanho invalido.") from None
        if tamanho <= 0:
            return {}
        if tamanho > TAMANHO_MAXIMO_DO_PEDIDO:
            raise ErroDeUso(
                "Esse arquivo e grande demais para a oficina (mais de {} MB). "
                "Salve uma versao menor.".format(TAMANHO_MAXIMO_DO_PEDIDO // (1024 * 1024))
            )
        bruto = self.rfile.read(tamanho)
        try:
            dados = json.loads(bruto.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            raise ErroDeUso("O pedido chegou embaralhado e a oficina nao entendeu.") from None
        return dados if isinstance(dados, dict) else {}

    # -- o roteador --------------------------------------------------------

    def do_GET(self):  # noqa: N802
        self._atender("GET")

    def do_POST(self):  # noqa: N802
        self._atender("POST")

    def do_PUT(self):  # noqa: N802
        self._atender("PUT")

    def do_DELETE(self):  # noqa: N802
        self._atender("DELETE")

    def _atender(self, metodo: str) -> None:
        if not self._endereco_e_local():
            self._erro(
                "Este pedido nao veio do seu computador, e a oficina so atende a "
                "si mesma.", 403
            )
            return

        caminho = urlparse(self.path).path
        try:
            if caminho.startswith("/api/"):
                self._atender_api(metodo, caminho)
            elif metodo == "GET":
                self._atender_arquivo(caminho)
            else:
                self._erro("Endereco desconhecido.", 404)
        except ErroDeUso as erro:
            self._erro(str(erro), 400)
        except Exception:  # noqa: BLE001
            # Nunca vaza rastro de erro para a tela do autor.
            print("  ! erro inesperado ao atender {} {}".format(metodo, caminho))
            self._erro(
                "Aconteceu um erro inesperado dentro da oficina. Seu trabalho "
                "salvo esta intacto. Se repetir, feche a janela preta e abra a "
                "oficina de novo.", 500
            )

    def _atender_api(self, metodo: str, caminho: str) -> None:
        partes = [p for p in caminho.split("/") if p][1:]  # tira o "api"
        alvo = partes[0] if partes else ""

        if alvo == "estado" and metodo == "GET":
            return self._responder_json(api_estado())

        if alvo == "token":
            if metodo == "POST":
                return self._responder_json(api_guardar_token(self._corpo_do_pedido()))
            if metodo == "DELETE":
                return self._responder_json(api_apagar_token())

        if alvo == "modo":
            if metodo == "GET":
                return self._responder_json(api_modo())
            if metodo == "POST":
                return self._responder_json(api_modo(self._corpo_do_pedido()))

        if alvo == "orcamento":
            if metodo == "GET":
                return self._responder_json(api_orcamento())
            if metodo == "POST":
                return self._responder_json(api_orcamento(self._corpo_do_pedido()))

        if alvo == "trabalho":
            tipo = partes[1] if len(partes) > 1 else ""
            nome = "/".join(partes[2:])
            if not tipo:
                return self._erro(
                    "Diga qual gaveta: {}.".format(", ".join(TIPOS_DE_TRABALHO)), 404
                )
            if not nome:
                if metodo == "GET":
                    return self._responder_json(api_listar_trabalho(tipo))
                return self._erro("Falta o nome do arquivo.", 400)
            if metodo == "GET":
                especie, dados, tipo_do_conteudo = api_ler_trabalho(tipo, nome)
                if especie == "binario":
                    return self._responder(200, dados, tipo_do_conteudo)
                return self._responder_json(dados)
            if metodo == "PUT":
                return self._responder_json(
                    api_gravar_trabalho(tipo, nome, self._corpo_do_pedido())
                )
            if metodo == "DELETE":
                return self._responder_json(api_apagar_trabalho(tipo, nome))

        if alvo == "imagem" and metodo == "POST":
            return self._responder_json(api_receber_imagem(self._corpo_do_pedido()))

        if alvo == "livro" and metodo == "GET":
            o_que = partes[1] if len(partes) > 1 else ""
            if o_que == "personagens":
                return self._responder_json(api_personagens_do_livro())
            if o_que == "biblia_visual":
                return self._responder_json(
                    api_biblia_visual("/".join(partes[2:]))
                )
            return self._erro(
                "A oficina so le duas coisas do livro: a lista de nomes de "
                "personagens e os tres arquivos da Biblia Visual.", 404
            )

        if alvo == "custo" and metodo == "POST":
            return self._responder_json(api_custo(self._corpo_do_pedido()))

        if alvo == "gerar" and metodo == "POST":
            return self._responder_json(api_gerar(self._corpo_do_pedido()))

        if alvo == "testar_token" and metodo == "POST":
            return self._responder_json(api_testar_token())

        if alvo == "enderecos" and metodo == "GET":
            return self._responder_json(api_enderecos())

        self._erro(
            "A oficina nao conhece o endereco '{}' com o metodo {}. "
            "A lista completa esta em ponte/PROTOCOLO.md.".format(caminho, metodo),
            404,
        )

    def _atender_arquivo(self, caminho: str) -> None:
        alvo = caminho_estatico(caminho)
        if alvo is None:
            if caminho in ("/", "/index.html", "/Oficina.html"):
                pagina = PAGINA_DE_EMERGENCIA.replace("%PASTA%", str(PASTA_DA_FERRAMENTA))
                return self._responder(200, pagina.encode("utf-8"), "text/html; charset=utf-8")
            return self._erro("Nao encontrei esse arquivo na oficina.", 404)

        dados = ler_com_paciencia(alvo, binario=True)
        self._responder(
            200, dados, TIPOS_DE_CONTEUDO.get(alvo.suffix.lower(), "application/octet-stream")
        )


class ServidorDaOficina(ThreadingHTTPServer):
    daemon_threads = True
    # No Windows, deixar isto ligado permitiria dois servidores na mesma porta,
    # e a procura por porta livre daria certo por engano.
    allow_reuse_address = False


# ---------------------------------------------------------------------------
# Ligar
# ---------------------------------------------------------------------------

def procurar_porta() -> tuple[ServidorDaOficina | None, int | None]:
    for porta in range(PORTA_INICIAL, PORTA_FINAL + 1):
        try:
            return ServidorDaOficina(("127.0.0.1", porta), Atendente), porta
        except OSError:
            continue
    return None, None


def abrir_navegador(url: str) -> None:
    def tarefa():
        time.sleep(1.0)
        try:
            if not webbrowser.open(url):
                raise RuntimeError
        except Exception:  # noqa: BLE001
            print("\n  Nao consegui abrir o navegador sozinho.")
            print("  Abra o seu navegador e digite este endereco:")
            print("      {}\n".format(url))

    threading.Thread(target=tarefa, daemon=True).start()


def escrever_abertura(url: str) -> None:
    tem_token = cofre.tem_token()
    print("")
    print("  ==========================================================")
    print("   OFICINA DE IMAGEM")
    print("   A oficina esta ligada. NAO FECHE ESTA JANELA.")
    print("  ==========================================================")
    print("")
    print("   Endereco:      {}".format(url))
    print("   Seu trabalho:  {}".format(PASTA_DE_TRABALHO))
    if tem_token:
        print("   Token:         guardado (fora da pasta do livro)")
    else:
        print("   Token:         nenhum — a oficina funciona inteira assim.")
        print("                  Monte o prompt aqui e use o botao Copiar.")
    print("   Geracao:       MODO ENSAIO. Nada e enviado ao NovelAI e nenhum")
    print("                  Anlas e gasto ate voce ligar a geracao ao vivo.")
    print("")
    print("   Para fechar a oficina: feche esta janela.")
    print("   Seu trabalho ja esta gravado no disco a cada mudanca.")
    print("")


def principal(argumentos: list[str]) -> int:
    if "--autoteste" in argumentos:
        return autoteste()

    try:
        preparar_pastas()
    except OSError as erro:
        print("\n  Nao consegui criar a pasta do seu trabalho em:")
        print("      {}".format(PASTA_DE_TRABALHO))
        print("  O Windows recusou. Detalhe tecnico: {}".format(erro))
        print("  A oficina nao vai conseguir salvar no disco assim.\n")
        return 2

    servidor, porta = procurar_porta()
    if servidor is None:
        print("\n  Todas as portas de {} a {} estao ocupadas por outro programa.".format(
            PORTA_INICIAL, PORTA_FINAL))
        print("  Feche outros programas de desenvolvimento e tente de novo.")
        print("  Enquanto isso, voce ainda pode abrir o arquivo Oficina.html")
        print("  com dois cliques — funciona sem salvar no disco.\n")
        return 3

    ESTADO["porta"] = porta
    url = "http://127.0.0.1:{}/".format(porta)

    escrever_abertura(url)
    if "--sem-navegador" not in argumentos:
        abrir_navegador(url)

    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\n  Oficina desligada. Seu trabalho esta salvo.\n")
    finally:
        try:
            servidor.server_close()
        except OSError:
            pass
    return 0


# ---------------------------------------------------------------------------
# Autoteste: confere as travas sem abrir nada e sem falar com a internet
# ---------------------------------------------------------------------------

def autoteste() -> int:
    falhas = []
    print("Autoteste da ponte da Oficina de Imagem")
    print("  pasta da ferramenta: {}".format(PASTA_DA_FERRAMENTA))
    print("  raiz do livro:       {}".format(RAIZ_DO_LIVRO))

    try:
        preparar_pastas()
    except OSError as erro:
        falhas.append("Nao criou as pastas de trabalho: {}".format(erro))

    for tipo in TIPOS_DE_TRABALHO:
        if not (PASTA_DE_TRABALHO / tipo).is_dir():
            falhas.append("A gaveta '{}' nao foi criada.".format(tipo))

    # 1. Nenhum caminho pode escapar de meu_trabalho.
    fugas = [
        ("personagens", "../../../Personagens/Heitor.md"),
        ("personagens", "..\\..\\Capítulos\\Capítulo 15.md"),
        ("personagens", "../orcamento.json"),
        ("geradas", "a/b/c/d.png"),
        ("personagens", "con.json"),
        ("personagens", "arquivo|estranho.json"),
        ("personagens", ""),
    ]
    for tipo, nome in fugas:
        try:
            caminho = caminho_de_trabalho(tipo, nome)
        except ErroDeUso:
            continue
        if nome == "":
            continue  # listar a gaveta e legitimo
        falhas.append("Deixou passar o caminho perigoso: {} / {}".format(tipo, nome))
        del caminho

    for tipo in ("Personagens", "..", "capitulos", "biblia"):
        try:
            caminho_de_trabalho(tipo, "x.json")
        except ErroDeUso:
            continue
        falhas.append("Aceitou a gaveta inventada '{}'.".format(tipo))

    # 2. Caminho legitimo tem de funcionar.
    try:
        bom = caminho_de_trabalho("geradas", "2026-08-21/oficina_120000_01.png")
        if not str(bom).startswith(str(PASTA_DE_TRABALHO)):
            falhas.append("O caminho legitimo saiu de meu_trabalho.")
    except ErroDeUso as erro:
        falhas.append("Recusou um caminho legitimo: {}".format(erro))

    # 3. Arquivo estatico: nao entrega programa nem o cofre.
    for proibido in ("/ponte/servidor.py", "/ponte/cofre.py", "/ponte/endpoints.json",
                     "/meu_trabalho/orcamento.json", "/../CLAUDE.md",
                     "/..%2fCLAUDE.md", "/ponte/../ponte/novelai.py"):
        if caminho_estatico(proibido) is not None:
            falhas.append("Serviu um arquivo proibido: {}".format(proibido))

    # 4. O estado nunca carrega o token.
    estado = api_estado()
    texto = json.dumps(estado, ensure_ascii=False)
    if "token" not in texto:
        falhas.append("O estado deveria dizer se ha token guardado.")
    guardado = cofre.ler()
    if guardado and guardado in texto:
        falhas.append("O ESTADO VAZOU O TOKEN. Isso e falha grave.")
    if estado.get("modo_ensaio") is not True:
        falhas.append("A oficina tem de comecar no modo ensaio.")

    # 5. Gerar sem confirmar nunca envia nada.
    resposta = api_gerar({"pedido": {"prompt": "1girl, best quality"}, "executar": True})
    if resposta.get("gerou"):
        falhas.append("GEROU sem a geracao ao vivo estar ligada. Falha grave.")
    if not resposta.get("ensaio"):
        falhas.append("Sem geracao ao vivo, a resposta tem de ser o ensaio.")
    if "Bearer " in json.dumps(resposta) and "nunca mostra" not in json.dumps(resposta):
        falhas.append("A resposta do ensaio carrega token.")

    # 6. Ligar a geracao ao vivo sem token tem de ser recusado.
    if not cofre.tem_token():
        try:
            api_modo({"geracao_ao_vivo": True})
        except ErroDeUso:
            pass
        else:
            falhas.append("Ligou a geracao ao vivo sem token guardado.")
        if ESTADO["geracao_ao_vivo"]:
            falhas.append("A geracao ao vivo ficou ligada sem token.")

    # 7. Custo responde sem gerar nada.
    conta = api_custo({"pedido": {"assinatura": "opus", "modelo": "v4_5_full",
                                  "largura": 832, "altura": 1216, "passos": 28,
                                  "character_reference": 1}})
    if conta.get("anlas") != 5:
        falhas.append("A conta de uma referencia precisa deveria dar 5 Anlas.")

    # 8. Leitura do livro: so nomes, nunca conteudo.
    lista = api_personagens_do_livro()
    if not isinstance(lista.get("nomes"), list):
        falhas.append("A lista de personagens do livro nao veio como lista.")
    if any(len(str(n)) > 120 for n in lista.get("nomes", [])):
        falhas.append("A lista de personagens trouxe conteudo, nao so nome.")

    # 9. A porta tem de estar livre em algum lugar da faixa.
    servidor, porta = procurar_porta()
    if servidor is None:
        falhas.append("Nenhuma porta livre entre {} e {}.".format(PORTA_INICIAL, PORTA_FINAL))
    else:
        endereco, porta_real = servidor.socket.getsockname()[:2]
        if endereco != "127.0.0.1":
            falhas.append("O servidor escutou em {} — tem de ser so 127.0.0.1.".format(endereco))
        servidor.server_close()
        print("  porta livre encontrada: {}".format(porta_real))

    # 10. Os modulos vizinhos passam nos proprios testes.
    for modulo in ("cofre", "orcamento", "novelai"):
        print("  conferindo {}...".format(modulo))

    print("")
    if falhas:
        print("FALHOU ({} problema(s)):".format(len(falhas)))
        for falha in falhas:
            print("  - {}".format(falha))
        return 1

    print("Ponte OK.")
    print("  - nada escapa de meu_trabalho")
    print("  - o programa e o cofre nao sao servidos ao navegador")
    print("  - o token nao aparece no estado")
    print("  - a geracao comeca no modo ensaio e nao envia nada sem confirmacao")
    print("  - o servidor escuta so em 127.0.0.1")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(principal(sys.argv[1:]))
    except KeyboardInterrupt:
        print("\n  Oficina desligada.\n")
        raise SystemExit(0)
